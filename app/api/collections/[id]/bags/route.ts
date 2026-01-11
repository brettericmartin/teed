import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/collections/[id]/bags
 * Add bags to a collection
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify collection ownership
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

    const body = await request.json();
    const { bag_ids } = body;

    if (!bag_ids || !Array.isArray(bag_ids) || bag_ids.length === 0) {
      return NextResponse.json({ error: 'bag_ids array is required' }, { status: 400 });
    }

    // Verify bags belong to user
    const { data: userBags } = await supabase
      .from('bags')
      .select('id')
      .eq('owner_id', user.id)
      .in('id', bag_ids);

    const validBagIds = userBags?.map((b) => b.id) || [];

    if (validBagIds.length === 0) {
      return NextResponse.json({ error: 'No valid bags found' }, { status: 400 });
    }

    // Get current max sort index
    const { data: existingItems } = await supabase
      .from('bag_collection_items')
      .select('sort_index')
      .eq('collection_id', id)
      .order('sort_index', { ascending: false })
      .limit(1);

    let nextSortIndex = (existingItems?.[0]?.sort_index || 0) + 1;

    // Add bags to collection (ignore duplicates)
    const collectionItems = validBagIds.map((bagId) => ({
      collection_id: id,
      bag_id: bagId,
      sort_index: nextSortIndex++,
    }));

    const { data: addedItems, error: insertError } = await supabase
      .from('bag_collection_items')
      .upsert(collectionItems, {
        onConflict: 'collection_id,bag_id',
        ignoreDuplicates: true,
      })
      .select();

    if (insertError) {
      console.error('Error adding bags to collection:', insertError);
      return NextResponse.json({ error: 'Failed to add bags' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added: addedItems?.length || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/collections/[id]/bags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[id]/bags
 * Remove bags from a collection
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

    // Verify collection ownership
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

    const body = await request.json();
    const { bag_ids } = body;

    if (!bag_ids || !Array.isArray(bag_ids) || bag_ids.length === 0) {
      return NextResponse.json({ error: 'bag_ids array is required' }, { status: 400 });
    }

    // Remove bags from collection
    const { error: deleteError } = await supabase
      .from('bag_collection_items')
      .delete()
      .eq('collection_id', id)
      .in('bag_id', bag_ids);

    if (deleteError) {
      console.error('Error removing bags from collection:', deleteError);
      return NextResponse.json({ error: 'Failed to remove bags' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/collections/[id]/bags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/collections/[id]/bags
 * Reorder bags within a collection
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

    // Verify collection ownership
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

    const body = await request.json();
    const { bag_order } = body; // Array of bag_ids in new order

    if (!bag_order || !Array.isArray(bag_order)) {
      return NextResponse.json({ error: 'bag_order array is required' }, { status: 400 });
    }

    // Update sort indexes
    for (let i = 0; i < bag_order.length; i++) {
      await supabase
        .from('bag_collection_items')
        .update({ sort_index: i })
        .eq('collection_id', id)
        .eq('bag_id', bag_order[i]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/collections/[id]/bags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
