/**
 * Extraction Pipeline
 *
 * Unified extraction interface that integrates the existing linkIdentification
 * system with the new Link Intelligence architecture.
 *
 * This module provides:
 * - Clean interface using new types
 * - Integration with classifier for embed/social/product routing
 * - Health checking and oEmbed capabilities
 * - Backward compatibility with existing functionality
 */

import type {
  ProductResult,
  EmbedResult,
  SocialProfileResult,
  LinkAnalysisResult,
  FullAnalysisResult,
  AnalysisOptions,
  ExtractionSource,
  ClassifiedUrl,
  LinkHealthResult,
} from './types';
import { classifyUrl, parseEmbedUrl, parseSocialProfileUrl } from './classifier';
import { fetchOEmbed, enrichEmbedWithOEmbed } from './oembed';
import { checkUrlHealth } from './health';

// Import existing extraction system
import {
  identifyProduct,
  type ProductIdentificationResult,
  type IdentificationOptions,
} from '../linkIdentification';

// =============================================================================
// SOURCE MAPPING
// =============================================================================

/**
 * Map old source names to new ExtractionSource type
 */
function mapSource(source: string): ExtractionSource {
  const mapping: Record<string, ExtractionSource> = {
    'product_library': 'cache',
    'url_parsing': 'url_parsing',
    'fetch': 'css_selectors', // Generic fetch maps to selectors
    'structured_data': 'json_ld',
    'amazon_lookup': 'amazon_lookup',
    'firecrawl': 'firecrawl',
    'jina_reader': 'jina_reader',
    'jina_amazon': 'jina_reader',
    'google_images': 'google_images',
    'ai_analysis': 'ai_analysis',
    'ai_quick': 'ai_analysis',
    'url_google_fallback': 'google_images',
  };
  return mapping[source] || 'url_parsing';
}

/**
 * Convert old ProductIdentificationResult to new ProductResult
 */
function convertToProductResult(
  result: ProductIdentificationResult,
  url: string
): ProductResult {
  return {
    type: 'product',
    url,
    brand: result.brand,
    productName: result.productName,
    fullName: result.fullName,
    category: result.category,
    specifications: result.specifications,
    description: result.specifications.length > 0 ? result.specifications[0] : undefined,
    price: result.price ? parseFloat(result.price.replace(/[^0-9.]/g, '')) : undefined,
    currency: result.currency,
    availability: 'unknown', // Existing system doesn't track this
    imageUrl: result.imageUrl,
    sku: result.urlParsed.modelNumber,
    asin: result.urlParsed.domain.includes('amazon') ? result.urlParsed.modelNumber : undefined,
    confidence: result.confidence,
    sources: result.sources.map(mapSource),
    primarySource: mapSource(result.primarySource),
    processingTimeMs: result.processingTimeMs,
    cached: result.primarySource === 'product_library',
  };
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Analyze a URL and return enriched result based on type
 *
 * @param url - URL to analyze
 * @param options - Analysis options
 * @returns Full analysis result with classification, extracted data, and optional health
 */
export async function analyzeUrl(
  url: string,
  options: AnalysisOptions = {}
): Promise<FullAnalysisResult> {
  const startTime = Date.now();
  const {
    skipCache = false,
    skipAi = false,
    skipOembed = false,
    skipHealth = false,
    timeout = 30000,
    fetchTimeout = 5000,
    earlyExitConfidence = 0.85,
  } = options;

  // Step 1: Classify the URL
  const classification = classifyUrl(url);

  // Step 2: Extract based on type
  let result: LinkAnalysisResult;
  let health: LinkHealthResult | undefined;

  switch (classification.type) {
    case 'embed': {
      // Parse embed details
      const embedResult = parseEmbedUrl(url);
      if (!embedResult) {
        // Fallback to product if parsing fails
        result = await extractProduct(url, { skipCache, skipAi, fetchTimeout, earlyExitConfidence });
        break;
      }

      // Optionally enrich with oEmbed
      if (!skipOembed) {
        result = await enrichEmbedWithOEmbed(embedResult, { timeout: 10000 });
      } else {
        result = embedResult;
      }
      break;
    }

    case 'social': {
      // Parse social profile
      const socialResult = parseSocialProfileUrl(url);
      if (!socialResult) {
        // Fallback to product if parsing fails
        result = await extractProduct(url, { skipCache, skipAi, fetchTimeout, earlyExitConfidence });
        break;
      }
      result = socialResult;
      break;
    }

    case 'product':
    default: {
      result = await extractProduct(url, { skipCache, skipAi, fetchTimeout, earlyExitConfidence });
      break;
    }
  }

  // Step 3: Optionally check health
  if (!skipHealth) {
    health = await checkUrlHealth(url, {
      timeout: Math.min(15000, timeout - (Date.now() - startTime)),
      checkContent: classification.type === 'product',
    });
  }

  return {
    classification,
    result,
    health,
  };
}

/**
 * Extract product information using the existing pipeline
 */
async function extractProduct(
  url: string,
  options: {
    skipCache?: boolean;
    skipAi?: boolean;
    fetchTimeout?: number;
    earlyExitConfidence?: number;
  }
): Promise<ProductResult> {
  const identifyOptions: IdentificationOptions = {
    urlOnly: false,
    skipAI: options.skipAi,
    fetchTimeout: options.fetchTimeout,
    earlyExitConfidence: options.earlyExitConfidence,
  };

  const result = await identifyProduct(url, identifyOptions);
  return convertToProductResult(result, url);
}

// =============================================================================
// BATCH ANALYSIS
// =============================================================================

export interface BatchAnalysisResult {
  results: Map<string, FullAnalysisResult>;
  summary: {
    total: number;
    embeds: number;
    social: number;
    products: number;
    healthy: number;
    broken: number;
    processingTimeMs: number;
  };
}

/**
 * Analyze multiple URLs with progress tracking
 */
export async function analyzeUrls(
  urls: string[],
  options: AnalysisOptions & {
    concurrency?: number;
    onProgress?: (completed: number, total: number, result: FullAnalysisResult) => void;
  } = {}
): Promise<BatchAnalysisResult> {
  const startTime = Date.now();
  const { concurrency = 5, onProgress, ...analysisOptions } = options;

  const results = new Map<string, FullAnalysisResult>();
  let embeds = 0;
  let social = 0;
  let products = 0;
  let healthy = 0;
  let broken = 0;
  let completed = 0;

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await analyzeUrl(url, analysisOptions);
        return { url, result };
      })
    );

    for (const { url, result } of batchResults) {
      results.set(url, result);

      // Update counts
      switch (result.classification.type) {
        case 'embed':
          embeds++;
          break;
        case 'social':
          social++;
          break;
        case 'product':
          products++;
          break;
      }

      if (result.health) {
        if (result.health.health === 'healthy') {
          healthy++;
        } else if (result.health.health === 'broken' || result.health.health === 'soft_404') {
          broken++;
        }
      }

      completed++;
      onProgress?.(completed, urls.length, result);
    }
  }

  return {
    results,
    summary: {
      total: urls.length,
      embeds,
      social,
      products,
      healthy,
      broken,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick product extraction without health check
 */
export async function quickExtractProduct(
  url: string,
  options: { skipAi?: boolean; fetchTimeout?: number } = {}
): Promise<ProductResult> {
  return extractProduct(url, {
    skipAi: options.skipAi ?? true, // Default to skip AI for speed
    fetchTimeout: options.fetchTimeout ?? 3000,
    earlyExitConfidence: 0.7,
  });
}

/**
 * Full product extraction with all stages
 */
export async function fullExtractProduct(
  url: string,
  options: { fetchTimeout?: number } = {}
): Promise<ProductResult> {
  return extractProduct(url, {
    skipAi: false,
    fetchTimeout: options.fetchTimeout ?? 10000,
    earlyExitConfidence: 0.95, // Only exit early with very high confidence
  });
}

/**
 * Extract embed with oEmbed enrichment
 */
export async function extractEmbed(url: string): Promise<EmbedResult | null> {
  const embed = parseEmbedUrl(url);
  if (!embed) return null;

  return enrichEmbedWithOEmbed(embed);
}

/**
 * Extract social profile
 */
export function extractSocialProfile(url: string): SocialProfileResult | null {
  return parseSocialProfileUrl(url);
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

// Re-export the underlying identify functions for direct access
export {
  identifyProduct as identifyProductLegacy,
  type ProductIdentificationResult,
  type IdentificationOptions,
} from '../linkIdentification';
