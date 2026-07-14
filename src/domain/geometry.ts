import type { Point, Rect } from './types';

export const MIN_REDACTION_SIZE = 8;

export type ResizeHandle =
  'north' | 'north-east' | 'east' | 'south-east' | 'south' | 'south-west' | 'west' | 'north-west';

type RectBounds = Pick<Rect, 'width' | 'height'>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function minimumForBounds(minimum: number, available: number): number {
  return Math.min(minimum, Math.max(0, available));
}

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

export function clampRect(rect: Rect, bounds: RectBounds): Rect {
  const x = clamp(rect.x, 0, bounds.width);
  const y = clamp(rect.y, 0, bounds.height);
  const right = clamp(rect.x + rect.width, x, bounds.width);
  const bottom = clamp(rect.y + rect.height, y, bounds.height);
  return { x, y, width: right - x, height: bottom - y };
}

export function moveRect(rect: Rect, delta: Point, bounds: RectBounds): Rect {
  const clamped = clampRect(rect, bounds);
  return {
    ...clamped,
    x: clamp(clamped.x + delta.x, 0, Math.max(0, bounds.width - clamped.width)),
    y: clamp(clamped.y + delta.y, 0, Math.max(0, bounds.height - clamped.height)),
  };
}

export function resizeRect(
  rect: Rect,
  handle: ResizeHandle,
  point: Point,
  bounds: RectBounds,
  minimum = MIN_REDACTION_SIZE,
): Rect {
  const clamped = clampRect(rect, bounds);
  const minimumWidth = minimumForBounds(minimum, bounds.width);
  const minimumHeight = minimumForBounds(minimum, bounds.height);
  let left = clamped.x;
  let top = clamped.y;
  let right = clamped.x + clamped.width;
  let bottom = clamped.y + clamped.height;

  if (handle.includes('west')) left = clamp(point.x, 0, right - minimumWidth);
  if (handle.includes('east')) right = clamp(point.x, left + minimumWidth, bounds.width);
  if (handle.includes('north')) top = clamp(point.y, 0, bottom - minimumHeight);
  if (handle.includes('south')) bottom = clamp(point.y, top + minimumHeight, bounds.height);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height
  );
}

export function isMeaningfulRect(rect: Rect, minimum = 4): boolean {
  return rect.width >= minimum && rect.height >= minimum;
}

export function scaleRect(rect: Rect, scale: number): Rect {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}
