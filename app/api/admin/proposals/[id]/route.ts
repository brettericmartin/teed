import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { ProposalUpdateRequest } from '@/lib/types/proposal';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/proposals/[id]
 * Get a single proposal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: proposal, error } = await supabase
    .from('strategic_proposals')
    .select(
      `
      *,
      decider:decided_by (
        id,
        handle,
        display_name
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}

/**
 * PATCH /api/admin/proposals/[id]
 * Update proposal status, feedback, or decision rationale
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const { id } = await params;
  const body: ProposalUpdateRequest = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get current proposal state
  const { data: currentProposal } = await supabase
    .from('strategic_proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentProposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Build update object
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    updates.status = body.status;

    // If status is changing to a decision status, record who and when
    if (['approved', 'rejected', 'needs_research'].includes(body.status)) {
      updates.decided_by = admin.id;
      updates.decided_at = new Date().toISOString();
    }
  }

  if (body.admin_feedback !== undefined) {
    updates.admin_feedback = body.admin_feedback;
  }

  if (body.decision_rationale !== undefined) {
    updates.decision_rationale = body.decision_rationale;
  }

  const { data: updated, error } = await supabase
    .from('strategic_proposals')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      decider:decided_by (
        id,
        handle,
        display_name
      )
    `
    )
    .single();

  if (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }

  // Log admin action
  await logAdminAction(admin, 'settings.update', 'system', id, {
    action: 'proposal.update',
    title: currentProposal.title,
    changes: updates,
    previous: {
      status: currentProposal.status,
      admin_feedback: currentProposal.admin_feedback,
    },
  });

  return NextResponse.json({ proposal: updated });
}

/**
 * DELETE /api/admin/proposals/[id]
 * Delete a proposal (super_admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('super_admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get proposal before delete for logging
  const { data: proposal } = await supabase
    .from('strategic_proposals')
    .select('title, category')
    .eq('id', id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('strategic_proposals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }

  await logAdminAction(admin, 'content.delete', 'system', id, {
    action: 'proposal.delete',
    title: proposal.title,
    category: proposal.category,
  });

  return NextResponse.json({ success: true });
}
