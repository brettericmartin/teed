// Advanced Product Identification System (APIS) Components
export { default as SmartIdentificationWizard } from './SmartIdentificationWizard';
export { default as IdentificationProgress } from './IdentificationProgress';
export { default as ObjectValidationCheckpoint } from './ObjectValidationCheckpoint';
export { default as ProductValidationCheckpoint } from './ProductValidationCheckpoint';
export { default as FinalReview } from './FinalReview';

// Re-export hooks
export { useIdentificationWizard } from '@/lib/apis/useIdentificationWizard';

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
} from '@/lib/apis/types';
