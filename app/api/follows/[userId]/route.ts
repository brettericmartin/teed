import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

// DELETE /api/follows/[userId] - Unfollow a user
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await context.params;

    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (unfollowError) {
      console.error('Unfollow error:', unfollowError);
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unfollow API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/follows/[userId] - Check if current user follows this user
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    const { userId } = await context.params;

    // Check if following
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    return NextResponse.json({ isFollowing: !!follow }, { status: 200 });
  } catch (error) {
    console.error('Check follow API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
