import { afterEach, describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const policyScript = resolve('script/verify-native-policy.mjs');
const copiedArtifacts = [
  'package.json',
  'package-lock.json',
  'capacitor.config.ts',
  '.gitignore',
  '.prettierignore',
  '.github/actions.lock.json',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  'PRIVACY.md',
  'public/privacy.html',
  'public/support.html',
  'android/.gitignore',
  'android/app/build.gradle',
  'android/build.gradle',
  'android/settings.gradle',
  'android/variables.gradle',
  'android/capacitor.settings.gradle',
  'android/app/capacitor.build.gradle',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/res/values/strings.xml',
  'android/app/src/main/res/xml/file_paths.xml',
  'android/app/src/main/res/xml/backup_rules.xml',
  'android/app/src/main/res/xml/data_extraction_rules.xml',
  'ios/.gitignore',
  'ios/App/App/Info.plist',
  'ios/App/App/AppDelegate.swift',
  'ios/App/App/PrivacyInfo.xcprivacy',
  'ios/App/App.xcodeproj/project.pbxproj',
  'android/gradle/wrapper/gradle-wrapper.properties',
  'android/gradle/wrapper/gradle-wrapper.jar',
] as const;

const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { force: true, recursive: true });
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'screenshot-shield-native-policy-'));
  fixtures.push(root);
  for (const artifact of copiedArtifacts) {
    const target = join(root, artifact);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(artifact, target);
  }
  return root;
}

function policy(root = process.cwd()) {
  return spawnSync(process.execPath, [policyScript], {
    cwd: root,
    encoding: 'utf8',
  });
}

function output(result: ReturnType<typeof policy>) {
  return `${result.stdout}${result.stderr}`;
}

describe('native phase-zero policy', () => {
  it('accepts only the pinned local shell, app identity, local-only permissions, provider, backup, scheme, privacy, ownership, and public URL baseline', () => {
    const result = policy();

    expect(output(result)).toBe('Native policy verification passed.\n');
    expect(result.status).toBe(0);
  });

  it('rejects a production server URL and Android runtime permission', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');
    const manifest = join(root, 'android/app/src/main/AndroidManifest.xml');

    writeFileSync(
      config,
      readFileSync(config, 'utf8').replace(
        "androidScheme: 'https',",
        "androidScheme: 'https',\n    url: 'https://example.test',",
      ),
    );
    writeFileSync(
      manifest,
      readFileSync(manifest, 'utf8').replace(
        '<application',
        '<uses-permission android:name="android.permission.INTERNET" />\n\n    <application',
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Capacitor server policy must contain only androidScheme and cleartext',
    );
    expect(output(result)).toContain(
      'Android manifest must not request permissions or package-visibility queries.',
    );
  });

  it('rejects a paired non-cache FileProvider path and privacy-manifest category/reason drift', () => {
    const root = fixture();
    const provider = join(root, 'android/app/src/main/res/xml/file_paths.xml');
    const privacy = join(root, 'ios/App/App/PrivacyInfo.xcprivacy');

    writeFileSync(
      provider,
      '<?xml version="1.0"?><paths><cache-path name="share" path="share/" /><files-path name="share" path="share/"></files-path></paths>',
    );
    writeFileSync(privacy, readFileSync(privacy, 'utf8').replace('CA92.1', 'C123.4'));

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Android FileProvider paths must expose exactly cache/share/.',
    );
    expect(output(result)).toContain(
      'Privacy manifest must declare exactly FileTimestamp C617.1 and UserDefaults CA92.1.',
    );
  });

  it('rejects quoted server and URL properties', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');

    writeFileSync(
      config,
      readFileSync(config, 'utf8').replace(
        "server: {\n    androidScheme: 'https',\n    cleartext: false,",
        "'server': {\n    'androidScheme': 'https',\n    cleartext: false,\n    'url': 'https://example.test',",
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Capacitor server policy must contain only androidScheme and cleartext',
    );
  });

  it('rejects computed server and URL properties', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');

    writeFileSync(
      config,
      readFileSync(config, 'utf8').replace(
        "server: {\n    androidScheme: 'https',\n    cleartext: false,",
        "['server']: {\n    ['androidScheme']: 'https',\n    cleartext: false,\n    ['url']: 'https://example.test',",
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain('capacitor.config must not contain computed property names.');
  });

  it('rejects the exported server URL when a safe decoy server block precedes it', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');
    const source = readFileSync(config, 'utf8');

    writeFileSync(
      config,
      source
        .replace('cleartext: false,', "cleartext: false,\n    url: 'https://example.test',")
        .replace(
          'const config = {',
          `const localOnlyDecoy = {
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

const config = {`,
        ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Capacitor server policy must contain only androidScheme and cleartext',
    );
  });

  it('rejects post-declaration mutation of the exported Capacitor config', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');

    writeFileSync(
      config,
      readFileSync(config, 'utf8').replace(
        'export default config;',
        "Object.defineProperty(config.server, 'url', { value: 'https://example.test' });\n\nexport default config;",
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'capacitor.config.ts must contain only type imports, one immutable config declaration, and one default export.',
    );
  });

  it('rejects side-effect imports in Capacitor configuration', () => {
    const root = fixture();
    const config = join(root, 'capacitor.config.ts');
    writeFileSync(config, `import '@capacitor/core';\n${readFileSync(config, 'utf8')}`);

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain('explicit type-only import from @capacitor/cli');
  });

  it('rejects native runtime or share fan-out before physical attestation', () => {
    const root = fixture();
    const sourceDirectory = join(root, 'src/platform');
    mkdirSync(sourceDirectory, { recursive: true });
    writeFileSync(
      join(sourceDirectory, 'nativeShareAdapter.ts'),
      "import { Share } from '@capacitor/share';\nexport const share = Share;\n",
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Phase-0 forbids Capacitor runtime/share fan-out before the physical attestation',
    );
  });

  it('rejects quoted or inline action references in an additional workflow', () => {
    const root = fixture();
    const workflow = join(root, '.github/workflows/unpinned.yml');
    writeFileSync(
      workflow,
      'name: Unpinned\njobs:\n  bypass:\n    steps:\n      - { "uses": "actions/checkout@v4" }\n',
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain('must use owner/repo@<40 lowercase hex SHA>.');
  });

  it('rejects an extra Android deep-link scheme and iOS URL scheme', () => {
    const root = fixture();
    const manifest = join(root, 'android/app/src/main/AndroidManifest.xml');
    const info = join(root, 'ios/App/App/Info.plist');

    writeFileSync(
      manifest,
      readFileSync(manifest, 'utf8').replace(
        'android:host="editor" />',
        'android:host="editor" />\n                <data android:scheme="https" android:host="example.test" />',
      ),
    );
    writeFileSync(
      info,
      readFileSync(info, 'utf8').replace(
        '<string>screenshotshield</string>',
        '<string>screenshotshield</string>\n\t\t\t\t<string>screenshotshield-dev</string>',
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Android deep-link surface must be exactly screenshotshield://editor.',
    );
    expect(output(result)).toContain(
      'iOS must declare exactly one screenshotshield URL scheme and no additional URL types.',
    );
  });

  it('rejects Android app-name and manifest-label drift', () => {
    const root = fixture();
    const strings = join(root, 'android/app/src/main/res/values/strings.xml');
    const manifest = join(root, 'android/app/src/main/AndroidManifest.xml');

    writeFileSync(
      strings,
      readFileSync(strings, 'utf8').replace(
        '<string name="app_name">Screenshot Shield</string>',
        '<string name="app_name">Screenshot Shield Preview</string>',
      ),
    );
    writeFileSync(
      manifest,
      readFileSync(manifest, 'utf8').replace(
        'android:label="@string/app_name"',
        'android:label="Screenshot Shield Preview"',
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
  });

  it('rejects Android variant suffixes and any divergent iOS build configuration identifier', () => {
    const root = fixture();
    const appGradle = join(root, 'android/app/build.gradle');
    const project = join(root, 'ios/App/App.xcodeproj/project.pbxproj');

    writeFileSync(
      appGradle,
      readFileSync(appGradle, 'utf8').replace(
        `applicationId "io.github.youngsplace.screenshotshield"`,
        `applicationId "io.github.youngsplace.screenshotshield"\n        applicationIdSuffix ".preview"`,
      ),
    );
    writeFileSync(
      project,
      readFileSync(project, 'utf8').replace(
        'PRODUCT_BUNDLE_IDENTIFIER = io.github.youngsplace.screenshotshield;',
        'PRODUCT_BUNDLE_IDENTIFIER = io.github.youngsplace.screenshotshield;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*] = io.github.youngsplace.screenshotshield.preview;',
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain('with no variant overrides');
    expect(output(result)).toContain('conditional overrides are forbidden');
  });

  it('rejects Gradle wrapper distribution URL and checksum drift', () => {
    const urlRoot = fixture();
    const checksumRoot = fixture();
    const wrapper = 'android/gradle/wrapper/gradle-wrapper.properties';
    const expectedChecksum = 'ed1a8d686605fd7c23bdf62c7fc7add1c5b23b2bbc3721e661934ef4a4911d7c';

    writeFileSync(
      join(urlRoot, wrapper),
      readFileSync(join(urlRoot, wrapper), 'utf8').replace(
        'gradle-8.14.3-all.zip',
        'gradle-8.14.2-all.zip',
      ),
    );
    writeFileSync(
      join(checksumRoot, wrapper),
      readFileSync(join(checksumRoot, wrapper), 'utf8').replace(expectedChecksum, '0'.repeat(64)),
    );

    expect(policy(urlRoot).status).toBe(1);
    expect(policy(checksumRoot).status).toBe(1);
  });

  it('rejects Google Services configuration and version-catalog aliases', () => {
    const root = fixture();
    const googleServices = join(root, 'android/app/google-services.json');

    writeFileSync(googleServices, '{}\n');
    writeFileSync(
      join(root, 'android/gradle/libs.versions.toml'),
      '[plugins]\ngoogle-services = { id = "com.google.gms.google-services", version = "4.4.4" }\n',
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Android build inputs must not include Google Services, Firebase, Play Services, Crashlytics, or variant configuration.',
    );
  });

  it('rejects an extra reordered privacy-category dictionary', () => {
    const root = fixture();
    const privacy = join(root, 'ios/App/App/PrivacyInfo.xcprivacy');

    writeFileSync(
      privacy,
      readFileSync(privacy, 'utf8').replace(
        '\t</array>\n</dict>\n</plist>\n',
        `\t\t<dict>
\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key>
\t\t\t<array>
\t\t\t\t<string>C123.4</string>
\t\t\t</array>
\t\t\t<key>NSPrivacyAccessedAPIType</key>
\t\t\t<string>NSPrivacyAccessedAPICategoryDiskSpace</string>
\t\t</dict>
\t</array>
</dict>
</plist>
`,
      ),
    );

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'Privacy manifest must declare exactly FileTimestamp C617.1 and UserDefaults CA92.1.',
    );
  });

  it('rejects Capacitor version and script drift', () => {
    const root = fixture();
    const packagePath = join(root, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    packageJson.dependencies['@capacitor/core'] = '^8.4.1';
    packageJson.scripts['cap:sync'] = 'npx cap sync';
    writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

    const result = policy(root);
    expect(result.status).toBe(1);
    expect(output(result)).toContain(
      'package.json must pin @capacitor/core exactly to 8.4.1; found ^8.4.1.',
    );
    expect(output(result)).toContain(
      'package.json script cap:sync must be npm run native:preflight && ./node_modules/.bin/capacitor sync.',
    );
  });
});
