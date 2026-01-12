import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type {
  StrategicInitiative,
  UpdateInitiativeInput,
} from '@/lib/types/strategicInitiatives';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/strategic-initiatives/[slug]
 * Get a single initiative by slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { slug } = await params;

    const { data, error } = await supabaseAdmin
      .from('strategic_initiatives')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
      }
      console.error('Error fetching initiative:', error);
      return NextResponse.json({ error: 'Failed to fetch initiative' }, { status: 500 });
    }

    return NextResponse.json(data as StrategicInitiative);
  } catch (error) {
    console.error('Get initiative error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/strategic-initiatives/[slug]
 * Update a strategic initiative
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { slug } = await params;
    const body: UpdateInitiativeInput = await request.json();

    // Check if initiative exists
    const { data: existing, error: findError } = await supabaseAdmin
      .from('strategic_initiatives')
      .select('id, version')
      .eq('slug', slug)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // If slug is being changed, check for conflicts
    if (body.slug && body.slug !== slug) {
      const { data: conflict } = await supabaseAdmin
        .from('strategic_initiatives')
        .select('id')
        .eq('slug', body.slug)
        .single();

      if (conflict) {
        return NextResponse.json(
          { error: 'An initiative with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'title', 'slug', 'category', 'tagline', 'executive_summary',
      'problem_statement', 'solution_overview', 'full_plan', 'technical_architecture',
      'user_stories', 'feature_phases', 'success_metrics', 'risk_assessment',
      'resource_requirements', 'estimated_effort', 'priority', 'status',
      'board_evaluation', 'doctrine_compliance', 'board_notes', 'revision_notes'
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = (body as Record<string, unknown>)[field];
      }
    }

    // Handle status transitions
    if (body.status) {
      const now = new Date().toISOString();
      switch (body.status) {
        case 'in_review':
          updateData.reviewed_at = now;
          break;
        case 'approved':
          updateData.approved_at = now;
          break;
        case 'in_progress':
          updateData.started_at = now;
          break;
        case 'completed':
          updateData.completed_at = now;
          break;
      }
    }

    // Increment version if content is being changed
    if (Object.keys(updateData).length > 0) {
      updateData.version = existing.version + 1;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('strategic_initiatives')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating initiative:', updateError);
      return NextResponse.json({ error: 'Failed to update initiative' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'strategic_initiatives', existing.id, {
      action: 'update',
      fields_updated: Object.keys(updateData),
      new_version: updateData.version,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update initiative error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/strategic-initiatives/[slug]
 * Delete a strategic initiative (super_admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authorization - requires super_admin
    const authResult = await withAdminApi('super_admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { slug } = await params;

    // Find initiative
    const { data: existing, error: findError } = await supabaseAdmin
      .from('strategic_initiatives')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // Delete initiative
    const { error: deleteError } = await supabaseAdmin
      .from('strategic_initiatives')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('Error deleting initiative:', deleteError);
      return NextResponse.json({ error: 'Failed to delete initiative' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'strategic_initiatives', existing.id, {
      action: 'delete',
      title: existing.title,
      slug,
    });

    return NextResponse.json({ success: true, deleted_id: existing.id });
  } catch (error) {
    console.error('Delete initiative error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
