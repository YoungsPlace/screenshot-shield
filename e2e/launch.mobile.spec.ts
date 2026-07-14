import { expect, test, type Page } from '@playwright/test';

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

test('launch story is visual, responsive, and free of third-party requests', async ({ page }) => {
  const thirdPartyRequests = trackThirdParty(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./launch.html');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/screenshot|safe|zoom/i);
  await expect(page.locator('[data-preview]')).toBeVisible();
  await expect(page.locator('iframe')).toBeVisible();

  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBe(width.client);
  expect(thirdPartyRequests).toEqual([]);
});

test('launch story switches Korean, English, and Chinese copy and preview state', async ({
  page,
}) => {
  await page.goto('./launch.html');

  await page.getByRole('button', { name: 'KO' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/[가-힣]/);

  await page.getByRole('button', { name: '中文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/[\u3400-\u9fff]/);

  const preview = page.locator('[data-preview]');
  await page.getByRole('button', { name: '遮盖前' }).click();
  await expect(preview).not.toHaveClass(/is-after/);
  await page.getByRole('button', { name: '遮盖后' }).click();
  await expect(preview).toHaveClass(/is-after/);

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('embedded launch editor exposes the real local workflow', async ({ page }) => {
  await page.goto('./launch.html');

  const frame = page.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: /local screenshot editor/i })).toBeVisible();
  await expect(frame.locator('input[type="file"]')).toBeAttached();
  await expect(frame.locator('.marketing-shell')).toHaveCount(0);
});

test('share action uses the native share surface when available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        document.documentElement.dataset.shared = 'true';
      },
    });
  });
  await page.goto('./launch.html');

  await page.locator('[data-share]:visible').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-shared', 'true');
  await expect(page.locator('[data-share-status]')).toContainText(/share/i);
});
