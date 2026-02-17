/**
 * Fuzzy Brand Matcher
 *
 * Matches garbled/misheard brand names from transcripts and OCR against
 * the 680+ brand dictionary using Levenshtein distance.
 *
 * Rules:
 * - Max distance 2 for brands ≥ 8 chars
 * - Max distance 1 for brands 3-7 chars
 * - Brands under 3 chars require exact match ("On", "LG")
 * - Require first char match for brands < 6 chars
 */

import { levenshteinDistance } from '@/lib/utils';
import { BRAND_DICTIONARY } from '@/lib/textParsing/stages/dictionaryMatch';
import type { BrandEntry } from '@/lib/textParsing/types';

interface FuzzyMatchResult {
  /** Original input text */
  input: string;
  /** Matched brand entry (null if no match) */
  brand: BrandEntry | null;
  /** Levenshtein distance of the match */
  distance: number;
  /** What was matched against (normalized name or alias) */
  matchedAgainst: string;
}

/** Pre-compute lookup structures for fast matching */
interface BrandLookup {
  /** Map of normalized name → brand entry */
  byNormalizedName: Map<string, BrandEntry>;
  /** Map of alias → brand entry */
  byAlias: Map<string, BrandEntry>;
  /** All searchable strings with their brand entries */
  allEntries: Array<{ text: string; brand: BrandEntry }>;
}

let cachedLookup: BrandLookup | null = null;

function buildLookup(): BrandLookup {
  if (cachedLookup) return cachedLookup;

  const byNormalizedName = new Map<string, BrandEntry>();
  const byAlias = new Map<string, BrandEntry>();
  const allEntries: Array<{ text: string; brand: BrandEntry }> = [];

  for (const brand of BRAND_DICTIONARY) {
    byNormalizedName.set(brand.normalizedName, brand);
    allEntries.push({ text: brand.normalizedName, brand });

    for (const alias of brand.aliases) {
      const normalized = alias.toLowerCase();
      byAlias.set(normalized, brand);
      allEntries.push({ text: normalized, brand });
    }
  }

  cachedLookup = { byNormalizedName, byAlias, allEntries };
  return cachedLookup;
}

/**
 * Get the maximum allowed Levenshtein distance for a brand name.
 */
function maxDistanceForLength(len: number): number {
  if (len < 3) return 0;   // Exact match only for "On", "LG", etc.
  if (len < 8) return 1;   // 1 edit for short brands
  return 2;                  // 2 edits for long brands
}

/**
 * Try to fuzzy-match a single text string against the brand dictionary.
 */
export function fuzzyMatchBrand(input: string): FuzzyMatchResult {
  const lookup = buildLookup();
  const normalized = input.toLowerCase().trim();

  // 1. Exact match check (fast path)
  const exact = lookup.byNormalizedName.get(normalized) || lookup.byAlias.get(normalized);
  if (exact) {
    return { input, brand: exact, distance: 0, matchedAgainst: normalized };
  }

  // 2. Fuzzy match with Levenshtein
  let bestMatch: BrandEntry | null = null;
  let bestDistance = Infinity;
  let bestMatchedText = '';

  for (const { text, brand } of lookup.allEntries) {
    const maxDist = maxDistanceForLength(text.length);
    if (maxDist === 0) continue; // Skip exact-match-only brands for fuzzy

    // Quick length check: if lengths differ by more than maxDist, skip
    if (Math.abs(normalized.length - text.length) > maxDist) continue;

    // First char match required for short brands
    if (text.length < 6 && normalized[0] !== text[0]) continue;

    const distance = levenshteinDistance(normalized, text);
    if (distance <= maxDist && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = brand;
      bestMatchedText = text;
    }
  }

  return {
    input,
    brand: bestMatch,
    distance: bestMatch ? bestDistance : Infinity,
    matchedAgainst: bestMatchedText,
  };
}

/**
 * Fuzzy-match multiple text strings (e.g., from OCR results).
 * Returns only successful matches.
 */
export function fuzzyMatchBrands(texts: string[]): FuzzyMatchResult[] {
  return texts
    .map(t => fuzzyMatchBrand(t))
    .filter(r => r.brand !== null);
}

/**
 * Common audio garble patterns from YouTube auto-transcripts.
 * Maps garbled text (lowercased) to correct brand name.
 * These are beyond what Levenshtein distance can fix.
 */
const AUDIO_GARBLE_MAP: Record<string, string> = {
  // HercLeon variations
  'erg leon': 'HercLeon',
  'erglon': 'HercLeon',
  'her leon': 'HercLeon',
  'herc leon': 'HercLeon',
  'herk leon': 'HercLeon',
  // KETL Mtn variations
  'kettle': 'KETL Mtn',
  'ketl': 'KETL Mtn',
  'kettle mountain': 'KETL Mtn',
  'cattle mountain': 'KETL Mtn',
  // Unbound Merino variations
  'onbound marino': 'Unbound Merino',
  'onbound merino': 'Unbound Merino',
  'unbound marino': 'Unbound Merino',
  // Ten Thousand variations
  '10000': 'Ten Thousand',
  '10,000': 'Ten Thousand',
  'ten thousand': 'Ten Thousand',
  // BUFF variations
  'buffy': 'BUFF',
  'buff': 'BUFF',
  // Cariloha variations
  'cariuma': 'Cariloha',
  'carolina': 'Cariloha',
  // Pakt variations
  'backbone': 'Pakt',
  'packed': 'Pakt',
  'packet': 'Pakt',
  'pack one': 'Pakt',
  'pact': 'Pakt',
  // Seadon variations
  'sidon': 'Seadon',
  'saidon': 'Seadon',
  'sea don': 'Seadon',
  // KUXIU variations
  'ku xiu': 'KUXIU',
  'coochoo': 'KUXIU',
  'koochoo': 'KUXIU',
  // Vivobarefoot variations
  'vivo barefoot': 'Vivobarefoot',
  // WANDRD variations
  'wandered': 'WANDRD',
  'wandrd': 'WANDRD',
  'wander': 'WANDRD',
  // Baseus variations
  'basis': 'Baseus',
  'bases': 'Baseus',
  'baysius': 'Baseus',
  // ROAV variations
  'roave': 'ROAV',
  'rove': 'ROAV',
  // Wildling Shoes (NOT Zwilling J.A. Henckels)
  'wildling': 'Wildling Shoes',
  'wildling shoes': 'Wildling Shoes',
  // SanDisk variations
  'sandisk': 'SanDisk',
  'san disk': 'SanDisk',
  // MOFT (laptop stand brand, NOT Microsoft)
  'moft': 'MOFT',
};

/**
 * Post-process transcript products: fix garbled brand names.
 * First checks the audio garble map, then falls back to Levenshtein.
 * Returns the corrected brand name or null if no match found.
 */
export function fixGarbledBrand(brandName: string): string | null {
  if (!brandName || brandName.length < 2) return null;

  const normalized = brandName.toLowerCase().trim();

  // Check audio garble map first (handles cases beyond Levenshtein)
  const garbleMatch = AUDIO_GARBLE_MAP[normalized];
  if (garbleMatch) {
    console.log(
      `[V2 FuzzyMatch] Garble map: "${brandName}" → "${garbleMatch}"`
    );
    return garbleMatch;
  }

  // Check for partial garble matches (garble key contained in brand or vice versa)
  for (const [garble, correct] of Object.entries(AUDIO_GARBLE_MAP)) {
    if (normalized.includes(garble) || garble.includes(normalized)) {
      console.log(
        `[V2 FuzzyMatch] Partial garble: "${brandName}" → "${correct}"`
      );
      return correct;
    }
  }

  // Fall back to Levenshtein fuzzy matching
  const result = fuzzyMatchBrand(brandName);
  if (result.brand && result.distance > 0) {
    console.log(
      `[V2 FuzzyMatch] Corrected "${brandName}" → "${result.brand.name}" (distance: ${result.distance})`
    );
    return result.brand.name;
  }

  return null; // No correction needed or no match found
}
