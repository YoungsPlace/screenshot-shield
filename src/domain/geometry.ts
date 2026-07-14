import type { Point, Rect } from './types';

export function normalizeRect(start: Point, end: Point): Rect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function clampRect(rect: Rect, bounds: Pick<Rect, 'width' | 'height'>): Rect {
  const x = Math.max(0, Math.min(rect.x, bounds.width));
  const y = Math.max(0, Math.min(rect.y, bounds.height));
  const right = Math.max(x, Math.min(rect.x + rect.width, bounds.width));
  const bottom = Math.max(y, Math.min(rect.y + rect.height, bounds.height));
  return { x, y, width: right - x, height: bottom - y };
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  );
}

export function isMeaningfulRect(rect: Rect): boolean {
  return rect.width >= 4 && rect.height >= 4;
}

export function scaleRect(rect: Rect, scale: number): Rect {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}
