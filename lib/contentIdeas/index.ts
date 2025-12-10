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
} from './generation';

export type { FullGenerationResult } from './generation';
