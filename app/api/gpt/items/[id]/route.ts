import { NextRequest, NextResponse } from 'next/server';
import { authenticateGptRequest } from '@/lib/gptAuth';

/**
 * GET /api/gpt/items/[id]
 * Get a specific item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, supabase } = await authenticateGptRequest();

    // Get the item with its bag info
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select(`
        id,
        custom_name,
        custom_description,
        brand,
        quantity,
        notes,
        photo_url,
        sort_index,
        bag_id,
        bags!inner (
          id,
          code,
          title,
          owner_id,
          is_public
        )
      `)
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const bag = (item as any).bags;

    // Check if user has access
    const isOwner = user?.id === bag.owner_id;
    const isPublic = bag.is_public === true;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get links for this item
    const { data: links } = await supabase
      .from('links')
      .select('id, url, kind, label')
      .eq('bag_item_id', item.id);

    return NextResponse.json({
      id: item.id,
      name: item.custom_name,
      description: item.custom_description,
      brand: item.brand,
      quantity: item.quantity,
      notes: item.notes,
      photo_url: item.photo_url,
      bag: {
        code: bag.code,
        title: bag.title,
      },
      links: (links || []).map(link => ({
        url: link.url,
        kind: link.kind,
        label: link.label,
      })),
      is_owner: isOwner,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gpt/items/[id]
 * Update an item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, supabase, error: authError } = await authenticateGptRequest();

    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get the item with bag to verify ownership
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select(`
        id,
        custom_name,
        bag_id,
        bags!inner (
          id,
          owner_id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const bag = (item as any).bags;

    if (bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update items in your own bags' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.custom_name !== undefined) {
      if (typeof body.custom_name !== 'string' || body.custom_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Item name must be a non-empty string' },
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

    if (body.quantity !== undefined) {
      updates.quantity = Math.max(1, parseInt(body.quantity) || 1);
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
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

    return NextResponse.json({
      id: updatedItem.id,
      name: updatedItem.custom_name,
      description: updatedItem.custom_description,
      brand: updatedItem.brand,
      quantity: updatedItem.quantity,
      bag_title: bag.title,
      message: `Updated "${updatedItem.custom_name}" successfully!`,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/gpt/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gpt/items/[id]
 * Delete an item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, supabase, error: authError } = await authenticateGptRequest();

    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get the item with bag to verify ownership
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select(`
        id,
        custom_name,
        bag_id,
        bags!inner (
          id,
          owner_id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const bag = (item as any).bags;

    if (bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete items from your own bags' },
        { status: 403 }
      );
    }

    const itemName = item.custom_name;

    // Delete the item
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

    return NextResponse.json({
      success: true,
      message: `Removed "${itemName}" from "${bag.title}".`,
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/gpt/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
