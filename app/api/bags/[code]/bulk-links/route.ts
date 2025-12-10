import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import * as cheerio from 'cheerio';
import { openai } from '@/lib/openaiClient';

export const maxDuration = 60; // Extended timeout for bulk processing

// ============================================================
// TYPES
// ============================================================

interface ScrapedData {
  title: string | null;
  description: string | null;
  brand: string | null;
  price: string | null;
  image: string | null;
  domain: string;
}

interface AnalysisResult {
  brand: string | null;
  productName: string | null;
  category: string | null;
  specs: string[];
  confidence: number;
}

interface PhotoOption {
  url: string;
  source: 'og' | 'meta' | 'json-ld' | 'google';
  isPrimary: boolean;
}

interface ProcessedLinkResult {
  index: number;
  originalUrl: string;
  resolvedUrl: string;
  status: 'success' | 'partial' | 'failed';
  error?: string;
  scraped: ScrapedData | null;
  analysis: AnalysisResult | null;
  photoOptions: PhotoOption[];
  suggestedItem: {
    custom_name: string;
    brand: string;
    custom_description: string;
  };
}

interface BatchSummary {
  total: number;
  successful: number;
  partial: number;
  failed: number;
  processingTimeMs: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const MAX_URLS = 25;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 100;

// Brand detection from domains
const DOMAIN_TO_BRAND: Record<string, string> = {
  'amazon.com': '',
  'taylormadegolf.com': 'TaylorMade',
  'callawaygolf.com': 'Callaway',
  'titleist.com': 'Titleist',
  'ping.com': 'Ping',
  'cobragolf.com': 'Cobra',
  'apple.com': 'Apple',
  'bose.com': 'Bose',
  'sony.com': 'Sony',
  'samsung.com': 'Samsung',
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function extractBrandFromDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return DOMAIN_TO_BRAND[hostname] || null;
  } catch {
    return null;
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function parseUrls(input: string[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    // Skip empty strings
    if (!item || !item.trim()) continue;

    const trimmed = item.trim();

    // Handle common URL formats
    let url = trimmed;

    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (isValidUrl(url) && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls.slice(0, MAX_URLS);
}

async function resolveRedirects(url: string): Promise<string> {
  try {
    // Follow redirects to get final URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return response.url || url;
  } catch {
    return url;
  }
}

async function scrapeUrl(url: string): Promise<ScrapedData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const parsedUrl = new URL(url);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    // Make image URL absolute
    if (image && !image.startsWith('http')) {
      image = new URL(image, url).href;
    }

    // Try to extract price
    let price: string | null = null;
    const priceSelectors = [
      'meta[property="og:price:amount"]',
      'meta[property="product:price:amount"]',
      'span[itemprop="price"]',
      '.price',
      '[class*="price"]',
    ];
    for (const selector of priceSelectors) {
      const priceElement = $(selector);
      if (priceElement.length > 0) {
        const priceText = priceElement.attr('content') || priceElement.text();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          price = priceMatch[0].replace(/,/g, '');
          break;
        }
      }
    }

    // Extract brand from domain or text
    let brand = extractBrandFromDomain(url);
    if (!brand && title) {
      // Try to extract brand from title (simple approach)
      const knownBrands = ['TaylorMade', 'Callaway', 'Titleist', 'Nike', 'Apple', 'Sony', 'Bose'];
      for (const b of knownBrands) {
        if (title.toLowerCase().includes(b.toLowerCase())) {
          brand = b;
          break;
        }
      }
    }

    return {
      title: title ? title.substring(0, 200) : null,
      description: description ? description.substring(0, 500) : null,
      brand,
      price,
      image,
      domain: parsedUrl.hostname.replace('www.', ''),
    };
  } catch (error) {
    console.error(`[bulk-links] Scrape error for ${url}:`, error);
    return null;
  }
}

async function analyzeWithAI(url: string, scraped: ScrapedData | null): Promise<AnalysisResult | null> {
  if (!scraped?.title) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a product information extraction specialist. Analyze product data and extract accurate details.

Return ONLY valid JSON in this format:
{
  "brand": "Brand Name",
  "productName": "Product Model/Name (without brand)",
  "category": "Product Category",
  "specs": ["spec1", "spec2"],
  "confidence": 0.85
}

RULES:
- Be accurate - only extract what you can clearly identify
- productName should NOT include the brand name
- specs should be concise product specifications
- confidence: 0.9+ for clear matches, 0.7-0.89 for likely matches, <0.7 for uncertain`,
        },
        {
          role: 'user',
          content: `Analyze this product:

URL: ${url}
Domain: ${scraped.domain}
Title: ${scraped.title}
Description: ${scraped.description || 'N/A'}
Brand hint: ${scraped.brand || 'Unknown'}
Price: ${scraped.price || 'N/A'}

Extract product information as JSON.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      brand: result.brand || null,
      productName: result.productName || null,
      category: result.category || null,
      specs: result.specs || [],
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error(`[bulk-links] AI analysis error:`, error);
    return null;
  }
}

async function findProductImages(
  url: string,
  scraped: ScrapedData | null,
  analysis: AnalysisResult | null
): Promise<PhotoOption[]> {
  const images: PhotoOption[] = [];

  // 1. Add OG image from scrape
  if (scraped?.image) {
    images.push({ url: scraped.image, source: 'og', isPrimary: true });
  }

  // 2. Try to extract more images from the page
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Extract JSON-LD images
      const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of jsonLdMatches) {
        try {
          const jsonLd = JSON.parse(match[1]);
          if (jsonLd['@type'] === 'Product' && jsonLd.image) {
            const productImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
            for (const img of productImages) {
              const imgUrl = typeof img === 'string' ? img : img.url;
              if (imgUrl && !images.some(i => i.url === imgUrl)) {
                images.push({ url: imgUrl, source: 'json-ld', isPrimary: false });
              }
            }
          }
        } catch {}
      }

      // Extract Twitter image
      const twitterMatch = html.match(/<meta\s+(?:name|property)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (twitterMatch && twitterMatch[1] && !images.some(i => i.url === twitterMatch[1])) {
        images.push({ url: twitterMatch[1], source: 'meta', isPrimary: false });
      }
    }
  } catch {}

  // 3. Fall back to Google Image Search if we don't have enough images
  if (images.length < 3 && (analysis?.productName || scraped?.title)) {
    const query = [analysis?.brand || scraped?.brand, analysis?.productName || scraped?.title]
      .filter(Boolean)
      .join(' ');

    const googleImages = await searchGoogleImages(query);
    for (const imgUrl of googleImages) {
      if (!images.some(i => i.url === imgUrl)) {
        images.push({ url: imgUrl, source: 'google', isPrimary: images.length === 0 });
      }
    }
  }

  // Ensure we have a primary
  if (images.length > 0 && !images.some(i => i.isPrimary)) {
    images[0].isPrimary = true;
  }

  return images.slice(0, 5);
}

async function searchGoogleImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query.trim(),
      searchType: 'image',
      num: '5',
      imgSize: 'medium',
      imgType: 'photo',
      safe: 'active',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((item: any) => item.link);
  } catch {
    return [];
  }
}

function composeSuggestion(
  scraped: ScrapedData | null,
  analysis: AnalysisResult | null
): { custom_name: string; brand: string; custom_description: string } {
  // Prefer AI analysis over scraped data
  const brand = analysis?.brand || scraped?.brand || '';
  const productName = analysis?.productName || scraped?.title || 'Unknown Product';

  // Clean product name (remove brand if present at start)
  let cleanName = productName;
  if (brand && cleanName.toLowerCase().startsWith(brand.toLowerCase())) {
    cleanName = cleanName.substring(brand.length).trim();
    // Remove leading dash or hyphen
    cleanName = cleanName.replace(/^[-–—]\s*/, '');
  }

  // Build description from specs
  const specs = analysis?.specs || [];
  const custom_description = specs.length > 0 ? specs.join(' | ') : '';

  return {
    custom_name: cleanName || 'Unknown Product',
    brand,
    custom_description,
  };
}

async function processUrl(
  url: string,
  index: number
): Promise<ProcessedLinkResult> {
  console.log(`[bulk-links] Processing ${index + 1}: ${url}`);

  try {
    // Resolve redirects
    const resolvedUrl = await resolveRedirects(url);

    // Step 1: Scrape
    const scraped = await scrapeUrl(resolvedUrl);

    // Step 2: AI Analysis
    const analysis = await analyzeWithAI(resolvedUrl, scraped);

    // Step 3: Find Photos
    const photoOptions = await findProductImages(resolvedUrl, scraped, analysis);

    // Step 4: Compose suggestion
    const suggestedItem = composeSuggestion(scraped, analysis);

    // Determine status
    let status: 'success' | 'partial' | 'failed' = 'failed';
    if (scraped && analysis && photoOptions.length > 0) {
      status = 'success';
    } else if (scraped || analysis) {
      status = 'partial';
    }

    return {
      index,
      originalUrl: url,
      resolvedUrl,
      status,
      scraped,
      analysis,
      photoOptions,
      suggestedItem,
    };
  } catch (error) {
    console.error(`[bulk-links] Error processing ${url}:`, error);
    return {
      index,
      originalUrl: url,
      resolvedUrl: url,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      scraped: null,
      analysis: null,
      photoOptions: [],
      suggestedItem: { custom_name: 'Unknown Product', brand: '', custom_description: '' },
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// MAIN ENDPOINT
// ============================================================

/**
 * POST /api/bags/[code]/bulk-links
 * Process multiple URLs in bulk, returning structured product suggestions
 *
 * Body: { urls: string[] }
 * Returns: { results: ProcessedLinkResult[], summary: BatchSummary, bagCode: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const startTime = Date.now();

  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { urls: rawUrls } = body;

    if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
      return NextResponse.json(
        { error: 'urls must be a non-empty array' },
        { status: 400 }
      );
    }

    // Parse and validate URLs
    const urls = parseUrls(rawUrls);

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs provided' },
        { status: 400 }
      );
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS} URLs allowed` },
        { status: 400 }
      );
    }

    console.log(`[bulk-links] Processing ${urls.length} URLs for bag ${code}`);

    // Process URLs in batches
    const results: ProcessedLinkResult[] = [];

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map((url, batchIndex) => processUrl(url, i + batchIndex))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // This shouldn't happen since processUrl catches errors, but handle it
          results.push({
            index: results.length,
            originalUrl: batch[results.length % BATCH_SIZE] || '',
            resolvedUrl: '',
            status: 'failed',
            error: 'Processing failed',
            scraped: null,
            analysis: null,
            photoOptions: [],
            suggestedItem: { custom_name: 'Unknown Product', brand: '', custom_description: '' },
          });
        }
      }

      // Rate limit delay between batches
      if (i + BATCH_SIZE < urls.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Sort results by original index
    results.sort((a, b) => a.index - b.index);

    // Calculate summary
    const summary: BatchSummary = {
      total: urls.length,
      successful: results.filter(r => r.status === 'success').length,
      partial: results.filter(r => r.status === 'partial').length,
      failed: results.filter(r => r.status === 'failed').length,
      processingTimeMs: Date.now() - startTime,
    };

    console.log(`[bulk-links] Completed: ${summary.successful} success, ${summary.partial} partial, ${summary.failed} failed in ${summary.processingTimeMs}ms`);

    return NextResponse.json({
      results,
      summary,
      bagCode: code,
    });
  } catch (error) {
    console.error('[bulk-links] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
