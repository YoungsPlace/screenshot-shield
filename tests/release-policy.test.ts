import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const textFiles = [
  'README.md',
  'PRIVACY.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  'playwright.config.ts',
  'e2e/screenshot-shield.spec.ts',
] as const;

describe('release and privacy guardrails', () => {
  it('documents local-only processing without absolute detection promises', () => {
    const readme = readFileSync('README.md', 'utf8');
    const privacy = readFileSync('PRIVACY.md', 'utf8');
    const security = readFileSync('SECURITY.md', 'utf8');

    expect(readme).toMatch(/browser memory|in-memory/i);
    expect(privacy).toMatch(/does not include:[\s\S]*analytics/i);
    expect(security).toMatch(/Detection suggestions are review aids|Absolute guarantees/i);
    expect(`${readme}\n${privacy}\n${security}`).not.toMatch(
      /guaranteed to detect|detects all|certified/i,
    );
  });

  it('keeps release-owned files free of third-party runtime endpoints and fake secrets', () => {
    const combined = textFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(combined).not.toMatch(
      /https?:\/\/(?!github\.com|schemas\.openxmlformats\.org|127\.|localhost)/i,
    );
    expect(combined).not.toMatch(/sk_live_[A-Za-z0-9_-]+/);
    expect(combined).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });

  it('CI and Pages workflows run strict verification gates', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');

    for (const command of [
      'npm run typecheck',
      'npm run lint',
      'npm run format:check',
      'npm test',
      'npm run build',
    ]) {
      expect(ci).toContain(command);
      expect(deploy).toContain(command);
    }
    expect(ci).toContain('npm run e2e');
    expect(deploy).toContain('actions/deploy-pages');
    expect(deploy).toContain('VITE_BASE_PATH: /screenshot-shield/');
  });
});
