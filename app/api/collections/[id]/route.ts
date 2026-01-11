import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { UpdateBagCollectionInput } from '@/lib/types/bagCollection';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/collections/[id]
 * Get a specific collection with its bags
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch collection with bags
    const { data: collection, error } = await supabase
      .from('bag_collections')
      .select(`
        id,
        owner_id,
        name,
        description,
        emoji,
        sort_index,
        is_featured,
        is_visible,
        created_at,
        updated_at,
        items:bag_collection_items(
          id,
          sort_index,
          added_at,
          bag:bags(
            id,
            code,
            title,
            description,
            cover_photo_id,
            is_public,
            created_at
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check visibility
    const isOwner = user?.id === collection.owner_id;
    if (!collection.is_visible && !isOwner) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Filter out private bags for non-owners
    if (!isOwner && collection.items) {
      collection.items = collection.items.filter(
        (item: any) => item.bag?.is_public
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error in GET /api/collections/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/collections/[id]
 * Update a collection
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: collection, error: fetchError } = await supabase
      .from('bag_collections')
      .select('id, owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: UpdateBagCollectionInput = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.emoji !== undefined) updates.emoji = body.emoji || null;
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
    if (body.is_visible !== undefined) updates.is_visible = body.is_visible;
    if (body.sort_index !== undefined) updates.sort_index = body.sort_index;

    const { data: updatedCollection, error: updateError } = await supabase
      .from('bag_collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A collection with this name already exists' },
          { status: 400 }
        );
      }
      console.error('Error updating collection:', updateError);
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
    }

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error in PUT /api/collections/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[id]
 * Delete a collection (bags remain, just removed from collection)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: collection, error: fetchError } = await supabase
      .from('bag_collections')
      .select('id, owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete collection (items will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('bag_collections')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting collection:', deleteError);
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/collections/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
