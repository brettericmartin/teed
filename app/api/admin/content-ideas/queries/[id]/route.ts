import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { UpdateSearchQueryRequest } from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/content-ideas/queries/[id]
 * Get a single search query
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('content_search_queries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    return NextResponse.json({ query: data });
  } catch (error) {
    console.error('[Queries] GET error:', error);
    return NextResponse.json({ error: 'Failed to get query' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/content-ideas/queries/[id]
 * Update a search query
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await context.params;
    const body: UpdateSearchQueryRequest = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {
      updated_by_admin_id: admin.id,
    };

    if (body.query !== undefined) updates.query = body.query;
    if (body.vertical !== undefined) updates.vertical = body.vertical;
    if (body.query_type !== undefined) updates.query_type = body.query_type;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.starts_at !== undefined) updates.starts_at = body.starts_at;
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabaseAdmin
      .from('content_search_queries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Queries] Update error:', error);
      return NextResponse.json({ error: 'Failed to update query' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    await logAdminAction(admin, 'content.flag', 'search_query', id, {
      action: 'update_query',
      updates: Object.keys(body),
    });

    return NextResponse.json({ query: data });
  } catch (error) {
    console.error('[Queries] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update query' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/content-ideas/queries/[id]
 * Delete a search query
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await context.params;

    // Get query info before deleting
    const { data: existing } = await supabaseAdmin
      .from('content_search_queries')
      .select('query, vertical')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('content_search_queries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Queries] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
    }

    await logAdminAction(admin, 'content.delete', 'search_query', id, {
      action: 'delete_query',
      query: existing.query,
      vertical: existing.vertical,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Queries] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
  }
}
