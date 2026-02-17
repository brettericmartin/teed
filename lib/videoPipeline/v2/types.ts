/**
 * Video Pipeline V2 Types
 *
 * Dense extraction + two-pass vision approach.
 * Frames stored as JPEG files on disk, loaded lazily via FrameStore.
 */

// ═══════════════════════════════════════════════════════════════════
// Frame Types
// ═══════════════════════════════════════════════════════════════════

/** A frame extracted from video and saved to disk */
export interface ExtractedFrameV2 {
  id: string;                   // Unique frame ID (e.g., "frame_042")
  filePath: string;             // Absolute path to JPEG on disk
  timestampMs: number;          // Frame timestamp in milliseconds
  timestampFormatted: string;   // "2:34" or "1:02:34"
  width: number;
  height: number;
  /** Perceptual hash for dedup (16-char hex, average hash of 8x8 grayscale) */
  pHash: string;
  /** Whether this frame was from scene-change detection vs interval */
  isSceneChange: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Text Detection
// ═══════════════════════════════════════════════════════════════════

/** Text detected in a single frame by GPT-4o-mini */
export interface TextDetectionResult {
  frameId: string;
  timestampMs: number;
  /** All text strings visible in the frame */
  texts: string[];
  /** Whether this frame has product-relevant text (vs "Subscribe", channel name, etc.) */
  hasProductText: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Product Clusters
// ═══════════════════════════════════════════════════════════════════

/** A cluster of consecutive frames showing the same product text */
export interface ProductCluster {
  id: string;                       // Cluster ID (e.g., "cluster_007")
  /** Representative frame (the one with the most detected text) */
  representativeFrameId: string;
  /** All frame IDs in this cluster */
  frameIds: string[];
  /** Time range of the cluster */
  startMs: number;
  endMs: number;
  /** Union of all detected texts across frames in this cluster */
  texts: string[];
  /** The primary/most common text seen */
  primaryText: string;
  /** Matched brand from fuzzy matching (if any) */
  matchedBrand?: string;
  /** Matched transcript mention within 30s (if any) */
  transcriptContext?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Frame Store (LRU disk-backed cache)
// ═══════════════════════════════════════════════════════════════════

export interface FrameStoreConfig {
  /** Max frames to hold in memory as base64. Default: 20 */
  maxInMemory: number;
  /** Directory where frame JPEGs are stored */
  frameDir: string;
}

// ═══════════════════════════════════════════════════════════════════
// V2 Pipeline Stages (extends base PipelineStage)
// ═══════════════════════════════════════════════════════════════════

export type V2PipelineStage =
  | 'v2_download'          // Stage 1: Download video at 720p
  | 'v2_frames'            // Stage 2: Dense frame extraction + dedup
  | 'v2_transcript'        // Stage 3: Transcript + fuzzy match
  | 'v2_text_detect'       // Stage 4: GPT-4o-mini text detection on all frames
  | 'v2_product_id'        // Stage 5: GPT-4o product identification
  | 'v2_cross_validate'    // Stage 6: Cross-validation + gap resolution
  | 'description'          // Stage 7: Description link parsing (reused)
  | 'v2_fusion';           // Stage 8: Final fusion + assembly

// ═══════════════════════════════════════════════════════════════════
// Identified Product (from V2 product identifier)
// ═══════════════════════════════════════════════════════════════════

export interface V2IdentifiedProduct {
  name: string;
  brand: string;
  category?: string;
  color?: string;
  confidence: number;           // 0-100
  /** Which cluster this came from */
  clusterId: string;
  /** Frame used for identification */
  frameId: string;
  /** Pre-detected text that helped identification */
  detectedText: string[];
  /** Visual description from GPT-4o */
  visualDescription?: string;
  /** Timestamp of the representative frame */
  timestampMs: number;
  timestampFormatted: string;
  /** Sources that confirmed this product */
  sources: Array<'vision' | 'transcript' | 'description' | 'text_overlay'>;
}

// ═══════════════════════════════════════════════════════════════════
// Cross-Validation Result
// ═══════════════════════════════════════════════════════════════════

export interface CrossValidatedProduct extends V2IdentifiedProduct {
  /** Confidence after multi-source validation */
  validatedConfidence: number;
  /** Whether matched with transcript mention */
  transcriptMatch: boolean;
  /** Whether matched with description link */
  descriptionMatch: boolean;
  /** Purchase URL from description (if matched) */
  purchaseUrl?: string;
  purchaseDomain?: string;
  isAffiliate?: boolean;
  /** Product image from description link identification */
  productImageUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Video Download Result
// ═══════════════════════════════════════════════════════════════════

export interface VideoDownloadResult {
  videoPath: string;            // Path to downloaded video file
  durationSeconds: number;      // Video duration
  width: number;                // Video width
  height: number;               // Video height
  tempDir: string;              // Temp directory (caller must clean up)
}
