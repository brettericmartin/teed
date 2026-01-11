import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/leaderboard
 *
 * Public endpoint that returns top referrers for the leaderboard.
 * Shows first name only for privacy.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('get_referral_leaderboard', {
      limit_count: limit,
    });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { leaders: [], total: 0 },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      );
    }

    // Get total count of users with referrals
    const { count } = await supabase
      .from('beta_applications')
      .select('*', { count: 'exact', head: true })
      .gt('successful_referrals', 0)
      .in('status', ['pending', 'approved', 'waitlisted']);

    return NextResponse.json(
      {
        leaders: data || [],
        total: count || 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error in leaderboard endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
