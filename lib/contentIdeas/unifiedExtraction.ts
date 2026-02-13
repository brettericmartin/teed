/**
 * Unified Product Extraction Module
 * Combines extraction from description, transcript, and video frames
 * for comprehensive product identification
 */

import { openai } from '../openaiClient';
import type { ContentVertical, ExtractedProduct, ExtractedLink } from '../types/contentIdeas';
import {
  fetchYouTubeTranscript,
  extractProductMentionsFromTranscript,
  analyzeTranscriptForContentType,
  type TranscriptResult,
  type ProductMention,
} from './transcript';
import {
  extractKeyFrames,
  analyzeFramesWithAPIS,
  type FrameExtractionResult,
  type VideoFrame,
} from './videoFrames';
import { extractVideoId } from './youtube';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type ProductSource = 'description' | 'transcript' | 'frame';

export interface ExtractedProductWithSource extends ExtractedProduct {
  sources: ProductSource[];
  timestamps?: string[];           // Video timestamps where mentioned
  frameUrls?: string[];            // Frame URLs where visible
  confidence: number;              // 0-100, boosted by multiple sources
  transcriptContext?: string;      // Context from transcript
  visualDescription?: string;      // Description from frame analysis
}

export interface UnifiedExtractionResult {
  products: ExtractedProductWithSource[];
  contentType: 'single_hero' | 'roundup' | 'comparison';
  contentTypeSignals: string[];
  extractionSources: {
    description: boolean;
    transcript: boolean;
    frames: boolean;
  };
  transcriptAvailable: boolean;
  framesAnalyzed: number;
  rawData: {
    descriptionProducts: ExtractedProduct[];
    transcriptMentions: ProductMention[];
    frameDetections: Array<{
      frame: VideoFrame;
      objects: Array<{
        objectType: string;
        productCategory: string;
        visualCues: string[];
        certainty: 'definite' | 'likely' | 'uncertain';
      }>;
    }>;
  };
}

export interface UnifiedExtractionOptions {
  includeTranscript?: boolean;
  includeFrames?: boolean;
  maxFrames?: number;
  fetchFramesAsBase64?: boolean;
  baseUrl?: string;  // For API calls
}

// ═══════════════════════════════════════════════════════════════════
// Retry Logic
// ═══════════════════════════════════════════════════════════════════

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorWithStatus = error as { status?: number; code?: string };

      if (errorWithStatus?.status === 400 || errorWithStatus?.status === 401) {
        throw error;
      }

      if (errorWithStatus?.status === 429 || errorWithStatus?.code === 'rate_limit_exceeded') {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[UnifiedExtraction] Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ═══════════════════════════════════════════════════════════════════
// Description-Based Extraction (Existing Logic, Enhanced)
// ═══════════════════════════════════════════════════════════════════

async function extractProductsFromDescription(
  videoTitle: string,
  videoDescription: string,
  vertical: ContentVertical,
  extractedLinks: Array<{ url: string; label?: string }> = []
): Promise<ExtractedProduct[]> {
  const prompt = `You are analyzing a "${vertical}" gear/setup video to extract products mentioned.

VIDEO TITLE: ${videoTitle}

VIDEO DESCRIPTION:
${videoDescription.slice(0, 4000)}

LINKS FOUND IN DESCRIPTION:
${extractedLinks.map(l => `- ${l.label || 'Link'}: ${l.url}`).join('\n') || 'None'}

Extract ALL products/items mentioned or implied. For each product:
1. Identify brand and specific model name when possible
2. Estimate the category (club type for golf, camera body/lens/accessory for camera, etc.)
3. Note any context about WHY the creator uses/mentions this item
4. Score each product for "hero potential" (0-100) based on:
   - Story/emotional weight (creator shares personal story, nostalgia, sentiment)
   - Uniqueness/differentiation (unusual choice, custom, rare, vintage, discontinued)
   - Visual/viral potential (interesting look, surprising choice, controversial)
   - How much the creator talks about it

   NOTE: Do NOT score highly just because it's new or expensive. Score based on STORY and INTEREST.

5. List "story signals" - evidence that this item has a story

Return JSON:
{
  "products": [
    {
      "name": "Specific Product Name",
      "brand": "Brand Name",
      "category": "category/subcategory",
      "modelNumber": "if known",
      "estimatedPrice": "$XXX" or "N/A",
      "mentionContext": "Brief context of how/why creator mentions this",
      "isHeroCandidate": true/false,
      "heroScore": 0-100,
      "storySignals": ["signal1", "signal2"]
    }
  ]
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch {
    console.error('[UnifiedExtraction] Failed to parse description extraction:', content);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Transcript-Based Extraction
// ═══════════════════════════════════════════════════════════════════

async function extractProductsFromTranscript(
  transcript: string,
  vertical: ContentVertical,
  productMentions: ProductMention[]
): Promise<ExtractedProduct[]> {
  if (!transcript || transcript.length < 50) {
    return [];
  }

  // Build context from detected mentions
  const mentionContext = productMentions.length > 0
    ? `\n\nPRELIMINARY PRODUCT HINTS (from pattern matching):
${productMentions.slice(0, 20).map(m => `- "${m.productHint}" at ${m.timestampFormatted}: "${m.context.slice(0, 100)}..."`).join('\n')}`
    : '';

  const prompt = `You are analyzing a "${vertical}" gear video TRANSCRIPT to extract products mentioned.

TRANSCRIPT (spoken content from the video):
${transcript.slice(0, 8000)}
${mentionContext}

Extract ALL products/items the creator TALKS ABOUT in the video. This is spoken content, so:
- Pay attention to how they describe products ("my trusty putter", "this old driver")
- Note emotional language and stories they share about gear
- Capture products even if only mentioned briefly
- Include context about WHY they mention each item

For each product:
1. Identify brand and specific model when mentioned
2. Note the context/story from what they say
3. Score for story potential based on how they talk about it
4. Include timestamp reference if obvious from context

Return JSON:
{
  "products": [
    {
      "name": "Specific Product Name (best guess from speech)",
      "brand": "Brand Name",
      "category": "category/subcategory",
      "modelNumber": "if mentioned",
      "estimatedPrice": "$XXX" or "N/A",
      "mentionContext": "What they say about this item",
      "isHeroCandidate": true/false,
      "heroScore": 0-100,
      "storySignals": ["what creator said that indicates story"],
      "timestampHint": "approximate position in video if detectable"
    }
  ]
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 3000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch {
    console.error('[UnifiedExtraction] Failed to parse transcript extraction:', content);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Frame-Based Extraction
// ═══════════════════════════════════════════════════════════════════

async function extractProductsFromFrames(
  frameDetections: Array<{
    frame: VideoFrame;
    objects: Array<{
      objectType: string;
      productCategory: string;
      visualCues: string[];
      certainty: 'definite' | 'likely' | 'uncertain';
    }>;
  }>,
  vertical: ContentVertical
): Promise<ExtractedProduct[]> {
  if (frameDetections.length === 0) {
    return [];
  }

  // Build context from frame detections
  const detectionContext = frameDetections.map(fd => {
    return `Frame at ${fd.frame.timestampFormatted}:
${fd.objects.map(o => `  - ${o.objectType} (${o.certainty}): ${o.visualCues.join(', ')}`).join('\n')}`;
  }).join('\n\n');

  const prompt = `You are identifying products from VIDEO FRAME ANALYSIS of a "${vertical}" gear video.

DETECTED OBJECTS FROM VIDEO FRAMES:
${detectionContext}

For each detected object that could be a specific product:
1. Identify the most likely brand and model based on visual cues
2. Note what visual features led to this identification
3. Score confidence based on visual clarity and distinctiveness

Only include objects that are likely PRODUCTS someone would want to identify.
Skip generic objects like "table", "background", "hand", etc.

Return JSON:
{
  "products": [
    {
      "name": "Product Name (best visual identification)",
      "brand": "Brand Name (if identifiable)",
      "category": "category",
      "modelNumber": "if visible",
      "estimatedPrice": "N/A",
      "mentionContext": "Visual description: what was seen",
      "isHeroCandidate": true/false,
      "heroScore": 0-100 (based on visual prominence),
      "storySignals": [],
      "visualCues": ["cues that led to this ID"]
    }
  ]
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch {
    console.error('[UnifiedExtraction] Failed to parse frame extraction:', content);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Product Merging and Deduplication
// ═══════════════════════════════════════════════════════════════════

/**
 * Merge products from multiple sources, deduplicating and boosting confidence
 */
function mergeProducts(
  descriptionProducts: ExtractedProduct[],
  transcriptProducts: ExtractedProduct[],
  frameProducts: ExtractedProduct[]
): ExtractedProductWithSource[] {
  const mergedMap = new Map<string, ExtractedProductWithSource>();

  // Helper to generate a normalized key for matching
  function normalizeKey(product: ExtractedProduct): string {
    const brand = (product.brand || '').toLowerCase().trim();
    const name = (product.name || '').toLowerCase().trim()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ');
    return `${brand}:${name}`;
  }

  // Helper to find similar products in the map
  function findSimilar(product: ExtractedProduct): string | null {
    const key = normalizeKey(product);
    const brand = (product.brand || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    for (const [existingKey, existing] of Array.from(mergedMap.entries())) {
      const existingBrand = (existing.brand || '').toLowerCase();
      const existingName = (existing.name || '').toLowerCase();

      // Exact match
      if (existingKey === key) return existingKey;

      // Same brand, similar name
      if (brand && existingBrand && brand === existingBrand) {
        // Check if names are similar (one contains the other)
        if (name.includes(existingName) || existingName.includes(name)) {
          return existingKey;
        }
      }

      // Fuzzy match on name similarity
      if (name.length > 5 && existingName.length > 5) {
        const shorter = name.length < existingName.length ? name : existingName;
        const longer = name.length >= existingName.length ? name : existingName;
        if (longer.includes(shorter)) {
          return existingKey;
        }
      }
    }

    return null;
  }

  // Process description products first (usually most structured)
  for (const product of descriptionProducts) {
    const key = normalizeKey(product);
    mergedMap.set(key, {
      ...product,
      sources: ['description'],
      confidence: 50, // Base confidence for single source
    });
  }

  // Process transcript products
  for (const product of transcriptProducts) {
    const existingKey = findSimilar(product);

    if (existingKey) {
      // Merge with existing
      const existing = mergedMap.get(existingKey)!;
      existing.sources.push('transcript');
      existing.confidence = Math.min(100, existing.confidence + 25);
      existing.transcriptContext = product.mentionContext;

      // Use higher hero score
      if ((product.heroScore || 0) > (existing.heroScore || 0)) {
        existing.heroScore = product.heroScore;
        existing.storySignals = [
          ...(existing.storySignals || []),
          ...(product.storySignals || []),
        ];
      }
    } else {
      // New product from transcript
      const key = normalizeKey(product);
      mergedMap.set(key, {
        ...product,
        sources: ['transcript'],
        confidence: 40, // Slightly lower for transcript-only
        transcriptContext: product.mentionContext,
      });
    }
  }

  // Process frame products
  for (const product of frameProducts) {
    const existingKey = findSimilar(product);

    if (existingKey) {
      // Merge with existing
      const existing = mergedMap.get(existingKey)!;
      existing.sources.push('frame');
      existing.confidence = Math.min(100, existing.confidence + 20);
      // Frame products might have visual cues
      if ((product as ExtractedProductWithSource).visualDescription) {
        existing.visualDescription = (product as ExtractedProductWithSource).visualDescription;
      }
    } else {
      // New product from frames only (might be visible but never mentioned)
      const key = normalizeKey(product);
      mergedMap.set(key, {
        ...product,
        sources: ['frame'],
        confidence: 30, // Lower for frame-only (might be background item)
      });
    }
  }

  // Convert to array and sort by confidence + hero score
  const merged = Array.from(mergedMap.values());

  merged.sort((a, b) => {
    // Multi-source products first
    if (a.sources.length !== b.sources.length) {
      return b.sources.length - a.sources.length;
    }
    // Then by confidence
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    // Then by hero score
    return (b.heroScore || 0) - (a.heroScore || 0);
  });

  return merged;
}

// ═══════════════════════════════════════════════════════════════════
// Link Pairing with Products
// ═══════════════════════════════════════════════════════════════════

/**
 * Match extracted links from description with detected products
 */
function pairLinksWithProducts(
  products: ExtractedProductWithSource[],
  extractedLinks: Array<{ url: string; label?: string; productHint?: string; isAffiliate?: boolean; domain?: string }>
): ExtractedProductWithSource[] {
  if (extractedLinks.length === 0) {
    return products;
  }

  // Create a copy of products to modify
  const productsWithLinks = products.map(p => ({ ...p, links: [] as ExtractedLink[] }));

  // For each link, try to find a matching product
  for (const link of extractedLinks) {
    const hint = (link.productHint || link.label || '').toLowerCase().trim();
    if (!hint || hint.length < 3) continue;

    // Find best matching product
    let bestMatch: { product: ExtractedProductWithSource & { links: ExtractedLink[] }; score: number } | null = null;

    for (const product of productsWithLinks) {
      const productName = (product.name || '').toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      const productFull = `${productBrand} ${productName}`.trim();

      let score = 0;

      // Exact match on full name
      if (productFull && hint.includes(productFull)) {
        score = 100;
      }
      // Exact match on product name
      else if (productName && hint.includes(productName)) {
        score = 80;
      }
      // Product name contains hint
      else if (hint.length >= 5 && productName.includes(hint)) {
        score = 60;
      }
      // Brand match + partial name
      else if (productBrand && hint.includes(productBrand)) {
        // Check if any word from product name is in hint
        const nameWords = productName.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = nameWords.filter(w => hint.includes(w));
        if (matchingWords.length > 0) {
          score = 50 + matchingWords.length * 10;
        } else {
          score = 30; // Brand match only
        }
      }
      // Category hint (e.g., "Driver", "Putter")
      else if (product.category) {
        const category = product.category.toLowerCase();
        if (hint.includes(category) || category.includes(hint)) {
          score = 20;
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { product, score };
      }
    }

    // Attach link to best matching product if score is good enough
    if (bestMatch && bestMatch.score >= 30) {
      bestMatch.product.links.push({
        url: link.url,
        domain: link.domain || new URL(link.url).hostname,
        label: link.label || link.productHint,
        productHint: link.productHint,
        isAffiliate: link.isAffiliate || false,
      });
    }
  }

  return productsWithLinks;
}

// ═══════════════════════════════════════════════════════════════════
// Content Type Detection (Enhanced)
// ═══════════════════════════════════════════════════════════════════

function detectEnhancedContentType(
  title: string,
  description: string,
  productCount: number,
  transcriptAnalysis?: { isLikelyCollection: boolean; signals: string[] }
): { type: 'single_hero' | 'roundup' | 'comparison'; signals: string[] } {
  const signals: string[] = [];
  const titleLower = title.toLowerCase();

  // Check for explicit collection patterns in title
  const collectionTitlePatterns = [
    { pattern: /what'?s in (the|my) bag/i, signal: 'Title: what\'s in my bag' },
    { pattern: /witb/i, signal: 'Title: WITB' },
    // Setup patterns - any form of "setup" suggests multiple items
    { pattern: /\bsetup\b/i, signal: 'Title: setup (multi-item)' },
    { pattern: /\bmy\s+kit\b/i, signal: 'Title: my kit' },
    { pattern: /\btour\b/i, signal: 'Title: tour (multi-item)' },
    // Gear patterns
    { pattern: /gear\s*(check|rundown|breakdown|guide|list)?/i, signal: 'Title: gear' },
    { pattern: /\d+\s*(clubs|items|things|products|pieces)/i, signal: 'Title: numbered items' },
    { pattern: /\d+\s*(best|top|favorite|must[- ]?have|essential)/i, signal: 'Title: numbered list' },
    { pattern: /roundup|haul|collection|essentials/i, signal: 'Title: collection keywords' },
    // Golf-specific collection patterns
    { pattern: /in (the|my) (golf\s*)?bag/i, signal: 'Title: in my bag' },
    { pattern: /golf\s*bag\s*(tour|contents|setup)/i, signal: 'Title: golf bag contents' },
    // Tech/desk setup patterns
    { pattern: /(desk|office|studio|gaming|streaming)\s*setup/i, signal: 'Title: workspace setup' },
    { pattern: /(camera|audio|video|filming)\s*(setup|gear|kit)/i, signal: 'Title: camera/audio setup' },
    // EDC patterns
    { pattern: /edc|everyday\s*carry/i, signal: 'Title: EDC' },
  ];

  for (const { pattern, signal } of collectionTitlePatterns) {
    if (pattern.test(titleLower)) {
      signals.push(signal);
    }
  }

  // Check for single-item focus patterns
  const singleItemPatterns = [
    { pattern: /review/i, signal: 'Title: review (single item focus)' },
    { pattern: /unboxing/i, signal: 'Title: unboxing' },
    { pattern: /hands[- ]?on/i, signal: 'Title: hands-on' },
    { pattern: /is\s+it\s+worth/i, signal: 'Title: is it worth it' },
    { pattern: /one\s+(year|month)\s+later/i, signal: 'Title: long-term review' },
  ];

  for (const { pattern, signal } of singleItemPatterns) {
    if (pattern.test(titleLower)) {
      signals.push(signal);
    }
  }

  // Check for comparison
  const comparisonPatterns = [
    { pattern: /\bvs\.?\b/i, signal: 'Title: vs comparison' },
    { pattern: /versus/i, signal: 'Title: versus' },
    { pattern: /compared?\s+to/i, signal: 'Title: compared to' },
  ];

  for (const { pattern, signal } of comparisonPatterns) {
    if (pattern.test(titleLower)) {
      signals.push(signal);
      return { type: 'comparison', signals };
    }
  }

  // Use transcript analysis if available
  if (transcriptAnalysis?.isLikelyCollection) {
    signals.push(...transcriptAnalysis.signals.map(s => `Transcript: ${s}`));
  }

  // Count collection signals vs single-item signals
  const collectionSignals = signals.filter(s =>
    s.includes('bag') || s.includes('setup') || s.includes('rundown') ||
    s.includes('numbered') || s.includes('collection') || s.includes('Transcript') ||
    s.includes('tour') || s.includes('gear') || s.includes('kit') || s.includes('EDC')
  );

  const singleItemSignals = signals.filter(s =>
    s.includes('review') || s.includes('unboxing') ||
    s.includes('hands-on') || s.includes('worth')
  );

  // Strong collection signals - ANY setup/tour/kit signal means multi-item
  const strongCollectionSignals = signals.filter(s =>
    s.includes('setup') || s.includes('tour') || s.includes('kit') ||
    s.includes('bag') || s.includes('EDC') || s.includes('gear')
  );

  // If we have a strong collection signal, it's a roundup
  if (strongCollectionSignals.length >= 1) {
    signals.push('Strong collection signal detected');
    return { type: 'roundup', signals };
  }

  // If product count is moderate and we have any collection signals
  if (productCount >= 4 && collectionSignals.length >= 1) {
    signals.push(`Product count: ${productCount} (suggests collection)`);
    return { type: 'roundup', signals };
  }

  // If product count is high even without explicit signals
  if (productCount >= 8) {
    signals.push(`Product count: ${productCount} (high count)`);
    return { type: 'roundup', signals };
  }

  // If we have more single-item signals AND low product count
  if (singleItemSignals.length > collectionSignals.length && productCount <= 3) {
    return { type: 'single_hero', signals };
  }

  // If we have collection signals
  if (collectionSignals.length >= 1) {
    return { type: 'roundup', signals };
  }

  // Default based on product count
  if (productCount >= 5) {
    signals.push(`Product count: ${productCount} (defaulting to roundup)`);
    return { type: 'roundup', signals };
  }

  return { type: 'single_hero', signals };
}

// ═══════════════════════════════════════════════════════════════════
// Main Unified Extraction Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract products from all available sources (description, transcript, frames)
 */
export async function extractProductsFromAllSources(
  videoUrl: string,
  videoTitle: string,
  videoDescription: string,
  vertical: ContentVertical,
  extractedLinks: Array<{ url: string; label?: string }> = [],
  options: UnifiedExtractionOptions = {}
): Promise<UnifiedExtractionResult> {
  const {
    includeTranscript = true,
    includeFrames = true,
    maxFrames = 5,
    fetchFramesAsBase64 = false,
    baseUrl = '',
  } = options;

  console.log(`[UnifiedExtraction] Starting extraction for: ${videoTitle}`);

  // Extract video ID
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL: could not extract video ID');
  }

  // Run extractions in parallel where possible
  const extractionPromises: Promise<unknown>[] = [];

  // 1. Description extraction (always run)
  const descriptionPromise = extractProductsFromDescription(
    videoTitle,
    videoDescription,
    vertical,
    extractedLinks
  );
  extractionPromises.push(descriptionPromise);

  // 2. Transcript extraction (optional)
  let transcriptPromise: Promise<{
    result: TranscriptResult;
    products: ExtractedProduct[];
    mentions: ProductMention[];
  } | null> = Promise.resolve(null);

  if (includeTranscript) {
    transcriptPromise = (async () => {
      try {
        const transcriptResult = await fetchYouTubeTranscript(videoId);
        if (!transcriptResult.success || !transcriptResult.transcript) {
          console.log('[UnifiedExtraction] Transcript not available');
          return { result: transcriptResult, products: [], mentions: [] };
        }

        console.log(`[UnifiedExtraction] Got transcript: ${transcriptResult.transcript.length} chars`);

        // Extract mentions and products
        const mentions = extractProductMentionsFromTranscript(
          transcriptResult.segments,
          vertical
        );
        const products = await extractProductsFromTranscript(
          transcriptResult.transcript,
          vertical,
          mentions
        );

        return { result: transcriptResult, products, mentions };
      } catch (error) {
        console.error('[UnifiedExtraction] Transcript extraction failed:', error);
        return null;
      }
    })();
  }
  extractionPromises.push(transcriptPromise);

  // 3. Frame extraction (optional)
  let framesPromise: Promise<{
    frames: FrameExtractionResult;
    detections: Array<{
      frame: VideoFrame;
      objects: Array<{
        objectType: string;
        productCategory: string;
        visualCues: string[];
        certainty: 'definite' | 'likely' | 'uncertain';
      }>;
    }>;
    products: ExtractedProduct[];
  } | null> = Promise.resolve(null);

  if (includeFrames) {
    framesPromise = (async () => {
      try {
        const framesResult = await extractKeyFrames(videoId, {
          fetchAsBase64: fetchFramesAsBase64,
          includeStoryboard: true,
          maxFrames,
        });

        if (!framesResult.success || framesResult.frames.length === 0) {
          console.log('[UnifiedExtraction] No frames available');
          return { frames: framesResult, detections: [], products: [] };
        }

        console.log(`[UnifiedExtraction] Got ${framesResult.frames.length} frames`);

        // Analyze frames with APIS
        const analysisResult = await analyzeFramesWithAPIS(framesResult.frames, {
          vertical,
          baseUrl,
        });

        // Extract products from detections
        const products = await extractProductsFromFrames(
          analysisResult.detectedObjects,
          vertical
        );

        return {
          frames: framesResult,
          detections: analysisResult.detectedObjects,
          products,
        };
      } catch (error) {
        console.error('[UnifiedExtraction] Frame extraction failed:', error);
        return null;
      }
    })();
  }
  extractionPromises.push(framesPromise);

  // Wait for all extractions
  const [descriptionProducts, transcriptData, framesData] = await Promise.all([
    descriptionPromise,
    transcriptPromise,
    framesPromise,
  ]);

  console.log(`[UnifiedExtraction] Description products: ${descriptionProducts.length}`);
  console.log(`[UnifiedExtraction] Transcript products: ${transcriptData?.products.length || 0}`);
  console.log(`[UnifiedExtraction] Frame products: ${framesData?.products.length || 0}`);

  // Merge all products
  const mergedProducts = mergeProducts(
    descriptionProducts,
    transcriptData?.products || [],
    framesData?.products || []
  );

  console.log(`[UnifiedExtraction] Merged products: ${mergedProducts.length}`);

  // Pair links with products
  const productsWithLinks = pairLinksWithProducts(mergedProducts, extractedLinks);
  const linksMatched = productsWithLinks.reduce((sum, p) => sum + (p.links?.length || 0), 0);
  console.log(`[UnifiedExtraction] Paired ${linksMatched} links with products`);

  // Detect content type
  const transcriptAnalysis = transcriptData?.result.success
    ? analyzeTranscriptForContentType(transcriptData.result.transcript)
    : undefined;

  const { type: contentType, signals: contentTypeSignals } = detectEnhancedContentType(
    videoTitle,
    videoDescription,
    productsWithLinks.length,
    transcriptAnalysis
  );

  console.log(`[UnifiedExtraction] Detected content type: ${contentType}`);

  return {
    products: productsWithLinks,
    contentType,
    contentTypeSignals,
    extractionSources: {
      description: true,
      transcript: transcriptData?.result.success || false,
      frames: (framesData?.frames.success && framesData.frames.frames.length > 0) || false,
    },
    transcriptAvailable: transcriptData?.result.success || false,
    framesAnalyzed: framesData?.frames.frames.length || 0,
    rawData: {
      descriptionProducts,
      transcriptMentions: transcriptData?.mentions || [],
      frameDetections: framesData?.detections || [],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Export index update
// ═══════════════════════════════════════════════════════════════════

export {
  extractProductsFromDescription,
  extractProductsFromTranscript,
  extractProductsFromFrames,
  mergeProducts,
  pairLinksWithProducts,
  detectEnhancedContentType,
};
