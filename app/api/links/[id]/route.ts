import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * PUT /api/links/[id]
 * Update a link
 *
 * Body:
 * {
 *   url?: string
 *   kind?: string
 *   label?: string
 *   metadata?: object
 * }
 *
 * Returns: Updated link object
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

    // Get the link and verify ownership through bag_item -> bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, bag_item_id, bag_items(bag_id, bags:bags!bag_items_bag_id_fkey(owner_id))')
      .eq('id', id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // @ts-ignore - nested joins
    const ownerId = link.bag_items?.bags?.owner_id;
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    if (body.url !== undefined) {
      if (typeof body.url !== 'string' || body.url.trim().length === 0) {
        return NextResponse.json(
          { error: 'url must be a non-empty string' },
          { status: 400 }
        );
      }

      // Validate URL format
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'url must be a valid URL' },
          { status: 400 }
        );
      }

      updates.url = body.url.trim();
    }

    if (body.kind !== undefined) {
      if (typeof body.kind !== 'string' || body.kind.trim().length === 0) {
        return NextResponse.json(
          { error: 'kind must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.kind = body.kind.trim();
    }

    if (body.label !== undefined) {
      updates.label = body.label?.trim() || null;
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata || null;
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await supabase
      .from('links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating link:', updateError);
      return NextResponse.json(
        { error: 'Failed to update link' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    // @ts-ignore
    const bagId = link.bag_items?.bag_id;
    if (bagId) {
      await supabase
        .from('bags')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bagId);
    }

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Unexpected error in PUT /api/links/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/links/[id]
 * Delete a link
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

    // Get the link and verify ownership through bag_item -> bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, bag_item_id, bag_items(bag_id, bags:bags!bag_items_bag_id_fkey(owner_id))')
      .eq('id', id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // @ts-ignore - nested joins
    const ownerId = link.bag_items?.bags?.owner_id;
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    // @ts-ignore
    const bagId = link.bag_items?.bag_id;
    if (bagId) {
      await supabase
        .from('bags')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bagId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/links/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
