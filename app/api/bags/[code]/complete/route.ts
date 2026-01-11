import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * PATCH /api/bags/[code]/complete
 * Toggle the completion status of a bag.
 *
 * DOCTRINE: Core constructive dopamine - rewards "having built something"
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createServerSupabase();
  const { code } = await params;

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current bag state
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select('id, is_complete, completed_at, owner_id')
    .eq('code', code)
    .eq('owner_id', user.id)
    .single();

  if (bagError || !bag) {
    return NextResponse.json(
      { error: 'Bag not found or not authorized' },
      { status: 404 }
    );
  }

  // Toggle completion status
  const newIsComplete = !bag.is_complete;
  const newCompletedAt = newIsComplete ? new Date().toISOString() : null;

  const { data: updatedBag, error: updateError } = await supabase
    .from('bags')
    .update({
      is_complete: newIsComplete,
      completed_at: newCompletedAt,
    })
    .eq('id', bag.id)
    .select('id, code, is_complete, completed_at')
    .single();

  if (updateError) {
    console.error('Error updating bag completion:', updateError);
    return NextResponse.json(
      { error: 'Failed to update bag completion status' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    is_complete: updatedBag.is_complete,
    completed_at: updatedBag.completed_at,
  });
}
