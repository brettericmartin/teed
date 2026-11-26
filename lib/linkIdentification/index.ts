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
import {
  isAmazonUrl,
  isAmazonShortHost,
  extractAsin,
  canonicalAmazonUrl,
  resolveAmazonShortLink,
  cleanAmazonTitle,
  isJunkTitle,
  searchAmazonTitleByAsin,
  shortenAmazonTitle,
  extractAmazonBrand,
  pickAmazonImage,
} from './amazon';
import { scrapeWithFirecrawl, type FirecrawlResult } from './firecrawl';
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

  // Where a short link led, when it was followed
  resolvedUrl?: string | null;
  // Plain words for the person when nothing could be read
  failureReason?: string | null;
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

  // Skip the paid Firecrawl scraper (tests, or to save credits)
  skipFirecrawl?: boolean;

  // Skip the product library cache (tests)
  skipLibrary?: boolean;
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
    skipFirecrawl = false,
    skipLibrary = false,
  } = options;

  // ========================================
  // STAGE 0: Check Product Library FIRST
  // ========================================
  // This saves API calls if we've scraped this URL before
  const libraryEntry = skipLibrary ? null : await lookupInLibrary(url);
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
  // AMAZON: its own path. Amazon refuses most reads, and the general path
  // used to end with the AI guessing a product from the bare ASIN.
  // ========================================
  if (isAmazonUrl(url) && !urlOnly) {
    return identifyAmazonProduct(url, { skipFirecrawl, skipLibrary, sources, startTime });
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

  // ========================================
  // STAGE 1.5: Walmart Fast Path (skip fetching — bot walls)
  // ========================================
  // Walmart blocks all scraping attempts. Their URL slugs are descriptive
  // enough to identify products without fetching the page.
  const isWalmart = parsedUrl.domain.includes('walmart');
  if (isWalmart && parsedUrl.humanizedName) {
    sources.push('walmart_fast_path');

    // Use quick AI polish if available
    if (!skipAI) {
      const quickResult = await quickAIAnalysis(url, parsedUrl);
      if (quickResult && quickResult.confidence >= 0.7) {
        sources.push('ai_quick');

        // Try Google Images for a product photo
        const searchQuery = buildProductSearchQuery(
          quickResult.brand || parsedUrl.brand || '',
          quickResult.productName
        );
        const googleImages = await searchGoogleImages(searchQuery, 3);
        const imageUrl = googleImages.length > 0 ? googleImages[0] : null;

        return buildResult({
          brand: quickResult.brand,
          productName: quickResult.productName,
          fullName: quickResult.fullName,
          category: quickResult.category,
          specifications: quickResult.specifications,
          imageUrl,
          confidence: quickResult.confidence,
          primarySource: 'ai_quick',
          sources,
          parsedUrl,
          fetchResult: null,
          startTime,
        });
      }
    }

    // Fall back to URL parsing + Google Images
    const brand = parsedUrl.brand;
    const productName = parsedUrl.humanizedName;
    const fullName = brand ? `${brand} ${productName}` : productName;

    const searchQuery = buildProductSearchQuery(brand || '', productName);
    const googleImages = await searchGoogleImages(searchQuery, 3);
    const imageUrl = googleImages.length > 0 ? googleImages[0] : null;

    return buildResult({
      brand,
      productName,
      fullName,
      category: parsedUrl.category,
      specifications: [],
      imageUrl,
      confidence: Math.max(parsedUrl.urlConfidence, 0.75), // Walmart slugs are reliable
      primarySource: 'url_parsing',
      sources,
      parsedUrl,
      fetchResult: null,
      startTime,
    });
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

  // Amazon links never reach this point (see identifyAmazonProduct)
  // ========================================
  // STAGE 2.6: Firecrawl Fallback (for blocked sites like Amazon)
  // ========================================
  // Note: Library was already checked in STAGE 0, so we go straight to Firecrawl
  // Also trigger for Amazon when the direct lookup failed (Amazon blocks most scraping)
  const needsFirecrawl = fetchResult.blocked ||
    (!fetchResult.success && parsedUrl.isRetailer);
  if (needsFirecrawl) {
    // For short URLs, use the resolved URL so Firecrawl scrapes the real page
    const firecrawlUrl = fetchResult.finalUrl || url;
    if (!skipFirecrawl) sources.push('firecrawl');
    const firecrawlResult: FirecrawlResult = skipFirecrawl
      ? { success: false, title: null, brand: null, description: null, price: null, image: null, markdown: null }
      : await scrapeWithFirecrawl(firecrawlUrl);

    if (firecrawlResult.success && firecrawlResult.title) {
      // Validate Firecrawl result - check if it's actually product content
      // If URL parsing found a brand but Firecrawl didn't, or the title looks like a homepage, skip it
      const titleLower = firecrawlResult.title.toLowerCase();
      const looksLikeHomepage = titleLower.includes('buy golf equipment') ||
                                titleLower.includes('shop online') ||
                                titleLower.includes('denied') ||
                                titleLower.includes('access to this page') ||
                                titleLower.includes('page not found') ||
                                titleLower.includes('not found') ||
                                titleLower === '404' ||
                                titleLower.includes('error page') ||
                                isJunkTitle(firecrawlResult.title);

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
    const jinaUrl = fetchResult.finalUrl || url;
    const jinaResult = await fetchViaJinaReader(jinaUrl);

    if (jinaResult.success && jinaResult.title && !isJunkTitle(jinaResult.title)) {
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
 * Amazon links: follow a short link, read the ASIN, then try the free product
 * page, Firecrawl, Jina and a web search for the ASIN, in that order. When none
 * of them can read the page, use the name in the link if there is one, and
 * otherwise say plainly that it couldn't be read. The AI never guesses a
 * product from the ASIN alone, because that invented unrelated products.
 */
async function identifyAmazonProduct(
  url: string,
  ctx: { skipFirecrawl: boolean; skipLibrary: boolean; sources: string[]; startTime: number }
): Promise<ProductIdentificationResult> {
  const { sources, startTime } = ctx;
  sources.push('amazon');

  let resolved: string | null = url;
  try {
    if (isAmazonShortHost(new URL(url).hostname)) {
      sources.push('amazon_short_link');
      resolved = await resolveAmazonShortLink(url);
    }
  } catch {
    resolved = null;
  }

  const target = resolved || url;
  const parsedUrl = parseProductUrl(target);
  const asin = resolved ? extractAsin(resolved) : null;
  const canonical = asin ? canonicalAmazonUrl(resolved as string, asin) : null;
  const host = canonical ? new URL(canonical).hostname : 'www.amazon.com';

  let listingGone = false;
  const finish = (r: {
    brand: string | null;
    title: string;
    price?: string | null;
    imageUrl?: string | null;
    specifications?: string[];
    confidence: number;
    source: string;
    save?: boolean;
  }): ProductIdentificationResult => {
    const brand = r.brand?.trim() || null;
    const shortTitle = shortenAmazonTitle(r.title);
    const specifications = [...(r.specifications || [])];
    if (shortTitle !== r.title) specifications.unshift(r.title);
    r = { ...r, title: shortTitle, specifications };
    let productName = r.title;
    if (brand && productName.toLowerCase().startsWith(brand.toLowerCase())) {
      productName = productName.slice(brand.length).replace(/^[-–—|:,\s]+/, '').trim() || r.title;
    }
    const fullName = brand && !r.title.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${r.title}`
      : r.title;
    if (r.save && r.confidence >= 0.7) {
      const entry = {
        domain: host.replace(/^www\./, ''),
        brand,
        productName,
        fullName,
        category: parsedUrl.category,
        description: null,
        price: r.price ?? null,
        imageUrl: r.imageUrl ?? null,
        specifications: r.specifications || [],
        confidence: r.confidence,
        source: r.source,
      };
      const urls = Array.from(new Set([canonical, url].filter(Boolean) as string[]));
      for (const u of urls) saveToLibrary({ ...entry, url: u }).catch(() => {});
    }
    sources.push(r.source);
    return buildResult({
      brand,
      productName,
      fullName,
      category: parsedUrl.category,
      specifications: r.specifications || [],
      price: r.price ?? null,
      imageUrl: r.imageUrl && !r.imageUrl.includes('amazon-adsystem.com') ? r.imageUrl : null,
      confidence: r.confidence,
      primarySource: r.source,
      sources,
      parsedUrl,
      fetchResult: null,
      startTime,
      resolvedUrl: canonical || resolved,
    });
  };

  if (asin && canonical) {
    // Cache, keyed by the one canonical address for this product
    if (!ctx.skipLibrary) {
      const cached = await lookupInLibrary(canonical);
      if (cached && !isJunkTitle(cached.product_name) && !isJunkTitle(cached.full_name)) {
        sources.push('product_library');
        return buildResult({
          brand: cached.brand,
          productName: cached.product_name || cached.full_name || 'Unknown Product',
          fullName: cached.full_name || cached.product_name || 'Unknown Product',
          category: cached.category || parsedUrl.category,
          specifications: cached.specifications || [],
          price: cached.price,
          imageUrl: cached.image_url,
          confidence: cached.confidence,
          primarySource: 'product_library',
          sources,
          parsedUrl,
          fetchResult: null,
          startTime,
          resolvedUrl: canonical,
        });
      }
    }

    // 1. Amazon's own page (free)
    const page = await lookupAmazonProduct(asin, host);
    if (page.success && page.title && !isJunkTitle(page.title)) {
      return finish({
        brand: page.brand,
        title: page.title,
        price: page.price,
        imageUrl: page.image,
        confidence: 0.9,
        source: 'amazon_lookup',
        save: true,
      });
    }

    // 2. Firecrawl (paid, cached for 30 days per address)
    if (!ctx.skipFirecrawl) {
      sources.push('firecrawl');
      const fc = await scrapeWithFirecrawl(canonical);
      const title = fc.success ? cleanAmazonTitle(fc.title) : null;
      if (fc.success && /page not found|looking for something/i.test(fc.title || '')) listingGone = true;
      if (title && !isJunkTitle(title)) {
        // Older cached reads picked the first image on the page, often an ad
        const trusted = fc.imageVerified !== undefined;
        return finish({
          brand: extractAmazonBrand(fc.markdown) || (trusted ? fc.brand : null),
          title,
          price: fc.price,
          imageUrl: trusted && fc.image ? fc.image : pickAmazonImage(fc.markdown, title),
          specifications: fc.description ? [fc.description] : [],
          confidence: 0.9,
          source: 'firecrawl',
          save: true,
        });
      }
    }

    // 3. Jina Reader (free)
    sources.push('jina_reader');
    const jina = await fetchViaJinaReader(canonical, 12000);
    if (jina.success && jina.content) {
      const info = extractAmazonProductInfo(jina.content);
      const title = cleanAmazonTitle(info.title || jina.title);
      if (title && !isJunkTitle(title)) {
        return finish({
          brand: info.brand,
          title,
          price: info.price,
          specifications: info.features || [],
          confidence: 0.85,
          source: 'jina_amazon',
          save: true,
        });
      }
    }

    // 4. Web search for the ASIN
    sources.push('asin_search');
    const found = await searchAmazonTitleByAsin(asin);
    if (found) {
      return finish({
        brand: null,
        title: found.title,
        imageUrl: found.image,
        confidence: 0.75,
        source: 'asin_search',
        save: true,
      });
    }
  }

  // 5. The product name written in the link itself, if any
  const slugName = parsedUrl.humanizedName?.trim() || '';
  const slugWords = slugName.split(/\s+/).filter(Boolean);
  const slugLooksLikeName =
    slugWords.length >= 2 &&
    !/^(gp|dp|product|d|aw|exec)$/i.test(slugWords[0]) &&
    !(asin && slugName.toUpperCase().replace(/\s+/g, '').includes(asin));
  if (slugLooksLikeName) {
    const brand = parsedUrl.brand;
    const name = slugName;
    const images = await searchGoogleImages(buildProductSearchQuery(brand || '', name), 3);
    return finish({
      brand,
      title: brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${name}` : name,
      imageUrl: images[0] || null,
      confidence: 0.55,
      source: 'url_slug',
    });
  }

  // Nothing could read it. Say so rather than guess.
  return buildResult({
    brand: null,
    productName: 'Unknown Product',
    fullName: 'Unknown Product',
    category: null,
    specifications: [],
    confidence: 0.1,
    primarySource: 'amazon_unreadable',
    sources,
    parsedUrl,
    fetchResult: null,
    startTime,
    resolvedUrl: canonical || resolved,
    failureReason: !resolved
      ? "This Amazon short link didn't open. Paste the full amazon.com link, or type the product name."
      : !asin
        ? "This Amazon link doesn't point to a product page. Paste the product's own link, or type the product name."
        : listingGone
          ? 'This Amazon listing no longer exists. Type the product name to add it anyway.'
          : "Amazon wouldn't show us this product right now. Try again in a minute, or type the product name.",
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
  resolvedUrl?: string | null;
  failureReason?: string | null;
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
    resolvedUrl: params.resolvedUrl ?? null,
    failureReason: params.failureReason ?? null,
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
