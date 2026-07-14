import { expect, test, type APIResponse, type Page } from '@playwright/test';

const THIRD_PARTY_HOST_RE = /^(?!127\.0\.0\.1$|localhost$|\[::1\]$)/i;

function trackThirdParty(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && THIRD_PARTY_HOST_RE.test(url.hostname)) {
      requests.push(request.url());
    }
  });
  return requests;
}

async function expectNoHorizontalOverflow(page: Page, viewport: number): Promise<void> {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows, `${viewport}px: horizontal overflow detected`).toBe(false);
}

async function expectPngAsset(
  response: APIResponse,
  expectedSize: number,
  label: string,
): Promise<void> {
  expect(response.ok(), `${label} should resolve`).toBe(true);
  expect(response.headers()['content-type'], `${label} content type`).toMatch(/^image\/png\b/i);
  const body = await response.body();
  expect(
    body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    `${label} PNG signature`,
  ).toBe(true);
  expect(body.readUInt32BE(16), `${label} width`).toBe(expectedSize);
  expect(body.readUInt32BE(20), `${label} height`).toBe(expectedSize);
}

function expectPagesPath(page: Page): void {
  expect(new URL(page.url()).pathname).toBe('/screenshot-shield/');
}

test('bare Korean root has exact public links and no third-party egress', async ({ page }) => {
  const thirdPartyRequests = trackThirdParty(page);

  await page.goto('./');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(
    page.getByRole('heading', { name: 'Screenshot Shield — 공유하기 전에, 먼저 가리세요.' }),
  ).toBeVisible();

  const navigation = page.getByRole('navigation', { name: 'Language / 언어 / 语言' });
  await expect(navigation.getByRole('link', { name: '한국어', exact: true })).toHaveAttribute(
    'href',
    '?lang=ko',
  );
  await expect(navigation.getByRole('link', { name: 'English', exact: true })).toHaveAttribute(
    'href',
    '?lang=en',
  );
  await expect(navigation.getByRole('link', { name: '中文', exact: true })).toHaveAttribute(
    'href',
    '?lang=zh-CN',
  );

  expect(thirdPartyRequests, 'bare Korean landing: third-party requests').toEqual([]);
});

test('locale aliases, invalid, and duplicate values canonicalize', async ({ page }) => {
  await page.goto('./?lang=zh');
  await expect(page).toHaveURL(/\?lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expectPagesPath(page);

  await page.goto('./?lang=fr');
  await expect(page).toHaveURL(/\?lang=ko$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  expectPagesPath(page);

  await page.goto('./?lang=en&lang=zh-CN');
  await expect(page).toHaveURL(/\?lang=ko$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  expectPagesPath(page);
});

test('locale navigation preserves browser history', async ({ page }) => {
  await page.goto('./?lang=en');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\?lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expectPagesPath(page);

  await page.goBack();
  await expect(page).toHaveURL(/\?lang=en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expectPagesPath(page);

  await page.goForward();
  await expect(page).toHaveURL(/\?lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expectPagesPath(page);
});

test('installed editor restores locale and falls back when storage fails', async ({ page }) => {
  await page.goto('./?lang=en');
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('screenshot-shield.locale')))
    .toBe('en');

  await page.goto('./?view=editor&installed=1');
  await expect(page).toHaveURL(/\?view=editor&installed=1&lang=en$/);
  await expect(page.getByRole('heading', { name: 'Local screenshot editor' })).toBeVisible();
  const installedPersistence = await page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    databases:
      typeof indexedDB.databases === 'function'
        ? (await indexedDB.databases()).map((database) => database.name ?? '')
        : [],
    caches: typeof caches === 'undefined' ? [] : await caches.keys(),
  }));
  expect(installedPersistence).toEqual({
    local: [['screenshot-shield.locale', 'en']],
    session: [],
    databases: [],
    caches: [],
  });

  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');

  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    });
  });
  await page.goto('./?view=editor&installed=1');
  await expect(page).toHaveURL(/\?view=editor&installed=1&lang=ko$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
});

test('storage access failures never block canonical locale rendering', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      },
    });
  });

  await page.goto('./?view=editor&installed=1');
  await expect(page).toHaveURL(/\?view=editor&installed=1&lang=ko$/);
  await expect(page.getByRole('heading', { name: '로컬 스크린샷 편집기' })).toBeVisible();
});

test('locale navigation stays usable when preference writes fail', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value: () => {
        throw new DOMException('Storage write blocked', 'QuotaExceededError');
      },
    });
  });

  await page.goto('./?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('link', { name: '中文', exact: true }).click();
  await expect(page).toHaveURL(/\?lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
});

test('view editor keeps chrome; embed editor wins and stays minimal', async ({ page }) => {
  await page.goto('./?view=editor&lang=en');

  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Local screenshot editor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open local editor' })).toHaveCount(0);
  const ChineseLocale = page.getByRole('link', { name: '中文', exact: true });
  await expect(ChineseLocale).toHaveAttribute('href', '?view=editor&lang=zh-CN');
  await ChineseLocale.click();
  await expect(page).toHaveURL(/\?view=editor&lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '本地截图编辑器' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(1);

  await page.goto('./?view=editor&embed=editor&lang=en');
  await expect(page).toHaveURL(/\?embed=editor&lang=en$/);
  await expect(page.getByRole('heading', { name: 'Local screenshot editor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open local editor' })).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('each public locale keeps its critical landing-to-editor path visible', async ({ page }) => {
  const locales = [
    {
      tag: 'ko',
      documentLanguage: 'ko',
      landingHeading: 'Screenshot Shield — 공유하기 전에, 먼저 가리세요.',
      startEditing: '로컬 편집기 열기',
      editorHeading: '로컬 스크린샷 편집기',
    },
    {
      tag: 'en',
      documentLanguage: 'en',
      landingHeading: 'Screenshot Shield — Clean it before you share it.',
      startEditing: 'Open local editor',
      editorHeading: 'Local screenshot editor',
    },
    {
      tag: 'zh-CN',
      documentLanguage: 'zh-CN',
      landingHeading: 'Screenshot Shield — 分享之前，先遮盖敏感信息。',
      startEditing: '打开本地编辑器',
      editorHeading: '本地截图编辑器',
    },
  ] as const;

  for (const locale of locales) {
    await page.goto(`./?lang=${locale.tag}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.documentLanguage);
    await expect(page.getByRole('heading', { name: locale.landingHeading })).toBeVisible();
    await page.getByRole('button', { name: locale.startEditing }).click();
    await expect(page.getByRole('heading', { name: locale.editorHeading })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  }
});

test('opening the editor from the landing moves focus to its heading', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '로컬 편집기 열기' }).click();

  await expect(page.getByRole('heading', { name: '로컬 스크린샷 편집기' })).toBeFocused();
});

test('skip link reveals the editor and brings its heading into view', async ({ page }) => {
  await page.goto('./');

  const skipLink = page.getByRole('link', { name: '편집기로 건너뛰기' });
  await skipLink.focus();
  await page.keyboard.press('Enter');

  const editorHeading = page.getByRole('heading', { name: '로컬 스크린샷 편집기' });
  await expect(editorHeading).toBeFocused();
  await expect(editorHeading).toBeInViewport();
});

test('landing remains readable without horizontal overflow at mobile and desktop widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Screenshot Shield/ })).toBeVisible();
  await expectNoHorizontalOverflow(page, 390);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectNoHorizontalOverflow(page, 1440);
});

test('marketing headline layout stays within its tolerant contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.getByRole('link', { name: 'English', exact: true }).click();

  const heroLineCount = await page.locator('.hero-section h1').evaluate((heading) => {
    const styles = getComputedStyle(heading);
    return Math.round(
      heading.getBoundingClientRect().height / Number.parseFloat(styles.lineHeight),
    );
  });
  expect(heroLineCount, 'desktop hero should not exceed four lines').toBeLessThanOrEqual(4);

  await page.setViewportSize({ width: 390, height: 844 });
  const sectionHeadings = page.locator(
    '.proof-panel h2, .workflow-section > h2, .detectors-section h2, .limitations-section h2, .faq-section > h2, .final-cta h2',
  );
  const mobileMetrics = await sectionHeadings.evaluateAll((headings) =>
    headings.map((heading) => {
      const styles = getComputedStyle(heading);
      const rect = heading.getBoundingClientRect();
      return {
        text: heading.textContent?.trim() ?? '',
        lineCount: Math.round(rect.height / Number.parseFloat(styles.lineHeight)),
        width: rect.width,
      };
    }),
  );

  expect(mobileMetrics, 'all marketing section headings are rendered').toHaveLength(6);
  for (const metric of mobileMetrics) {
    expect(
      metric.lineCount,
      `${metric.text}: mobile heading should not exceed three lines`,
    ).toBeLessThanOrEqual(3);
    expect(
      metric.width,
      `${metric.text}: mobile heading should use the available column`,
    ).toBeGreaterThan(280);
  }
});

test('320px keeps locale and editor entry targets reachable without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('./');
  await expectNoHorizontalOverflow(page, 320);

  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Open local editor' }).click();
  await expect(page.getByRole('heading', { name: 'Local screenshot editor' })).toBeFocused();
  await expect(page.locator('input[type="file"]')).toBeAttached();
  await expectNoHorizontalOverflow(page, 320);
});

test('public privacy and support pages expose localized web-only boundaries', async ({ page }) => {
  await page.goto('./privacy.html?lang=en');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(
    page.getByText(/has no screenshot\/export upload\s+feature, backend, account system/i),
  ).toBeVisible();
  await expect(page.getByText(/no ads, analytics, telemetry, session replay/i)).toBeVisible();
  await expect(
    page.getByText(
      /No iOS or Android native app is claimed as published or available in an app store/i,
    ),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Screenshot Shield' })).toHaveAttribute(
    'href',
    'https://youngsplace.github.io/screenshot-shield/?lang=en',
  );
  await expect(page.getByRole('link', { name: '한국어' })).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: '简体中文' })).toHaveAttribute('lang', 'zh-CN');

  await page.goto('./support.html?lang=zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '支持' })).toBeVisible();
  await expect(page.getByRole('link', { name: '简体中文编辑器' })).toHaveAttribute(
    'href',
    'https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN',
  );
  await expect(page.getByRole('link', { name: 'Screenshot Shield' })).toHaveAttribute(
    'href',
    'https://youngsplace.github.io/screenshot-shield/?lang=zh-CN',
  );
});

test('every public privacy locale states the web-only local boundary', async ({ page }) => {
  const locales = [
    {
      tag: 'ko',
      upload: /업로드 기능,\s*백엔드, 계정 또는 앱 서버가 없습니다/,
      analytics: /광고, 분석, 텔레메트리, 세션 재생/,
      native: /네이티브 iOS\/Android 앱은 현재 스토어에 출시되었거나 제공된 것으로 주장하지/,
      offline: /웹 앱에는 서비스 워커나 웹 오프라인 기능이 없습니다/,
    },
    {
      tag: 'en',
      upload: /no screenshot\/export upload\s+feature, backend, account system, or app server/i,
      analytics: /no ads, analytics, telemetry, session replay/i,
      native: /No iOS or Android native app is claimed as published or available in an app store/i,
      offline: /has no service worker and makes no web-offline claim/i,
    },
    {
      tag: 'zh-CN',
      upload: /没有截图或导出文件上传功能、后端、账户系统或应用服务器/,
      analytics: /没有广告、分析、遥测、会话回放/,
      native: /当前不宣称 iOS 或 Android 原生应用已在任何应用商店发布或可用/,
      offline: /网页应用没有服务工作线程，也不声明支持网页离线功能/,
    },
  ] as const;

  for (const locale of locales) {
    await page.goto(`./privacy.html?lang=${locale.tag}`);
    const article = page.locator(`article[data-language="${locale.tag}"]`);
    await expect(article).toBeVisible();
    await expect(article).toContainText(locale.upload);
    await expect(article).toContainText(locale.analytics);
    await expect(article).toContainText(locale.native);
    await expect(article).toContainText(locale.offline);
  }
});

test('public pages never claim offline or native-store availability', async ({ page }) => {
  for (const path of [
    './',
    './launch.html',
    './privacy.html?lang=ko',
    './privacy.html?lang=en',
    './privacy.html?lang=zh-CN',
    './support.html?lang=ko',
    './support.html?lang=en',
    './support.html?lang=zh-CN',
  ]) {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(
      /\boffline[- ]ready\b|\bworks fully offline\b|\bnative apps? (?:is|are) (?:now )?available\b|\bdownload on the app store\b|\bget it on google play\b|오프라인 지원 앱|네이티브 앱이 출시되었습니다|原生应用现已发布|支持离线使用/,
    );
    const runtimeState = await page.evaluate(async () => ({
      registrations:
        'serviceWorker' in navigator
          ? (await navigator.serviceWorker.getRegistrations()).map(
              (registration) => registration.scope,
            )
          : [],
      caches: typeof caches === 'undefined' ? [] : await caches.keys(),
    }));
    expect(runtimeState).toEqual({ registrations: [], caches: [] });
  }
});

test('manifest and declared icon paths resolve to installable assets', async ({ page }) => {
  await page.goto('./');

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).not.toBeNull();
  if (!manifestHref) throw new Error('The document does not declare a manifest.');

  const manifestUrl = new URL(manifestHref, page.url()).toString();
  const manifestResponse = await page.request.get(manifestUrl);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    start_url: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };
  expect(manifest.start_url).toBe('/screenshot-shield/?view=editor&installed=1');
  expect(manifest.icons).toEqual([
    {
      src: 'icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ]);

  for (const icon of manifest.icons) {
    expect(icon.type).toBe('image/png');
    const expectedSize = Number(icon.sizes.split('x')[0]);
    expect([192, 512]).toContain(expectedSize);
    const iconResponse = await page.request.get(new URL(icon.src, manifestUrl).toString());
    await expectPngAsset(iconResponse, expectedSize, icon.src);
  }

  const appleIconHref = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(appleIconHref).not.toBeNull();
  if (!appleIconHref) throw new Error('The document does not declare an Apple touch icon.');
  const appleIconResponse = await page.request.get(new URL(appleIconHref, page.url()).toString());
  await expectPngAsset(appleIconResponse, 180, appleIconHref);
});

test('language links are keyboard-focusable with reduced motion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  const englishLink = page.getByRole('link', { name: 'English', exact: true });
  await englishLink.focus();
  await expect(englishLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\?lang=en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Screenshot Shield/ })).toBeVisible();
  expect(errors, 'JS errors under prefers-reduced-motion: reduce').toEqual([]);
});
