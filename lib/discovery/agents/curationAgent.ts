/**
 * Curation Agent
 *
 * Converts research results into published bags with complete item details.
 * Handles product matching, image acquisition, and link generation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { identifyProduct } from '@/lib/linkIdentification';
import { findBestProductLinks } from '@/lib/services/SmartLinkFinder';
import { searchGoogleImages } from '@/lib/linkIdentification/googleImageSearch';
import { scrapeWithFirecrawl } from '@/lib/linkIdentification/firecrawl';
import { fetchViaJinaReader } from '@/lib/linkIdentification/jinaReader';
import { getCategoryConfig, generateBagTitle, generateBagDescription } from '../config';
import type {
  DiscoveryCategory,
  ResearchResult,
  DiscoveredProduct,
  CuratedBag,
  CuratedItem,
  CuratedLink,
} from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// Product Matching
// ============================================================================

interface ProductMatch {
  product: DiscoveredProduct;
  catalogItemId?: string;
  enhancedData?: {
    description?: string;
    specs?: Record<string, string>;
    imageUrl?: string;
  };
}

async function matchProductToCatalog(
  product: DiscoveredProduct,
  category: DiscoveryCategory
): Promise<ProductMatch> {
  // Try to search for a manufacturer page URL for the product
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} official site`)}`;

  try {
    // Use the URL-based identification pipeline with a manufacturer search
    const identified = await identifyProduct(searchUrl, { earlyExitConfidence: 0.7 });

    if (identified && identified.confidence >= 0.7) {
      return {
        product,
        enhancedData: {
          description: identified.specifications?.join(', ') || product.description,
          specs: identified.specifications?.reduce((acc, spec) => {
            const [key, ...rest] = spec.split(':');
            if (key && rest.length) {
              acc[key.trim()] = rest.join(':').trim();
            }
            return acc;
          }, {} as Record<string, string>),
          imageUrl: identified.imageUrl || undefined,
        },
      };
    }
  } catch (error) {
    console.error(`[Curation] Product match error for ${product.name}:`, error);
  }

  return { product };
}

// ============================================================================
// Image Acquisition
// ============================================================================

type ImageSource = 'source' | 'library' | 'manufacturer' | 'google';

interface ImageResult {
  url: string;
  source: ImageSource;
  validated: boolean;
}

async function acquireProductImage(
  product: DiscoveredProduct,
  match: ProductMatch,
  sourceUrl?: string
): Promise<ImageResult | null> {
  // Priority 1: Direct from source
  if (product.imageUrl) {
    const validated = await validateImage(product.imageUrl, product);
    if (validated) {
      return { url: product.imageUrl, source: 'source', validated: true };
    }
  }

  // Priority 2: From catalog match
  if (match.enhancedData?.imageUrl) {
    return { url: match.enhancedData.imageUrl, source: 'library', validated: true };
  }

  // Priority 3: Manufacturer website
  const manufacturerImage = await searchManufacturerImage(product);
  if (manufacturerImage) {
    return { url: manufacturerImage, source: 'manufacturer', validated: true };
  }

  // Priority 4: Google Image Search
  const googleImage = await searchProductImage(product);
  if (googleImage) {
    const validated = await validateImage(googleImage, product);
    if (validated) {
      return { url: googleImage, source: 'google', validated: true };
    }
  }

  return null;
}

async function searchManufacturerImage(product: DiscoveredProduct): Promise<string | null> {
  // Build manufacturer search URL
  const brandDomains: Record<string, string> = {
    // Golf
    titleist: 'titleist.com',
    taylormade: 'taylormadegolf.com',
    callaway: 'callawaygolf.com',
    ping: 'ping.com',
    cobra: 'cobragolf.com',
    mizuno: 'mizunogolf.com',
    cleveland: 'clevelandgolf.com',
    srixon: 'srixon.com',
    bridgestone: 'bridgestonegolf.com',
    // Tech
    sony: 'sony.com',
    canon: 'usa.canon.com',
    apple: 'apple.com',
    logitech: 'logitech.com',
    samsung: 'samsung.com',
    // Photography
    fujifilm: 'fujifilm-x.com',
    nikon: 'nikonusa.com',
    panasonic: 'panasonic.com',
    // EDC
    benchmade: 'benchmade.com',
    spyderco: 'spyderco.com',
    leatherman: 'leatherman.com',
  };

  const brandLower = product.brand.toLowerCase().replace(/\s+/g, '');
  const domain = brandDomains[brandLower];

  if (!domain) {
    // Try Google Images search for manufacturer product image
    try {
      const query = `${product.brand} ${product.name} official product image`;
      const images = await searchGoogleImages(query, 3);
      if (images && images.length > 0) {
        // Filter to prefer manufacturer domains
        const manufacturerImage = images.find(url =>
          url.includes(product.brand.toLowerCase()) ||
          url.includes('official') ||
          url.includes('cdn')
        );
        return manufacturerImage || images[0];
      }
    } catch {
      // Fall through to null
    }
    return null;
  }

  try {
    // Search Google for images on the manufacturer site
    const query = `site:${domain} ${product.name} product`;
    const images = await searchGoogleImages(query, 3);
    if (images && images.length > 0) {
      return images[0];
    }
  } catch (error) {
    console.error(`[Curation] Manufacturer image search error for ${product.name}:`, error);
  }

  return null;
}

async function searchProductImage(product: DiscoveredProduct): Promise<string | null> {
  try {
    const query = `${product.brand} ${product.name} product photo`;
    const images = await searchGoogleImages(query, 3);

    if (images && images.length > 0) {
      return images[0];
    }
  } catch (error) {
    console.error(`[Curation] Image search error for ${product.name}:`, error);
  }

  return null;
}

async function validateImage(imageUrl: string, product: DiscoveredProduct): Promise<boolean> {
  // Basic validation - check if URL is accessible and image dimensions are reasonable
  // For now, skip AI validation to reduce API costs
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) return false;

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) return false;

    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Link Generation
// ============================================================================

async function generateProductLinks(
  product: DiscoveredProduct,
  match: ProductMatch,
  sourceUrl?: string
): Promise<CuratedLink[]> {
  const links: CuratedLink[] = [];

  // 1. Use pre-fetched product links (from research phase) if available
  if (product.productLinks && product.productLinks.length > 0) {
    // Add primary link first (buyUrl or first product link)
    const primaryUrl = product.buyUrl || product.productLinks[0]?.url;
    if (primaryUrl) {
      const primaryLink = product.productLinks.find(l => l.url === primaryUrl) || product.productLinks[0];
      links.push({
        url: primaryUrl,
        kind: primaryLink.affiliatable ? 'affiliate' : 'product',
        label: primaryLink.label || 'Buy Now',
        metadata: { source: 'pre_fetched', priority: 1 },
      });
    }

    // Add up to 2 more product links
    for (const link of product.productLinks.slice(0, 3)) {
      if (link.url !== primaryUrl && links.length < 3) {
        links.push({
          url: link.url,
          kind: link.affiliatable ? 'affiliate' : 'product',
          label: link.label || link.source,
          metadata: { source: 'pre_fetched', priority: link.priority },
        });
      }
    }
  } else {
    // Fallback: Use SmartLinkFinder if no pre-fetched links
    try {
      const smartResult = await findBestProductLinks({
        name: product.name,
        brand: product.brand,
        category: match.product.description || '',
      });

      if (smartResult.primaryLink) {
        links.push({
          url: smartResult.primaryLink.url,
          kind: smartResult.primaryLink.affiliatable ? 'affiliate' : 'product',
          label: smartResult.primaryLink.label || 'Buy Now',
          metadata: { source: 'smart_link_finder', priority: 1 },
        });
      }

      for (const rec of smartResult.recommendations.slice(0, 2)) {
        if (rec.url !== smartResult.primaryLink?.url) {
          links.push({
            url: rec.url,
            kind: rec.affiliatable ? 'affiliate' : 'product',
            label: rec.label || rec.source,
            metadata: { source: 'smart_link_finder', priority: rec.priority },
          });
        }
      }
    } catch (error) {
      console.error(`[Curation] Link generation error for ${product.name}:`, error);
    }
  }

  // 2. Add source URL where product was discovered (YouTube/TikTok/article)
  // This is the "where we found it" link
  if (sourceUrl) {
    links.push({
      url: sourceUrl,
      kind: 'video',
      label: sourceUrl.includes('youtube') ? 'Watch Review' :
             sourceUrl.includes('tiktok') ? 'View on TikTok' :
             'View Source',
      metadata: { source: 'discovery_source' },
    });
  }

  // 3. Add creator affiliate link if they included one
  if (product.sourceLink && product.sourceLink !== sourceUrl) {
    links.push({
      url: product.sourceLink,
      kind: 'creator_affiliate',
      label: 'Creator Link',
    });
  }

  return links;
}

// ============================================================================
// Bag Creation
// ============================================================================

function groupProductsByTheme(results: ResearchResult[]): Map<string, ResearchResult[]> {
  const themes = new Map<string, ResearchResult[]>();

  for (const result of results) {
    const theme = result.theme || 'Trending Gear';
    const existing = themes.get(theme) || [];
    existing.push(result);
    themes.set(theme, existing);
  }

  return themes;
}

async function createCuratedItem(
  product: DiscoveredProduct,
  sourceResult: ResearchResult
): Promise<CuratedItem | null> {
  // Match to catalog for additional enrichment
  const match = await matchProductToCatalog(product, sourceResult.category);

  // Acquire image
  const image = await acquireProductImage(product, match, sourceResult.sourceUrl);
  if (!image) {
    console.log(`[Curation] No image found for ${product.name}, skipping`);
    return null;
  }

  // Generate links (with source URL where product was discovered)
  const links = await generateProductLinks(product, match, sourceResult.sourceUrl);

  // Build rich description from discovered product data
  // Priority: discovered specs > catalog specs > description
  let customDescription = '';

  // First, try to use specs from the discovered product (AI-extracted)
  if (product.specs && Object.keys(product.specs).length > 0) {
    customDescription = Object.entries(product.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }
  // Fall back to catalog-matched specs
  else if (match.enhancedData?.specs && Object.keys(match.enhancedData.specs).length > 0) {
    customDescription = Object.entries(match.enhancedData.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }
  // Fall back to description
  else {
    customDescription = (match.enhancedData?.description || product.description || '').slice(0, 300);
  }

  // Add price range if available
  if (product.priceRange) {
    customDescription = `${customDescription} | Price: ${product.priceRange}`;
  }

  // Build rich notes explaining why this product is notable
  const notes = product.whyNotable
    ? product.whyNotable
    : `Featured in: ${sourceResult.sourceTitle}`;

  // Build comprehensive "why chosen" context
  const whyChosen = buildWhyChosen(product, sourceResult);

  return {
    customName: product.name,
    brand: product.brand,
    customDescription: customDescription.slice(0, 500), // Allow longer descriptions
    notes,
    whyChosen,
    photoUrl: image.url,
    imageSource: image.source,
    links,
    catalogItemId: match.catalogItemId,
  };
}

/**
 * Build a rich "why chosen" explanation for the product
 */
function buildWhyChosen(product: DiscoveredProduct, sourceResult: ResearchResult): string {
  const parts: string[] = [];

  // Source context
  parts.push(`Discovered in "${sourceResult.theme}"`);

  // Why it's notable
  if (product.whyNotable) {
    parts.push(product.whyNotable);
  }

  // View count context for popular videos
  if (sourceResult.viewCount && sourceResult.viewCount > 100000) {
    parts.push(`from video with ${Math.round(sourceResult.viewCount / 1000)}K views`);
  }

  // Creator attribution
  if (sourceResult.creatorName) {
    parts.push(`recommended by ${sourceResult.creatorName}`);
  }

  return parts.join(' - ');
}

export async function curateResearchResults(
  results: ResearchResult[],
  category: DiscoveryCategory
): Promise<CuratedBag[]> {
  const bags: CuratedBag[] = [];
  const categoryConfig = getCategoryConfig(category);

  // Collect all unique products
  const allProducts: { product: DiscoveredProduct; source: ResearchResult }[] = [];
  const seenProducts = new Set<string>();

  for (const result of results) {
    for (const product of result.products) {
      const key = `${product.brand.toLowerCase()}-${product.name.toLowerCase()}`;
      if (!seenProducts.has(key)) {
        seenProducts.add(key);
        allProducts.push({ product, source: result });
      }
    }
  }

  // Sort by confidence and limit
  allProducts.sort((a, b) => b.product.confidence - a.product.confidence);
  const topProducts = allProducts.slice(0, 15);

  if (topProducts.length === 0) {
    return [];
  }

  // Create items
  const items: CuratedItem[] = [];
  for (const { product, source } of topProducts) {
    const item = await createCuratedItem(product, source);
    if (item) {
      items.push(item);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  if (items.length < 3) {
    console.log(`[Curation] Only ${items.length} items curated, minimum 3 required`);
    return [];
  }

  // Build attribution
  const creators = [...new Set(results.map((r) => r.creatorName).filter(Boolean))];
  const sourceAttribution =
    creators.length > 0
      ? `Curated from content by: ${creators.slice(0, 5).join(', ')}`
      : 'Curated from trending content';

  // Create the bag
  const bag: CuratedBag = {
    title: generateBagTitle(category),
    description: generateBagDescription(category, results.length),
    category,
    tags: [category, 'trending', 'curated'],
    items,
    sourceAttribution,
    sourceUrls: results.map((r) => r.sourceUrl),
    theme: `${categoryConfig.displayName} - Trending This Week`,
  };

  bags.push(bag);

  return bags;
}

// ============================================================================
// Database Operations
// ============================================================================

export async function createBagInDatabase(
  bag: CuratedBag,
  teedUserId: string,
  supabase: SupabaseClient<any, any>
): Promise<string | null> {
  try {
    // Generate unique bag code
    const baseCode = bag.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    // Create bag
    const { data: newBag, error: bagError } = await supabase
      .from('bags')
      .insert({
        owner_id: teedUserId,
        title: bag.title,
        description: bag.description,
        is_public: true,
        category: bag.category,
        tags: bag.tags,
      })
      .select('id, code')
      .single();

    if (bagError || !newBag) {
      console.error('[Curation] Bag creation error:', bagError);
      return null;
    }

    console.log(`[Curation] Created bag: ${newBag.code}`);

    // Add items
    for (let i = 0; i < bag.items.length; i++) {
      const item = bag.items[i];

      const { data: newItem, error: itemError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: newBag.id,
          custom_name: item.customName,
          brand: item.brand,
          custom_description: item.customDescription,
          notes: item.notes,
          why_chosen: item.whyChosen,
          photo_url: item.photoUrl,
          sort_index: i,
          catalog_item_id: item.catalogItemId || null,
        })
        .select('id')
        .single();

      if (itemError) {
        console.error(`[Curation] Item creation error for ${item.customName}:`, itemError);
        continue;
      }

      // Add links
      for (const link of item.links) {
        await supabase.from('links').insert({
          bag_item_id: newItem.id,
          url: link.url,
          kind: link.kind,
          label: link.label,
          metadata: link.metadata || {},
        });
      }
    }

    // Update discovered_products with bag reference
    // (This would need source_product_id tracking)

    return newBag.id;
  } catch (error) {
    console.error('[Curation] Database error:', error);
    return null;
  }
}

export async function getTeedUserId(
  supabase: SupabaseClient<any, any>
): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', 'teed')
    .single();

  return data?.id || null;
}
