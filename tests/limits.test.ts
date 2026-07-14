import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_IMAGE_PIXELS,
  MAX_IMAGE_SIDE,
  validateImageDimensions,
  validateImageFile,
} from '../src/domain/limits';
import { AppError } from '../src/domain/types';

function syntheticFile(type: string, size = 1024): File {
  return new File([new Uint8Array(size)], 'test.png', { type });
}

describe('validateImageFile', () => {
  it('accepts supported MIME types without throwing', () => {
    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(() => validateImageFile(syntheticFile(type))).not.toThrow();
    }
  });

  it('throws AppError with code unsupported-type for unknown types', () => {
    let caught: unknown;
    try {
      validateImageFile(syntheticFile('text/plain'));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('unsupported-type');
    expect((caught as AppError).name).toBe('AppError');
  });

  it('throws AppError with code file-too-large when size exceeds limit', () => {
    let caught: unknown;
    try {
      validateImageFile(syntheticFile('image/png', MAX_FILE_BYTES + 1));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('file-too-large');
  });

  it('accepts a file exactly at the size limit', () => {
    expect(() => validateImageFile(syntheticFile('image/png', MAX_FILE_BYTES))).not.toThrow();
  });
});

describe('validateImageDimensions', () => {
  it('accepts valid dimensions', () => {
    expect(() => validateImageDimensions(1920, 1080)).not.toThrow();
    expect(() => validateImageDimensions(1, 1)).not.toThrow();
    expect(() => validateImageDimensions(MAX_IMAGE_SIDE, 1)).not.toThrow();
  });

  it('throws AppError with code image-too-large when a side exceeds limit', () => {
    let caught: unknown;
    try {
      validateImageDimensions(MAX_IMAGE_SIDE + 1, 100);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('image-too-large');
  });

  it('throws AppError for zero or negative dimensions', () => {
    for (const [w, h] of [
      [0, 100],
      [100, 0],
      [-1, 100],
    ]) {
      let caught: unknown;
      try {
        validateImageDimensions(w, h);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(AppError);
      expect((caught as AppError).code).toBe('image-too-large');
    }
  });

  it('throws AppError when total pixels exceed MAX_IMAGE_PIXELS', () => {
    // Use dimensions where neither side exceeds MAX_IMAGE_SIDE but product does
    const sideA = Math.ceil(Math.sqrt(MAX_IMAGE_PIXELS)) + 1;
    let caught: unknown;
    try {
      validateImageDimensions(sideA, sideA);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe('image-too-large');
  });
});

describe('AppError', () => {
  it('sets name to AppError', () => {
    const err = new AppError('export-failed', 'test message');
    expect(err.name).toBe('AppError');
    expect(err.code).toBe('export-failed');
    expect(err.message).toBe('test message');
    expect(err).toBeInstanceOf(Error);
  });
});
