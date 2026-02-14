import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import * as cheerio from 'cheerio';
import { openai } from '@/lib/openaiClient';
import { identifyProduct, parseProductUrl } from '@/lib/linkIdentification';
import { classifyUrl } from '@/lib/links/classifyUrl';
import { fetchOEmbed } from '@/lib/linkIntelligence';
import type { ProcessingStage, BulkLinkStreamEvent } from '@/lib/types/bulkLinkStream';

export const maxDuration = 300; // Extended timeout for bulk processing (Vercel Pro: 300s max)

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
    // Skip redirect resolution for retailers that block HEAD requests with bot detection
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    if (hostname.includes('walmart')) {
      return url;
    }

    // Follow redirects to get final URL with a 3s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    const resolvedUrl = response.url || url;

    // If the resolved URL looks like a bot redirect, use the original
    const resolvedPath = new URL(resolvedUrl).pathname.toLowerCase();
    if (/\/(blocked|captcha|challenge|verify|security|robot)/.test(resolvedPath)) {
      return url;
    }

    return resolvedUrl;
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

  // Helper to check if URL is a problematic Amazon widget URL
  const isAmazonWidgetUrl = (imgUrl: string) => imgUrl.includes('amazon-adsystem.com');

  // 1. Add scraped image first (from Firecrawl/lightweightFetch)
  if (scraped?.image && !isAmazonWidgetUrl(scraped.image)) {
    images.push({ url: scraped.image, source: 'og', isPrimary: true });
  }

  // 2. Only do Google Image Search if we don't already have a good image
  // This saves 1-3s per link when scraping already found a photo
  const needsGoogleImages = images.length === 0;
  if (needsGoogleImages && (analysis?.productName || scraped?.title)) {
    const query = [analysis?.brand || scraped?.brand, analysis?.productName || scraped?.title]
      .filter(Boolean)
      .join(' ');

    const googleImages = await searchGoogleImages(query);
    for (const imgUrl of googleImages) {
      if (!images.some(i => i.url === imgUrl)) {
        images.push({
          url: imgUrl,
          source: 'google',
          isPrimary: images.length === 0
        });
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
      imgSize: 'large',
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
  index: number,
  onProgress?: (stage: ProcessingStage) => void
): Promise<ProcessedLinkResult> {
  console.log(`[bulk-links] Processing ${index + 1}: ${url}`);

  try {
    // Stage 1: Parse URL and check if it's an embed (TikTok, YouTube, etc.)
    onProgress?.('parsing');

    const classification = classifyUrl(url);

    // Handle embed URLs (TikTok, YouTube, Instagram, etc.) via oEmbed
    // These aren't product pages — use oEmbed to get title/thumbnail instead
    if (classification.type === 'embed') {
      onProgress?.('fetching');
      const oembed = await fetchOEmbed(url);

      const title = oembed?.title || `${classification.platform} video`;
      const author = oembed?.authorName || classification.platform;
      const thumbnail = oembed?.thumbnailUrl || null;

      let domain = '';
      try { domain = new URL(url).hostname.replace('www.', ''); } catch {}

      return {
        index,
        originalUrl: url,
        resolvedUrl: url,
        status: 'success' as const,
        scraped: {
          title,
          description: null,
          brand: author,
          price: null,
          image: thumbnail,
          domain,
        },
        analysis: {
          brand: author,
          productName: title,
          category: 'video',
          specs: [],
          confidence: 0.95,
        },
        photoOptions: thumbnail ? [{ url: thumbnail, source: 'og' as const, isPrimary: true }] : [],
        suggestedItem: {
          custom_name: title,
          brand: author,
          custom_description: '',
        },
      };
    }

    // Product URL — use identification pipeline
    onProgress?.('fetching');

    // Stage 2-4: Use the link identification pipeline
    // This handles bot-protected sites by using URL intelligence
    onProgress?.('detecting');
    const identification = await identifyProduct(url, {
      fetchTimeout: 5000, // Reduced for faster failures
      earlyExitConfidence: 0.85,
    });

    // Emit analyzing stage after identification (which includes AI)
    onProgress?.('analyzing');

    console.log(`[bulk-links] Identified: ${identification.fullName} (${(identification.confidence * 100).toFixed(0)}% via ${identification.primarySource})`);

    // Convert identification result to our formats
    const scraped: ScrapedData = {
      title: identification.fullName,
      description: identification.specifications.join(' | ') || null,
      brand: identification.brand,
      price: identification.price,
      image: identification.imageUrl,
      domain: identification.urlParsed.domain,
    };

    const analysis: AnalysisResult = {
      brand: identification.brand,
      productName: identification.productName,
      category: identification.category,
      specs: identification.specifications,
      confidence: identification.confidence,
    };

    // Stage 5: Find photos
    onProgress?.('imaging');
    let photoOptions = await findProductImages(url, scraped, analysis);

    // Check if identification image is a problematic Amazon widget URL
    // These return tracking pixels instead of actual images - skip them entirely
    const isAmazonWidgetUrl = identification.imageUrl?.includes('amazon-adsystem.com');

    // If identification gave us a valid image (not Amazon widget) and it's not in options, add it
    if (identification.imageUrl && !isAmazonWidgetUrl && !photoOptions.some(p => p.url === identification.imageUrl)) {
      photoOptions.unshift({
        url: identification.imageUrl,
        source: 'og',
        isPrimary: true,
      });
      // Update other primaries
      photoOptions = photoOptions.map((p, i) => ({ ...p, isPrimary: i === 0 }));
    }

    // Ensure we have a primary image
    if (photoOptions.length > 0 && !photoOptions.some(p => p.isPrimary)) {
      photoOptions[0].isPrimary = true;
    }

    // Compose suggestion from identification
    const suggestedItem = {
      custom_name: identification.productName || 'Unknown Product',
      brand: identification.brand || '',
      custom_description: identification.specifications.join(' | '),
    };

    // Determine status based on identification confidence
    let status: 'success' | 'partial' | 'failed' = 'failed';
    if (identification.confidence >= 0.7) {
      status = photoOptions.length > 0 ? 'success' : 'partial';
    } else if (identification.confidence >= 0.4) {
      status = 'partial';
    }

    // Log if scraping was blocked but we still got a result
    if (identification.fetchResult?.blocked) {
      console.log(`[bulk-links] ⚠️ Scraping blocked for ${identification.urlParsed.domain}, but identified via ${identification.primarySource}`);
    }

    return {
      index,
      originalUrl: url,
      resolvedUrl: identification.fetchResult?.finalUrl || url,
      status,
      scraped,
      analysis,
      photoOptions,
      suggestedItem,
    };
  } catch (error) {
    console.error(`[bulk-links] Error processing ${url}:`, error);

    // Fallback: Try URL parsing alone
    try {
      const parsed = parseProductUrl(url);
      if (parsed.brand && parsed.humanizedName) {
        return {
          index,
          originalUrl: url,
          resolvedUrl: url,
          status: 'partial',
          error: 'Identification failed, using URL parsing',
          scraped: {
            title: `${parsed.brand} ${parsed.humanizedName}`,
            description: null,
            brand: parsed.brand,
            price: null,
            image: null,
            domain: parsed.domain,
          },
          analysis: {
            brand: parsed.brand,
            productName: parsed.humanizedName,
            category: parsed.category,
            specs: [],
            confidence: parsed.urlConfidence,
          },
          photoOptions: [],
          suggestedItem: {
            custom_name: parsed.humanizedName,
            brand: parsed.brand,
            custom_description: '',
          },
        };
      }
    } catch {}

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

    console.log(`[bulk-links] Processing ${urls.length} URLs for bag ${code} (streaming)`);
    console.log(`[bulk-links] URLs to process:`, urls);

    // Create SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: BulkLinkStreamEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        const results: ProcessedLinkResult[] = [];
        let completedCount = 0;

        try {
          // Process URLs in parallel batches for speed
          // Batch size of 5 means 25 URLs = 5 batches instead of 25 sequential calls
          const PARALLEL_BATCH_SIZE = 5;

          for (let batchStart = 0; batchStart < urls.length; batchStart += PARALLEL_BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, urls.length);
            const batchUrls = urls.slice(batchStart, batchEnd);

            // Emit start events for all URLs in this batch
            batchUrls.forEach((url, idx) => {
              const globalIdx = batchStart + idx;
              sendEvent({
                type: 'url_started',
                index: globalIdx,
                url,
              });
            });

            // Process batch in parallel
            const batchPromises = batchUrls.map((url, idx) => {
              const globalIdx = batchStart + idx;
              return processUrl(url, globalIdx, (stage) => {
                sendEvent({
                  type: 'url_stage_update',
                  index: globalIdx,
                  stage,
                });
              });
            });

            const batchResults = await Promise.all(batchPromises);

            // Emit completed events for all URLs in this batch
            for (const result of batchResults) {
              results.push(result);
              completedCount++;

              sendEvent({
                type: 'url_completed',
                index: result.index,
                result: {
                  index: result.index,
                  originalUrl: result.originalUrl,
                  resolvedUrl: result.resolvedUrl,
                  status: result.status,
                  error: result.error,
                  scraped: result.scraped,
                  analysis: result.analysis,
                  photoOptions: result.photoOptions,
                  suggestedItem: result.suggestedItem,
                },
              });
            }

            // Emit batch progress
            sendEvent({
              type: 'batch_progress',
              completed: completedCount,
              total: urls.length,
            });

            // Small delay between batches
            if (batchEnd < urls.length) {
              await delay(BATCH_DELAY_MS);
            }
          }

          // Sort results by original index
          results.sort((a, b) => a.index - b.index);

          // Calculate and emit final summary
          const summary: BatchSummary = {
            total: urls.length,
            successful: results.filter(r => r.status === 'success').length,
            partial: results.filter(r => r.status === 'partial').length,
            failed: results.filter(r => r.status === 'failed').length,
            processingTimeMs: Date.now() - startTime,
          };

          console.log(`[bulk-links] Completed: ${summary.successful} success, ${summary.partial} partial, ${summary.failed} failed in ${summary.processingTimeMs}ms`);

          sendEvent({
            type: 'complete',
            summary,
          });
        } catch (error) {
          console.error('[bulk-links] Stream error:', error);
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Processing failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[bulk-links] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
