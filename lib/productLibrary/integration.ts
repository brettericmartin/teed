/**
 * Product Library Integration
 *
 * Connects the product library to AI identification workflows:
 * 1. Enhances AI prompts with product catalog data
 * 2. Validates/matches AI results against the library
 * 3. Provides feedback loop for library improvement
 */

import type {
  Category,
  Product,
  ProductLibrary,
  SearchResult,
  VisualSignature,
} from './schema';
import {
  loadLibrary,
  searchAllCategories,
  smartSearch,
  getProductsForContext,
} from './index';
import { searchByVisualSignature, searchByText } from './search';
import type { IdentifiedProduct } from '../ai';

// =============================================================================
// Types
// =============================================================================

export interface LibraryMatchResult {
  /** Original AI identification */
  aiResult: IdentifiedProduct;
  /** Best matching product from library */
  libraryMatch: Product | null;
  /** Match confidence (0-100) */
  matchConfidence: number;
  /** Why this matched */
  matchReasons: string[];
  /** Whether AI result was validated by library */
  validated: boolean;
  /** Suggested corrections from library */
  corrections?: {
    name?: string;
    brand?: string;
    modelNumber?: string;
  };
}

export interface EnhancedIdentificationContext {
  /** Product context for AI prompt injection */
  productContext: string;
  /** Number of products included */
  productCount: number;
  /** Categories covered */
  categories: Category[];
}

// =============================================================================
// AI Prompt Enhancement
// =============================================================================

/**
 * Generate product library context for AI prompts
 *
 * This supplements the brandKnowledge with actual product catalog data,
 * giving the AI specific products to match against.
 */
export function generateProductLibraryContext(
  categories: Category[],
  options: {
    maxProductsPerCategory?: number;
    includeVariants?: boolean;
    focusBrands?: string[];
  } = {}
): EnhancedIdentificationContext {
  const maxProducts = options.maxProductsPerCategory || 15;
  const sections: string[] = [];
  let totalProducts = 0;
  const coveredCategories: Category[] = [];

  for (const category of categories) {
    const library = loadLibrary(category);
    if (!library || library.brands.length === 0) continue;

    coveredCategories.push(category);
    const categorySection = formatCategoryProducts(library, {
      maxProducts,
      focusBrands: options.focusBrands,
      includeVariants: options.includeVariants,
    });

    if (categorySection.content) {
      sections.push(categorySection.content);
      totalProducts += categorySection.count;
    }
  }

  if (sections.length === 0) {
    return {
      productContext: '',
      productCount: 0,
      categories: [],
    };
  }

  const productContext = `
═══════════════════════════════════════════════════════════════
PRODUCT CATALOG REFERENCE
═══════════════════════════════════════════════════════════════
Use this catalog to match products. If you identify a product that matches
one in the catalog, use the EXACT name and details from the catalog.

${sections.join('\n\n')}
═══════════════════════════════════════════════════════════════
`;

  return {
    productContext,
    productCount: totalProducts,
    categories: coveredCategories,
  };
}

/**
 * Format products from a category for context injection
 */
function formatCategoryProducts(
  library: ProductLibrary,
  options: {
    maxProducts: number;
    focusBrands?: string[];
    includeVariants?: boolean;
  }
): { content: string; count: number } {
  const lines: string[] = [];
  lines.push(`### ${library.category.toUpperCase()} PRODUCTS ###`);

  let productCount = 0;
  const brandsToInclude = options.focusBrands
    ? library.brands.filter(b =>
        options.focusBrands!.some(
          fb => fb.toLowerCase() === b.name.toLowerCase()
        )
      )
    : library.brands;

  for (const brand of brandsToInclude) {
    if (productCount >= options.maxProducts) break;

    const productsToShow = brand.products.slice(
      0,
      options.maxProducts - productCount
    );
    if (productsToShow.length === 0) continue;

    lines.push(`\n**${brand.name}**`);

    for (const product of productsToShow) {
      productCount++;
      lines.push(formatProductForContext(product, options.includeVariants));
    }
  }

  return {
    content: lines.join('\n'),
    count: productCount,
  };
}

/**
 * Format a single product for context
 */
function formatProductForContext(
  product: Product,
  includeVariants?: boolean
): string {
  const lines: string[] = [];

  // Product header
  lines.push(`  • ${product.name} (${product.releaseYear})`);

  // Visual signature
  const vs = product.visualSignature;
  lines.push(`    Colors: ${vs.primaryColors.join(', ')}`);
  if (vs.colorwayName) {
    lines.push(`    Colorway: ${vs.colorwayName}`);
  }
  if (vs.designCues.length > 0) {
    lines.push(`    Design: ${vs.designCues.slice(0, 3).join(', ')}`);
  }
  if (vs.distinguishingFeatures.length > 0) {
    lines.push(`    Identify by: ${vs.distinguishingFeatures.slice(0, 2).join('; ')}`);
  }

  // Variants (abbreviated)
  if (includeVariants && product.variants.length > 0) {
    const variantNames = product.variants
      .slice(0, 3)
      .map(v => v.colorway || v.variantName)
      .filter(Boolean);
    if (variantNames.length > 0) {
      lines.push(`    Variants: ${variantNames.join(', ')}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Post-Identification Matching
// =============================================================================

/**
 * Match AI identification results against the product library
 *
 * This validates AI results and provides corrections where the library
 * has more accurate data.
 */
export function matchAgainstLibrary(
  aiResults: IdentifiedProduct[],
  options: {
    confidenceThreshold?: number;
    autoCorrect?: boolean;
  } = {}
): LibraryMatchResult[] {
  const threshold = options.confidenceThreshold || 60;

  return aiResults.map(aiResult => {
    const matchResult = findBestLibraryMatch(aiResult);

    const result: LibraryMatchResult = {
      aiResult,
      libraryMatch: matchResult?.product || null,
      matchConfidence: matchResult?.confidence || 0,
      matchReasons: matchResult?.matchReasons || [],
      validated: false,
    };

    // Determine if validated
    if (matchResult && matchResult.confidence >= threshold) {
      result.validated = true;

      // Check for corrections
      if (options.autoCorrect) {
        const corrections: LibraryMatchResult['corrections'] = {};

        if (
          matchResult.product.name.toLowerCase() !==
          aiResult.name.toLowerCase()
        ) {
          corrections.name = matchResult.product.name;
        }
        if (
          matchResult.product.brand &&
          matchResult.product.brand.toLowerCase() !==
            aiResult.brand?.toLowerCase()
        ) {
          corrections.brand = matchResult.product.brand;
        }
        if (
          matchResult.product.modelNumber &&
          matchResult.product.modelNumber !== aiResult.modelNumber
        ) {
          corrections.modelNumber = matchResult.product.modelNumber;
        }

        if (Object.keys(corrections).length > 0) {
          result.corrections = corrections;
        }
      }
    }

    return result;
  });
}

/**
 * Find the best matching product in the library for an AI result
 */
function findBestLibraryMatch(
  aiResult: IdentifiedProduct
): SearchResult | null {
  // Build search query from AI result
  const searchQuery = `${aiResult.brand || ''} ${aiResult.name}`.trim();

  // Try text-based search first
  const textResults = smartSearch(searchQuery, {
    category: mapToLibraryCategory(aiResult.category),
    limit: 5,
  });

  if (textResults.length > 0 && textResults[0].confidence >= 70) {
    return textResults[0];
  }

  // Try visual signature search if we have color data
  if (aiResult.colors || aiResult.brandSignature) {
    const visualSignature: Partial<VisualSignature> = {};

    if (aiResult.colors?.primary) {
      visualSignature.primaryColors = [aiResult.colors.primary];
      if (aiResult.colors.secondary) {
        visualSignature.primaryColors.push(aiResult.colors.secondary);
      }
    }

    if (aiResult.brandSignature?.designCues) {
      visualSignature.designCues = aiResult.brandSignature.designCues;
    }

    if (aiResult.colors?.colorway) {
      visualSignature.colorwayName = aiResult.colors.colorway;
    }

    const category = mapToLibraryCategory(aiResult.category);
    if (category) {
      const library = loadLibrary(category);
      if (library) {
        const allProducts = library.brands.flatMap(b => b.products);
        const visualResults = searchByVisualSignature(
          allProducts,
          visualSignature,
          5
        );

        // Combine text and visual results
        if (visualResults.length > 0) {
          // Boost results that appear in both
          for (const vr of visualResults) {
            const textMatch = textResults.find(
              tr => tr.product.id === vr.product.id
            );
            if (textMatch) {
              // Found in both - high confidence
              return {
                product: vr.product,
                confidence: Math.min(
                  100,
                  textMatch.confidence + vr.confidence * 0.3
                ),
                matchReasons: [
                  ...textMatch.matchReasons,
                  ...vr.matchReasons,
                ],
              };
            }
          }

          // Return best visual match if no text match
          if (
            visualResults[0].confidence > (textResults[0]?.confidence || 0)
          ) {
            return visualResults[0];
          }
        }
      }
    }
  }

  // Return best text result if any
  return textResults[0] || null;
}

/**
 * Map AI category to library category
 */
function mapToLibraryCategory(aiCategory: string): Category | undefined {
  const mapping: Record<string, Category> = {
    golf: 'golf',
    'golf clubs': 'golf',
    tech: 'tech',
    technology: 'tech',
    electronics: 'tech',
    outdoor: 'outdoor',
    camping: 'outdoor',
    hiking: 'outdoor',
    fashion: 'fashion',
    clothing: 'fashion',
    makeup: 'makeup',
    cosmetics: 'makeup',
    photography: 'photography',
    camera: 'photography',
    gaming: 'gaming',
    music: 'music',
    audio: 'music',
    fitness: 'fitness',
    sports: 'fitness',
    travel: 'travel',
    luggage: 'travel',
    edc: 'edc',
  };

  return mapping[aiCategory.toLowerCase()];
}

// =============================================================================
// Feedback Loop
// =============================================================================

export interface IdentificationFeedback {
  /** Original AI identification */
  aiResult: IdentifiedProduct;
  /** User correction (if any) */
  userCorrection?: {
    name: string;
    brand?: string;
    category?: string;
  };
  /** Was this identification accepted by user? */
  accepted: boolean;
  /** Source image for future training */
  sourceImageHash?: string;
}

/**
 * Process identification feedback to improve the library
 *
 * This creates suggestions for new products to add to the library
 * based on patterns in user feedback.
 */
export function processIdentificationFeedback(
  feedback: IdentificationFeedback[]
): {
  suggestedProducts: Array<{
    name: string;
    brand: string;
    category: Category;
    occurrences: number;
    confidence: number;
  }>;
  libraryGaps: Array<{
    category: Category;
    missingBrands: string[];
    missingProducts: string[];
  }>;
} {
  const productCounts = new Map<
    string,
    {
      name: string;
      brand: string;
      category: string;
      count: number;
      totalConfidence: number;
    }
  >();

  const categoryGaps = new Map<
    string,
    { brands: Set<string>; products: Set<string> }
  >();

  for (const fb of feedback) {
    const name = fb.userCorrection?.name || fb.aiResult.name;
    const brand = fb.userCorrection?.brand || fb.aiResult.brand || 'Unknown';
    const category = fb.userCorrection?.category || fb.aiResult.category;

    const key = `${brand}|${name}`.toLowerCase();

    // Count occurrences
    const existing = productCounts.get(key);
    if (existing) {
      existing.count++;
      existing.totalConfidence += fb.aiResult.confidence;
    } else {
      productCounts.set(key, {
        name,
        brand,
        category,
        count: 1,
        totalConfidence: fb.aiResult.confidence,
      });
    }

    // Track gaps if not in library
    const libraryCategory = mapToLibraryCategory(category);
    if (libraryCategory) {
      const library = loadLibrary(libraryCategory);
      if (library) {
        const brandExists = library.brands.some(
          b => b.name.toLowerCase() === brand.toLowerCase()
        );
        const productExists = library.brands.some(b =>
          b.products.some(
            p =>
              p.name.toLowerCase() === name.toLowerCase() ||
              p.aliases?.some(a => a.toLowerCase() === name.toLowerCase())
          )
        );

        if (!brandExists || !productExists) {
          let gaps = categoryGaps.get(libraryCategory);
          if (!gaps) {
            gaps = { brands: new Set(), products: new Set() };
            categoryGaps.set(libraryCategory, gaps);
          }

          if (!brandExists) {
            gaps.brands.add(brand);
          }
          if (!productExists) {
            gaps.products.add(`${brand} ${name}`);
          }
        }
      }
    }
  }

  // Convert to output format
  const suggestedProducts = Array.from(productCounts.values())
    .filter(p => p.count >= 2) // Only suggest products seen multiple times
    .map(p => ({
      name: p.name,
      brand: p.brand,
      category: mapToLibraryCategory(p.category) || ('other' as Category),
      occurrences: p.count,
      confidence: Math.round(p.totalConfidence / p.count),
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const libraryGaps = Array.from(categoryGaps.entries()).map(
    ([category, gaps]) => ({
      category: category as Category,
      missingBrands: Array.from(gaps.brands),
      missingProducts: Array.from(gaps.products),
    })
  );

  return { suggestedProducts, libraryGaps };
}

// =============================================================================
// Combined Context Generation
// =============================================================================

/**
 * Generate combined context for AI identification
 *
 * This merges brand knowledge with product library data for optimal
 * identification accuracy.
 */
export function generateCombinedContext(
  categories: string[]
): {
  brandContext: string;
  productContext: string;
  totalTokensEstimate: number;
} {
  // Import brand knowledge generator
  const { generateBrandContext } = require('../brandKnowledge');

  // Get brand context (static knowledge)
  const brandContext = generateBrandContext(categories, 'standard');

  // Get product library context (catalog data)
  const libraryCategories = categories
    .map(c => mapToLibraryCategory(c))
    .filter((c): c is Category => c !== undefined);

  const productLibraryContext = generateProductLibraryContext(
    libraryCategories,
    { maxProductsPerCategory: 10 }
  );

  // Estimate tokens (rough: 4 chars per token)
  const totalChars =
    brandContext.length + productLibraryContext.productContext.length;
  const totalTokensEstimate = Math.ceil(totalChars / 4);

  return {
    brandContext,
    productContext: productLibraryContext.productContext,
    totalTokensEstimate,
  };
}
