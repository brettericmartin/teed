import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { classifyUrls, parseUrlsFromInput } from '@/lib/links/classifyUrl';
import { identifyProduct, parseProductUrl } from '@/lib/linkIdentification';
import type {
  UniversalLinkStreamEvent,
  ProcessedEmbed,
  ProcessedSocial,
  ProcessedProduct,
  ProductPhotoOption,
} from '@/lib/types/universalLink';

export const maxDuration = 300; // Extended timeout for bulk processing

const MAX_URLS = 25;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function resolveRedirects(url: string): Promise<string> {
  try {
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
    return response.url || url;
  } catch {
    return url;
  }
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

async function findProductImages(
  url: string,
  identification: {
    brand: string | null;
    productName: string;
    imageUrl: string | null;
  }
): Promise<ProductPhotoOption[]> {
  const images: ProductPhotoOption[] = [];

  const isAmazonWidgetUrl = (imgUrl: string) => imgUrl.includes('amazon-adsystem.com');

  // Add scraped image first
  if (identification.imageUrl && !isAmazonWidgetUrl(identification.imageUrl)) {
    images.push({ url: identification.imageUrl, source: 'og', isPrimary: true });
  }

  // Google Image Search for additional options
  if (identification.productName) {
    const query = [identification.brand, identification.productName]
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

async function processProductUrl(
  url: string,
  index: number,
  onProgress?: (stage: string) => void
): Promise<ProcessedProduct> {
  console.log(`[universal-links] Processing product ${index}: ${url}`);

  try {
    onProgress?.('parsing');
    onProgress?.('fetching');
    const resolvedUrl = await resolveRedirects(url);

    onProgress?.('detecting');
    const identification = await identifyProduct(resolvedUrl, {
      fetchTimeout: 5000,
      earlyExitConfidence: 0.85,
    });

    onProgress?.('analyzing');
    console.log(`[universal-links] Identified: ${identification.fullName} (${(identification.confidence * 100).toFixed(0)}%)`);

    onProgress?.('imaging');
    const photos = await findProductImages(url, {
      brand: identification.brand,
      productName: identification.productName,
      imageUrl: identification.imageUrl,
    });

    // Determine status
    let status: 'success' | 'partial' | 'failed' = 'failed';
    if (identification.confidence >= 0.7) {
      status = photos.length > 0 ? 'success' : 'partial';
    } else if (identification.confidence >= 0.4) {
      status = 'partial';
    }

    return {
      index,
      url,
      productName: identification.productName || 'Unknown Product',
      brand: identification.brand,
      description: identification.specifications.join(' | ') || null,
      confidence: identification.confidence,
      status,
      photos,
      selectedPhotoIndex: 0,
      selected: true,
    };
  } catch (error) {
    console.error(`[universal-links] Error processing ${url}:`, error);

    // Fallback to URL parsing
    try {
      const parsed = parseProductUrl(url);
      if (parsed.brand && parsed.humanizedName) {
        return {
          index,
          url,
          productName: parsed.humanizedName,
          brand: parsed.brand,
          description: null,
          confidence: parsed.urlConfidence,
          status: 'partial',
          photos: [],
          selectedPhotoIndex: 0,
          selected: true,
        };
      }
    } catch {}

    return {
      index,
      url,
      productName: 'Unknown Product',
      brand: null,
      description: null,
      confidence: 0,
      status: 'failed',
      photos: [],
      selectedPhotoIndex: 0,
      selected: false,
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
 * POST /api/universal-links/process
 *
 * Process URLs with type detection and streaming.
 * - Embeds and social links are classified immediately
 * - Products go through full AI enrichment with streaming
 *
 * Body: { urls: string[] } OR { input: string }
 * Returns: SSE stream of UniversalLinkStreamEvent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();
    const { urls, input } = body;

    // Get URLs from either format
    let urlsToProcess: string[];

    if (Array.isArray(urls)) {
      urlsToProcess = urls.slice(0, MAX_URLS);
    } else if (typeof input === 'string') {
      urlsToProcess = parseUrlsFromInput(input, MAX_URLS);
    } else {
      return new Response(
        JSON.stringify({ error: 'Either urls array or input string is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (urlsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid URLs found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[universal-links] Processing ${urlsToProcess.length} URLs`);

    // Create SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: UniversalLinkStreamEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Step 1: Classify all URLs immediately (no network calls)
          const { results: classifications } = classifyUrls(urlsToProcess);

          // Extract by type
          const embeds: ProcessedEmbed[] = [];
          const social: ProcessedSocial[] = [];
          const productUrls: { index: number; url: string }[] = [];

          classifications.forEach((result, index) => {
            const { classification } = result;

            if (classification.type === 'embed') {
              embeds.push({
                index,
                url: result.originalUrl,
                platform: classification.platform,
                title: undefined,
                selected: true,
              });
            } else if (classification.type === 'social') {
              social.push({
                index,
                url: result.originalUrl,
                platform: classification.platform,
                username: classification.username,
                displayName: classification.displayName,
                selected: true,
              });
            } else {
              productUrls.push({ index, url: result.originalUrl });
            }
          });

          // Emit classification complete event
          sendEvent({
            type: 'classification_complete',
            embeds,
            social,
            productCount: productUrls.length,
          });

          // Step 2: Process products with streaming
          const products: ProcessedProduct[] = [];
          const PARALLEL_BATCH_SIZE = 5;

          for (let batchStart = 0; batchStart < productUrls.length; batchStart += PARALLEL_BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + PARALLEL_BATCH_SIZE, productUrls.length);
            const batch = productUrls.slice(batchStart, batchEnd);

            // Emit start events
            for (const { index, url } of batch) {
              sendEvent({
                type: 'product_started',
                index,
                url,
              });
            }

            // Process batch in parallel
            const batchPromises = batch.map(({ index, url }) =>
              processProductUrl(url, index, (stage) => {
                sendEvent({
                  type: 'product_stage_update',
                  index,
                  stage: stage as any,
                });
              })
            );

            const batchResults = await Promise.all(batchPromises);

            // Emit completed events
            for (const result of batchResults) {
              products.push(result);
              sendEvent({
                type: 'product_completed',
                index: result.index,
                result,
              });
            }

            // Emit batch progress
            sendEvent({
              type: 'batch_progress',
              completed: products.length,
              total: productUrls.length,
            });

            // Small delay between batches
            if (batchEnd < productUrls.length) {
              await delay(100);
            }
          }

          // Sort products by index
          products.sort((a, b) => a.index - b.index);

          // Final complete event
          sendEvent({
            type: 'complete',
            embeds,
            social,
            products,
          });

        } catch (error) {
          console.error('[universal-links] Stream error:', error);
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
    console.error('[universal-links] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
