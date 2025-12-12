/**
 * Link Identification Pipeline
 *
 * Main entry point for the comprehensive link identification system.
 * Orchestrates multiple stages to achieve high accuracy product identification.
 */

import { parseProductUrl, formatProductName, type ParsedProductUrl } from './urlParser';
import { lightweightFetch, getBestTitle, getPrice, getImage, type LightweightFetchResult } from './lightweightFetch';
import { analyzeUrlWithAI, quickAIAnalysis, type AIProductAnalysis } from './aiSemanticAnalysis';
import { getBrandFromDomain } from './domainBrands';
import { trackUnrecognizedDomain } from './trackUnrecognizedDomain';
import { fetchViaJinaReader, extractAmazonProductInfo } from './jinaReader';

export interface ProductIdentificationResult {
  // Core product info
  brand: string | null;
  productName: string;
  fullName: string;
  category: string | null;

  // Additional details
  specifications: string[];
  price: string | null;
  currency: string | null;
  imageUrl: string | null;

  // Metadata
  confidence: number;
  sources: string[];
  primarySource: string;
  processingTimeMs: number;

  // Debug info
  urlParsed: ParsedProductUrl;
  fetchResult: LightweightFetchResult | null;
}

export interface IdentificationOptions {
  // Skip network requests entirely (URL intelligence only)
  urlOnly?: boolean;

  // Skip AI analysis (structured data + URL parsing only)
  skipAI?: boolean;

  // Timeout for fetch operations
  fetchTimeout?: number;

  // Minimum confidence to return early
  earlyExitConfidence?: number;
}

/**
 * Identify a product from a URL
 *
 * This is the main entry point for the link identification system.
 * It runs through multiple stages, exiting early when confidence is high enough.
 */
export async function identifyProduct(
  url: string,
  options: IdentificationOptions = {}
): Promise<ProductIdentificationResult> {
  const startTime = Date.now();
  const sources: string[] = [];

  const {
    urlOnly = false,
    skipAI = false,
    fetchTimeout = 8000,
    earlyExitConfidence = 0.85,
  } = options;

  // ========================================
  // STAGE 1: URL Intelligence (No Network)
  // ========================================
  const parsedUrl = parseProductUrl(url);
  sources.push('url_parsing');

  // Track unrecognized domains (fire-and-forget, non-blocking)
  if (!parsedUrl.brandInfo && parsedUrl.domain) {
    // Don't await - let it run in the background
    trackUnrecognizedDomain(
      parsedUrl.domain,
      url,
      null, // We'll update with AI suggestion later if needed
      null
    ).catch(() => {}); // Ignore errors
  }

  // If we have brand + good humanized name, we might have enough
  if (parsedUrl.brand && parsedUrl.humanizedName && parsedUrl.urlConfidence >= earlyExitConfidence) {
    // Quick AI polish if not skipped
    if (!skipAI && !urlOnly) {
      const quickResult = await quickAIAnalysis(url, parsedUrl);
      if (quickResult && quickResult.confidence >= earlyExitConfidence) {
        sources.push('ai_quick');
        return buildResult({
          brand: quickResult.brand,
          productName: quickResult.productName,
          fullName: quickResult.fullName,
          category: quickResult.category,
          specifications: quickResult.specifications,
          confidence: quickResult.confidence,
          primarySource: 'ai_quick',
          sources,
          parsedUrl,
          fetchResult: null,
          startTime,
        });
      }
    }

    // Return URL-only result if confidence is very high
    if (parsedUrl.urlConfidence >= 0.8 && urlOnly) {
      return buildResult({
        brand: parsedUrl.brand,
        productName: parsedUrl.humanizedName,
        fullName: formatProductName(parsedUrl) || parsedUrl.humanizedName,
        category: parsedUrl.category,
        specifications: [],
        confidence: parsedUrl.urlConfidence,
        primarySource: 'url_parsing',
        sources,
        parsedUrl,
        fetchResult: null,
        startTime,
      });
    }
  }

  // If URL-only mode, return what we have
  if (urlOnly) {
    return buildResult({
      brand: parsedUrl.brand,
      productName: parsedUrl.humanizedName || 'Unknown Product',
      fullName: formatProductName(parsedUrl) || 'Unknown Product',
      category: parsedUrl.category,
      specifications: [],
      confidence: parsedUrl.urlConfidence,
      primarySource: 'url_parsing',
      sources,
      parsedUrl,
      fetchResult: null,
      startTime,
    });
  }

  // ========================================
  // STAGE 2: Lightweight Fetch
  // ========================================
  const fetchResult = await lightweightFetch(url, { timeout: fetchTimeout });
  sources.push('fetch');

  // If we got good structured data, use it
  if (fetchResult.success && fetchResult.data?.jsonLd?.name) {
    sources.push('structured_data');

    const title = getBestTitle(fetchResult.data);
    const { amount, currency } = getPrice(fetchResult.data);
    const imageUrl = getImage(fetchResult.data);

    // Extract brand from JSON-LD or fall back to domain
    let brand = null;
    if (fetchResult.data.jsonLd.brand) {
      brand = typeof fetchResult.data.jsonLd.brand === 'string'
        ? fetchResult.data.jsonLd.brand
        : fetchResult.data.jsonLd.brand.name || null;
    }
    brand = brand || parsedUrl.brand;

    // Clean product name
    let productName = title || parsedUrl.humanizedName || 'Unknown Product';
    if (brand && productName.toLowerCase().startsWith(brand.toLowerCase())) {
      productName = productName.slice(brand.length).replace(/^[-–—|:\s]+/, '').trim();
    }

    const fullName = brand ? `${brand} ${productName}` : productName;

    return buildResult({
      brand,
      productName,
      fullName,
      category: parsedUrl.category || fetchResult.data.jsonLd.category || null,
      specifications: [],
      price: amount,
      currency,
      imageUrl,
      confidence: 0.95,
      primarySource: 'structured_data',
      sources,
      parsedUrl,
      fetchResult,
      startTime,
    });
  }

  // ========================================
  // STAGE 2.5: Jina Reader Fallback (for blocked sites)
  // ========================================
  if (fetchResult.blocked || (!fetchResult.success && parsedUrl.isRetailer)) {
    sources.push('jina_reader');

    const jinaResult = await fetchViaJinaReader(url);

    if (jinaResult.success && jinaResult.title) {
      // For Amazon specifically, extract structured info
      const isAmazon = parsedUrl.domain.includes('amazon');

      if (isAmazon && jinaResult.content) {
        const amazonInfo = extractAmazonProductInfo(jinaResult.content);

        if (amazonInfo.title) {
          const brand = amazonInfo.brand;
          let productName = amazonInfo.title;

          // Remove brand from product name if present at start
          if (brand && productName.toLowerCase().startsWith(brand.toLowerCase())) {
            productName = productName.slice(brand.length).replace(/^[-–—|:\s]+/, '').trim();
          }

          const fullName = brand ? `${brand} ${productName}` : productName;

          return buildResult({
            brand,
            productName,
            fullName,
            category: parsedUrl.category,
            specifications: amazonInfo.features,
            price: amazonInfo.price,
            confidence: 0.85,
            primarySource: 'jina_amazon',
            sources,
            parsedUrl,
            fetchResult,
            startTime,
          });
        }
      }

      // Generic Jina result
      const productName = jinaResult.title;
      return buildResult({
        brand: parsedUrl.brand,
        productName,
        fullName: parsedUrl.brand ? `${parsedUrl.brand} ${productName}` : productName,
        category: parsedUrl.category,
        specifications: jinaResult.description ? [jinaResult.description] : [],
        confidence: 0.75,
        primarySource: 'jina_reader',
        sources,
        parsedUrl,
        fetchResult,
        startTime,
      });
    }
  }

  // ========================================
  // STAGE 3: AI Semantic Analysis
  // ========================================
  if (!skipAI) {
    sources.push('ai_analysis');

    // Pass Jina content to AI if direct fetch failed but Jina succeeded
    const aiResult = await analyzeUrlWithAI(url, parsedUrl, fetchResult);

    // If AI identified a brand for an unknown domain, update the tracking
    if (!parsedUrl.brandInfo && parsedUrl.domain && aiResult.brand) {
      trackUnrecognizedDomain(
        parsedUrl.domain,
        url,
        aiResult.brand,
        aiResult.category
      ).catch(() => {}); // Ignore errors
    }

    // Get image from fetch result if available
    const imageUrl = fetchResult.success && fetchResult.data
      ? getImage(fetchResult.data)
      : null;

    return buildResult({
      brand: aiResult.brand,
      productName: aiResult.productName,
      fullName: aiResult.fullName,
      category: aiResult.category,
      specifications: aiResult.specifications,
      price: aiResult.estimatedPrice,
      imageUrl,
      confidence: aiResult.confidence,
      primarySource: aiResult.source,
      sources,
      parsedUrl,
      fetchResult,
      startTime,
    });
  }

  // ========================================
  // FALLBACK: Return best effort from URL parsing
  // ========================================
  return buildResult({
    brand: parsedUrl.brand,
    productName: parsedUrl.humanizedName || 'Unknown Product',
    fullName: formatProductName(parsedUrl) || 'Unknown Product',
    category: parsedUrl.category,
    specifications: [],
    confidence: parsedUrl.urlConfidence,
    primarySource: 'url_parsing',
    sources,
    parsedUrl,
    fetchResult,
    startTime,
  });
}

/**
 * Build the final result object
 */
function buildResult(params: {
  brand: string | null;
  productName: string;
  fullName: string;
  category: string | null;
  specifications: string[];
  price?: string | null;
  currency?: string | null;
  imageUrl?: string | null;
  confidence: number;
  primarySource: string;
  sources: string[];
  parsedUrl: ParsedProductUrl;
  fetchResult: LightweightFetchResult | null;
  startTime: number;
}): ProductIdentificationResult {
  return {
    brand: params.brand,
    productName: params.productName,
    fullName: params.fullName,
    category: params.category,
    specifications: params.specifications,
    price: params.price || null,
    currency: params.currency || null,
    imageUrl: params.imageUrl || null,
    confidence: params.confidence,
    sources: params.sources,
    primarySource: params.primarySource,
    processingTimeMs: Date.now() - params.startTime,
    urlParsed: params.parsedUrl,
    fetchResult: params.fetchResult,
  };
}

/**
 * Batch identify products from multiple URLs
 */
export async function identifyProducts(
  urls: string[],
  options: IdentificationOptions = {}
): Promise<ProductIdentificationResult[]> {
  // Process in parallel with concurrency limit
  const concurrency = 5;
  const results: ProductIdentificationResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => identifyProduct(url, options))
    );
    results.push(...batchResults);
  }

  return results;
}

// Re-export types and utilities
export { parseProductUrl, type ParsedProductUrl } from './urlParser';
export { getBrandFromDomain, type DomainBrandInfo } from './domainBrands';
export { lightweightFetch, type LightweightFetchResult, type StructuredProductData } from './lightweightFetch';
export { type AIProductAnalysis } from './aiSemanticAnalysis';
export { trackUnrecognizedDomain } from './trackUnrecognizedDomain';
