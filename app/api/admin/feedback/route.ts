import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feedback
 * Get all feedback with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // bug, feature, question, praise
  const status = searchParams.get('status'); // new, reviewing, planned, in_progress, resolved, wontfix, duplicate
  const priority = searchParams.get('priority'); // low, normal, high, urgent
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Build query
  let query = supabase
    .from('feedback')
    .select(
      `
      *,
      profiles:user_id (
        id,
        handle,
        display_name,
        avatar_url
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  // Apply filters
  if (type) {
    query = query.eq('type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }
  if (search) {
    // Search in subject and message (or title/description if those are the actual columns)
    query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: feedback, error, count } = await query;

  if (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  // Get stats
  const { data: allFeedback } = await supabase
    .from('feedback')
    .select('type, status');

  const stats = {
    total: allFeedback?.length || 0,
    byType: {
      bug: allFeedback?.filter((f) => f.type === 'bug').length || 0,
      feature: allFeedback?.filter((f) => f.type === 'feature').length || 0,
      question: allFeedback?.filter((f) => f.type === 'question').length || 0,
      praise: allFeedback?.filter((f) => f.type === 'praise').length || 0,
    },
    byStatus: {
      new: allFeedback?.filter((f) => f.status === 'new').length || 0,
      reviewing: allFeedback?.filter((f) => f.status === 'reviewing').length || 0,
      resolved: allFeedback?.filter((f) => f.status === 'resolved').length || 0,
    },
  };

  return NextResponse.json({
    feedback: feedback || [],
    stats,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

/**
 * PATCH /api/admin/feedback
 * Update feedback status, priority, or add admin response
 */
export async function PATCH(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;
  const { admin } = result;

  const body = await request.json();
  const { id, status, priority, admin_response, assigned_to, resolution_notes } = body;

  if (!id) {
    return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get current feedback state
  const { data: currentFeedback } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentFeedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (admin_response !== undefined) updates.admin_response = admin_response;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;

  // Set resolved_at if status is being set to resolved
  if (status === 'resolved' && currentFeedback.status !== 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  // Log admin action
  await logAdminAction(admin, 'feedback.update', 'feedback', id, {
    changes: updates,
    previous: {
      status: currentFeedback.status,
      priority: currentFeedback.priority,
    },
  });

  return NextResponse.json({ feedback: updated });
}
