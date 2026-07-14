import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifyNativePolicy } from './verify-native-policy.mjs';

const REQUIRED_LOCKS = [
  'package-lock.json',
  'ios/App/Package.resolved',
  'android/gradle/wrapper/gradle-wrapper.properties',
  'android/gradle/wrapper/gradle-wrapper.jar',
];

const NATIVE_LOCK_PATH = 'toolchains/native.lock.json';
const PHYSICAL_GATE_PATH = 'toolchains/native-physical-gate.json';
const ACTION_LOCK_PATH = '.github/actions.lock.json';
const SHA256 = /^[a-f0-9]{64}$/;
const ACTION_SHA = /^[a-f0-9]{40}$/;
const NONDETERMINISTIC_FACT = /\b(?:latest|current|stable|as available)\b/i;
const NATIVE_BASE_PLAN = {
  path: '.gjc/_session-019f6021-2baf-7000-bad1-ba365803c392/plans/ralplan/019f6021-2baf-7000-bad1-ba365803c392/stage-05-revision.md',
  sha256: '905b96f9212fa0d854a87718c9a918bf4b58ecc4bea3d6b70c90ce7166b73cbc',
};
const NATIVE_CLOSURE_PLAN = {
  path: '.gjc/_session-019f6096-6749-7000-a3f0-0fa4e4b6270d/plans/ralplan/019f6096-6749-7000-a3f0-0fa4e4b6270d/stage-04-revision.md',
  sha256: 'e8290ca60357ddc234a8c6aa37b1c6d99c2c969041a57bae571b8adfa63f50d5',
};
const PHYSICAL_OUTCOMES = [
  'coldLinkNonReemission',
  'sameVolumeAtomicNoDuplicateRename',
  'trustworthyTimestamps',
  'mkdirNotFoundBehavior',
  'completeKillMatrix',
  'pickerViability',
  'capacitorStorageXmlSoleKey',
  'mergedManifestNoForbiddenPermissions',
  'resolvedApplicationIdentifiers',
];

function report(failures, category, message) {
  failures.push(`${category}: ${message}`);
}

function command(commandName, argumentsList, cwd) {
  const result = spawnSync(commandName, argumentsList, { cwd, encoding: 'utf8' });
  const rawOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return {
    ok: !result.error && result.status === 0,
    output: rawOutput.replace(/\s+/g, ' ').slice(0, 240),
    rawOutput,
  };
}

function checkCommand(name, commandName, argumentsList, help, root, failures) {
  const result = command(commandName, argumentsList, root);
  if (!result.ok) {
    report(
      failures,
      'Toolchain',
      `${name} is unavailable or failed (${result.output || 'command not found'}). ${help}`,
    );
  }
  return result;
}

function checkCommittedLock(root, path, failures) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    report(
      failures,
      'Toolchain',
      `Required committed lock artifact is missing: ${path}. Restore the reviewed artifact; do not regenerate it during preflight.`,
    );
    return false;
  }

  const tracked = command('git', ['ls-files', '--error-unmatch', '--', path], root);
  if (!tracked.ok) {
    report(
      failures,
      'Toolchain',
      `Required lock artifact is not tracked by Git: ${path}. Add the reviewed artifact before native work.`,
    );
    return false;
  }
  return true;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function requireExactObject(value, keys, label, failures, category) {
  if (!isPlainObject(value)) {
    report(failures, category, `${label} must be an object with exactly: ${keys.join(', ')}.`);
    return false;
  }

  const expected = new Set(keys);
  const actual = Object.keys(value);
  const missing = keys.filter((key) => !Object.hasOwn(value, key));
  const unexpected = actual.filter((key) => !expected.has(key));
  if (missing.length > 0)
    report(failures, category, `${label} is missing required fields: ${missing.join(', ')}.`);
  if (unexpected.length > 0)
    report(failures, category, `${label} has unexpected fields: ${unexpected.join(', ')}.`);
  return missing.length === 0 && unexpected.length === 0;
}

function requireNonemptyString(value, label, failures, category) {
  if (typeof value !== 'string' || value.trim() === '') {
    report(failures, category, `${label} must be a nonempty string.`);
    return false;
  }
  return true;
}

function requireFixedFact(value, label, failures, category) {
  if (!requireNonemptyString(value, label, failures, category)) return false;
  if (NONDETERMINISTIC_FACT.test(value) || /[*^~<>|]/.test(value)) {
    report(
      failures,
      category,
      `${label} must be an exact immutable fact, not ${JSON.stringify(value)}.`,
    );
    return false;
  }
  return true;
}

function requireSha256(value, label, failures, category) {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    report(failures, category, `${label} must be a lowercase 64-character SHA-256.`);
    return false;
  }
  return true;
}

function requireTimestamp(value, label, failures, category) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    report(failures, category, `${label} must be an ISO-8601 UTC timestamp.`);
    return false;
  }
  return true;
}

function requireDistribution(value, label, failures, category) {
  let valid = requireExactObject(value, ['url', 'sha256'], label, failures, category);
  valid = requireFixedFact(value?.url, `${label}.url`, failures, category) && valid;
  valid = requireSha256(value?.sha256, `${label}.sha256`, failures, category) && valid;
  if (typeof value?.url === 'string') {
    try {
      const url = new URL(value.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
        report(failures, category, `${label}.url must be an immutable HTTPS artifact URL.`);
        valid = false;
      }
    } catch {
      report(failures, category, `${label}.url must be a valid immutable HTTPS artifact URL.`);
      valid = false;
    }
  }
  return valid;
}

function scanJsonWithoutDuplicateKeys(source) {
  let cursor = 0;

  function fail(message) {
    throw new Error(`${message} at byte ${cursor}.`);
  }

  function whitespace() {
    while (/\s/.test(source[cursor] ?? '')) cursor += 1;
  }

  function string() {
    if (source[cursor] !== '"') fail('Expected JSON string');
    const start = cursor;
    cursor += 1;
    while (cursor < source.length) {
      const code = source.charCodeAt(cursor);
      if (source[cursor] === '"') {
        cursor += 1;
        return JSON.parse(source.slice(start, cursor));
      }
      if (code <= 0x1f) fail('Control character in JSON string');
      if (source[cursor] === '\\') {
        cursor += 1;
        const escape = source[cursor];
        if (!escape) fail('Unterminated JSON escape');
        if ('"\\/bfnrt'.includes(escape)) {
          cursor += 1;
          continue;
        }
        if (escape !== 'u') fail('Invalid JSON escape');
        const unicode = source.slice(cursor + 1, cursor + 5);
        if (!/^[a-fA-F0-9]{4}$/.test(unicode)) fail('Invalid Unicode JSON escape');
        cursor += 5;
        continue;
      }
      cursor += 1;
    }
    fail('Unterminated JSON string');
  }

  function value() {
    whitespace();
    const token = source[cursor];
    if (token === '{') return object();
    if (token === '[') return array();
    if (token === '"') return string();
    for (const literal of ['true', 'false', 'null']) {
      if (source.startsWith(literal, cursor)) {
        cursor += literal.length;
        return;
      }
    }
    const number = source.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) {
      cursor += number[0].length;
      return;
    }
    fail('Expected JSON value');
  }

  function object() {
    cursor += 1;
    whitespace();
    if (source[cursor] === '}') {
      cursor += 1;
      return;
    }
    const keys = new Set();
    while (true) {
      whitespace();
      const key = string();
      if (keys.has(key)) fail(`Duplicate JSON object key ${JSON.stringify(key)}`);
      keys.add(key);
      whitespace();
      if (source[cursor] !== ':') fail('Expected colon after JSON object key');
      cursor += 1;
      value();
      whitespace();
      if (source[cursor] === '}') {
        cursor += 1;
        return;
      }
      if (source[cursor] !== ',') fail('Expected comma after JSON object value');
      cursor += 1;
    }
  }

  function array() {
    cursor += 1;
    whitespace();
    if (source[cursor] === ']') {
      cursor += 1;
      return;
    }
    while (true) {
      value();
      whitespace();
      if (source[cursor] === ']') {
        cursor += 1;
        return;
      }
      if (source[cursor] !== ',') fail('Expected comma after JSON array value');
      cursor += 1;
    }
  }

  whitespace();
  value();
  whitespace();
  if (cursor !== source.length) fail('Unexpected trailing JSON content');
}

function readStrictJson(root, path, label, failures, category) {
  try {
    const source = readFileSync(join(root, path), 'utf8');
    scanJsonWithoutDuplicateKeys(source);
    return JSON.parse(source);
  } catch (error) {
    report(
      failures,
      category,
      `${label} must be valid JSON without duplicate object keys (${error.message}).`,
    );
    return null;
  }
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function verifyImmutablePlan(root, plan, label, failures) {
  const path = join(root, plan.path);
  if (!existsSync(path)) {
    report(
      failures,
      'Evidence',
      `Immutable ${label} plan is missing: ${plan.path}. Restore that exact reviewed plan; no substitute is accepted.`,
    );
    return false;
  }

  try {
    const actual = hashFile(path);
    if (actual !== plan.sha256) {
      report(
        failures,
        'Evidence',
        `Immutable ${label} plan SHA-256 mismatch: expected ${plan.sha256}, found ${actual}. Stop; no substitute is accepted.`,
      );
      return false;
    }
  } catch (error) {
    report(failures, 'Evidence', `Unable to hash immutable ${label} plan: ${error.message}.`);
    return false;
  }
  return true;
}

function checkXcode(root, failures) {
  const selection = checkCommand(
    'Xcode selection',
    'xcode-select',
    ['-p'],
    'Select a full local Xcode installation with xcode-select.',
    root,
    failures,
  );
  if (selection.ok && !/\/Contents\/Developer\/?$/.test(selection.rawOutput)) {
    report(
      failures,
      'Toolchain',
      `Xcode selection is not a full Xcode developer directory (${selection.output || 'empty output'}). Command Line Tools alone are insufficient.`,
    );
  }

  const xcodebuild = checkCommand(
    'xcodebuild',
    'xcodebuild',
    ['-version'],
    'Install/select the reviewed full Xcode toolchain; Command Line Tools alone are insufficient.',
    root,
    failures,
  );
  if (
    xcodebuild.ok &&
    (!/^Xcode\s+\S.*$/m.test(xcodebuild.rawOutput) ||
      !/^Build version\s+\S.*$/m.test(xcodebuild.rawOutput))
  ) {
    report(
      failures,
      'Toolchain',
      'xcodebuild did not report a complete Xcode version and build identity.',
    );
  }

  const simctl = checkCommand(
    'simctl',
    'xcrun',
    ['simctl', 'list', 'runtimes'],
    'Install the reviewed iOS simulator runtime in the selected Xcode.',
    root,
    failures,
  );
  if (simctl.ok && !/\biOS\b/i.test(simctl.rawOutput)) {
    report(
      failures,
      'Toolchain',
      'simctl reported no installed iOS runtime. Install the reviewed runtime outside preflight.',
    );
  }

  return { selection, xcodebuild };
}

function regularFile(path) {
  try {
    return lstatSync(path).isFile();
  } catch {
    return false;
  }
}

function childDirectories(path) {
  try {
    return readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(path, entry.name));
  } catch {
    return [];
  }
}

function checkAndroidSdk(failures) {
  const androidSdk = process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME;
  if (!androidSdk) {
    report(
      failures,
      'Toolchain',
      'ANDROID_SDK_ROOT or ANDROID_HOME is unset. Point it at the reviewed local Android SDK; preflight does not download one.',
    );
    return null;
  }

  const requiredFiles = [
    'platform-tools/adb',
    'platform-tools/source.properties',
    'emulator/emulator',
    'emulator/source.properties',
  ];
  for (const path of requiredFiles) {
    if (!regularFile(join(androidSdk, path))) {
      report(
        failures,
        'Toolchain',
        `Android SDK is incomplete: ${join(androidSdk, path)} is not a regular file.`,
      );
    }
  }

  const platforms = childDirectories(join(androidSdk, 'platforms')).filter(
    (directory) =>
      regularFile(join(directory, 'android.jar')) &&
      regularFile(join(directory, 'source.properties')),
  );
  if (platforms.length === 0) {
    report(failures, 'Toolchain', 'Android SDK has no complete platform with android.jar.');
  }

  const buildTools = childDirectories(join(androidSdk, 'build-tools')).filter((directory) =>
    ['aapt2', 'zipalign', 'apksigner', 'source.properties'].every((file) =>
      regularFile(join(directory, file)),
    ),
  );
  if (buildTools.length === 0) {
    report(failures, 'Toolchain', 'Android SDK has no complete build-tools installation.');
  }

  const systemImages = childDirectories(join(androidSdk, 'system-images')).flatMap((api) =>
    childDirectories(api).flatMap((tag) =>
      childDirectories(tag).filter((abi) => regularFile(join(abi, 'source.properties'))),
    ),
  );
  if (systemImages.length === 0) {
    report(failures, 'Toolchain', 'Android SDK has no complete system-image package.');
  }

  return { root: resolve(androidSdk) };
}

function connectedIosIdentifiers(output) {
  const identifiers = new Set();
  const physicalUdid = /\b(?:[a-f0-9]{8}-[a-f0-9]{16}|[a-f0-9]{40})\b/gi;
  for (const line of output.split(/\r?\n/)) {
    if (/\bsimulator\b/i.test(line) || !/\b(?:available|connected)\b/i.test(line)) continue;
    for (const identifier of line.match(physicalUdid) ?? []) identifiers.add(identifier);
  }
  return [...identifiers];
}

function checkPhysicalDevices(root, failures) {
  const iosDevices = command('xcrun', ['devicectl', 'list', 'devices'], root);
  const iosIdentifiers = iosDevices.ok ? connectedIosIdentifiers(iosDevices.rawOutput) : [];
  if (!iosDevices.ok) {
    report(
      failures,
      'Physical device',
      `iOS device discovery failed (${iosDevices.output || 'command not found'}). Connect and unlock a real iPhone/iPad; simulators are not evidence.`,
    );
  } else if (iosIdentifiers.length === 0) {
    report(
      failures,
      'Physical device',
      'No connected physical iOS device was discovered by xcrun devicectl. Connect and unlock a real iPhone/iPad; simulators are not evidence.',
    );
  }

  const androidDevices = command('adb', ['devices', '-l'], root);
  const androidSerials = [];
  if (androidDevices.ok) {
    for (const line of androidDevices.rawOutput.split(/\r?\n/)) {
      const [serial, state] = line.trim().split(/\s+/, 3);
      if (!serial || state !== 'device' || /^emulator-|^simulator-/i.test(serial)) continue;

      const qemu = command('adb', ['-s', serial, 'shell', 'getprop', 'ro.kernel.qemu'], root);
      const bootQemu = command('adb', ['-s', serial, 'shell', 'getprop', 'ro.boot.qemu'], root);
      const hardware = command('adb', ['-s', serial, 'shell', 'getprop', 'ro.hardware'], root);
      const emulated =
        !qemu.ok ||
        !bootQemu.ok ||
        !hardware.ok ||
        qemu.rawOutput.trim() === '1' ||
        bootQemu.rawOutput.trim() === '1' ||
        /goldfish|ranchu|cuttlefish|vbox|qemu/i.test(hardware.rawOutput);
      if (!emulated) androidSerials.push(serial);
    }
  }
  if (androidSerials.length === 0) {
    report(
      failures,
      'Physical device',
      `No hardware-verified physical Android device was discovered by adb devices -l (${androidDevices.output || 'command not found'}). Connect a device, accept its RSA prompt, and do not substitute an emulator.`,
    );
  }

  return { iosIdentifiers, androidSerials };
}

function validateNativeLock(root, failures) {
  if (!existsSync(join(root, NATIVE_LOCK_PATH))) return null;
  const lock = readStrictJson(
    root,
    NATIVE_LOCK_PATH,
    'Native toolchain lock',
    failures,
    'Toolchain',
  );
  if (!lock) return null;

  let valid = requireExactObject(
    lock,
    [
      'schemaVersion',
      'node',
      'npm',
      'xcode',
      'java',
      'adb',
      'androidSdk',
      'gradle',
      'packageLockSha256',
      'spmPackageResolvedSha256',
    ],
    'Native toolchain lock',
    failures,
    'Toolchain',
  );
  if (lock.schemaVersion !== 1) {
    report(failures, 'Toolchain', 'Native toolchain lock schemaVersion must be the number 1.');
    valid = false;
  }

  for (const runtime of ['node', 'npm']) {
    valid =
      requireExactObject(
        lock[runtime],
        ['version', 'distribution'],
        `Native toolchain lock.${runtime}`,
        failures,
        'Toolchain',
      ) && valid;
    valid =
      requireFixedFact(
        lock[runtime]?.version,
        `Native toolchain lock.${runtime}.version`,
        failures,
        'Toolchain',
      ) && valid;
    valid =
      requireDistribution(
        lock[runtime]?.distribution,
        `Native toolchain lock.${runtime}.distribution`,
        failures,
        'Toolchain',
      ) && valid;
  }

  valid =
    requireExactObject(
      lock.xcode,
      ['developerDir', 'version', 'build'],
      'Native toolchain lock.xcode',
      failures,
      'Toolchain',
    ) && valid;
  for (const field of ['developerDir', 'version', 'build']) {
    valid =
      requireFixedFact(
        lock.xcode?.[field],
        `Native toolchain lock.xcode.${field}`,
        failures,
        'Toolchain',
      ) && valid;
  }
  if (
    typeof lock.xcode?.developerDir === 'string' &&
    !/^\/.+\/Contents\/Developer\/?$/.test(lock.xcode.developerDir)
  ) {
    report(
      failures,
      'Toolchain',
      'Native toolchain lock.xcode.developerDir must be an exact full Xcode Contents/Developer path.',
    );
    valid = false;
  }

  valid =
    requireExactObject(
      lock.java,
      ['vendor', 'version', 'build', 'distribution'],
      'Native toolchain lock.java',
      failures,
      'Toolchain',
    ) && valid;
  for (const field of ['vendor', 'version', 'build']) {
    valid =
      requireFixedFact(
        lock.java?.[field],
        `Native toolchain lock.java.${field}`,
        failures,
        'Toolchain',
      ) && valid;
  }
  valid =
    requireDistribution(
      lock.java?.distribution,
      'Native toolchain lock.java.distribution',
      failures,
      'Toolchain',
    ) && valid;

  valid =
    requireExactObject(
      lock.adb,
      ['version', 'platformToolsRevision', 'distribution'],
      'Native toolchain lock.adb',
      failures,
      'Toolchain',
    ) && valid;
  for (const field of ['version', 'platformToolsRevision']) {
    valid =
      requireFixedFact(
        lock.adb?.[field],
        `Native toolchain lock.adb.${field}`,
        failures,
        'Toolchain',
      ) && valid;
  }
  valid =
    requireDistribution(
      lock.adb?.distribution,
      'Native toolchain lock.adb.distribution',
      failures,
      'Toolchain',
    ) && valid;

  const androidSdkFields = [
    'root',
    'platformApi',
    'platformRevision',
    'buildToolsVersion',
    'buildToolsRevision',
    'platformToolsRevision',
    'emulatorRevision',
    'systemImage',
    'systemImageTag',
    'systemImageRevision',
    'abi',
    'deviceProfile',
  ];
  valid =
    requireExactObject(
      lock.androidSdk,
      androidSdkFields,
      'Native toolchain lock.androidSdk',
      failures,
      'Toolchain',
    ) && valid;
  for (const field of androidSdkFields) {
    valid =
      requireFixedFact(
        lock.androidSdk?.[field],
        `Native toolchain lock.androidSdk.${field}`,
        failures,
        'Toolchain',
      ) && valid;
  }
  if (
    typeof lock.androidSdk?.root === 'string' &&
    (!isAbsolute(lock.androidSdk.root) || lock.androidSdk.root.includes('..'))
  ) {
    report(
      failures,
      'Toolchain',
      'Native toolchain lock.androidSdk.root must be an exact absolute SDK path.',
    );
    valid = false;
  }

  valid =
    requireExactObject(
      lock.gradle,
      ['distributionUrl', 'distributionSha256Sum', 'wrapperJarSha256'],
      'Native toolchain lock.gradle',
      failures,
      'Toolchain',
    ) && valid;
  valid =
    requireDistribution(
      { url: lock.gradle?.distributionUrl, sha256: lock.gradle?.distributionSha256Sum },
      'Native toolchain lock.gradle.distribution',
      failures,
      'Toolchain',
    ) && valid;
  valid =
    requireSha256(
      lock.gradle?.wrapperJarSha256,
      'Native toolchain lock.gradle.wrapperJarSha256',
      failures,
      'Toolchain',
    ) && valid;
  valid =
    requireSha256(
      lock.packageLockSha256,
      'Native toolchain lock.packageLockSha256',
      failures,
      'Toolchain',
    ) && valid;
  valid =
    requireSha256(
      lock.spmPackageResolvedSha256,
      'Native toolchain lock.spmPackageResolvedSha256',
      failures,
      'Toolchain',
    ) && valid;

  return valid ? lock : null;
}

function parseCanonicalGradleProperty(source, key, failures) {
  const matches = Array.from(
    source.matchAll(new RegExp(`^${key}=([^\\r\\n]+)\\r?$`, 'gm')),
    (match) => match[1],
  );
  if (matches.length !== 1) {
    report(
      failures,
      'Toolchain',
      `Gradle wrapper must contain exactly one canonical ${key}= entry; found ${matches.length}.`,
    );
    return null;
  }
  return matches[0].replace(/\\([\\:=])/g, '$1');
}

function readGradleWrapper(root, failures) {
  const path = join(root, 'android/gradle/wrapper/gradle-wrapper.properties');
  if (!existsSync(path)) return null;

  try {
    const source = readFileSync(path, 'utf8');
    const distributionUrl = parseCanonicalGradleProperty(source, 'distributionUrl', failures);
    const distributionSha256Sum = parseCanonicalGradleProperty(
      source,
      'distributionSha256Sum',
      failures,
    );
    if (distributionSha256Sum && !SHA256.test(distributionSha256Sum)) {
      report(
        failures,
        'Toolchain',
        'Gradle wrapper must pin distributionSha256Sum to a 64-character SHA-256.',
      );
    }
    return { distributionUrl, distributionSha256Sum };
  } catch (error) {
    report(failures, 'Toolchain', `Unable to read Gradle wrapper properties: ${error.message}.`);
    return null;
  }
}

function validateActionsLock(root, failures) {
  if (!existsSync(join(root, ACTION_LOCK_PATH))) return;
  const lock = readStrictJson(root, ACTION_LOCK_PATH, 'GitHub Actions lock', failures, 'Toolchain');
  if (!lock) return;

  let valid = requireExactObject(
    lock,
    ['schemaVersion', 'resolvedAt', 'actions'],
    'GitHub Actions lock',
    failures,
    'Toolchain',
  );
  if (lock.schemaVersion !== 1) {
    report(failures, 'Toolchain', 'GitHub Actions lock schemaVersion must be the number 1.');
    valid = false;
  }
  valid =
    requireTimestamp(lock.resolvedAt, 'GitHub Actions lock.resolvedAt', failures, 'Toolchain') &&
    valid;
  if (!isPlainObject(lock.actions) || Object.keys(lock.actions).length === 0) {
    report(
      failures,
      'Toolchain',
      'GitHub Actions lock.actions must be a nonempty action-to-SHA object.',
    );
    valid = false;
  } else {
    for (const [key, sha] of Object.entries(lock.actions)) {
      if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@v[0-9][A-Za-z0-9_.-]*$/.test(key)) {
        report(
          failures,
          'Toolchain',
          `GitHub Actions lock has an invalid action/version key: ${key}.`,
        );
        valid = false;
      }
      if (typeof sha !== 'string' || !ACTION_SHA.test(sha)) {
        report(
          failures,
          'Toolchain',
          `GitHub Actions lock entry ${key} must be a lowercase full 40-character SHA.`,
        );
        valid = false;
      }
    }
  }

  const workflowDirectory = join(root, '.github/workflows');
  if (!existsSync(workflowDirectory)) {
    report(failures, 'Toolchain', 'GitHub workflow directory is missing: .github/workflows.');
    return;
  }

  const workflowPaths = [];
  function walkWorkflows(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walkWorkflows(path);
      else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) workflowPaths.push(path);
    }
  }

  try {
    walkWorkflows(workflowDirectory);
  } catch (error) {
    report(failures, 'Toolchain', `Unable to enumerate GitHub workflows: ${error.message}.`);
    return;
  }

  const entries = [];
  let workflowSyntaxValid = true;
  for (const path of workflowPaths) {
    let source;
    try {
      source = readFileSync(path, 'utf8');
    } catch (error) {
      report(
        failures,
        'Toolchain',
        `Unable to read workflow ${relative(root, path)}: ${error.message}.`,
      );
      workflowSyntaxValid = false;
      continue;
    }

    source.split(/\r?\n/).forEach((line, index) => {
      const uses = /^\s*uses\s*:\s*(.*?)\s*$/.exec(line);
      if (!uses) return;
      const match =
        /^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@([a-f0-9]{40})\s+#\s+(v[0-9][A-Za-z0-9_.-]*)$/.exec(
          uses[1],
        );
      if (!match) {
        report(
          failures,
          'Toolchain',
          `Workflow ${relative(root, path)}:${index + 1} must use owner/repo@<40 lowercase hex SHA> followed by its recorded # vN comment.`,
        );
        workflowSyntaxValid = false;
        return;
      }
      entries.push({
        key: `${match[1]}@${match[3]}`,
        sha: match[2],
        location: `${relative(root, path)}:${index + 1}`,
      });
    });
  }

  if (!valid || !workflowSyntaxValid) return;
  const recordedKeys = new Set(entries.map((entry) => entry.key));
  for (const entry of entries) {
    if (!Object.hasOwn(lock.actions, entry.key)) {
      report(
        failures,
        'Toolchain',
        `GitHub Actions lock is missing ${entry.key} recorded by ${entry.location}.`,
      );
    } else if (lock.actions[entry.key] !== entry.sha) {
      report(
        failures,
        'Toolchain',
        `GitHub Actions lock SHA mismatch for ${entry.key} at ${entry.location}; workflow and lock must match exactly.`,
      );
    }
  }
  for (const key of Object.keys(lock.actions)) {
    if (!recordedKeys.has(key)) {
      report(
        failures,
        'Toolchain',
        `GitHub Actions lock contains stale or unreferenced action entry ${key}.`,
      );
    }
  }
}

function evidencePathIsCommittedFile(root, value, label, failures) {
  if (!requireNonemptyString(value, label, failures, 'Evidence')) return false;
  if (isAbsolute(value)) {
    report(failures, 'Evidence', `${label} must be a repository-relative evidence file path.`);
    return false;
  }

  const rootPath = resolve(root);
  const evidencePath = resolve(rootPath, value);
  const pathFromRoot = relative(rootPath, evidencePath);
  if (
    pathFromRoot === '' ||
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    report(failures, 'Evidence', `${label} escapes the repository and is not acceptable evidence.`);
    return false;
  }

  try {
    if (!lstatSync(evidencePath).isFile()) {
      report(
        failures,
        'Evidence',
        `${label} must name a committed regular evidence file: ${value}.`,
      );
      return false;
    }
  } catch {
    report(failures, 'Evidence', `${label} does not exist: ${value}.`);
    return false;
  }
  const tracked = command('git', ['ls-files', '--error-unmatch', '--', pathFromRoot], rootPath);
  if (!tracked.ok) {
    report(failures, 'Evidence', `${label} must be tracked by Git: ${value}.`);
    return false;
  }
  return true;
}

function validateEvidenceReference(root, reference, label, failures) {
  let valid = requireExactObject(reference, ['path', 'sha256'], label, failures, 'Evidence');
  valid = evidencePathIsCommittedFile(root, reference?.path, `${label}.path`, failures) && valid;
  valid = requireSha256(reference?.sha256, `${label}.sha256`, failures, 'Evidence') && valid;
  if (valid && hashFile(resolve(root, reference.path)) !== reference.sha256) {
    report(failures, 'Evidence', `${label}.sha256 does not match the evidence file bytes.`);
    valid = false;
  }
  return valid;
}

function validatePhysicalPlatform(root, record, platform, discoveredIdentifiers, failures) {
  const label = `Physical gate.${platform}`;
  let valid = requireExactObject(
    record,
    ['deviceIdentity', 'deviceIdentifier', 'evidence', 'outcomes', 'capacitorStorageXmlKeys'],
    label,
    failures,
    'Evidence',
  );
  valid =
    requireNonemptyString(
      record?.deviceIdentity,
      `${label}.deviceIdentity`,
      failures,
      'Evidence',
    ) && valid;
  valid =
    requireNonemptyString(
      record?.deviceIdentifier,
      `${label}.deviceIdentifier`,
      failures,
      'Evidence',
    ) && valid;
  valid =
    requireExactObject(
      record?.evidence,
      PHYSICAL_OUTCOMES,
      `${label}.evidence`,
      failures,
      'Evidence',
    ) && valid;
  valid =
    requireExactObject(
      record?.outcomes,
      PHYSICAL_OUTCOMES,
      `${label}.outcomes`,
      failures,
      'Evidence',
    ) && valid;

  const evidencePaths = [];
  for (const outcome of PHYSICAL_OUTCOMES) {
    const reference = record?.evidence?.[outcome];
    valid =
      validateEvidenceReference(root, reference, `${label}.evidence.${outcome}`, failures) && valid;
    if (typeof reference?.path === 'string') evidencePaths.push(reference.path);
    if (record?.outcomes?.[outcome] !== 'passed') {
      report(
        failures,
        'Evidence',
        `${label}.outcomes.${outcome} must be the literal string "passed".`,
      );
      valid = false;
    }
  }
  if (new Set(evidencePaths).size !== PHYSICAL_OUTCOMES.length) {
    report(failures, 'Evidence', `${label} must use one distinct evidence file per outcome.`);
    valid = false;
  }

  if (
    !Array.isArray(record?.capacitorStorageXmlKeys) ||
    record.capacitorStorageXmlKeys.length !== 1 ||
    record.capacitorStorageXmlKeys[0] !== 'screenshot-shield.locale'
  ) {
    report(
      failures,
      'Evidence',
      `${label}.capacitorStorageXmlKeys must contain exactly ["screenshot-shield.locale"].`,
    );
    valid = false;
  }
  if (
    typeof record?.deviceIdentifier === 'string' &&
    !discoveredIdentifiers.includes(record.deviceIdentifier)
  ) {
    report(
      failures,
      'Evidence',
      `${label}.deviceIdentifier is not one of the currently connected hardware identifiers.`,
    );
    valid = false;
  }
  return valid;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function validatePhysicalGate(root, discoveredDevices, failures) {
  const fullPath = join(root, PHYSICAL_GATE_PATH);
  if (!existsSync(fullPath)) {
    report(
      failures,
      'Evidence',
      `Required human physical attestation is missing: ${PHYSICAL_GATE_PATH}. A named Build Engineer and Architect must attest real iOS and Android evidence; preflight will not synthesize it.`,
    );
    return;
  }

  const tracked = command('git', ['ls-files', '--error-unmatch', '--', PHYSICAL_GATE_PATH], root);
  if (!tracked.ok) {
    report(
      failures,
      'Evidence',
      `Physical attestation is not tracked by Git: ${PHYSICAL_GATE_PATH}. Commit reviewed evidence; preflight will not create it.`,
    );
  }

  const gate = readStrictJson(
    root,
    PHYSICAL_GATE_PATH,
    'Physical gate attestation',
    failures,
    'Evidence',
  );
  if (!gate) return;

  let valid = requireExactObject(
    gate,
    ['schemaVersion', 'plans', 'approvals', 'ios', 'android'],
    'Physical gate attestation',
    failures,
    'Evidence',
  );
  if (gate.schemaVersion !== 1) {
    report(failures, 'Evidence', 'Physical gate attestation schemaVersion must be the number 1.');
    valid = false;
  }

  valid =
    requireExactObject(
      gate.plans,
      ['nativeBaseSha256', 'nativeClosureSha256'],
      'Physical gate attestation.plans',
      failures,
      'Evidence',
    ) && valid;
  if (gate.plans?.nativeBaseSha256 !== NATIVE_BASE_PLAN.sha256) {
    report(
      failures,
      'Evidence',
      `Physical gate attestation.plans.nativeBaseSha256 must equal immutable native base SHA ${NATIVE_BASE_PLAN.sha256}.`,
    );
    valid = false;
  }
  if (gate.plans?.nativeClosureSha256 !== NATIVE_CLOSURE_PLAN.sha256) {
    report(
      failures,
      'Evidence',
      `Physical gate attestation.plans.nativeClosureSha256 must equal immutable native closure SHA ${NATIVE_CLOSURE_PLAN.sha256}.`,
    );
    valid = false;
  }

  const evidenceManifestSha256 = createHash('sha256')
    .update(
      canonicalJson({
        plans: gate.plans,
        ios: gate.ios,
        android: gate.android,
      }),
    )
    .digest('hex');

  valid =
    requireExactObject(
      gate.approvals,
      ['buildEngineer', 'architect'],
      'Physical gate attestation.approvals',
      failures,
      'Evidence',
    ) && valid;
  const approvalRequirements = [
    ['buildEngineer', 'Build Engineer'],
    ['architect', 'Architect'],
  ];
  for (const [key, role] of approvalRequirements) {
    const approval = gate.approvals?.[key];
    valid =
      requireExactObject(
        approval,
        ['role', 'name', 'approvedAt', 'evidenceManifestSha256'],
        `Physical gate attestation.approvals.${key}`,
        failures,
        'Evidence',
      ) && valid;
    if (approval?.role !== role) {
      report(
        failures,
        'Evidence',
        `Physical gate attestation.approvals.${key}.role must be ${JSON.stringify(role)}.`,
      );
      valid = false;
    }
    valid =
      requireNonemptyString(
        approval?.name,
        `Physical gate attestation.approvals.${key}.name`,
        failures,
        'Evidence',
      ) && valid;
    valid =
      requireTimestamp(
        approval?.approvedAt,
        `Physical gate attestation.approvals.${key}.approvedAt`,
        failures,
        'Evidence',
      ) && valid;
    valid =
      requireSha256(
        approval?.evidenceManifestSha256,
        `Physical gate attestation.approvals.${key}.evidenceManifestSha256`,
        failures,
        'Evidence',
      ) && valid;
    if (approval?.evidenceManifestSha256 !== evidenceManifestSha256) {
      report(
        failures,
        'Evidence',
        `Physical gate attestation.approvals.${key}.evidenceManifestSha256 must bind the exact plans, devices, outcomes, and evidence hashes.`,
      );
      valid = false;
    }
  }

  valid =
    validatePhysicalPlatform(root, gate.ios, 'ios', discoveredDevices.iosIdentifiers, failures) &&
    valid;
  valid =
    validatePhysicalPlatform(
      root,
      gate.android,
      'android',
      discoveredDevices.androidSerials,
      failures,
    ) && valid;
  return valid;
}

function readProperties(path) {
  if (!regularFile(path)) return null;
  const properties = new Map();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index > 0) properties.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }
  return properties;
}

function validateSpmResolution(root, lock, failures) {
  const path = 'ios/App/Package.resolved';
  if (!existsSync(join(root, path))) return;

  const resolved = readStrictJson(root, path, 'iOS Package.resolved', failures, 'Toolchain');
  if (!resolved) return;
  const pins = Array.isArray(resolved.pins)
    ? resolved.pins
    : Array.isArray(resolved.object?.pins)
      ? resolved.object.pins
      : null;
  if (!pins) {
    report(failures, 'Toolchain', 'iOS Package.resolved must contain a pins array.');
    return;
  }
  const capacitorPins = pins.filter(
    (pin) => pin?.identity === 'capacitor-swift-pm' || pin?.package === 'capacitor-swift-pm',
  );
  const state = capacitorPins[0]?.state;
  if (
    capacitorPins.length !== 1 ||
    state?.version !== '8.4.1' ||
    typeof state?.revision !== 'string' ||
    !/^[0-9a-f]{40}$/.test(state.revision)
  ) {
    report(
      failures,
      'Toolchain',
      'iOS Package.resolved must pin capacitor-swift-pm exactly to version 8.4.1 and one full revision SHA.',
    );
  }
  if (lock && hashFile(join(root, path)) !== lock.spmPackageResolvedSha256) {
    report(
      failures,
      'Toolchain',
      'iOS Package.resolved SHA-256 does not match native toolchain lock.',
    );
  }
}

function compareAndroidSdkLock(lock, sdk, failures) {
  if (!lock || !sdk) return;
  const expected = lock.androidSdk;
  if (sdk.root !== expected.root) {
    report(
      failures,
      'Toolchain',
      `Android SDK root mismatch: native lock requires ${expected.root}, found ${sdk.root}.`,
    );
    return;
  }

  const checks = [
    {
      path: join(sdk.root, 'platform-tools/source.properties'),
      revision: expected.platformToolsRevision,
      label: 'platform-tools',
    },
    {
      path: join(sdk.root, 'emulator/source.properties'),
      revision: expected.emulatorRevision,
      label: 'emulator',
    },
    {
      path: join(sdk.root, `platforms/android-${expected.platformApi}/source.properties`),
      revision: expected.platformRevision,
      label: `platform android-${expected.platformApi}`,
    },
    {
      path: join(sdk.root, `build-tools/${expected.buildToolsVersion}/source.properties`),
      revision: expected.buildToolsRevision,
      label: `build-tools ${expected.buildToolsVersion}`,
    },
    {
      path: join(sdk.root, expected.systemImage, 'source.properties'),
      revision: expected.systemImageRevision,
      label: `system image ${expected.systemImage}`,
    },
  ];
  for (const check of checks) {
    const properties = readProperties(check.path);
    if (!properties || properties.get('Pkg.Revision') !== check.revision) {
      report(
        failures,
        'Toolchain',
        `Android SDK ${check.label} revision must be exactly ${check.revision}.`,
      );
    }
  }

  const platformPath = join(sdk.root, `platforms/android-${expected.platformApi}`);
  const buildToolsPath = join(sdk.root, `build-tools/${expected.buildToolsVersion}`);
  for (const path of [
    join(platformPath, 'android.jar'),
    join(buildToolsPath, 'aapt2'),
    join(buildToolsPath, 'zipalign'),
    join(buildToolsPath, 'apksigner'),
    join(sdk.root, 'platform-tools/adb'),
    join(sdk.root, 'emulator/emulator'),
  ]) {
    if (!regularFile(path)) {
      report(failures, 'Toolchain', `Locked Android SDK artifact is missing: ${path}.`);
    }
  }

  const systemImagePath = resolve(sdk.root, expected.systemImage);
  const relativeImage = relative(sdk.root, systemImagePath);
  const exactSystemImage = `system-images/android-${expected.platformApi}/${expected.systemImageTag}/${expected.abi}`;
  if (
    relativeImage.startsWith(`..${sep}`) ||
    isAbsolute(relativeImage) ||
    !relativeImage.endsWith(expected.abi) ||
    expected.systemImage !== exactSystemImage ||
    !regularFile(join(systemImagePath, 'source.properties')) ||
    !regularFile(join(systemImagePath, 'system.img')) ||
    !regularFile(join(systemImagePath, 'ramdisk.img')) ||
    !['kernel-ranchu', 'kernel-ranchu-64'].some((name) => regularFile(join(systemImagePath, name)))
  ) {
    report(
      failures,
      'Toolchain',
      'Android SDK systemImage must be a complete locked package under the SDK root with the locked ABI.',
    );
  }

  const emulatorList = command(join(sdk.root, 'emulator/emulator'), ['-list-avds'], process.cwd());
  if (
    !emulatorList.ok ||
    !emulatorList.rawOutput
      .split(/\r?\n/)
      .map((value) => value.trim())
      .includes(expected.deviceProfile)
  ) {
    report(
      failures,
      'Toolchain',
      `Android emulator device profile ${expected.deviceProfile} is not installed.`,
    );
  }
  if (lock.adb.platformToolsRevision !== expected.platformToolsRevision) {
    report(
      failures,
      'Toolchain',
      'Native lock adb.platformToolsRevision and androidSdk.platformToolsRevision must match.',
    );
  }
}

function compareNativeLock(root, lock, tools, gradle, failures) {
  if (!lock) return;

  if (process.versions.node !== lock.node.version) {
    report(
      failures,
      'Toolchain',
      `Node version mismatch: native lock requires ${lock.node.version}, found ${process.versions.node}.`,
    );
  }

  if (tools.npm.ok && tools.npm.rawOutput.trim() !== lock.npm.version) {
    report(
      failures,
      'Toolchain',
      `npm version mismatch: native lock requires ${lock.npm.version}, found ${tools.npm.rawOutput.trim()}.`,
    );
  }

  if (
    tools.xcode.selection.ok &&
    tools.xcode.selection.rawOutput.trim() !== lock.xcode.developerDir
  ) {
    report(
      failures,
      'Toolchain',
      `Xcode developer directory mismatch: native lock requires ${lock.xcode.developerDir}, found ${tools.xcode.selection.rawOutput.trim()}.`,
    );
  }
  if (tools.xcode.xcodebuild.ok) {
    const version = /^Xcode\s+(.+)$/m.exec(tools.xcode.xcodebuild.rawOutput)?.[1]?.trim();
    const build = /^Build version\s+(.+)$/m.exec(tools.xcode.xcodebuild.rawOutput)?.[1]?.trim();
    if (version && version !== lock.xcode.version) {
      report(
        failures,
        'Toolchain',
        `Xcode version mismatch: native lock requires ${lock.xcode.version}, found ${version}.`,
      );
    }
    if (build && build !== lock.xcode.build) {
      report(
        failures,
        'Toolchain',
        `Xcode build mismatch: native lock requires ${lock.xcode.build}, found ${build}.`,
      );
    }
  }

  if (tools.java.ok) {
    const javaVersion =
      /(?:openjdk|java)\s+version\s+"([^"]+)"/i.exec(tools.java.rawOutput)?.[1] ??
      /(?:openjdk|java)\s+(\S+)/i.exec(tools.java.rawOutput)?.[1];
    if (javaVersion && javaVersion !== lock.java.version) {
      report(
        failures,
        'Toolchain',
        `Java version mismatch: native lock requires ${lock.java.version}, found ${javaVersion}.`,
      );
    }
    for (const field of ['vendor', 'build']) {
      if (!tools.java.rawOutput.includes(lock.java[field])) {
        report(
          failures,
          'Toolchain',
          `Java ${field} mismatch: native lock requires ${JSON.stringify(lock.java[field])} in java -version output.`,
        );
      }
    }
  }

  if (tools.adb.ok) {
    const adbVersion = /Android Debug Bridge version\s+([^\s]+)/i.exec(tools.adb.rawOutput)?.[1];
    if (adbVersion && adbVersion !== lock.adb.version) {
      report(
        failures,
        'Toolchain',
        `adb version mismatch: native lock requires ${lock.adb.version}, found ${adbVersion}.`,
      );
    }
    if (!tools.adb.rawOutput.includes(lock.adb.platformToolsRevision)) {
      report(
        failures,
        'Toolchain',
        `Android Platform-Tools revision mismatch: native lock requires ${JSON.stringify(lock.adb.platformToolsRevision)} in adb version output.`,
      );
    }
  }

  const packageLockPath = join(root, 'package-lock.json');
  if (existsSync(packageLockPath)) {
    const packageLockSha = hashFile(packageLockPath);
    if (packageLockSha !== lock.packageLockSha256) {
      report(
        failures,
        'Toolchain',
        `package-lock.json SHA-256 mismatch: native lock requires ${lock.packageLockSha256}, found ${packageLockSha}.`,
      );
    }
  }

  if (gradle?.distributionUrl && gradle.distributionUrl !== lock.gradle.distributionUrl) {
    report(
      failures,
      'Toolchain',
      `Gradle distribution URL mismatch: native lock requires ${lock.gradle.distributionUrl}, found ${gradle.distributionUrl}.`,
    );
  }
  if (
    gradle?.distributionSha256Sum &&
    gradle.distributionSha256Sum !== lock.gradle.distributionSha256Sum
  ) {
    report(
      failures,
      'Toolchain',
      `Gradle distribution SHA-256 mismatch: native lock requires ${lock.gradle.distributionSha256Sum}, found ${gradle.distributionSha256Sum}.`,
    );
  }

  const wrapperJarPath = join(root, 'android/gradle/wrapper/gradle-wrapper.jar');
  if (existsSync(wrapperJarPath)) {
    const wrapperJarSha = hashFile(wrapperJarPath);
    if (wrapperJarSha !== lock.gradle.wrapperJarSha256) {
      report(
        failures,
        'Toolchain',
        `Gradle wrapper JAR SHA-256 mismatch: native lock requires ${lock.gradle.wrapperJarSha256}, found ${wrapperJarSha}.`,
      );
    }
  }
}

export function runNativePreflight(root = process.cwd()) {
  const failures = [];
  const resolvedRoot = resolve(root);
  const nodeVersion = process.versions.node;
  if (!nodeVersion) {
    report(
      failures,
      'Toolchain',
      'Local Node.js is unavailable. Use the reviewed Node toolchain; preflight does not install one.',
    );
  }

  const npm = checkCommand(
    'npm',
    'npm',
    ['--version'],
    'Use the reviewed local npm; preflight does not download or replace it.',
    resolvedRoot,
    failures,
  );
  const xcode = checkXcode(resolvedRoot, failures);
  const java = checkCommand(
    'Java',
    'java',
    ['-version'],
    'Install/select the reviewed local JDK; preflight does not install one.',
    resolvedRoot,
    failures,
  );
  const adb = checkCommand(
    'adb',
    'adb',
    ['version'],
    'Install Android SDK Platform-Tools and expose its reviewed adb binary on PATH.',
    resolvedRoot,
    failures,
  );
  const androidSdk = checkAndroidSdk(failures);
  const discoveredDevices = checkPhysicalDevices(resolvedRoot, failures);

  for (const path of REQUIRED_LOCKS) checkCommittedLock(resolvedRoot, path, failures);
  checkCommittedLock(resolvedRoot, NATIVE_LOCK_PATH, failures);
  checkCommittedLock(resolvedRoot, ACTION_LOCK_PATH, failures);
  checkCommittedLock(resolvedRoot, PHYSICAL_GATE_PATH, failures);

  verifyImmutablePlan(resolvedRoot, NATIVE_BASE_PLAN, 'native base', failures);
  verifyImmutablePlan(resolvedRoot, NATIVE_CLOSURE_PLAN, 'native closure', failures);

  const gradle = readGradleWrapper(resolvedRoot, failures);
  const nativeLock = validateNativeLock(resolvedRoot, failures);
  validateSpmResolution(resolvedRoot, nativeLock, failures);
  compareAndroidSdkLock(nativeLock, androidSdk, failures);
  validateActionsLock(resolvedRoot, failures);
  validatePhysicalGate(resolvedRoot, discoveredDevices, failures);
  for (const error of verifyNativePolicy(resolvedRoot)) {
    report(failures, 'Toolchain', `Native static policy failed: ${error}`);
  }
  compareNativeLock(resolvedRoot, nativeLock, { npm, xcode, java, adb }, gradle, failures);

  return failures;
}

function main() {
  const failures = runNativePreflight();
  if (failures.length > 0) {
    console.error('Native toolchain preflight failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Native toolchain preflight passed with Node ${process.versions.node}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
