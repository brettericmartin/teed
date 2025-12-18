import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Use the same secret key as the approve endpoint
const AUTH_CODE_SECRET = process.env.AUTH_CODE_SECRET || crypto.randomBytes(32).toString('hex');

// Create admin Supabase client for database operations
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface AuthCodeData {
  user_id: string;
  access_token: string;
  refresh_token: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  scope: string;
  expires_at: number;
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Decrypt auth code to get data
 */
function decryptAuthCode(authCode: string): AuthCodeData | null {
  try {
    const combined = Buffer.from(authCode, 'base64url');
    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const encrypted = combined.subarray(32);

    const key = crypto.scryptSync(AUTH_CODE_SECRET, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as AuthCodeData;
  } catch (err) {
    console.error('Failed to decrypt auth code:', err);
    return null;
  }
}

/**
 * Verify PKCE code_verifier against code_challenge
 */
function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: string | null): boolean {
  if (!method || method === 'plain') {
    return codeVerifier === codeChallenge;
  } else if (method === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hash === codeChallenge;
  }
  return false;
}

/**
 * Handle authorization code grant - initial token exchange
 */
async function handleAuthorizationCode(
  code: string,
  clientId: string | null,
  redirectUri: string | null,
  codeVerifier: string | null
): Promise<NextResponse> {
  // Decrypt the auth code
  const codeData = decryptAuthCode(code);
  if (!codeData) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or malformed authorization code' },
      { status: 400 }
    );
  }

  console.log('Token exchange - decrypted auth code for user:', codeData.user_id);

  // Check if code has expired
  if (Date.now() > codeData.expires_at) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code has expired' },
      { status: 400 }
    );
  }

  // Validate client_id matches
  if (clientId && clientId !== codeData.client_id) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Client ID mismatch' },
      { status: 400 }
    );
  }

  // Validate redirect_uri matches
  if (redirectUri && redirectUri !== codeData.redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Verify PKCE code_verifier if code_challenge was provided
  if (codeData.code_challenge) {
    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Missing code_verifier for PKCE' },
        { status: 400 }
      );
    }

    if (!verifyCodeChallenge(codeVerifier, codeData.code_challenge, codeData.code_challenge_method)) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code_verifier' },
        { status: 400 }
      );
    }
  }

  // Generate our session token
  const sessionToken = generateSessionToken();
  console.log('Token exchange: Generated session token:', sessionToken.substring(0, 10) + '...');

  // Store the session in our database
  const adminSupabase = getAdminSupabase();
  const { error: insertError } = await adminSupabase
    .from('oauth_sessions')
    .insert({
      user_id: codeData.user_id,
      session_token: sessionToken,
      supabase_access_token: codeData.access_token,
      supabase_refresh_token: codeData.refresh_token,
      client_id: codeData.client_id,
      scope: codeData.scope,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    });

  if (insertError) {
    console.error('Failed to store OAuth session:', insertError);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to create session' },
      { status: 500 }
    );
  }

  console.log('Token exchange successful - created session for user:', codeData.user_id);

  // Return our session token as both access and refresh token
  // ChatGPT will use access_token for API calls and refresh_token for refresh
  return NextResponse.json({
    access_token: sessionToken,
    refresh_token: sessionToken, // Same token - we manage refresh server-side
    token_type: 'Bearer',
    expires_in: 3600,
    scope: codeData.scope,
  });
}

/**
 * Handle refresh token grant - refresh existing session
 */
async function handleRefreshToken(refreshToken: string): Promise<NextResponse> {
  const adminSupabase = getAdminSupabase();

  // Look up the session by our token
  const { data: session, error: lookupError } = await adminSupabase
    .from('oauth_sessions')
    .select('*')
    .eq('session_token', refreshToken)
    .single();

  if (lookupError || !session) {
    console.error('Session not found for refresh:', lookupError?.message);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired session. Please sign in again.' },
      { status: 400 }
    );
  }

  console.log('Refresh - found session for user:', session.user_id);

  // Check if we need to refresh the Supabase token
  const sessionExpired = new Date(session.expires_at) < new Date();

  if (sessionExpired) {
    console.log('Supabase token expired, refreshing...');

    // Refresh with Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ refresh_token: session.supabase_refresh_token }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Supabase refresh failed:', data);

      // If Supabase refresh fails, delete the session and tell user to re-auth
      await adminSupabase
        .from('oauth_sessions')
        .delete()
        .eq('id', session.id);

      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Session expired. Please sign in again.' },
        { status: 400 }
      );
    }

    // Update our stored tokens
    const { error: updateError } = await adminSupabase
      .from('oauth_sessions')
      .update({
        supabase_access_token: data.access_token,
        supabase_refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    console.log('Refresh successful - updated tokens for user:', session.user_id);
  } else {
    // Just update last_used_at
    await adminSupabase
      .from('oauth_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id);

    console.log('Session still valid, no Supabase refresh needed');
  }

  // Return the same session token (ChatGPT keeps using this)
  return NextResponse.json({
    access_token: refreshToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: session.scope,
  });
}

/**
 * POST /api/auth/oauth/token
 * Custom OAuth token endpoint
 * Supports authorization_code and refresh_token grants
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const contentType = request.headers.get('Content-Type') || '';
    let bodyParams: URLSearchParams;

    if (contentType.includes('application/json')) {
      const jsonBody = await request.json();
      bodyParams = new URLSearchParams();
      Object.entries(jsonBody).forEach(([key, value]) => {
        bodyParams.set(key, String(value));
      });
    } else {
      const body = await request.text();
      bodyParams = new URLSearchParams(body);
    }

    const grantType = bodyParams.get('grant_type');
    const code = bodyParams.get('code');
    const redirectUri = bodyParams.get('redirect_uri');
    const clientId = bodyParams.get('client_id');
    const codeVerifier = bodyParams.get('code_verifier');
    const refreshToken = bodyParams.get('refresh_token');

    console.log('Token request:', {
      grant_type: grantType,
      client_id: clientId,
      has_code: !!code,
      has_refresh_token: !!refreshToken,
    });

    // Handle refresh token grant
    if (grantType === 'refresh_token') {
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing refresh_token parameter' },
          { status: 400 }
        );
      }
      return handleRefreshToken(refreshToken);
    }

    // Handle authorization code grant
    if (grantType === 'authorization_code') {
      if (!code) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Missing code parameter' },
          { status: 400 }
        );
      }
      return handleAuthorizationCode(code, clientId, redirectUri, codeVerifier);
    }

    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Only authorization_code and refresh_token grants are supported' },
      { status: 400 }
    );
  } catch (error) {
    console.error('OAuth token error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Token exchange failed' },
      { status: 500 }
    );
  }
}
