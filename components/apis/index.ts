// Advanced Product Identification System (APIS) Components
export { default as SmartIdentificationWizard } from './SmartIdentificationWizard';
export { default as IdentificationProgress } from './IdentificationProgress';
export { default as ObjectValidationCheckpoint } from './ObjectValidationCheckpoint';
export { default as ProductValidationCheckpoint } from './ProductValidationCheckpoint';
export { default as FinalReview } from './FinalReview';

// Tap-to-Identify Components (New simplified flow)
export { TapToIdentifyWizard } from './TapToIdentifyWizard';
export { ImageSelectionCanvas } from './ImageSelectionCanvas';
export { IdentificationResultCard } from './IdentificationResultCard';

// Re-export hooks
export { useIdentificationWizard } from '@/lib/apis/useIdentificationWizard';
export { useQuickIdentify } from '@/lib/apis/useQuickIdentify';

// Re-export utilities
export { cropImageToRegion, calculateTapRegion, calculateRectangleRegion } from '@/lib/apis/cropImage';

// Re-export types
export type {
  IdentificationState,
  IdentificationStage,
  DetectedObject,
  IdentifiedProduct,
  EnrichedProduct,
  ValidatedProduct,
  UserCorrection,
  ValidationResult,
  // Tap-to-identify types
  SelectionRegion,
  VisualDescription,
  ProductGuess,
  UncertaintyInfo,
  SingleItemIdentificationResult,
  TapToIdentifyStage,
  IdentifiedCanvasItem
} from '@/lib/apis/types';
