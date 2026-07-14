import type { ExportOptions, ImageAsset, RedactionRegion } from './types';
import { AppError } from './types';

export function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new AppError('canvas-unavailable', 'Canvas rendering is unavailable in this browser.');
  return context;
}

export function drawBaseImage(canvas: HTMLCanvasElement, asset: ImageAsset): void {
  canvas.width = asset.width;
  canvas.height = asset.height;
  const context = getCanvasContext(canvas);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, asset.width, asset.height);
  context.drawImage(asset.bitmap, 0, 0, asset.width, asset.height);
}

export function applyRedaction(context: CanvasRenderingContext2D, region: RedactionRegion): void {
  if (region.width <= 0 || region.height <= 0) return;
  if (region.mode === 'pixelate') {
    const scratch = document.createElement('canvas');
    scratch.width = Math.max(1, Math.floor(region.width / 12));
    scratch.height = Math.max(1, Math.floor(region.height / 12));
    const scratchContext = getCanvasContext(scratch);
    scratchContext.imageSmoothingEnabled = true;
    scratchContext.drawImage(
      context.canvas,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      scratch.width,
      scratch.height,
    );
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(scratch, 0, 0, scratch.width, scratch.height, region.x, region.y, region.width, region.height);
    context.fillStyle = 'rgba(0, 0, 0, 0.24)';
    context.fillRect(region.x, region.y, region.width, region.height);
    context.restore();
    return;
  }

  context.fillStyle = '#05070d';
  context.fillRect(region.x, region.y, region.width, region.height);
}

export function renderRedactedCanvas(asset: ImageAsset, options: ExportOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  drawBaseImage(canvas, asset);
  const context = getCanvasContext(canvas);
  for (const region of options.regions) applyRedaction(context, region);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: ExportOptions['format'], quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new AppError('export-failed', 'The sanitized screenshot could not be exported.'));
      },
      format,
      format === 'image/jpeg' ? quality : undefined,
    );
  });
}

export async function exportRedactedImage(asset: ImageAsset, options: ExportOptions): Promise<Blob> {
  return canvasToBlob(renderRedactedCanvas(asset, options), options.format, options.quality);
}
