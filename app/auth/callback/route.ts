import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabase();

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Determine where to redirect after auth
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard';

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
