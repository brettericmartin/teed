import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// Featured bag codes - hardcoded for easy updates
const FEATURED_BAG_CODES = [
  { handle: 'teed', code: 'christmas-list-2' },
  { handle: 'brett', code: 'sean-walsh-s-break-50-bag' },
  { handle: 'teed', code: 'matt-scharff-s-golf-bag' },
  { handle: 'teed', code: 'peter-mckinnon-camera-bag' },
  { handle: 'teed', code: 'ryder-rivadeneyra-s-golf-filming-master-bag' },
];

// GET /api/featured-bags - Get featured bags for homepage
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Fetch all featured bags
    const bags = await Promise.all(
      FEATURED_BAG_CODES.map(async ({ handle, code }) => {
        // First get the profile by handle
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, handle, display_name, avatar_url')
          .eq('handle', handle)
          .single();

        if (!profile) return null;

        // Then get the bag
        const { data: bag } = await supabase
          .from('bags')
          .select(`
            id,
            title,
            description,
            code,
            is_public,
            background_image,
            category,
            tags,
            created_at
          `)
          .eq('owner_id', profile.id)
          .eq('code', code)
          .single();

        if (!bag) return null;

        // Get items with their photos
        const { data: items, error: itemsError } = await supabase
          .from('bag_items')
          .select(`
            id,
            custom_name,
            brand,
            custom_description,
            custom_photo_id,
            is_featured,
            featured_position,
            sort_index
          `)
          .eq('bag_id', bag.id)
          .order('sort_index', { ascending: true });

        if (itemsError) {
          console.error(`[Featured Bags] Error fetching items for ${bag.title}:`, itemsError);
        }

        // Get item links separately (table is 'links', column is 'bag_item_id')
        const itemIds = items?.map(item => item.id) || [];
        let itemLinks: Record<string, Array<{ id: string; url: string; kind: string; label: string | null }>> = {};

        if (itemIds.length > 0) {
          const { data: links } = await supabase
            .from('links')
            .select('id, url, kind, label, bag_item_id')
            .in('bag_item_id', itemIds);

          if (links) {
            itemLinks = links.reduce((acc, link) => {
              if (!acc[link.bag_item_id]) acc[link.bag_item_id] = [];
              acc[link.bag_item_id].push({
                id: link.id,
                url: link.url,
                kind: link.kind,
                label: link.label,
              });
              return acc;
            }, {} as Record<string, Array<{ id: string; url: string; kind: string; label: string | null }>>);
          }
        }

        // Get photo URLs from media_assets
        const photoIds = items
          ?.map(item => item.custom_photo_id)
          .filter(Boolean) || [];

        let photoUrls: Record<string, string> = {};
        if (photoIds.length > 0) {
          const { data: mediaAssets } = await supabase
            .from('media_assets')
            .select('id, url')
            .in('id', photoIds);

          if (mediaAssets) {
            photoUrls = mediaAssets.reduce((acc, asset) => {
              acc[asset.id] = asset.url;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Map items with photo URLs and links
        const itemsWithPhotos = items?.map(item => ({
          id: item.id,
          custom_name: item.custom_name,
          brand: item.brand,
          custom_description: item.custom_description,
          photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
          is_featured: item.is_featured,
          featured_position: item.featured_position,
          sort_index: item.sort_index,
          links: itemLinks[item.id] || [],
        })) || [];

        return {
          ...bag,
          item_count: itemsWithPhotos.length,
          items: itemsWithPhotos,
          owner: {
            id: profile.id,
            handle: profile.handle,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          },
        };
      })
    );

    // Filter out any null bags (bags that don't exist)
    const validBags = bags.filter(Boolean);

    return NextResponse.json({ bags: validBags }, { status: 200 });
  } catch (error) {
    console.error('Featured bags API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
