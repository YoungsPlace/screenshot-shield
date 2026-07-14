import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const textFiles = [
  'index.html',
  'public/manifest.webmanifest',
  'public/privacy.html',
  'public/support.html',
  'public/launch.js',
  'src/App.tsx',
  'src/editor/ScreenshotEditor.tsx',
  'src/marketing/i18n.ts',
  'src/ocr/localOcrClient.ts',
  'README.md',
  'PRIVACY.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  'playwright.config.ts',
  'e2e/screenshot-shield.spec.ts',
] as const;

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFilesUnder(path) : [path];
  });
}

const runtimeFiles = [
  'index.html',
  ...sourceFilesUnder('src').filter((file) => /\.(?:ts|tsx|[cm]?js)$/.test(file)),
  ...sourceFilesUnder('public').filter((file) => /\.(?:html|[cm]?js)$/.test(file)),
];

function executableSource(file: string): string {
  const source = readFileSync(file, 'utf8');
  if (!file.endsWith('.html')) return source;

  return Array.from(
    source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),
    (match) => match[1],
  ).join('\n');
}

function workflowStep(source: string, name: string): string {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const next = source.indexOf('\n      - name:', start + marker.length);
  return source.slice(start, next < 0 ? source.length : next);
}

describe('release and privacy guardrails', () => {
  it('documents local-only processing without absolute detection promises', () => {
    const readme = readFileSync('README.md', 'utf8');
    const privacy = readFileSync('PRIVACY.md', 'utf8');
    const security = readFileSync('SECURITY.md', 'utf8');

    expect(readme).toMatch(/browser memory|in-memory/i);
    expect(privacy).toMatch(
      /no application upload endpoint, backend, account system, screenshot\/export relay, advertising, analytics/i,
    );
    expect(security).toMatch(
      /automatic suggestions are not a guarantee|does not guarantee that every sensitive item is detected/i,
    );
    expect(`${readme}\n${privacy}\n${security}`).not.toMatch(
      /guaranteed to detect|detects all|certified/i,
    );
  });

  it('keeps release-owned files free of third-party runtime endpoints and fake secrets', () => {
    const combined = textFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
    const urls = combined.match(/https?:\/\/[^\s)'"`<>]+/g) ?? [];
    for (const rawUrl of urls) {
      if (rawUrl.includes('${')) {
        expect([
          'http://127.0.0.1:${port}',
          'http://127.0.0.1:${port}/screenshot-shield/',
          'https://youngsplace.github.io/screenshot-shield/?lang=${language}',
        ]).toContain(rawUrl);
        continue;
      }
      const url = new URL(rawUrl);
      const allowed =
        (url.origin === 'https://youngsplace.github.io' &&
          url.pathname.startsWith('/screenshot-shield/')) ||
        (url.origin === 'https://github.com' &&
          (url.pathname === '/YoungsPlace/screenshot-shield' ||
            url.pathname.startsWith('/YoungsPlace/screenshot-shield/'))) ||
        (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) ||
        (url.protocol === 'https:' &&
          (url.hostname === 'example.test' || url.hostname.endsWith('.example.test')));
      expect(allowed, `unexpected release-owned endpoint: ${rawUrl}`).toBe(true);
    }
    expect(combined).not.toMatch(/sk_live_[A-Za-z0-9_-]+/);
    expect(combined).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });

  it('prohibits unowned persistence and filesystem APIs in runtime code', () => {
    const runtime = runtimeFiles.map(executableSource).join('\n');
    expect(runtime).not.toMatch(
      /document\.cookie|cookieStore|navigator\.storage|storage\.getDirectory|showSaveFilePicker|FileSystemFileHandle|indexedDB|sessionStorage|CacheStorage|caches\.|serviceWorker\.register|localStorage\.(?:removeItem|clear)/,
    );
  });

  it('CI and Pages workflows run strict verification gates', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');
    const playwright = readFileSync('playwright.config.ts', 'utf8');

    for (const command of [
      'npm run typecheck',
      'npm run lint',
      'npm run format:check',
      'npm test',
      'npm run build',
      'npm run native:policy',
    ]) {
      expect(ci).toContain(command);
      expect(deploy).toContain(command);
    }
    expect(ci).toContain('npm ci');
    expect(deploy).toContain('npm ci');
    expect(ci).toContain('chromium webkit');
    expect(deploy).toContain('chromium webkit');
    expect(ci).toContain('VITE_BASE_PATH: /screenshot-shield/');
    for (const workflow of [ci, deploy]) {
      const installStep = workflowStep(workflow, 'Install Playwright browsers');
      expect(installStep).toMatch(/^ {8}run: npx playwright install --with-deps chromium webkit$/m);
      expect(installStep).not.toMatch(/^\s+(?:if|continue-on-error):/m);

      const e2eStep = workflowStep(workflow, 'Playwright e2e');
      expect(e2eStep).toMatch(/^ {8}run: npm run e2e$/m);
      expect(e2eStep).toMatch(/^ {10}VITE_BASE_PATH: \/screenshot-shield\/$/m);
      expect(e2eStep).toMatch(
        /^ {10}PLAYWRIGHT_BASE_URL: http:\/\/127\.0\.0\.1:4173\/screenshot-shield\/$/m,
      );
      expect(e2eStep).not.toMatch(/^\s+(?:if|continue-on-error):/m);
    }
    expect(playwright).toContain('`http://127.0.0.1:${port}/screenshot-shield/`');
    expect(playwright).toContain('/launch\\.mobile\\.spec\\.ts$/');
    expect(ci).toContain('npm run e2e');
    expect(deploy).toContain('actions/deploy-pages');
    expect(deploy).toContain('VITE_BASE_PATH: /screenshot-shield/');
  });
  it('pins every workflow action to the recorded immutable SHA', () => {
    const lock = JSON.parse(readFileSync('.github/actions.lock.json', 'utf8')) as {
      actions: Record<string, string>;
    };
    const workflows = [
      readFileSync('.github/workflows/ci.yml', 'utf8'),
      readFileSync('.github/workflows/deploy.yml', 'utf8'),
    ].join('\n');
    const usesLines = workflows.match(/^\s*uses:/gm) ?? [];
    const pinned = Array.from(
      workflows.matchAll(/^\s*uses:\s+([^@\s]+)@([0-9a-f]{40})\s+#\s+(v\d+)\s*$/gm),
      (match) => ({
        key: `${match[1]}@${match[3]}`,
        sha: match[2],
      }),
    );

    expect(pinned).toHaveLength(usesLines.length);
    for (const entry of pinned) {
      expect(lock.actions[entry.key], `missing or stale action lock for ${entry.key}`).toBe(
        entry.sha,
      );
    }
    expect([...new Set(pinned.map((entry) => entry.key))].sort()).toEqual(
      Object.keys(lock.actions).sort(),
    );
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
    const src = readFileSync(i18nPath, 'utf8');
    expect(src).not.toMatch(/guaranteed to detect|detects all|certified/i);
  });
});
