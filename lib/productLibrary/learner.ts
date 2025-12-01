/**
 * Product Library Learner
 *
 * Automatically adds new products to the library when AI provides
 * enrichment that the library didn't have. This creates a feedback
 * loop that improves the library over time.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { Product, ProductLibrary, Category } from './schema';

// Path to golf library (we can extend this to other categories later)
const LIBRARY_PATHS: Record<Category, string> = {
  golf: resolve(process.cwd(), 'lib/productLibrary/data/golf.json'),
  makeup: resolve(process.cwd(), 'lib/productLibrary/data/makeup.json'),
  tech: resolve(process.cwd(), 'lib/productLibrary/data/tech.json'),
  fashion: resolve(process.cwd(), 'lib/productLibrary/data/fashion.json'),
  outdoor: resolve(process.cwd(), 'lib/productLibrary/data/outdoor.json'),
  photography: resolve(process.cwd(), 'lib/productLibrary/data/photography.json'),
  gaming: resolve(process.cwd(), 'lib/productLibrary/data/gaming.json'),
  music: resolve(process.cwd(), 'lib/productLibrary/data/music.json'),
  fitness: resolve(process.cwd(), 'lib/productLibrary/data/fitness.json'),
  travel: resolve(process.cwd(), 'lib/productLibrary/data/travel.json'),
  edc: resolve(process.cwd(), 'lib/productLibrary/data/edc.json'),
};

// Minimum confidence for AI results to be added to library
const MIN_CONFIDENCE_FOR_LEARNING = 0.75;

// Track recently added products to avoid duplicates in same session
const recentlyAdded = new Set<string>();

export interface LearnableProduct {
  brand: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  confidence: number;
  source: 'ai' | 'web';
  releaseYear?: number;
  msrp?: number;
  productUrl?: string;
  imageUrl?: string;
}

/**
 * Check if a product already exists in the library
 */
function productExists(library: ProductLibrary, brand: string, name: string): boolean {
  const brandLower = brand.toLowerCase();
  const nameLower = name.toLowerCase();

  // Check recently added in this session
  const key = `${brandLower}-${nameLower}`;
  if (recentlyAdded.has(key)) {
    return true;
  }

  // Check library brands
  const existingBrand = library.brands.find(
    b => b.name.toLowerCase() === brandLower
  );

  if (!existingBrand) {
    return false;
  }

  // Check products in brand
  return existingBrand.products.some(p => {
    const pNameLower = p.name.toLowerCase();
    // Exact match
    if (pNameLower === nameLower) return true;
    // Close match (one contains the other)
    if (pNameLower.includes(nameLower) || nameLower.includes(pNameLower)) {
      // Only consider it a match if very similar
      const shorter = Math.min(pNameLower.length, nameLower.length);
      const longer = Math.max(pNameLower.length, nameLower.length);
      return shorter / longer > 0.7;
    }
    return false;
  });
}

/**
 * Create a product entry from AI result
 */
function createProductEntry(product: LearnableProduct): Product {
  const id = generateId(product.brand, product.name);

  return {
    id,
    name: product.name,
    brand: product.brand,
    category: mapCategory(product.category),
    subcategory: product.subcategory || detectSubcategory(product.name, product.category),
    releaseYear: product.releaseYear || new Date().getFullYear(),
    msrp: product.msrp,
    visualSignature: {
      primaryColors: ['black'],
      secondaryColors: ['silver'],
      patterns: ['solid'],
      finish: 'matte',
      designCues: [],
      distinguishingFeatures: [],
    },
    referenceImages: product.imageUrl
      ? { primary: product.imageUrl }
      : { primary: '' },
    specifications: {},
    description: product.description || `${product.brand} ${product.name}`,
    searchKeywords: generateSearchKeywords(product.brand, product.name),
    aliases: [],
    variants: [
      {
        sku: id,
        variantName: 'Standard',
        colorway: 'Default',
        availability: 'current',
        specifications: {},
      },
    ],
    productUrl: product.productUrl,
    lastUpdated: new Date().toISOString(),
    source: 'ai',
    dataConfidence: Math.round(product.confidence * 100),
  };
}

function generateId(brand: string, name: string): string {
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${cleanBrand}-${cleanName}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function mapCategory(category: string): Category {
  const mapping: Record<string, Category> = {
    'golf': 'golf',
    'golf equipment': 'golf',
    'makeup': 'makeup',
    'cosmetics': 'makeup',
    'beauty': 'makeup',
    'tech': 'tech',
    'technology': 'tech',
    'electronics': 'tech',
    'fashion': 'fashion',
    'clothing': 'fashion',
    'outdoor': 'outdoor',
    'photography': 'photography',
    'gaming': 'gaming',
    'music': 'music',
    'fitness': 'fitness',
    'travel': 'travel',
    'edc': 'edc',
  };

  return mapping[category.toLowerCase()] || 'golf';
}

function detectSubcategory(name: string, category: string): string {
  const nameLower = name.toLowerCase();

  if (category.toLowerCase().includes('golf')) {
    if (nameLower.includes('driver')) return 'drivers';
    if (nameLower.includes('fairway') || nameLower.includes('wood')) return 'fairway-woods';
    if (nameLower.includes('hybrid') || nameLower.includes('rescue')) return 'hybrids';
    if (nameLower.includes('iron')) return 'irons';
    if (nameLower.includes('wedge')) return 'wedges';
    if (nameLower.includes('putter')) return 'putters';
    if (nameLower.includes('ball')) return 'golf-balls';
  }

  return 'other';
}

function generateSearchKeywords(brand: string, name: string): string[] {
  const keywords = new Set<string>();

  // Add brand variations
  keywords.add(brand.toLowerCase());

  // Add name words
  const nameWords = name.toLowerCase().split(/\s+/);
  for (const word of nameWords) {
    if (word.length > 2) {
      keywords.add(word);
    }
  }

  // Add full name
  keywords.add(name.toLowerCase());

  return Array.from(keywords);
}

/**
 * Learn a new product from AI enrichment
 *
 * Returns true if product was added, false if skipped (already exists or low confidence)
 */
export async function learnProduct(product: LearnableProduct): Promise<{
  added: boolean;
  reason: string;
}> {
  // Check confidence threshold
  if (product.confidence < MIN_CONFIDENCE_FOR_LEARNING) {
    return {
      added: false,
      reason: `Confidence too low: ${product.confidence} < ${MIN_CONFIDENCE_FOR_LEARNING}`,
    };
  }

  // Validate required fields
  if (!product.brand || !product.name) {
    return {
      added: false,
      reason: 'Missing brand or name',
    };
  }

  // Determine category
  const category = mapCategory(product.category);
  const libraryPath = LIBRARY_PATHS[category];

  if (!libraryPath || !existsSync(libraryPath)) {
    return {
      added: false,
      reason: `No library for category: ${category}`,
    };
  }

  try {
    // Load library
    const library: ProductLibrary = JSON.parse(readFileSync(libraryPath, 'utf-8'));

    // Check for duplicates
    if (productExists(library, product.brand, product.name)) {
      return {
        added: false,
        reason: 'Product already exists in library',
      };
    }

    // Find or create brand
    let brand = library.brands.find(
      b => b.name.toLowerCase() === product.brand.toLowerCase()
    );

    if (!brand) {
      brand = {
        name: product.brand,
        aliases: [],
        products: [],
        lastUpdated: new Date().toISOString(),
      };
      library.brands.push(brand);
    }

    // Create and add product
    const productEntry = createProductEntry(product);
    brand.products.push(productEntry);
    brand.lastUpdated = new Date().toISOString();

    // Update library counts
    library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
    library.variantCount = library.brands.reduce(
      (sum, b) => sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0),
      0
    );
    library.lastUpdated = new Date().toISOString();

    // Save library
    writeFileSync(libraryPath, JSON.stringify(library, null, 2));

    // Track in session
    recentlyAdded.add(`${product.brand.toLowerCase()}-${product.name.toLowerCase()}`);

    console.log(`[Learner] Added: ${product.brand} ${product.name} to ${category} library`);

    return {
      added: true,
      reason: `Added to ${category} library`,
    };
  } catch (error) {
    console.error('[Learner] Error adding product:', error);
    return {
      added: false,
      reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Learn multiple products from a batch
 */
export async function learnProducts(products: LearnableProduct[]): Promise<{
  added: number;
  skipped: number;
  details: Array<{ product: string; added: boolean; reason: string }>;
}> {
  const details: Array<{ product: string; added: boolean; reason: string }> = [];
  let added = 0;
  let skipped = 0;

  for (const product of products) {
    const result = await learnProduct(product);
    details.push({
      product: `${product.brand} ${product.name}`,
      ...result,
    });

    if (result.added) {
      added++;
    } else {
      skipped++;
    }
  }

  return { added, skipped, details };
}
