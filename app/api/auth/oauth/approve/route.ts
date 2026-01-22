import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { encryptAuthCode, isSecretConfigured, type AuthCodeData } from '@/lib/oauthCrypto';

/**
 * POST /api/auth/oauth/approve
 * Handles OAuth authorization approval
 * Generates an auth code and returns the redirect URL
 */
export async function POST(request: NextRequest) {
  // Check if OAuth secret is configured
  if (!isSecretConfigured()) {
    console.error('[OAuth] AUTH_CODE_SECRET not configured - OAuth will fail');
    return NextResponse.json(
      { error: 'OAuth not properly configured. Contact support.' },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();

  // Get the OAuth request from the cookie
  const oauthRequestCookie = cookieStore.get('oauth_request');
  if (!oauthRequestCookie) {
    return NextResponse.json(
      { error: 'No authorization request found' },
      { status: 400 }
    );
  }

  let oauthRequest;
  try {
    oauthRequest = JSON.parse(oauthRequestCookie.value);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid authorization request' },
      { status: 400 }
    );
  }

  // Verify the request hasn't expired
  if (Date.now() - oauthRequest.created_at > 10 * 60 * 1000) {
    return NextResponse.json(
      { error: 'Authorization request has expired' },
      { status: 400 }
    );
  }

  // Create Supabase client to verify user
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

  // Verify user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: 'User not authenticated' },
      { status: 401 }
    );
  }

  // Verify the user matches the one who started the flow
  if (user.id !== oauthRequest.user_id) {
    return NextResponse.json(
      { error: 'Session mismatch' },
      { status: 403 }
    );
  }

  // Get the user's current session to use for the token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Failed to get user session' },
      { status: 500 }
    );
  }

  // Create the auth code data - this will be encrypted into the code itself
  const codeData = {
    user_id: user.id,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    client_id: oauthRequest.client_id,
    redirect_uri: oauthRequest.redirect_uri,
    code_challenge: oauthRequest.code_challenge,
    code_challenge_method: oauthRequest.code_challenge_method,
    scope: oauthRequest.scope,
    expires_at: Date.now() + 10 * 60 * 1000, // 10 minute expiry
  };

  // Encrypt the data into the auth code
  const authCode = encryptAuthCode(codeData);

  // Clear the oauth_request cookie
  cookieStore.delete('oauth_request');

  // Build the redirect URL with the auth code
  const redirectUrl = new URL(oauthRequest.redirect_uri);
  redirectUrl.searchParams.set('code', authCode);
  if (oauthRequest.state) {
    redirectUrl.searchParams.set('state', oauthRequest.state);
  }

  console.log('OAuth approve: Generated auth code and redirecting', {
    user_id: user.id,
    client_id: oauthRequest.client_id,
    redirect_uri: oauthRequest.redirect_uri,
  });

  return NextResponse.json({
    redirect_url: redirectUrl.toString(),
  });
}
