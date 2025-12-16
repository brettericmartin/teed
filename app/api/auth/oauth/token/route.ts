import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/oauth/token
 * Proxy to Supabase OAuth token endpoint
 * Simply forwards the request - ChatGPT handles PKCE itself
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body and content type
    const contentType = request.headers.get('Content-Type') || '';
    const body = await request.text();

    console.log('Token request content-type:', contentType);
    console.log('Token request body:', body);

    // Forward to Supabase token endpoint exactly as received
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': contentType || 'application/x-www-form-urlencoded',
        },
        body: body,
      }
    );

    // Get response data
    const data = await response.text();

    console.log('Token response status:', response.status);
    console.log('Token response:', data);

    // Return the response with same status and headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('OAuth token proxy error:', error);
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 }
    );
  }
}
