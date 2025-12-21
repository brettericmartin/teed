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
import { lookupAmazonProduct } from './amazonLookup';
import { scrapeWithFirecrawl } from './firecrawl';
import { searchGoogleImages, buildProductSearchQuery } from './googleImageSearch';
import { lookupInLibrary, saveToLibrary } from './productLibrary';

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
    fetchTimeout = 5000, // Reduced from 8s for faster failures
    earlyExitConfidence = 0.85,
  } = options;

  // ========================================
  // STAGE 0: Check Product Library FIRST
  // ========================================
  // This saves API calls if we've scraped this URL before
  const libraryEntry = await lookupInLibrary(url);
  if (libraryEntry) {
    sources.push('product_library');
    const parsedUrlForLibrary = parseProductUrl(url);
    return buildResult({
      brand: libraryEntry.brand,
      productName: libraryEntry.product_name || 'Unknown Product',
      fullName: libraryEntry.full_name || libraryEntry.product_name || 'Unknown Product',
      category: libraryEntry.category || parsedUrlForLibrary.category,
      specifications: libraryEntry.specifications || [],
      price: libraryEntry.price,
      imageUrl: libraryEntry.image_url,
      confidence: libraryEntry.confidence,
      primarySource: 'product_library',
      sources,
      parsedUrl: parsedUrlForLibrary,
      fetchResult: null,
      startTime,
    });
  }

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
  // STAGE 2.5: Amazon-Specific Lookup (HIGH PRIORITY)
  // ========================================
  const isAmazon = parsedUrl.domain.includes('amazon');
  const asin = parsedUrl.modelNumber;

  if (isAmazon && asin) {
    sources.push('amazon_lookup');

    // Try direct Amazon lookup first
    const amazonResult = await lookupAmazonProduct(asin);

    if (amazonResult.success && amazonResult.title) {
      const brand = amazonResult.brand;
      let productName = amazonResult.title;

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
        specifications: [],
        price: amazonResult.price,
        // Only use the image from Amazon if it's a real CDN URL, not the widget URL
        imageUrl: amazonResult.image && !amazonResult.image.includes('amazon-adsystem.com') ? amazonResult.image : null,
        confidence: 0.90, // High confidence - we got real data
        primarySource: 'amazon_lookup',
        sources,
        parsedUrl,
        fetchResult,
        startTime,
      });
    }
    // Note: We no longer fall back to getAmazonImageUrl() as those widget URLs are unreliable
    // Google Images fallback will be used instead if needed
  }

  // ========================================
  // STAGE 2.6: Firecrawl Fallback (for blocked sites like Amazon)
  // ========================================
  // Note: Library was already checked in STAGE 0, so we go straight to Firecrawl
  if (fetchResult.blocked || (!fetchResult.success && parsedUrl.isRetailer)) {
    sources.push('firecrawl');

    const firecrawlResult = await scrapeWithFirecrawl(url);

    if (firecrawlResult.success && firecrawlResult.title) {
      // Validate Firecrawl result - check if it's actually product content
      // If URL parsing found a brand but Firecrawl didn't, or the title looks like a homepage, skip it
      const looksLikeHomepage = firecrawlResult.title.toLowerCase().includes('buy golf equipment') ||
                                firecrawlResult.title.toLowerCase().includes('shop online') ||
                                firecrawlResult.title.toLowerCase().includes('denied') ||
                                firecrawlResult.title.toLowerCase().includes('access to this page');

      // If URL parsing found a specific product but Firecrawl returned generic content, skip Firecrawl
      const urlHasGoodData = parsedUrl.brand && parsedUrl.humanizedName;

      if (!looksLikeHomepage) {
        const brand = firecrawlResult.brand;
        let productName = firecrawlResult.title;

        // Remove brand from product name if present at start
        if (brand && productName.toLowerCase().startsWith(brand.toLowerCase())) {
          productName = productName.slice(brand.length).replace(/^[-–—|:\s]+/, '').trim();
        }

        const fullName = brand ? `${brand} ${productName}` : productName;

        // Save to product library for future lookups (non-blocking)
        saveToLibrary({
          url,
          domain: parsedUrl.domain,
          brand,
          productName,
          fullName,
          category: parsedUrl.category,
          description: firecrawlResult.description,
          price: firecrawlResult.price,
          imageUrl: firecrawlResult.image,
          specifications: firecrawlResult.description ? [firecrawlResult.description] : [],
          confidence: 0.90,
          source: 'firecrawl',
        }).catch(() => {}); // Ignore save errors

        return buildResult({
          brand,
          productName,
          fullName,
          category: parsedUrl.category,
          specifications: firecrawlResult.description ? [firecrawlResult.description] : [],
          price: firecrawlResult.price,
          // Don't fall back to Amazon widget URLs - they're unreliable. Google Images will be used instead.
          imageUrl: firecrawlResult.image || null,
          confidence: 0.90, // High confidence - Firecrawl got real data
          primarySource: 'firecrawl',
          sources,
          parsedUrl,
          fetchResult,
          startTime,
        });
      } else {
        console.log(`[linkIdentification] Firecrawl returned homepage/error content for ${parsedUrl.domain}, skipping`);
      }
    }

    // If Firecrawl also failed, try Jina Reader as last resort
    sources.push('jina_reader');
    const jinaResult = await fetchViaJinaReader(url);

    if (jinaResult.success && jinaResult.title) {
      // For Amazon specifically, extract structured info
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

          // Save to product library (non-blocking)
          saveToLibrary({
            url,
            domain: parsedUrl.domain,
            brand,
            productName,
            fullName,
            category: parsedUrl.category,
            description: null,
            price: amazonInfo.price,
            imageUrl: null,
            specifications: amazonInfo.features,
            confidence: 0.85,
            source: 'jina_amazon',
          }).catch(() => {});

          return buildResult({
            brand,
            productName,
            fullName,
            category: parsedUrl.category,
            specifications: amazonInfo.features,
            price: amazonInfo.price,
            // Don't use Amazon widget URLs - they're unreliable. Google Images will be used instead.
            imageUrl: null,
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
      const fullNameJina = parsedUrl.brand ? `${parsedUrl.brand} ${productName}` : productName;

      // Save to product library (non-blocking)
      saveToLibrary({
        url,
        domain: parsedUrl.domain,
        brand: parsedUrl.brand,
        productName,
        fullName: fullNameJina,
        category: parsedUrl.category,
        description: jinaResult.description,
        price: null,
        imageUrl: null,
        specifications: jinaResult.description ? [jinaResult.description] : [],
        confidence: 0.75,
        source: 'jina_reader',
      }).catch(() => {});

      return buildResult({
        brand: parsedUrl.brand,
        productName,
        fullName: fullNameJina,
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

    // ========================================
    // STAGE 2.7: URL Parsing + Google Images Fallback
    // ========================================
    // If all scraping methods failed but we have good URL data, use that + Google Images
    if (parsedUrl.brand && parsedUrl.humanizedName && parsedUrl.urlConfidence >= 0.5) {
      sources.push('google_images');
      console.log(`[linkIdentification] Scraping blocked for ${parsedUrl.domain}, falling back to URL parsing + Google Images`);

      const searchQuery = buildProductSearchQuery(parsedUrl.brand, parsedUrl.humanizedName);
      const googleImages = await searchGoogleImages(searchQuery, 3);

      const imageUrl = googleImages.length > 0 ? googleImages[0] : null;

      return buildResult({
        brand: parsedUrl.brand,
        productName: parsedUrl.humanizedName,
        fullName: `${parsedUrl.brand} ${parsedUrl.humanizedName}`,
        category: parsedUrl.category,
        specifications: [],
        imageUrl,
        confidence: 0.75, // Good confidence - we have brand + name from URL
        primarySource: 'url_google_fallback',
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

    // CRITICAL: If fetch was blocked, don't pass the bot page content to AI
    // Just pass null so AI uses its knowledge (especially for Amazon ASINs)
    const fetchResultForAI = fetchResult.blocked ? null : fetchResult;
    const aiResult = await analyzeUrlWithAI(url, parsedUrl, fetchResultForAI);

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
