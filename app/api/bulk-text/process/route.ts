import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { parseText, buildSearchQuery } from '@/lib/textParsing';
import { smartSearch } from '@/lib/productLibrary';
import { generateBrandContext } from '@/lib/brandKnowledge';
import { searchGoogleImages, buildProductSearchQuery } from '@/lib/linkIdentification/googleImageSearch';
import type { SearchResult } from '@/lib/productLibrary/schema';
import type {
  BulkTextStreamEvent,
  ProcessedTextItem,
  TextBatchSummary,
  TextProcessingStage,
} from '@/lib/types/bulkTextStream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// SSE Helper Functions
// ============================================================

function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  const send = (event: BulkTextStreamEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(encoder.encode(data));
  };

  const close = () => {
    controller.close();
  };

  return { stream, send, close };
}

// ============================================================
// Text Processing Logic
// ============================================================

async function processTextItem(
  text: string,
  index: number,
  bagCode: string,
  sendUpdate: (stage: TextProcessingStage) => void
): Promise<ProcessedTextItem> {
  const startTime = Date.now();

  try {
    // Stage 1: Parse text
    sendUpdate('parsing');
    const parsed = parseText(text);
    console.log(`[bulk-text] Item ${index}: Parsed in ${parsed.parseTimeMs}ms - brand=${parsed.brand?.value || 'none'}, product=${parsed.productName?.value || 'none'}`);

    // Stage 2: Search library
    sendUpdate('searching');
    const searchQuery = buildSearchQuery(parsed);
    const libraryResults = smartSearch(searchQuery, {
      category: parsed.inferredCategory || undefined,
      limit: 5,
    });
    console.log(`[bulk-text] Item ${index}: Library search found ${libraryResults.length} results`);

    // Stage 3: AI enrichment if needed
    sendUpdate('enriching');
    let suggestions: ProcessedTextItem['suggestions'] = [];
    let bestMatch: ProcessedTextItem['suggestedItem'] | null = null;
    let confidence = 0;
    let searchTier = 'library';

    if (libraryResults.length > 0 && libraryResults[0].confidence > 80) {
      // Use library results directly
      suggestions = libraryResults.map(r => ({
        brand: r.product.brand,
        productName: r.product.name,
        description: r.product.description || '',
        category: r.product.category,
        confidence: r.confidence / 100,
        imageUrl: r.product.referenceImages?.primary,
        productUrl: r.product.productUrl,
        source: 'library' as const,
      }));
      bestMatch = {
        custom_name: libraryResults[0].product.name,
        brand: libraryResults[0].product.brand,
        custom_description: libraryResults[0].product.description || '',
      };
      confidence = libraryResults[0].confidence / 100;
      searchTier = 'library';
    } else {
      // Use AI for enrichment
      const aiSuggestions = await enrichWithAI(text, parsed, libraryResults);
      suggestions = aiSuggestions.suggestions;
      bestMatch = aiSuggestions.bestMatch;
      confidence = aiSuggestions.confidence;
      searchTier = aiSuggestions.searchTier;
    }

    // Stage 4: Find images
    sendUpdate('imaging');
    let photoOptions: ProcessedTextItem['photoOptions'] = [];

    // First, use images from suggestions
    for (const suggestion of suggestions) {
      if (suggestion.imageUrl && !photoOptions.some(p => p.url === suggestion.imageUrl)) {
        photoOptions.push({
          url: suggestion.imageUrl,
          source: 'suggestion',
          isPrimary: photoOptions.length === 0,
        });
      }
    }

    // If no images from suggestions, search Google Images
    if (photoOptions.length === 0 && bestMatch) {
      try {
        const searchQuery = buildProductSearchQuery(
          bestMatch.brand || '',
          bestMatch.custom_name
        );
        const googleImages = await searchGoogleImages(searchQuery, 3);
        photoOptions = googleImages.map((url, idx) => ({
          url,
          source: 'search' as const,
          isPrimary: idx === 0,
        }));
      } catch (e) {
        console.error(`[bulk-text] Item ${index}: Google Images error:`, e);
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`[bulk-text] Item ${index}: Completed in ${processingTime}ms with ${suggestions.length} suggestions, ${photoOptions.length} photos`);

    return {
      index,
      originalText: text,
      status: confidence >= 0.5 ? 'success' : 'partial',
      parsed,
      suggestions,
      suggestedItem: bestMatch || {
        custom_name: parsed.productName?.value || text,
        brand: parsed.brand?.value || '',
        custom_description: parsed.specifications.map(s => s.value).join(' | '),
      },
      photoOptions,
      searchTier,
      confidence,
    };
  } catch (error) {
    console.error(`[bulk-text] Item ${index}: Error processing:`, error);
    return {
      index,
      originalText: text,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      parsed: parseText(text),
      suggestions: [],
      suggestedItem: {
        custom_name: text,
        brand: '',
        custom_description: '',
      },
      photoOptions: [],
      searchTier: 'error',
      confidence: 0,
    };
  }
}

async function enrichWithAI(
  text: string,
  parsed: ReturnType<typeof parseText>,
  libraryResults: SearchResult[]
): Promise<{
  suggestions: ProcessedTextItem['suggestions'];
  bestMatch: ProcessedTextItem['suggestedItem'];
  confidence: number;
  searchTier: string;
}> {
  const category = parsed.inferredCategory;
  const brandContext = category ? generateBrandContext([category], 'standard') : '';

  const brandHint = parsed.brand
    ? `\nDetected brand: "${parsed.brand.value}". Use this brand for all suggestions.`
    : '';

  const parsedContext = [
    parsed.productName ? `Product: ${parsed.productName.value}` : '',
    parsed.color ? `Color: ${parsed.color}` : '',
    parsed.size ? `Size: ${parsed.size.value}` : '',
    parsed.specifications.length > 0 ? `Specs: ${parsed.specifications.map(s => s.value).join(', ')}` : '',
    parsed.quantity > 1 ? `Quantity: ${parsed.quantity}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a product identification assistant. Given a text description of a product, identify what it is and return structured information.
${brandContext}${brandHint}
${parsedContext ? `\nParsed from input:\n${parsedContext}` : ''}

Return JSON with:
{
  "suggestions": [
    {
      "brand": "Brand Name",
      "productName": "Product Name (without brand)",
      "description": "Brief specs or details",
      "category": "Category",
      "confidence": 0.85
    }
  ]
}

Return 1-3 suggestions, ordered by confidence. If you recognize the product, confidence should be 0.7+. If guessing, use 0.3-0.6.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Identify this product: "${text}"` },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(responseText) as {
      suggestions?: Array<{
        brand?: string;
        productName?: string;
        custom_name?: string;
        description?: string;
        custom_description?: string;
        category?: string;
        confidence?: number;
      }>;
    };
    const aiSuggestions = result.suggestions || [];

    // Merge with library results
    const allSuggestions: ProcessedTextItem['suggestions'] = [
      ...aiSuggestions.map((s) => ({
        brand: s.brand || '',
        productName: s.productName || s.custom_name || '',
        description: s.description || s.custom_description || '',
        category: s.category || category || 'Other',
        confidence: s.confidence || 0.5,
        source: 'ai' as const,
      })),
      ...libraryResults.map(r => ({
        brand: r.product.brand,
        productName: r.product.name,
        description: r.product.description || '',
        category: r.product.category,
        confidence: r.confidence / 100,
        imageUrl: r.product.referenceImages?.primary,
        productUrl: r.product.productUrl,
        source: 'library' as const,
      })),
    ];

    // Sort by confidence and deduplicate
    allSuggestions.sort((a, b) => b.confidence - a.confidence);
    const seen = new Set<string>();
    const uniqueSuggestions = allSuggestions.filter(s => {
      const key = `${s.brand.toLowerCase()}-${s.productName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const best = uniqueSuggestions[0];
    return {
      suggestions: uniqueSuggestions.slice(0, 5),
      bestMatch: best ? {
        custom_name: best.productName,
        brand: best.brand,
        custom_description: best.description,
      } : {
        custom_name: parsed.productName?.value || text,
        brand: parsed.brand?.value || '',
        custom_description: '',
      },
      confidence: best?.confidence || 0.3,
      searchTier: 'ai',
    };
  } catch (error) {
    console.error('[bulk-text] AI enrichment error:', error);

    // Fall back to library results or parsed data
    if (libraryResults.length > 0) {
      return {
        suggestions: libraryResults.map(r => ({
          brand: r.product.brand,
          productName: r.product.name,
          description: r.product.description || '',
          category: r.product.category,
          confidence: r.confidence / 100,
          imageUrl: r.product.referenceImages?.primary,
          productUrl: r.product.productUrl,
          source: 'library' as const,
        })),
        bestMatch: {
          custom_name: libraryResults[0].product.name,
          brand: libraryResults[0].product.brand,
          custom_description: libraryResults[0].product.description || '',
        },
        confidence: libraryResults[0].confidence / 100,
        searchTier: 'library',
      };
    }

    return {
      suggestions: [],
      bestMatch: {
        custom_name: parsed.productName?.value || text,
        brand: parsed.brand?.value || '',
        custom_description: parsed.specifications.map(s => s.value).join(' | '),
      },
      confidence: parsed.parseConfidence,
      searchTier: 'fallback',
    };
  }
}

// ============================================================
// Main Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, bagCode } = body as { items: string[]; bagCode: string };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'items array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (items.length > 25) {
      return new Response(JSON.stringify({ error: 'Maximum 25 items allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[bulk-text] Processing ${items.length} items for bag ${bagCode}`);
    const startTime = Date.now();

    const { stream, send, close } = createSSEStream();

    // Process items in the background
    (async () => {
      const results: ProcessedTextItem[] = [];
      let successful = 0;
      let partial = 0;
      let failed = 0;

      // Process items with concurrency limit
      const concurrency = 3;
      for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchPromises = batch.map(async (text, batchIndex) => {
          const index = i + batchIndex;

          // Send started event
          send({ type: 'item_started', index, rawText: text });

          // Process the item
          const result = await processTextItem(
            text,
            index,
            bagCode,
            (stage) => send({ type: 'item_stage_update', index, stage })
          );

          // Track results
          if (result.status === 'success') successful++;
          else if (result.status === 'partial') partial++;
          else failed++;

          // Send completed event
          send({ type: 'item_completed', index, result });

          // Send progress
          send({
            type: 'batch_progress',
            completed: results.length + 1,
            total: items.length,
          });

          results.push(result);
          return result;
        });

        await Promise.all(batchPromises);
      }

      // Send completion summary
      const summary: TextBatchSummary = {
        total: items.length,
        successful,
        partial,
        failed,
        processingTimeMs: Date.now() - startTime,
      };

      send({ type: 'complete', summary });
      console.log(`[bulk-text] Completed: ${successful} success, ${partial} partial, ${failed} failed in ${summary.processingTimeMs}ms`);

      close();
    })();

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[bulk-text] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
