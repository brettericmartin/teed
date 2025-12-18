import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/auth/signout
 * Sign out the current user by clearing their session
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Sign out from Supabase (clears the session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      // Still try to clear cookies even if Supabase fails
    }

    // Clear all Supabase auth cookies manually to be thorough
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        cookieStore.delete(cookie.name);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
