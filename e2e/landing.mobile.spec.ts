import { expect, test, type Page } from '@playwright/test';

const THIRD_PARTY_HOST_RE = /^(?!127\.0\.0\.1$|localhost$|\[::1\]$)/i;

function trackThirdParty(page: Page): string[] {
  const reqs: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && THIRD_PARTY_HOST_RE.test(url.hostname)) {
      reqs.push(request.url());
    }
  });
  return reqs;
}

// ---------------------------------------------------------------------------
// 390px mobile — readable, no overflow, local-only
// ---------------------------------------------------------------------------
test('mobile landing (390px) — readable, no overflow, local-only', async ({ page }) => {
  const thirdPartyRequests = trackThirdParty(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');

  // Product name is present in every locale
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();

  // Some local-only privacy claim must be visible
  await expect(
    page.getByText(/local|browser|never leaves|locally|in-browser/i).first(),
  ).toBeVisible();

  // Primary CTA button is reachable
  await expect(page.getByRole('button').first()).toBeVisible();

  // First Tab target is focusable (keyboard entry point exists)
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();

  // No horizontal scroll at 390px
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows, '390px: horizontal overflow detected').toBe(false);

  expect(thirdPartyRequests, 'mobile: third-party requests').toEqual([]);
});

// ---------------------------------------------------------------------------
// 1440px desktop — readable, no overflow, local-only
// ---------------------------------------------------------------------------
test('desktop landing (1440px) — readable, no overflow, local-only', async ({ page }) => {
  const thirdPartyRequests = trackThirdParty(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');

  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();

  // No horizontal scroll at 1440px
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows, '1440px: horizontal overflow detected').toBe(false);

  expect(thirdPartyRequests, 'desktop: third-party requests').toEqual([]);
});

// ---------------------------------------------------------------------------
// Language switcher — KO / EN / 中文 cycle updates document.lang and visible copy
// ---------------------------------------------------------------------------
test('language switcher — KO / EN / 中文 cycle changes document lang and visible copy', async ({
  page,
}) => {
  await page.goto('./');

  // Lane A exposes short-label buttons: KO, EN, 中文 (from localeOptions[].shortLabel)
  const koControl = page.getByRole('button', { name: 'KO' });
  const zhControl = page.getByRole('button', { name: '中文' });
  const enControl = page.getByRole('button', { name: 'EN' });

  // --- Switch to Korean ---
  await koControl.first().click();
  const koLang = await page.evaluate(() => document.documentElement.lang);
  expect(koLang, 'document.lang after KO switch').toBe('ko');
  // First heading must contain at least one Hangul syllable
  const koHeading = await page.getByRole('heading').first().textContent();
  expect(koHeading, 'Korean heading contains Hangul').toMatch(
    /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
  );

  // --- Switch to Chinese ---
  await zhControl.first().click();
  const zhLang = await page.evaluate(() => document.documentElement.lang);
  expect(zhLang, 'document.lang after ZH switch').toBe('zh');
  // First heading must contain at least one CJK character
  const zhHeading = await page.getByRole('heading').first().textContent();
  expect(zhHeading, 'Chinese heading contains CJK').toMatch(/[\u4E00-\u9FFF\u3400-\u4DBF]/);

  // --- Switch back to English ---
  await enControl.first().click();
  const enLang = await page.evaluate(() => document.documentElement.lang);
  expect(enLang, 'document.lang after EN switch').toBe('en');
  // Product name (unchanged across locales) remains visible
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Localized hero and CTA are visible in each locale after switching
// ---------------------------------------------------------------------------
test('localized hero heading and primary CTA are visible in KO, EN, and ZH', async ({ page }) => {
  await page.goto('./');

  for (const locale of ['KO', 'EN', '中文'] as const) {
    const btn = page.getByRole('button', { name: locale });
    await btn.first().click();

    // Hero heading rendered (non-empty)
    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.trim().length, `${locale}: hero heading is non-empty`).toBeGreaterThan(0);

    // At least one actionable CTA button (the editor entry) is visible
    // The editor CTA is distinct from the locale switcher buttons
    const ctaButtons = page.getByRole('button').filter({
      hasNotText: /^(KO|EN|中文)$/,
    });
    await expect(ctaButtons.first(), `${locale}: primary CTA visible`).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// Language switcher controls are keyboard-focusable (Tab navigation)
// ---------------------------------------------------------------------------
test('language switcher buttons are keyboard-focusable via Tab', async ({ page }) => {
  await page.goto('./');

  // Tab through focusable elements; at least one should resolve to a locale control
  let foundSwitcher = false;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const activeText = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? '',
    );
    if (/^(KO|EN|中文)$/.test(activeText)) {
      foundSwitcher = true;
      // Confirm the focused control can be activated via keyboard
      await page.keyboard.press('Enter');
      break;
    }
  }
  expect(foundSwitcher, 'a locale switcher button is reachable via Tab').toBe(true);
});

// ---------------------------------------------------------------------------
// Reduced-motion — page loads cleanly and remains functional
// ---------------------------------------------------------------------------
test('reduced-motion — heading visible and no JS errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();
  // Primary CTA still reachable under reduced-motion
  await expect(page.getByRole('button').first()).toBeVisible();
  expect(errors, 'JS errors under prefers-reduced-motion: reduce').toEqual([]);
});
