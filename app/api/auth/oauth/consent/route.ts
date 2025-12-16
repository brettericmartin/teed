import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/oauth/consent
 * Server-side handler for OAuth consent approval/denial
 * Needed because Supabase's OAuth endpoints reject browser cross-origin requests
 */
export async function POST(request: NextRequest) {
  try {
    const { authorization_id, action } = await request.json();

    if (!authorization_id) {
      return NextResponse.json(
        { error: 'authorization_id is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Get the user's access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Call Supabase's OAuth consent endpoint server-side
    const consentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/oauth/authorizations/${authorization_id}/consent`;

    console.log('OAuth consent request:', {
      url: consentUrl,
      authorization_id,
      action,
      hasAccessToken: !!accessToken,
    });

    const response = await fetch(
      consentUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ action }),
      }
    );

    const responseText = await response.text();
    console.log('OAuth consent raw response:', {
      status: response.status,
      body: responseText,
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error('Supabase OAuth consent error:', {
        status: response.status,
        data,
        authorization_id,
        action,
        responseHeaders: Object.fromEntries(response.headers.entries()),
      });
      return NextResponse.json(
        {
          error: data.error_description || data.error || data.message || data.msg || 'Consent failed',
          details: data,
        },
        { status: response.status }
      );
    }

    console.log('OAuth consent success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('OAuth consent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
