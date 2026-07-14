import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/domain/types';

describe('export module typed failures', () => {
  it('getCanvasContext throws AppError canvas-unavailable when context is null', async () => {
    // Import the module under test
    const { getCanvasContext } = await import('../src/domain/redaction');

    // Create a canvas and mock getContext to return null
    const fakeCanvas = document.createElement('canvas');
    vi.spyOn(fakeCanvas, 'getContext').mockReturnValueOnce(null);

    let caught: unknown;
    try {
      getCanvasContext(fakeCanvas);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('canvas-unavailable');
  });

  it('canvasToBlob rejects with AppError export-failed when toBlob returns null', async () => {
    const { canvasToBlob } = await import('../src/domain/redaction');

    const fakeCanvas = document.createElement('canvas');
    vi.spyOn(fakeCanvas, 'toBlob').mockImplementationOnce((cb) => cb(null));

    let caught: unknown;
    try {
      await canvasToBlob(fakeCanvas, 'image/png', 1);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('export-failed');
  });

  it('renderRedactedCanvas creates a fresh canvas element (with mocked context)', async () => {
    const { renderRedactedCanvas } = await import('../src/domain/redaction');

    const fakeAsset = {
      id: 'test',
      fileName: 'test.png',
      mimeType: 'image/png',
      width: 100,
      height: 80,
      bitmap: { width: 100, height: 80 } as ImageBitmap,
      bytes: 100,
    };

    // jsdom does not support canvas 2d; mock getContext on the prototype
    const mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      imageSmoothingEnabled: true,
    } as unknown as CanvasRenderingContext2D;
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(mockCtx as unknown as ReturnType<HTMLCanvasElement['getContext']>);

    try {
      const canvas = renderRedactedCanvas(fakeAsset, {
        format: 'image/png',
        quality: 1,
        regions: [],
      });
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(80);
    } finally {
      getContextSpy.mockRestore();
    }
  });

  it('applyRedaction skips zero-size regions', async () => {
    const { applyRedaction } = await import('../src/domain/redaction');

    const fakeCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
      canvas: document.createElement('canvas'),
    } as unknown as CanvasRenderingContext2D;

    applyRedaction(fakeCtx, {
      id: 'r1',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      mode: 'cover',
      source: 'manual',
    });

    expect(fakeCtx.fillRect).not.toHaveBeenCalled();
  });

  it('applyRedaction cover mode fills with a dark color', async () => {
    const { applyRedaction } = await import('../src/domain/redaction');

    const calls: string[] = [];
    const fakeCtx = {
      get fillStyle() {
        return '';
      },
      set fillStyle(v: string) {
        calls.push(v);
      },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
      canvas: document.createElement('canvas'),
    } as unknown as CanvasRenderingContext2D;

    applyRedaction(fakeCtx, {
      id: 'r1',
      x: 10,
      y: 10,
      width: 50,
      height: 30,
      mode: 'cover',
      source: 'manual',
    });

    expect(fakeCtx.fillRect).toHaveBeenCalledWith(10, 10, 50, 30);
    expect(calls.length).toBeGreaterThan(0);
  });
});
