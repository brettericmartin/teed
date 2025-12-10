import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type {
  ContentIdea,
  ContentIdeasFilters,
  ContentIdeasListResponse,
  ContentIdeasStats,
  ContentIdeaStatus,
  ContentVertical,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/content-ideas
 * List content ideas with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: ContentIdeasFilters = {
      status: searchParams.get('status') as ContentIdeaStatus | undefined,
      vertical: searchParams.get('vertical') as ContentVertical | undefined,
      hasCreatorAffiliate: searchParams.get('hasCreatorAffiliate') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100),
    };

    // Build query
    let query = supabaseAdmin
      .from('content_ideas')
      .select(
        `
        id,
        source_platform,
        source_url,
        source_channel_name,
        source_creator_handle,
        source_published_at,
        source_metadata,
        primary_bag_id,
        primary_catalog_item_id,
        hero_catalog_item_ids,
        vertical,
        idea_title,
        idea_summary,
        tags,
        has_creator_affiliate,
        status,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.vertical) {
      query = query.eq('vertical', filters.vertical);
    }
    if (filters.hasCreatorAffiliate !== undefined) {
      query = query.eq('has_creator_affiliate', filters.hasCreatorAffiliate);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters.search) {
      query = query.or(
        `idea_title.ilike.%${filters.search}%,source_channel_name.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching content ideas:', error);
      return NextResponse.json({ error: 'Failed to fetch content ideas' }, { status: 500 });
    }

    const response: ContentIdeasListResponse = {
      ideas: (data || []) as unknown as ContentIdea[],
      total: count || 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get content ideas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/content-ideas?stats=true
 * Get statistics about content ideas
 */
async function getStats(): Promise<ContentIdeasStats> {
  // Get total and by status
  const { data: statusData } = await supabaseAdmin
    .from('content_ideas')
    .select('status');

  const byStatus: Record<ContentIdeaStatus, number> = {
    discovered: 0,
    new: 0,
    screening: 0,
    selected: 0,
    skipped: 0,
    generating: 0,
    generated: 0,
    in_review: 0,
    approved: 0,
    archived: 0,
    rejected: 0,
  };

  (statusData || []).forEach(row => {
    const status = row.status as ContentIdeaStatus;
    if (status in byStatus) {
      byStatus[status]++;
    }
  });

  // Get by vertical
  const { data: verticalData } = await supabaseAdmin
    .from('content_ideas')
    .select('vertical');

  const byVertical: Record<ContentVertical, number> = {} as Record<ContentVertical, number>;
  (verticalData || []).forEach(row => {
    const vertical = row.vertical as ContentVertical;
    if (vertical) {
      byVertical[vertical] = (byVertical[vertical] || 0) + 1;
    }
  });

  // Get with creator affiliate
  const { count: withAffiliate } = await supabaseAdmin
    .from('content_ideas')
    .select('id', { count: 'exact', head: true })
    .eq('has_creator_affiliate', true);

  // Get this week count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count: thisWeek } = await supabaseAdmin
    .from('content_ideas')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  return {
    total: statusData?.length || 0,
    byStatus,
    byVertical,
    withCreatorAffiliate: withAffiliate || 0,
    thisWeek: thisWeek || 0,
    pendingReview: byStatus.new + byStatus.in_review,
  };
}

/**
 * POST /api/admin/content-ideas
 * Create a new content idea manually (admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const body = await request.json();

    // Validate required fields
    if (!body.source_url || !body.source_platform) {
      return NextResponse.json(
        { error: 'source_url and source_platform are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('content_ideas')
      .select('id')
      .eq('source_url', body.source_url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Content idea already exists for this URL', existingId: existing.id },
        { status: 409 }
      );
    }

    // Insert new content idea
    const { data: newIdea, error: insertError } = await supabaseAdmin
      .from('content_ideas')
      .insert({
        source_platform: body.source_platform,
        source_url: body.source_url,
        source_channel_name: body.source_channel_name || null,
        source_creator_handle: body.source_creator_handle || null,
        source_published_at: body.source_published_at || null,
        source_metadata: body.source_metadata || {},
        vertical: body.vertical || null,
        idea_title: body.idea_title || null,
        idea_summary: body.idea_summary || null,
        status: 'new',
        created_by_admin_id: admin.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating content idea:', insertError);
      return NextResponse.json({ error: 'Failed to create content idea' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(admin, 'content.flag', 'content_ideas', newIdea.id, {
      action: 'create',
      source_url: body.source_url,
    });

    return NextResponse.json(newIdea, { status: 201 });
  } catch (error) {
    console.error('Create content idea error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
