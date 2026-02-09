import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/auth/session - Get current user session and profile
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    // Fetch profile for handle (needed by /bags/new and other client pages)
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ user, profile }, { status: 200 });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
