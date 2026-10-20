import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { readProductPage, applyPageFactsToItem } from '@/lib/items/enrichFromLink';

export const maxDuration = 30;

/**
 * POST /api/items/[id]/links/read
 * Read one of the item's product links and fill the item from the page.
 *
 * Body: { url: string, replacePhoto?: boolean }
 *   replacePhoto: true swaps the current photo for the page's image (the user asked for it);
 *   otherwise only an empty photo is filled. Brand, category and list price fill only when empty.
 *
 * Returns: { facts, updates, filled }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, brand, category, photo_url, custom_photo_id, specs, bags:bags!bag_items_bag_id_fkey(owner_id)')
      .eq('id', itemId)
      .single();
    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    // @ts-ignore - bags is an object in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const replacePhoto = body.replacePhoto === true;
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'url must be a valid URL' }, { status: 400 });
    }

    // Only one of this item's own links can be read (no open fetch proxy)
    const { data: ownLink } = await supabase
      .from('links')
      .select('id')
      .eq('bag_item_id', itemId)
      .eq('url', url)
      .maybeSingle();
    if (!ownLink) {
      return NextResponse.json({ error: 'That link is not on this item' }, { status: 400 });
    }

    const facts = await readProductPage(url);
    if (!facts) {
      return NextResponse.json({ facts: null, updates: {}, filled: [], message: 'Nothing usable could be read from that page' });
    }

    const current = replacePhoto ? { ...item, photo_url: null, custom_photo_id: null } : item;
    const applied = await applyPageFactsToItem(supabase, user.id, current, facts);

    return NextResponse.json({ facts, updates: applied.updates, filled: applied.filled });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/[id]/links/read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
