import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ProductAppearance {
  itemId: string;
  name: string;
  brand: string | null;
  description: string | null;
  whyChosen: string | null;
  comparedTo: string | null;
  alternatives: string[] | null;
  photoUrl: string | null;
  pricePaid: number | null;
  specs: Record<string, any> | null;
  bag: {
    code: string;
    title: string;
    category: string | null;
    description: string | null;
  };
  curator: {
    handle: string;
    displayName: string | null;
  };
}

export interface ResolvedProduct {
  slug: string;
  name: string;
  brand: string | null;
  appearances: ProductAppearance[];
  stats: {
    totalAppearances: number;
    withContext: number;
    uniqueCurators: number;
  };
}

/**
 * Slug format: lowercase, spaces to hyphens, strip non-alphanumeric
 */
export function productSlug(brand: string | null, name: string): string {
  const parts = [brand, name].filter(Boolean).join(' ');
  return parts
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Resolve a product slug to all its appearances across public bags.
 */
export async function resolveProduct(slug: string): Promise<ResolvedProduct | null> {
  // Convert slug back to search terms
  const searchTerms = slug.replace(/-/g, ' ');

  // Search for items matching this slug pattern
  const { data: items, error } = await supabase
    .from('bag_items')
    .select(`
      id,
      custom_name,
      brand,
      custom_description,
      why_chosen,
      compared_to,
      alternatives,
      photo_url,
      price_paid,
      specs,
      custom_photo_id,
      bags!inner (
        code,
        title,
        category,
        description,
        is_public,
        is_hidden,
        profiles!bags_owner_id_fkey (
          handle,
          display_name
        )
      )
    `)
    .eq('bags.is_public', true)
    .eq('bags.is_hidden', false);

  if (error || !items) return null;

  // Find items whose slug matches
  const matching = items.filter((item) => {
    const itemSlug = productSlug(item.brand, item.custom_name || '');
    return itemSlug === slug;
  });

  if (matching.length === 0) return null;

  // Fetch photo URLs for items with custom_photo_id
  const photoIds = matching
    .map((item) => item.custom_photo_id)
    .filter((id): id is string => id !== null);

  let photoUrls: Record<string, string> = {};
  if (photoIds.length > 0) {
    const { data: assets } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', photoIds);
    if (assets) {
      photoUrls = assets.reduce((acc, a) => {
        acc[a.id] = a.url;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  const first = matching[0];
  const appearances: ProductAppearance[] = matching.map((item) => {
    const bag = item.bags as any;
    const profile = bag.profiles;
    return {
      itemId: item.id,
      name: item.custom_name || '',
      brand: item.brand,
      description: item.custom_description,
      whyChosen: item.why_chosen,
      comparedTo: item.compared_to,
      alternatives: item.alternatives,
      photoUrl: item.custom_photo_id
        ? photoUrls[item.custom_photo_id] || item.photo_url
        : item.photo_url,
      pricePaid: item.price_paid,
      specs: item.specs,
      bag: {
        code: bag.code,
        title: bag.title,
        category: bag.category,
        description: bag.description,
      },
      curator: {
        handle: profile.handle,
        displayName: profile.display_name,
      },
    };
  });

  const uniqueCurators = new Set(appearances.map((a) => a.curator.handle));
  const withContext = appearances.filter((a) => a.whyChosen);

  return {
    slug,
    name: first.custom_name || '',
    brand: first.brand,
    appearances,
    stats: {
      totalAppearances: appearances.length,
      withContext: withContext.length,
      uniqueCurators: uniqueCurators.size,
    },
  };
}

/**
 * Get all unique product slugs for sitemap generation.
 */
export async function getAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const { data: items, error } = await supabase
    .from('bag_items')
    .select(`
      custom_name,
      brand,
      created_at,
      bags!inner (
        is_public,
        is_hidden
      )
    `)
    .eq('bags.is_public', true)
    .eq('bags.is_hidden', false);

  if (error || !items) return [];

  const slugMap = new Map<string, string>();
  for (const item of items) {
    if (!item.custom_name) continue;
    const slug = productSlug(item.brand, item.custom_name);
    if (!slug) continue;
    const existing = slugMap.get(slug);
    if (!existing || item.created_at > existing) {
      slugMap.set(slug, item.created_at);
    }
  }

  return Array.from(slugMap.entries()).map(([slug, updatedAt]) => ({
    slug,
    updatedAt,
  }));
}
