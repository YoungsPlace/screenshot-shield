import { AppError } from './types';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 12_000;
export const MAX_IMAGE_PIXELS = 80_000_000;

export function validateImageFile(file: File): void {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new AppError('unsupported-type', 'Choose a PNG, JPEG, or WebP screenshot.');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new AppError('file-too-large', 'Screenshot must be 20 MB or smaller.');
  }
}

export function validateImageDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0 || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) {
    throw new AppError('image-too-large', 'Screenshot dimensions are outside the supported range.');
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    throw new AppError('image-too-large', 'Screenshot has too many pixels for safe in-browser editing.');
  }
}
