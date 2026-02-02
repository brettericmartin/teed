/**
 * Product Library Learner
 *
 * Automatically adds new products to the library when AI provides
 * enrichment that the library didn't have. This creates a feedback
 * loop that improves the library over time.
 *
 * Storage: Supabase learned_products table
 */

import { createClient } from '@supabase/supabase-js';
import type { Category } from './schema';

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
  specifications?: Record<string, unknown>;
}

// Create Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Check if a product already exists in learned_products
 */
async function productExistsInDatabase(brand: string, name: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('learned_products')
    .select('id')
    .ilike('brand', brand)
    .ilike('name', name)
    .limit(1);

  if (error) {
    console.error('[Learner] Error checking existence:', error);
    return false;
  }

  return data && data.length > 0;
}

function mapCategory(category: string): Category {
  const mapping: Record<string, Category> = {
    'golf': 'golf',
    'golf equipment': 'golf',
    'makeup': 'makeup',
    'cosmetics': 'makeup',
    'beauty': 'beauty',
    'tech': 'tech',
    'technology': 'tech',
    'electronics': 'tech',
    'fashion': 'fashion',
    'clothing': 'fashion',
    'apparel': 'apparel',
    'outdoor': 'outdoor',
    'photography': 'photography',
    'gaming': 'gaming',
    'music': 'music',
    'fitness': 'fitness',
    'travel': 'travel',
    'edc': 'edc',
    'audio': 'audio',
    'watches': 'watches',
    'home': 'home',
    'kitchen': 'kitchen',
    'skincare': 'skincare',
    'haircare': 'haircare',
  };

  return mapping[category.toLowerCase()] || 'other';
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

  // Add brand + name combo
  keywords.add(`${brand} ${name}`.toLowerCase());

  return Array.from(keywords);
}

/**
 * Learn a new product from AI enrichment
 *
 * Stores in Supabase learned_products table.
 * Returns true if product was added, false if skipped.
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

  // Check session cache first
  const key = `${product.brand.toLowerCase()}-${product.name.toLowerCase()}`;
  if (recentlyAdded.has(key)) {
    return {
      added: false,
      reason: 'Already added in this session',
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      added: false,
      reason: 'Supabase not configured',
    };
  }

  try {
    // Check if already exists in database
    const exists = await productExistsInDatabase(product.brand, product.name);
    if (exists) {
      // Update occurrence count for existing product
      const { error: updateError } = await supabase
        .from('learned_products')
        .update({
          last_seen_at: new Date().toISOString(),
          // occurrence_count is auto-incremented by trigger
        })
        .ilike('brand', product.brand)
        .ilike('name', product.name);

      if (updateError) {
        console.error('[Learner] Error updating occurrence:', updateError);
      }

      return {
        added: false,
        reason: 'Product already exists, updated occurrence count',
      };
    }

    // Determine category
    const category = mapCategory(product.category);
    const subcategory = product.subcategory || detectSubcategory(product.name, product.category);
    const searchKeywords = generateSearchKeywords(product.brand, product.name);

    // Insert new product
    const { error } = await supabase
      .from('learned_products')
      .insert({
        brand: product.brand,
        name: product.name,
        category,
        subcategory,
        description: product.description || `${product.brand} ${product.name}`,
        image_url: product.imageUrl,
        product_url: product.productUrl,
        price: product.msrp ? `$${product.msrp}` : null,
        release_year: product.releaseYear || new Date().getFullYear(),
        source: product.source === 'ai' ? 'ai_enrichment' : 'web_scrape',
        confidence: product.confidence,
        specifications: product.specifications || {},
        search_keywords: searchKeywords,
        aliases: [],
      });

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        return {
          added: false,
          reason: 'Product already exists (concurrent insert)',
        };
      }

      console.error('[Learner] Error inserting product:', error);
      return {
        added: false,
        reason: `Database error: ${error.message}`,
      };
    }

    // Track in session cache
    recentlyAdded.add(key);

    console.log(`[Learner] Added: ${product.brand} ${product.name} to learned_products`);

    return {
      added: true,
      reason: 'Added to learned_products',
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

/**
 * Search learned products by query
 * Used by smartSearch to merge with static library results
 */
export async function searchLearnedProducts(
  query: string,
  category?: Category,
  limit: number = 10
): Promise<Array<{
  brand: string;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  confidence: number;
  occurrenceCount: number;
}>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  try {
    let queryBuilder = supabase
      .from('learned_products')
      .select('brand, name, category, description, image_url, confidence, occurrence_count')
      .order('occurrence_count', { ascending: false })
      .limit(limit);

    // Add category filter if provided
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Add text search
    // Use ilike for simple matching (could be upgraded to full-text search)
    const searchTerms = query.toLowerCase().split(/\s+/);
    for (const term of searchTerms) {
      if (term.length >= 2) {
        queryBuilder = queryBuilder.or(`brand.ilike.%${term}%,name.ilike.%${term}%,search_keywords.cs.{${term}}`);
      }
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('[Learner] Search error:', error);
      return [];
    }

    return (data || []).map(row => ({
      brand: row.brand,
      name: row.name,
      category: row.category,
      description: row.description,
      imageUrl: row.image_url,
      confidence: row.confidence,
      occurrenceCount: row.occurrence_count,
    }));
  } catch (error) {
    console.error('[Learner] Search error:', error);
    return [];
  }
}

/**
 * Get stats about learned products
 */
export async function getLearnedProductStats(): Promise<{
  totalProducts: number;
  byCategory: Record<string, number>;
  topBrands: Array<{ brand: string; count: number }>;
} | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    // Get total count
    const { count } = await supabase
      .from('learned_products')
      .select('*', { count: 'exact', head: true });

    // Get by category
    const { data: categoryData } = await supabase
      .from('learned_products')
      .select('category');

    const byCategory: Record<string, number> = {};
    for (const row of categoryData || []) {
      byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    }

    // Get top brands
    const { data: brandData } = await supabase
      .from('learned_products')
      .select('brand')
      .order('occurrence_count', { ascending: false });

    const brandCounts: Record<string, number> = {};
    for (const row of brandData || []) {
      brandCounts[row.brand] = (brandCounts[row.brand] || 0) + 1;
    }

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({ brand, count }));

    return {
      totalProducts: count || 0,
      byCategory,
      topBrands,
    };
  } catch (error) {
    console.error('[Learner] Stats error:', error);
    return null;
  }
}
