import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

type RouteParams = {
  params: Promise<{ code: string; entryId: string }>;
};

/**
 * PATCH /api/bags/[code]/history/[entryId]
 * Update a history entry's visibility or curator note
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { code, entryId } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { is_visible, change_note } = body;

    // Validate that at least one field is being updated
    if (is_visible === undefined && change_note === undefined) {
      return NextResponse.json(
        { error: 'No fields to update. Provide is_visible or change_note.' },
        { status: 400 }
      );
    }

    // Fetch bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the history entry belongs to this bag
    const { data: entry, error: entryError } = await supabase
      .from('item_version_history')
      .select('id, bag_id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    if (entry.bag_id !== bag.id) {
      return NextResponse.json(
        { error: 'History entry does not belong to this bag' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};

    if (is_visible !== undefined) {
      updates.is_visible = is_visible;
    }

    if (change_note !== undefined) {
      // Enforce 140 character limit for notes (like a caption)
      if (change_note && change_note.length > 140) {
        return NextResponse.json(
          { error: 'Note must be 140 characters or less' },
          { status: 400 }
        );
      }
      updates.change_note = change_note || null;
      updates.note_updated_at = new Date().toISOString();
    }

    // Update the history entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('item_version_history')
      .update(updates)
      .eq('id', entryId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating history entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update history entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: updatedEntry.id,
        isVisible: updatedEntry.is_visible,
        curatorNote: updatedEntry.change_note,
        noteUpdatedAt: updatedEntry.note_updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/bags/[code]/history/[entryId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
