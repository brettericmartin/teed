import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getCreatorStats } from '@/lib/stats/creatorStats';

/**
 * GET /api/creator/stats
 * Get comprehensive creator statistics with human-centric framing
 *
 * Uses the well-built getCreatorStats() which queries user_activity table
 * (not the empty analytics_events table) and returns impact metrics,
 * per-bag breakdowns, top items, clicks by retailer, traffic sources,
 * impact story, and geographic data.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time range from query params (default 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stats = await getCreatorStats(supabase, user.id, days);

    if (!stats) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Unexpected error in GET /api/creator/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
