/**
 * Combined Vision + Transcript Analysis
 * Sends multiple video frames + transcript context to GPT-4o
 * in a single multi-image call for efficient product identification.
 * Returns frame index and URL so products can be mapped to specific screenshots.
 *
 * Supports two modes:
 *  - YouTube: frames + transcript context (transcript is primary, vision confirms)
 *  - TikTok:  high-res frames only, vision is primary, reads text overlays
 */

import { openai } from '../openaiClient';
import type { VisionProduct } from './types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface FrameInput {
  url: string;
  base64?: string;
  timestampFormatted: string;
}

export interface CombinedAnalysisResult {
  products: VisionProduct[];
  framesAnalyzed: number;
}

// ═══════════════════════════════════════════════════════════════════
// YouTube: Multi-Frame Analysis with Transcript
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze multiple video frames + transcript context in a single GPT-4o call.
 * Returns products with frameIndex mapped back to actual frame URLs.
 */
export async function analyzeFramesWithTranscript(
  frames: FrameInput[],
  transcriptExcerpt: string,
  videoTitle: string,
): Promise<CombinedAnalysisResult> {
  if (frames.length === 0) {
    return { products: [], framesAnalyzed: 0 };
  }

  const imageContent = buildImageContent(frames);
  const frameLabels = frames.map((f, i) => `Image ${i + 1} (frame_index ${i}): Frame at ${f.timestampFormatted}`).join('\n');

  const transcriptSection = transcriptExcerpt
    ? `\n\nTRANSCRIPT EXCERPT (for context on what products are discussed):\n${transcriptExcerpt.slice(0, 3000)}`
    : '';

  const prompt = `You are analyzing frames from a video titled "${videoTitle}" to identify products shown.

FRAMES:
${frameLabels}
${transcriptSection}

For EACH distinct product you can identify in these frames:
1. Provide the specific brand and model name if visible/identifiable
2. Note what visual cues led to the identification (logos, colors, distinctive shapes)
3. Rate your confidence (0-100) based on visual clarity
4. IMPORTANT: Specify the frame_index (0-based integer) of the frame where you spotted it

Focus on identifiable products people would want to purchase. Skip generic items (tables, walls, hands).
IMPORTANT: Only include a product if you can identify at least a BRAND or a SPECIFIC MODEL NAME.
Do NOT return generic identifications like "Golf Bag", "Golf Ball", or "Golf Glove" without a specific brand/model.
Cross-reference with the transcript to improve identification accuracy.

Return JSON:
{
  "products": [
    {
      "name": "Specific Product Name",
      "brand": "Brand",
      "category": "category",
      "color": "primary color(s)",
      "confidence": 70,
      "visualDescription": "What visual cues identified this",
      "frameIndex": 0,
      "frameTimestamp": "2:34"
    }
  ]
}`;

  return callVision(prompt, imageContent, frames);
}

// ═══════════════════════════════════════════════════════════════════
// YouTube: Vision-Heavy Batched Analysis (no transcript fallback)
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze a batch of YouTube frames with an enhanced prompt optimized for
 * reading text overlays, brand logos, and thorough product extraction.
 * Used when no transcript is available and vision is the primary source.
 */
async function analyzeYouTubeFrameBatch(
  frames: FrameInput[],
  videoTitle: string,
  transcriptExcerpt: string,
): Promise<CombinedAnalysisResult> {
  if (frames.length === 0) {
    return { products: [], framesAnalyzed: 0 };
  }

  const imageContent = buildImageContent(frames);
  const frameLabels = frames.map((f, i) =>
    `Image ${i + 1} (frame_index ${i}): Frame at ${f.timestampFormatted}`
  ).join('\n');

  const contextSection = transcriptExcerpt
    ? `\n\nAVAILABLE CONTEXT (partial transcript or description):\n${transcriptExcerpt.slice(0, 2000)}`
    : '';

  const prompt = `You are analyzing frames from a YouTube video titled "${videoTitle}" to identify ALL products shown.
NO TRANSCRIPT IS AVAILABLE — these frames are your ONLY source. Be EXTREMELY thorough — do not miss anything.

FRAMES:
${frameLabels}
${contextSection}

CRITICAL INSTRUCTIONS:
1. **READ ALL TEXT** — Read EVERY piece of text visible on screen: product labels, packaging text, brand names, model numbers, text overlays added by the creator. Text is your PRIMARY identification source.

2. **SEPARATE THE CREATOR FROM THE PRODUCTS** — The person presenting items may be wearing their own branded jewelry, clothing, or accessories (necklaces, bracelets, watches, rings). Do NOT attribute the brand of what the creator is WEARING to the products they are SHOWING from the bag. Determine each product's brand by looking at the PRODUCT ITSELF — its own logos, hardware, stamps, labels, and design features. For example, if the creator wears a Vivienne Westwood necklace but shows a black leather bag, identify the bag by its own hardware/design, not the necklace brand.

3. **IDENTIFY BRAND LOGOS & MARKINGS ON EACH PRODUCT** — Look at each product individually for:
   - Logo stamps, engravings, or embossings on the product itself
   - Distinctive hardware styles (Balenciaga City bags have arena leather + brass studs + front zip; Chanel has CC turn-lock + quilted leather; Hermès has Clochette lock)
   - Monogram patterns on the product's leather/fabric (LV, Gucci GG, Dior oblique)
   - Packaging colors/design (Clinique green stripe, L'Occitane yellow, Innisfree green)
   - Product shape (EOS egg-shaped lip balm, Altoids rectangular tin)

4. **IDENTIFY EVERY DISTINCT ITEM** — This video likely shows many items one by one. Extract ALL of them:
   - Fashion/accessories: bags, wallets, pouches, sunglasses, jewelry, watches, hats, shoes, keychains, phone cases, hair accessories, scarves
   - Beauty/skincare: makeup, lipstick, lip balm, lip gloss, perfume, moisturizer, hand cream, mist, serum, mascara, foundation, blush, concealer
   - Electronics: phones, headphones, earbuds, chargers, cables, cameras, AirPods
   - Personal items: keys, keychains, gum/mints, pens, notebooks, hand sanitizer, tissues
   - Keychains and bag charms: plush/character keychains, metal charms, novelty keychains — identify the CHARACTER or BRAND (e.g., "Beavis and Butthead keychain", "Hello Kitty charm")
   - Any other consumer product someone might want to buy

5. **DON'T STOP EARLY** — In "What's in My Bag" videos, creators typically show 10-25+ items. If you've only found a few, look more carefully at each frame. Each frame may contain one or more items being shown by the creator. Look for small items they hold up briefly — keychains, charms, cards, coins.

6. **KEYCHAINS COUNT AS PRODUCTS** — Bag charms, plush keychains, character keychains, and metal charms attached to the bag are products viewers want to identify. List each one separately with its character/brand if recognizable.

7. Specify the frame_index where the product is MOST clearly visible.
8. Multiple products in one frame = list each separately.
9. Same product across multiple frames = list ONCE with the best frame.

Rate confidence:
- 90-100: Brand AND model clearly identifiable
- 70-89: Brand clear, specific product partially identifiable
- 50-69: Product type clear, brand probable but not certain
- Below 50: Barely identifiable

Return JSON:
{
  "products": [
    {
      "name": "Specific Product Name (without brand prefix)",
      "brand": "Brand",
      "category": "category",
      "color": "primary color(s) of the product (e.g. black, pink, silver, red and white)",
      "confidence": 85,
      "visualDescription": "What text/logos/markings identified this product",
      "frameIndex": 0,
      "frameTimestamp": "2:34"
    }
  ]
}`;

  return callVision(prompt, imageContent, frames);
}

/**
 * Analyze ALL YouTube frames by splitting into batches and deduplicating.
 * Used when no transcript is available (vision-heavy mode).
 */
export async function analyzeYouTubeFramesBatched(
  frames: FrameInput[],
  videoTitle: string,
  transcriptExcerpt: string,
  batchSize: number = 10,
): Promise<CombinedAnalysisResult> {
  if (frames.length === 0) {
    return { products: [], framesAnalyzed: 0 };
  }

  const allProducts: VisionProduct[] = [];
  let totalFramesAnalyzed = 0;

  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);
    const batchOffset = i;

    console.log(`[YouTubeVision] Analyzing batch ${Math.floor(i / batchSize) + 1} (frames ${i + 1}-${i + batch.length})...`);

    const result = await analyzeYouTubeFrameBatch(batch, videoTitle, transcriptExcerpt);
    totalFramesAnalyzed += result.framesAnalyzed;

    // Adjust frame indices to be global
    for (const product of result.products) {
      allProducts.push({
        ...product,
        frameIndex: product.frameIndex + batchOffset,
        frameUrl: frames[product.frameIndex + batchOffset]?.base64
          || frames[product.frameIndex + batchOffset]?.url
          || product.frameUrl,
      });
    }
  }

  // Deduplicate across batches
  const deduped = deduplicateVisionProducts(allProducts);

  console.log(`[YouTubeVision] Found ${deduped.length} unique products across ${totalFramesAnalyzed} frames`);

  return {
    products: deduped,
    framesAnalyzed: totalFramesAnalyzed,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TikTok: Vision-Primary Batch Analysis
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze a batch of TikTok frames. Optimized for short-form video:
 * - Reads text overlays (TikTok creators often label products on screen)
 * - Identifies brand logos and product details at high resolution
 * - Uses video title/description as context (no transcript)
 *
 * Call this in batches of ~10-15 frames for best results.
 */
export async function analyzeTikTokFrameBatch(
  frames: FrameInput[],
  videoTitle: string,
  videoDescription: string,
): Promise<CombinedAnalysisResult> {
  if (frames.length === 0) {
    return { products: [], framesAnalyzed: 0 };
  }

  const imageContent = buildImageContent(frames);
  const frameLabels = frames.map((f, i) => `Image ${i + 1} (frame_index ${i}): Frame at ${f.timestampFormatted}`).join('\n');

  const prompt = `You are analyzing frames from a TikTok video to identify ALL products shown, including their BRANDS.

VIDEO TITLE: ${videoTitle}
VIDEO DESCRIPTION: ${videoDescription.slice(0, 500)}

FRAMES (in chronological order):
${frameLabels}

CRITICAL INSTRUCTIONS:
1. READ ALL TEXT OVERLAYS carefully — TikTok creators label products on screen (e.g. "Item 1: Gym Pin"). These are your primary source for WHAT the product is.
2. BRAND IDENTIFICATION IS CRITICAL. For every product, actively look for:
   - Brand logos printed/embroidered on the product itself
   - Brand text on packaging, labels, or tags
   - Distinctive brand design elements (e.g. a skull/crossbones logo on black neoprene gym gear = Gymreapers)
   - Brand text visible on bottles, containers, supplements (e.g. "KLOUT" on a supplement tub, "Gasp" on a shaker bottle)
3. For close-up product shots: zoom in mentally and read ANY text on the product.
4. If the text overlay says something generic like "Wrist Straps" or "Knee Sleeves", the BRAND should come from the product visuals — look at the actual item for logos.
5. Specify the frame_index where the product is MOST clearly visible (prefer close-up/product shots over in-use shots).
6. Multiple items in one frame = list each separately.
7. Same item across multiple frames = list ONCE with best frame.
8. If "Wrist Wraps" and "Elbow Wraps" are shown as separate items in different frames, list them as separate products.

Rate confidence:
- 90-100: Brand AND product clearly identifiable
- 70-89: Product clear, brand partially visible
- 50-69: Product clear but no brand visible
- Below 50: Vaguely identifiable

Return JSON:
{
  "products": [
    {
      "name": "Specific Product Name (without brand prefix)",
      "brand": "Brand Name (empty string if truly unidentifiable)",
      "category": "category",
      "color": "primary color(s) of the product",
      "confidence": 85,
      "visualDescription": "Describe text overlays read, logos spotted, brand markings seen",
      "frameIndex": 0,
      "frameTimestamp": "0:06"
    }
  ]
}`;

  return callVision(prompt, imageContent, frames);
}

/**
 * Analyze ALL TikTok frames by splitting into batches and deduplicating.
 * Handles the full 30-60 frames from a typical TikTok video.
 */
export async function analyzeTikTokFrames(
  frames: FrameInput[],
  videoTitle: string,
  videoDescription: string,
  batchSize: number = 12,
): Promise<CombinedAnalysisResult> {
  if (frames.length === 0) {
    return { products: [], framesAnalyzed: 0 };
  }

  const allProducts: VisionProduct[] = [];
  let totalFramesAnalyzed = 0;

  // Process in batches
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);
    const batchOffset = i; // Global frame offset

    console.log(`[TikTokVision] Analyzing batch ${Math.floor(i / batchSize) + 1} (frames ${i + 1}-${i + batch.length})...`);

    const result = await analyzeTikTokFrameBatch(batch, videoTitle, videoDescription);
    totalFramesAnalyzed += result.framesAnalyzed;

    // Adjust frame indices to be global
    for (const product of result.products) {
      allProducts.push({
        ...product,
        frameIndex: product.frameIndex + batchOffset,
        frameUrl: frames[product.frameIndex + batchOffset]?.base64
          || frames[product.frameIndex + batchOffset]?.url
          || product.frameUrl,
      });
    }
  }

  // Deduplicate: merge products with similar names across batches
  const deduped = deduplicateVisionProducts(allProducts);

  console.log(`[TikTokVision] Found ${deduped.length} unique products across ${totalFramesAnalyzed} frames`);

  return {
    products: deduped,
    framesAnalyzed: totalFramesAnalyzed,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Shared Helpers
// ═══════════════════════════════════════════════════════════════════

function buildImageContent(frames: FrameInput[]) {
  const imageContent: Array<{
    type: 'image_url';
    image_url: { url: string; detail: 'low' | 'high' };
  }> = [];

  for (const frame of frames) {
    const imageUrl = frame.base64 || frame.url;
    imageContent.push({
      type: 'image_url',
      image_url: { url: imageUrl, detail: 'high' },
    });
  }

  return imageContent;
}

async function callVision(
  prompt: string,
  imageContent: Array<{ type: 'image_url'; image_url: { url: string; detail: 'low' | 'high' } }>,
  frames: FrameInput[],
): Promise<CombinedAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { products: [], framesAnalyzed: frames.length };
    }

    const parsed = JSON.parse(content);
    return {
      products: (parsed.products || []).map((p: {
        name?: string;
        brand?: string;
        category?: string;
        color?: string;
        confidence?: number;
        visualDescription?: string;
        frameIndex?: number;
        frameTimestamp?: string;
      }) => {
        const frameIdx = typeof p.frameIndex === 'number' && p.frameIndex >= 0 && p.frameIndex < frames.length
          ? p.frameIndex
          : 0;

        return {
          name: p.name || 'Unknown',
          brand: p.brand,
          category: p.category,
          color: p.color,
          confidence: Math.min(100, Math.max(0, p.confidence || 30)),
          visualDescription: p.visualDescription,
          frameIndex: frameIdx,
          frameUrl: frames[frameIdx].base64 || frames[frameIdx].url,
          frameTimestamp: p.frameTimestamp || frames[frameIdx].timestampFormatted,
        } satisfies VisionProduct;
      }),
      framesAnalyzed: frames.length,
    };
  } catch (error) {
    console.error('[CombinedAnalysis] Vision analysis failed:', error);
    return { products: [], framesAnalyzed: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Targeted Fashion Item Re-Identification
// ═══════════════════════════════════════════════════════════════════

/** Categories that benefit from fashion-specific re-identification */
const FASHION_CATEGORIES = new Set([
  'fashion/accessories', 'fashion', 'accessories', 'bags', 'handbags',
  'wallets', 'keychains', 'jewelry',
]);

const FASHION_KEYWORDS = ['bag', 'handbag', 'purse', 'wallet', 'keychain', 'charm', 'tote', 'clutch', 'pouch'];

/**
 * Targeted re-identification for unbranded fashion items (bags, wallets, keychains).
 * Uses a fashion-specialist prompt that's much better at identifying luxury brands
 * from design features like hardware, leather texture, and silhouette.
 */
export async function identifyFashionItems(
  items: Array<{ product: VisionProduct; hiResFrame?: string; additionalFrames?: string[] }>,
): Promise<Map<number, { brand: string; name: string; confidence: number }>> {
  const results = new Map<number, { brand: string; name: string; confidence: number }>();
  if (items.length === 0) return results;

  // Process items individually for best accuracy
  for (let i = 0; i < items.length; i++) {
    const { product, hiResFrame, additionalFrames } = items[i];
    const frameUrl = hiResFrame || product.frameUrl;
    if (!frameUrl) continue;

    const nameLower = product.name.toLowerCase();
    const catLower = (product.category || '').toLowerCase();
    // Check isKeychain FIRST — 'keychain' and 'charm' are also in FASHION_KEYWORDS
    // so isBag would match keychains too if checked first
    const isKeychain = nameLower.includes('keychain') ||
      nameLower.includes('charm') ||
      nameLower.includes('plush') ||
      catLower.includes('keychain') ||
      catLower.includes('charm');
    const isBag = !isKeychain && FASHION_KEYWORDS.some(kw =>
      nameLower.includes(kw) || catLower.includes(kw)
    );

    let itemPrompt: string;
    if (isKeychain) {
      itemPrompt = `You are a collectible toy and accessory expert cataloging items from a "What's in My Bag" video.

IMPORTANT: IGNORE the bag itself. Focus ONLY on the keychain, charm, or figure ATTACHED to the bag. The bag is NOT what you're identifying.

Look at the small item hanging from the bag and identify it:

IF IT'S A PLUSH/FIGURE KEYCHAIN:
- Is it a designer toy? Consider brands: Popmart (Skullpanda, Molly, Dimoo, Hirono), Tokidoki, Sonny Angel, Kewpie, Labubu, Crybaby
- Is it a character from a franchise? (Sanrio, Hello Kitty, My Melody, Kuromi, anime, cartoon, Beavis and Butthead, Powerpuff Girls, etc.)
- Is it a Monchhichi, Ddung, Blythe, or other collectible doll?
- Describe the character's features: face shape, hair color, eye style, outfit

IF IT'S A METAL CHARM:
- Is it a moth/butterfly design? (death's head moth, luna moth)
- Is it a branded charm? (Vivienne Westwood orb, Tiffany heart, Chrome Hearts cross, Alexander McQueen skull)
- Describe the design: shape, material, any visible text or logos

Return JSON: { "brand": "Brand, artist, or franchise name", "name": "Specific character, model, or design name", "confidence": 75, "description": "What visual features identified this" }`;
    } else if (isBag) {
      itemPrompt = `You are a fashion product analyst cataloging items for a shopping app. Identify this bag.

Analyze the design features:
1. Leather texture (arena/distressed, smooth, pebbled, quilted, saffiano)
2. Hardware style (studs, buckles, chain straps, turn-locks, zipper pulls)
3. Handle/strap construction
4. Overall silhouette and shape
5. Any visible logos, stamps, monograms, or engravings

Based on these features, identify the brand and model. Consider brands like:
Balenciaga (City bag = arena leather + brass studs + front zip + studded handles),
Chanel (quilted + CC turn-lock), Louis Vuitton (monogram/damier), Gucci (GG pattern + bamboo/horsebit),
Givenchy (Antigona, Pandora), Saint Laurent (Sac De Jour, Lou Lou), Prada (saffiano + triangle logo),
Alexander Wang, Celine, Bottega Veneta (intrecciato weave), Vivienne Westwood.

Return JSON: { "brand": "Brand", "name": "Model Name", "confidence": 85, "features": "key identifying features" }`;
    } else {
      itemPrompt = `Identify this fashion accessory for a shopping catalog. What brand and model is it?
Return JSON: { "brand": "Brand", "name": "Product name", "confidence": 75 }`;
    }

    try {
      // Build image content: primary frame + additional frames for keychains
      const imageContent: Array<{ type: 'image_url'; image_url: { url: string; detail: 'high' | 'low' } }> = [
        { type: 'image_url', image_url: { url: frameUrl, detail: 'high' } },
      ];
      if (isKeychain && additionalFrames) {
        for (const extra of additionalFrames.slice(0, 3)) {
          imageContent.push({ type: 'image_url', image_url: { url: extra, detail: 'high' } });
        }
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: itemPrompt },
            ...imageContent,
          ],
        }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.brand && parsed.brand !== 'Unknown') {
          results.set(i, {
            brand: parsed.brand,
            name: parsed.name || product.name,
            confidence: parsed.confidence || 75,
          });
        }
      }
    } catch (error) {
      console.error(`[FashionID] Failed for item ${i}:`, error instanceof Error ? error.message : error);
    }
  }

  return results;
}

/**
 * Check if a vision product is an unbranded fashion item that could benefit
 * from targeted re-identification.
 */
export function isUnbrandedFashionItem(product: VisionProduct): boolean {
  const hasBrand = product.brand && product.brand !== 'Unknown' && product.brand !== 'unknown';
  if (hasBrand) return false;

  const cat = (product.category || '').toLowerCase();
  const name = product.name.toLowerCase();

  return FASHION_CATEGORIES.has(cat) ||
    FASHION_KEYWORDS.some(kw => name.includes(kw) || cat.includes(kw));
}

/**
 * Deduplicate vision products across batches by name similarity.
 * When duplicates found, keep the one with highest confidence.
 */
function deduplicateVisionProducts(products: VisionProduct[]): VisionProduct[] {
  const unique: VisionProduct[] = [];

  for (const product of products) {
    const existingIdx = unique.findIndex(u => isSameProduct(u, product));

    if (existingIdx >= 0) {
      // Keep the one with higher confidence
      if (product.confidence > unique[existingIdx].confidence) {
        unique[existingIdx] = product;
      }
    } else {
      unique.push(product);
    }
  }

  return unique;
}

/** Check if two vision products are likely the same item */
function isSameProduct(a: VisionProduct, b: VisionProduct): boolean {
  const aName = `${a.brand || ''} ${a.name}`.toLowerCase().trim();
  const bName = `${b.brand || ''} ${b.name}`.toLowerCase().trim();

  // Exact match
  if (aName === bName) return true;

  // One contains the other
  if (aName.includes(bName) || bName.includes(aName)) return true;

  // Word overlap
  const aWords = new Set(aName.split(/\s+/).filter(w => w.length > 2));
  const bWords = new Set(bName.split(/\s+/).filter(w => w.length > 2));
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;

  return union > 0 && (intersection / union) >= 0.6;
}
