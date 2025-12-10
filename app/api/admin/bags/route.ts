import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bags
 * List all bags with filtering, pagination, and owner info
 */
export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status'); // all, featured, flagged, hidden, public, private
  const category = searchParams.get('category');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Build query
  let query = supabase
    .from('bags')
    .select(
      `
      id,
      code,
      title,
      description,
      category,
      is_public,
      is_featured,
      is_flagged,
      flag_reason,
      is_hidden,
      featured_at,
      created_at,
      updated_at,
      owner_id,
      profiles!bags_owner_id_fkey (
        id,
        handle,
        display_name
      )
    `,
      { count: 'exact' }
    );

  // Filter by status
  switch (status) {
    case 'featured':
      query = query.eq('is_featured', true);
      break;
    case 'flagged':
      query = query.eq('is_flagged', true);
      break;
    case 'hidden':
      query = query.eq('is_hidden', true);
      break;
    case 'public':
      query = query.eq('is_public', true).eq('is_hidden', false);
      break;
    case 'private':
      query = query.eq('is_public', false);
      break;
    // 'all' - no filter
  }

  // Filter by category
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // Search by title, code, or owner handle
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  // Sort
  const ascending = sortOrder === 'asc';
  switch (sortBy) {
    case 'title':
      query = query.order('title', { ascending });
      break;
    case 'updated_at':
      query = query.order('updated_at', { ascending, nullsFirst: false });
      break;
    case 'featured_at':
      query = query.order('featured_at', { ascending, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: bags, error, count } = await query;

  if (error) {
    console.error('Error fetching bags:', error);
    return NextResponse.json({ error: 'Failed to fetch bags' }, { status: 500 });
  }

  // Get item counts for each bag
  const bagIds = bags?.map((b) => b.id) || [];
  let itemCounts: Record<string, number> = {};
  let viewCounts: Record<string, number> = {};

  if (bagIds.length > 0) {
    // Get item counts
    const { data: itemCountData } = await supabase
      .from('bag_items')
      .select('bag_id')
      .in('bag_id', bagIds);

    if (itemCountData) {
      itemCounts = itemCountData.reduce(
        (acc, item) => {
          acc[item.bag_id] = (acc[item.bag_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Get view counts (if analytics table exists)
    // For now, just use 0 as placeholder
  }

  // Get global stats (counts across ALL bags, not just current page)
  const [featuredResult, flaggedResult, hiddenResult] = await Promise.all([
    supabase.from('bags').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('bags').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('bags').select('id', { count: 'exact', head: true }).eq('is_hidden', true),
  ]);

  const globalStats = {
    featured: featuredResult.count || 0,
    flagged: flaggedResult.count || 0,
    hidden: hiddenResult.count || 0,
  };

  // Transform data to match BagForAdmin type
  const transformedBags = bags?.map((bag) => {
    // Handle profiles - could be object or array depending on Supabase response
    const profile = Array.isArray(bag.profiles) ? bag.profiles[0] : bag.profiles;

    return {
      id: bag.id,
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_public: bag.is_public,
      is_featured: bag.is_featured,
      is_flagged: bag.is_flagged,
      flag_reason: bag.flag_reason,
      is_hidden: bag.is_hidden,
      featured_at: bag.featured_at,
      item_count: itemCounts[bag.id] || 0,
      view_count: viewCounts[bag.id] || 0,
      owner: profile
        ? {
            id: profile.id,
            handle: profile.handle,
            display_name: profile.display_name,
          }
        : { id: bag.owner_id, handle: 'unknown', display_name: 'Unknown User' },
      created_at: bag.created_at,
      updated_at: bag.updated_at,
    };
  });

  return NextResponse.json({
    bags: transformedBags || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    stats: globalStats,
  });
}
