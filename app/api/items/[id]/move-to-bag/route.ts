import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/items/[id]/move-to-bag
 * Move an item (with all its links) to a different bag owned by the current user
 *
 * DOCTRINE: Reduces friction; data preserved during reorganization.
 *
 * Body:
 * {
 *   target_bag_id: string
 * }
 *
 * Returns: { success: true, item: {...}, sourceBagId: string, targetBagId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { target_bag_id } = body;

    if (!target_bag_id || typeof target_bag_id !== 'string') {
      return NextResponse.json(
        { error: 'target_bag_id is required' },
        { status: 400 }
      );
    }

    // Get the item and verify ownership through bag
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags:bags!bag_items_bag_id_fkey(id, owner_id)')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object, not array in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sourceBagId = item.bag_id;

    // Can't move to the same bag
    if (sourceBagId === target_bag_id) {
      return NextResponse.json(
        { error: 'Item is already in this bag' },
        { status: 400 }
      );
    }

    // Verify target bag exists and is owned by user
    const { data: targetBag, error: targetBagError } = await supabase
      .from('bags')
      .select('id, owner_id, title')
      .eq('id', target_bag_id)
      .single();

    if (targetBagError || !targetBag) {
      return NextResponse.json(
        { error: 'Target bag not found' },
        { status: 404 }
      );
    }

    if (targetBag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own the target bag' },
        { status: 403 }
      );
    }

    // Get the current max sort_index for target bag
    const { data: maxItem } = await supabase
      .from('bag_items')
      .select('sort_index')
      .eq('bag_id', target_bag_id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    const nextSortIndex = maxItem ? maxItem.sort_index + 1 : 1;

    // Move the item atomically - update bag_id and sort_index
    // Links have FK to bag_items, so they follow automatically
    const { data: updatedItem, error: updateError } = await supabase
      .from('bag_items')
      .update({
        bag_id: target_bag_id,
        sort_index: nextSortIndex,
        section_id: null, // Reset section since sections are bag-specific
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error moving item:', updateError);
      return NextResponse.json(
        { error: 'Failed to move item' },
        { status: 500 }
      );
    }

    // Update timestamps for both bags
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('bags').update({ updated_at: now }).eq('id', sourceBagId),
      supabase.from('bags').update({ updated_at: now }).eq('id', target_bag_id),
    ]);

    return NextResponse.json({
      success: true,
      item: updatedItem,
      sourceBagId,
      targetBagId: target_bag_id,
      targetBagTitle: targetBag.title,
      message: `Item moved to "${targetBag.title}"`,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/[id]/move-to-bag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
