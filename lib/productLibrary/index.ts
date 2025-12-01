/**
 * Product Library
 *
 * Main entry point for the product library system.
 * Provides functions to load, search, and manage product catalogs.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import type {
  Category,
  Product,
  ProductLibrary,
  SearchQuery,
  SearchResult,
  BrandCatalog,
} from './schema';
import {
  searchProducts,
  searchByText,
  searchByVisualSignature,
  getBrands,
  getProductsByBrand,
  getProductsByYear,
  getProductsBySubcategory,
} from './search';

// Re-export types and search utilities
export * from './schema';
export * from './search';

// =============================================================================
// Library Loading
// =============================================================================

const DATA_DIR = join(process.cwd(), 'lib', 'productLibrary', 'data');

const libraryCache = new Map<Category, ProductLibrary>();

/**
 * Load a product library for a specific category
 */
export function loadLibrary(category: Category): ProductLibrary | null {
  // Check cache first
  if (libraryCache.has(category)) {
    return libraryCache.get(category)!;
  }

  const filePath = join(DATA_DIR, `${category}.json`);

  if (!existsSync(filePath)) {
    console.log(`[ProductLibrary] No data file for category: ${category}`);
    return null;
  }

  try {
    const data = readFileSync(filePath, 'utf-8');
    const library = JSON.parse(data) as ProductLibrary;

    // Validate schema version
    if (!library.schemaVersion) {
      console.warn(`[ProductLibrary] Missing schema version for ${category}`);
    }

    libraryCache.set(category, library);
    return library;
  } catch (error) {
    console.error(`[ProductLibrary] Error loading ${category}:`, error);
    return null;
  }
}

/**
 * Load all product libraries
 */
export function loadAllLibraries(): Map<Category, ProductLibrary> {
  const categories: Category[] = [
    'golf',
    'tech',
    'fashion',
    'makeup',
    'outdoor',
    'photography',
    'gaming',
    'music',
    'fitness',
    'travel',
    'edc',
  ];

  const libraries = new Map<Category, ProductLibrary>();

  for (const category of categories) {
    const library = loadLibrary(category);
    if (library) {
      libraries.set(category, library);
    }
  }

  return libraries;
}

/**
 * Clear the library cache (useful for reloading)
 */
export function clearCache(): void {
  libraryCache.clear();
}

// =============================================================================
// Cross-Category Search
// =============================================================================

/**
 * Search across all categories
 */
export function searchAllCategories(
  query: SearchQuery
): Map<Category, SearchResult[]> {
  const libraries = loadAllLibraries();
  const results = new Map<Category, SearchResult[]>();

  for (const entry of Array.from(libraries.entries())) {
    const [category, library] = entry;
    if (query.category && query.category !== category) {
      continue;
    }

    const categoryResults = searchProducts(library, query);
    if (categoryResults.length > 0) {
      results.set(category, categoryResults);
    }
  }

  return results;
}

/**
 * Search with automatic category detection
 */
export function smartSearch(
  query: string,
  options?: {
    category?: Category;
    limit?: number;
    includeVariants?: boolean;
  }
): SearchResult[] {
  const searchQuery: SearchQuery = {
    query,
    category: options?.category,
    limit: options?.limit || 10,
  };

  if (options?.category) {
    const library = loadLibrary(options.category);
    if (!library) return [];
    return searchProducts(library, searchQuery);
  }

  // Search all categories and merge results
  const allResults = searchAllCategories(searchQuery);
  const merged: SearchResult[] = [];

  for (const entry of Array.from(allResults.entries())) {
    const [_category, results] = entry;
    merged.push(...results);
  }

  return merged
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, options?.limit || 10);
}

// =============================================================================
// Library Management
// =============================================================================

/**
 * Save a product library to disk
 */
export function saveLibrary(library: ProductLibrary): void {
  const filePath = join(DATA_DIR, `${library.category}.json`);

  // Update metadata
  library.lastUpdated = new Date().toISOString();
  library.productCount = library.brands.reduce(
    (sum, brand) => sum + brand.products.length,
    0
  );
  library.variantCount = library.brands.reduce(
    (sum, brand) =>
      sum +
      brand.products.reduce((pSum, product) => pSum + product.variants.length, 0),
    0
  );

  const json = JSON.stringify(library, null, 2);
  writeFileSync(filePath, json, 'utf-8');

  // Update cache
  libraryCache.set(library.category, library);

  console.log(
    `[ProductLibrary] Saved ${library.category}: ${library.productCount} products, ${library.variantCount} variants`
  );
}

/**
 * Add a brand to a library
 */
export function addBrand(
  category: Category,
  brand: BrandCatalog
): ProductLibrary {
  let library = loadLibrary(category);

  if (!library) {
    // Create new library
    library = {
      category,
      schemaVersion: '1.0.0',
      lastUpdated: new Date().toISOString(),
      brands: [],
      productCount: 0,
      variantCount: 0,
    };
  }

  // Check if brand already exists
  const existingIndex = library.brands.findIndex(
    b => b.name.toLowerCase() === brand.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Merge products
    const existing = library.brands[existingIndex];
    const newProductIds = new Set(brand.products.map(p => p.id));
    const existingProducts = existing.products.filter(
      p => !newProductIds.has(p.id)
    );
    existing.products = [...existingProducts, ...brand.products];
    existing.lastUpdated = new Date().toISOString();
  } else {
    library.brands.push(brand);
  }

  saveLibrary(library);
  return library;
}

/**
 * Add a product to a brand in a library
 */
export function addProduct(
  category: Category,
  brandName: string,
  product: Product
): void {
  const library = loadLibrary(category);
  if (!library) {
    throw new Error(`Library not found for category: ${category}`);
  }

  const brand = library.brands.find(
    b => b.name.toLowerCase() === brandName.toLowerCase()
  );

  if (!brand) {
    throw new Error(`Brand not found: ${brandName}`);
  }

  // Check for existing product
  const existingIndex = brand.products.findIndex(p => p.id === product.id);
  if (existingIndex >= 0) {
    brand.products[existingIndex] = product;
  } else {
    brand.products.push(product);
  }

  saveLibrary(library);
}

// =============================================================================
// Statistics
// =============================================================================

export interface LibraryStats {
  category: Category;
  brandCount: number;
  productCount: number;
  variantCount: number;
  yearRange: { min: number; max: number };
  lastUpdated: string;
}

/**
 * Get statistics for a library
 */
export function getLibraryStats(category: Category): LibraryStats | null {
  const library = loadLibrary(category);
  if (!library) return null;

  const allProducts = library.brands.flatMap(b => b.products);
  const years = allProducts.map(p => p.releaseYear).filter(y => y > 0);

  return {
    category,
    brandCount: library.brands.length,
    productCount: library.productCount,
    variantCount: library.variantCount,
    yearRange: {
      min: years.length ? Math.min(...years) : 0,
      max: years.length ? Math.max(...years) : 0,
    },
    lastUpdated: library.lastUpdated,
  };
}

/**
 * Get statistics for all libraries
 */
export function getAllStats(): LibraryStats[] {
  const categories: Category[] = [
    'golf',
    'tech',
    'fashion',
    'makeup',
    'outdoor',
    'photography',
    'gaming',
    'music',
    'fitness',
    'travel',
    'edc',
  ];

  return categories
    .map(getLibraryStats)
    .filter((s): s is LibraryStats => s !== null);
}

// =============================================================================
// Integration Helpers
// =============================================================================

/**
 * Find product by ID across all libraries
 */
export function findProductById(productId: string): Product | null {
  const libraries = loadAllLibraries();

  for (const entry of Array.from(libraries.entries())) {
    const [_category, library] = entry;
    for (const brand of library.brands) {
      const product = brand.products.find(p => p.id === productId);
      if (product) return product;
    }
  }

  return null;
}

/**
 * Simplified product for AI context
 */
export interface ProductContext {
  name: string;
  brand: string;
  subcategory?: string;
  releaseYear: number;
  primaryColors: string[];
  designCues: string[];
  searchKeywords: string[];
}

/**
 * Get products for AI context generation
 * Returns a subset of products suitable for including in AI prompts
 */
export function getProductsForContext(
  category: Category,
  brandName?: string,
  limit: number = 20
): ProductContext[] {
  const library = loadLibrary(category);
  if (!library) return [];

  let products = library.brands.flatMap(b => b.products);

  if (brandName) {
    products = getProductsByBrand(library, brandName);
  }

  // Return simplified product info for context
  return products.slice(0, limit).map(p => ({
    name: p.name,
    brand: p.brand,
    subcategory: p.subcategory,
    releaseYear: p.releaseYear,
    primaryColors: p.visualSignature.primaryColors,
    designCues: p.visualSignature.designCues.slice(0, 3),
    searchKeywords: p.searchKeywords.slice(0, 5),
  }));
}
