import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: admin } = await supabase.from('admins').select('role').eq('user_id', user.id).single();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const days = parseInt(range.replace('d', ''), 10) || 30;
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

    // Beta pipeline: applied -> approved -> signed_up -> active
    const { data: betaApplications, error: betaError } = await supabase
      .from('beta_applications')
      .select('status, created_at')
      .gte('created_at', startDateISO);

    if (betaError) {
      console.error('Error fetching beta applications:', betaError);
      return NextResponse.json({ error: 'Failed to fetch beta pipeline' }, { status: 500 });
    }

    const betaPipeline = [
      { stage: 'applied', count: betaApplications?.length || 0 },
      { stage: 'approved', count: betaApplications?.filter(a => ['approved', 'signed_up', 'active'].includes(a.status)).length || 0 },
      { stage: 'signed_up', count: betaApplications?.filter(a => ['signed_up', 'active'].includes(a.status)).length || 0 },
      { stage: 'active', count: betaApplications?.filter(a => a.status === 'active').length || 0 },
    ];

    // Daily signups aggregation
    const dailySignupsMap: Record<string, number> = {};
    betaApplications?.forEach(app => {
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
