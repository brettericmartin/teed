import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/oauth/token
 * Proxy to Supabase OAuth token endpoint
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

    console.log('Token request params:', bodyParams.toString());

    // Forward to Supabase token endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
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
