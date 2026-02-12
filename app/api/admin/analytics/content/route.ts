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

    // Content page stats — RPC takes start_date timestamptz
    const { data: pages, error: pagesError } = await supabase
      .rpc('get_content_page_stats', { start_date: startDateISO });

    if (pagesError) {
      console.error('Error fetching content page stats:', pagesError);
      return NextResponse.json({ error: 'Failed to fetch content page stats' }, { status: 500 });
    }

    return NextResponse.json({
      pages: pages || [],
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
