import { AppError, type ImageAsset, type TextObservation } from '../domain/types';

export async function recognize(_asset: ImageAsset): Promise<TextObservation[]> {
  throw new AppError(
    'ocr-unavailable',
    'Local OCR assets are not bundled in this build. Manual redaction is still fully available.',
  );
}
