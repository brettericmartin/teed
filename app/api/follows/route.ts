import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { checkBetaAccess } from '@/lib/betaGating';

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
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

    // Check beta access
    const { approved } = await checkBetaAccess(supabase, user.id);
    if (!approved) {
      return NextResponse.json(
        { error: 'Beta access required to follow users. Please apply or wait for approval.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json({ error: 'following_id is required' }, { status: 400 });
    }

    // Prevent self-follow
    if (following_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // Create follow relationship
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: following_id,
      })
      .select()
      .single();

    if (followError) {
      console.error('Follow error:', followError);
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, follow }, { status: 201 });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
