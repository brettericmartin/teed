import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profile/stats
 * Update the current authenticated user's profile stats
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the update_profile_stats function
    const { error: updateError } = await supabase.rpc('update_profile_stats', {
      target_user_id: user.id
    });

    if (updateError) {
      console.error('Error updating profile stats:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile stats' },
        { status: 500 }
      );
    }

    // Fetch updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_views, total_bags, total_followers, stats_updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching updated profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch updated stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalViews: profile.total_views || 0,
        totalBags: profile.total_bags || 0,
        totalFollowers: profile.total_followers || 0,
        statsUpdatedAt: profile.stats_updated_at,
      }
    });
  } catch (error) {
    console.error('POST /api/profile/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
