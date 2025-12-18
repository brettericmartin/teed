import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/discover/spotlight
 * Fetch spotlight bags for the discover page
 */
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get categories to show (can be passed as query param)
  const { searchParams } = new URL(request.url);
  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam
    ? categoriesParam.split(',')
    : ['golf', 'wishlist', 'photography']; // Default spotlight categories

  // Fetch featured bags (one per category) - featured = spotlight
  const { data: spotlightBags, error } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      is_public,
      background_image,
      category,
      tags,
      created_at,
      updated_at,
      is_featured,
      profiles!bags_owner_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      ),
      bag_items!bag_items_bag_id_fkey (
        id,
        custom_name,
        photo_url,
        is_featured,
        featured_position
      )
    `)
    .eq('is_featured', true)
    .eq('is_public', true)
    .eq('is_hidden', false)
    .in('category', categories)
    .order('category');

  if (error) {
    console.error('Error fetching spotlight bags:', error);
    return NextResponse.json({ error: 'Failed to fetch spotlight bags' }, { status: 500 });
  }

  // Transform to match the expected format
  const transformedBags = spotlightBags?.map((bag) => {
    const profile = Array.isArray(bag.profiles) ? bag.profiles[0] : bag.profiles;
    const items = bag.bag_items || [];

    return {
      id: bag.id,
      code: bag.code,
      title: bag.title,
      description: bag.description,
      is_public: bag.is_public,
      background_image: bag.background_image,
      category: bag.category,
      tags: bag.tags || [],
      created_at: bag.created_at,
      updated_at: bag.updated_at,
      items: items.map((item: { id: string; custom_name: string | null; photo_url: string | null; is_featured: boolean; featured_position: number | null }) => ({
        id: item.id,
        custom_name: item.custom_name,
        photo_url: item.photo_url,
        is_featured: item.is_featured,
        featured_position: item.featured_position,
      })),
      owner: profile
        ? {
            id: profile.id,
            handle: profile.handle,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }
        : {
            id: '',
            handle: 'unknown',
            display_name: 'Unknown User',
            avatar_url: null,
          },
    };
  }) || [];

  return NextResponse.json({ spotlight: transformedBags });
}
