/**
 * Smart Text Parsing Pipeline
 *
 * Main entry point for parsing user text input to extract:
 * - Brand, product name, color, size
 * - Specifications (golf loft/flex, tech specs, etc.)
 * - Quantity and price constraints
 * - Category inference
 *
 * Similar architecture to the link identification pipeline.
 */

import type {
  ParsedTextResult,
  ParsedComponent,
  ParseOptions,
  ExtractedSpec,
  ExtractedSize,
  PriceConstraint,
  DictionaryMatchResult,
} from './types';
import type { Category } from '@/lib/productLibrary/schema';

import { normalize, splitIntoItems } from './stages/normalize';
import { patternExtract } from './stages/patternExtract';
import { dictionaryMatch, getBrandEntry } from './stages/dictionaryMatch';
import { productInference, combineNameParts } from './stages/productInference';
import { getColorSynonyms } from './dictionaries/colors';

/**
 * Parse user text input through the multi-stage pipeline
 *
 * @param input - The raw text input from the user
 * @param options - Optional configuration for parsing
 * @returns ParsedTextResult with all extracted information
 */
export function parseText(input: string, options: ParseOptions = {}): ParsedTextResult {
  const startTime = Date.now();
  const stagesRun: string[] = [];

  // Early return for empty input
  if (!input || input.trim().length === 0) {
    return createEmptyResult(input, startTime);
  }

  const allComponents: ParsedComponent[] = [];

  // ========================================
  // STAGE 1: Normalize
  // ========================================
  stagesRun.push('normalize');
  const normalizeResult = normalize(input);
  allComponents.push(...normalizeResult.extractedComponents);

  let remainingText = normalizeResult.normalizedText;

  // ========================================
  // STAGE 2: Dictionary Match (Brand Detection)
  // Run BEFORE pattern extract so brand names aren't stripped as colors
  // e.g., "Blue Yeti" should match Blue Microphones before "Blue" is extracted as a color
  // ========================================
  stagesRun.push('dictionaryMatch');
  const dictionaryResult: DictionaryMatchResult = options.skipBrandDetection
    ? { brand: null, fuzzyCorrection: null, inferredCategory: null, categoryConfidence: 0, extractedComponents: [], remainingText }
    : dictionaryMatch(remainingText);

  allComponents.push(...dictionaryResult.extractedComponents);
  remainingText = dictionaryResult.remainingText;

  // ========================================
  // STAGE 3: Pattern Extract
  // Run after brand detection to avoid stripping brand-related words as colors
  // ========================================
  stagesRun.push('patternExtract');
  const patternResult = options.skipSpecExtraction
    ? { extractedSpecs: [], extractedSize: null, extractedColor: null, extractedComponents: [], remainingText }
    : patternExtract(remainingText);

  allComponents.push(...patternResult.extractedComponents);
  remainingText = patternResult.remainingText;

  // Use category hint if provided and no category was detected
  let inferredCategory = dictionaryResult.inferredCategory || options.categoryHint || null;
  let categoryConfidence = dictionaryResult.categoryConfidence || (options.categoryHint ? 0.5 : 0);

  // ========================================
  // STAGE 4: Product Inference
  // ========================================
  stagesRun.push('productInference');
  const inferenceResult = productInference(
    remainingText,
    patternResult.extractedSpecs,
    inferredCategory
  );

  allComponents.push(...inferenceResult.extractedComponents);

  // Use refined category if available
  if (inferenceResult.refinedCategory) {
    inferredCategory = inferenceResult.refinedCategory;
    if (categoryConfidence < 0.6) {
      categoryConfidence = 0.6;
    }
  }

  // ========================================
  // Calculate Overall Parse Confidence
  // ========================================
  const parseConfidence = calculateOverallConfidence(
    dictionaryResult.brand?.confidence || 0,
    inferenceResult.productName?.confidence || 0,
    patternResult.extractedSpecs.length,
    categoryConfidence
  );

  // ========================================
  // Build Final Result
  // ========================================
  const colorSynonyms = patternResult.extractedColor
    ? getColorSynonyms(patternResult.extractedColor)
    : [];

  return {
    originalInput: input,
    normalizedInput: normalizeResult.normalizedText,

    components: allComponents,

    brand: dictionaryResult.brand,
    productName: inferenceResult.productName,
    color: patternResult.extractedColor,
    size: patternResult.extractedSize,
    specifications: patternResult.extractedSpecs,

    quantity: normalizeResult.quantity,
    priceConstraint: normalizeResult.priceConstraint,

    inferredCategory,
    categoryConfidence,

    fuzzyCorrection: dictionaryResult.fuzzyCorrection,
    colorSynonyms,

    parseConfidence,
    remainingText,

    parseTimeMs: Date.now() - startTime,
    stagesRun,
  };
}

/**
 * Parse multiple text items (for bulk import)
 *
 * @param input - Multi-line or delimited text
 * @param options - Parse options
 * @returns Array of ParsedTextResult
 */
export function parseMultipleItems(input: string, options: ParseOptions = {}): ParsedTextResult[] {
  const items = splitIntoItems(input);
  return items.map(item => parseText(item, options));
}

/**
 * Get a summary of what was parsed (for display)
 */
export function getParseDisplaySummary(result: ParsedTextResult): {
  mainText: string;
  badges: Array<{ label: string; value: string; type: 'brand' | 'spec' | 'color' | 'size' | 'quantity' | 'price' }>;
} {
  const badges: Array<{ label: string; value: string; type: 'brand' | 'spec' | 'color' | 'size' | 'quantity' | 'price' }> = [];

  // Add brand badge
  if (result.brand) {
    badges.push({ label: 'Brand', value: result.brand.value, type: 'brand' });
  }

  // Add spec badges
  for (const spec of result.specifications.slice(0, 3)) {
    badges.push({ label: spec.type, value: spec.value, type: 'spec' });
  }

  // Add color badge
  if (result.color) {
    badges.push({ label: 'Color', value: result.color, type: 'color' });
  }

  // Add size badge
  if (result.size) {
    badges.push({ label: 'Size', value: result.size.value, type: 'size' });
  }

  // Add quantity badge if > 1
  if (result.quantity > 1) {
    badges.push({ label: 'Qty', value: String(result.quantity), type: 'quantity' });
  }

  // Add price badge
  if (result.priceConstraint) {
    let priceText = '';
    switch (result.priceConstraint.type) {
      case 'max':
        priceText = `Under $${result.priceConstraint.max}`;
        break;
      case 'min':
        priceText = `Over $${result.priceConstraint.min}`;
        break;
      case 'range':
        priceText = `$${result.priceConstraint.min}-${result.priceConstraint.max}`;
        break;
      case 'approximate':
        priceText = `~$${result.priceConstraint.value}`;
        break;
    }
    badges.push({ label: 'Price', value: priceText, type: 'price' });
  }

  // Build main text (product name or remaining text)
  const mainText = result.productName?.value ||
    result.remainingText ||
    result.originalInput;

  return { mainText, badges };
}

/**
 * Build a search query from parsed result
 */
export function buildSearchQuery(result: ParsedTextResult): string {
  const parts: string[] = [];

  // Add brand
  if (result.brand) {
    parts.push(result.brand.value);
  }

  // Add product name
  if (result.productName) {
    parts.push(result.productName.value);
  } else if (result.remainingText) {
    parts.push(result.remainingText);
  }

  return parts.join(' ').trim() || result.originalInput;
}

/**
 * Check if the input is generic/ambiguous and might need clarification
 */
export function needsClarification(result: ParsedTextResult): boolean {
  // Very short input with no brand
  if (!result.brand && result.originalInput.split(/\s+/).length <= 2) {
    return true;
  }

  // Low confidence overall
  if (result.parseConfidence < 0.5) {
    return true;
  }

  // No brand and no category
  if (!result.brand && !result.inferredCategory) {
    return true;
  }

  // Generic terms only (no model/product name detected)
  if (!result.productName && !result.brand && result.specifications.length === 0) {
    return true;
  }

  return false;
}

/**
 * Suggest clarification questions based on what's missing
 */
export function suggestClarificationQuestions(result: ParsedTextResult): Array<{
  id: string;
  question: string;
  options: string[];
  priority: number;
}> {
  const questions: Array<{
    id: string;
    question: string;
    options: string[];
    priority: number;
  }> = [];

  // No brand detected
  if (!result.brand) {
    const categoryBrands = getCategoryBrandSuggestions(result.inferredCategory);
    if (categoryBrands.length > 0) {
      questions.push({
        id: 'brand_preference',
        question: 'Any brand preference?',
        options: [...categoryBrands.slice(0, 3), 'Any'],
        priority: 1,
      });
    }
  }

  // No category detected
  if (!result.inferredCategory) {
    questions.push({
      id: 'category',
      question: 'What type of product is this?',
      options: ['Golf', 'Fashion', 'Tech', 'Beauty', 'Other'],
      priority: 2,
    });
  }

  // Golf club without specs
  if (result.inferredCategory === 'golf' && result.specifications.length === 0) {
    // Check if it's likely a club
    const isClub = /driver|iron|wedge|wood|hybrid|putter/i.test(result.originalInput);
    if (isClub) {
      questions.push({
        id: 'club_hand',
        question: 'Right or left handed?',
        options: ['Right Hand', 'Left Hand'],
        priority: 3,
      });
    }
  }

  return questions.sort((a, b) => a.priority - b.priority);
}

// ============================================================
// Helper Functions
// ============================================================

function createEmptyResult(input: string, startTime: number): ParsedTextResult {
  return {
    originalInput: input,
    normalizedInput: '',
    components: [],
    brand: null,
    productName: null,
    color: null,
    size: null,
    specifications: [],
    quantity: 1,
    priceConstraint: null,
    inferredCategory: null,
    categoryConfidence: 0,
    fuzzyCorrection: null,
    colorSynonyms: [],
    parseConfidence: 0,
    remainingText: '',
    parseTimeMs: Date.now() - startTime,
    stagesRun: [],
  };
}

function calculateOverallConfidence(
  brandConfidence: number,
  productNameConfidence: number,
  specCount: number,
  categoryConfidence: number
): number {
  let confidence = 0.3; // Base confidence

  // Brand detected (weighted heavily)
  if (brandConfidence > 0) {
    confidence += brandConfidence * 0.35;
  }

  // Product name inferred
  if (productNameConfidence > 0) {
    confidence += productNameConfidence * 0.25;
  }

  // Specs detected (each spec adds confidence)
  confidence += Math.min(specCount * 0.1, 0.2);

  // Category detected
  if (categoryConfidence > 0) {
    confidence += categoryConfidence * 0.1;
  }

  return Math.min(confidence, 0.98);
}

function getCategoryBrandSuggestions(category: Category | null): string[] {
  const brandSuggestions: Partial<Record<Category, string[]>> = {
    // Sports & Recreation
    golf: ['TaylorMade', 'Callaway', 'Titleist', 'PING', 'Cobra'],
    tennis: ['Babolat', 'Wilson', 'Head', 'Yonex'],
    cycling: ['Trek', 'Specialized', 'Cannondale', 'Giant', 'Rapha'],
    snow: ['Burton', 'Rossignol', 'Atomic', 'Lib Tech'],
    surf: ['Channel Islands', 'Rip Curl', 'Quiksilver', 'Billabong'],
    // Tech
    tech: ['Apple', 'Samsung', 'Sony', 'Google', 'Microsoft'],
    audio: ['Bose', 'Sony', 'Sennheiser', 'Bang & Olufsen', 'JBL'],
    gaming: ['Sony', 'Microsoft', 'Nintendo', 'Razer', 'Logitech'],
    photography: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'DJI'],
    // Fashion & Apparel
    fashion: ['Gucci', 'Louis Vuitton', 'Ralph Lauren', 'Burberry'],
    apparel: ['Nike', 'adidas', 'Under Armour', 'Everlane'],
    footwear: ['Nike', 'New Balance', 'HOKA', 'On', 'Allbirds'],
    activewear: ['Lululemon', 'Alo Yoga', 'Vuori', 'Rhone', 'Gymshark'],
    watches: ['Rolex', 'Omega', 'TAG Heuer', 'Seiko', 'Grand Seiko'],
    eyewear: ['Ray-Ban', 'Oakley', 'Warby Parker', 'Oliver Peoples'],
    // Beauty
    beauty: ['Charlotte Tilbury', 'MAC', 'Fenty Beauty', 'Rare Beauty', 'NARS'],
    makeup: ['Charlotte Tilbury', 'MAC', 'Fenty Beauty', 'NARS', 'Glossier'],
    skincare: ['La Mer', 'Drunk Elephant', 'CeraVe', 'The Ordinary'],
    // Home
    home: ['Restoration Hardware', 'West Elm', 'Pottery Barn', 'Article'],
    kitchen: ['Le Creuset', 'All-Clad', 'KitchenAid', 'Vitamix'],
    bedding: ['Brooklinen', 'Parachute', 'Casper', 'Eight Sleep'],
    office: ['Herman Miller', 'Steelcase', 'Fully', 'Uplift'],
    // Outdoor
    outdoor: ['YETI', 'Osprey', 'Patagonia', "Arc'teryx", 'The North Face'],
    travel: ['Away', 'Rimowa', 'Tumi', 'Briggs & Riley'],
    edc: ['Benchmade', 'Spyderco', 'Leatherman', 'Ridge', 'Olight'],
    // Entertainment
    music: ['Fender', 'Gibson', 'Roland', 'Yamaha'],
    hobbies: ['LEGO', 'Games Workshop', 'Bandai'],
    // Wellness
    fitness: ['Nike', 'Peloton', 'Therabody', 'Rogue Fitness'],
    supplements: ['AG1', 'Ritual', 'Thorne', 'Momentous'],
    wearables: ['WHOOP', 'Oura', 'Garmin', 'Apple'],
    // Food & Beverage
    coffee: ['Nespresso', 'Breville', 'Fellow', 'Blue Bottle'],
    // Automotive
    automotive: ['WeatherTech', 'K&N', "Griot's Garage"],
    motorcycle: ['Alpinestars', 'Dainese', 'Shoei', 'Bell'],
    // Family
    baby: ['UPPAbaby', 'Bugaboo', 'Nuna', 'SNOO'],
    pet: ['Orijen', 'Royal Canin', "The Farmer's Dog", 'KONG'],
  };

  if (category && brandSuggestions[category]) {
    return brandSuggestions[category]!;
  }

  // Default suggestions for unknown category
  return ['Nike', 'Apple', 'TaylorMade', 'Patagonia'];
}

// Re-export types and utilities
export type {
  ParsedTextResult,
  ParsedComponent,
  ParseOptions,
  ExtractedSpec,
  ExtractedSize,
  PriceConstraint,
} from './types';

export { splitIntoItems } from './stages/normalize';
export { getBrandEntry, getBrandsForCategory, BRAND_DICTIONARY, CATEGORY_PATTERNS } from './stages/dictionaryMatch';
export { combineNameParts } from './stages/productInference';
export { getColorSynonyms } from './dictionaries/colors';
