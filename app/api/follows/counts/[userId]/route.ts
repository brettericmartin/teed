import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

// GET /api/follows/counts/[userId] - Get follower and following counts for a user
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();
    const { userId } = await context.params;

    // Get follower count (people who follow this user)
    const { count: followerCount, error: followerError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followerError) {
      console.error('Error getting follower count:', followerError);
    }

    // Get following count (people this user follows)
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followingError) {
      console.error('Error getting following count:', followingError);
    }

    return NextResponse.json({
      followers: followerCount || 0,
      following: followingCount || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Follow counts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
