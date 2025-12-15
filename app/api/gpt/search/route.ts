import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/gpt/search
 * Search across public bags and items
 * This endpoint is public and uses service role to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

    const searchTerm = query.trim().toLowerCase();
    const results: {
      bags: any[];
      items: any[];
    } = {
      bags: [],
      items: [],
    };

    // Search bags if type is 'all' or 'bags'
    if (type === 'all' || type === 'bags') {
      const { data: bags, error: bagsError } = await supabase
        .from('bags')
        .select(`
          id,
          code,
          title,
          description,
          category,
          owner_id,
          profiles!inner (
            handle,
            display_name
          )
        `)
        .eq('is_public', true)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit);

      if (bagsError) {
        console.error('Error searching bags:', bagsError);
      } else {
        // Get item counts
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

        results.bags = (bags || []).map(bag => {
          const profile = (bag as any).profiles;
          return {
            type: 'bag',
            code: bag.code,
            title: bag.title,
            description: bag.description,
            category: bag.category,
            item_count: itemCounts[bag.id] || 0,
            owner: {
              handle: profile.handle,
              display_name: profile.display_name,
            },
            url: `https://teed.club/u/${profile.handle}/${bag.code}`,
          };
        });
      }
    }

    // Search items if type is 'all' or 'items'
    if (type === 'all' || type === 'items') {
      const { data: items, error: itemsError } = await supabase
        .from('bag_items')
        .select(`
          id,
          custom_name,
          custom_description,
          brand,
          bag_id,
          bags!inner (
            id,
            code,
            title,
            is_public,
            owner_id,
            profiles!inner (
              handle,
              display_name
            )
          )
        `)
        .or(`custom_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,custom_description.ilike.%${searchTerm}%`)
        .limit(limit);

      if (itemsError) {
        console.error('Error searching items:', itemsError);
      } else {
        // Filter to only items in public, non-hidden bags
        results.items = (items || [])
          .filter(item => {
            const bag = (item as any).bags;
            return bag.is_public;
          })
          .map(item => {
            const bag = (item as any).bags;
            const profile = bag.profiles;
            return {
              type: 'item',
              id: item.id,
              name: item.custom_name,
              description: item.custom_description,
              brand: item.brand,
              bag: {
                code: bag.code,
                title: bag.title,
              },
              owner: {
                handle: profile.handle,
                display_name: profile.display_name,
              },
              url: `https://teed.club/u/${profile.handle}/${bag.code}`,
            };
          });
      }
    }

    return NextResponse.json({
      query: query.trim(),
      type,
      results: {
        bags: results.bags,
        items: results.items,
        total: results.bags.length + results.items.length,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
