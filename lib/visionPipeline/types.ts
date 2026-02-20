// ============================================================
// Vision Pipeline Types
// 4-stage pipeline: Enumerate → Crop → Identify → Validate
// ============================================================

/** Bounding box in Gemini's normalized coordinate system (0-1000) */
export interface BoundingBox {
  yMin: number;
  xMin: number;
  yMax: number;
  xMax: number;
}

/** Stage 1 output: detected item with bounding box */
export interface EnumeratedItem {
  id: number;
  label: string;
  bbox: BoundingBox;
  category: string;
}

/** Stage 2 output: cropped image region */
export interface CroppedItem extends EnumeratedItem {
  /** Base64-encoded JPEG of the cropped region */
  cropBase64: string;
  /** Pixel dimensions of the crop */
  cropWidth: number;
  cropHeight: number;
}

/** Stage 3 output: identified product */
export interface IdentifiedItem extends CroppedItem {
  brand: string | null;
  model: string | null;
  color: string | null;
  confidence: number; // 0-100
  identificationNotes: string;
}

/** Validation verdict from reference image comparison */
export type ValidationVerdict = 'verified' | 'unverified' | 'mismatch';

/** Stage 4 output: validated identification */
export interface ValidatedItem extends IdentifiedItem {
  validation: {
    verdict: ValidationVerdict;
    confidence: number; // 0-100
    discrepancies: string[];
    suggestedCorrection: string | null;
    referenceImageUrl: string | null;
  };
  /** If re-identified after mismatch, the corrected values */
  corrected?: {
    brand: string | null;
    model: string | null;
    color: string | null;
    confidence: number;
  };
}

/** Per-stage timing info */
export interface StageTimings {
  enumerate: number;
  crop: number;
  identify: number;
  validate: number;
  total: number;
}

/** Final pipeline result */
export interface PipelineResult {
  items: ValidatedItem[];
  stats: {
    totalDetected: number;
    totalIdentified: number;
    totalVerified: number;
    stageTimings: StageTimings;
    partial: boolean;
  };
}

/** Pipeline options */
export interface PipelineOptions {
  bagType?: string;
  maxItems?: number;
  skipValidation?: boolean;
}

// ============================================================
// Backward-compatible type mapping to existing ProductReviewModal
// ============================================================

/** The IdentifiedProduct shape expected by ProductReviewModal */
export interface IdentifiedProductCompat {
  name: string;
  brand?: string;
  category: string;
  confidence: number;
  estimatedPrice?: string;
  color?: string;
  specifications?: string[];
  modelNumber?: string;
  productImage?: {
    imageUrl: string;
    thumbnailUrl: string;
    source: string;
  };
  alternatives?: Array<{
    name: string;
    brand?: string;
    confidence: number;
    reason: string;
  }>;
  sourceImageIndex?: number;
  // New fields from vision pipeline
  cropBase64?: string;
  validationVerdict?: ValidationVerdict;
  validationReferenceUrl?: string;
}

/** Convert a ValidatedItem to the IdentifiedProduct shape for ProductReviewModal */
export function toIdentifiedProductCompat(item: ValidatedItem): IdentifiedProductCompat {
  const effectiveBrand = item.corrected?.brand ?? item.brand;
  const effectiveModel = item.corrected?.model ?? item.model;
  const effectiveColor = item.corrected?.color ?? item.color;
  const effectiveConfidence = item.corrected?.confidence ?? item.confidence;

  const name = effectiveModel
    ? (effectiveBrand ? `${effectiveBrand} ${effectiveModel}` : effectiveModel)
    : item.label;

  return {
    name,
    brand: effectiveBrand ?? undefined,
    category: item.category,
    confidence: effectiveConfidence,
    color: effectiveColor ?? undefined,
    productImage: item.validation.referenceImageUrl
      ? {
          imageUrl: item.validation.referenceImageUrl,
          thumbnailUrl: item.validation.referenceImageUrl,
          source: 'google',
        }
      : undefined,
    cropBase64: item.cropBase64,
    validationVerdict: item.validation.verdict,
    validationReferenceUrl: item.validation.referenceImageUrl ?? undefined,
  };
}
