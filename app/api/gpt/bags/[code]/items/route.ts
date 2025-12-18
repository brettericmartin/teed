import { NextRequest, NextResponse } from 'next/server';
import { authenticateGptRequest } from '@/lib/gptAuth';

/**
 * GET /api/gpt/bags/[code]/items
 * List all items in a bag
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, supabase } = await authenticateGptRequest();

    // Get the bag by code
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, is_public, title')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check if user has access
    const isOwner = user?.id === bag.owner_id;
    const isPublic = bag.is_public === true;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Get all items in this bag
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, custom_description, brand, quantity, sort_index, notes, photo_url')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching bag items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bag_title: bag.title,
      items: (items || []).map(item => ({
        id: item.id,
        name: item.custom_name,
        description: item.custom_description,
        brand: item.brand,
        quantity: item.quantity,
        notes: item.notes,
        photo_url: item.photo_url,
      })),
      item_count: (items || []).length,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/bags/[code]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gpt/bags/[code]/items
 * Add a new item to a bag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, supabase, error: authError } = await authenticateGptRequest();

    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please sign in to your Teed account.' },
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
        { error: 'You can only add items to your own bags' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { custom_name, custom_description, brand, quantity = 1 } = body;

    // Validate required fields
    if (!custom_name || typeof custom_name !== 'string' || custom_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Item name (custom_name) is required' },
        { status: 400 }
      );
    }

    // Get current max sort_index for this bag
    const { data: maxItem } = await supabase
      .from('bag_items')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    const nextSortIndex = (maxItem?.sort_index ?? -1) + 1;

    // Insert the item
    const { data: item, error: insertError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: custom_name.trim(),
        custom_description: custom_description?.trim() || null,
        brand: brand?.trim() || null,
        quantity: Math.max(1, quantity),
        sort_index: nextSortIndex,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding item:', insertError);
      return NextResponse.json(
        { error: 'Failed to add item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: item.id,
      name: item.custom_name,
      description: item.custom_description,
      brand: item.brand,
      quantity: item.quantity,
      bag_title: bag.title,
      message: `Added "${item.custom_name}" to "${bag.title}"!`,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/gpt/bags/[code]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
