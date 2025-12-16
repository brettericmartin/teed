import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/oauth/token
 * Proxy to Supabase OAuth token endpoint with PKCE support
 * Required because ChatGPT requires auth URLs on same domain as API
 */
export async function POST(request: NextRequest) {
  try {
    // Get the code verifier from cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('oauth_code_verifier')?.value;

    // Parse the request body
    const contentType = request.headers.get('Content-Type') || '';
    let body: string;
    let bodyParams: URLSearchParams;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await request.text();
      bodyParams = new URLSearchParams(body);
    } else if (contentType.includes('application/json')) {
      const jsonBody = await request.json();
      bodyParams = new URLSearchParams();
      Object.entries(jsonBody).forEach(([key, value]) => {
        bodyParams.set(key, String(value));
      });
    } else {
      body = await request.text();
      bodyParams = new URLSearchParams(body);
    }

    // Add code_verifier for PKCE if we have it
    if (codeVerifier) {
      bodyParams.set('code_verifier', codeVerifier);
    }

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

    // Clear the code verifier cookie
    cookieStore.delete('oauth_code_verifier');

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
