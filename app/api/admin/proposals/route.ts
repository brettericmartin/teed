import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { ProposalCreateRequest } from '@/lib/types/proposal';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/proposals
 * Get all proposals with filtering and pagination
 */
export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
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
    .from('strategic_proposals')
    .select(
      `
      *,
      decider:decided_by (
        id,
        handle,
        display_name
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: proposals, error, count } = await query;

  if (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }

  // Get stats
  const { data: allProposals } = await supabase
    .from('strategic_proposals')
    .select('status');

  const stats = {
    total: allProposals?.length || 0,
    pending: allProposals?.filter((p) => p.status === 'pending').length || 0,
    approved: allProposals?.filter((p) => p.status === 'approved').length || 0,
    rejected: allProposals?.filter((p) => p.status === 'rejected').length || 0,
    needs_research: allProposals?.filter((p) => p.status === 'needs_research').length || 0,
  };

  return NextResponse.json({
    proposals: proposals || [],
    stats,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

/**
 * POST /api/admin/proposals
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const body: ProposalCreateRequest = await request.json();

  if (!body.title || !body.summary || !body.content || !body.category) {
    return NextResponse.json(
      { error: 'Missing required fields: title, summary, content, category' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: proposal, error } = await supabase
    .from('strategic_proposals')
    .insert({
      title: body.title,
      summary: body.summary,
      content: body.content,
      category: body.category,
      research_sources: body.research_sources || null,
      confidence_level: body.confidence_level || null,
      created_by: admin.handle,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }

  await logAdminAction(admin, 'settings.update', 'system', proposal.id, {
    action: 'proposal.create',
    title: body.title,
    category: body.category,
  });

  return NextResponse.json({ proposal });
}
