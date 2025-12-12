import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  const supabase = await createServerSupabase();

  if (code) {
    // PKCE flow - exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    // Magic link / email confirmation flow
    await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    });
  }

  // Determine where to redirect after auth
  const redirectTo = requestUrl.searchParams.get('redirect_to') || requestUrl.searchParams.get('next') || '/dashboard';

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
