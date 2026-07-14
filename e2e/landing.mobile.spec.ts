import { expect, test } from '@playwright/test';

const THIRD_PARTY_HOST_RE = /^(?!127\.0\.0\.1$|localhost$|\[::1\]$)/i;

test('mobile landing remains readable and local-only', async ({ page }) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && THIRD_PARTY_HOST_RE.test(url.hostname)) {
      thirdPartyRequests.push(request.url());
    }
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();
  await expect(page.getByText(/paste|drop|select|import/i).first()).toBeVisible();
  await expect(page.getByText(/local|browser|same-origin|never leaves/i).first()).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  expect(thirdPartyRequests).toEqual([]);
});
