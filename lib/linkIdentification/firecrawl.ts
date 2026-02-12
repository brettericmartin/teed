/**
 * Firecrawl Integration
 *
 * Uses Firecrawl API for scraping sites that block direct requests (Amazon, etc.)
 * Firecrawl handles JavaScript rendering, bot protection bypass, and returns clean data.
 */

// Simple in-memory cache for Firecrawl results (prevents duplicate API calls on retries)
// Cache entries expire after 10 minutes
const firecrawlCache = new Map<string, { result: FirecrawlResult; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedResult(url: string): FirecrawlResult | null {
  const cached = firecrawlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Firecrawl] Cache hit for ${new URL(url).hostname}`);
    return cached.result;
  }
  if (cached) {
    firecrawlCache.delete(url); // Clean up expired entry
  }
  return null;
}

function setCachedResult(url: string, result: FirecrawlResult): void {
  firecrawlCache.set(url, { result, timestamp: Date.now() });
  // Limit cache size to prevent memory issues
  if (firecrawlCache.size > 100) {
    const firstKey = firecrawlCache.keys().next().value;
    if (firstKey) firecrawlCache.delete(firstKey);
  }
}

export interface FirecrawlResult {
  success: boolean;
  title: string | null;
  description: string | null;
  brand: string | null;
  price: string | null;
  image: string | null;
  markdown: string | null;
  error?: string;
}

interface FirecrawlMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  sourceURL?: string;
  statusCode?: number;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: FirecrawlMetadata;
  };
  error?: string;
}

/**
 * Scrape a URL using Firecrawl API
 * Use this when direct fetch is blocked (Amazon, etc.)
 */
export async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult> {
  // Check cache first to avoid duplicate API calls on retries
  const cached = getCachedResult(url);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      title: null,
      description: null,
      brand: null,
      price: null,
      image: null,
      markdown: null,
      error: 'FIRECRAWL_API_KEY not configured',
    };
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        timeout: 15000, // Reduced from 30s - fail faster for slow sites
        waitFor: 1000, // Wait for dynamic content (reduced from 2s)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Firecrawl] API error:', response.status, errorText);
      return {
        success: false,
        title: null,
        description: null,
        brand: null,
        price: null,
        image: null,
        markdown: null,
        error: `Firecrawl API error: ${response.status}`,
      };
    }

    const result: FirecrawlResponse = await response.json();

    if (!result.success || !result.data) {
      return {
        success: false,
        title: null,
        description: null,
        brand: null,
        price: null,
        image: null,
        markdown: null,
        error: result.error || 'Firecrawl returned no data',
      };
    }

    const metadata = result.data.metadata || {};
    const markdown = result.data.markdown || '';

    // Check if we got a bot page even through Firecrawl
    if (isBotPage(markdown)) {
      return {
        success: false,
        title: null,
        description: null,
        brand: null,
        price: null,
        image: null,
        markdown: null,
        error: 'Bot detection page',
      };
    }

    // Extract product info
    const rawTitle = metadata.ogTitle || metadata.title || extractTitleFromMarkdown(markdown);
    const title = rawTitle ? cleanTitle(rawTitle) : null;
    const description = metadata.ogDescription || metadata.description || null;
    const image = metadata.ogImage || extractImageFromMarkdown(markdown);
    const price = extractPriceFromMarkdown(markdown);
    const brand = extractBrandFromTitle(title);

    const successResult: FirecrawlResult = {
      success: true,
      title,
      description,
      brand,
      price,
      image,
      markdown: markdown.slice(0, 15000), // Limit size for AI
    };

    // Cache successful results
    setCachedResult(url, successResult);
    return successResult;

  } catch (error: any) {
    console.error('[Firecrawl] Error:', error);
    return {
      success: false,
      title: null,
      description: null,
      brand: null,
      price: null,
      image: null,
      markdown: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check if the content is a bot detection page
 */
function isBotPage(content: string): boolean {
  const lower = content.toLowerCase();
  const botPatterns = [
    'continue shopping',
    'click the button below',
    'robot check',
    'captcha',
    'unusual traffic',
    'automated access',
    'verify you are human',
  ];

  return botPatterns.some(pattern => lower.includes(pattern));
}

/**
 * Extract title from markdown content
 */
function extractTitleFromMarkdown(markdown: string): string | null {
  // Look for H1
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return cleanTitle(h1Match[1]);
  }

  // Look for first bold text
  const boldMatch = markdown.match(/\*\*(.+?)\*\*/);
  if (boldMatch && boldMatch[1].length > 10 && boldMatch[1].length < 200) {
    return cleanTitle(boldMatch[1]);
  }

  return null;
}

/**
 * Clean up a title string
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^Amazon\.com\s*:\s*/i, '') // Remove "Amazon.com : " prefix
    .replace(/\s*:\s*Electronics\s*$/i, '') // Remove ": Electronics" suffix
    .replace(/\s*:\s*Home & Kitchen\s*$/i, '')
    .replace(/\s*:\s*Sports & Outdoors\s*$/i, '')
    .replace(/\s*[-|:]\s*Amazon.*$/i, '')
    .replace(/\s*[-|:]\s*Walmart.*$/i, '')
    .replace(/\s*[-|:]\s*Target.*$/i, '')
    .trim();
}

/**
 * Extract price from markdown
 */
function extractPriceFromMarkdown(markdown: string): string | null {
  // Look for price patterns
  const priceMatch = markdown.match(/\$[\d,]+\.?\d{0,2}/);
  return priceMatch ? priceMatch[0] : null;
}

/**
 * Extract image URL from markdown
 */
function extractImageFromMarkdown(markdown: string): string | null {
  // Look for image markdown syntax
  const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (imgMatch) {
    return imgMatch[1];
  }

  // Look for raw image URLs
  const urlMatch = markdown.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|webp|gif))/i);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Extract brand from product title
 */
function extractBrandFromTitle(title: string | null): string | null {
  if (!title) return null;

  // Common brand patterns at start of titles
  const knownBrands = [
    // Electronics
    'Apple', 'Samsung', 'Sony', 'LG', 'Bose', 'JBL', 'Anker', 'Logitech',
    // Home
    'Casper', 'Tempur-Pedic', 'Purple', 'Instant Pot', 'Ninja', 'KitchenAid',
    'Dyson', 'Shark', 'iRobot', 'Roomba',
    // Golf
    'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno',
    // Outdoor/Camera
    'GoPro', 'DJI', 'Suptig', 'Canon', 'Nikon', 'Fujifilm',
    // Fashion
    'Nike', 'Adidas', 'Under Armour', 'Puma', 'New Balance',
  ];

  for (const brand of knownBrands) {
    if (title.toLowerCase().startsWith(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}
