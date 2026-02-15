/**
 * Gap Resolver — Iterative Targeted Frame Search
 *
 * When the transcript mentions a product category (e.g., "putter") but
 * the AI couldn't extract a specific model name, this module iteratively
 * extracts frames around the mention timestamps and sends targeted
 * GPT-4o vision queries to identify the specific product.
 *
 * Search strategy (up to 3 rounds):
 *   Round 1: Storyboard frames near the mention (T-5s to T+20s)
 *   Round 2: Wider storyboard window (T+25s to T+50s)
 *   Round 3: High-res 720p frames via yt-dlp at key timestamps
 *
 * Each round uses a TARGETED prompt asking specifically for the
 * product category (e.g., "What specific putter is shown?") rather
 * than a generic "identify all products" prompt.
 */

import { openai } from '../openaiClient';
import { extractRealFrames, extractHighResFrames, type ExtractedFrame } from './youtubeStoryboard';
import { extractProductMentionsFromTranscript } from '../contentIdeas/transcript';
import type { TranscriptSegment } from '../contentIdeas/transcript';
import type { TranscriptProduct, VisionProduct } from './types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TranscriptGap {
  category: string;               // "putter", "driver", etc.
  mentionTimestamps: number[];    // All timestamps where mentioned (ms)
  transcriptContext: string;      // What was said around the mentions
}

export interface GapResolutionResult {
  gap: TranscriptGap;
  product: VisionProduct | null;
  framesSearched: number;
  rounds: number;
}

// ═══════════════════════════════════════════════════════════════════
// Gap Detection
// ═══════════════════════════════════════════════════════════════════

/** Product category keywords that indicate a specific type of gear. */
const CATEGORY_KEYWORDS = new Set([
  'driver', 'putter', 'iron', 'irons', 'wedge', 'wedges',
  'hybrid', 'fairway', 'wood', '3w', '5w', '7w',
  'ball', 'rangefinder', 'bag',
]);

/**
 * Find product categories mentioned in the transcript that the AI
 * transcript analysis couldn't name specifically.
 *
 * Example: Speaker says "for my putter I switched to..." but the AI
 * only extracted category="putter" with no brand/model. That's a gap.
 */
export function findTranscriptGaps(
  segments: TranscriptSegment[],
  aiProducts: TranscriptProduct[],
): TranscriptGap[] {
  if (segments.length === 0) return [];

  const mentions = extractProductMentionsFromTranscript(segments, 'golf');

  // Build set of categories already covered by AI extraction.
  // A category is "covered" if the AI extracted a product with that
  // category OR with a name containing the category keyword.
  const coveredCategories = new Set<string>();
  for (const p of aiProducts) {
    const name = `${p.brand || ''} ${p.name}`.toLowerCase();
    const cat = (p.category || '').toLowerCase();
    if (cat) {
      coveredCategories.add(cat);
      // Also cover the singular/plural form
      coveredCategories.add(cat.replace(/s$/, ''));
      if (!cat.endsWith('s')) coveredCategories.add(cat + 's');
    }
    for (const word of name.split(/\s+/)) {
      if (word.length > 3) coveredCategories.add(word);
    }
  }

  // Group uncovered category mentions by normalized category
  const gapMap = new Map<string, { timestamps: number[]; contexts: string[] }>();

  for (const mention of mentions) {
    const hint = mention.productHint.toLowerCase();
    if (!CATEGORY_KEYWORDS.has(hint)) continue;

    // Normalize plural forms: irons → iron, wedges → wedge
    const normalized = hint.replace(/s$/, '');
    if (coveredCategories.has(normalized) || coveredCategories.has(hint)) continue;

    if (!gapMap.has(normalized)) {
      gapMap.set(normalized, { timestamps: [], contexts: [] });
    }
    const entry = gapMap.get(normalized)!;
    entry.timestamps.push(mention.timestamp);
    // Keep up to 3 context snippets
    if (entry.contexts.length < 3 && !entry.contexts.includes(mention.context)) {
      entry.contexts.push(mention.context);
    }
  }

  return Array.from(gapMap.entries()).map(([category, data]) => ({
    category,
    mentionTimestamps: data.timestamps,
    transcriptContext: data.contexts.join(' ... '),
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Round Configuration
// ═══════════════════════════════════════════════════════════════════

interface RoundConfig {
  /** Offsets in ms from mention timestamps to extract frames at */
  offsets: number[];
  /** Whether to use 720p yt-dlp extraction (slow) vs storyboard (fast) */
  useHighRes: boolean;
  /** Max frames to extract this round */
  maxFrames: number;
}

const ROUND_CONFIGS: RoundConfig[] = [
  // Round 1: Storyboard frames near mention (T-5s to T+20s)
  // Text overlays typically appear during or just after the speaker mentions the product.
  { offsets: [-5000, 0, 5000, 10000, 15000, 20000], useHighRes: false, maxFrames: 8 },

  // Round 2: Wider storyboard window (T+25s to T+50s)
  // Some videos show text overlays well after the verbal mention.
  { offsets: [25000, 30000, 35000, 40000, 45000, 50000], useHighRes: false, maxFrames: 8 },

  // Round 3: High-res 720p via yt-dlp at key timestamps
  // For text overlays with small model numbers (e.g., "A.I. ONE MILLED 7T")
  // that are unreadable at storyboard resolution (320x180).
  { offsets: [0, 10000, 20000, 30000], useHighRes: true, maxFrames: 4 },
];

// ═══════════════════════════════════════════════════════════════════
// Gap Resolution (iterative search)
// ═══════════════════════════════════════════════════════════════════

/**
 * Iteratively search for a specific product category in video frames.
 *
 * Starts with storyboard frames near the transcript mention, then
 * widens the window, then tries high-res extraction. Stops as soon
 * as the product is identified with sufficient confidence.
 */
export async function resolveGap(
  videoId: string,
  gap: TranscriptGap,
  videoDurationMs: number,
  channelName: string = '',
): Promise<GapResolutionResult> {
  let totalFramesSearched = 0;
  const searchedBuckets = new Set<number>();

  for (let round = 0; round < ROUND_CONFIGS.length; round++) {
    const config = ROUND_CONFIGS[round];

    // Build timestamps: apply offsets to mention timestamps.
    // Round 1 uses all mention timestamps (up to 3) as bases.
    // Rounds 2-3 use just the earliest mention as the anchor.
    const bases = round === 0
      ? gap.mentionTimestamps.slice(0, 3)
      : [Math.min(...gap.mentionTimestamps)];

    const timestamps: number[] = [];
    for (const base of bases) {
      for (const offset of config.offsets) {
        const ts = base + offset;
        if (ts < 0 || ts > videoDurationMs) continue;

        // Quantize to 2s buckets to avoid near-duplicate timestamps
        const bucket = Math.round(ts / 2000) * 2000;
        if (searchedBuckets.has(bucket)) continue;
        searchedBuckets.add(bucket);

        timestamps.push(ts);
      }
    }

    if (timestamps.length === 0) continue;

    // Extract frames
    const toExtract = timestamps.slice(0, config.maxFrames);
    let frames: ExtractedFrame[];

    try {
      if (config.useHighRes) {
        frames = await extractHighResFrames(videoId, toExtract);
      } else {
        frames = await extractRealFrames(videoId, toExtract);
      }
    } catch (error) {
      console.warn(`[GapResolver] Frame extraction failed (round ${round + 1}):`, error);
      continue;
    }

    totalFramesSearched += frames.length;
    if (frames.length === 0) continue;

    // Send targeted vision query for this specific category
    const product = await targetedVisionQuery(frames, gap, channelName);

    if (product) {
      // Post-process brand: fix known misparses using channel context
      fixProductBrand(product, channelName);
    }

    if (product && product.confidence >= 55) {
      console.log(
        `[GapResolver] Found ${gap.category}: ${product.brand} ${product.name}` +
        ` (${product.confidence}%, round ${round + 1}, ${totalFramesSearched} frames searched)`,
      );
      return { gap, product, framesSearched: totalFramesSearched, rounds: round + 1 };
    }

    console.log(
      `[GapResolver] Round ${round + 1} for "${gap.category}": not found in ${frames.length} frames`,
    );
  }

  console.log(
    `[GapResolver] Could not identify "${gap.category}" after ${totalFramesSearched} frames across ${ROUND_CONFIGS.length} rounds`,
  );
  return { gap, product: null, framesSearched: totalFramesSearched, rounds: ROUND_CONFIGS.length };
}

// ═══════════════════════════════════════════════════════════════════
// Targeted Vision Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Send a focused GPT-4o vision query asking specifically for one
 * product category. Much more effective than the generic "identify
 * all products" prompt because it tells the model exactly what to
 * look for and where.
 */
async function targetedVisionQuery(
  frames: ExtractedFrame[],
  gap: TranscriptGap,
  channelName: string = '',
): Promise<VisionProduct | null> {
  const imageContent = frames.map(f => ({
    type: 'image_url' as const,
    image_url: { url: f.base64, detail: 'high' as const },
  }));

  const frameLabels = frames
    .map((f, i) => `Image ${i + 1}: Frame at ${f.timestampFormatted} (${f.width}x${f.height})`)
    .join('\n');

  const channelHint = channelName
    ? `\nCHANNEL: ${channelName} (this is likely the primary brand for all products shown)\n`
    : '';

  const prompt = `You are searching for a specific product in video frames from a golf video.
${channelHint}
The speaker mentions their "${gap.category}" around these timestamps. These frames are from around those moments.

TRANSCRIPT CONTEXT:
${gap.transcriptContext.slice(0, 800)}

FRAMES:
${frameLabels}

YOUR TASK: Identify the SPECIFIC brand and model of ${gap.category} shown in these frames.

Look carefully for:
1. TEXT OVERLAYS on screen showing product name, model number, or specs (e.g., "PHANTOM X 5", "AI ONE 7T", "APEX PRO '24")
2. BRAND LOGOS on the product (Scotty Cameron circle-T, Callaway chevron, TaylorMade badge, Ping eye, Cobra snake, Titleist script, etc.)
3. MODEL TEXT printed/engraved on the product
4. DISTINCTIVE DESIGN features that identify a specific model

IMPORTANT:
- Only return a product if you see VISUAL EVIDENCE (text, logo, or distinctive design) in the frames
- Do NOT guess based solely on the transcript context
- An empty products array is better than a wrong identification
- If you see partial text (e.g., just a brand logo but no model), still return what you can identify with reasonable confidence

Return JSON:
{
  "products": [
    {
      "name": "Model Name (without brand prefix)",
      "brand": "Brand",
      "category": "${gap.category}",
      "confidence": 85,
      "visualDescription": "What visual evidence identified this (text overlay read, logo spotted, etc.)",
      "frameIndex": 0,
      "frameTimestamp": "5:30"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const products = parsed.products || [];

    if (products.length === 0) return null;

    // Return the highest-confidence product
    const best = products.sort(
      (a: { confidence?: number }, b: { confidence?: number }) =>
        (b.confidence || 0) - (a.confidence || 0),
    )[0];

    const frameIdx =
      typeof best.frameIndex === 'number' &&
      best.frameIndex >= 0 &&
      best.frameIndex < frames.length
        ? best.frameIndex
        : 0;

    return {
      name: best.name || 'Unknown',
      brand: best.brand || '',
      category: best.category || gap.category,
      confidence: Math.min(100, Math.max(0, best.confidence || 50)),
      visualDescription: best.visualDescription,
      frameIndex: frameIdx,
      frameUrl: frames[frameIdx].base64,
      frameTimestamp: best.frameTimestamp || frames[frameIdx].timestampFormatted,
    };
  } catch (error) {
    console.error(`[GapResolver] Vision query failed for "${gap.category}":`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Brand Post-Processing
// ═══════════════════════════════════════════════════════════════════

/**
 * Known product line prefixes that GPT-4o sometimes misidentifies as brands.
 * Maps prefix → actual parent brand.
 */
const PRODUCT_LINE_BRANDS: Record<string, string> = {
  'a.i.': 'Callaway',
  'ai': 'Callaway',
  'opus': 'Callaway',
  'apex': 'Callaway',
  'elyte': 'Callaway',
  'paradym': 'Callaway',
  'chrome': 'Callaway',
  'mavrik': 'Callaway',
  'rogue': 'Callaway',
  'big bertha': 'Callaway',
  'jaws': 'Callaway',
  'qi': 'TaylorMade',
  'stealth': 'TaylorMade',
  'spider': 'TaylorMade',
  'sim': 'TaylorMade',
  'tp': 'TaylorMade',
  'p7': 'TaylorMade',
  'phantom': 'Titleist',
  'vokey': 'Titleist',
  'pro v1': 'Titleist',
  'tsi': 'Titleist',
  'gt': 'Titleist',
  'tri-hot': 'Odyssey',
  'ten': 'Odyssey',
  'z-star': 'Srixon',
  'zx': 'Srixon',
};

/** Golf brand keywords found in channel names */
const CHANNEL_BRAND_KEYWORDS: Record<string, string> = {
  'callaway': 'Callaway',
  'taylormade': 'TaylorMade',
  'titleist': 'Titleist',
  'ping': 'Ping',
  'cobra': 'Cobra',
  'srixon': 'Srixon',
  'mizuno': 'Mizuno',
  'cleveland': 'Cleveland',
  'odyssey': 'Odyssey',
};

/**
 * Fix known brand misparses on a vision product.
 * GPT-4o sometimes reads a text overlay like "A.I. ONE MILLED 7T"
 * and sets brand="A.I." — this corrects it to "Callaway".
 */
export function fixProductBrand(product: VisionProduct, channelName: string): void {
  const brandLower = (product.brand || '').toLowerCase().trim();
  const nameLower = product.name.toLowerCase();

  // 1. Check if the "brand" is actually a known product line prefix
  if (brandLower && PRODUCT_LINE_BRANDS[brandLower]) {
    product.brand = PRODUCT_LINE_BRANDS[brandLower];
    return;
  }

  // 2. Check if product name starts with a known product line
  if (!product.brand || product.brand === 'Unknown' || product.brand === 'unknown') {
    for (const [prefix, parentBrand] of Object.entries(PRODUCT_LINE_BRANDS)) {
      if (nameLower.startsWith(prefix)) {
        product.brand = parentBrand;
        return;
      }
    }
  }

  // 3. If still no brand, try to infer from channel name
  if (!product.brand || product.brand === 'Unknown' || product.brand === 'unknown') {
    const channelLower = channelName.toLowerCase();
    for (const [keyword, brand] of Object.entries(CHANNEL_BRAND_KEYWORDS)) {
      if (channelLower.includes(keyword)) {
        product.brand = brand;
        return;
      }
    }
  }
}
