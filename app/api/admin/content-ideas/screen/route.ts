import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { ScreenIdeasRequest, ScreenIdeasResponse } from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/admin/content-ideas/screen
 * Stage 2: Screening - Admin selects or skips discovered ideas
 * Batch operation to select top candidates for generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    // Parse request body
    const body: ScreenIdeasRequest = await request.json();

    if (!body.ideaIds || !Array.isArray(body.ideaIds) || body.ideaIds.length === 0) {
      return NextResponse.json({ error: 'ideaIds array is required' }, { status: 400 });
    }

    if (!body.action || !['select', 'skip'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be "select" or "skip"' }, { status: 400 });
    }

    const { ideaIds, action, notes } = body;
    const newStatus = action === 'select' ? 'selected' : 'skipped';
    const now = new Date().toISOString();

    // Verify all ideas exist and are in a screenable state
    const { data: ideas, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('id, status')
      .in('id', ideaIds);

    if (fetchError) {
      console.error('[Screen] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }

    // Filter to only screenable ideas (discovered or screening status)
    const screenableStatuses = ['discovered', 'new', 'screening'];
    const screenableIds = ideas
      ?.filter(i => screenableStatuses.includes(i.status))
      .map(i => i.id) || [];

    if (screenableIds.length === 0) {
      return NextResponse.json(
        { error: 'No ideas in screenable state (discovered/screening)' },
        { status: 400 }
      );
    }

    // Update the ideas
    const { error: updateError } = await supabaseAdmin
      .from('content_ideas')
      .update({
        status: newStatus,
        screened_at: now,
        screened_by_admin_id: admin.id,
        screening_notes: notes || null,
      })
      .in('id', screenableIds);

    if (updateError) {
      console.error('[Screen] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update ideas' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(admin, 'content.flag', 'content_ideas', null, {
      action: `screen_${action}`,
      idea_count: screenableIds.length,
      idea_ids: screenableIds,
      notes: notes || null,
    });

    const response: ScreenIdeasResponse = {
      success: true,
      processed: screenableIds.length,
      selected: action === 'select' ? screenableIds.length : 0,
      skipped: action === 'skip' ? screenableIds.length : 0,
    };

    console.log(`[Screen] ${action}ed ${screenableIds.length} ideas`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Screen] Fatal error:', error);
    return NextResponse.json(
      { error: 'Screening failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/content-ideas/screen
 * Get ideas ready for screening (discovered status)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build query for discovered ideas
    let query = supabaseAdmin
      .from('content_ideas')
      .select(`
        id,
        source_platform,
        source_url,
        source_channel_name,
        source_published_at,
        source_metadata,
        vertical,
        has_creator_affiliate,
        extracted_products,
        discovered_at,
        created_at
      `)
      .in('status', ['discovered', 'new'])
      .order('discovered_at', { ascending: false })
      .limit(limit);

    if (vertical) {
      query = query.eq('vertical', vertical);
    }

    const { data: ideas, error, count } = await query;

    if (error) {
      console.error('[Screen] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }

    // Get counts by vertical
    const { data: verticalCounts } = await supabaseAdmin
      .from('content_ideas')
      .select('vertical')
      .in('status', ['discovered', 'new']);

    const byVertical: Record<string, number> = {};
    verticalCounts?.forEach(row => {
      const v = row.vertical || 'unknown';
      byVertical[v] = (byVertical[v] || 0) + 1;
    });

    // Get count of already selected
    const { count: selectedCount } = await supabaseAdmin
      .from('content_ideas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'selected');

    return NextResponse.json({
      ideas: ideas || [],
      total: ideas?.length || 0,
      byVertical,
      selectedCount: selectedCount || 0,
    });
  } catch (error) {
    console.error('[Screen] GET error:', error);
    return NextResponse.json({ error: 'Failed to get screening queue' }, { status: 500 });
  }
}
