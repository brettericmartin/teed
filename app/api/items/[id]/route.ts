import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * PUT /api/items/[id]
 * Update an item
 *
 * Body:
 * {
 *   custom_name?: string
 *   custom_description?: string
 *   brand?: string | null
 *   notes?: string
 *   quantity?: number
 *   sort_index?: number
 *   custom_photo_id?: string | null
 *   promo_codes?: string | null
 *   is_featured?: boolean
 *   featured_position?: number | null
 * }
 *
 * Returns: Updated item object
 */
export async function PUT(
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

    // Get the item and verify ownership through bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags:bags!bag_items_bag_id_fkey(owner_id)')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object, not array in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    if (body.custom_name !== undefined) {
      if (typeof body.custom_name !== 'string' || body.custom_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'custom_name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.custom_name = body.custom_name.trim();
    }

    if (body.custom_description !== undefined) {
      updates.custom_description = body.custom_description?.trim() || null;
    }

    if (body.brand !== undefined) {
      updates.brand = body.brand?.trim() || null;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (body.quantity !== undefined) {
      updates.quantity = Number(body.quantity) || 1;
    }

    if (body.sort_index !== undefined) {
      updates.sort_index = Number(body.sort_index);
    }

    if (body.custom_photo_id !== undefined) {
      updates.custom_photo_id = body.custom_photo_id || null;
    }

    if (body.promo_codes !== undefined) {
      updates.promo_codes = body.promo_codes?.trim() || null;
    }

    if (body.is_featured !== undefined) {
      updates.is_featured = Boolean(body.is_featured);
    }

    if (body.featured_position !== undefined) {
      updates.featured_position = body.featured_position ? Number(body.featured_position) : null;
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('bag_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', item.bag_id);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Unexpected error in PUT /api/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/items/[id]
 * Delete an item (cascade deletes its links)
 *
 * Returns: { success: true }
 */
export async function DELETE(
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

    // Get the item and verify ownership through bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags:bags!bag_items_bag_id_fkey(owner_id)')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object, not array in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the item (cascade will handle links)
    const { error: deleteError } = await supabase
      .from('bag_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', item.bag_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
