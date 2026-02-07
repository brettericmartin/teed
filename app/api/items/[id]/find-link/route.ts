import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { findBestProductLinks, detectProductAge } from '@/lib/services/SmartLinkFinder';

/**
 * POST /api/items/[id]/find-link
 * Uses SmartLinkFinder (Google search + AI ranking) to find a product link for an item.
 *
 * Returns: SmartLinkResult { recommendations, primaryLink, reasoning }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the item and verify ownership through bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, custom_name, brand, bags:bags!bag_items_bag_id_fkey(owner_id, category)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productName = item.custom_name || 'Unknown product';
    const brand = item.brand || undefined;
    // @ts-ignore - category comes from the joined bags table
    const category = item.bags?.category || undefined;

    // Detect if product is vintage/old
    const ageInfo = detectProductAge(productName, brand);

    console.log(`[find-link] Finding links for: ${brand || ''} ${productName} (vintage: ${ageInfo.isVintage})`);

    // Find best product links
    const result = await findBestProductLinks({
      name: productName,
      brand,
      category,
      isVintage: ageInfo.isVintage,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error in POST /api/items/[id]/find-link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
