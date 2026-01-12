import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type {
  StrategicInitiative,
  InitiativeListItem,
  InitiativeStatus,
  InitiativeCategory,
  CreateInitiativeInput,
} from '@/lib/types/strategicInitiatives';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/strategic-initiatives
 * List strategic initiatives with filtering
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
    const status = searchParams.get('status') as InitiativeStatus | null;
    const category = searchParams.get('category') as InitiativeCategory | null;
    const search = searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('strategic_initiatives')
      .select(
        `
        id,
        title,
        slug,
        category,
        status,
        tagline,
        priority,
        estimated_effort,
        board_evaluation,
        created_at,
        updated_at
      `
      )
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,tagline.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching initiatives:', error);
      return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
    }

    // Transform to list items with extracted board scores
    const initiatives: InitiativeListItem[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      status: item.status,
      tagline: item.tagline,
      priority: item.priority,
      estimated_effort: item.estimated_effort,
      overall_score: item.board_evaluation?.overall_score,
      board_decision: item.board_evaluation?.board_decision,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return NextResponse.json({ initiatives });
  } catch (error) {
    console.error('Get initiatives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/strategic-initiatives
 * Create a new strategic initiative
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const body: CreateInitiativeInput = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.category) {
      return NextResponse.json(
        { error: 'title, slug, and category are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const { data: existing } = await supabaseAdmin
      .from('strategic_initiatives')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Initiative with this slug already exists', existingId: existing.id },
        { status: 409 }
      );
    }

    // Insert new initiative
    const { data: newInitiative, error: insertError } = await supabaseAdmin
      .from('strategic_initiatives')
      .insert({
        title: body.title,
        slug: body.slug,
        category: body.category,
        tagline: body.tagline || null,
        executive_summary: body.executive_summary || null,
        problem_statement: body.problem_statement || null,
        solution_overview: body.solution_overview || null,
        full_plan: body.full_plan || null,
        technical_architecture: body.technical_architecture || null,
        user_stories: body.user_stories || [],
        feature_phases: body.feature_phases || [],
        success_metrics: body.success_metrics || [],
        risk_assessment: body.risk_assessment || [],
        resource_requirements: body.resource_requirements || null,
        estimated_effort: body.estimated_effort || null,
        priority: body.priority || 0,
        status: 'draft',
        created_by_admin_id: admin.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating initiative:', insertError);
      return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'strategic_initiatives', newInitiative.id, {
      action: 'create',
      title: body.title,
      slug: body.slug,
    });

    return NextResponse.json(newInitiative, { status: 201 });
  } catch (error) {
    console.error('Create initiative error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
