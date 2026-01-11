/**
 * Link Intelligence System - Core Types
 *
 * Unified type definitions for the best-in-world link analysis system.
 * All URL classification, extraction, and health monitoring flows through these types.
 */

// =============================================================================
// URL CLASSIFICATION
// =============================================================================

export type UrlType = 'embed' | 'social' | 'product';

export interface ClassifiedUrl {
  url: string;
  normalizedUrl: string;
  type: UrlType;
  platform: string;
  confidence: number;
}

// =============================================================================
// PLATFORM REGISTRY
// =============================================================================

export interface PlatformDefinition {
  id: string;
  name: string;
  type: 'embed' | 'social' | 'retailer' | 'brand';

  // URL matching
  domains: string[];
  urlPatterns: RegExp[];
  excludePatterns?: RegExp[];  // Patterns that indicate NOT this type

  // For embeds
  oembedEndpoint?: string;
  embedUrlTemplate?: string;

  // For retailers/brands
  brand?: string;
  category?: string;
  tier?: 'luxury' | 'premium' | 'mid' | 'value';
  isRetailer?: boolean;

  // Extraction hints
  extractors?: {
    id?: (url: string, match: RegExpMatchArray) => string | null;
    username?: (url: string, match: RegExpMatchArray) => string | null;
  };

  // Display
  icon?: string;
  color?: string;
}

// =============================================================================
// EMBED RESULTS
// =============================================================================

export interface EmbedResult {
  type: 'embed';
  platform: string;
  platformName: string;
  contentId: string;
  contentType?: 'video' | 'short' | 'track' | 'album' | 'playlist' | 'episode' | 'post' | 'reel' | 'clip';
  url: string;
  embedUrl?: string;

  // oEmbed enrichment (when fetched)
  oembed?: OEmbedResponse;
}

export interface OEmbedResponse {
  type: 'photo' | 'video' | 'link' | 'rich';
  version: string;
  title?: string;
  authorName?: string;
  authorUrl?: string;
  providerName?: string;
  providerUrl?: string;
  cacheAge?: number;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  html?: string;
  width?: number;
  height?: number;
}

// =============================================================================
// SOCIAL PROFILE RESULTS
// =============================================================================

export interface SocialProfileResult {
  type: 'social';
  platform: string;
  platformName: string;
  username: string;
  displayName?: string;
  url: string;
  profileUrl: string;
}

// =============================================================================
// PRODUCT IDENTIFICATION RESULTS
// =============================================================================

export interface ProductResult {
  type: 'product';
  url: string;

  // Core identification
  brand: string | null;
  productName: string;
  fullName: string;
  category: string | null;

  // Details
  specifications: string[];
  description?: string;

  // Pricing (optional - may be disabled)
  price?: number | null;
  currency?: string | null;

  // Availability
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' | 'unknown';

  // Images
  imageUrl: string | null;
  imageOptions?: string[];

  // Identifiers
  sku?: string | null;
  asin?: string | null;
  gtin?: string | null;

  // Confidence & provenance
  confidence: number;
  sources: ExtractionSource[];
  primarySource: ExtractionSource;

  // Performance
  processingTimeMs: number;
  cached: boolean;
}

export type ExtractionSource =
  | 'cache'
  | 'url_parsing'
  | 'json_ld'
  | 'open_graph'
  | 'microdata'
  | 'meta_tags'
  | 'css_selectors'
  | 'amazon_lookup'
  | 'firecrawl'
  | 'jina_reader'
  | 'google_images'
  | 'ai_analysis';

// =============================================================================
// LINK HEALTH
// =============================================================================

export interface LinkHealthResult {
  url: string;
  checked: boolean;
  checkedAt: Date;

  // HTTP status
  httpStatus: number | null;
  responseTimeMs: number | null;

  // Redirect info
  redirected: boolean;
  finalUrl?: string;
  redirectCount?: number;
  redirectChain?: RedirectStep[];

  // Health classification
  health: 'healthy' | 'broken' | 'soft_404' | 'unavailable' | 'blocked' | 'timeout' | 'error';

  // Soft 404 detection
  isSoft404: boolean;
  soft404Reason?: string;

  // Availability (for products)
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' | 'unknown';

  // Error info
  error?: string;
}

export interface RedirectStep {
  url: string;
  status: number;
  location?: string;
}

// =============================================================================
// UNIFIED ANALYSIS RESULT
// =============================================================================

export type LinkAnalysisResult =
  | EmbedResult
  | SocialProfileResult
  | ProductResult;

export interface FullAnalysisResult {
  classification: ClassifiedUrl;
  result: LinkAnalysisResult;
  health?: LinkHealthResult;
}

// =============================================================================
// EXTRACTION PIPELINE
// =============================================================================

export interface ExtractionContext {
  url: string;
  normalizedUrl: string;
  platform?: PlatformDefinition;

  // Parsed URL components
  domain: string;
  path: string;
  params: URLSearchParams;

  // URL-derived data (no network)
  urlParsed?: UrlParsedData;

  // Fetched data
  html?: string;
  fetchResult?: FetchResult;

  // Structured data extracted
  structuredData?: StructuredData;

  // oEmbed data
  oembed?: OEmbedResponse;
}

export interface UrlParsedData {
  brand: string | null;
  productName: string | null;
  fullName: string | null;
  category: string | null;
  sku: string | null;
  asin: string | null;
  modelNumber: string | null;
  color: string | null;
  size: string | null;
  confidence: number;
  isRetailer: boolean;
}

export interface FetchResult {
  success: boolean;
  blocked: boolean;
  status?: number;
  html?: string;
  finalUrl?: string;
  redirected?: boolean;
  responseTimeMs?: number;
  error?: string;
}

export interface StructuredData {
  // JSON-LD
  jsonLd?: {
    name?: string;
    description?: string;
    brand?: string | { name: string };
    image?: string | string[] | { url: string };
    sku?: string;
    gtin?: string;
    mpn?: string;
    offers?: {
      price?: number | string;
      priceCurrency?: string;
      availability?: string;
    } | Array<{
      price?: number | string;
      priceCurrency?: string;
      availability?: string;
    }>;
  };

  // Open Graph
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    product?: {
      brand?: string;
      availability?: string;
      condition?: string;
      priceAmount?: string;
      priceCurrency?: string;
      retailerItemId?: string;
    };
  };

  // Twitter Cards
  twitterCards?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };

  // Meta tags
  meta?: {
    title?: string;
    description?: string;
  };

  // HTML elements
  html?: {
    title?: string;
    h1?: string;
    firstImage?: string;
  };
}

// =============================================================================
// PIPELINE OPTIONS
// =============================================================================

export interface AnalysisOptions {
  // Performance tuning
  timeout?: number;                    // Overall timeout in ms
  fetchTimeout?: number;               // HTML fetch timeout in ms
  earlyExitConfidence?: number;        // Skip later stages if confidence exceeds this

  // Feature toggles
  skipCache?: boolean;                 // Don't check/save to product library
  skipAi?: boolean;                    // Don't use AI analysis
  skipOembed?: boolean;                // Don't fetch oEmbed data
  skipHealth?: boolean;                // Don't check link health

  // Price handling
  extractPrice?: boolean;              // Whether to extract pricing (default: false per user preference)

  // oEmbed options
  oembedMaxWidth?: number;
  oembedMaxHeight?: number;

  // Debugging
  debug?: boolean;
  includeRawData?: boolean;
}

export interface BatchAnalysisOptions extends AnalysisOptions {
  maxUrls?: number;                    // Maximum URLs to process (default: 25)
  concurrency?: number;                // Parallel processing (default: 5)
  onProgress?: (completed: number, total: number, result: LinkAnalysisResult) => void;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class LinkIntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public url?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'LinkIntelligenceError';
  }
}

export const ErrorCodes = {
  INVALID_URL: 'INVALID_URL',
  FETCH_FAILED: 'FETCH_FAILED',
  FETCH_BLOCKED: 'FETCH_BLOCKED',
  FETCH_TIMEOUT: 'FETCH_TIMEOUT',
  PARSE_FAILED: 'PARSE_FAILED',
  OEMBED_FAILED: 'OEMBED_FAILED',
  AI_FAILED: 'AI_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;
