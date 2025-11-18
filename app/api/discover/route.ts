import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/discover - Get all public bags for discovery
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Fetch all public bags with featured items and owner info
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        *,
        items:bag_items(
          id,
          custom_name,
          custom_photo_id,
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
      .order('created_at', { ascending: false })
      .limit(100);

    if (bagsError) {
      console.error('Error fetching bags:', bagsError);
      return NextResponse.json({ error: 'Failed to fetch bags' }, { status: 500 });
    }

    // Get all photo IDs from all bags
    const allPhotoIds = bags
      ?.flatMap((bag: any) =>
        bag.items?.map((item: any) => item.custom_photo_id).filter(Boolean) || []
      ) || [];

    // Fetch media assets for all photos
    let photoUrls: Record<string, string> = {};
    if (allPhotoIds.length > 0) {
      const { data: mediaAssets } = await supabase
        .from('media_assets')
        .select('id, url')
        .in('id', allPhotoIds);

      if (mediaAssets) {
        photoUrls = mediaAssets.reduce((acc, asset) => {
          acc[asset.id] = asset.url;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Map photo URLs to items
    const bagsWithPhotos = bags?.map((bag: any) => ({
      ...bag,
      items: bag.items?.map((item: any) => ({
        ...item,
        photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
      })),
    }));

    return NextResponse.json({ bags: bagsWithPhotos || [] }, { status: 200 });
  } catch (error) {
    console.error('Discover API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
