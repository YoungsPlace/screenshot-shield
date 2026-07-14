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

function byteChecksum(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
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

async function drawManualRedaction(page: Page): Promise<void> {
  const drawingLayer = page.locator('.region-layer');
  await expect(drawingLayer, 'redaction drawing layer').toBeVisible();
  await drawingLayer.scrollIntoViewIfNeeded();

  const box = await drawingLayer.boundingBox();
  expect(box, 'redaction layer bounds').toBeTruthy();
  if (!box) throw new Error('The redaction layer has no bounds.');

  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.45, { steps: 4 });
  await page.mouse.up();

  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
}

async function touchDrag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, id: 1 }],
    });
    for (let step = 1; step <= 5; step += 1) {
      const progress = step / 5;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: from.x + (to.x - from.x) * progress,
            y: from.y + (to.y - from.y) * progress,
            id: 1,
          },
        ],
      });
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test('English landing exposes detector review coverage and has no third-party egress', async ({
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

  await page.goto('./?lang=en');
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();
  await expect(
    page.getByText(/browser|local|same-origin|never leaves|locally|in-browser/i).first(),
  ).toBeVisible();

  for (const detector of [
    /email/i,
    /phone|sms/i,
    /payment|card|credit/i,
    /ip.?v?4|ip address/i,
    /url|query|param/i,
    /token|long.?id|api.?key/i,
  ]) {
    await expect(page.getByText(detector).first()).toBeVisible();
  }

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: /screenshot shield/i })).toBeVisible();

  expect(thirdPartyRequests, `${browserName} made third-party requests`).toEqual([]);
});

test('synthetic screenshots do not produce synthetic OCR suggestions or redactions', async ({
  page,
}) => {
  await page.goto('./?view=editor&lang=en');
  await importSyntheticScreenshot(page);

  await page.getByRole('button', { name: 'Review local suggestions' }).click();
  await expect(page.getByRole('status').first()).toContainText(
    'Automatic suggestions are unavailable.',
  );
  await expect(page.getByRole('list', { name: 'Detection suggestions' })).toBeEmpty();
  await expect(page.getByRole('list', { name: 'Redaction regions' })).toContainText(
    'No redactions yet.',
  );
});

test('prepared PNG is both downloaded and shared as the same fresh redacted file', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const persistenceActivity: string[] = [];
    Object.defineProperty(window, '__shieldPersistenceActivity', {
      configurable: true,
      value: persistenceActivity,
    });

    const originalSetItem = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value(this: Storage, key: string, value: string) {
        const area =
          this === window.localStorage
            ? 'local'
            : this === window.sessionStorage
              ? 'session'
              : 'unknown';
        persistenceActivity.push(`storage:${area}:${key}:${value}`);
        return originalSetItem.call(this, key, value);
      },
    });

    if (typeof IDBFactory !== 'undefined') {
      const originalOpen = IDBFactory.prototype.open;
      Object.defineProperty(IDBFactory.prototype, 'open', {
        configurable: true,
        value(this: IDBFactory, ...args: unknown[]) {
          persistenceActivity.push(`indexeddb:${String(args[0] ?? '')}`);
          return Reflect.apply(originalOpen, this, args);
        },
      });
    }
    if (typeof CacheStorage !== 'undefined') {
      const originalOpen = CacheStorage.prototype.open;
      Object.defineProperty(CacheStorage.prototype, 'open', {
        configurable: true,
        value(this: CacheStorage, ...args: unknown[]) {
          persistenceActivity.push(`cache:${String(args[0] ?? '')}`);
          return Reflect.apply(originalOpen, this, args);
        },
      });
    }
    if (typeof ServiceWorkerContainer !== 'undefined') {
      const originalRegister = ServiceWorkerContainer.prototype.register;
      Object.defineProperty(ServiceWorkerContainer.prototype, 'register', {
        configurable: true,
        value(this: ServiceWorkerContainer, ...args: unknown[]) {
          persistenceActivity.push(`service-worker:${String(args[0] ?? '')}`);
          return Reflect.apply(originalRegister, this, args);
        },
      });
    }

    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data: { files?: File[] }) => Array.isArray(data.files) && data.files.length === 1,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: { files: File[] }) => {
        const file = data.files[0];
        const bytes = new Uint8Array(await file.arrayBuffer());
        let hash = 0x811c9dc5;
        for (const byte of bytes) {
          hash ^= byte;
          hash = Math.imul(hash, 0x01000193);
        }
        document.documentElement.dataset.sharedFileName = file.name;
        document.documentElement.dataset.sharedFileType = file.type;
        document.documentElement.dataset.sharedFileChecksum = (hash >>> 0)
          .toString(16)
          .padStart(8, '0');
      },
    });
  });

  const expectedOrigin = new URL(
    process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/screenshot-shield/',
  ).origin;
  const lifecycleRequests: string[] = [];
  const webSockets: string[] = [];
  let imageLifecycleStarted = false;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!url.protocol.startsWith('http')) return;

    const allowedBootstrapRequest =
      !imageLifecycleStarted &&
      request.method() === 'GET' &&
      url.origin === expectedOrigin &&
      ((request.isNavigationRequest() && url.pathname === '/screenshot-shield/') ||
        (url.search === '' &&
          (/^\/screenshot-shield\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(url.pathname) ||
            url.pathname === '/screenshot-shield/manifest.webmanifest' ||
            /^\/screenshot-shield\/icons\/[A-Za-z0-9_-]+\.png$/.test(url.pathname))));
    if (!allowedBootstrapRequest) {
      lifecycleRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  page.on('websocket', (socket) => webSockets.push(socket.url()));

  await page.goto('./?view=editor&installed=1&lang=en');
  imageLifecycleStarted = true;

  await importSyntheticScreenshot(page);
  await editorCanvas(page);
  const prepareButton = page.getByRole('button', { name: 'Prepare redacted file' });
  await expect(prepareButton).toBeDisabled();
  await drawManualRedaction(page);
  await expect(prepareButton).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Download or save' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();

  const regionBox = page.locator('.region-box').first();
  await expect(regionBox).toBeVisible();
  const regionStyle = await regionBox.evaluate((element: HTMLElement) => {
    const { left, top, width, height } = element.style;
    return {
      left: parseFloat(left),
      top: parseFloat(top),
      width: parseFloat(width),
      height: parseFloat(height),
    };
  });

  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download or save' }).click(),
  ]).then(([file]) => file);
  expect(download.suggestedFilename()).toBe('screenshot-shield-redacted.png');

  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-shared-file-name',
    download.suggestedFilename(),
  );
  await expect(page.locator('html')).toHaveAttribute('data-shared-file-type', 'image/png');
  await expect(
    page.getByText('Shared. The prepared file is still available to download or save.'),
  ).toBeVisible();

  const downloadPath = await download.path();
  expect(downloadPath, 'download path').toBeTruthy();
  if (!downloadPath) return;

  const downloadedBytes = await readFile(downloadPath);
  const initialChecksum = byteChecksum(downloadedBytes);
  await expect(page.locator('html')).toHaveAttribute('data-shared-file-checksum', initialChecksum);
  expect(
    downloadedBytes.equals(syntheticPng()),
    'prepared output must not reuse source bytes',
  ).toBe(false);

  const decoded = decodePng(downloadedBytes);
  expect(decoded.width).toBe(320);
  expect(decoded.height).toBe(180);

  const sampleX = Math.round(regionStyle.left + regionStyle.width / 2);
  const sampleY = Math.round(regionStyle.top + regionStyle.height / 2);
  const offset = (sampleY * decoded.width + sampleX) * 4;
  expect(decoded.rgba[offset + 3], 'redaction alpha is opaque').toBe(255);
  expect(
    decoded.rgba[offset] + decoded.rgba[offset + 1] + decoded.rgba[offset + 2],
    'redaction pixel is covered',
  ).toBeLessThan(90);

  const moveRightForRegeneration = page.getByRole('button', { name: 'Move right' });
  for (let step = 0; step < 8; step += 1) {
    await moveRightForRegeneration.click();
  }
  await expect(page.getByRole('button', { name: 'Download or save' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toHaveCount(0);
  const movedStyleLeft = await regionBox.evaluate((element: HTMLElement) =>
    parseFloat(element.style.left),
  );
  expect(movedStyleLeft, 'moved redaction source position').toBeGreaterThan(regionStyle.left);

  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toBeVisible();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect
    .poll(() => page.locator('html').getAttribute('data-shared-file-checksum'), {
      message: 'moved redaction checksum',
    })
    .not.toBe(initialChecksum);
  const movedChecksum = await page.locator('html').getAttribute('data-shared-file-checksum');
  expect(movedChecksum).toBeTruthy();

  await page.getByRole('button', { name: 'Make wider' }).click();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect
    .poll(() => page.locator('html').getAttribute('data-shared-file-checksum'), {
      message: 'resized redaction checksum',
    })
    .not.toBe(movedChecksum);
  const resizedChecksum = await page.locator('html').getAttribute('data-shared-file-checksum');
  expect(resizedChecksum).toBeTruthy();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-shared-file-checksum',
    movedChecksum ?? '',
  );

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-shared-file-checksum',
    resizedChecksum ?? '',
  );

  await page.locator('#format').selectOption('image/jpeg');
  await expect(page.getByRole('button', { name: 'Download or save' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toBeVisible();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shared-file-type', 'image/jpeg');
  await expect(page.locator('html')).toHaveAttribute(
    'data-shared-file-name',
    'screenshot-shield-redacted.jpg',
  );
  const jpegChecksum = await page.locator('html').getAttribute('data-shared-file-checksum');
  expect(jpegChecksum, 'JPEG regeneration checksum').not.toBe(resizedChecksum);

  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: 'replacement-screenshot.png',
      mimeType: 'image/png',
      buffer: syntheticPng(240, 160),
    });
  await expect.poll(() => page.locator('canvas').first().getAttribute('width')).toBe('240');
  await expect(page.getByRole('button', { name: 'Download or save' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeDisabled();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toHaveCount(0);

  await page.locator('#format').selectOption('image/png');
  await page.getByRole('button', { name: 'Add manual redaction' }).click();
  await page.getByRole('button', { name: 'Prepare redacted file' }).click();
  await expect(page.getByText('Your redacted file is ready to share or save.')).toBeVisible();

  const replacementDownload = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download or save' }).click(),
  ]).then(([file]) => file);
  const replacementPath = await replacementDownload.path();
  expect(replacementPath, 'replacement download path').toBeTruthy();
  if (!replacementPath) return;
  const replacementBytes = await readFile(replacementPath);
  const replacementDecoded = decodePng(replacementBytes);
  expect(replacementDecoded.width).toBe(240);
  expect(replacementDecoded.height).toBe(160);

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-shared-file-checksum',
    byteChecksum(replacementBytes),
  );
  expect(byteChecksum(replacementBytes), 'replacement source checksum').not.toBe(jpegChecksum);

  const persistence = await page.evaluate(async () => ({
    activity:
      (window as Window & { __shieldPersistenceActivity?: string[] }).__shieldPersistenceActivity ??
      [],
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    databases:
      typeof indexedDB.databases === 'function'
        ? (await indexedDB.databases()).map((database) => database.name ?? '')
        : [],
    caches: typeof caches === 'undefined' ? [] : await caches.keys(),
    registrations:
      'serviceWorker' in navigator
        ? (await navigator.serviceWorker.getRegistrations()).map(
            (registration) => registration.scope,
          )
        : [],
    cookie: document.cookie,
  }));
  expect(persistence).toEqual({
    activity: ['storage:local:screenshot-shield.locale:en'],
    local: [['screenshot-shield.locale', 'en']],
    session: [],
    databases: [],
    caches: [],
    registrations: [],
    cookie: '',
  });
  expect(lifecycleRequests, 'image lifecycle network egress').toEqual([]);
  expect(webSockets, 'image lifecycle WebSocket egress').toEqual([]);
});

const keyboardLocales = [
  {
    tag: 'ko',
    add: '수동 가리기 영역 추가',
    moveRight: '오른쪽으로 이동',
    makeWider: '넓게',
    remove: '선택한 영역 삭제',
    regionsList: '가리기 영역 목록',
    noRegions: '아직 가리기 영역이 없습니다.',
    prepare: '가린 파일 준비',
    prepared: '공유 또는 저장할 가린 파일이 준비되었습니다.',
    download: '다운로드 또는 저장',
    share: '공유',
    shared: '공유가 완료되었습니다. 준비된 파일은 계속 다운로드하거나 저장할 수 있습니다.',
    unsupported: 'PNG, JPEG 또는 WebP 이미지만 선택할 수 있습니다.',
  },
  {
    tag: 'en',
    add: 'Add manual redaction',
    moveRight: 'Move right',
    makeWider: 'Make wider',
    remove: 'Remove selected',
    regionsList: 'Redaction regions',
    noRegions: 'No redactions yet.',
    prepare: 'Prepare redacted file',
    prepared: 'Your redacted file is ready to share or save.',
    download: 'Download or save',
    share: 'Share',
    shared: 'Shared. The prepared file is still available to download or save.',
    unsupported: 'Select a PNG, JPEG, or WebP image.',
  },
  {
    tag: 'zh-CN',
    add: '添加手动遮盖',
    moveRight: '向右移动',
    makeWider: '加宽',
    remove: '删除所选区域',
    regionsList: '遮盖区域列表',
    noRegions: '尚未添加遮盖。',
    prepare: '准备遮盖后的文件',
    prepared: '遮盖后的文件已准备好，可分享或保存。',
    download: '下载或保存',
    share: '分享',
    shared: '已分享。准备好的文件仍可下载或保存。',
    unsupported: '请选择 PNG、JPEG 或 WebP 图片。',
  },
] as const;

for (const locale of keyboardLocales) {
  test(`keyboard users can complete manual redaction controls in ${locale.tag}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: (data: { files?: File[] }) => Array.isArray(data.files) && data.files.length === 1,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async () => undefined,
      });
    });
    await page.goto(`./?view=editor&lang=${locale.tag}`);
    await importSyntheticScreenshot(page);
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toHaveAttribute('tabindex', '-1');
    await expect(fileInput).toHaveAttribute('aria-hidden', 'true');

    const addButton = page.getByRole('button', { name: locale.add });
    await addButton.focus();
    await page.keyboard.press('Enter');

    const region = page.locator('[data-region-id]').first();
    await expect(region).toBeVisible();
    const before = await region.boundingBox();
    expect(before, 'manual redaction bounds before keyboard adjustment').toBeTruthy();
    if (!before) throw new Error('The manual redaction has no bounds.');

    const moveRight = page.getByRole('button', { name: locale.moveRight });
    await moveRight.focus();
    await page.keyboard.press('Enter');
    const moved = await region.boundingBox();
    expect(moved?.x, 'manual redaction x after keyboard move').toBeGreaterThan(before.x);

    const makeWider = page.getByRole('button', { name: locale.makeWider });
    await makeWider.focus();
    await page.keyboard.press('Enter');
    const resized = await region.boundingBox();
    expect(resized?.width, 'manual redaction width after keyboard resize').toBeGreaterThan(
      moved?.width ?? before.width,
    );

    const prepare = page.getByRole('button', { name: locale.prepare });
    await prepare.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(locale.prepared)).toBeVisible();
    await expect(page.getByRole('button', { name: locale.download })).toBeEnabled();

    const localizedDownload = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: locale.download }).click(),
    ]).then(([file]) => file);
    expect(localizedDownload.suggestedFilename()).toBe('screenshot-shield-redacted.png');

    const share = page.getByRole('button', { name: locale.share, exact: true });
    await share.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(locale.shared)).toBeVisible();

    const remove = page.getByRole('button', { name: locale.remove });
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('list', { name: locale.regionsList })).toContainText(
      locale.noRegions,
    );
    await expect(prepare).toBeDisabled();
    await expect(page.getByText(locale.prepared)).toHaveCount(0);

    await fileInput.setInputFiles({
      name: 'not-an-image.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('synthetic invalid image'),
    });
    await expect(page.getByRole('alert')).toContainText(locale.unsupported);
  });
}

test('touch users can move, resize, and delete a selected redaction', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== 'chromium' || testInfo.project.name !== 'mobile-chromium',
    'requires Chromium touch emulation',
  );

  await page.goto('./?view=editor&lang=en');
  await importSyntheticScreenshot(page);
  const drawingLayer = page.locator('.region-layer');
  await expect(drawingLayer).toBeVisible();
  const drawingBox = await drawingLayer.boundingBox();
  expect(drawingBox, 'redaction layer bounds for touch creation').toBeTruthy();
  if (!drawingBox) throw new Error('The redaction layer has no bounds for touch creation.');
  await touchDrag(
    page,
    { x: drawingBox.x + drawingBox.width * 0.15, y: drawingBox.y + drawingBox.height * 0.15 },
    { x: drawingBox.x + drawingBox.width * 0.75, y: drawingBox.y + drawingBox.height * 0.85 },
  );
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

  const region = page.locator('[data-region-id]').first();
  const beforeMove = await region.boundingBox();
  expect(beforeMove, 'redaction bounds before touch move').toBeTruthy();
  if (!beforeMove) throw new Error('The redaction has no bounds before touch move.');

  const moveStart = {
    x: beforeMove.x + beforeMove.width / 2,
    y: beforeMove.y + beforeMove.height / 2,
  };
  await touchDrag(page, moveStart, { x: moveStart.x + 24, y: moveStart.y + 16 });

  const afterMove = await region.boundingBox();
  expect(afterMove, 'redaction bounds after touch move').toBeTruthy();
  if (!afterMove) throw new Error('The redaction has no bounds after touch move.');
  expect(afterMove.x).toBeGreaterThan(beforeMove.x + 8);
  expect(afterMove.y).toBeGreaterThan(beforeMove.y + 8);

  const eastHandle = page.locator('[data-resize-handle="east"]');
  await expect(eastHandle).toBeVisible();
  const beforeResize = await region.boundingBox();
  const handleBox = await eastHandle.boundingBox();
  expect(beforeResize, 'redaction bounds before touch resize').toBeTruthy();
  expect(handleBox, 'east resize handle bounds').toBeTruthy();
  if (!beforeResize || !handleBox) {
    throw new Error('The selected redaction cannot be resized.');
  }

  const resizeStart = {
    x: handleBox.x + handleBox.width / 2,
    y: handleBox.y + handleBox.height / 2,
  };
  await touchDrag(page, resizeStart, { x: resizeStart.x + 24, y: resizeStart.y });

  const afterResize = await region.boundingBox();
  expect(afterResize, 'redaction bounds after touch resize').toBeTruthy();
  if (!afterResize) throw new Error('The redaction has no bounds after touch resize.');
  expect(afterResize.width).toBeGreaterThan(beforeResize.width + 8);

  await page.getByRole('button', { name: 'Remove selected' }).tap();
  await expect(page.getByRole('list', { name: 'Redaction regions' })).toContainText(
    'No redactions yet.',
  );
});

test('typed import failure is user-facing', async ({ page }) => {
  await page.goto('./?view=editor&lang=en');
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
