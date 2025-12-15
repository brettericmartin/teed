import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';

const GUIDE_TYPE = 'chatgpt_gpt';

/**
 * GET /api/admin/gpt-setup
 * Get all step progress for the ChatGPT GPT setup guide
 */
export async function GET() {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: progress, error } = await supabase
      .from('admin_setup_progress')
      .select('step_id, is_completed, notes, completed_at, updated_at')
      .eq('guide_type', GUIDE_TYPE)
      .order('step_id');

    if (error) {
      console.error('Error fetching setup progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: progress || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/gpt-setup:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/gpt-setup
 * Update progress for a specific step
 * Body: { step_id: string, is_completed: boolean, notes?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { step_id, is_completed, notes } = body;

    if (!step_id || typeof step_id !== 'string') {
      return NextResponse.json(
        { error: 'step_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert the progress
    const { data, error } = await supabase
      .from('admin_setup_progress')
      .upsert(
        {
          guide_type: GUIDE_TYPE,
          step_id,
          is_completed: Boolean(is_completed),
          notes: notes || null,
          completed_at: is_completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'guide_type,step_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating setup progress:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/gpt-setup:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
