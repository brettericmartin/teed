import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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
 * GET /api/auth/oauth/authorize
 * Proxy to Supabase OAuth authorization endpoint with PKCE support
 * Required because ChatGPT requires auth URLs on same domain as API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Build the Supabase authorization URL with all query params
  const supabaseUrl = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/authorize`
  );

  // Forward all query parameters
  searchParams.forEach((value, key) => {
    supabaseUrl.searchParams.set(key, value);
  });

  // Add PKCE parameters
  supabaseUrl.searchParams.set('code_challenge', codeChallenge);
  supabaseUrl.searchParams.set('code_challenge_method', 'S256');

  // Store the code verifier in a cookie for the token exchange
  const cookieStore = await cookies();
  cookieStore.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Redirect to Supabase
  return NextResponse.redirect(supabaseUrl.toString());
}
