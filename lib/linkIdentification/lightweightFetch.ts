/**
 * Lightweight Fetch Module
 *
 * Quick, fail-fast fetching of structured data from product URLs.
 * Prioritizes extracting JSON-LD and Open Graph data without full page parsing.
 */

import * as cheerio from 'cheerio';

export interface StructuredProductData {
  // JSON-LD data
  jsonLd: JsonLdProduct | null;

  // Open Graph tags
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogPrice: string | null;
  ogCurrency: string | null;

  // Meta tags
  metaTitle: string | null;
  metaDescription: string | null;

  // HTML elements
  h1Title: string | null;
  pageTitle: string | null;
}

export interface JsonLdProduct {
  '@type': string;
  name?: string;
  brand?: { name?: string } | string;
  description?: string;
  image?: string | string[];
  offers?: {
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
  } | Array<{
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
  }>;
  aggregateRating?: {
    ratingValue?: string | number;
    reviewCount?: string | number;
  };
  sku?: string;
  gtin?: string;
  mpn?: string;
  category?: string;
}

export interface LightweightFetchResult {
  success: boolean;
  blocked: boolean;
  reason?: string;
  statusCode?: number;
  data: StructuredProductData | null;
  html: string | null;
  fetchTimeMs: number;
}

// Bot protection detection patterns
const BOT_PROTECTION_PATTERNS = [
  'Pardon Our Interruption',
  'Please verify you are a human',
  'Checking your browser',
  'Enable JavaScript and cookies',
  'Access Denied',
  'cf-browser-verification',
  'cf-challenge',
  'px-captcha',
  'distil_r',
  '_Incapsula_',
  'imperva',
  'Please complete the security check',
  'Just a moment...',
  'DDoS protection by',
  'Attention Required',
  'blocked',
  'captcha',
  'robot',
  'unusual traffic',
];

// Rotating user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

/**
 * Perform a lightweight fetch focusing on structured data extraction
 */
export async function lightweightFetch(
  url: string,
  options: {
    timeout?: number;
    retries?: number;
  } = {}
): Promise<LightweightFetchResult> {
  const timeout = options.timeout || 8000;
  const maxRetries = options.retries || 2;

  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const userAgent = USER_AGENTS[attempt % USER_AGENTS.length];

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt < maxRetries - 1) {
          await delay(1000 * (attempt + 1));
          continue;
        }
        return {
          success: false,
          blocked: response.status === 403 || response.status === 429,
          reason: `HTTP ${response.status}`,
          statusCode: response.status,
          data: null,
          html: null,
          fetchTimeMs: Date.now() - startTime,
        };
      }

      const html = await response.text();

      // Check for bot protection
      if (isBotProtectionPage(html)) {
        return {
          success: false,
          blocked: true,
          reason: 'bot_protection',
          statusCode: response.status,
          data: null,
          html: html.slice(0, 5000), // Keep small sample for debugging
          fetchTimeMs: Date.now() - startTime,
        };
      }

      // Extract structured data
      const data = extractStructuredData(html);

      return {
        success: true,
        blocked: false,
        statusCode: response.status,
        data,
        html: html.slice(0, 100000), // Limit HTML size
        fetchTimeMs: Date.now() - startTime,
      };

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        if (attempt < maxRetries - 1) {
          await delay(500);
          continue;
        }
        return {
          success: false,
          blocked: false,
          reason: 'timeout',
          data: null,
          html: null,
          fetchTimeMs: Date.now() - startTime,
        };
      }

      if (attempt < maxRetries - 1) {
        await delay(1000 * (attempt + 1));
        continue;
      }

      return {
        success: false,
        blocked: false,
        reason: error.message || 'fetch_error',
        data: null,
        html: null,
        fetchTimeMs: Date.now() - startTime,
      };
    }
  }

  return {
    success: false,
    blocked: false,
    reason: 'max_retries_exceeded',
    data: null,
    html: null,
    fetchTimeMs: Date.now() - startTime,
  };
}

/**
 * Check if the response is a bot protection page
 */
function isBotProtectionPage(html: string): boolean {
  const htmlLower = html.toLowerCase();

  // Check for protection patterns
  for (const pattern of BOT_PROTECTION_PATTERNS) {
    if (htmlLower.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check for very short pages (likely challenge pages)
  if (html.length < 5000 && !html.includes('application/ld+json')) {
    // Check for meta refresh or JavaScript redirect
    if (html.includes('http-equiv="refresh"') ||
        (html.includes('<script') && !html.includes('<body') && html.length < 3000)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract structured data from HTML
 */
function extractStructuredData(html: string): StructuredProductData {
  const $ = cheerio.load(html);

  return {
    jsonLd: extractJsonLd($),
    ogTitle: $('meta[property="og:title"]').attr('content') || null,
    ogDescription: $('meta[property="og:description"]').attr('content') || null,
    ogImage: $('meta[property="og:image"]').attr('content') || null,
    ogPrice: $('meta[property="og:price:amount"], meta[property="product:price:amount"]').attr('content') || null,
    ogCurrency: $('meta[property="og:price:currency"], meta[property="product:price:currency"]').attr('content') || null,
    metaTitle: $('meta[name="title"]').attr('content') || null,
    metaDescription: $('meta[name="description"]').attr('content') || null,
    h1Title: $('h1').first().text().trim() || null,
    pageTitle: $('title').first().text().trim() || null,
  };
}

/**
 * Extract JSON-LD Product data
 */
function extractJsonLd($: cheerio.CheerioAPI): JsonLdProduct | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);

      // Handle @graph format
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        const product = data['@graph'].find((item: any) =>
          item['@type'] === 'Product' ||
          item['@type']?.includes?.('Product')
        );
        if (product) return product as JsonLdProduct;
      }

      // Direct Product type
      if (data['@type'] === 'Product' ||
          (Array.isArray(data['@type']) && data['@type'].includes('Product'))) {
        return data as JsonLdProduct;
      }

      // Array of items
      if (Array.isArray(data)) {
        const product = data.find((item: any) =>
          item['@type'] === 'Product' ||
          item['@type']?.includes?.('Product')
        );
        if (product) return product as JsonLdProduct;
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return null;
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract the best title from structured data
 */
export function getBestTitle(data: StructuredProductData): string | null {
  // Priority: JSON-LD > OG > H1 > Meta > Page Title
  if (data.jsonLd?.name) return data.jsonLd.name;
  if (data.ogTitle) return cleanTitle(data.ogTitle);
  if (data.h1Title) return cleanTitle(data.h1Title);
  if (data.metaTitle) return cleanTitle(data.metaTitle);
  if (data.pageTitle) return cleanTitle(data.pageTitle);
  return null;
}

/**
 * Extract brand from structured data
 */
export function getBrand(data: StructuredProductData): string | null {
  if (!data.jsonLd?.brand) return null;

  if (typeof data.jsonLd.brand === 'string') {
    return data.jsonLd.brand;
  }

  if (typeof data.jsonLd.brand === 'object' && data.jsonLd.brand.name) {
    return data.jsonLd.brand.name;
  }

  return null;
}

/**
 * Extract price from structured data
 */
export function getPrice(data: StructuredProductData): { amount: string | null; currency: string | null } {
  // Try JSON-LD first
  if (data.jsonLd?.offers) {
    const offers = Array.isArray(data.jsonLd.offers)
      ? data.jsonLd.offers[0]
      : data.jsonLd.offers;

    if (offers?.price) {
      return {
        amount: String(offers.price),
        currency: offers.priceCurrency || data.ogCurrency || 'USD',
      };
    }
  }

  // Fall back to OG tags
  if (data.ogPrice) {
    return {
      amount: data.ogPrice,
      currency: data.ogCurrency || 'USD',
    };
  }

  return { amount: null, currency: null };
}

/**
 * Extract image from structured data
 */
export function getImage(data: StructuredProductData): string | null {
  // Try JSON-LD first
  if (data.jsonLd?.image) {
    if (typeof data.jsonLd.image === 'string') {
      return data.jsonLd.image;
    }
    if (Array.isArray(data.jsonLd.image) && data.jsonLd.image.length > 0) {
      return data.jsonLd.image[0];
    }
  }

  // Fall back to OG image
  return data.ogImage || null;
}

/**
 * Clean title by removing site name suffixes
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[\|–—-]\s*[^|–—-]+$/g, '') // Remove " | Site Name" suffix
    .replace(/\s*\([^)]+\)\s*$/, '')         // Remove trailing parenthetical
    .trim();
}
