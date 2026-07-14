import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

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

// ---------------------------------------------------------------------------
// i18n multilingual contract guardrails
// ---------------------------------------------------------------------------
describe('i18n multilingual contract guardrails', () => {
  it('i18n.ts is free of third-party runtime endpoints and fake secrets', () => {
    // content.ts intentionally contains example/demo values (sk_live_demo_*, example.test URLs)
    // and is excluded here. Only the i18n contract file (which must not carry live secrets)
    // is checked.
    const i18nPath = 'src/marketing/i18n.ts';
    if (!existsSync(i18nPath)) return; // created by Lane B — skip until merged
    const src = readFileSync(i18nPath, 'utf8');
    // No real third-party runtime URL (RFC 2606 test domains and common local addresses allowed)
    expect(src).not.toMatch(
      /https?:\/\/(?!github\.com|schemas\.openxmlformats\.org|127\.|localhost|[^/]*\.example\.test|example\.test)/i,
    );
    // No real-looking credential patterns
    expect(src).not.toMatch(/sk_live_[A-Za-z0-9_-]+/);
    expect(src).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });

  it('i18n.ts exports the required Locale / localeOptions / detectInitialLocale / marketingCopy surface', () => {
    const i18nPath = 'src/marketing/i18n.ts';
    if (!existsSync(i18nPath)) {
      // Created by Lane B; test will enforce contract after workers merge
      console.warn(
        '[release-policy] skipping i18n contract check: src/marketing/i18n.ts not yet present',
      );
      return;
    }
    const src = readFileSync(i18nPath, 'utf8');
    // Required type/const exports
    expect(src, 'Locale type').toMatch(/\bLocale\b/);
    expect(src, "locale 'ko'").toMatch(/['"]ko['"]/);
    expect(src, "locale 'en'").toMatch(/['"]en['"]/);
    expect(src, "locale 'zh'").toMatch(/['"]zh['"]/);
    expect(src, 'localeOptions export').toMatch(/\blocaleOptions\b/);
    expect(src, 'detectInitialLocale export').toMatch(/\bdetectInitialLocale\b/);
    expect(src, 'marketingCopy export').toMatch(/\bmarketingCopy\b/);
    expect(src, 'MarketingCopy type').toMatch(/\bMarketingCopy\b/);
    // shortLabel values used by the locale switcher UI
    expect(src, "shortLabel 'KO'").toMatch(/['"]KO['"]/);
    expect(src, "shortLabel 'EN'").toMatch(/['"]EN['"]/);
    expect(src, "shortLabel '中文'").toMatch(/中文/);
  });

  it('i18n.ts contains copy for all three locales without absolute detection promises', () => {
    const i18nPath = 'src/marketing/i18n.ts';
    if (!existsSync(i18nPath)) return;
    const src = readFileSync(i18nPath, 'utf8');
    expect(src).not.toMatch(/guaranteed to detect|detects all|certified/i);
  });
});
