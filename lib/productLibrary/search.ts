/**
 * Product Library Search Utilities
 *
 * Functions for searching and matching products in the library
 * by text, visual signature, or combined criteria.
 */

import type {
  Product,
  ProductLibrary,
  SearchQuery,
  SearchResult,
  Category,
  VisualSignature,
  ProductVariant,
} from './schema';
import { levenshteinDistance } from '@/lib/utils';

// =============================================================================
// Text Search
// =============================================================================

/**
 * Calculate text similarity score between two strings
 * Uses a combination of exact match, substring match, and fuzzy matching
 */
export function textSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  // Exact match
  if (aLower === bLower) return 100;

  // One contains the other
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    const shorter = Math.min(aLower.length, bLower.length);
    const longer = Math.max(aLower.length, bLower.length);
    return 70 + (shorter / longer) * 30;
  }

  // Word-level matching
  const aWords = new Set(aLower.split(/\s+/));
  const bWords = new Set(bLower.split(/\s+/));
  const intersection = Array.from(aWords).filter(w => bWords.has(w));
  const union = new Set([...Array.from(aWords), ...Array.from(bWords)]);

  if (intersection.length > 0) {
    return (intersection.length / union.size) * 70;
  }

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(aLower, bLower);
  const maxLen = Math.max(aLower.length, bLower.length);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity * 50);
}

/**
 * Search products by text query
 *
 * Improved to handle:
 * - Multi-word queries (e.g., "TaylorMade Qi35 Driver")
 * - Partial keyword matches
 * - Brand + product name combinations
 */
export function searchByText(
  products: Product[],
  query: string,
  limit: number = 10
): SearchResult[] {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
  const results: SearchResult[] = [];

  for (const product of products) {
    let maxScore = 0;
    const matchReasons: string[] = [];
    const productNameLower = product.name.toLowerCase();
    const brandLower = product.brand.toLowerCase();
    const fullName = `${brandLower} ${productNameLower}`;

    // === PRIORITY 1: All query words appear in brand+name (with fuzzy fallback) ===
    // This catches "TaylorMade Qi35 Driver" matching brand="TaylorMade" + name="Qi35 Driver"
    const fullNameWords = fullName.split(/\s+/);
    let exactMatchCount = 0;
    let fuzzyMatchCount = 0;
    const matchedWords: string[] = [];

    for (const word of queryWords) {
      const exactMatch = fullName.includes(word) ||
        product.searchKeywords.some(k => k.toLowerCase().includes(word));

      if (exactMatch) {
        exactMatchCount++;
        matchedWords.push(word);
      } else if (word.length >= 4) {
        // Fuzzy fallback: check if any product word is within edit distance 1
        const fuzzyMatch = fullNameWords.some(pw =>
          pw.length >= 4 && levenshteinDistance(word, pw) <= 1
        ) || product.searchKeywords.some(k => {
          const kWords = k.toLowerCase().split(/\s+/);
          return kWords.some(kw => kw.length >= 4 && levenshteinDistance(word, kw) <= 1);
        });

        if (fuzzyMatch) {
          fuzzyMatchCount++;
          matchedWords.push(`~${word}`);
        }
      }
    }

    const totalMatched = exactMatchCount + fuzzyMatchCount;

    if (totalMatched === queryWords.length && queryWords.length > 0) {
      // All words matched (exact or fuzzy)
      // Fuzzy matches count as 0.8 of exact
      const effectiveScore = exactMatchCount + (fuzzyMatchCount * 0.8);
      const wordMatchScore = 85 + (effectiveScore * 3);
      maxScore = Math.max(maxScore, Math.min(98, wordMatchScore));
      matchReasons.push(`All words match: ${matchedWords.join(', ')}`);
    } else if (totalMatched === queryWords.length - 1 && queryWords.length >= 3) {
      // "Mostly matched" tier: all-but-one words match
      const mostlyScore = 78 + (exactMatchCount * 2);
      maxScore = Math.max(maxScore, Math.min(85, mostlyScore));
      matchReasons.push(`Mostly match: ${matchedWords.join(', ')}`);
    } else if (totalMatched > 0) {
      // Partial word match
      const partialScore = (totalMatched / queryWords.length) * 70;
      if (partialScore > maxScore) {
        maxScore = partialScore;
        matchReasons.push(`Partial match: ${matchedWords.join(', ')}`);
      }
    }

    // === PRIORITY 2: Exact substring match in product name ===
    if (productNameLower.includes(queryLower)) {
      maxScore = Math.max(maxScore, 95);
      matchReasons.push(`Exact substring in name`);
    }

    // === PRIORITY 3: Original similarity matching ===
    // Match against product name
    const nameScore = textSimilarity(queryLower, product.name);
    if (nameScore > 50) {
      maxScore = Math.max(maxScore, nameScore);
      if (!matchReasons.some(r => r.includes('Name'))) {
        matchReasons.push(`Name match: ${product.name}`);
      }
    }

    // Match against brand
    const brandScore = textSimilarity(queryLower, product.brand);
    if (brandScore > 70) {
      maxScore = Math.max(maxScore, brandScore * 0.8);
      matchReasons.push(`Brand match: ${product.brand}`);
    }

    // Match against search keywords - IMPROVED: check for substring matches
    for (const keyword of product.searchKeywords) {
      const keywordLower = keyword.toLowerCase();

      // Exact keyword match
      if (queryLower.includes(keywordLower) || keywordLower.includes(queryLower)) {
        maxScore = Math.max(maxScore, 88);
        matchReasons.push(`Keyword exact: ${keyword}`);
      }

      // Fuzzy keyword match
      const keywordScore = textSimilarity(queryLower, keyword);
      if (keywordScore > 60) {
        maxScore = Math.max(maxScore, keywordScore * 0.9);
        matchReasons.push(`Keyword match: ${keyword}`);
      }
    }

    // Match against aliases
    if (product.aliases) {
      for (const alias of product.aliases) {
        const aliasLower = alias.toLowerCase();

        // Exact alias match
        if (queryLower.includes(aliasLower) || aliasLower.includes(queryLower)) {
          maxScore = Math.max(maxScore, 92);
          matchReasons.push(`Alias exact: ${alias}`);
        }

        const aliasScore = textSimilarity(queryLower, alias);
        if (aliasScore > 60) {
          maxScore = Math.max(maxScore, aliasScore * 0.95);
          matchReasons.push(`Alias match: ${alias}`);
        }
      }
    }

    // Match against model number
    if (product.modelNumber) {
      const modelScore = textSimilarity(queryLower, product.modelNumber);
      if (modelScore > 80) {
        maxScore = Math.max(maxScore, modelScore);
        matchReasons.push(`Model number match: ${product.modelNumber}`);
      }
    }

    // Combined brand + name search
    const fullScore = textSimilarity(queryLower, fullName);
    if (fullScore > 50) {
      maxScore = Math.max(maxScore, fullScore);
      if (!matchReasons.some(r => r.includes('Full name'))) {
        matchReasons.push(`Full name match`);
      }
    }

    if (maxScore > 40) {
      results.push({
        product,
        confidence: Math.round(maxScore),
        matchReasons,
      });
    }
  }

  // Sort by confidence and limit
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

// =============================================================================
// Visual Signature Search
// =============================================================================

/**
 * Calculate color similarity between two color arrays
 */
function colorSimilarity(colors1: string[], colors2: string[]): number {
  if (!colors1.length || !colors2.length) return 0;

  const set1 = new Set(colors1.map(c => c.toLowerCase()));
  const set2 = new Set(colors2.map(c => c.toLowerCase()));

  const intersection = Array.from(set1).filter(c => set2.has(c));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  return (intersection.length / union.size) * 100;
}

/**
 * Calculate design cue similarity
 */
function designCueSimilarity(cues1: string[], cues2: string[]): number {
  if (!cues1.length || !cues2.length) return 0;

  let matches = 0;
  for (const cue1 of cues1) {
    for (const cue2 of cues2) {
      if (textSimilarity(cue1, cue2) > 70) {
        matches++;
        break;
      }
    }
  }

  return (matches / Math.max(cues1.length, cues2.length)) * 100;
}

/**
 * Search products by visual signature
 */
export function searchByVisualSignature(
  products: Product[],
  signature: Partial<VisualSignature>,
  limit: number = 10
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const product of products) {
    let totalScore = 0;
    let factorCount = 0;
    const matchReasons: string[] = [];

    // Primary color matching
    if (signature.primaryColors?.length) {
      const colorScore = colorSimilarity(
        signature.primaryColors,
        product.visualSignature.primaryColors
      );
      if (colorScore > 0) {
        totalScore += colorScore * 0.3;
        factorCount++;
        matchReasons.push(`Primary colors match: ${colorScore.toFixed(0)}%`);
      }
    }

    // Pattern matching
    if (signature.patterns?.length) {
      const patternMatch = signature.patterns.some(p =>
        product.visualSignature.patterns.includes(p)
      );
      if (patternMatch) {
        totalScore += 80 * 0.2;
        factorCount++;
        matchReasons.push(`Pattern match`);
      }
    }

    // Design cue matching
    if (signature.designCues?.length) {
      const cueScore = designCueSimilarity(
        signature.designCues,
        product.visualSignature.designCues
      );
      if (cueScore > 0) {
        totalScore += cueScore * 0.3;
        factorCount++;
        matchReasons.push(`Design cues match: ${cueScore.toFixed(0)}%`);
      }
    }

    // Distinguishing features matching
    if (signature.distinguishingFeatures?.length) {
      const featureScore = designCueSimilarity(
        signature.distinguishingFeatures,
        product.visualSignature.distinguishingFeatures
      );
      if (featureScore > 0) {
        totalScore += featureScore * 0.2;
        factorCount++;
        matchReasons.push(`Features match: ${featureScore.toFixed(0)}%`);
      }
    }

    // Colorway name matching
    if (signature.colorwayName && product.visualSignature.colorwayName) {
      const colorwayScore = textSimilarity(
        signature.colorwayName,
        product.visualSignature.colorwayName
      );
      if (colorwayScore > 50) {
        totalScore += colorwayScore * 0.15;
        factorCount++;
        matchReasons.push(`Colorway match: ${product.visualSignature.colorwayName}`);
      }
    }

    if (factorCount > 0 && totalScore / factorCount > 30) {
      results.push({
        product,
        confidence: Math.round(totalScore / factorCount),
        matchReasons,
      });
    }
  }

  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

// =============================================================================
// Combined Search
// =============================================================================

/**
 * Search products using multiple criteria
 */
export function searchProducts(
  library: ProductLibrary,
  query: SearchQuery
): SearchResult[] {
  let products = library.brands.flatMap(brand => brand.products);

  // Apply filters
  if (query.brand) {
    const brandLower = query.brand.toLowerCase();
    products = products.filter(
      p =>
        p.brand.toLowerCase() === brandLower ||
        library.brands.find(b =>
          b.name.toLowerCase() === brandLower ||
          b.aliases.some(a => a.toLowerCase() === brandLower)
        )?.products.includes(p)
    );
  }

  if (query.yearRange) {
    products = products.filter(
      p =>
        p.releaseYear >= query.yearRange!.min &&
        p.releaseYear <= query.yearRange!.max
    );
  }

  if (query.priceRange) {
    products = products.filter(
      p =>
        p.msrp !== undefined &&
        p.msrp >= query.priceRange!.min &&
        p.msrp <= query.priceRange!.max
    );
  }

  // Text search
  let textResults: SearchResult[] = [];
  if (query.query) {
    textResults = searchByText(products, query.query, query.limit || 20);
  }

  // Visual signature search
  let visualResults: SearchResult[] = [];
  if (query.visualSignature) {
    visualResults = searchByVisualSignature(
      products,
      query.visualSignature,
      query.limit || 20
    );
  }

  // Combine results
  if (textResults.length && visualResults.length) {
    // Merge and boost products that appear in both
    const combined = new Map<string, SearchResult>();

    for (const result of textResults) {
      combined.set(result.product.id, result);
    }

    for (const result of visualResults) {
      const existing = combined.get(result.product.id);
      if (existing) {
        // Boost confidence for products matching both
        existing.confidence = Math.min(
          100,
          existing.confidence + result.confidence * 0.3
        );
        existing.matchReasons.push(...result.matchReasons);
      } else {
        combined.set(result.product.id, result);
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, query.limit || 10);
  }

  // Return whichever has results
  const results = textResults.length ? textResults : visualResults;

  // If no search criteria, return all products
  if (!query.query && !query.visualSignature) {
    return products.slice(0, query.limit || 10).map(product => ({
      product,
      confidence: 100,
      matchReasons: ['Direct match'],
    }));
  }

  return results.slice(0, query.limit || 10);
}

// =============================================================================
// Variant Search
// =============================================================================

/**
 * Find the best matching variant within a product
 */
export function findMatchingVariant(
  product: Product,
  query: {
    colorway?: string;
    specifications?: Record<string, string>;
  }
): { variant: ProductVariant; confidence: number } | null {
  let bestMatch: ProductVariant | null = null;
  let bestScore = 0;

  for (const variant of product.variants) {
    let score = 0;
    let factors = 0;

    // Colorway match
    if (query.colorway && variant.colorway) {
      const colorScore = textSimilarity(query.colorway, variant.colorway);
      score += colorScore;
      factors++;
    }

    // Specification matching
    if (query.specifications) {
      let specMatches = 0;
      let specTotal = 0;

      for (const [key, value] of Object.entries(query.specifications)) {
        if (variant.specifications[key]) {
          specTotal++;
          const specScore = textSimilarity(
            String(value),
            String(variant.specifications[key])
          );
          if (specScore > 70) specMatches++;
        }
      }

      if (specTotal > 0) {
        score += (specMatches / specTotal) * 100;
        factors++;
      }
    }

    const avgScore = factors > 0 ? score / factors : 0;
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestMatch = variant;
    }
  }

  if (bestMatch && bestScore > 50) {
    return { variant: bestMatch, confidence: Math.round(bestScore) };
  }

  return null;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all unique brands in a library
 */
export function getBrands(library: ProductLibrary): string[] {
  return library.brands.map(b => b.name).sort();
}

/**
 * Get all products from a specific brand
 */
export function getProductsByBrand(
  library: ProductLibrary,
  brandName: string
): Product[] {
  const brandLower = brandName.toLowerCase();
  const brand = library.brands.find(
    b =>
      b.name.toLowerCase() === brandLower ||
      b.aliases.some(a => a.toLowerCase() === brandLower)
  );
  return brand?.products || [];
}

/**
 * Get products by release year
 */
export function getProductsByYear(
  library: ProductLibrary,
  year: number
): Product[] {
  return library.brands.flatMap(b =>
    b.products.filter(p => p.releaseYear === year)
  );
}

/**
 * Get products by subcategory
 */
export function getProductsBySubcategory(
  library: ProductLibrary,
  subcategory: string
): Product[] {
  const subLower = subcategory.toLowerCase();
  return library.brands.flatMap(b =>
    b.products.filter(p => p.subcategory?.toLowerCase() === subLower)
  );
}
