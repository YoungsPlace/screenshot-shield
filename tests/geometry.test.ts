import { describe, expect, it } from 'vitest';
import {
  clampRect,
  isMeaningfulRect,
  normalizeRect,
  rectContainsPoint,
  scaleRect,
} from '../src/domain/geometry';
import type { Point, Rect } from '../src/domain/types';

describe('normalizeRect', () => {
  it('returns a rect with positive width and height for same-direction drag', () => {
    const result = normalizeRect({ x: 10, y: 20 }, { x: 50, y: 80 });
    expect(result).toEqual({ x: 10, y: 20, width: 40, height: 60 });
  });

  it('normalizes when end is top-left of start (reversed drag)', () => {
    const result = normalizeRect({ x: 50, y: 80 }, { x: 10, y: 20 });
    expect(result).toEqual({ x: 10, y: 20, width: 40, height: 60 });
  });

  it('handles horizontal-only drag', () => {
    const result = normalizeRect({ x: 5, y: 30 }, { x: 95, y: 30 });
    expect(result.width).toBe(90);
    expect(result.height).toBe(0);
  });

  it('produces zero dimensions for same-point drag', () => {
    const result = normalizeRect({ x: 20, y: 20 }, { x: 20, y: 20 });
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });
});

describe('clampRect', () => {
  const bounds = { width: 100, height: 200 };

  it('does not modify a rect already within bounds', () => {
    const rect: Rect = { x: 10, y: 10, width: 50, height: 80 };
    expect(clampRect(rect, bounds)).toEqual(rect);
  });

  it('clamps a rect that starts before origin', () => {
    const rect: Rect = { x: -10, y: -5, width: 40, height: 30 };
    const result = clampRect(rect, bounds);
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
  });

  it('clamps a rect that extends past the right/bottom edge', () => {
    const rect: Rect = { x: 80, y: 150, width: 60, height: 100 };
    const result = clampRect(rect, bounds);
    expect(result.x + result.width).toBeLessThanOrEqual(bounds.width);
    expect(result.y + result.height).toBeLessThanOrEqual(bounds.height);
  });
});

describe('rectContainsPoint', () => {
  const rect: Rect = { x: 10, y: 20, width: 50, height: 40 };

  it('returns true for a point inside', () => {
    const point: Point = { x: 30, y: 40 };
    expect(rectContainsPoint(rect, point)).toBe(true);
  });

  it('returns false for a point outside', () => {
    const point: Point = { x: 5, y: 40 };
    expect(rectContainsPoint(rect, point)).toBe(false);
  });

  it('returns true for a point on the left edge', () => {
    expect(rectContainsPoint(rect, { x: 10, y: 40 })).toBe(true);
  });

  it('returns false for a point just outside the right edge', () => {
    expect(rectContainsPoint(rect, { x: 61, y: 40 })).toBe(false);
  });
});

describe('isMeaningfulRect', () => {
  it('returns true for a rect >= 4x4', () => {
    expect(isMeaningfulRect({ x: 0, y: 0, width: 10, height: 10 })).toBe(true);
    expect(isMeaningfulRect({ x: 0, y: 0, width: 4, height: 4 })).toBe(true);
  });

  it('returns false for a rect smaller than 4x4', () => {
    expect(isMeaningfulRect({ x: 0, y: 0, width: 3, height: 10 })).toBe(false);
    expect(isMeaningfulRect({ x: 0, y: 0, width: 10, height: 3 })).toBe(false);
    expect(isMeaningfulRect({ x: 0, y: 0, width: 0, height: 0 })).toBe(false);
  });
});

describe('scaleRect', () => {
  it('scales all dimensions by the given factor', () => {
    const rect: Rect = { x: 10, y: 20, width: 50, height: 80 };
    const result = scaleRect(rect, 2);
    expect(result).toEqual({ x: 20, y: 40, width: 100, height: 160 });
  });

  it('scales down with factor < 1', () => {
    const rect: Rect = { x: 100, y: 200, width: 400, height: 800 };
    const result = scaleRect(rect, 0.5);
    expect(result).toEqual({ x: 50, y: 100, width: 200, height: 400 });
  });

  it('returns zero dimensions for scale 0', () => {
    const rect: Rect = { x: 10, y: 20, width: 50, height: 80 };
    const result = scaleRect(rect, 0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });
});
