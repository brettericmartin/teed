import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from code verifier using S256 method
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate a random authorization code
 */
function generateAuthCode(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * GET /api/auth/oauth/authorize
 *
 * Custom OAuth 2.0 authorization endpoint for ChatGPT integration.
 * Instead of using Supabase's OAuth Server (which has session issues),
 * we implement our own authorization flow:
 *
 * 1. Verify user is logged in on teed.club
 * 2. Show consent page (our custom /oauth/consent)
 * 3. On approval, generate an auth code ourselves
 * 4. At token exchange, issue a Supabase access token
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();

  // Extract OAuth parameters from ChatGPT
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope') || 'openid email profile';
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  // Validate required parameters
  if (!clientId || !redirectUri || !responseType) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return NextResponse.json(
      { error: 'unsupported_response_type', error_description: 'Only code flow is supported' },
      { status: 400 }
    );
  }

  // Create Supabase client to check if user is logged in
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

  // Check if user is logged in
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // User is not logged in - redirect to login first, then back here
    const currentUrl = request.url;
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', currentUrl);

    console.log('OAuth authorize: User not logged in, redirecting to login', {
      redirect_to: currentUrl,
    });

    return NextResponse.redirect(loginUrl.toString());
  }

  console.log('OAuth authorize: User is logged in', {
    user_id: user.id,
    email: user.email,
    client_id: clientId,
  });

  // Store OAuth request details in a cookie for the consent page
  const oauthRequest = {
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    user_id: user.id,
    created_at: Date.now(),
  };

  cookieStore.set('oauth_request', JSON.stringify(oauthRequest), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Redirect to our custom consent page
  const consentUrl = new URL('/oauth/consent', request.url);
  // Pass minimal info - the rest is in the cookie
  consentUrl.searchParams.set('client_id', clientId);

  console.log('OAuth authorize: Redirecting to custom consent page', {
    url: consentUrl.toString(),
  });

  return NextResponse.redirect(consentUrl.toString());
}
