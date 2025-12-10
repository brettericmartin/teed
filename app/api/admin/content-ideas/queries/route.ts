import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type {
  SearchQuery,
  ContentVertical,
  SearchQueryType,
  CreateSearchQueryRequest,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/content-ideas/queries
 * List all search queries with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical') as ContentVertical | null;
    const queryType = searchParams.get('type') as SearchQueryType | null;
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabaseAdmin
      .from('content_search_queries')
      .select('*')
      .order('vertical', { ascending: true })
      .order('priority', { ascending: false });

    if (vertical) {
      query = query.eq('vertical', vertical);
    }

    if (queryType) {
      query = query.eq('query_type', queryType);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Queries] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 });
    }

    // Get counts by vertical and type
    const byVertical: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let activeCount = 0;

    data?.forEach(q => {
      byVertical[q.vertical] = (byVertical[q.vertical] || 0) + 1;
      byType[q.query_type] = (byType[q.query_type] || 0) + 1;
      if (q.is_active) activeCount++;
    });

    return NextResponse.json({
      queries: data || [],
      total: data?.length || 0,
      activeCount,
      byVertical,
      byType,
    });
  } catch (error) {
    console.error('[Queries] GET error:', error);
    return NextResponse.json({ error: 'Failed to get queries' }, { status: 500 });
  }
}

/**
 * POST /api/admin/content-ideas/queries
 * Create a new search query
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const body: CreateSearchQueryRequest = await request.json();

    if (!body.query || !body.vertical) {
      return NextResponse.json(
        { error: 'query and vertical are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('content_search_queries')
      .select('id')
      .eq('query', body.query)
      .eq('vertical', body.vertical)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A query with this text already exists for this vertical' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('content_search_queries')
      .insert({
        query: body.query,
        vertical: body.vertical,
        query_type: body.query_type || 'evergreen',
        priority: body.priority ?? 50,
        is_active: body.is_active ?? true,
        starts_at: body.starts_at || null,
        expires_at: body.expires_at || null,
        notes: body.notes || null,
        source: body.source || 'manual',
        created_by_admin_id: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Queries] Create error:', error);
      return NextResponse.json({ error: 'Failed to create query' }, { status: 500 });
    }

    await logAdminAction(admin, 'content.flag', 'search_query', data.id, {
      action: 'create_query',
      query: body.query,
      vertical: body.vertical,
      query_type: body.query_type,
    });

    return NextResponse.json({ query: data }, { status: 201 });
  } catch (error) {
    console.error('[Queries] POST error:', error);
    return NextResponse.json({ error: 'Failed to create query' }, { status: 500 });
  }
}
