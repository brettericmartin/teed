import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateBrandContext } from '@/lib/brandKnowledge';
import { smartSearch, loadLibrary, getProductsByBrand } from '@/lib/productLibrary';
import { learnProduct, searchLearnedProducts } from '@/lib/productLibrary/learner';
import type { Category, SearchResult } from '@/lib/productLibrary/schema';
import { trackApiUsage } from '@/lib/apiUsageTracker';
import {
  parseText,
  needsClarification,
  suggestClarificationQuestions,
  buildSearchQuery,
  type ParsedTextResult,
} from '@/lib/textParsing';
import { createClient } from '@supabase/supabase-js';

// Helper to get previous corrections for this input
async function getPreviousCorrection(inputValue: string): Promise<{
  brand: string | null;
  name: string | null;
  category: string | null;
} | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a simple hash of the input for lookup
    const inputNormalized = inputValue.toLowerCase().trim();

    // Look for corrections that match this input (using simple text matching)
    const { data, error } = await supabase
      .from('identification_corrections')
      .select('corrected_brand, corrected_name, corrected_category')
      .ilike('input_value', `%${inputNormalized.slice(0, 50)}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    console.log(`[enrich-item] Found previous correction for similar input`);
    return {
      brand: data[0].corrected_brand,
      name: data[0].corrected_name,
      category: data[0].corrected_category,
    };
  } catch (err) {
    console.error('[enrich-item] Error checking corrections:', err);
    return null;
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EnrichmentRequest = {
  userInput: string;
  bagContext?: string;
  existingAnswers?: Record<string, string>;
  forceAI?: boolean; // Skip library-only results and always use AI
  categoryHint?: Category; // Hint from the bag context
};

type ProductSuggestion = {
  custom_name: string;
  brand: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  funFactOptions?: string[];
  productUrl?: string;
  imageUrl?: string;
  source?: 'library' | 'ai' | 'web';
};

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type LearningInfo = {
  isLearning: boolean;
  productsBeingLearned: string[];
  message?: string;
};

type EnrichmentResponse = {
  suggestions: ProductSuggestion[];
  clarificationNeeded: boolean;
  questions: ClarificationQuestion[];
  searchTier?: string;
  learning?: LearningInfo;
  parsed?: ParsedTextResult; // NEW: Include parsed components for transparency
};

// =============================================================================
// Word Relevance Scoring - detect poor quality matches
// =============================================================================

function calculateWordRelevance(query: string, resultName: string, resultBrand?: string): number {
  // Normalize and tokenize
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const resultWords = `${resultBrand || ''} ${resultName}`.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  if (queryWords.length === 0) return 0;

  // Count how many query words appear in the result
  let matches = 0;
  for (const queryWord of queryWords) {
    // Check exact match or if result word contains query word
    if (resultWords.some(rw => rw === queryWord || rw.includes(queryWord) || queryWord.includes(rw))) {
      matches++;
    }
  }

  return matches / queryWords.length;
}

function hasGoodWordRelevance(query: string, results: SearchResult[]): boolean {
  if (results.length === 0) return false;

  // Check if at least one result has >= 75% word overlap (stricter threshold)
  for (const result of results) {
    const relevance = calculateWordRelevance(query, result.product.name, result.product.brand);
    if (relevance >= 0.75) {
      return true;
    }
  }

  console.log(`[enrich-item] Poor word relevance detected for "${query}" - all results have < 75% word overlap`);
  return false;
}

// =============================================================================
// Category & Brand Detection
// =============================================================================

// Map URL domains to brand names - for brand-owned stores
const DOMAIN_TO_BRAND: Record<string, string> = {
  // Golf
  'goodgoodgolf.com': 'Good Good Golf',
  'taylormadegolf.com': 'TaylorMade',
  'callawaygolf.com': 'Callaway',
  'titleist.com': 'Titleist',
  'ping.com': 'PING',
  'cobragolf.com': 'Cobra',
  'clevelandgolf.com': 'Cleveland',
  'srixon.com': 'Srixon',
  'mizunogolf.com': 'Mizuno',
  'bridgestonegolf.com': 'Bridgestone',
  'travisMathew.com': 'Travis Mathew',
  'gforegolf.com': 'G/FORE',
  'petermillar.com': 'Peter Millar',
  'greysonclothiers.com': 'Greyson',
  'malbongolf.com': 'Malbon Golf',
  'eastsidegolf.com': 'Eastside Golf',
  'badbirdie.com': 'Bad Birdie',
  // Makeup
  'charlottetilbury.com': 'Charlotte Tilbury',
  'maccosmetics.com': 'MAC',
  'fentybeauty.com': 'Fenty Beauty',
  'rarebeauty.com': 'Rare Beauty',
  'glossier.com': 'Glossier',
  'rhodeskin.com': 'Rhode',
  // Tech
  'apple.com': 'Apple',
  'samsung.com': 'Samsung',
  'sony.com': 'Sony',
  'bose.com': 'Bose',
  // Fashion
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
  'patagonia.com': 'Patagonia',
  'thenorthface.com': 'The North Face',
  'arcteryx.com': "Arc'teryx",
  'lululemon.com': 'Lululemon',
  'underarmour.com': 'Under Armour',
  // EDC
  'benchmade.com': 'Benchmade',
  'spyderco.com': 'Spyderco',
  'leatherman.com': 'Leatherman',
};

// Extract brand from URL domain
function extractBrandFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // Direct domain match
    if (DOMAIN_TO_BRAND[hostname]) {
      console.log(`[extractBrandFromUrl] Found brand "${DOMAIN_TO_BRAND[hostname]}" from domain "${hostname}"`);
      return DOMAIN_TO_BRAND[hostname];
    }

    // Check if domain contains known brand name (e.g., shop.goodgood.golf)
    for (const [domain, brand] of Object.entries(DOMAIN_TO_BRAND)) {
      if (hostname.includes(domain.replace('.com', '').replace('.', ''))) {
        console.log(`[extractBrandFromUrl] Found brand "${brand}" from partial domain match "${hostname}"`);
        return brand;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Extract brand from product name/description by scanning for known brand names
function extractBrandFromText(text: string): string | null {
  if (!text) return null;

  const textLower = text.toLowerCase();

  // Check for known brands in the text
  const matches: { brand: string; position: number }[] = [];

  for (const brand of Object.keys(KNOWN_BRANDS)) {
    const position = textLower.indexOf(brand);
    if (position !== -1) {
      matches.push({ brand, position });
    }
  }

  if (matches.length > 0) {
    // Pick the first matching brand (earliest in text - usually at the start)
    matches.sort((a, b) => a.position - b.position);
    const bestMatch = matches[0].brand;

    // Capitalize properly
    const capitalizedBrand = bestMatch.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    console.log(`[extractBrandFromText] Found brand "${capitalizedBrand}" in text`);
    return capitalizedBrand;
  }

  return null;
}

const KNOWN_BRANDS: Record<string, Category> = {
  // Golf - Equipment
  'taylormade': 'golf', 'callaway': 'golf', 'titleist': 'golf', 'ping': 'golf', 'cobra': 'golf',
  'mizuno': 'golf', 'srixon': 'golf', 'cleveland': 'golf', 'bridgestone': 'golf', 'wilson': 'golf',
  'vice golf': 'golf', 'kirkland': 'golf', 'bushnell': 'golf', 'garmin': 'golf', 'blue tees': 'golf',
  // Golf - Apparel
  'travis mathew': 'golf', 'g/fore': 'golf', 'peter millar': 'golf', 'greyson': 'golf',
  'good good': 'golf', 'good good golf': 'golf', 'ace high': 'golf', 'bad birdie': 'golf',
  'malbon': 'golf', 'eastside golf': 'golf', 'nocturnal': 'golf',
  // Makeup
  'charlotte tilbury': 'makeup', 'mac': 'makeup', 'fenty beauty': 'makeup', 'rare beauty': 'makeup',
  'nars': 'makeup', 'urban decay': 'makeup', 'too faced': 'makeup', 'tarte': 'makeup', 'benefit': 'makeup',
  'glossier': 'makeup', 'clinique': 'makeup', 'elf': 'makeup', 'maybelline': 'makeup', 'rhode': 'makeup',
  'summer fridays': 'makeup', 'drunk elephant': 'makeup', 'the ordinary': 'makeup', 'cerave': 'makeup',
  // Tech
  'apple': 'tech', 'samsung': 'tech', 'sony': 'tech', 'bose': 'tech', 'google': 'tech',
  'microsoft': 'tech', 'dell': 'tech', 'lenovo': 'tech', 'asus': 'tech', 'lg': 'tech',
  // Fashion
  'nike': 'fashion', 'adidas': 'fashion', 'patagonia': 'fashion', 'north face': 'fashion',
  'arc\'teryx': 'fashion', 'lululemon': 'fashion', 'under armour': 'fashion',
  // EDC
  'benchmade': 'edc', 'spyderco': 'edc', 'chris reeve': 'edc', 'leatherman': 'edc', 'victorinox': 'edc',
  // Photography
  'canon': 'photography', 'nikon': 'photography', 'fujifilm': 'photography', 'leica': 'photography',
};

function detectBrandAndCategory(query: string): { brand: string | null; category: Category | null } {
  const queryLower = query.toLowerCase();

  // Find ALL matching brands and their positions in the query
  const matchingBrands: { brand: string; category: Category; position: number }[] = [];

  for (const [brand, category] of Object.entries(KNOWN_BRANDS)) {
    const position = queryLower.indexOf(brand);
    if (position !== -1) {
      matchingBrands.push({ brand, category, position });
    }
  }

  // If we have multiple brand matches, prefer the one that appears LAST in the query
  // This is because users typically write "Product Line Brand" (e.g., "ace high polo good good")
  // where the actual brand (Good Good) comes after the product line name (Ace High)
  if (matchingBrands.length > 0) {
    // Sort by position (descending) and pick the last-appearing brand
    matchingBrands.sort((a, b) => b.position - a.position);
    const bestMatch = matchingBrands[0];
    console.log(`[detectBrandAndCategory] Found ${matchingBrands.length} brand(s): ${matchingBrands.map(m => m.brand).join(', ')}. Selected: "${bestMatch.brand}" (last in query)`);
    return { brand: bestMatch.brand, category: bestMatch.category };
  }

  // Category-only detection (subset of most common categories)
  const categoryPatterns: Partial<Record<Category, string[]>> = {
    golf: ['driver', 'iron', 'wedge', 'putter', 'fairway', 'hybrid', 'golf', 'shaft', 'ball', 'grip', 'bag'],
    beauty: ['lipstick', 'eyeshadow', 'foundation', 'mascara', 'blush', 'concealer', 'beauty', 'makeup'],
    skincare: ['serum', 'moisturizer', 'cleanser', 'toner', 'sunscreen', 'retinol'],
    tech: ['phone', 'laptop', 'tablet', 'airpods', 'headphones', 'earbuds', 'speaker', 'computer'],
    audio: ['headphones', 'earbuds', 'speaker', 'soundbar', 'amplifier', 'turntable'],
    fashion: ['shirt', 'pants', 'jacket', 'dress', 'suit', 'blazer'],
    footwear: ['shoes', 'sneakers', 'boots', 'sandals'],
    outdoor: ['tent', 'sleeping bag', 'backpack', 'camping', 'hiking', 'cooler'],
    photography: ['camera', 'lens', 'flash', 'tripod', 'drone'],
    gaming: ['console', 'controller', 'playstation', 'xbox', 'nintendo'],
    music: ['guitar', 'piano', 'drum', 'amp', 'instrument'],
    fitness: ['dumbbell', 'kettlebell', 'treadmill', 'workout', 'weights'],
    activewear: ['leggings', 'sports bra', 'jogger', 'athletic'],
    travel: ['luggage', 'suitcase', 'carry-on'],
    edc: ['knife', 'flashlight', 'wallet', 'pen', 'multitool'],
    watches: ['watch', 'chronograph', 'automatic', 'mechanical'],
    cycling: ['bike', 'bicycle', 'cycling', 'groupset'],
    tennis: ['racket', 'racquet', 'tennis'],
    coffee: ['coffee', 'espresso', 'grinder', 'pour over'],
    kitchen: ['cookware', 'pan', 'pot', 'knife', 'blender'],
    home: ['furniture', 'sofa', 'chair', 'table', 'desk'],
    baby: ['stroller', 'car seat', 'crib', 'bassinet'],
    pet: ['dog food', 'cat food', 'pet toy', 'leash'],
  };

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => queryLower.includes(p))) {
      return { brand: null, category: category as Category };
    }
  }

  return { brand: null, category: null };
}

// =============================================================================
// TIER 1: Product Library Search
// =============================================================================

async function searchProductLibrary(
  query: string,
  category: Category | null
): Promise<{ results: SearchResult[]; relatedProducts: SearchResult[] }> {
  console.log(`[enrich-item] TIER 1: Searching product library for "${query}"`);

  let results = smartSearch(query, {
    category: category || undefined,
    limit: 10,
  });

  // If no results but we have a category, try broader search
  let relatedProducts: SearchResult[] = [];

  if (results.length === 0 && category) {
    // Get related products from the same brand if detected
    const { brand } = detectBrandAndCategory(query);
    if (brand) {
      const library = loadLibrary(category);
      if (library) {
        const brandProducts = getProductsByBrand(library, brand);
        relatedProducts = brandProducts.slice(0, 5).map(p => ({
          product: p,
          confidence: 50,
          matchReasons: [`Related ${brand} product`],
        }));
        console.log(`[enrich-item] Found ${relatedProducts.length} related products from ${brand}`);
      }
    }
  }

  console.log(`[enrich-item] TIER 1 Results: ${results.length} exact matches, ${relatedProducts.length} related`);
  return { results, relatedProducts };
}

// =============================================================================
// TIER 2: AI with Web Search (for unknown/new products)
// =============================================================================

async function searchWithAI(
  userInput: string,
  bagContext: string | undefined,
  existingAnswers: Record<string, string>,
  category: Category | null,
  brandContext: string,
  detectedBrand: string | null, // The brand we detected from the user's query
  parsed: ParsedTextResult | null // Parsed text components
): Promise<EnrichmentResponse> {
  console.log(`[enrich-item] TIER 2: Using AI with web knowledge for "${userInput}"`);

  const contextPrompt = bagContext ? `Bag context: "${bagContext}"\n` : '';
  const answersPrompt = Object.keys(existingAnswers).length > 0
    ? `User has answered:\n${JSON.stringify(existingAnswers, null, 2)}\n`
    : '';

  // If we detected a specific brand, tell the AI to use it
  const brandHint = detectedBrand
    ? `\nIMPORTANT: The user is searching for a "${detectedBrand.toUpperCase()}" brand product. ALL suggestions should use this brand. Other words in their query (like product line names) should NOT be used as the brand.\n`
    : '';

  // Build parsed context for the AI
  let parsedContext = '';
  if (parsed && (parsed.brand || parsed.specifications.length > 0 || parsed.color || parsed.size)) {
    const parts: string[] = [];
    if (parsed.brand) parts.push(`Brand detected: ${parsed.brand.value}`);
    if (parsed.productName) parts.push(`Product name inferred: ${parsed.productName.value}`);
    if (parsed.color) {
      parts.push(`Color: ${parsed.color}`);
      if (parsed.colorSynonyms && parsed.colorSynonyms.length > 1) {
        parts.push(`Color synonyms: also consider ${parsed.colorSynonyms.filter(s => s !== parsed.color).join(', ')}`);
      }
    }
    if (parsed.size) parts.push(`Size: ${parsed.size.value}`);
    if (parsed.specifications.length > 0) {
      parts.push(`Specs: ${parsed.specifications.map(s => `${s.type}=${s.value}`).join(', ')}`);
    }
    if (parsed.quantity > 1) parts.push(`Quantity: ${parsed.quantity}`);
    if (parsed.priceConstraint) {
      const pc = parsed.priceConstraint;
      if (pc.type === 'max') parts.push(`Price max: $${pc.max}`);
      else if (pc.type === 'min') parts.push(`Price min: $${pc.min}`);
      else if (pc.type === 'range') parts.push(`Price range: $${pc.min}-$${pc.max}`);
      else if (pc.type === 'approximate') parts.push(`Price ~$${pc.value}`);
    }
    parsedContext = `\nPARSED INPUT COMPONENTS:\n${parts.join('\n')}\n`;
  }

  // Determine if clarification might be needed
  const shouldAskClarification = parsed ? needsClarification(parsed) : false;

  const systemPrompt = `You are a product enrichment assistant for Teed, an app that helps users catalog their belongings.
${brandContext}${brandHint}${parsedContext}

CRITICAL: The user is searching for a product. You MUST provide suggestions even if the product is:
- Very new (2024-2025 releases)
- Uncommon or niche
- Potentially misspelled

YOUR #1 PRIORITY: ALWAYS RETURN AT LEAST 3-5 SUGGESTIONS. NEVER return empty suggestions.

If you're not 100% sure about the product:
1. Make your best guess based on the brand and product type
2. Include similar/related products from the same brand
3. Include variations that might match what they meant

Product verticals and their spec formatting (ONLY if you know the actual specs):
- Golf equipment: "Loft | Shaft | Flex" (e.g., "10.5° | Fujikura Ventus | Stiff")
- Golf apparel: Leave empty unless you know actual colors/sizes from the product name
- Makeup: "Shade | Finish | Size" (e.g., "Ruby Woo | Matte | 3g")
- Fashion: Leave empty - user will fill in their size/color
- Tech: "Storage | Key Feature" only if actually known
- Outdoor: "Weight | Rating" only if actually known

CRITICAL: DO NOT MAKE UP SPECS. If you don't know the actual product specifications:
- Leave custom_description as an empty string ""
- Do NOT invent colors, sizes, materials, or other details
- It's better to leave specs empty than to guess wrong
- Only include specs you are CONFIDENT are accurate for this specific product

Format enriched details as:
- brand: Brand name ONLY (e.g., "TaylorMade", "MAC", "Patagonia") - REQUIRED
- custom_name: Product Name without brand (2-6 words, concise)
- custom_description: Formatted specs using pipe separator - LEAVE EMPTY IF UNKNOWN
- notes: Product differentiation, fun facts, or why this matters (2-3 sentences)
- funFactOptions: 3 different fun fact variations

Confidence scoring:
- 0.9+: Very confident
- 0.7-0.89: Moderately confident
- <0.7: Low confidence but STILL PROVIDE SUGGESTIONS

IMPORTANT FOR NEW/UNKNOWN PRODUCTS:
- If you recognize the brand but not the exact model, return what you know about similar models
- "Callaway Elyte" = 2025 Callaway driver line, if unknown use Paradym or Ai Smoke as similar suggestions
- Always include at least one "exact match" attempt and several "similar products"

CLARIFICATION QUESTIONS:
${shouldAskClarification ? `The user's input is ambiguous or generic. You SHOULD generate 1-2 clarification questions to help narrow down results.` : `The user's input is specific enough. Only generate clarification questions if genuinely needed.`}

When to ask clarification questions (set clarificationNeeded: true):
1. Generic product type with no brand (e.g., "polo shirt", "driver", "earbuds")
2. Multiple possible interpretations (e.g., "air max" could be different models)
3. Missing crucial specs for equipment (e.g., golf club without handedness)
4. Low confidence on all suggestions (< 0.7)

Clarification question format:
- id: Unique identifier (e.g., "brand_preference", "model_variant", "handedness")
- question: Short, direct question (e.g., "Any brand preference?")
- options: 2-4 options including the most popular choices for that category

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "brand": "Callaway",
      "custom_name": "Elyte Triple Diamond Driver",
      "custom_description": "9° | Project X HZRDUS | Stiff",
      "notes": "Callaway's 2025 flagship driver for low-spin, high-speed players. Designed for tour pros who shape shots.",
      "funFactOptions": [
        "Callaway's 2025 tour-level driver with the lowest spin profile in their lineup.",
        "The Triple Diamond designation indicates the tour-preferred, compact head shape.",
        "Successor to the Paradym Triple Diamond, built for elite ball strikers."
      ],
      "category": "Golf Equipment",
      "confidence": 0.75
    }
  ],
  "clarificationNeeded": false,
  "questions": [
    {
      "id": "brand_preference",
      "question": "Any brand preference?",
      "options": ["TaylorMade", "Callaway", "Titleist", "Any"]
    }
  ]
}

NEVER return empty suggestions. If unsure, make educated guesses based on brand and context.`;

  const userPrompt = `${contextPrompt}${answersPrompt}User input: "${userInput}"

Generate product suggestions. Remember: ALWAYS return at least 3-5 suggestions, even if you have to guess.
${shouldAskClarification ? 'The input seems generic - consider asking a clarification question.' : ''}`;

  try {
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const result: EnrichmentResponse = JSON.parse(responseText);

    // Track API usage
    const durationMs = Date.now() - startTime;
    trackApiUsage({
      userId: null, // enrich-item doesn't require auth
      endpoint: '/api/ai/enrich-item',
      model: 'gpt-4o',
      operationType: 'enrich',
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      durationMs,
      status: 'success',
    }).catch(console.error);

    // Mark all as AI-sourced
    result.suggestions = result.suggestions.map(s => ({ ...s, source: 'ai' as const }));

    // Track products being learned for visual feedback
    const productsBeingLearned: string[] = [];

    // Learn high-confidence AI suggestions for future library lookups
    for (const suggestion of result.suggestions) {
      if (suggestion.confidence >= 0.75 && suggestion.brand && suggestion.custom_name) {
        const productName = `${suggestion.brand} ${suggestion.custom_name}`;
        productsBeingLearned.push(productName);

        // Fire-and-forget learning - don't block the response
        learnProduct({
          brand: suggestion.brand,
          name: suggestion.custom_name,
          category: suggestion.category || 'golf',
          description: suggestion.notes || suggestion.custom_description,
          confidence: suggestion.confidence,
          source: 'ai',
          productUrl: suggestion.productUrl,
          imageUrl: suggestion.imageUrl,
        }).then(learnResult => {
          if (learnResult.added) {
            console.log(`[enrich-item] Learned: ${productName}`);
          }
        }).catch(err => {
          console.error(`[enrich-item] Learning error:`, err);
        });
      }
    }

    // Add learning info to response
    if (productsBeingLearned.length > 0) {
      result.learning = {
        isLearning: true,
        productsBeingLearned,
        message: productsBeingLearned.length === 1
          ? `Learning "${productsBeingLearned[0]}" for faster lookups`
          : `Learning ${productsBeingLearned.length} new products for faster lookups`,
      };
    }

    console.log(`[enrich-item] TIER 2 Results: ${result.suggestions.length} AI suggestions, ${productsBeingLearned.length} being learned`);
    return result;
  } catch (error: any) {
    console.error('[enrich-item] TIER 2 Error:', error);
    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/enrich-item',
      model: 'gpt-4o',
      operationType: 'enrich',
      durationMs: 0,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);
    throw error;
  }
}

// =============================================================================
// TIER 3: Fallback - Always return SOMETHING
// =============================================================================

function generateFallbackSuggestions(
  userInput: string,
  brand: string | null,
  category: Category | null
): ProductSuggestion[] {
  console.log(`[enrich-item] TIER 3: Generating fallback suggestions`);

  const suggestions: ProductSuggestion[] = [];

  // Create a suggestion based on what we know
  if (brand) {
    suggestions.push({
      brand: brand.charAt(0).toUpperCase() + brand.slice(1),
      custom_name: userInput.replace(new RegExp(brand, 'gi'), '').trim() || 'Product',
      custom_description: 'Details to be added',
      notes: `This appears to be a ${brand} product. Add more details to help identify it.`,
      category: category || 'Other',
      confidence: 0.3,
      source: 'web',
    });
  } else {
    suggestions.push({
      brand: 'Unknown',
      custom_name: userInput,
      custom_description: 'Details to be added',
      notes: 'We couldn\'t find an exact match. You can add this item manually and we\'ll enrich it later.',
      category: category || 'Other',
      confidence: 0.2,
      source: 'web',
    });
  }

  return suggestions;
}

// =============================================================================
// Convert Library Results to Suggestions
// =============================================================================

function libraryResultsToSuggestions(results: SearchResult[]): ProductSuggestion[] {
  return results.map(r => ({
    brand: r.product.brand,
    custom_name: r.product.name,
    custom_description: r.product.description || '',
    notes: r.product.description || `${r.product.brand} ${r.product.name} - ${r.product.releaseYear}`,
    category: r.product.category,
    confidence: r.confidence / 100,
    productUrl: r.product.productUrl,
    imageUrl: r.product.referenceImages?.primary,
    source: 'library' as const,
    funFactOptions: [
      `${r.product.brand} ${r.product.name} - Released in ${r.product.releaseYear}`,
      `Part of ${r.product.brand}'s ${r.product.subcategory || 'lineup'}`,
      r.product.description || `A quality ${r.product.category} product from ${r.product.brand}`,
    ],
  }));
}

// =============================================================================
// Main Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: EnrichmentRequest = await request.json();
    const { userInput, bagContext, existingAnswers = {}, forceAI = false, categoryHint } = body;

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    console.log(`[enrich-item] Processing: "${userInput}"`);

    // ========================================
    // Check for previous corrections first
    // ========================================
    const previousCorrection = await getPreviousCorrection(userInput);
    if (previousCorrection) {
      console.log(`[enrich-item] Using previous correction: brand=${previousCorrection.brand}, name=${previousCorrection.name}`);
    }

    // ========================================
    // Parse text input using smart text parsing
    // ========================================
    const parsed = parseText(userInput, { categoryHint: categoryHint || undefined });
    console.log(`[enrich-item] Parsed in ${parsed.parseTimeMs}ms: brand=${parsed.brand?.value || 'none'}, product=${parsed.productName?.value || 'none'}, category=${parsed.inferredCategory || 'none'}, confidence=${parsed.parseConfidence.toFixed(2)}`);

    // Use parsed results for brand and category detection
    // Fall back to legacy detection if parsing didn't find anything
    const { brand: textBrand, category: legacyCategory } = detectBrandAndCategory(userInput);

    // Try to extract brand from URL if the input contains a URL
    const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
    let urlBrand: string | null = null;
    if (urlMatch) {
      urlBrand = extractBrandFromUrl(urlMatch[0]);
      console.log(`[enrich-item] URL found: ${urlMatch[0]}, brand from URL: ${urlBrand || 'none'}`);
    }

    // Try to extract brand from the product name/description in userInput
    const textExtractedBrand = extractBrandFromText(userInput);

    // Priority: correction > URL brand > parsed brand > text-detected brand > text-extracted brand
    const brand = previousCorrection?.brand || urlBrand || parsed.brand?.value || textBrand || textExtractedBrand;

    // Priority: correction > parsed category > legacy category > categoryHint
    const category = (previousCorrection?.category as Category) || parsed.inferredCategory || legacyCategory || categoryHint || null;

    // If we have a correction, also use it to improve search query
    const correctionSearchHint = previousCorrection?.name || null;

    console.log(`[enrich-item] Final brand: ${brand || 'none'} (correction: ${previousCorrection?.brand}, url: ${urlBrand}, parsed: ${parsed.brand?.value}), category: ${category}`);

    // Build optimized search query from parsed result
    // If we have a previous correction, use corrected name as primary search
    let searchQuery = buildSearchQuery(parsed);
    if (correctionSearchHint && previousCorrection?.brand) {
      searchQuery = `${previousCorrection.brand} ${correctionSearchHint}`;
      console.log(`[enrich-item] Using correction-based search query: "${searchQuery}"`);
    }

    // Load brand context for AI
    const brandContext = category
      ? generateBrandContext([category], 'standard')
      : '';

    // TIER 1: Search product library using optimized search query
    // The searchQuery is built from parsed components (brand + product name) for better matching
    const { results: libraryResults, relatedProducts } = await searchProductLibrary(
      searchQuery || userInput,
      category
    );
    console.log(`[enrich-item] Search query: "${searchQuery}" (original: "${userInput}")`);

    // Check if we have an EXACT match (confidence > 92% - very strict to avoid bad library matches)
    const exactMatches = libraryResults.filter(r => r.confidence > 92);

    // Also check word relevance - even high confidence matches might be irrelevant
    // e.g., "fujikura blue 6x" matching "Cut Blue" on just "blue"
    const hasGoodRelevance = hasGoodWordRelevance(userInput, exactMatches);

    // If we have exact matches with good relevance and forceAI is NOT set, return them without AI
    if (exactMatches.length >= 1 && hasGoodRelevance && !forceAI) {
      console.log(`[enrich-item] Using TIER 1 exact matches (${exactMatches.length} matches with good relevance)`);

      const suggestions = libraryResultsToSuggestions(exactMatches.slice(0, 5));

      return NextResponse.json({
        suggestions,
        clarificationNeeded: false,
        questions: [],
        searchTier: 'library',
        parsed, // Include parsed result for UI transparency
      });
    }

    // Log why we're skipping library-only results
    if (forceAI) {
      console.log(`[enrich-item] forceAI=true, skipping library-only results`);
    } else if (exactMatches.length >= 1 && !hasGoodRelevance) {
      console.log(`[enrich-item] Library matches have poor word relevance, triggering AI search`);
    }

    // If we have partial matches but no exact match, we'll still call AI
    // to try to identify unknown products (like "Elyte" which is 2025)
    const hasPartialMatches = libraryResults.length > 0;

    // TIER 2: Use AI for enrichment (especially for new/unknown products)
    try {
      const aiResult = await searchWithAI(userInput, bagContext, existingAnswers, category, brandContext, brand, parsed);

      // When forceAI is true, SKIP library results entirely - user explicitly wants AI only
      // Otherwise, filter library results by word relevance before including
      // This prevents low-relevance library results from appearing above AI results after confidence sort
      let librarysuggestions: ProductSuggestion[] = [];
      if (!forceAI) {
        const relevantLibraryResults = libraryResults.filter(result => {
          const relevance = calculateWordRelevance(userInput, result.product.name, result.product.brand);
          // Only include library results with >= 70% word relevance (stricter to avoid bad matches)
          return relevance >= 0.7;
        });
        librarysuggestions = libraryResultsToSuggestions(relevantLibraryResults);
        console.log(`[enrich-item] Filtered library: ${libraryResults.length} → ${relevantLibraryResults.length} with good relevance`);
      }
      const mergedSuggestions = [...aiResult.suggestions, ...librarysuggestions]; // AI first!

      // Deduplicate by brand + name
      const seen = new Set<string>();
      const uniqueSuggestions = mergedSuggestions.filter(s => {
        const key = `${s.brand.toLowerCase()}-${s.custom_name.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by confidence
      uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);

      // Apply extracted brand to suggestions that don't have one OR when parsed brand is more accurate
      if (brand) {
        for (const suggestion of uniqueSuggestions) {
          const needsBrandOverride =
            !suggestion.brand ||
            suggestion.brand === 'Unknown' ||
            suggestion.brand === 'Not specified';

          // Also override if: we have a high-confidence parsed brand AND
          // the product name contains our parsed brand (e.g., "Blue Yeti" contains "Blue")
          const parsedBrandInName =
            parsed?.brand &&
            parsed.brand.confidence >= 0.8 &&
            suggestion.custom_name.toLowerCase().includes(parsed.brand.value.toLowerCase().split(' ')[0]);

          // Don't override if AI brand is already correct (matches parsed brand)
          const aiMatchesParsed =
            parsed?.brand &&
            suggestion.brand?.toLowerCase() === parsed.brand.value.toLowerCase();

          if (needsBrandOverride || (parsedBrandInName && !aiMatchesParsed)) {
            console.log(`[enrich-item] Setting brand "${brand}" for "${suggestion.custom_name}" (was: ${suggestion.brand || 'none'})`);
            suggestion.brand = brand;
          }
        }
      }

      // If still no results, add related products (but not if forceAI)
      if (uniqueSuggestions.length === 0 && relatedProducts.length > 0 && !forceAI) {
        console.log(`[enrich-item] Adding ${relatedProducts.length} related products`);
        uniqueSuggestions.push(...libraryResultsToSuggestions(relatedProducts));
      }

      // TIER 3: Last resort fallback
      if (uniqueSuggestions.length === 0) {
        console.log(`[enrich-item] Using TIER 3 fallback`);
        const fallbackSuggestions = generateFallbackSuggestions(userInput, brand, category);
        uniqueSuggestions.push(...fallbackSuggestions);
      }

      console.log(`[enrich-item] Final result: ${uniqueSuggestions.length} suggestions (forceAI=${forceAI})`);

      // Merge AI clarification questions with local suggestions if needed
      let questions = aiResult.questions || [];
      let clarificationNeeded = aiResult.clarificationNeeded;

      // If AI didn't suggest questions but local parsing thinks we need them, add them
      if (!clarificationNeeded && needsClarification(parsed) && questions.length === 0) {
        const localQuestions = suggestClarificationQuestions(parsed);
        if (localQuestions.length > 0) {
          questions = localQuestions.slice(0, 2); // Max 2 questions
          clarificationNeeded = true;
          console.log(`[enrich-item] Added ${questions.length} local clarification questions`);
        }
      }

      return NextResponse.json({
        suggestions: uniqueSuggestions.slice(0, 5),
        clarificationNeeded,
        questions,
        searchTier: forceAI ? 'ai' : (libraryResults.length > 0 ? 'library+ai' : 'ai'),
        learning: aiResult.learning,
        parsed, // Include parsed result for UI transparency
      });
    } catch (aiError) {
      console.error('[enrich-item] AI failed, using fallback:', aiError);

      // Filter library results to only include those with good word relevance
      // Don't show irrelevant results just because AI failed
      const relevantLibraryResults = libraryResults.filter(result => {
        const relevance = calculateWordRelevance(userInput, result.product.name, result.product.brand);
        return relevance >= 0.7; // Stricter threshold
      });

      const relevantRelatedProducts = relatedProducts.filter(result => {
        const relevance = calculateWordRelevance(userInput, result.product.name, result.product.brand);
        return relevance >= 0.5; // Slightly lower threshold for related products
      });

      // If AI fails and forceAI is true, only return fallback (no library)
      // Otherwise return RELEVANT library results + fallback
      const suggestions = forceAI
        ? generateFallbackSuggestions(userInput, brand, category)
        : [
            ...libraryResultsToSuggestions(relevantLibraryResults),
            ...libraryResultsToSuggestions(relevantRelatedProducts),
            ...generateFallbackSuggestions(userInput, brand, category),
          ];

      return NextResponse.json({
        suggestions: suggestions.slice(0, 5),
        clarificationNeeded: false,
        questions: [],
        searchTier: 'fallback',
        parsed, // Include parsed result for UI transparency
      });
    }
  } catch (error) {
    console.error('Error in AI enrichment:', error);

    // Even on total failure, return something useful
    return NextResponse.json({
      suggestions: [{
        brand: 'Manual Entry',
        custom_name: 'Add your item',
        custom_description: 'Enter details manually',
        notes: 'We couldn\'t process your request automatically. Please add details manually.',
        category: 'Other',
        confidence: 0.1,
        source: 'web',
      }],
      clarificationNeeded: false,
      questions: [],
      searchTier: 'error',
    });
  }
}
