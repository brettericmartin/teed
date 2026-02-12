import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

interface SourceLink {
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
}

interface SourceItem {
  custom_name: string;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  photo_url: string | null;
  custom_photo_id: string | null;
  promo_codes: string | null;
  links: SourceLink[];
}

/**
 * POST /api/items/copy-to-bag
 * Copy an item (with all its links) to a target bag owned by the current user
 *
 * Body:
 * {
 *   target_bag_code: string
 *   source_item: {
 *     custom_name: string
 *     brand?: string
 *     custom_description?: string
 *     notes?: string
 *     quantity?: number
 *     photo_url?: string
 *     promo_codes?: string
 *     links: Array<{ url, kind, label, metadata }>
 *   }
 * }
 *
 * Returns: { success: true, item: {...}, linksCreated: number }
 */
export async function POST(request: NextRequest) {
  try {
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
    const { target_bag_code, source_item } = body as {
      target_bag_code: string;
      source_item: SourceItem;
    };

    // Validate required fields
    if (!target_bag_code || typeof target_bag_code !== 'string') {
      return NextResponse.json(
        { error: 'target_bag_code is required' },
        { status: 400 }
      );
    }

    if (!source_item || !source_item.custom_name) {
      return NextResponse.json(
        { error: 'source_item with custom_name is required' },
        { status: 400 }
      );
    }

    // Get the target bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', target_bag_code)
      .eq('owner_id', user.id)
      .single();

    if (bagError || !bag) {
      return NextResponse.json(
        { error: 'Bag not found or you do not own it' },
        { status: 404 }
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
    const { data: newItem, error: createError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: source_item.custom_name.trim(),
        custom_description: source_item.custom_description?.trim() || null,
        brand: source_item.brand?.trim() || null,
        notes: source_item.notes?.trim() || null,
        quantity: source_item.quantity || 1,
        photo_url: source_item.photo_url || null,
        custom_photo_id: source_item.custom_photo_id || null,
        promo_codes: source_item.promo_codes || null,
        sort_index: nextSortIndex,
      })
      .select()
      .single();

    if (createError || !newItem) {
      console.error('Error creating item:', createError);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    // Copy all links to the new item
    let linksCreated = 0;
    const links = source_item.links || [];

    for (const link of links) {
      if (!link.url) continue;

      const { error: linkError } = await supabase.from('links').insert({
        bag_item_id: newItem.id,
        url: link.url,
        kind: link.kind || 'product',
        label: link.label || null,
        metadata: link.metadata || null,
        is_auto_generated: false, // Mark as not auto-generated since it's a copy
      });

      if (linkError) {
        console.error('Error copying link:', linkError);
        // Continue copying other links
      } else {
        linksCreated++;
      }
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    return NextResponse.json(
      {
        success: true,
        item: newItem,
        linksCreated,
        message: `Item added with ${linksCreated} link${linksCreated !== 1 ? 's' : ''}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/items/copy-to-bag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
