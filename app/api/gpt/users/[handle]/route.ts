import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/gpt/users/[handle]
 * Get a user's public profile and their public bags
 * This endpoint is public and uses service role to bypass RLS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Remove @ if present
    const cleanHandle = handle.replace(/^@/, '').toLowerCase();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url, is_verified')
      .eq('handle', cleanHandle)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: `User @${cleanHandle} not found` },
        { status: 404 }
      );
    }

    // Get user's public bags
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        description,
        category,
        is_featured,
        created_at,
        updated_at
      `)
      .eq('owner_id', profile.id)
      .eq('is_public', true)
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (bagsError) {
      console.error('Error fetching user bags:', bagsError);
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
    const formattedBags = (bags || []).map(bag => ({
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_featured: bag.is_featured,
      item_count: itemCounts[bag.id] || 0,
      url: `https://teed.club/u/${profile.handle}/${bag.code}`,
      updated_at: bag.updated_at,
    }));

    return NextResponse.json({
      profile: {
        handle: profile.handle,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified,
        profile_url: `https://teed.club/u/${profile.handle}`,
      },
      bags: formattedBags,
      bag_count: formattedBags.length,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/users/[handle]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
