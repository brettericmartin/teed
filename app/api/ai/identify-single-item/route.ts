import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { openai } from '@/lib/openaiClient';
import { validateAndCompressImage } from '@/lib/ai';
import { generateBrandContext, getBrandKnowledge } from '@/lib/brandKnowledge';
import type {
  VisualDescription,
  ProductGuess,
  UncertaintyInfo,
  NoveltyInfo,
  SingleItemIdentificationResult,
  ExtractedText,
  ConfidenceInterval
} from '@/lib/apis/types';

// Supabase client for correction lookups
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Enhanced Tap-to-Identify: Single Item Identification
 *
 * THREE-STAGE PIPELINE with improvements:
 * 1. Confidence Recalibration - feature confidence scores, weighted matching
 * 2. OCR Integration - extract and use visible text for boosting
 * 3. OOD Detection - novelty scoring for unknown products
 */

// ============================================================================
// Types (local for this route)
// ============================================================================

interface IdentifySingleItemRequest {
  imageBase64: string;
  categoryHint?: string;
  brandHint?: string;
  additionalContext?: string;
}

interface IdentifySingleItemResponse {
  success: boolean;
  result?: SingleItemIdentificationResult;
  error?: string;
}

interface Stage1Features {
  objectType: string;
  objectTypeConfidence: number;
  itemTypeReasoning?: string;
  primaryColor: string;
  primaryColorConfidence: number;
  secondaryColors: string[];
  finish: string;
  finishConfidence: number;
  materials: string[];
  materialsConfidence: number;
  shape: string;
  shapeConfidence: number;
  visibleLogos: string[];
  colorAccents: string[];
  distinctiveFeatures: string[];
  crownPattern?: string;
  soleFeatures?: string;
  estimatedAge: string;
  designEra?: 'modern' | 'transitional' | 'classic';
  designEraConfidence?: number;
  modernitySignals?: string[];
}

interface Stage15OCR {
  ocrTexts: ExtractedText[];
  hasReadableText: boolean;
  brandTextFound: string | null;
  modelTextFound: string | null;
}

interface Stage2Match {
  guesses: any[];
  uncertainty: any;
  knowledgeBaseMatches: any[];
  ocrBoostApplied: boolean;
}

interface RelevantCorrection {
  originalName: string;
  correctedName: string;
  originalBrand: string;
  correctedBrand: string;
  changeSummary: string;
  learningNotes: string | null;
  objectType: string;
  ocrModelText: string | null;
  timesApplied: number;
}

// ============================================================================
// STAGE 1: Feature Extraction with Confidence Scores
// ============================================================================

function buildStage1Prompt(): string {
  return `You are a visual feature extraction expert. Your ONLY job is to describe what you see in the image WITH CONFIDENCE SCORES.

DO NOT attempt to identify the product brand or model. ONLY describe visual features.

For EACH feature, provide a confidence score (0-100) indicating how certain you are about that observation:
- 90-100: Absolutely certain, clearly visible
- 70-89: Fairly confident, good visibility
- 50-69: Somewhat confident, partially visible or ambiguous
- 30-49: Uncertain, hard to see clearly
- 0-29: Very uncertain, guessing

OUTPUT FORMAT (JSON):
{
  "objectType": "SPECIFIC item type - be precise: 'driver' vs 'fairway wood' vs 'hybrid', 'over-ear headphones' vs 'earbuds', 'backpack' vs 'sling bag', 'mug' vs 'tumbler' vs 'water bottle', 'mirrorless camera' vs 'DSLR' vs 'point-and-shoot', etc.",
  "objectTypeConfidence": 85,
  "itemTypeReasoning": "Why this specific type: size, shape, distinguishing features",
  "primaryColor": "The dominant color",
  "primaryColorConfidence": 90,
  "secondaryColors": ["List of accent/secondary colors"],
  "finish": "matte/glossy/metallic/satin/brushed/carbon fiber weave",
  "finishConfidence": 75,
  "materials": ["Visible materials: carbon, titanium, steel, leather, etc."],
  "materialsConfidence": 60,
  "shape": "Shape description (oversized, compact, mallet, blade, etc.)",
  "shapeConfidence": 80,
  "visibleLogos": ["Describe any logos/symbols - shapes and colors, NOT brand names"],
  "colorAccents": ["Where are accent colors located? (sole, crown, heel, etc.)"],
  "distinctiveFeatures": ["Any unique design elements, patterns, textures"],
  "crownPattern": "For clubs: what does the crown look like? (solid, carbon weave, seams visible, etc.)",
  "soleFeatures": "For clubs: weights, patterns on sole (describe, don't identify)",
  "estimatedAge": "new/recent/older based on condition and wear",
  "designEra": "Based on design language: 'modern' (2020+: current design trends), 'transitional' (2015-2019), 'classic' (pre-2015: older design language)",
  "designEraConfidence": 75,
  "modernitySignals": ["List specific visual cues that indicate age/era: materials, design elements, technology indicators"]
}

CRITICAL RULES:
1. Do NOT identify brand or model names
2. Do NOT guess what product this is
3. ONLY describe physical visual features you can observe
4. Be HONEST with confidence scores - low confidence is okay`;
}

// ============================================================================
// STAGE 1.5: OCR Text Extraction
// ============================================================================

function buildStage15Prompt(): string {
  return `You are an OCR text extraction specialist for GOLF EQUIPMENT. Your job is to extract ALL readable text from this product image.

CRITICAL - GOLF FONT AWARENESS:
Golf equipment uses STYLIZED fonts that are easy to misread:
- "Qi10" and "Qi35" use a unique font where "Q" looks unusual and numbers are stylized
- "R11" vs "Qi1" - the "R" and "Qi" can look similar
- "STEALTH" has angular letters
- Model numbers often have subscripts or unique styling
- Carbon fiber texture can obscure text

COMMON MISREADS TO AVOID:
- "Qi10" misread as "R11S" or "Q110"
- "Qi35" misread as "Q135" or "Qi85"
- "GT" misread as "6T" or "CT"
- "TSR" misread as "T5R"

For EACH piece of text you can read, provide:
- The exact text (quote precisely what you see)
- Your confidence in the reading (0-100) - BE CONSERVATIVE, lower confidence for stylized fonts
- Where on the product the text appears
- What type of text it likely is

OUTPUT FORMAT (JSON):
{
  "ocrTexts": [
    {
      "text": "EXACT TEXT HERE",
      "confidence": 92,
      "location": "crown/sole/face/label/tag/side/back/etc.",
      "type": "brand/model/serial/size/other"
    }
  ],
  "hasReadableText": true,
  "brandTextFound": "Brand name if clearly visible, null if not",
  "modelTextFound": "Model name/number if clearly visible, null if not"
}

CRITICAL RULES:
1. Quote text EXACTLY as it appears (preserve case, spacing, special characters)
2. Only include text you can actually read - don't guess
3. Confidence should reflect how clearly you can read the text
4. If text is partially obscured, include what you can read with lower confidence
5. If no readable text, return empty array with hasReadableText: false`;
}

// ============================================================================
// STAGE 2: Weighted Matching with OCR Integration
// ============================================================================

function buildStage2Prompt(
  features: Stage1Features,
  ocrData: Stage15OCR,
  brandContext: string,
  corrections: RelevantCorrection[] = []
): string {
  // Calculate feature weights based on confidence
  const featureWeights = {
    objectType: features.objectTypeConfidence / 100,
    primaryColor: features.primaryColorConfidence / 100,
    finish: features.finishConfidence / 100,
    materials: features.materialsConfidence / 100,
    shape: features.shapeConfidence / 100
  };

  return `You are a product matching expert. Match the extracted visual features against the BRAND KNOWLEDGE BASE.

═══════════════════════════════════════════════════════════════
EXTRACTED VISUAL FEATURES (with confidence weights)
═══════════════════════════════════════════════════════════════
${JSON.stringify(features, null, 2)}

FEATURE WEIGHTS (use these to weight your matching):
- Object Type: ${(featureWeights.objectType * 100).toFixed(0)}% confident
- Primary Color: ${(featureWeights.primaryColor * 100).toFixed(0)}% confident
- Finish: ${(featureWeights.finish * 100).toFixed(0)}% confident
- Materials: ${(featureWeights.materials * 100).toFixed(0)}% confident
- Shape: ${(featureWeights.shape * 100).toFixed(0)}% confident

** DESIGN ERA (for OCR validation) **
- Era: ${features.designEra || 'unknown'} (${features.designEraConfidence || 0}% confident)
- Modernity signals: ${features.modernitySignals?.join(', ') || 'none detected'}
${features.designEra === 'modern' ? '→ This is a MODERN (2020+) product - ignore OCR suggesting older models' : ''}
${features.designEra === 'classic' ? '→ This is a CLASSIC/VINTAGE product - ignore OCR suggesting recent models' : ''}

** ITEM TYPE (MUST include in product name when relevant) **
- Detected type: ${features.objectType} (${features.objectTypeConfidence}% confident)
- Reasoning: ${features.itemTypeReasoning || 'not provided'}
→ Include item type in product name when it clarifies the specific variant (e.g., "Brand Model ${features.objectType}")

═══════════════════════════════════════════════════════════════
OCR TEXT FOUND
═══════════════════════════════════════════════════════════════
${JSON.stringify(ocrData, null, 2)}

${ocrData.brandTextFound ? `
** IMPORTANT: Brand text "${ocrData.brandTextFound}" was detected! **
This should STRONGLY influence your identification. Add +20-30% confidence boost for products matching this brand.
` : ''}

${ocrData.modelTextFound ? `
** IMPORTANT: Model text "${ocrData.modelTextFound}" was detected! **
This should STRONGLY influence your identification. Add +25-35% confidence boost for products matching this model.
` : ''}

═══════════════════════════════════════════════════════════════
BRAND KNOWLEDGE BASE (2024-2025 products)
═══════════════════════════════════════════════════════════════
${brandContext}

═══════════════════════════════════════════════════════════════
MATCHING RULES - CRITICAL: VISUAL FEATURES TRUMP OCR
═══════════════════════════════════════════════════════════════

** CRITICAL CROSS-VALIDATION RULE **
OCR text can be WRONG due to stylized fonts. ALWAYS validate OCR against visual features:
- If OCR says "R11S" but visual shows carbon crown + modern design = OCR is WRONG (R11S is white crown from 2012)
- If OCR says old model but visual shows modern features = OCR misread stylized font
- NEVER boost confidence for OCR that contradicts visual features - PENALIZE instead

1. TEMPORAL VALIDATION (check product era):
   - If visual shows: carbon fiber crown, modern oversized shape, speed pockets = 2020-2025 era driver
   - If visual shows: white/silver crown, smaller head, adjustable hosel only = 2010-2015 era driver
   - OCR claiming old model (R11, R1, etc.) for modern-looking club = OCR ERROR, ignore OCR
   - OCR claiming new model (Qi10, Qi35, GT, etc.) for old-looking club = OCR ERROR, ignore OCR

2. CONFIDENCE CALCULATION:
   - Start with base confidence from VISUAL feature matches (0-70%)
   - Only ADD OCR bonus if OCR AGREES with visual features:
     * Brand text match + visual matches brand's design language: +15-25%
     * Model text match + visual matches model's known features: +20-30%
   - PENALIZE (-20-30%) if OCR contradicts visual features
   - Maximum confidence: 95% (never higher)

3. CONFIDENCE LEVELS:
   - 85-95: Very high - Visual features clearly match AND OCR confirms (if present)
   - 70-84: High - Strong visual match, OCR agrees or absent
   - 50-69: Medium - Good visual match but some ambiguity
   - 30-49: Low - Partial match OR OCR conflicts with visuals
   - <30: Uncertain - Weak match or contradictory signals

4. OCR INTEGRATION (ONLY after visual validation):
   - First: Does OCR model/brand EXIST in our knowledge base for the detected ERA?
   - Second: Does the OCR model's known design match the visual features?
   - If YES to both: Apply boost
   - If NO to either: IGNORE OCR or apply penalty

5. HANDLE UNCERTAINTY HONESTLY:
   - If OCR and visuals conflict, trust VISUALS and flag OCR as potentially misread
   - Explain the conflict in differentiators
   - Suggest what the OCR might have misread (e.g., "OCR may have misread 'Qi10' as 'R11S'")

6. ITEM TYPE IS CRITICAL - ALWAYS INCLUDE IN NAME:
   - The objectType tells you the specific item type (driver vs fairway wood, earbuds vs headphones, etc.)
   - MUST include item type in the product name when it clarifies:
     * Golf: "TaylorMade Qi10 Driver" vs "TaylorMade Qi10 Fairway Wood" vs "TaylorMade Qi10 Hybrid"
     * Audio: "Sony WH-1000XM5 Headphones" vs "Sony WF-1000XM5 Earbuds"
     * Bags: "Peak Design Everyday Backpack" vs "Peak Design Everyday Sling"
     * Drinkware: "Yeti Rambler Tumbler" vs "Yeti Rambler Mug" vs "Yeti Rambler Bottle"
   - Many product lines have MULTIPLE variants - the item type distinguishes them
   - OCR text alone does NOT tell you the item type - visual features do
${formatCorrectionsForPrompt(corrections)}
** ALWAYS PROVIDE TOP 3 GUESSES **
Even if you're very confident, provide 3 different product guesses ranked by confidence.
This helps users when products look similar (e.g., Qi10 Driver vs Qi10 Max Driver vs Qi10 LS Driver).

OUTPUT FORMAT (JSON):
{
  "knowledgeBaseMatches": [
    {
      "brand": "Brand name",
      "model": "Model name",
      "itemType": "driver/fairway wood/headphones/backpack/etc.",
      "year": 2025,
      "matchedFeatures": ["Which features matched which ID Tips"],
      "featureMatchScore": 65,
      "ocrBonus": 25,
      "finalScore": 90
    }
  ],
  "guesses": [
    {
      "rank": 1,
      "name": "TaylorMade Qi10 Driver",
      "brand": "TaylorMade",
      "model": "Qi10",
      "year": 2024,
      "confidence": 85,
      "confidenceInterval": { "point": 85, "lower": 78, "upper": 90 },
      "confidenceLevel": "high",
      "matchingReasons": ["Carbon crown matches Qi10 design", "Blue accent color visible", "460cc head size for driver"],
      "differentiators": ["Check if head is 460cc (Driver) vs 300cc (Fairway)", "Look for 'MAX' or 'LS' text on sole"],
      "ocrMatch": { "matched": true, "matchedText": "Qi10", "boostApplied": 20 }
    },
    {
      "rank": 2,
      "name": "TaylorMade Qi10 Max Driver",
      "brand": "TaylorMade",
      "model": "Qi10 Max",
      "year": 2024,
      "confidence": 70,
      "confidenceInterval": { "point": 70, "lower": 60, "upper": 78 },
      "confidenceLevel": "medium",
      "matchingReasons": ["Same Qi10 family design language", "Could be Max variant with larger profile"],
      "differentiators": ["Max has larger footprint and more draw bias", "Check sole for 'MAX' marking"],
      "ocrMatch": { "matched": false, "matchedText": null, "boostApplied": 0 }
    },
    {
      "rank": 3,
      "name": "TaylorMade Qi10 LS Driver",
      "brand": "TaylorMade",
      "model": "Qi10 LS",
      "year": 2024,
      "confidence": 55,
      "confidenceInterval": { "point": 55, "lower": 45, "upper": 65 },
      "confidenceLevel": "medium",
      "matchingReasons": ["Qi10 family styling", "Could be low-spin variant"],
      "differentiators": ["LS has forward CG position", "Check sole for 'LS' marking", "Typically has smaller profile than standard"],
      "ocrMatch": { "matched": false, "matchedText": null, "boostApplied": 0 }
    }
  ],
  "uncertainty": {
    "isConfident": true,
    "reason": null,
    "whatWouldHelp": ["Clearer view of sole markings", "Side profile to assess head size"]
  },
  "ocrBoostApplied": true
}`;
}

// ============================================================================
// OOD Detection: Novelty Scoring
// ============================================================================

function calculateNoveltyScore(
  features: Stage1Features,
  ocrData: Stage15OCR,
  matchResult: Stage2Match,
  categoryHint?: string
): NoveltyInfo {
  // Get brand knowledge for coverage calculation
  const categories = categoryHint ? [categoryHint] : ['golf', 'tech', 'fashion', 'outdoor'];
  const knowledgeBase = getBrandKnowledge(categories);

  // Calculate feature novelty based on how well features match knowledge base
  let knowledgeBaseCoverage = 0;
  let noveltyReasons: string[] = [];

  // Check if we have knowledge base matches
  const hasKBMatches = matchResult.knowledgeBaseMatches && matchResult.knowledgeBaseMatches.length > 0;
  const topMatchScore = matchResult.knowledgeBaseMatches?.[0]?.featureMatchScore || 0;

  // Coverage based on match quality
  if (hasKBMatches && topMatchScore >= 70) {
    knowledgeBaseCoverage = 80 + (topMatchScore - 70);
  } else if (hasKBMatches && topMatchScore >= 50) {
    knowledgeBaseCoverage = 50 + topMatchScore * 0.3;
  } else if (hasKBMatches) {
    knowledgeBaseCoverage = 20 + topMatchScore * 0.3;
  } else {
    knowledgeBaseCoverage = 10;
    noveltyReasons.push('No strong matches in knowledge base');
  }

  // Reduce coverage if low feature confidence
  const avgFeatureConfidence = (
    features.objectTypeConfidence +
    features.primaryColorConfidence +
    features.finishConfidence +
    features.materialsConfidence +
    features.shapeConfidence
  ) / 5;

  if (avgFeatureConfidence < 50) {
    knowledgeBaseCoverage *= 0.7;
    noveltyReasons.push('Low confidence in extracted features');
  }

  // Boost coverage if OCR found matching text
  if (ocrData.brandTextFound && matchResult.ocrBoostApplied) {
    knowledgeBaseCoverage = Math.min(95, knowledgeBaseCoverage + 15);
  }

  // Calculate novelty score (inverse of coverage)
  const noveltyScore = Math.max(0, Math.min(100, 100 - knowledgeBaseCoverage));

  // Determine if product is novel
  const isNovel = noveltyScore >= 60;

  // Build reason string
  let reason: string | null = null;
  if (isNovel) {
    if (noveltyReasons.length > 0) {
      reason = noveltyReasons.join('; ');
    } else {
      reason = 'Product features do not strongly match known products';
    }
  }

  // Suggested action
  let suggestedAction = '';
  if (noveltyScore >= 80) {
    suggestedAction = 'This product is unfamiliar. Please help us learn by providing the correct identification.';
  } else if (noveltyScore >= 60) {
    suggestedAction = 'We have low confidence. Try a different angle or tell us more about this product.';
  } else if (noveltyScore >= 40) {
    suggestedAction = 'Please verify our identification is correct.';
  } else {
    suggestedAction = 'Identification looks good. Confirm if this matches your product.';
  }

  return {
    isNovel,
    noveltyScore: Math.round(noveltyScore),
    knowledgeBaseCoverage: Math.round(knowledgeBaseCoverage),
    reason,
    suggestedAction
  };
}

// ============================================================================
// Confidence Calibration
// ============================================================================

function calibrateConfidence(
  rawConfidence: number,
  features: Stage1Features,
  ocrData: Stage15OCR,
  novelty: NoveltyInfo
): { calibrated: number; interval: ConfidenceInterval } {
  let calibrated = rawConfidence;

  // Apply temperature scaling (conservative)
  // This reduces overconfident predictions
  const temperature = 1.15;
  calibrated = calibrated / temperature;

  // Penalize if high novelty (OOD)
  if (novelty.isNovel) {
    calibrated = Math.min(calibrated, 50);
  } else if (novelty.noveltyScore >= 40) {
    calibrated = Math.min(calibrated, 70);
  }

  // Boost if OCR text matches
  if (ocrData.brandTextFound || ocrData.modelTextFound) {
    // Already factored into raw confidence, but ensure minimum
    calibrated = Math.max(calibrated, 40);
  }

  // Cap at 98% (never 100% certain)
  calibrated = Math.min(98, Math.max(0, calibrated));

  // Calculate confidence interval based on feature confidence
  const avgFeatureConfidence = (
    features.objectTypeConfidence +
    features.primaryColorConfidence +
    features.finishConfidence +
    features.materialsConfidence +
    features.shapeConfidence
  ) / 5;

  // Wider interval if features are uncertain
  const spread = avgFeatureConfidence >= 70 ? 10 : avgFeatureConfidence >= 50 ? 15 : 20;

  const interval: ConfidenceInterval = {
    point: Math.round(calibrated),
    lower: Math.round(Math.max(0, calibrated - spread)),
    upper: Math.round(Math.min(98, calibrated + spread * 0.7))
  };

  return { calibrated: Math.round(calibrated), interval };
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

function processResults(
  features: Stage1Features,
  ocrData: Stage15OCR,
  matchResult: Stage2Match,
  novelty: NoveltyInfo,
  startTime: number
): SingleItemIdentificationResult {
  // Build visual description with confidence scores
  const visualDescription: VisualDescription = {
    objectType: features.objectType || 'unidentified object',
    objectTypeConfidence: features.objectTypeConfidence || 0,
    primaryColor: features.primaryColor || 'unknown',
    primaryColorConfidence: features.primaryColorConfidence || 0,
    secondaryColors: features.secondaryColors || [],
    finish: features.finish || 'unknown',
    finishConfidence: features.finishConfidence || 0,
    materials: features.materials || [],
    materialsConfidence: features.materialsConfidence || 0,
    shape: features.shape || 'unknown',
    shapeConfidence: features.shapeConfidence || 0,
    visibleText: ocrData.ocrTexts.map(t => t.text),
    brandIndicators: [
      ...(features.visibleLogos || []),
      ...(features.distinctiveFeatures || [])
    ],
    conditionNotes: features.estimatedAge || 'unknown',
    size: features.shape || 'standard',
    ocrTexts: ocrData.ocrTexts
  };

  // Process guesses with calibration
  const rawGuesses = matchResult.guesses || [];
  const guesses: ProductGuess[] = rawGuesses
    .slice(0, 3)
    .map((g: any, idx: number) => {
      const { calibrated, interval } = calibrateConfidence(
        g.confidence || 0,
        features,
        ocrData,
        novelty
      );

      return {
        rank: (idx + 1) as 1 | 2 | 3,
        name: g.name || 'Unknown Product',
        brand: g.brand || 'Unknown',
        model: g.model || undefined,
        year: g.year || undefined,
        confidence: calibrated,
        confidenceInterval: interval,
        confidenceLevel: getConfidenceLevel(calibrated),
        matchingReasons: g.matchingReasons || [],
        differentiators: g.differentiators || [],
        ocrMatch: g.ocrMatch || undefined
      };
    })
    .sort((a: ProductGuess, b: ProductGuess) => b.confidence - a.confidence);

  // Ensure we have 3 guesses
  while (guesses.length < 3) {
    guesses.push({
      rank: (guesses.length + 1) as 1 | 2 | 3,
      name: 'Could not identify',
      brand: 'Unknown',
      confidence: 0,
      confidenceInterval: { point: 0, lower: 0, upper: 10 },
      confidenceLevel: 'uncertain',
      matchingReasons: [],
      differentiators: []
    });
  }

  // Re-rank after sorting
  guesses.forEach((g, i) => {
    g.rank = (i + 1) as 1 | 2 | 3;
  });

  // Build uncertainty info
  const topConfidence = guesses[0]?.confidence || 0;
  const isConfident = topConfidence >= 70 && !novelty.isNovel;

  const uncertainty: UncertaintyInfo = {
    isConfident,
    reason: isConfident ? null : (
      novelty.isNovel
        ? novelty.reason
        : (matchResult.uncertainty?.reason || 'Low confidence in identification')
    ),
    whatWouldHelp: matchResult.uncertainty?.whatWouldHelp || []
  };

  return {
    visualDescription,
    guesses,
    uncertainty,
    novelty,
    processingTimeMs: Date.now() - startTime,
    modelUsed: 'gpt-4o'
  };
}

// ============================================================================
// CORRECTION LOOKUP: Learn from past mistakes
// ============================================================================

async function fetchRelevantCorrections(
  features: Stage1Features,
  ocrData: Stage15OCR,
  category?: string
): Promise<RelevantCorrection[]> {
  try {
    // Combine results from multiple queries
    const seenIds = new Set<string>();
    const corrections: RelevantCorrection[] = [];

    const selectFields = 'original_name, corrected_name, original_brand, corrected_brand, change_summary, learning_notes, object_type, ocr_model_text, times_applied';

    // Query 1: Same object type
    if (features.objectType) {
      const { data, error } = await supabase
        .from('ai_visual_corrections')
        .select(selectFields)
        .eq('object_type', features.objectType.toLowerCase())
        .eq('category', category || 'golf')
        .order('times_applied', { ascending: false })
        .limit(5);

      if (!error && data) {
        for (const row of data) {
          const id = `${row.original_name}→${row.corrected_name}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            corrections.push({
              originalName: row.original_name,
              correctedName: row.corrected_name,
              originalBrand: row.original_brand,
              correctedBrand: row.corrected_brand,
              changeSummary: row.change_summary,
              learningNotes: row.learning_notes,
              objectType: row.object_type,
              ocrModelText: row.ocr_model_text,
              timesApplied: row.times_applied || 0
            });
          }
        }
      }
    }

    // Query 2: Similar OCR model text
    if (ocrData.modelTextFound) {
      const { data, error } = await supabase
        .from('ai_visual_corrections')
        .select(selectFields)
        .ilike('ocr_model_text', `%${ocrData.modelTextFound}%`)
        .order('times_applied', { ascending: false })
        .limit(5);

      if (!error && data) {
        for (const row of data) {
          const id = `${row.original_name}→${row.corrected_name}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            corrections.push({
              originalName: row.original_name,
              correctedName: row.corrected_name,
              originalBrand: row.original_brand,
              correctedBrand: row.corrected_brand,
              changeSummary: row.change_summary,
              learningNotes: row.learning_notes,
              objectType: row.object_type,
              ocrModelText: row.ocr_model_text,
              timesApplied: row.times_applied || 0
            });
          }
        }
      }
    }

    // Query 3: Similar brand (from OCR or visual indicators)
    const brandToSearch = ocrData.brandTextFound || features.visibleLogos?.[0];
    if (brandToSearch) {
      const { data, error } = await supabase
        .from('ai_visual_corrections')
        .select(selectFields)
        .ilike('brand_normalized', `%${brandToSearch.toLowerCase()}%`)
        .order('times_applied', { ascending: false })
        .limit(5);

      if (!error && data) {
        for (const row of data) {
          const id = `${row.original_name}→${row.corrected_name}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            corrections.push({
              originalName: row.original_name,
              correctedName: row.corrected_name,
              originalBrand: row.original_brand,
              correctedBrand: row.corrected_brand,
              changeSummary: row.change_summary,
              learningNotes: row.learning_notes,
              objectType: row.object_type,
              ocrModelText: row.ocr_model_text,
              timesApplied: row.times_applied || 0
            });
          }
        }
      }
    }

    // Sort by times applied (most useful first) and limit
    return corrections
      .sort((a, b) => b.timesApplied - a.timesApplied)
      .slice(0, 5);

  } catch (error) {
    console.warn('[identify-single-item] Failed to fetch corrections:', error);
    return []; // Non-critical, continue without corrections
  }
}

function formatCorrectionsForPrompt(corrections: RelevantCorrection[]): string {
  if (corrections.length === 0) {
    return '';
  }

  const correctionLines = corrections.map((c, i) => {
    let line = `${i + 1}. LEARNED: "${c.originalName}" → "${c.correctedName}"`;
    if (c.changeSummary) {
      line += `\n   Change: ${c.changeSummary}`;
    }
    if (c.learningNotes) {
      line += `\n   Visual cue: ${c.learningNotes}`;
    }
    if (c.timesApplied > 0) {
      line += `\n   (Applied ${c.timesApplied} times)`;
    }
    return line;
  });

  return `
═══════════════════════════════════════════════════════════════
LEARNED CORRECTIONS (from past user feedback)
═══════════════════════════════════════════════════════════════
Users have previously corrected these identifications. Use these to improve accuracy:

${correctionLines.join('\n\n')}

** IMPORTANT: Apply these learnings! **
- If current features match a correction scenario, prefer the CORRECTED product
- Pay attention to the visual cues noted above
- These corrections indicate common confusion points
`;
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

    // Generate brand context
    const categories = categoryHint
      ? [categoryHint]
      : ['golf', 'tech', 'fashion', 'outdoor'];
    const brandContext = generateBrandContext(categories, 'detailed');

    console.log(`[identify-single-item] Starting THREE-STAGE pipeline (category: ${categoryHint || 'auto'})`);

    // =========================================================================
    // STAGE 1: Extract visual features WITH confidence scores
    // =========================================================================
    console.log('[identify-single-item] Stage 1: Extracting features with confidence...');

    const stage1Response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildStage1Prompt() },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract visual features from this product image with confidence scores. DO NOT identify the brand or model.' },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const stage1Content = stage1Response.choices[0]?.message?.content;
    if (!stage1Content) throw new Error('Stage 1 failed: No response');

    let features: Stage1Features;
    try {
      features = JSON.parse(stage1Content);
    } catch (e) {
      console.error('[identify-single-item] Stage 1 parse error:', stage1Content);
      throw new Error('Stage 1 failed: Invalid JSON');
    }

    console.log(`[identify-single-item] Stage 1 complete. Object: ${features.objectType} (${features.objectTypeConfidence}% conf)`);

    // =========================================================================
    // STAGE 1.5: OCR Text Extraction
    // =========================================================================
    console.log('[identify-single-item] Stage 1.5: Extracting OCR text...');

    const stage15Response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildStage15Prompt() },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract ALL readable text from this product image. Quote text exactly as it appears.' },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const stage15Content = stage15Response.choices[0]?.message?.content;
    let ocrData: Stage15OCR = {
      ocrTexts: [],
      hasReadableText: false,
      brandTextFound: null,
      modelTextFound: null
    };

    if (stage15Content) {
      try {
        ocrData = JSON.parse(stage15Content);
      } catch (e) {
        console.warn('[identify-single-item] Stage 1.5 parse warning:', e);
      }
    }

    console.log(`[identify-single-item] Stage 1.5 complete. Found ${ocrData.ocrTexts?.length || 0} text elements. Brand: ${ocrData.brandTextFound || 'none'}`);

    // =========================================================================
    // STAGE 1.75: Fetch relevant corrections from past user feedback
    // =========================================================================
    console.log('[identify-single-item] Fetching relevant past corrections...');
    const corrections = await fetchRelevantCorrections(features, ocrData, categoryHint);
    if (corrections.length > 0) {
      console.log(`[identify-single-item] Found ${corrections.length} relevant corrections`);
    }

    // =========================================================================
    // STAGE 2: Weighted matching with OCR integration + learned corrections
    // =========================================================================
    console.log('[identify-single-item] Stage 2: Matching with weighted confidence + OCR + corrections...');

    // Add hints to features
    const enhancedFeatures = {
      ...features,
      userBrandHint: brandHint,
      userContext: additionalContext
    };

    const stage2Response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: buildStage2Prompt(enhancedFeatures as Stage1Features, ocrData, brandContext, corrections)
        },
        {
          role: 'user',
          content: `Identify the product and provide your TOP 3 GUESSES ranked by confidence.

Use these methods:
1. Weighted feature matching (prioritize high-confidence features)
2. OCR text matching (brand/model text = big confidence boost)
3. Knowledge base cross-reference
4. Past corrections (apply learnings from previous user feedback)

IMPORTANT: Always provide 3 different guesses, even if confident. Include variants (e.g., Standard vs Max vs LS) when applicable.

${ocrData.brandTextFound ? `Brand "${ocrData.brandTextFound}" was detected - prioritize this brand!` : 'No brand text detected - rely on visual features.'}`
        }
      ],
      max_tokens: 2500,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const stage2Content = stage2Response.choices[0]?.message?.content;
    if (!stage2Content) throw new Error('Stage 2 failed: No response');

    let matchResult: Stage2Match;
    try {
      matchResult = JSON.parse(stage2Content);
    } catch (e) {
      console.error('[identify-single-item] Stage 2 parse error:', stage2Content);
      throw new Error('Stage 2 failed: Invalid JSON');
    }

    console.log(`[identify-single-item] Stage 2 complete. Top match: ${matchResult.guesses?.[0]?.name || 'unknown'}`);

    // =========================================================================
    // OOD Detection: Calculate novelty score
    // =========================================================================
    console.log('[identify-single-item] Calculating novelty score...');

    const novelty = calculateNoveltyScore(features, ocrData, matchResult, categoryHint);

    if (novelty.isNovel) {
      console.log(`[identify-single-item] WARNING: Novel product detected (score: ${novelty.noveltyScore})`);
    }

    // =========================================================================
    // Process and calibrate results
    // =========================================================================
    const result = processResults(features, ocrData, matchResult, novelty, startTime);

    console.log(`[identify-single-item] THREE-STAGE complete in ${result.processingTimeMs}ms`);
    console.log(`  Top guess: "${result.guesses[0].name}" (${result.guesses[0].confidence}% [${result.guesses[0].confidenceInterval?.lower}-${result.guesses[0].confidenceInterval?.upper}])`);
    console.log(`  OCR boost: ${ocrData.brandTextFound || ocrData.modelTextFound ? 'Yes' : 'No'}`);
    console.log(`  Novelty: ${novelty.noveltyScore}% (${novelty.isNovel ? 'NOVEL' : 'known'})`);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('[identify-single-item] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to identify item' },
      { status: 500 }
    );
  }
}
