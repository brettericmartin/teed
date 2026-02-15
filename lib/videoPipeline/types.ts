/**
 * Video-to-Bag Pipeline Types
 * Self-contained type definitions — no external type dependencies.
 */

// ═══════════════════════════════════════════════════════════════════
// Pipeline Stages
// ═══════════════════════════════════════════════════════════════════

export type PipelineStage =
  | 'metadata'           // Stage 1: URL validation & video metadata
  | 'transcript'         // Stage 2: Transcript → GPT-4o product extraction
  | 'description'        // Stage 3: Description link identification (full AI)
  | 'vision'             // Stage 4: Frame extraction & vision analysis
  | 'fusion'             // Stage 5: Product fusion & deduplication
  | 'images'             // Stage 6: Image resolution
  | 'assembly';          // Stage 7: Draft bag assembly

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface StageProgress {
  stage: PipelineStage;
  status: StageStatus;
  message?: string;
  itemCount?: number;
  durationMs?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Product Sources
// ═══════════════════════════════════════════════════════════════════

export type ProductSource = 'description' | 'transcript' | 'vision';

// ═══════════════════════════════════════════════════════════════════
// Pipeline Events (SSE)
// ═══════════════════════════════════════════════════════════════════

export type PipelineEvent =
  | { type: 'stage_started'; stage: PipelineStage; message: string }
  | { type: 'stage_completed'; stage: PipelineStage; message: string; itemCount?: number; durationMs: number }
  | { type: 'stage_failed'; stage: PipelineStage; error: string }
  | { type: 'stage_skipped'; stage: PipelineStage; reason: string }
  | { type: 'product_found'; product: DraftProduct; source: ProductSource }
  | { type: 'metadata_ready'; metadata: VideoMetadata }
  | { type: 'pipeline_complete'; result: PipelineResult }
  | { type: 'pipeline_error'; error: string };

// ═══════════════════════════════════════════════════════════════════
// Video Metadata
// ═══════════════════════════════════════════════════════════════════

export interface VideoMetadata {
  videoId: string;
  platform: 'youtube' | 'tiktok';
  title: string;
  channelName: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  tags: string[];
  publishedAt: string;
  viewCount?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Intermediate Product Types (per-stage)
// ═══════════════════════════════════════════════════════════════════

/** Product extracted from transcript via GPT-4o */
export interface TranscriptProduct {
  name: string;
  brand?: string;
  category?: string;
  mentionContext?: string;        // What the creator said about it
  timestampMs?: number;           // When mentioned (ms)
  timestampFormatted?: string;    // "2:34"
}

/** Product identified from a description link via full identifyProduct() */
export interface DescriptionIdentifiedProduct {
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  purchaseUrl: string;
  domain: string;
  isAffiliate: boolean;
  confidence: number;             // 0-1 from identifyProduct
  label?: string;                 // Product hint from description context
}

/** Product spotted in a video frame via GPT-4o vision */
export interface VisionProduct {
  name: string;
  brand?: string;
  category?: string;
  color?: string;                 // Primary color(s) of the product
  confidence: number;             // 0-100
  visualDescription?: string;
  frameIndex: number;             // Which frame (0-based) it was spotted in
  frameUrl: string;               // URL of the frame image
  frameTimestamp?: string;        // Timestamp label of the frame
}

// ═══════════════════════════════════════════════════════════════════
// Draft Product (Pipeline Output — fused)
// ═══════════════════════════════════════════════════════════════════

export interface DraftProduct {
  id: string;                         // Temp ID for UI tracking
  name: string;
  brand: string;
  category?: string;
  color?: string;                     // Primary color(s) of the product
  description?: string;               // mentionContext from transcript
  confidence: number;                 // 0-100
  sources: ProductSource[];

  // Dual images
  videoFrameUrl?: string;             // Screenshot from video
  productImageUrl?: string;           // Clean product photo (Google Images / scrape)

  // Links
  purchaseUrl?: string;
  purchaseLinks: DraftLink[];

  // Timestamps
  timestamp?: string;                 // Video timestamp where mentioned
  timestampMs?: number;               // Timestamp in ms (for frame mapping)

  pipelineMetadata: {
    videoUrl: string;
    timestamp?: string;
    sources: ProductSource[];
    confidence: number;
  };
}

export interface DraftLink {
  url: string;
  domain: string;
  label?: string;
  isAffiliate: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Draft Bag (for Review UI)
// ═══════════════════════════════════════════════════════════════════

export interface DraftBag {
  title: string;
  description: string;
  tags: string[];
  coverPhotoUrl?: string;
  sourceVideoUrl: string;
  videoMetadata: VideoMetadata;
  products: DraftProduct[];
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline Result
// ═══════════════════════════════════════════════════════════════════

export interface PipelineResult {
  draftBag: DraftBag;
  stats: {
    totalProducts: number;
    fromDescription: number;
    fromTranscript: number;
    fromVision: number;
    multiSource: number;
    withImages: number;
    withLinks: number;
    totalDurationMs: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline Options
// ═══════════════════════════════════════════════════════════════════

export interface PipelineOptions {
  includeTranscript?: boolean;        // Default: true
  includeVision?: boolean;            // Default: true
  maxFrames?: number;                 // Default: 5
  maxDescriptionLinks?: number;       // Default: 15
  imageConcurrency?: number;          // Default: 5
}

// ═══════════════════════════════════════════════════════════════════
// Bag Assembly Input
// ═══════════════════════════════════════════════════════════════════

export interface AssembleBagInput {
  draftBag: DraftBag;
  selectedProductIds: string[];       // Which products to include
  editedProducts: Record<string, {    // Overrides by product ID
    name?: string;
    brand?: string;
    imageUrl?: string;
  }>;
  bagTitle: string;
  bagDescription?: string;
  ownerId: string;
}

export interface AssembleBagResult {
  bagId: string;
  bagCode: string;
  itemCount: number;
  linkCount: number;
}
