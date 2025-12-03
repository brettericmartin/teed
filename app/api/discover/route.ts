import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/discover - Get all public bags for discovery with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const following = searchParams.get('following') === 'true';
    const saved = searchParams.get('saved') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean); // Comma-separated tags
    const sort = searchParams.get('sort') || 'newest'; // newest, popular, most_items
    const trending = searchParams.get('trending') === 'true'; // Get trending bags only

    // Check authentication for "following" or "saved" filter
    let followingIds: string[] = [];
    let savedBagIds: string[] = [];

    if (following || saved) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Must be logged in to filter by following or saved' }, { status: 401 });
      }

      // Get list of users the current user follows (for following filter)
      if (following) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        followingIds = follows?.map(f => f.following_id) || [];

        if (followingIds.length === 0 && !saved) {
          return NextResponse.json({ bags: [] }, { status: 200 });
        }
      }

      // Get list of saved bag IDs (for saved filter)
      if (saved) {
        const { data: savedBags } = await supabase
          .from('saved_bags')
          .select('bag_id')
          .eq('user_id', user.id);

        savedBagIds = savedBags?.map(s => s.bag_id) || [];

        if (savedBagIds.length === 0 && !following) {
          return NextResponse.json({ bags: [] }, { status: 200 });
        }
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
        items:bag_items!bag_items_bag_id_fkey(
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

    if (saved && savedBagIds.length > 0) {
      query = query.in('id', savedBagIds);
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

    // Apply sorting
    switch (sort) {
      case 'popular':
        // For now, sort by updated_at as proxy for activity
        // TODO: Add proper view count column to bags table
        query = query.order('updated_at', { ascending: false, nullsFirst: false });
        break;
      case 'most_items':
        // This will be sorted client-side after fetching
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Fetch bags
    const { data: bags, error: bagsError } = await query.limit(100);

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

    // Map photo URLs to items and add item_count
    let bagsWithPhotos = bags?.map((bag: any) => ({
      ...bag,
      item_count: bag.items?.length || 0,
      items: bag.items?.map((item: any) => ({
        ...item,
        photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
      })),
    })) || [];

    // Sort by most items if requested (client-side sort since Supabase can't sort by computed field)
    if (sort === 'most_items') {
      bagsWithPhotos = bagsWithPhotos.sort((a: any, b: any) => b.item_count - a.item_count);
    }

    return NextResponse.json({ bags: bagsWithPhotos }, { status: 200 });
  } catch (error) {
    console.error('Discover API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
