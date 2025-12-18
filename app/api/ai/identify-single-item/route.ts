import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { validateAndCompressImage } from '@/lib/ai';
import { generateBrandContext } from '@/lib/brandKnowledge';

// ============================================================================
// Web Search for Current Products
// ============================================================================

interface WebSearchResult {
  query: string;
  snippets: string[];
}

/**
 * Search the web for current product information to supplement AI knowledge
 * This helps identify products released after the AI's training cutoff
 */
async function searchCurrentProducts(
  brand: string,
  productType: string,
  year: number = new Date().getFullYear()
): Promise<WebSearchResult | null> {
  try {
    // Build search query for latest products
    const query = `${brand} ${productType} ${year} ${year - 1} new model release`;

    // Use Brave Search API if available, otherwise return null
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!braveApiKey) {
      console.log('[identify-single-item] No BRAVE_SEARCH_API_KEY, skipping web search');
      return null;
    }

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': braveApiKey
        }
      }
    );

    if (!response.ok) {
      console.error('[identify-single-item] Brave search failed:', response.status);
      return null;
    }

    const data = await response.json();
    const snippets = data.web?.results
      ?.slice(0, 5)
      ?.map((r: any) => `${r.title}: ${r.description}`)
      ?.filter(Boolean) || [];

    return { query, snippets };
  } catch (error) {
    console.error('[identify-single-item] Web search error:', error);
    return null;
  }
}

/**
 * Tap-to-Identify: Single Item Identification
 *
 * Replaces the multi-stage APIS pipeline with a single, focused call.
 * Uses GPT-4o with detail:'high' and "describe first, match second" strategy.
 *
 * Key improvements over old pipeline:
 * 1. Uses gpt-4o (not mini) with detail: 'high' (not low)
 * 2. User crops to single item (no false detections)
 * 3. "Describe first, match second" prompting
 * 4. Always returns top 3 guesses with differentiators
 * 5. Honest about uncertainty
 */

// ============================================================================
// Types
// ============================================================================

export interface IdentifySingleItemRequest {
  imageBase64: string;           // REQUIRED: Cropped image of single item
  categoryHint?: string;         // Optional: "golf", "tech", etc.
  brandHint?: string;            // Optional: User says "I think it's Titleist"
  additionalContext?: string;    // Optional: Any text the user provides
}

export interface VisualDescription {
  objectType: string;            // "mallet putter headcover"
  primaryColor: string;
  secondaryColors: string[];
  finish: string;                // "matte", "glossy", "metallic"
  materials: string[];
  shape: string;
  visibleText: string[];         // Any text/numbers seen
  brandIndicators: string[];     // Logo shapes, design cues
  conditionNotes: string;
  size: string;
}

export interface ProductGuess {
  rank: 1 | 2 | 3;
  name: string;
  brand: string;
  model?: string;
  year?: number;
  confidence: number;            // 0-100
  confidenceLevel: 'high' | 'medium' | 'low' | 'uncertain';
  matchingReasons: string[];
  differentiators: string[];     // What would confirm/deny this guess
}

export interface UncertaintyInfo {
  isConfident: boolean;          // Only true if top guess >= 70%
  reason: string | null;
  whatWouldHelp: string[];
}

export interface IdentifySingleItemResult {
  visualDescription: VisualDescription;
  guesses: ProductGuess[];
  uncertainty: UncertaintyInfo;
  processingTimeMs: number;
  modelUsed: string;
}

export interface IdentifySingleItemResponse {
  success: boolean;
  result?: IdentifySingleItemResult;
  error?: string;
}

// ============================================================================
// TWO-STAGE IDENTIFICATION PIPELINE
// ============================================================================

// Stage 1: Extract visual features ONLY (no identification)
function buildFeatureExtractionPrompt(): string {
  return `You are a visual feature extraction expert. Your ONLY job is to describe what you see in the image.

DO NOT attempt to identify the product. DO NOT guess the brand or model. ONLY describe visual features.

Extract the following:

{
  "objectType": "What type of object (driver, iron, putter, headcover, shoe, etc.)",
  "primaryColor": "The dominant color",
  "secondaryColors": ["List of accent/secondary colors"],
  "finish": "matte/glossy/metallic/satin/brushed/carbon fiber weave",
  "materials": ["Visible materials: carbon, titanium, steel, leather, etc."],
  "shape": "Shape description (oversized, compact, mallet, blade, etc.)",
  "visibleText": ["ANY text you can read - quote EXACTLY"],
  "visibleLogos": ["Describe any logos/symbols you see - shapes, not brand names"],
  "colorAccents": ["Where are accent colors located? (sole, crown, heel, etc.)"],
  "distinctiveFeatures": ["Any unique design elements, patterns, textures"],
  "crownPattern": "For clubs: what does the crown look like? (solid, carbon weave, seams visible, etc.)",
  "soleFeatures": "For clubs: weights, text, patterns on sole",
  "estimatedAge": "new/recent/older based on condition"
}

CRITICAL: Do NOT identify the brand or model. Only describe what you physically see.`;
}

// Stage 2: Match features against brand knowledge (no vision needed)
function buildMatchingPrompt(features: any, brandContext: string): string {
  return `You are a product matching expert. Based on the visual features extracted from an image, identify the most likely products.

EXTRACTED VISUAL FEATURES:
${JSON.stringify(features, null, 2)}

YOUR TASK:
Match these features against the BRAND KNOWLEDGE BASE below to identify the product.

CRITICAL MATCHING RULES:
1. You MUST use the BRAND KNOWLEDGE BASE as your PRIMARY source - it contains 2024-2025 product info
2. Your training data may be outdated - TRUST the knowledge base over your memory
3. Match features to the "ID Tips" in the knowledge base

SPECIFIC MATCHING GUIDANCE FOR GOLF EQUIPMENT (2024-2025):
- Grey/silver carbon crown + green accents → TaylorMade Qi35 (2025), NOT Qi10
- Seamless polymer crown (no visible seam) → Titleist GT series (2024), NOT TSR
- Black-on-black carbon + red sole accents → Cobra Darkspeed Max (2024)
- Black-on-black carbon + blue sole accents → Cobra Darkspeed X (2024)
- Black-on-black carbon + black sole accents → Cobra Darkspeed LS (2024)
- Black crown + teal/turquoise accents → Ping G440 (2025), NOT G430
- Thermoformed carbon crown + silver face → Callaway Elyte (2025), NOT Paradym
- Chrome irons + "i-Forged" or "ZXi" badge → Srixon ZXi (2025), NOT ZX MK II

${brandContext}

CONFIDENCE SCORING:
- 85-100: Features match EXACTLY with a specific model in the knowledge base
- 70-84: Strong match with knowledge base entry
- 50-69: Partial match, could be multiple models
- 30-49: Weak match, educated guess
- <30: Very uncertain

OUTPUT FORMAT:
{
  "knowledgeBaseMatches": [
    {
      "brand": "Brand from knowledge base",
      "model": "Specific model from knowledge base",
      "year": 2025,
      "matchedFeatures": ["List which features matched which ID Tips"],
      "confidence": 85
    }
  ],
  "guesses": [
    {
      "rank": 1,
      "name": "Full product name",
      "brand": "Brand",
      "model": "Model",
      "year": 2025,
      "confidence": 85,
      "confidenceLevel": "high",
      "matchingReasons": ["Why this matches"],
      "differentiators": ["What would confirm/deny"]
    }
  ],
  "uncertainty": {
    "isConfident": true,
    "reason": null,
    "whatWouldHelp": ["Additional info that would help"]
  }
}`;
}

// Legacy single-prompt for fallback
function buildSystemPrompt(brandContext: string): string {
  return `You are a product identification expert. You will receive a CROPPED image of a SINGLE item that the user has specifically selected.

═══════════════════════════════════════════════════════════════
STEP 1: DESCRIBE WHAT YOU SEE (DO THIS FIRST)
═══════════════════════════════════════════════════════════════

Before identifying ANY product, you MUST describe exactly what you see:

OBJECT TYPE:
- What TYPE of object is this? (e.g., "putter headcover", "driver head", "camera body", "watch")
- If you cannot determine the type, say "unidentified object"

COLORS (be specific):
- Primary color (dominant)
- Secondary colors (list all)
- Finish (matte, glossy, metallic, satin, textured, brushed)

MATERIALS:
- What materials are visible? (leather, nylon, metal, carbon fiber, plastic, fabric)

SHAPE:
- Overall shape/silhouette
- Any distinctive contours

VISIBLE TEXT/LOGOS:
- List ANY text you can read (even partially)
- Quote exactly what you see
- "No visible text" if none

BRAND INDICATORS (non-text):
- Design elements that suggest a brand (logo shapes, patterns)
- Signature colorways
- Distinctive patterns or features

CONDITION:
- New, used, worn, damaged, etc.

SIZE:
- Standard, oversized, compact, etc.

═══════════════════════════════════════════════════════════════
STEP 2: ATTEMPT IDENTIFICATION (ONLY AFTER STEP 1)
═══════════════════════════════════════════════════════════════

Based on your visual description, provide your TOP 3 GUESSES.

CONFIDENCE SCORING (BE CONSERVATIVE):
- 85-100: Clear brand text AND model name visible, OR unmistakable unique design
- 70-84:  Brand identifiable + strong visual match to known product
- 50-69:  Can narrow down to brand/product line but not exact model
- 30-49:  Educated guess based on general visual cues
- <30:    Very uncertain, speculative

CRITICAL RULES:
1. If no brand text is visible, confidence CANNOT exceed 75% unless design is truly unique
2. If the object could be generic/unbranded, include that as one of your 3 guesses
3. Always explain WHAT VISUAL EVIDENCE supports each guess
4. Always explain WHAT WOULD DIFFERENTIATE between your guesses
5. If multiple products look identical, say so honestly

IMPORTANT - USE THE BRAND KNOWLEDGE BASE BELOW:
- The BRAND KNOWLEDGE BASE section contains CURRENT 2024-2025 product information
- This information is MORE UP-TO-DATE than your training data
- ALWAYS cross-reference visual features against the "ID Tips" and "Recent Models" in the knowledge base
- For golf clubs: Grey carbon crown with green accents = TaylorMade Qi35 (2025), NOT Qi10
- For golf clubs: Seamless polymer crown with no seam = Titleist GT series (2024), NOT TSR
- For golf clubs: Black-on-black with colored sole accents = Cobra Darkspeed (2024), model by accent color
- For golf clubs: Teal accents on black = Ping G440 (2025), NOT G430
- Prioritize matches from the BRAND KNOWLEDGE BASE over your general knowledge for recent products

═══════════════════════════════════════════════════════════════
STEP 3: ACKNOWLEDGE UNCERTAINTY
═══════════════════════════════════════════════════════════════

Be honest about what you DON'T know:
- If brand is uncertain, say so
- If multiple products look similar, explain why
- If image quality limits identification, note that
- Suggest what additional information/angle would help

${brandContext}

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════

{
  "visualDescription": {
    "objectType": "mallet putter headcover",
    "primaryColor": "black",
    "secondaryColors": ["red", "silver"],
    "finish": "matte",
    "materials": ["synthetic leather", "magnetic closure"],
    "shape": "mallet/oversized rectangular",
    "visibleText": ["partially visible script, possibly 'Cameron'"],
    "brandIndicators": ["three-dot pattern on crown", "distinctive stitching"],
    "conditionNotes": "appears new, no visible wear",
    "size": "oversized mallet"
  },
  "guesses": [
    {
      "rank": 1,
      "name": "Scotty Cameron Phantom X Headcover",
      "brand": "Scotty Cameron",
      "model": "Phantom X",
      "year": 2023,
      "confidence": 72,
      "matchingReasons": [
        "Three-dot alignment pattern matches Scotty Cameron signature",
        "Black/red colorway consistent with Phantom X line",
        "Mallet shape and size matches Phantom X dimensions"
      ],
      "differentiators": [
        "Would need to see 'Scotty Cameron' text on closure to confirm",
        "Studio Select series has similar design but different stitching"
      ]
    },
    {
      "rank": 2,
      "name": "...",
      "...": "..."
    },
    {
      "rank": 3,
      "name": "...",
      "...": "..."
    }
  ],
  "uncertainty": {
    "isConfident": true,
    "reason": null,
    "whatWouldHelp": [
      "Photo of the closure/magnetic flap which usually has brand text",
      "View of the underside where model info is often printed"
    ]
  }
}`;
}

// ============================================================================
// User Prompt Builder
// ============================================================================

function buildUserPrompt(brandHint?: string, additionalContext?: string): string {
  let prompt = `Analyze this product image following the DESCRIBE FIRST, MATCH SECOND approach.

IMPORTANT: This is a CROPPED image of a SINGLE item that the user specifically selected. Focus only on this item.`;

  if (brandHint) {
    prompt += `

The user believes this might be from: ${brandHint}
Consider this hint but DO NOT assume it's correct. Verify against visual evidence.`;
  }

  if (additionalContext) {
    prompt += `

Additional context from user: ${additionalContext}`;
  }

  prompt += `

Provide your visual description and top 3 guesses with honest confidence scores.
Remember: Be conservative with confidence. Only high confidence if you can clearly read brand/model text or the design is unmistakably unique.`;

  return prompt;
}

// ============================================================================
// Response Processing
// ============================================================================

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' | 'uncertain' {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  if (confidence >= 40) return 'low';
  return 'uncertain';
}

function processResponse(parsed: any, startTime: number): IdentifySingleItemResult {
  // Process visual description
  const visualDescription: VisualDescription = {
    objectType: parsed.visualDescription?.objectType || 'unidentified object',
    primaryColor: parsed.visualDescription?.primaryColor || 'unknown',
    secondaryColors: parsed.visualDescription?.secondaryColors || [],
    finish: parsed.visualDescription?.finish || 'unknown',
    materials: parsed.visualDescription?.materials || [],
    shape: parsed.visualDescription?.shape || 'unknown',
    visibleText: parsed.visualDescription?.visibleText || [],
    brandIndicators: parsed.visualDescription?.brandIndicators || [],
    conditionNotes: parsed.visualDescription?.conditionNotes || 'unknown',
    size: parsed.visualDescription?.size || 'standard'
  };

  // Process guesses - ensure we have exactly 3
  const rawGuesses = parsed.guesses || [];
  const guesses: ProductGuess[] = rawGuesses
    .slice(0, 3)
    .map((g: any, idx: number) => ({
      rank: (idx + 1) as 1 | 2 | 3,
      name: g.name || 'Unknown Product',
      brand: g.brand || 'Unknown',
      model: g.model || undefined,
      year: g.year || undefined,
      confidence: Math.min(100, Math.max(0, g.confidence || 0)),
      confidenceLevel: getConfidenceLevel(g.confidence || 0),
      matchingReasons: g.matchingReasons || [],
      differentiators: g.differentiators || []
    }))
    .sort((a: ProductGuess, b: ProductGuess) => b.confidence - a.confidence);

  // Ensure we have 3 guesses (pad with uncertain if needed)
  while (guesses.length < 3) {
    guesses.push({
      rank: (guesses.length + 1) as 1 | 2 | 3,
      name: 'Could not identify',
      brand: 'Unknown',
      confidence: 0,
      confidenceLevel: 'uncertain',
      matchingReasons: [],
      differentiators: []
    });
  }

  // Re-rank after sorting
  guesses.forEach((g, i) => {
    g.rank = (i + 1) as 1 | 2 | 3;
  });

  // Determine if we're confident
  const topConfidence = guesses[0]?.confidence || 0;
  const isConfident = topConfidence >= 70;

  const uncertainty: UncertaintyInfo = {
    isConfident,
    reason: isConfident ? null : (parsed.uncertainty?.reason || 'Low confidence in identification'),
    whatWouldHelp: parsed.uncertainty?.whatWouldHelp || []
  };

  return {
    visualDescription,
    guesses,
    uncertainty,
    processingTimeMs: Date.now() - startTime,
    modelUsed: 'gpt-4o'
  };
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<IdentifySingleItemResponse>> {
  const startTime = Date.now();

  try {
    const body: IdentifySingleItemRequest = await request.json();
    const { imageBase64, categoryHint, brandHint, additionalContext } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'imageBase64 is required' },
        { status: 400 }
      );
    }

    // Validate image
    const validation = validateAndCompressImage(imageBase64);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid image' },
        { status: 400 }
      );
    }

    // Generate brand context based on hints
    const categories = categoryHint
      ? [categoryHint]
      : ['golf', 'tech', 'fashion', 'outdoor'];

    const brandContext = generateBrandContext(categories, 'detailed');

    console.log(`[identify-single-item] Starting TWO-STAGE identification (category: ${categoryHint || 'auto'})`);

    // =========================================================================
    // STAGE 1: Extract visual features ONLY (no identification)
    // =========================================================================
    console.log('[identify-single-item] Stage 1: Extracting visual features...');

    const stage1Response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildFeatureExtractionPrompt() },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract visual features from this product image. DO NOT identify the brand or model.' },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,  // Very low for consistent feature extraction
      response_format: { type: 'json_object' }
    });

    const stage1Content = stage1Response.choices[0]?.message?.content;
    if (!stage1Content) {
      throw new Error('Stage 1 failed: No response');
    }

    let extractedFeatures;
    try {
      extractedFeatures = JSON.parse(stage1Content);
    } catch (e) {
      console.error('[identify-single-item] Stage 1 parse error:', stage1Content);
      throw new Error('Stage 1 failed: Invalid JSON');
    }

    console.log('[identify-single-item] Stage 1 complete. Features:', JSON.stringify(extractedFeatures).substring(0, 200));

    // =========================================================================
    // STAGE 2: Match features against brand knowledge (text-only, no vision)
    // =========================================================================
    console.log('[identify-single-item] Stage 2: Matching against brand knowledge...');

    // Add any brand hint to the features
    if (brandHint) {
      extractedFeatures.userBrandHint = brandHint;
    }
    if (additionalContext) {
      extractedFeatures.userContext = additionalContext;
    }

    const stage2Response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Using same model for matching
      messages: [
        {
          role: 'system',
          content: buildMatchingPrompt(extractedFeatures, brandContext)
        },
        {
          role: 'user',
          content: 'Based on the extracted features and the BRAND KNOWLEDGE BASE provided, identify the most likely products. Prioritize matches from the knowledge base - it has 2024-2025 product information that is more recent than your training data.'
        }
      ],
      max_tokens: 2000,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const stage2Content = stage2Response.choices[0]?.message?.content;
    if (!stage2Content) {
      throw new Error('Stage 2 failed: No response');
    }

    let matchResult;
    try {
      matchResult = JSON.parse(stage2Content);
    } catch (e) {
      console.error('[identify-single-item] Stage 2 parse error:', stage2Content);
      throw new Error('Stage 2 failed: Invalid JSON');
    }

    console.log('[identify-single-item] Stage 2 complete. Matches:', matchResult.knowledgeBaseMatches?.length || 0);

    // =========================================================================
    // Combine results
    // =========================================================================
    const combinedParsed = {
      visualDescription: {
        objectType: extractedFeatures.objectType || 'unknown',
        primaryColor: extractedFeatures.primaryColor || 'unknown',
        secondaryColors: extractedFeatures.secondaryColors || [],
        finish: extractedFeatures.finish || 'unknown',
        materials: extractedFeatures.materials || [],
        shape: extractedFeatures.shape || 'unknown',
        visibleText: extractedFeatures.visibleText || [],
        brandIndicators: [
          ...(extractedFeatures.visibleLogos || []),
          ...(extractedFeatures.distinctiveFeatures || [])
        ],
        conditionNotes: extractedFeatures.estimatedAge || 'unknown',
        size: extractedFeatures.shape || 'standard'
      },
      guesses: matchResult.guesses || [],
      uncertainty: matchResult.uncertainty || { isConfident: false, reason: 'Unknown', whatWouldHelp: [] }
    };

    const result = processResponse(combinedParsed, startTime);

    console.log(`[identify-single-item] TWO-STAGE complete in ${result.processingTimeMs}ms. Top guess: "${result.guesses[0].name}" (${result.guesses[0].confidence}% confidence)`);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('[identify-single-item] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to identify item' },
      { status: 500 }
    );
  }
}
