import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/gpt/me
 * Get the authenticated user's profile
 * Used by ChatGPT GPT to identify the current user
 */
export async function GET() {
  try {
    // Check for Bearer token in Authorization header (from ChatGPT)
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    let user;
    let supabase;

    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      console.log('GPT /me: Using Bearer token authentication');

      // Create Supabase client and verify the token
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${accessToken}` } }
        }
      );

      // Verify the token and get user
      const { data, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !data.user) {
        console.error('GPT /me: Bearer token invalid:', authError?.message);
        return NextResponse.json(
          { error: 'Unauthorized. Invalid or expired token. Please sign in again.' },
          { status: 401 }
        );
      }
      user = data.user;
      console.log('GPT /me: Token valid for user:', user.id);
    } else {
      // Fall back to cookie-based auth
      supabase = await createServerSupabase();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to your Teed account.' },
          { status: 401 }
        );
      }
      user = data.user;
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
