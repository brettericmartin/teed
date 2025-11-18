import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/feed - Get bags from users you follow
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get list of users the current user follows
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followsError) {
      console.error('Error fetching follows:', followsError);
      return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
    }

    const followingIds = follows.map(f => f.following_id);

    // If not following anyone, return empty array
    if (followingIds.length === 0) {
      return NextResponse.json({ bags: [], profiles: {} }, { status: 200 });
    }

    // Fetch public bags from followed users with featured items
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
      .in('owner_id', followingIds)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

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
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
