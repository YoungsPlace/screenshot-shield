import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { parseDocument } from 'yaml';

export const APP_ID = 'io.github.youngsplace.screenshotshield';
export const APP_NAME = 'Screenshot Shield';
export const CUSTOM_SCHEME = 'screenshotshield';

const GRADLE_URL = 'https\\://services.gradle.org/distributions/gradle-8.14.3-all.zip';
const GRADLE_SHA = 'ed1a8d686605fd7c23bdf62c7fc7add1c5b23b2bbc3721e661934ef4a4911d7c';
const CAPACITOR_PINS = {
  '@capacitor/app': '8.1.0',
  '@capacitor/browser': '8.0.3',
  '@capacitor/core': '8.4.1',
  '@capacitor/filesystem': '8.1.2',
  '@capacitor/preferences': '8.0.1',
  '@capacitor/share': '8.0.1',
  '@capacitor/android': '8.4.1',
  '@capacitor/cli': '8.4.1',
  '@capacitor/ios': '8.4.1',
};
const EXPECTED_SCRIPTS = {
  'build:native': 'VITE_BASE_PATH=./ npm run build',
  'cap:sync': './node_modules/.bin/capacitor sync',
  'native:policy': 'node script/verify-native-policy.mjs',
  'native:preflight': 'node script/native-preflight.mjs',
};
const FORBIDDEN_IOS_KEYS = [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSLocalNetworkUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSContactsUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSLocationAlwaysUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
  'NSUserTrackingUsageDescription',
  'UIFileSharingEnabled',
  'LSSupportsOpeningDocumentsInPlace',
];
const PUBLIC_URLS = ['privacy', 'support'].flatMap((page) =>
  ['ko', 'en', 'zh-CN'].map(
    (locale) => `https://youngsplace.github.io/screenshot-shield/${page}.html?lang=${locale}`,
  ),
);

function readRequired(root, path, errors) {
  const fullPath = resolve(root, path);
  if (!existsSync(fullPath)) {
    errors.push(`Missing required policy artifact: ${path}`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function parseJson(path, source, errors) {
  try {
    return JSON.parse(source);
  } catch {
    errors.push(`${path} must be valid JSON.`);
    return null;
  }
}

function expect(condition, message, errors) {
  if (!condition) errors.push(message);
}

function sameStrings(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function stringRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isSatisfiesExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function staticPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function parseTsValue(expression, location, errors) {
  const value = unwrapExpression(expression);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text;
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (!ts.isObjectLiteralExpression(value)) {
    errors.push(`${location} must be a static string, boolean, or plain object literal.`);
    return undefined;
  }

  const result = {};
  for (const property of value.properties) {
    if (!ts.isPropertyAssignment(property)) {
      errors.push(
        `${location} must not contain spread, shorthand, accessor, or method properties.`,
      );
      continue;
    }
    const name = staticPropertyName(property.name);
    if (!name || ts.isComputedPropertyName(property.name)) {
      errors.push(`${location} must not contain computed property names.`);
      continue;
    }
    if (Object.hasOwn(result, name)) {
      errors.push(`${location} must not contain duplicate property ${name}.`);
      continue;
    }
    result[name] = parseTsValue(property.initializer, `${location}.${name}`, errors);
  }
  return result;
}

function parseCapacitorConfig(source, errors) {
  const sourceFile = ts.createSourceFile(
    'capacitor.config.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  for (const diagnostic of sourceFile.parseDiagnostics) {
    errors.push(
      `capacitor.config.ts has a parse error at offset ${diagnostic.start ?? 0}: ${ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        ' ',
      )}.`,
    );
  }

  let initializer;
  let declarationCount = 0;
  let defaultExportCount = 0;
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) continue;

    if (ts.isVariableStatement(statement)) {
      const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
      if (!isConst || statement.declarationList.declarations.length !== 1) {
        errors.push('capacitor.config.ts may contain only one immutable config declaration.');
        continue;
      }
      const [declaration] = statement.declarationList.declarations;
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'config') {
        errors.push('capacitor.config.ts must not execute or declare values other than config.');
        continue;
      }
      declarationCount += 1;
      initializer = declaration.initializer;
      if (!initializer || !ts.isSatisfiesExpression(initializer)) {
        errors.push(
          'capacitor.config.ts config must be a static object satisfying CapacitorConfig.',
        );
      }
      continue;
    }

    if (
      ts.isExportAssignment(statement) &&
      !statement.isExportEquals &&
      ts.isIdentifier(statement.expression) &&
      statement.expression.text === 'config'
    ) {
      defaultExportCount += 1;
      continue;
    }

    errors.push(
      'capacitor.config.ts must contain only type imports, one immutable config declaration, and one default export.',
    );
  }

  expect(
    declarationCount === 1 && Boolean(initializer),
    'capacitor.config.ts must declare exactly one static config object.',
    errors,
  );
  expect(
    defaultExportCount === 1,
    'capacitor.config.ts must default-export config exactly once.',
    errors,
  );
  return initializer ? parseTsValue(initializer, 'capacitor.config', errors) : null;
}

function parseXml(path, source, errors) {
  try {
    const document = new JSDOM(source, { contentType: 'text/xml' }).window.document;
    if (!document.documentElement || document.documentElement.localName === 'parsererror') {
      errors.push(`${path} must be well-formed XML.`);
      return null;
    }
    return document;
  } catch {
    errors.push(`${path} must be well-formed XML.`);
    return null;
  }
}

function directElements(node, name) {
  return Array.from(node.children).filter((child) => !name || child.localName === name);
}

function allElements(node, name) {
  return Array.from(node.getElementsByTagName(name));
}

function exactAttributes(element, expected) {
  const actualNames = element.getAttributeNames().sort();
  const expectedNames = Object.keys(expected).sort();
  return (
    sameStrings(actualNames, expectedNames) &&
    expectedNames.every((name) => element.getAttribute(name) === expected[name])
  );
}

function plistValue(element, path, errors) {
  switch (element.localName) {
    case 'string':
      return element.textContent ?? '';
    case 'true':
      return true;
    case 'false':
      return false;
    case 'array':
      return directElements(element).map((child, index) =>
        plistValue(child, `${path}[${index}]`, errors),
      );
    case 'dict': {
      const children = directElements(element);
      const result = {};
      if (children.length % 2 !== 0) errors.push(`${path} must contain key/value pairs.`);
      for (let index = 0; index + 1 < children.length; index += 2) {
        const keyElement = children[index];
        const valueElement = children[index + 1];
        if (keyElement.localName !== 'key') {
          errors.push(`${path} entry ${index / 2} must start with a key.`);
          continue;
        }
        const key = keyElement.textContent ?? '';
        if (!key || Object.hasOwn(result, key)) {
          errors.push(`${path} must not contain empty or duplicate key ${key || '<empty>'}.`);
          continue;
        }
        result[key] = plistValue(valueElement, `${path}.${key}`, errors);
      }
      return result;
    }
    default:
      errors.push(`${path} contains unsupported plist element ${element.localName}.`);
      return undefined;
  }
}

function parsePlist(path, source, errors) {
  const document = parseXml(path, source, errors);
  if (!document) return null;
  const root = document.documentElement;
  const children = directElements(root);
  if (root.localName !== 'plist' || children.length !== 1 || children[0].localName !== 'dict') {
    errors.push(`${path} must contain exactly one root plist dictionary.`);
    return null;
  }
  return plistValue(children[0], path, errors);
}

function verifyCapacitorPins(packageJson, lockJson, errors) {
  for (const [name, version] of Object.entries(CAPACITOR_PINS)) {
    const declared = packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name];
    expect(
      declared === version,
      `package.json must pin ${name} exactly to ${version}; found ${declared ?? 'missing'}.`,
      errors,
    );
    const locked =
      lockJson.packages?.['']?.dependencies?.[name] ??
      lockJson.packages?.['']?.devDependencies?.[name];
    expect(
      locked === version,
      `package-lock.json root package must pin ${name} exactly to ${version}; found ${locked ?? 'missing'}.`,
      errors,
    );
    expect(
      lockJson.packages?.[`node_modules/${name}`]?.version === version,
      `package-lock.json must resolve ${name} exactly to ${version}.`,
      errors,
    );
  }
}

function verifyCapacitorConfig(source, errors) {
  const config = stringRecord(parseCapacitorConfig(source, errors));
  if (!config) return;
  expect(
    sameStrings(Object.keys(config).sort(), ['appId', 'appName', 'server', 'webDir']),
    'Capacitor config must contain only appId, appName, webDir, and server.',
    errors,
  );
  expect(config.appId === APP_ID, `Capacitor appId must be ${APP_ID}.`, errors);
  expect(config.appName === APP_NAME, `Capacitor appName must be ${APP_NAME}.`, errors);
  expect(config.webDir === 'dist', 'Capacitor webDir must be dist.', errors);
  const server = stringRecord(config.server);
  expect(Boolean(server), 'Capacitor server policy must be a static object.', errors);
  if (!server) return;
  expect(
    sameStrings(Object.keys(server).sort(), ['androidScheme', 'cleartext']),
    'Capacitor server policy must contain only androidScheme and cleartext; server.url and allowNavigation are forbidden.',
    errors,
  );
  expect(
    server.androidScheme === 'https',
    'Capacitor Android scheme must remain local HTTPS.',
    errors,
  );
  expect(server.cleartext === false, 'Capacitor cleartext must remain false.', errors);
}

function filesUnder(directory, excludedNames = new Set()) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedNames.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path, excludedNames) : [path];
  });
}

function verifyAndroid(root, errors) {
  const manifestSource = readRequired(root, 'android/app/src/main/AndroidManifest.xml', errors);
  const stringsSource = readRequired(root, 'android/app/src/main/res/values/strings.xml', errors);
  const filePathsSource = readRequired(root, 'android/app/src/main/res/xml/file_paths.xml', errors);
  const backupSource = readRequired(root, 'android/app/src/main/res/xml/backup_rules.xml', errors);
  const extractionSource = readRequired(
    root,
    'android/app/src/main/res/xml/data_extraction_rules.xml',
    errors,
  );
  const appGradle = readRequired(root, 'android/app/build.gradle', errors);
  const rootGradle = readRequired(root, 'android/build.gradle', errors);
  const settingsGradle = readRequired(root, 'android/settings.gradle', errors);
  const variablesGradle = readRequired(root, 'android/variables.gradle', errors);
  const capacitorSettingsGradle = readRequired(root, 'android/capacitor.settings.gradle', errors);
  const capacitorAppGradle = readRequired(root, 'android/app/capacitor.build.gradle', errors);
  const wrapper = readRequired(root, 'android/gradle/wrapper/gradle-wrapper.properties', errors);
  const manifest = parseXml('AndroidManifest.xml', manifestSource, errors);
  const strings = parseXml('strings.xml', stringsSource, errors);
  const filePaths = parseXml('file_paths.xml', filePathsSource, errors);
  const backup = parseXml('backup_rules.xml', backupSource, errors);
  const extraction = parseXml('data_extraction_rules.xml', extractionSource, errors);

  if (manifest) {
    const rootElement = manifest.documentElement;
    expect(rootElement.localName === 'manifest', 'Android manifest root must be manifest.', errors);
    expect(
      directElements(rootElement).every(
        (element) =>
          !element.localName.startsWith('uses-permission') && element.localName !== 'queries',
      ),
      'Android manifest must not request permissions or package-visibility queries.',
      errors,
    );
    const applications = directElements(rootElement, 'application');
    expect(
      applications.length === 1,
      'Android manifest must contain exactly one application.',
      errors,
    );
    const application = applications[0];
    if (application) {
      expect(
        application.getAttribute('android:label') === '@string/app_name' &&
          application.getAttribute('android:allowBackup') === 'true' &&
          application.getAttribute('android:fullBackupContent') === '@xml/backup_rules' &&
          application.getAttribute('android:dataExtractionRules') === '@xml/data_extraction_rules',
        'Android application must bind the exact app name and locale-only backup policies.',
        errors,
      );
      const viewFilters = allElements(application, 'intent-filter').filter((filter) =>
        directElements(filter, 'action').some(
          (action) => action.getAttribute('android:name') === 'android.intent.action.VIEW',
        ),
      );
      expect(
        viewFilters.length === 1,
        'Android must declare exactly one VIEW intent filter.',
        errors,
      );
      const filter = viewFilters[0];
      if (filter) {
        const actions = directElements(filter, 'action').map((item) =>
          item.getAttribute('android:name'),
        );
        const categories = directElements(filter, 'category')
          .map((item) => item.getAttribute('android:name'))
          .sort();
        const data = directElements(filter, 'data');
        expect(
          sameStrings(actions, ['android.intent.action.VIEW']) &&
            sameStrings(categories, [
              'android.intent.category.BROWSABLE',
              'android.intent.category.DEFAULT',
            ]) &&
            data.length === 1 &&
            exactAttributes(data[0], {
              'android:host': 'editor',
              'android:scheme': CUSTOM_SCHEME,
            }),
          `Android deep-link surface must be exactly ${CUSTOM_SCHEME}://editor.`,
          errors,
        );
      }
      const providers = directElements(application, 'provider');
      expect(providers.length === 1, 'Android must declare exactly one FileProvider.', errors);
      const provider = providers[0];
      if (provider) {
        expect(
          provider.getAttribute('android:name') === 'androidx.core.content.FileProvider' &&
            provider.getAttribute('android:authorities') === '${applicationId}.fileprovider' &&
            provider.getAttribute('android:exported') === 'false' &&
            provider.getAttribute('android:grantUriPermissions') === 'true',
          'Android FileProvider must be non-exported, grant-only, and application-scoped.',
          errors,
        );
        const metadata = directElements(provider, 'meta-data');
        expect(
          metadata.length === 1 &&
            metadata[0].getAttribute('android:name') === 'android.support.FILE_PROVIDER_PATHS' &&
            metadata[0].getAttribute('android:resource') === '@xml/file_paths',
          'Android FileProvider must use only @xml/file_paths.',
          errors,
        );
      }
    }
  }

  if (strings) {
    const entries = directElements(strings.documentElement, 'string');
    const values = new Map();
    for (const entry of entries) {
      const name = entry.getAttribute('name');
      if (!name || values.has(name))
        errors.push('Android strings must have unique nonempty names.');
      else values.set(name, entry.textContent ?? '');
    }
    expect(values.get('app_name') === APP_NAME, `Android app_name must be ${APP_NAME}.`, errors);
    expect(
      values.get('title_activity_main') === APP_NAME,
      `Android title_activity_main must be ${APP_NAME}.`,
      errors,
    );
    expect(
      values.get('package_name') === APP_ID,
      `Android package_name must be ${APP_ID}.`,
      errors,
    );
    expect(
      values.get('custom_url_scheme') === CUSTOM_SCHEME,
      `Android custom_url_scheme must be ${CUSTOM_SCHEME}.`,
      errors,
    );
  }

  if (filePaths) {
    const children = directElements(filePaths.documentElement);
    expect(
      filePaths.documentElement.localName === 'paths' &&
        children.length === 1 &&
        children[0].localName === 'cache-path' &&
        exactAttributes(children[0], { name: 'share', path: 'share/' }),
      'Android FileProvider paths must expose exactly cache/share/.',
      errors,
    );
  }

  if (backup) {
    const children = directElements(backup.documentElement);
    expect(
      backup.documentElement.localName === 'full-backup-content' &&
        children.length === 1 &&
        children[0].localName === 'include' &&
        exactAttributes(children[0], { domain: 'sharedpref', path: 'CapacitorStorage.xml' }),
      'Android backup_rules.xml must include only sharedpref/CapacitorStorage.xml.',
      errors,
    );
  }

  if (extraction) {
    const sections = directElements(extraction.documentElement);
    expect(
      extraction.documentElement.localName === 'data-extraction-rules' &&
        sameStrings(
          sections.map((section) => section.localName),
          ['cloud-backup', 'device-transfer'],
        ) &&
        sections.every((section) => {
          const children = directElements(section);
          return (
            children.length === 1 &&
            children[0].localName === 'include' &&
            exactAttributes(children[0], {
              domain: 'sharedpref',
              path: 'CapacitorStorage.xml',
            })
          );
        }),
      'Android data extraction must include only CapacitorStorage.xml for cloud and device transfer.',
      errors,
    );
  }

  const namespaceValues = Array.from(
    appGradle.matchAll(/\bnamespace\s*=\s*['"]([^'"]+)['"]/g),
    (match) => match[1],
  );
  const applicationIdValues = Array.from(
    appGradle.matchAll(/\bapplicationId\s+['"]([^'"]+)['"]/g),
    (match) => match[1],
  );
  expect(
    sameStrings(namespaceValues, [APP_ID]) &&
      sameStrings(applicationIdValues, [APP_ID]) &&
      !/\b(?:applicationIdSuffix|productFlavors|flavorDimensions)\b/.test(appGradle),
    `Android must resolve exactly one namespace and applicationId to ${APP_ID} with no variant suffixes.`,
    errors,
  );

  const androidPolicyFiles = filesUnder(resolve(root, 'android'), new Set(['.gradle', 'build']));
  const gradleSources = androidPolicyFiles
    .filter((path) => /\.(?:gradle|gradle\.kts)$/.test(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  const googleConfigFiles = androidPolicyFiles.filter(
    (path) => path.endsWith('/google-services.json') || path.endsWith('\\google-services.json'),
  );
  expect(
    !/com\.google\.gms:google-services|com\.google\.gms\.google-services|google-services\.json/.test(
      [
        rootGradle,
        appGradle,
        settingsGradle,
        variablesGradle,
        capacitorSettingsGradle,
        capacitorAppGradle,
        gradleSources,
      ].join('\n'),
    ) && googleConfigFiles.length === 0,
    'Android build must not include Google Services tooling or configuration.',
    errors,
  );
  const wrapperValues = new Map(
    wrapper
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
  expect(
    wrapperValues.get('distributionUrl') === GRADLE_URL &&
      wrapperValues.get('distributionSha256Sum') === GRADLE_SHA,
    'Gradle wrapper URL and SHA-256 must match the reviewed 8.14.3 distribution.',
    errors,
  );
}

function verifyIos(root, errors) {
  const infoSource = readRequired(root, 'ios/App/App/Info.plist', errors);
  const privacySource = readRequired(root, 'ios/App/App/PrivacyInfo.xcprivacy', errors);
  const project = readRequired(root, 'ios/App/App.xcodeproj/project.pbxproj', errors);
  const appDelegate = readRequired(root, 'ios/App/App/AppDelegate.swift', errors);
  const info = stringRecord(parsePlist('Info.plist', infoSource, errors));
  const privacy = stringRecord(parsePlist('PrivacyInfo.xcprivacy', privacySource, errors));

  if (info) {
    expect(
      info.CFBundleDisplayName === APP_NAME,
      `iOS CFBundleDisplayName must be ${APP_NAME}.`,
      errors,
    );
    const urlTypes = info.CFBundleURLTypes;
    const urlType =
      Array.isArray(urlTypes) && urlTypes.length === 1 ? stringRecord(urlTypes[0]) : null;
    expect(
      Boolean(urlType) &&
        sameStrings(Object.keys(urlType).sort(), ['CFBundleURLSchemes']) &&
        sameStrings(urlType.CFBundleURLSchemes, [CUSTOM_SCHEME]),
      `iOS must declare exactly one ${CUSTOM_SCHEME} URL scheme and no additional URL types.`,
      errors,
    );
    for (const key of FORBIDDEN_IOS_KEYS) {
      expect(!Object.hasOwn(info, key), `iOS Info.plist must not declare ${key}.`, errors);
    }
  }

  const projectBundleIds = Array.from(
    project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);/g),
    (match) => match[1].trim(),
  );
  const xcconfigBundleIds = filesUnder(resolve(root, 'ios'))
    .filter((path) => path.endsWith('.xcconfig'))
    .flatMap((path) =>
      Array.from(
        readFileSync(path, 'utf8').matchAll(/^\s*PRODUCT_BUNDLE_IDENTIFIER\s*=\s*(\S+)\s*$/gm),
        (match) => match[1],
      ),
    );
  expect(
    projectBundleIds.length >= 2 &&
      projectBundleIds.every((identifier) => identifier === APP_ID) &&
      xcconfigBundleIds.every((identifier) => identifier === APP_ID),
    `Every iOS project and xcconfig bundle identifier must be exactly ${APP_ID}.`,
    errors,
  );
  expect(
    (project.match(/path = PrivacyInfo\.xcprivacy;/g) ?? []).length === 1 &&
      (project.match(/PrivacyInfo\.xcprivacy in Resources/g) ?? []).length === 2,
    'iOS project must include PrivacyInfo.xcprivacy exactly once in App resources.',
    errors,
  );
  expect(
    /ApplicationDelegateProxy\.shared\.application\(app, open: url, options: options\)/.test(
      appDelegate,
    ) &&
      /ApplicationDelegateProxy\.shared\.application\(application, continue: userActivity, restorationHandler: restorationHandler\)/.test(
        appDelegate,
      ),
    'iOS AppDelegate must forward URL and user-activity events directly through Capacitor.',
    errors,
  );
  expect(
    !/\b(?:print|debugPrint|NSLog|os_log)\s*\(/.test(appDelegate),
    'iOS AppDelegate must not log deep-link data.',
    errors,
  );

  if (privacy) {
    expect(
      sameStrings(Object.keys(privacy).sort(), [
        'NSPrivacyAccessedAPITypes',
        'NSPrivacyCollectedDataTypes',
        'NSPrivacyTracking',
        'NSPrivacyTrackingDomains',
      ]),
      'Privacy manifest must contain only the approved four top-level declarations.',
      errors,
    );
    expect(
      privacy.NSPrivacyTracking === false,
      'Privacy manifest must set tracking false.',
      errors,
    );
    expect(
      sameStrings(privacy.NSPrivacyTrackingDomains, []),
      'Privacy manifest tracking domains must be empty.',
      errors,
    );
    expect(
      sameStrings(privacy.NSPrivacyCollectedDataTypes, []),
      'Privacy manifest collected data types must be empty.',
      errors,
    );
    const entries = Array.isArray(privacy.NSPrivacyAccessedAPITypes)
      ? privacy.NSPrivacyAccessedAPITypes.map(stringRecord)
      : [];
    const normalized = entries
      .filter(Boolean)
      .map((entry) => ({
        category: entry.NSPrivacyAccessedAPIType,
        keys: Object.keys(entry).sort(),
        reasons: entry.NSPrivacyAccessedAPITypeReasons,
      }))
      .sort((first, second) => String(first.category).localeCompare(String(second.category)));
    expect(
      normalized.length === 2 &&
        normalized.every((entry) =>
          sameStrings(entry.keys, ['NSPrivacyAccessedAPIType', 'NSPrivacyAccessedAPITypeReasons']),
        ) &&
        normalized[0]?.category === 'NSPrivacyAccessedAPICategoryFileTimestamp' &&
        sameStrings(normalized[0]?.reasons, ['C617.1']) &&
        normalized[1]?.category === 'NSPrivacyAccessedAPICategoryUserDefaults' &&
        sameStrings(normalized[1]?.reasons, ['CA92.1']),
      'Privacy manifest must declare exactly FileTimestamp C617.1 and UserDefaults CA92.1.',
      errors,
    );
  }
}

function verifyOwnershipIgnores(root, errors) {
  const requiredLines = {
    '.gitignore': [
      'android/keystore.properties',
      'android/*.jks',
      'android/*.keystore',
      'ios/release.xcconfig',
      'ios/*.mobileprovision',
      'ios/*.p12',
    ],
    '.prettierignore': [
      'android/app/src/main/assets/',
      'ios/App/App/public/',
      'ios/App/App/capacitor.config.json',
      'ios/App/App/Assets.xcassets/',
    ],
    'android/.gitignore': [
      '.gradle/',
      'build/',
      'local.properties',
      'capacitor-cordova-android-plugins',
      'app/src/main/assets/public',
      'app/src/main/assets/capacitor.config.json',
      'app/src/main/assets/capacitor.plugins.json',
      'app/src/main/res/xml/config.xml',
    ],
    'ios/.gitignore': [
      'App/build',
      'App/Pods',
      'App/output',
      'App/App/public',
      'DerivedData',
      'xcuserdata',
      'capacitor-cordova-ios-plugins',
      'App/App/capacitor.config.json',
      'App/App/config.xml',
    ],
  };
  for (const [path, expected] of Object.entries(requiredLines)) {
    const lines = new Set(
      readRequired(root, path, errors)
        .split(/\r?\n/)
        .map((line) => line.trim()),
    );
    for (const line of expected) {
      expect(lines.has(line), `${path} must ignore generator-owned artifact ${line}.`, errors);
    }
  }
}

function verifyPublicUrls(root, errors) {
  const privacyPage = readRequired(root, 'public/privacy.html', errors);
  const supportPage = readRequired(root, 'public/support.html', errors);
  const privacyDocument = readRequired(root, 'PRIVACY.md', errors);
  for (const rawUrl of PUBLIC_URLS) {
    const url = new URL(rawUrl);
    const page = url.pathname.endsWith('/privacy.html') ? 'privacy' : 'support';
    const locale = url.searchParams.get('lang');
    const document = page === 'privacy' ? privacyPage : supportPage;
    expect(
      document.includes(`${page}.html?lang=${locale}`),
      `public/${page}.html must retain ${locale}.`,
      errors,
    );
    if (page === 'privacy') {
      expect(privacyDocument.includes(rawUrl), `PRIVACY.md must publish ${rawUrl}.`, errors);
    }
  }
}

function workflowFiles(root, errors) {
  const directory = resolve(root, '.github/workflows');
  if (!existsSync(directory)) {
    errors.push('GitHub workflow directory is missing.');
    return [];
  }

  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) files.push(path);
    }
  }
  walk(directory);
  return files;
}

function collectWorkflowUses(value, path, entries, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectWorkflowUses(item, `${path}[${index}]`, entries, errors));
    return;
  }
  if (!stringRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key === 'uses') {
      if (typeof child !== 'string') {
        errors.push(`${childPath} must be a string action reference.`);
      } else {
        entries.push({ value: child, path: childPath });
      }
    }
    collectWorkflowUses(child, childPath, entries, errors);
  }
}

function verifyActionPins(root, errors) {
  const lockSource = readRequired(root, '.github/actions.lock.json', errors);
  const lock = parseJson('.github/actions.lock.json', lockSource, errors);
  const actions = stringRecord(lock?.actions);
  expect(
    lock?.schemaVersion === 1 && Boolean(actions),
    'Action lock must use schemaVersion 1.',
    errors,
  );
  if (!actions) return;

  const entries = [];
  for (const path of workflowFiles(root, errors)) {
    const source = readFileSync(path, 'utf8');
    const document = parseDocument(source, { uniqueKeys: true, strict: true });
    if (document.errors.length > 0) {
      for (const error of document.errors) {
        errors.push(`${path} must be valid unambiguous YAML: ${error.message}`);
      }
      continue;
    }
    collectWorkflowUses(document.toJS({ maxAliasCount: 0 }), path, entries, errors);
  }

  const seen = new Set();
  for (const entry of entries) {
    const match = /^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@([0-9a-f]{40})$/.exec(entry.value);
    if (!match) {
      errors.push(`${entry.path} must use owner/repo@<40 lowercase hex SHA>.`);
      continue;
    }
    const [, action, sha] = match;
    const candidates = Object.keys(actions).filter((key) => key.startsWith(`${action}@`));
    if (candidates.length !== 1) {
      errors.push(
        `${entry.path} must resolve to exactly one versioned action-lock entry for ${action}.`,
      );
      continue;
    }
    const [key] = candidates;
    seen.add(key);
    expect(actions[key] === sha, `Action lock mismatch for ${key}.`, errors);
  }

  expect(
    sameStrings([...seen].sort(), Object.keys(actions).sort()),
    'Action lock and every workflow action set must match exactly.',
    errors,
  );
  for (const [key, sha] of Object.entries(actions)) {
    expect(
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@v\d+(?:[A-Za-z0-9_.-]*)$/.test(key) &&
        /^[0-9a-f]{40}$/.test(sha),
      `Invalid action lock entry ${key}.`,
      errors,
    );
  }
}

export function verifyNativePolicy(root = process.cwd()) {
  const errors = [];
  const packageSource = readRequired(root, 'package.json', errors);
  const lockSource = readRequired(root, 'package-lock.json', errors);
  const packageJson = packageSource ? parseJson('package.json', packageSource, errors) : null;
  const lockJson = lockSource ? parseJson('package-lock.json', lockSource, errors) : null;
  if (packageJson && lockJson) {
    verifyCapacitorPins(packageJson, lockJson, errors);
    for (const [name, command] of Object.entries(EXPECTED_SCRIPTS)) {
      expect(
        packageJson.scripts?.[name] === command,
        `package.json script ${name} must be ${command}.`,
        errors,
      );
    }
  }
  verifyCapacitorConfig(readRequired(root, 'capacitor.config.ts', errors), errors);
  verifyAndroid(root, errors);
  verifyIos(root, errors);
  verifyOwnershipIgnores(root, errors);
  verifyPublicUrls(root, errors);
  verifyActionPins(root, errors);
  return errors;
}

function main() {
  const errors = verifyNativePolicy();
  if (errors.length > 0) {
    console.error('Native policy verification failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Native policy verification passed.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
