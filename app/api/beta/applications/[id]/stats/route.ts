import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/applications/[id]/stats
 *
 * Returns comprehensive stats for a beta application including:
 * - Referral stats (count, tier, next tier)
 * - Approval odds percentage
 * - Path to approval suggestions
 *
 * This is a semi-public endpoint - anyone with the application ID can view stats.
 * Application IDs are UUIDs so they're not guessable.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Get referral stats
    const { data: referralStats, error: refError } = await supabase.rpc(
      'get_referral_stats',
      { app_id: id }
    );

    if (refError) {
      console.error('Error fetching referral stats:', refError);
      // Function may not exist if migration not run
      return NextResponse.json(
        {
          application_id: id,
          successful_referrals: 0,
          current_tier: {
            tier: 0,
            name: 'Standard',
            badge_color: 'gray',
            benefits: ['Standard review process'],
          },
          next_tier: {
            tier: 1,
            name: 'Engaged',
            badge_color: 'green',
            benefits: ['+10 position boost', 'Priority in review queue'],
          },
          referrals_until_next_tier: 1,
          referrals_until_instant_approval: 5,
          has_instant_approval: false,
          referral_link: `/apply?ref=${id}`,
        },
        {
          headers: {
            'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
          },
        }
      );
    }

    // Get approval path suggestions
    const { data: approvalPath, error: pathError } = await supabase.rpc(
      'get_approval_path',
      { app_id: id }
    );

    if (pathError) {
      console.error('Error fetching approval path:', pathError);
    }

    // Get the application's approval odds
    const { data: appData, error: appError } = await supabase
      .from('beta_applications')
      .select('approval_odds_percent, priority_score, status, waitlist_position')
      .eq('id', id)
      .single();

    if (appError) {
      console.error('Error fetching application:', appError);
    }

    const response = {
      ...referralStats,
      approval_odds: appData?.approval_odds_percent ?? 50,
      priority_score: appData?.priority_score ?? 0,
      status: appData?.status ?? 'pending',
      waitlist_position: appData?.waitlist_position,
      approval_path: approvalPath?.suggestions ?? [],
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error in application stats endpoint:', error);

    return NextResponse.json(
      { error: 'Failed to fetch application stats' },
      { status: 500 }
    );
  }
}
