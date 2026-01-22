import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { checkItemBadges } from '@/lib/badges';

/**
 * PATCH /api/bags/[code]/items
 * Batch reorder items - updates sort_index for multiple items in one request
 *
 * Body:
 * {
 *   items: Array<{ id: string, sort_index: number }>
 * }
 *
 * Returns: { success: true, updated: number }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each item has id and sort_index
    for (const item of items) {
      if (!item.id || typeof item.sort_index !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have id and sort_index' },
          { status: 400 }
        );
      }
    }

    // Verify all items belong to this bag
    const itemIds = items.map((i: { id: string }) => i.id);
    const { data: existingItems, error: verifyError } = await supabase
      .from('bag_items')
      .select('id')
      .eq('bag_id', bag.id)
      .in('id', itemIds);

    if (verifyError) {
      console.error('Error verifying items:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify items' },
        { status: 500 }
      );
    }

    if (!existingItems || existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Some items do not belong to this bag' },
        { status: 400 }
      );
    }

    // Batch update all items using Promise.all for parallel execution
    const updatePromises = items.map((item: { id: string; sort_index: number }) =>
      supabase
        .from('bag_items')
        .update({ sort_index: item.sort_index })
        .eq('id', item.id)
    );

    const results = await Promise.all(updatePromises);

    // Check for any errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating items:', errors.map(e => e.error));
      return NextResponse.json(
        { error: 'Failed to update some items' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp once
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    return NextResponse.json({ success: true, updated: items.length });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/bags/[code]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bags/[code]/items
 * Add a new item to a bag
 *
 * Body:
 * {
 *   custom_name: string (required)
 *   custom_description?: string
 *   brand?: string
 *   notes?: string
 *   quantity?: number (default: 1)
 *   catalog_item_id?: uuid
 *   custom_photo_id?: uuid
 *   photo_url?: string (external image URL)
 * }
 *
 * Returns: Created item object
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    console.log('[Items API] Received body:', JSON.stringify(body, null, 2));
    const {
      custom_name,
      custom_description,
      brand,
      notes,
      quantity = 1,
      catalog_item_id,
      custom_photo_id,
      photo_url,
    } = body;
    console.log('[Items API] Extracted photo_url:', photo_url);

    // Validate required fields
    if (!custom_name || typeof custom_name !== 'string' || custom_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'custom_name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get the current max sort_index for this bag
    const { data: maxItem } = await supabase
      .from('bag_items')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    const nextSortIndex = maxItem ? maxItem.sort_index + 1 : 1;

    // Create the item
    const { data: item, error: createError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: custom_name.trim(),
        custom_description: custom_description?.trim() || null,
        brand: brand?.trim() || null,
        notes: notes?.trim() || null,
        quantity: quantity || 1,
        catalog_item_id: catalog_item_id || null,
        custom_photo_id: custom_photo_id || null,
        photo_url: photo_url || null,
        sort_index: nextSortIndex,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating item:', createError);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    console.log('[Items API] Created item with photo_url:', item?.photo_url);

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    // Check and award item badges (non-blocking)
    // Get total item count across all user's bags
    const { data: userBags } = await supabase
      .from('bags')
      .select('id')
      .eq('owner_id', user.id);

    if (userBags && userBags.length > 0) {
      const { count: totalItemCount } = await supabase
        .from('bag_items')
        .select('*', { count: 'exact', head: true })
        .in('bag_id', userBags.map(b => b.id));

      if (totalItemCount) {
        // Fire and forget - don't block the response
        checkItemBadges(user.id, totalItemCount).catch((err) => {
          console.error('[Badges] Error checking item badges:', err);
        });
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/bags/[code]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
