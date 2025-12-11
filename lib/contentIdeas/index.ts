/**
 * Content Ideas Module
 * Central export for all content idea functionality
 */

// Types
export * from '../types/contentIdeas';

// YouTube integration
export {
  searchYouTubeVideos,
  getVideoDetails,
  searchVideosForVertical,
  extractUrlsFromDescription,
  hasAffiliateDisclosure,
  transformToSourceMetadata,
  buildYouTubeUrl,
  extractVideoId,
  isLikelySetupVideo,
  scoreVideoRelevance,
} from './youtube';

// Content generation
export {
  extractProductsFromVideo,
  generateIdeaFromSource,
  generateHooksAndLongForm,
  generateShortFormFromLongForm,
  runFullGenerationPipeline,
  detectVideoContentType,
} from './generation';

export type { FullGenerationResult, VideoContentType } from './generation';

// Transcript processing
export {
  fetchYouTubeTranscript,
  extractProductMentionsFromTranscript,
  analyzeTranscriptForContentType,
  formatTimestamp,
  getContextAroundTimestamp,
  buildYouTubeUrlWithTimestamp,
} from './transcript';

export type {
  TranscriptSegment,
  TranscriptResult,
  ProductMention,
} from './transcript';

// Video frame extraction
export {
  extractKeyFrames,
  getYouTubeThumbnailUrls,
  analyzeFramesWithAPIS,
  scoreFrameForCover,
  selectBestCoverFrame,
  parseIsoDuration,
} from './videoFrames';

export type {
  VideoFrame,
  FrameExtractionResult,
} from './videoFrames';

// Unified extraction (combines all sources)
export {
  extractProductsFromAllSources,
  detectEnhancedContentType,
} from './unifiedExtraction';

export type {
  ExtractedProductWithSource,
  UnifiedExtractionResult,
  UnifiedExtractionOptions,
  ProductSource,
} from './unifiedExtraction';

// Learning system (feedback analysis)
export {
  getLearningInsights,
  getPromptEnhancements,
  formatEnhancementsForPrompt,
  getFeedbackStats,
} from './learning';

export type {
  FeedbackSummary,
  CommonMistake,
  ConfusionPair,
  LearningInsights,
  ExtractionPromptEnhancements,
} from './learning';
