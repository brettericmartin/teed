/**
 * Firecrawl Integration
 *
 * Uses Firecrawl API for scraping sites that block direct requests (Amazon, etc.)
 * Firecrawl handles JavaScript rendering, bot protection bypass, and returns clean data.
 *
 * Every scrape costs a credit, so reads are remembered:
 * - in memory for 10 minutes (same serverless instance, retries), and
 * - in the firecrawl_cache table for 30 days (every instance, repeat clicks).
 * After Firecrawl answers 402 (out of credits) calls pause for an hour instead of
 * failing one by one on every link.
 */
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAmazonHost, pickAmazonImage, extractAmazonBrand } from './amazon';

const firecrawlCache = new Map<string, { result: FirecrawlResult; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PERSISTED_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PAUSE_AFTER_402_MS = 60 * 60 * 1000; // 1 hour
const PAUSE_KEY = '__paused_402__';
let pausedUntil = 0; // this instance's copy of the pause

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

/** Reads the stored copy of this URL and the shared 402 pause in one query. Never throws. */
async function readPersisted(url: string): Promise<{ result: FirecrawlResult | null; paused: boolean }> {
  try {
    const { data } = await getSupabaseAdmin()
      .from('firecrawl_cache')
      .select('key, result, fetched_at')
      .in('key', [url, PAUSE_KEY]);
    let result: FirecrawlResult | null = null;
    let paused = false;
    for (const row of data || []) {
      const age = Date.now() - new Date(row.fetched_at as string).getTime();
      if (row.key === PAUSE_KEY) paused = age < PAUSE_AFTER_402_MS;
      else if (age < PERSISTED_TTL_MS) result = row.result as FirecrawlResult;
    }
    return { result, paused };
  } catch (error) {
    console.error('[Firecrawl] cache read failed:', error);
    return { result: null, paused: false };
  }
}

async function writePersisted(key: string, result: FirecrawlResult | Record<string, unknown>): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from('firecrawl_cache')
      .upsert({ key, result, fetched_at: new Date().toISOString() });
  } catch (error) {
    console.error('[Firecrawl] cache write failed:', error);
  }
}

/**
 * Keeps a per-day tally of real Firecrawl calls in firecrawl_cache under
 * __calls_YYYY-MM-DD__, with the last outcome and status, so anyone can see
 * whether calls are being made and whether they succeed. Counts are approximate
 * under concurrent calls. Never throws and never stores the API key.
 */
async function recordCall(outcome: 'ok' | 'failed', status: number | null, host: string): Promise<void> {
  try {
    const key = `__calls_${new Date().toISOString().slice(0, 10)}__`;
    const db = getSupabaseAdmin();
    const { data } = await db.from('firecrawl_cache').select('result').eq('key', key).maybeSingle();
    const prev = (data?.result || {}) as Record<string, any>;
    const byStatus = { ...(prev.by_status || {}) };
    const statusKey = String(status ?? 'none');
    byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
    await db.from('firecrawl_cache').upsert({
      key,
      result: {
        ok: (prev.ok || 0) + (outcome === 'ok' ? 1 : 0),
        failed: (prev.failed || 0) + (outcome === 'failed' ? 1 : 0),
        by_status: byStatus,
        last_outcome: outcome,
        last_status: status,
        last_host: host,
        last_at: new Date().toISOString(),
      },
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Firecrawl] call record failed:', error);
  }
}

function failure(error: string): FirecrawlResult {
  return { success: false, title: null, description: null, brand: null, price: null, image: null, markdown: null, error };
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
  // True when the image was picked as the product's own photo (Amazon pages)
  imageVerified?: boolean;
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
    console.error('[Firecrawl] FIRECRAWL_API_KEY is not set; skipping page read');
    return failure('FIRECRAWL_API_KEY not configured');
  }

  if (Date.now() < pausedUntil) {
    return failure('Firecrawl paused after running out of credits');
  }

  const persisted = await readPersisted(url);
  if (persisted.result) {
    console.log(`[Firecrawl] Stored copy used for ${new URL(url).hostname}`);
    setCachedResult(url, persisted.result);
    return persisted.result;
  }
  if (persisted.paused) {
    pausedUntil = Date.now() + 5 * 60 * 1000; // re-check the shared pause in 5 minutes
    return failure('Firecrawl paused after running out of credits');
  }

  let host = 'unknown';
  try {
    host = new URL(url).hostname;
  } catch {}

  try {
    // Firecrawl v1 is retired on Dec 10, 2026 (returns HTTP 410). v2 keeps the same
    // request fields used here and the same { success, data: { markdown, metadata } } shape.
    // v2 serves a cached copy up to 2 days old by default (maxAge), which is fine for product pages.
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
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
      console.error('[Firecrawl] API error:', response.status, host, errorText.slice(0, 300));
      await recordCall('failed', response.status, host);
      if (response.status === 402) {
        // Out of credits: stop calling for an hour on every instance.
        pausedUntil = Date.now() + PAUSE_AFTER_402_MS;
        await writePersisted(PAUSE_KEY, { status: 402 });
      }
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
      console.error('[Firecrawl] no data returned for', host);
      await recordCall('failed', response.status, host);
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
      console.error('[Firecrawl] bot page returned for', host);
      await recordCall('failed', response.status, host);
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
    // Amazon pages put ads before the product, so their first image is often an ad
    let isAmazonPage = false;
    try {
      isAmazonPage = isAmazonHost(new URL(url).hostname);
    } catch {}
    const amazonImage = isAmazonPage ? pickAmazonImage(markdown, title) : null;
    const image = isAmazonPage ? amazonImage : metadata.ogImage || extractImageFromMarkdown(markdown);
    const price = extractPriceFromMarkdown(markdown);
    const brand = (isAmazonPage ? extractAmazonBrand(markdown) : null) || extractBrandFromTitle(title);

    const successResult: FirecrawlResult = {
      success: true,
      title,
      description,
      brand,
      price,
      image,
      markdown: markdown.slice(0, 15000), // Limit size for AI
      ...(isAmazonPage ? { imageVerified: !!amazonImage } : {}),
    };

    // Cache successful results, here and for every instance for 30 days
    setCachedResult(url, successResult);
    await Promise.all([writePersisted(url, successResult), recordCall('ok', response.status, host)]);
    return successResult;

  } catch (error: any) {
    console.error('[Firecrawl] Error:', host, error?.message || error);
    await recordCall('failed', null, host);
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
 * URLs that are tracking pixels, beacons, or navigation sprites — not real product images
 */
const IMAGE_BLOCKLIST_PATTERNS = [
  /amazon-adsystem\.com/i,
  /fls-na\.amazon\.com/i,       // Amazon tracking beacons
  /\/sprites?\//i,               // Navigation sprites
  /\/pixel/i,                    // Tracking pixels
  /\/beacon/i,                   // Beacons
  /1x1/i,                        // 1x1 pixel images
  /grey-pixel/i,                 // Amazon's grey placeholder pixel
  /\/gno\/sprites/i,             // Amazon nav sprites
  /nav-sprite/i,                 // Navigation sprites
];

/**
 * Check if a URL looks like a real product image
 */
function isRealProductImage(url: string): boolean {
  return !IMAGE_BLOCKLIST_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extract image URL from markdown, filtering out tracking pixels
 */
function extractImageFromMarkdown(markdown: string): string | null {
  // Collect all markdown image URLs
  const imgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  let match;

  while ((match = imgRegex.exec(markdown)) !== null) {
    const url = match[1];
    if (isRealProductImage(url)) {
      // Prefer images that look like product photos (from CDN, reasonable file extension)
      if (/\.(jpg|jpeg|png|webp)/i.test(url) || /images\/[A-Z0-9]/i.test(url)) {
        return url;
      }
    }
  }

  // Fallback: look for raw image URLs that aren't tracking pixels
  const urlRegex = /(https?:\/\/[^\s"')]+\.(?:jpg|jpeg|png|webp|gif))/gi;
  let rawMatch;
  while ((rawMatch = urlRegex.exec(markdown)) !== null) {
    if (isRealProductImage(rawMatch[1])) {
      return rawMatch[1];
    }
  }

  return null;
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
