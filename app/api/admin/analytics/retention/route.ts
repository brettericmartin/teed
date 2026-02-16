import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getAdminUser } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createServerSupabase();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const days = range === '24h' ? 1 : (parseInt(range.replace('d', ''), 10) || 30);
    const weeksBack = Math.ceil(days / 7);

    // DAU/WAU/MAU active user metrics — RPC takes days_back int
    const { data: activeUsers, error: activeUsersError } = await supabase
      .rpc('get_active_user_metrics', { days_back: days });

    if (activeUsersError) {
      console.error('Error fetching active user metrics:', activeUsersError);
      return NextResponse.json({ error: 'Failed to fetch active user metrics' }, { status: 500 });
    }

    // Weekly cohort retention — RPC takes weeks_back int
    const { data: cohortRetention, error: cohortError } = await supabase
      .rpc('get_weekly_cohort_retention', { weeks_back: weeksBack });

    if (cohortError) {
      console.error('Error fetching cohort retention:', cohortError);
      return NextResponse.json({ error: 'Failed to fetch cohort retention' }, { status: 500 });
    }

    // User health segments — RPC takes no parameters
    const { data: healthSegments, error: healthError } = await supabase
      .rpc('get_user_health_segments');

    if (healthError) {
      console.error('Error fetching user health segments:', healthError);
      return NextResponse.json({ error: 'Failed to fetch user health segments' }, { status: 500 });
    }

    // Calculate stickiness (DAU/MAU ratio)
    let stickiness = 0;
    if (activeUsers && activeUsers.length > 0) {
      const latest = activeUsers[activeUsers.length - 1];
      if (latest.mau && latest.mau > 0) {
        stickiness = Math.round((latest.dau / latest.mau) * 100) / 100;
      }
    }

    return NextResponse.json({
      activeUsers: activeUsers || [],
      cohortRetention: cohortRetention || [],
      healthSegments: healthSegments || [],
      stickiness,
    });
  } catch (error) {
    console.error('Retention analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
