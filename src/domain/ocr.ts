import { observationsToSuggestions } from './detectors';
import { AppError, type ImageAsset, type SensitiveSuggestion, type TextObservation } from './types';

interface LocalOcrModule {
  recognize(asset: ImageAsset): Promise<TextObservation[]>;
}

export async function getLocalOcrSuggestions(asset: ImageAsset): Promise<SensitiveSuggestion[]> {
  try {
    const module = (await import('../ocr/localOcrClient')) as LocalOcrModule;
    const observations = await module.recognize(asset);
    return observationsToSuggestions(observations);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      'ocr-unavailable',
      'Local OCR is not available in this build. Manual redaction is still fully available.',
    );
  }
}
