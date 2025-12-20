/**
 * Advanced Product Identification System (APIS) Types
 *
 * Multi-stage identification pipeline with human-in-the-loop validation
 */

// ============================================================================
// STAGE 1: Object Detection
// ============================================================================

export interface DetectedObject {
  id: string;
  objectType: string;           // "headcover", "putter", "driver", "golf ball", "camera"
  productCategory: string;      // "golf", "tech", "fashion", "outdoor"
  boundingDescription: string;  // "top-left quadrant", "center of image"
  visualCues: string[];         // ["black leather", "magnetic closure", "mallet shape"]
  certainty: 'definite' | 'likely' | 'uncertain';
  selected: boolean;            // User can select/deselect objects to identify
  sourceImageIndex?: number;    // For bulk uploads - which image this object came from
}

export interface ObjectDetectionResult {
  objects: DetectedObject[];
  totalDetected: number;
  processingTimeMs: number;
  imageAnalysis: {
    quality: 'good' | 'fair' | 'poor';
    lighting: 'good' | 'dim' | 'bright';
    suggestions?: string[];     // "Try better lighting", "Move closer"
  };
}

// ============================================================================
// STAGE 2: Product Identification
// ============================================================================

export interface IdentifiedProduct {
  id: string;
  objectId: string;             // Reference to DetectedObject

  // Core identification
  name: string;
  brand?: string;
  category: string;

  // Model year/generation (NEW)
  modelYear?: number;
  generation?: string;          // "Gen 1", "2022 Model", "Original"
  yearConfidence: number;       // 0-100
  yearCues: string[];           // ["stitching pattern", "logo style matches 2021"]

  // Confidence & method
  confidence: number;           // 0-100 (initial, pre-validation)
  identificationMethod: 'text-visible' | 'visual-inference' | 'user-provided' | 'brand-knowledge';
  matchingReasons: string[];    // ["Color matches", "Logo shape matches", "Design cues match"]

  // Visual attributes
  colors?: ProductColors;
  pattern?: ProductPattern;
  specifications?: string[];

  // Alternatives
  alternatives: ProductAlternative[];

  // User interaction
  userCorrectionApplied?: string;
  confirmedByUser: boolean;
}

export interface ProductColors {
  primary: string;
  secondary?: string;
  accent?: string;
  finish?: 'matte' | 'glossy' | 'metallic' | 'satin' | 'textured' | 'brushed';
  colorway?: string;
}

export interface ProductPattern {
  type: 'solid' | 'striped' | 'plaid' | 'camo' | 'gradient' | 'geometric' |
        'chevron' | 'heathered' | 'carbon-weave' | 'checkered' | 'floral' | 'other';
  location: 'all-over' | 'accent' | 'trim' | 'crown-only' | 'partial' | 'sole-only';
  description?: string;
}

export interface ProductAlternative {
  name: string;
  brand?: string;
  modelYear?: number;
  confidence: number;
  differentiatingFactors: string[];  // "This model has X, yours appears to have Y"
}

// ============================================================================
// STAGE 3: Enrichment
// ============================================================================

export interface EnrichedProduct extends IdentifiedProduct {
  // Enrichment data
  description?: string;
  specs?: string;               // Pipe-separated specs
  estimatedPrice?: string;

  // Links with year awareness
  links: ProductLink[];

  // Images
  productImage?: {
    imageUrl: string;
    thumbnailUrl: string;
    source: string;
  };

  // Fun facts (optional)
  funFacts?: string[];
}

export interface ProductLink {
  url: string;
  merchant: string;
  price?: string;
  yearMatch: 'exact' | 'unknown' | 'different';
  yearWarning?: string;         // "This link is for 2024 model, your item appears to be 2019"
  isAffiliate: boolean;
  source: 'library' | 'web' | 'affiliate-network';
}

// ============================================================================
// STAGE 4: Validation
// ============================================================================

export interface ValidationResult {
  productId: string;

  // Visual match score (THIS is the real confidence)
  visualMatchScore: number;     // 0-100

  // Detailed match breakdown
  matchDetails: {
    colorMatch: { matches: boolean; confidence: number; notes?: string };
    shapeMatch: { matches: boolean; confidence: number; notes?: string };
    brandLogoMatch: { matches: boolean; confidence: number; notes?: string };
    modelDetailsMatch: { matches: boolean; confidence: number; notes?: string };
    yearIndicatorsMatch: { matches: boolean; confidence: number; notes?: string };
  };

  // Overall assessment
  discrepancies: string[];      // ["Color appears different", "Logo style doesn't match era"]
  recommendation: 'confirmed' | 'likely' | 'uncertain' | 'mismatch';

  // Comparison images
  sourceImageUrl?: string;      // User's original
  foundImageUrl?: string;       // From enrichment
}

export interface ValidatedProduct extends EnrichedProduct {
  validation: ValidationResult;
  finalConfidence: number;      // Validation-based confidence
}

// ============================================================================
// STATE MACHINE
// ============================================================================

export type IdentificationStage =
  | 'idle'
  | 'detecting'
  | 'awaiting-object-validation'
  | 'identifying'
  | 'awaiting-product-validation'
  | 'enriching'
  | 'validating'
  | 'complete'
  | 'error';

export interface IdentificationState {
  stage: IdentificationStage;

  // Source (single or multiple images)
  source?: {
    type: 'image' | 'url' | 'text';
    imageBase64?: string;
    url?: string;
    textHint?: string;
  };

  // Bulk mode: multiple source images
  sourceImages?: string[];       // Array of base64 images for bulk processing
  isBulkMode?: boolean;

  // Stage results
  detectedObjects?: DetectedObject[];
  validatedObjects?: DetectedObject[];    // After user validation
  identifiedProducts?: IdentifiedProduct[];
  confirmedProducts?: IdentifiedProduct[]; // After user validation
  enrichedProducts?: EnrichedProduct[];
  validatedProducts?: ValidatedProduct[];

  // User corrections
  userCorrections: UserCorrection[];

  // Progress
  currentStep: number;
  totalSteps: number;
  stepMessage: string;

  // Error handling
  error?: string;
  recoveryOptions?: string[];
}

export interface UserCorrection {
  stage: IdentificationStage;
  objectId?: string;
  productId?: string;
  correctionType: 'object-type' | 'product-name' | 'brand' | 'year' | 'added-item' | 'removed-item';
  originalValue?: string;
  correctedValue: string;
  timestamp: Date;
}

// ============================================================================
// ACTIONS
// ============================================================================

export type IdentificationAction =
  | { type: 'START'; source: IdentificationState['source'] }
  | { type: 'START_BULK'; images: string[] }  // For bulk photo processing
  | { type: 'OBJECTS_DETECTED'; result: ObjectDetectionResult }
  | { type: 'BULK_OBJECTS_DETECTED'; results: { imageIndex: number; result: ObjectDetectionResult }[] }
  | { type: 'USER_VALIDATED_OBJECTS'; selectedIds: string[]; corrections?: string; addedObjects?: Partial<DetectedObject>[] }
  | { type: 'PRODUCTS_IDENTIFIED'; products: IdentifiedProduct[] }
  | { type: 'USER_VALIDATED_PRODUCTS'; confirmed: IdentifiedProduct[]; corrections?: UserCorrection[] }
  | { type: 'ENRICHMENT_COMPLETE'; products: EnrichedProduct[] }
  | { type: 'VALIDATION_COMPLETE'; products: ValidatedProduct[] }
  | { type: 'USER_CORRECTION'; correction: UserCorrection }
  | { type: 'RETRY_STAGE'; stage: IdentificationStage }
  | { type: 'SKIP_ITEM'; itemId: string }
  | { type: 'ABORT' }
  | { type: 'ERROR'; error: string; recoveryOptions?: string[] };

// ============================================================================
// UI STAGES
// ============================================================================

export interface IdentificationStageConfig {
  id: IdentificationStage;
  label: string;
  activeLabel: string;
  icon: string;
  estimatedTime?: string;
  userAction: boolean;          // Indicates user input required
}

export const IDENTIFICATION_STAGES: IdentificationStageConfig[] = [
  {
    id: 'detecting',
    label: 'Detect',
    activeLabel: 'Finding objects in image...',
    icon: '🔍',
    estimatedTime: '2-3s',
    userAction: false
  },
  {
    id: 'awaiting-object-validation',
    label: 'Review',
    activeLabel: 'Please confirm what you see',
    icon: '👁️',
    userAction: true
  },
  {
    id: 'identifying',
    label: 'Identify',
    activeLabel: 'Identifying specific products...',
    icon: '🎯',
    estimatedTime: '3-5s',
    userAction: false
  },
  {
    id: 'awaiting-product-validation',
    label: 'Confirm',
    activeLabel: 'Please confirm identification',
    icon: '✓',
    userAction: true
  },
  {
    id: 'enriching',
    label: 'Enrich',
    activeLabel: 'Finding product details & links...',
    icon: '🔗',
    estimatedTime: '2-4s',
    userAction: false
  },
  {
    id: 'validating',
    label: 'Validate',
    activeLabel: 'Comparing to your image...',
    icon: '🔄',
    estimatedTime: '2-3s',
    userAction: false
  },
  {
    id: 'complete',
    label: 'Done',
    activeLabel: 'Ready to add!',
    icon: '✅',
    userAction: false
  }
];

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface DetectObjectsRequest {
  imageBase64?: string;
  imageUrl?: string;
  textHint?: string;
}

export interface DetectObjectsResponse {
  success: boolean;
  result?: ObjectDetectionResult;
  error?: string;
}

// User-provided hints to assist identification
export interface ProductHints {
  brand?: string;               // "Good Good", "TaylorMade", etc.
  model?: string;               // "Ace High Polo", "Qi10 Max"
  color?: string;               // "Navy", "Black/White"
  year?: string;                // "2024", "2023"
  additionalInfo?: string;      // Any other details
}

export interface IdentifyProductsRequest {
  imageBase64?: string;
  imageUrl?: string;
  validatedObjects: DetectedObject[];
  userContext?: string;         // User corrections/additions from checkpoint 1
  bagContext?: string;          // Bag type for context
  productHints?: ProductHints;  // User-provided hints to assist identification
}

export interface IdentifyProductsResponse {
  success: boolean;
  products?: IdentifiedProduct[];
  error?: string;
}

export interface EnrichProductsRequest {
  products: IdentifiedProduct[];
  yearAware: boolean;
}

export interface EnrichProductsResponse {
  success: boolean;
  products?: EnrichedProduct[];
  error?: string;
}

export interface ValidateMatchRequest {
  sourceImage: string;          // Base64 or URL
  enrichedProduct: EnrichedProduct;
}

export interface ValidateMatchResponse {
  success: boolean;
  validation?: ValidationResult;
  error?: string;
}

export interface StoreCorrectionRequest {
  correction: UserCorrection;
  finalProduct?: ValidatedProduct;
  sourceImage?: string;
}

export interface StoreCorrectionResponse {
  success: boolean;
  learned: boolean;
  error?: string;
}

// ============================================================================
// TAP-TO-IDENTIFY TYPES (New simplified flow)
// ============================================================================

/**
 * Selection region for tap-to-identify
 */
export interface SelectionRegion {
  id: string;
  type: 'tap' | 'rectangle';
  // Normalized coordinates (0-1)
  centerX: number;
  centerY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  // Pixel coordinates for cropping
  pixelBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Feature with confidence score
 */
export interface ConfidentFeature<T = string> {
  value: T;
  confidence: number;            // 0-100
}

/**
 * OCR extracted text from image
 */
export interface ExtractedText {
  text: string;
  confidence: number;            // 0-100 OCR confidence
  location: string;              // "crown", "sole", "face", "label", etc.
  type: 'brand' | 'model' | 'serial' | 'other';
}

/**
 * Visual description from AI analysis (enhanced with confidence scores)
 */
export interface VisualDescription {
  objectType: string;            // "mallet putter headcover"
  objectTypeConfidence: number;  // 0-100
  primaryColor: string;
  primaryColorConfidence: number;
  secondaryColors: string[];
  finish: string;                // "matte", "glossy", "metallic"
  finishConfidence: number;
  materials: string[];
  materialsConfidence: number;
  shape: string;
  shapeConfidence: number;
  visibleText: string[];         // Any text/numbers seen (legacy)
  brandIndicators: string[];     // Logo shapes, design cues
  conditionNotes: string;
  size: string;
  // Enhanced OCR data
  ocrTexts?: ExtractedText[];    // Detailed OCR extractions
}

/**
 * Out-of-distribution / novelty detection info
 */
export interface NoveltyInfo {
  isNovel: boolean;              // True if product appears unknown
  noveltyScore: number;          // 0-100, higher = more novel/unknown
  knowledgeBaseCoverage: number; // 0-100, % of KB products matching features
  reason: string | null;         // Why we think it's novel
  suggestedAction: string;       // "help us learn", "try different angle", etc.
}

/**
 * Confidence interval for calibrated confidence
 */
export interface ConfidenceInterval {
  point: number;                 // Point estimate (e.g., 75)
  lower: number;                 // Lower bound (e.g., 60)
  upper: number;                 // Upper bound (e.g., 85)
}

/**
 * Single product guess with confidence
 */
export interface ProductGuess {
  rank: 1 | 2 | 3;
  name: string;
  brand: string;
  model?: string;
  year?: number;
  confidence: number;            // 0-100 (point estimate)
  confidenceInterval?: ConfidenceInterval; // Calibrated confidence range
  confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain';
  matchingReasons: string[];
  differentiators: string[];     // What would confirm/deny this guess
  ocrMatch?: {                   // OCR text matching info
    matched: boolean;
    matchedText?: string;
    boostApplied: number;        // Confidence boost from OCR match
  };
}

/**
 * Uncertainty information from AI
 */
export interface UncertaintyInfo {
  isConfident: boolean;          // Only true if top guess >= 70%
  reason: string | null;
  whatWouldHelp: string[];
}

/**
 * Result from identify-single-item endpoint
 */
export interface SingleItemIdentificationResult {
  visualDescription: VisualDescription;
  guesses: ProductGuess[];
  uncertainty: UncertaintyInfo;
  novelty: NoveltyInfo;          // OOD detection results
  processingTimeMs: number;
  modelUsed: string;
}

/**
 * Request to identify-single-item endpoint
 */
export interface IdentifySingleItemRequest {
  imageBase64: string;           // REQUIRED: Cropped image of single item
  categoryHint?: string;         // Optional: "golf", "tech", etc.
  brandHint?: string;            // Optional: User says "I think it's Titleist"
  additionalContext?: string;    // Optional: Any text the user provides
}

/**
 * Response from identify-single-item endpoint
 */
export interface IdentifySingleItemResponse {
  success: boolean;
  result?: SingleItemIdentificationResult;
  error?: string;
}

/**
 * Tap-to-identify wizard stages (simplified from APIS)
 */
export type TapToIdentifyStage =
  | 'idle'           // No image loaded
  | 'ready'          // Image displayed, waiting for user tap/draw
  | 'identifying'    // Processing selected region
  | 'reviewing'      // Showing identification results
  | 'error';         // Error state

/**
 * Identified item on the canvas (after identification)
 */
export interface IdentifiedCanvasItem {
  id: string;
  region: SelectionRegion;
  result: SingleItemIdentificationResult;
  selectedGuessIndex: number;    // Which of the 3 guesses the user selected (0, 1, or 2)
  croppedImageBase64: string;    // The cropped region image
  edits?: {                       // Optional user edits to the guess
    name: string;
    brand: string;
  };
}

// ============================================================================
// CONFIDENCE ROUTING
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

export interface ConfidenceRouting {
  level: ConfidenceLevel;
  message: string;
  showAlternatives: boolean;
  requiresSelection: boolean;
}

export function getConfidenceRouting(confidence: number): ConfidenceRouting {
  const level = getConfidenceLevel(confidence);

  switch (level) {
    case 'high':
      return {
        level,
        message: `We're ${confidence}% confident this is correct`,
        showAlternatives: false,
        requiresSelection: false
      };
    case 'medium':
      return {
        level,
        message: 'Which of these is correct?',
        showAlternatives: true,
        requiresSelection: true
      };
    case 'low':
      return {
        level,
        message: "We found some possibilities but aren't sure",
        showAlternatives: true,
        requiresSelection: true
      };
  }
}
