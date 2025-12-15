import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/gpt/discover
 * Browse public and featured bags
 * This endpoint is public and uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    // Use service role to access public bags across all users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { searchParams } = new URL(request.url);

    const featured = searchParams.get('featured') === 'true';
    const category = searchParams.get('category');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // Build query for public bags
    let query = supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        description,
        category,
        is_featured,
        created_at,
        updated_at,
        owner_id,
        profiles!bags_owner_id_fkey (
          handle,
          display_name
        )
      `)
      .eq('is_public', true);

    // Filter by featured if requested
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Order and limit
    query = query
      .order('is_featured', { ascending: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    const { data: bags, error: bagsError } = await query;

    if (bagsError) {
      console.error('Error fetching discover bags:', bagsError);
      return NextResponse.json(
        { error: 'Failed to fetch bags', details: bagsError.message },
        { status: 500 }
      );
    }

    // Get item counts for each bag
    const bagIds = (bags || []).map(b => b.id);
    let itemCounts: Record<string, number> = {};

    if (bagIds.length > 0) {
      const { data: counts } = await supabase
        .from('bag_items')
        .select('bag_id')
        .in('bag_id', bagIds);

      if (counts) {
        counts.forEach(item => {
          itemCounts[item.bag_id] = (itemCounts[item.bag_id] || 0) + 1;
        });
      }
    }

    // Format bags
    const formattedBags = (bags || []).map(bag => {
      const profile = (bag as any).profiles;
      return {
        code: bag.code,
        title: bag.title,
        description: bag.description,
        category: bag.category,
        is_featured: bag.is_featured,
        item_count: itemCounts[bag.id] || 0,
        owner: {
          handle: profile.handle,
          display_name: profile.display_name,
        },
        url: `https://teed.club/u/${profile.handle}/${bag.code}`,
        updated_at: bag.updated_at,
      };
    });

    return NextResponse.json({
      bags: formattedBags,
      count: formattedBags.length,
      filters: {
        featured: featured || false,
        category: category || null,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/discover:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
