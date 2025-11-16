import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/items/[id]/links
 * Add a link to an item
 *
 * Body:
 * {
 *   url: string (required)
 *   kind: string (required) - e.g., 'purchase', 'review', 'video', 'other'
 *   label?: string
 *   metadata?: object - scraped data (title, image, price, etc.)
 * }
 *
 * Returns: Created link object
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
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags(owner_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { url, kind, label, metadata } = body;

    // Validate required fields
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { error: 'url is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!kind || typeof kind !== 'string' || kind.trim().length === 0) {
      return NextResponse.json(
        { error: 'kind is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'url must be a valid URL' },
        { status: 400 }
      );
    }

    // Create the link
    const { data: link, error: createError } = await supabase
      .from('links')
      .insert({
        bag_item_id: itemId,
        url: url.trim(),
        kind: kind.trim(),
        label: label?.trim() || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating link:', createError);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', item.bag_id);

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/[id]/links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
