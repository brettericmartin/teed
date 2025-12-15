import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/gpt/me
 * Get the authenticated user's profile
 * Used by ChatGPT GPT to identify the current user
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_url, total_bags')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete your Teed profile setup.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: profile.id,
      handle: profile.handle,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      total_bags: profile.total_bags || 0,
      profile_url: `https://teed.club/u/${profile.handle}`,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
