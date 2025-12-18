import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/oauth/request
 * Returns the stored OAuth request details from the cookie
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const oauthRequestCookie = cookieStore.get('oauth_request');

  if (!oauthRequestCookie) {
    return NextResponse.json(
      { error: 'No authorization request found' },
      { status: 404 }
    );
  }

  try {
    const oauthRequest = JSON.parse(oauthRequestCookie.value);
    return NextResponse.json(oauthRequest);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid authorization request' },
      { status: 400 }
    );
  }
}
