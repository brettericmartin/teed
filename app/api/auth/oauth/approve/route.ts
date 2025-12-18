import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';

// Use a secret key for encrypting auth codes
// In production, this should be an environment variable
const AUTH_CODE_SECRET = process.env.AUTH_CODE_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt data into an auth code
 */
function encryptAuthCode(data: object): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(AUTH_CODE_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
  return combined.toString('base64url');
}

/**
 * Decrypt auth code to get data
 */
export function decryptAuthCode(authCode: string): object | null {
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

    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Failed to decrypt auth code:', err);
    return null;
  }
}

/**
 * POST /api/auth/oauth/approve
 * Handles OAuth authorization approval
 * Generates an auth code and returns the redirect URL
 */
export async function POST(request: NextRequest) {
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
