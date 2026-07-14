import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { inflateSync, deflateSync } from 'node:zlib';

const THIRD_PARTY_HOST_RE = /^(?!127\.0\.0\.1$|localhost$|\[::1\]$)/i;

type DecodedPng = {
  width: number;
  height: number;
  rgba: Uint8Array;
};

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function syntheticPng(width = 320, height = 180): Buffer {
  const rgba = Buffer.alloc(width * height * 4, 255);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      rgba[offset] = 244;
      rgba[offset + 1] = 247;
      rgba[offset + 2] = 251;
      if (x > 24 && x < 296 && y > 28 && y < 152) {
        rgba[offset] = 255;
        rgba[offset + 1] = 255;
        rgba[offset + 2] = 255;
      }
      if (x > 42 && x < 278 && y > 70 && y < 96) {
        rgba[offset] = 32;
        rgba[offset + 1] = 48;
        rgba[offset + 2] = 70;
      }
    }
  }

  const rawRows: Buffer[] = [];
  for (let y = 0; y < height; y += 1) {
    rawRows.push(Buffer.from([0]), rgba.subarray(y * width * 4, (y + 1) * width * 4));
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.concat(rawRows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function decodePng(buffer: Buffer): DecodedPng {
  expect(
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ).toBe(true);
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8], 'PNG bit depth').toBe(8);
      expect(data[9], 'PNG color type').toBe(6);
    }
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
    offset += 12 + length;
  }

  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rgba = new Uint8Array(width * height * 4);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowDest = y * stride;
    const raw = inflated.subarray(sourceOffset, sourceOffset + stride);
    for (let x = 0; x < stride; x += 1) {
      const above = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const left = x >= 4 ? rgba[rowDest + x - 4] : 0;
      const aboveLeft = x >= 4 && y > 0 ? rgba[(y - 1) * stride + x - 4] : 0;
      let value = raw[x];
      if (filter === 0) value = raw[x];
      else if (filter === 1) value = (raw[x] + left) & 0xff;
      else if (filter === 2) value = (raw[x] + above) & 0xff;
      else if (filter === 3) value = (raw[x] + Math.floor((left + above) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + above - aboveLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - above);
        const pc = Math.abs(p - aboveLeft);
        value = (raw[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? above : aboveLeft)) & 0xff;
      }
      rgba[rowDest + x] = value;
    }
    sourceOffset += stride;
  }
  return { width, height, rgba };
}

async function importSyntheticScreenshot(page: Page): Promise<void> {
  const input = page.locator('input[type="file"]').first();
  await expect(input, 'file picker input').toBeAttached();
  await input.setInputFiles({
    name: 'synthetic-dashboard.png',
    mimeType: 'image/png',
    buffer: syntheticPng(),
  });
}

async function editorCanvas(page: Page) {
  const canvas = page.locator('canvas').first();
  await expect(canvas, 'editor canvas').toBeVisible();
  return canvas;
}

test('landing, detector copy, keyboard focus, mobile layout, and zero third-party egress', async ({
  page,
  browserName,
}) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && THIRD_PARTY_HOST_RE.test(url.hostname)) {
      thirdPartyRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();
  await expect(page.getByText(/browser|local|same-origin|never leaves/i).first()).toBeVisible();
  for (const detector of [
    /email/i,
    /phone/i,
    /payment|card/i,
    /IPv4|IP address/i,
    /URL|query/i,
    /token|long ID/i,
  ]) {
    await expect(page.getByText(detector).first()).toBeVisible();
  }

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();

  expect(thirdPartyRequests, `${browserName} made third-party requests`).toEqual([]);
});

test('import, manual redaction, and PNG export use a fresh opaque canvas', async ({ page }) => {
  await page.goto('/');
  await importSyntheticScreenshot(page);

  await editorCanvas(page);
  const drawingLayer = page.locator('.region-layer');
  await expect(drawingLayer, 'redaction drawing layer').toBeVisible();
  await drawingLayer.scrollIntoViewIfNeeded();
  const box = await drawingLayer.boundingBox();
  expect(box, 'redaction layer bounds').toBeTruthy();
  if (!box) return;

  const manualButton = page.getByRole('button', { name: /manual|rectangle|redact/i }).first();
  if (await manualButton.isVisible().catch(() => false)) await manualButton.click();

  await drawingLayer.hover({ position: { x: box.width * 0.2, y: box.height * 0.36 } });
  await page.mouse.down();
  await drawingLayer.hover({ position: { x: box.width * 0.82, y: box.height * 0.58 } });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: /undo/i })).toBeEnabled();

  // Read the actual region box position (inline style px values equal image coords at zoom 1)
  const regionBox = page.locator('.region-box').first();
  await expect(regionBox).toBeVisible();
  const regionStyle = await regionBox.evaluate((el: HTMLElement) => {
    const { left, top, width, height } = el.style;
    return {
      left: parseFloat(left),
      top: parseFloat(top),
      width: parseFloat(width),
      height: parseFloat(height),
    };
  });

  const download = await Promise.all([
    page.waitForEvent('download'),
    page
      .getByRole('button', { name: /export.*png|download.*png|png/i })
      .first()
      .click(),
  ]).then(([file]) => file);
  const downloadPath = await download.path();
  expect(downloadPath, 'download path').toBeTruthy();
  if (!downloadPath) return;

  const decoded = decodePng(await readFile(downloadPath));
  expect(decoded.width).toBe(320);
  expect(decoded.height).toBe(180);

  // Sample the center of the actual drawn region (zoom=1 → style px = image px)
  const sampleX = Math.round(regionStyle.left + regionStyle.width / 2);
  const sampleY = Math.round(regionStyle.top + regionStyle.height / 2);
  const offset = (sampleY * decoded.width + sampleX) * 4;
  expect(decoded.rgba[offset + 3], 'redaction alpha is opaque').toBe(255);
  expect(
    decoded.rgba[offset] + decoded.rgba[offset + 1] + decoded.rgba[offset + 2],
    'redaction pixel is covered',
  ).toBeLessThan(90);
});

test('typed import failure is user-facing', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('input[type="file"]').first();
  await expect(input).toBeAttached();
  await input.setInputFiles({
    name: 'not-a-screenshot.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('synthetic non-image fixture'),
  });
  await expect(
    page
      .getByRole('alert')
      .or(page.getByText(/unsupported|invalid|image type|png|jpeg|webp/i))
      .first(),
  ).toBeVisible();
});
