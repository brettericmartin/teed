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

    // Feature adoption stats — RPC takes start_date timestamptz
    const { data: features, error: featuresError } = await supabase
      .rpc('get_feature_adoption', { start_date: startDateISO });

    if (featuresError) {
      console.error('Error fetching feature adoption:', featuresError);
      return NextResponse.json({ error: 'Failed to fetch feature adoption' }, { status: 500 });
    }

    return NextResponse.json({
      features: features || [],
    });
  } catch (error) {
    console.error('Features analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
