import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/user/bags
 * Get the current user's bags with item counts
 * Used for the "Add to Bag" selector modal
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's bags with item count
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select('id, code, title, updated_at, bag_items!bag_items_bag_id_fkey(count)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (bagsError) {
      console.error('Error fetching user bags:', bagsError);
      return NextResponse.json(
        { error: 'Failed to fetch bags' },
        { status: 500 }
      );
    }

    // Transform the response to include item_count
    const bagsWithCount = (bags || []).map((bag: any) => ({
      id: bag.id,
      code: bag.code,
      title: bag.title,
      updated_at: bag.updated_at,
      item_count: bag.bag_items?.[0]?.count || 0,
    }));

    return NextResponse.json({ bags: bagsWithCount });
  } catch (error) {
    console.error('Unexpected error in GET /api/user/bags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
