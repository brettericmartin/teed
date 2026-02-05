/**
 * Product Library Search API
 *
 * Tier 1 Search: Fast local search against product library
 *
 * GET /api/products/search?q=Callaway+Elyte&category=golf&limit=10
 * POST /api/products/search { query: "Callaway Elyte", category: "golf", limit: 10 }
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartSearch, loadLibrary, getProductsByBrand } from '@/lib/productLibrary';
import type { Category, SearchResult } from '@/lib/productLibrary/schema';

interface SearchResponse {
  results: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    subcategory?: string;
    confidence: number;
    matchReasons: string[];
    description?: string;
    releaseYear?: number;
    msrp?: number;
    imageUrl?: string;
    productUrl?: string;
    variants?: Array<{
      sku: string;
      variantName: string;
      colorway?: string;
    }>;
  }>;
  total: number;
  query: string;
  searchedCategories: string[];
  relatedBrandProducts?: Array<{
    id: string;
    name: string;
    brand: string;
  }>;
}

/**
 * Detect brand from query
 */
function detectBrand(query: string): string | null {
  const knownBrands = [
    'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland', 'Bridgestone', 'Wilson',
    'Vice Golf', 'Kirkland', 'Bushnell', 'Garmin', 'Blue Tees', 'Travis Mathew', 'G/FORE', 'Peter Millar',
    'Charlotte Tilbury', 'MAC', 'Fenty Beauty', 'Rare Beauty', 'NARS', 'Urban Decay', 'Too Faced', 'Tarte', 'Glossier',
    'Apple', 'Samsung', 'Sony', 'Bose', 'Google', 'Microsoft', 'Dell', 'Lenovo', 'ASUS', 'LG',
    'Nike', 'Adidas', 'Patagonia', 'North Face', 'Arc\'teryx', 'Lululemon', 'Under Armour',
    'Canon', 'Nikon', 'Fujifilm', 'Leica', 'Hasselblad',
    'Benchmade', 'Spyderco', 'Chris Reeve', 'Leatherman', 'Victorinox',
  ];

  const queryLower = query.toLowerCase();

  for (const brand of knownBrands) {
    if (queryLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

/**
 * Detect category from query
 */
function detectCategory(query: string): Category | null {
  const queryLower = query.toLowerCase();

  const categoryPatterns: Partial<Record<Category, string[]>> = {
    golf: ['golf', 'driver', 'iron', 'wedge', 'putter', 'fairway', 'hybrid', 'taylormade', 'callaway', 'titleist', 'ping', 'cobra', 'mizuno'],
    beauty: ['makeup', 'beauty', 'lipstick', 'eyeshadow', 'foundation', 'mascara', 'blush', 'concealer', 'mac', 'nars', 'fenty', 'rare beauty'],
    skincare: ['serum', 'moisturizer', 'cleanser', 'toner', 'sunscreen', 'skincare'],
    tech: ['phone', 'laptop', 'tablet', 'airpods', 'computer', 'apple', 'samsung', 'google'],
    audio: ['headphones', 'earbuds', 'speaker', 'watch', 'sony', 'bose', 'soundbar'],
    fashion: ['shirt', 'pants', 'jacket', 'dress', 'blazer', 'suit'],
    footwear: ['shoes', 'sneakers', 'boots', 'nike', 'adidas', 'hoka'],
    outdoor: ['tent', 'sleeping bag', 'backpack', 'camping', 'hiking', 'kayak', 'patagonia'],
    photography: ['camera', 'lens', 'flash', 'tripod', 'canon', 'nikon', 'sony', 'fuji'],
    gaming: ['console', 'controller', 'playstation', 'xbox', 'nintendo', 'gaming'],
    music: ['guitar', 'piano', 'drum', 'amp', 'fender', 'gibson', 'instrument'],
    fitness: ['dumbbell', 'kettlebell', 'treadmill', 'peloton', 'fitness', 'gym'],
    activewear: ['leggings', 'sports bra', 'lululemon', 'athletic'],
    travel: ['luggage', 'suitcase', 'carry-on', 'away', 'rimowa', 'samsonite'],
    edc: ['knife', 'flashlight', 'wallet', 'pen', 'benchmade', 'spyderco', 'leatherman'],
    watches: ['watch', 'rolex', 'omega', 'seiko', 'chronograph'],
    cycling: ['bike', 'bicycle', 'cycling', 'trek', 'specialized'],
    snow: ['ski', 'snowboard', 'burton'],
  };

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => queryLower.includes(p))) {
      return category as Category;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') as Category | null;
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  return handleSearch(query, category, limit);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', category, limit = 10 } = body;

    return handleSearch(query, category, limit);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

async function handleSearch(
  query: string,
  category: Category | null,
  limit: number
): Promise<NextResponse<SearchResponse>> {
  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      results: [],
      total: 0,
      query,
      searchedCategories: [],
    });
  }

  const searchedCategories: string[] = [];

  // Auto-detect category if not provided
  const detectedCategory = category || detectCategory(query);
  const detectedBrand = detectBrand(query);

  // Perform search
  let results: SearchResult[] = [];

  if (detectedCategory) {
    searchedCategories.push(detectedCategory);
    results = smartSearch(query, { category: detectedCategory, limit });
  } else {
    // Search all categories
    results = smartSearch(query, { limit });
    // Note which categories were searched
    searchedCategories.push('all');
  }

  // Format results
  const formattedResults = results.map(r => ({
    id: r.product.id,
    name: r.product.name,
    brand: r.product.brand,
    category: r.product.category,
    subcategory: r.product.subcategory,
    confidence: r.confidence,
    matchReasons: r.matchReasons,
    description: r.product.description,
    releaseYear: r.product.releaseYear,
    msrp: r.product.msrp,
    imageUrl: r.product.referenceImages?.primary,
    productUrl: r.product.productUrl,
    variants: r.product.variants.slice(0, 5).map(v => ({
      sku: v.sku || r.product.id,
      variantName: v.variantName,
      colorway: v.colorway,
    })),
  }));

  // If no results but we detected a brand, get related products from that brand
  let relatedBrandProducts: Array<{ id: string; name: string; brand: string }> | undefined;

  if (results.length === 0 && detectedBrand && detectedCategory) {
    const library = loadLibrary(detectedCategory);
    if (library) {
      const brandProducts = getProductsByBrand(library, detectedBrand);
      relatedBrandProducts = brandProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
      }));
    }
  }

  return NextResponse.json({
    results: formattedResults,
    total: formattedResults.length,
    query,
    searchedCategories,
    relatedBrandProducts,
  });
}
