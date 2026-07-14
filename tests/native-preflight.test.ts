import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const preflightScript = resolve('script/native-preflight.mjs');
const fixtures: string[] = [];

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'screenshot-shield-native-preflight-'));
  fixtures.push(root);
  return root;
}

function write(root: string, path: string, content: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function preflight(root: string, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [preflightScript], {
    cwd: root,
    encoding: 'utf8',
    env,
  });
}

function output(result: ReturnType<typeof preflight>): string {
  return `${result.stdout}${result.stderr}`;
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('native physical and toolchain preflight', () => {
  it('keeps absent native locks, SPM resolution, and physical attestation as explicit blockers', () => {
    const result = preflight(process.cwd());
    const text = output(result);

    expect(result.status).toBe(1);
    expect(text).toContain(
      'Required committed lock artifact is missing: toolchains/native.lock.json',
    );
    expect(text).toContain('Required committed lock artifact is missing: ios/App/Package.resolved');
    expect(text).toContain(
      'Required human physical attestation is missing: toolchains/native-physical-gate.json',
    );
    expect(text).toContain('Physical device:');
  });

  it('rejects substituted immutable native plans and an empty toolchain lock', () => {
    const root = fixture();
    write(
      root,
      '.gjc/_session-019f6021-2baf-7000-bad1-ba365803c392/plans/ralplan/019f6021-2baf-7000-bad1-ba365803c392/stage-05-revision.md',
      'substituted native base\n',
    );
    write(
      root,
      '.gjc/_session-019f6096-6749-7000-a3f0-0fa4e4b6270d/plans/ralplan/019f6096-6749-7000-a3f0-0fa4e4b6270d/stage-04-revision.md',
      'substituted native closure\n',
    );
    write(root, 'toolchains/native.lock.json', '{}\n');

    const result = preflight(root);
    const text = output(result);

    expect(result.status).toBe(1);
    expect(text).toContain('Immutable native base plan SHA-256 mismatch');
    expect(text).toContain('Immutable native closure plan SHA-256 mismatch');
    expect(text).toContain('Native toolchain lock is missing required fields');
  });

  it('rejects empty SDK directories and an unpinned SPM resolution file', () => {
    const root = fixture();
    const sdk = join(root, 'android-sdk');
    mkdirSync(join(sdk, 'platform-tools'), { recursive: true });
    mkdirSync(join(sdk, 'platforms'), { recursive: true });
    mkdirSync(join(sdk, 'build-tools'), { recursive: true });
    mkdirSync(join(sdk, 'emulator'), { recursive: true });
    mkdirSync(join(sdk, 'system-images'), { recursive: true });
    write(root, 'ios/App/Package.resolved', '{}\n');

    const result = preflight(root, {
      ...process.env,
      ANDROID_SDK_ROOT: sdk,
      ANDROID_HOME: sdk,
    });
    const text = output(result);

    expect(result.status).toBe(1);
    expect(text).toContain('platform-tools/adb is not a regular file');
    expect(text).toContain('Android SDK has no complete platform with android.jar');
    expect(text).toContain('Android SDK has no complete build-tools installation');
    expect(text).toContain('iOS Package.resolved must contain a pins array');
  });

  it('rejects action lock and workflow SHA mismatches', () => {
    const root = fixture();
    write(
      root,
      '.github/actions.lock.json',
      `${JSON.stringify(
        {
          schemaVersion: 1,
          resolvedAt: '2026-07-14T16:05:00Z',
          actions: {
            'actions/checkout@v4': '0'.repeat(40),
          },
        },
        null,
        2,
      )}\n`,
    );
    write(
      root,
      '.github/workflows/ci.yml',
      'steps:\n  - name: Checkout\n    uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4\n',
    );

    const result = preflight(root);
    const text = output(result);

    expect(result.status).toBe(1);
    expect(text).toContain('GitHub Actions lock SHA mismatch for actions/checkout@v4');
  });

  it('rejects wrong physical-gate plan identities before trusting outcomes', () => {
    const root = fixture();
    write(
      root,
      'toolchains/native-physical-gate.json',
      `${JSON.stringify(
        {
          schemaVersion: 1,
          plans: {
            nativeBaseSha256: '0'.repeat(64),
            nativeClosureSha256: '1'.repeat(64),
          },
          approvals: {},
          ios: {},
          android: {},
        },
        null,
        2,
      )}\n`,
    );

    const result = preflight(root);
    const text = output(result);

    expect(result.status).toBe(1);
    expect(text).toContain('Physical gate attestation.plans.nativeBaseSha256 must equal');
    expect(text).toContain('Physical gate attestation.plans.nativeClosureSha256 must equal');
  });
});
