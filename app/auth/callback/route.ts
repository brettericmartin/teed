import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

const AUTO_HANDLE_PATTERN = /^user_[a-f0-9]{8}$/;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const errorParam = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors (e.g., user denied consent)
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  const supabase = await createServerSupabase();

  if (code) {
    // PKCE flow - exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    if (data?.session) {
      // Check if user needs to complete profile (OAuth first-time with auto-generated handle)
      const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', data.session.user.id)
        .single();

      if (profile?.handle && AUTO_HANDLE_PATTERN.test(profile.handle)) {
        return NextResponse.redirect(new URL('/complete-profile', request.url));
      }
    }
  } else if (token_hash && type) {
    // Magic link / email confirmation flow
    await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    });
  }

  // Determine where to redirect after auth
  const redirectTo = requestUrl.searchParams.get('redirect_to') || requestUrl.searchParams.get('next') || '/dashboard';

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
