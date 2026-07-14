import { validateImageDimensions, validateImageFile } from './limits';
import { exportRedactedImage } from './redaction';
import { AppError, type ExportOptions, type ImageAsset } from './types';

function imageFromObjectUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new AppError('decode-failed', 'This image could not be decoded.'));
    image.decoding = 'async';
    image.src = url;
  });
}

export async function loadImageAsset(file: File): Promise<ImageAsset> {
  validateImageFile(file);
  const objectUrl = URL.createObjectURL(file);
  try {
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(
        () => null,
      );
      if (bitmap) {
        try {
          validateImageDimensions(bitmap.width, bitmap.height);
          return {
            id: crypto.randomUUID(),
            fileName: file.name || 'screenshot',
            mimeType: file.type,
            width: bitmap.width,
            height: bitmap.height,
            bitmap,
            bytes: file.size,
          };
        } catch (error) {
          bitmap.close();
          throw error;
        }
      }
    }

    const image = await imageFromObjectUrl(objectUrl);
    validateImageDimensions(image.naturalWidth, image.naturalHeight);
    return {
      id: crypto.randomUUID(),
      fileName: file.name || 'screenshot',
      mimeType: file.type,
      width: image.naturalWidth,
      height: image.naturalHeight,
      bitmap: image,
      bytes: file.size,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('decode-failed', 'This image could not be decoded.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function preparedImageFileName(format: ExportOptions['format']): string {
  return format === 'image/png'
    ? 'screenshot-shield-redacted.png'
    : 'screenshot-shield-redacted.jpg';
}

export async function prepareRedactedFile(
  asset: ImageAsset,
  options: ExportOptions,
): Promise<File> {
  const blob = await exportRedactedImage(asset, options);
  if (blob.type !== options.format) {
    throw new AppError('export-failed', 'The sanitized screenshot could not be exported.');
  }
  return new File([blob], preparedImageFileName(options.format), { type: options.format });
}

export function closeImageAsset(asset: ImageAsset | null): void {
  if (!asset) return;
  if ('close' in asset.bitmap && typeof asset.bitmap.close === 'function') {
    asset.bitmap.close();
  }
}
