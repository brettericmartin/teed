import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth/authorize
 * Proxy to Supabase OAuth authorization endpoint
 * Required because ChatGPT requires auth URLs on same domain as API
 *
 * Simply forwards all parameters to Supabase - ChatGPT handles PKCE itself
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build the Supabase authorization URL with all query params
  const supabaseUrl = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/authorize`
  );

  // Forward all query parameters from ChatGPT exactly as-is
  searchParams.forEach((value, key) => {
    supabaseUrl.searchParams.set(key, value);
  });

  console.log('OAuth authorize redirect:', supabaseUrl.toString());

  // Redirect to Supabase
  return NextResponse.redirect(supabaseUrl.toString());
}
