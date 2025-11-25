import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/discover - Get all public bags for discovery with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const following = searchParams.get('following') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean); // Comma-separated tags

    // Check authentication for "following" filter
    let followingIds: string[] = [];
    if (following) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Must be logged in to filter by following' }, { status: 401 });
      }

      // Get list of users the current user follows
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      followingIds = follows?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        return NextResponse.json({ bags: [] }, { status: 200 });
      }
    }

    // Build query
    let query = supabase
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
        created_at,
        updated_at,
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
      .eq('is_public', true);

    // Apply filters
    if (following && followingIds.length > 0) {
      query = query.in('owner_id', followingIds);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Tag filtering using jsonb operator
    // For each tag, filter bags that contain that tag
    if (tags && tags.length > 0) {
      // Use overlaps operator (&&) to check if any of the requested tags exist in the bag's tags
      query = query.overlaps('tags', tags);
    }

    // Fetch bags
    const { data: bags, error: bagsError } = await query
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
