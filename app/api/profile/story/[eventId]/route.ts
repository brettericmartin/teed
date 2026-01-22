import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: Promise<{ eventId: string }>;
};

/**
 * PATCH /api/profile/story/[eventId]
 * Toggle visibility of a specific story event
 *
 * Body: { is_visible: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { is_visible } = body;

    if (typeof is_visible !== 'boolean') {
      return NextResponse.json(
        { error: 'is_visible must be a boolean' },
        { status: 400 }
      );
    }

    // Update the story entry (RLS ensures ownership)
    const { data: updated, error: updateError } = await supabase
      .from('profile_story')
      .update({ is_visible })
      .eq('id', eventId)
      .eq('profile_id', user.id) // Extra safety
      .select()
      .single();

    if (updateError) {
      console.error('Error updating story entry:', updateError);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error('PATCH /api/profile/story/[eventId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/story/[eventId]
 * Delete a specific story event
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the story entry (RLS ensures ownership)
    const { error: deleteError } = await supabase
      .from('profile_story')
      .delete()
      .eq('id', eventId)
      .eq('profile_id', user.id);

    if (deleteError) {
      console.error('Error deleting story entry:', deleteError);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profile/story/[eventId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
