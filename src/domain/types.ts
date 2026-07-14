export type RedactionMode = 'cover' | 'pixelate';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactionRegion extends Rect {
  id: string;
  mode: RedactionMode;
  label?: string;
  source: 'manual' | 'suggestion';
}

export interface ImageAsset {
  id: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  bitmap: ImageBitmap | HTMLImageElement;
  bytes: number;
}

export interface TextObservation {
  text: string;
  confidence?: number;
  box: Rect;
}

export type SensitivePatternKind =
  'email' | 'phone' | 'payment-card' | 'ipv4' | 'url-query' | 'token';

export interface SensitiveSuggestion extends Rect {
  id: string;
  kind: SensitivePatternKind;
  text: string;
  confidence: number;
}

export interface EditorSnapshot {
  regions: RedactionRegion[];
  selectedRegionId: string | null;
}

export interface ExportOptions {
  format: 'image/png' | 'image/jpeg';
  quality: number;
  regions: RedactionRegion[];
  background?: string;
}

export type AppErrorCode =
  | 'unsupported-type'
  | 'file-too-large'
  | 'image-too-large'
  | 'decode-failed'
  | 'canvas-unavailable'
  | 'export-failed'
  | 'ocr-unavailable';

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
