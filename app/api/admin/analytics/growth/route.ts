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
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();

    // Activation funnel — RPC takes start_date timestamptz
    const { data: activationFunnel, error: funnelError } = await supabase
      .rpc('get_activation_funnel', { start_date: startDateISO });

    if (funnelError) {
      console.error('Error fetching activation funnel:', funnelError);
      return NextResponse.json({ error: 'Failed to fetch activation funnel' }, { status: 500 });
    }

    // Beta pipeline: applied -> approved -> waitlisted -> rejected
    // Also fetch ALL applications (no date filter) for full picture
    const { data: betaApplications, error: betaError } = await supabase
      .from('beta_applications')
      .select('status, created_at');

    if (betaError) {
      console.error('Error fetching beta applications:', betaError);
      return NextResponse.json({ error: 'Failed to fetch beta pipeline' }, { status: 500 });
    }

    const allApps = betaApplications || [];
    const recentApps = allApps.filter(a => a.created_at >= startDateISO);

    const betaPipeline = [
      { stage: 'total_applied', count: allApps.length },
      { stage: 'pending', count: allApps.filter(a => a.status === 'pending').length },
      { stage: 'approved', count: allApps.filter(a => a.status === 'approved').length },
      { stage: 'waitlisted', count: allApps.filter(a => a.status === 'waitlisted').length },
      { stage: 'rejected', count: allApps.filter(a => a.status === 'rejected').length },
    ];

    // Daily signups aggregation (date-filtered)
    const dailySignupsMap: Record<string, number> = {};
    recentApps.forEach(app => {
      const date = app.created_at?.split('T')[0];
      if (date) {
        dailySignupsMap[date] = (dailySignupsMap[date] || 0) + 1;
      }
    });
    const dailySignups = Object.entries(dailySignupsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      activationFunnel: activationFunnel || [],
      betaPipeline,
      dailySignups,
    });
  } catch (error) {
    console.error('Growth analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
