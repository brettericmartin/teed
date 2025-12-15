import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth/authorize
 * Proxy to Supabase OAuth authorization endpoint
 * Required because ChatGPT requires auth URLs on same domain as API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build the Supabase authorization URL with all query params
  const supabaseUrl = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/authorize`
  );

  // Forward all query parameters
  searchParams.forEach((value, key) => {
    supabaseUrl.searchParams.set(key, value);
  });

  // Redirect to Supabase
  return NextResponse.redirect(supabaseUrl.toString());
}
