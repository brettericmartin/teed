import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/gpt/bags/[code]
 * Get a bag by its code, including all items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get the bag by code
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('*')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check if user has access
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = user?.id === bag.owner_id;
    const isPublic = bag.is_public === true;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Get owner's handle
    const { data: owner } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('id', bag.owner_id)
      .single();

    // Get all items in this bag
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, custom_description, brand, quantity, sort_index, photo_url')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching bag items:', itemsError);
    }

    return NextResponse.json({
      id: bag.id,
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_public: bag.is_public,
      is_owner: isOwner,
      owner: owner ? {
        handle: owner.handle,
        display_name: owner.display_name,
      } : null,
      url: owner?.handle ? `https://teed.club/u/${owner.handle}/${bag.code}` : null,
      items: (items || []).map(item => ({
        id: item.id,
        name: item.custom_name,
        description: item.custom_description,
        brand: item.brand,
        quantity: item.quantity,
        photo_url: item.photo_url,
      })),
      item_count: (items || []).length,
      created_at: bag.created_at,
      updated_at: bag.updated_at,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gpt/bags/[code]
 * Update a bag
 */
export async function PUT(
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
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get the bag to verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own bags' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.is_public !== undefined) {
      updates.is_public = Boolean(body.is_public);
    }

    if (body.category !== undefined) {
      const allowedCategories = [
        'golf', 'travel', 'tech', 'camping', 'photography',
        'fitness', 'cooking', 'music', 'art', 'gaming', 'other'
      ];
      if (body.category && !allowedCategories.includes(body.category)) {
        return NextResponse.json(
          { error: `Invalid category. Allowed: ${allowedCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updates.category = body.category || null;
    }

    updates.updated_at = new Date().toISOString();

    // Update the bag
    const { data: updatedBag, error: updateError } = await supabase
      .from('bags')
      .update(updates)
      .eq('id', bag.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating bag:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedBag.id,
      code: updatedBag.code,
      title: updatedBag.title,
      description: updatedBag.description,
      category: updatedBag.category,
      is_public: updatedBag.is_public,
      message: `Bag "${updatedBag.title}" updated successfully!`,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/gpt/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gpt/bags/[code]
 * Delete a bag
 */
export async function DELETE(
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
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get the bag to verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, title')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own bags' },
        { status: 403 }
      );
    }

    // Delete the bag (cascade will handle items and links)
    const { error: deleteError } = await supabase
      .from('bags')
      .delete()
      .eq('id', bag.id);

    if (deleteError) {
      console.error('Error deleting bag:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bag' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Bag "${bag.title}" has been permanently deleted.`,
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/gpt/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
