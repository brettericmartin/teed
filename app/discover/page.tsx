import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/serverSupabase';
import { anyTagOrFilter } from '@/lib/discover/tagFilter';
import DiscoverClient from './DiscoverClient';
import { resolveItemPhoto } from '@/lib/items/photo';

export const metadata: Metadata = {
  title: 'Discover bags | Teed.club',
  description:
    'Browse curated gear bags from real people: golf bags, golf sim setups, EDC, travel, camera and tech kits, with every item and why it made the cut.',
  alternates: { canonical: '/discover' },
  openGraph: {
    title: 'Discover bags on Teed.club',
    description: 'Curated gear bags from real people, with every item and why it made the cut.',
    url: '/discover',
  },
};

type DiscoverPageProps = {
  searchParams: Promise<{ category?: string; tags?: string }>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const supabase = await createServerSupabase();

  // Read the shareable filters so /discover?category=golf-sim paints right on first load
  // (the client re-fetches on mount, but the first paint should already match the URL).
  const { category, tags } = await searchParams;
  const initialCategory = category?.trim() || null;
  const initialTags = tags?.split(',').map((t) => t.trim()).filter(Boolean) || [];

  // Fetch discover data (public bags, filtered by the URL's category/tags) directly from Supabase
  let bagsQuery = supabase
    .from('bags')
    .select(`
      *,
      items:bag_items!bag_items_bag_id_fkey(
        id,
        custom_name,
        custom_photo_id,
        photo_url,
        is_featured,
        featured_position
      ),
      owner:profiles!bags_owner_id_fkey(
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .eq('is_hidden', false);
  if (initialCategory) bagsQuery = bagsQuery.eq('category', initialCategory);
  // Same semantics as /api/discover: any of the requested tags
  if (initialTags.length > 0) bagsQuery = bagsQuery.or(anyTagOrFilter(initialTags));

  const { data: bags } = await bagsQuery
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(100);

  // Get all photo IDs from all bags
  const allPhotoIds = bags
    ?.flatMap((bag: any) =>
      bag.items?.map((item: any) => item.custom_photo_id).filter(Boolean) || []
    ) || [];

  // Fetch media assets for all photos
  let photoUrls: Record<string, string> = {};
  if (allPhotoIds.length > 0) {
    // Batch in chunks of 100 to avoid URL length limits on .in() queries
    const BATCH_SIZE = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < allPhotoIds.length; i += BATCH_SIZE) {
      chunks.push(allPhotoIds.slice(i, i + BATCH_SIZE));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        supabase
          .from('media_assets')
          .select('id, url')
          .in('id', chunk)
      )
    );

    for (const { data: mediaAssets } of results) {
      for (const asset of mediaAssets || []) {
        photoUrls[asset.id] = asset.url;
      }
    }
  }

  // Map photo URLs to items. Was custom_photo_id only, which dropped every photo_url-only item.
  const bagsWithPhotos = bags?.map((bag: any) => ({
    ...bag,
    items: bag.items?.map((item: any) => ({
      ...item,
      photo_url: resolveItemPhoto(item, photoUrls),
    })),
  })) || [];

  // The site-wide Navigation comes from app/layout.tsx; rendering it here too drew it twice.
  return <DiscoverClient initialBags={bagsWithPhotos} />;
}
