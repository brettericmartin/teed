/**
 * Link Intelligence Library
 *
 * Best-in-world link analysis for the creator economy.
 * The "picks and shovels" that powers all link management.
 *
 * Features:
 * - Universal URL classification (embed, social, product)
 * - 40+ platform definitions with patterns and metadata
 * - oEmbed discovery and fetching
 * - Product identification pipeline
 * - Link health monitoring
 *
 * @example
 * ```typescript
 * import { classifyUrl, parseEmbedUrl, parseSocialProfileUrl } from '@/lib/linkIntelligence';
 *
 * // Classify a URL
 * const result = classifyUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');
 * // { type: 'embed', platform: 'youtube', ... }
 *
 * // Parse embed details
 * const embed = parseEmbedUrl('https://open.spotify.com/track/abc123');
 * // { platform: 'spotify', contentId: 'abc123', embedUrl: '...', ... }
 *
 * // Parse social profile
 * const profile = parseSocialProfileUrl('https://twitter.com/elonmusk');
 * // { platform: 'twitter', username: 'elonmusk', ... }
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // URL Classification
  UrlType,
  ClassifiedUrl,

  // Platform Registry
  PlatformDefinition,

  // Results
  EmbedResult,
  SocialProfileResult,
  ProductResult,
  LinkAnalysisResult,
  FullAnalysisResult,

  // oEmbed
  OEmbedResponse,

  // Link Health
  LinkHealthResult,
  RedirectStep,

  // Extraction Pipeline
  ExtractionContext,
  ExtractionSource,
  UrlParsedData,
  FetchResult,
  StructuredData,

  // Options
  AnalysisOptions,
  BatchAnalysisOptions,
} from './types';

export { LinkIntelligenceError, ErrorCodes } from './types';

// =============================================================================
// CLASSIFIER
// =============================================================================

export {
  // URL normalization
  normalizeUrl,
  extractDomain,

  // Classification
  classifyUrl,
  classifyUrls,
  type BatchClassificationResult,

  // Parsing
  parseEmbedUrl,
  parseSocialProfileUrl,

  // Validation
  isValidUrl,
  parseUrlsFromInput,

  // Display helpers
  getClassificationLabel,
  getClassificationIcon,
} from './classifier';

// =============================================================================
// PLATFORM REGISTRY
// =============================================================================

export {
  // Platform lists
  ALL_PLATFORMS,
  EMBED_PLATFORMS,
  SOCIAL_PLATFORMS,

  // Lookup functions
  getPlatform,
  getPlatformByDomain,
  getEmbedPlatform,
  getSocialPlatform,

  // URL matching
  matchUrl,
  matchEmbedUrl,
  matchSocialUrl,
  type UrlMatch,

  // Statistics
  getPlatformStats,
  type PlatformStats,

  // Display helpers
  getPlatformDisplayName,
  getPlatformIcon,
  getPlatformColor,

  // oEmbed
  getOEmbedEndpoint,
  getOEmbedPlatforms,

  // Utilities
  isReservedUsername,
  RESERVED_USERNAMES,
} from './platforms';

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Quick check if a URL is an embed (video, audio, post)
 */
export function isEmbedUrl(url: string): boolean {
  const { classifyUrl } = require('./classifier');
  return classifyUrl(url).type === 'embed';
}

/**
 * Quick check if a URL is a social profile
 */
export function isSocialProfileUrl(url: string): boolean {
  const { classifyUrl } = require('./classifier');
  return classifyUrl(url).type === 'social';
}

/**
 * Quick check if a URL is a product
 */
export function isProductUrl(url: string): boolean {
  const { classifyUrl } = require('./classifier');
  return classifyUrl(url).type === 'product';
}

// =============================================================================
// OEMBED
// =============================================================================

export {
  // Discovery
  discoverOEmbedEndpoint,
  getOEmbedUrl,

  // Fetching
  fetchOEmbed,
  enrichEmbedWithOEmbed,
  batchFetchOEmbed,
  type OEmbedFetchOptions,

  // Support checking
  hasOEmbedSupport,
  getOEmbedSupportedPlatforms,

  // HTML generation
  generateResponsiveEmbed,
  sanitizeOEmbedHtml,
} from './oembed';

// =============================================================================
// LINK HEALTH
// =============================================================================

export {
  // Detection
  detectSoft404,
  detectAvailability,

  // Health checking
  checkUrlHealth,
  batchCheckUrlHealth,
  type HealthCheckOptions,
  type BatchHealthCheckOptions,

  // Statistics
  calculateHealthStats,
  type HealthStats,
} from './health';

// =============================================================================
// EXTRACTION PIPELINE
// =============================================================================

export {
  // Main analysis
  analyzeUrl,
  analyzeUrls,
  type BatchAnalysisResult,

  // Convenience functions
  quickExtractProduct,
  fullExtractProduct,
  extractEmbed,
  extractSocialProfile,

  // Legacy access (for gradual migration)
  identifyProductLegacy,
  type ProductIdentificationResult,
  type IdentificationOptions,
} from './extraction';
