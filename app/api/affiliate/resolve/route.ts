/**
 * POST /api/affiliate/resolve
 *
 * Convert a raw URL to affiliate URL(s)
 *
 * Request Body:
 * {
 *   rawUrl: string (required)
 *   itemId?: string (for tracking)
 *   userId?: string (for user-specific settings)
 *   forceRefresh?: boolean (bypass cache)
 * }
 *
 * Response:
 * {
 *   affiliateUrl: string
 *   provider: 'none' | 'amazon' | 'aggregator' | 'direct'
 *   merchantDomain?: string
 *   cached?: boolean
 *   expiresAt?: string (ISO timestamp)
 *   disclosure?: {
 *     required: boolean
 *     text: string
 *   }
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { AffiliateServiceFactory } from '@/lib/services/affiliate/AffiliateServiceFactory';
import { AffiliateUrlRequest } from '@/lib/types/affiliate';
import { createServerSupabase } from '@/lib/serverSupabase';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AffiliateUrlRequest = await request.json();

    // Validate required fields
    if (!body.rawUrl || typeof body.rawUrl !== 'string') {
      return NextResponse.json(
        { error: 'rawUrl is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.rawUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create affiliate services
    let services;

    if (body.userId) {
      // User-specific affiliate configuration
      const supabase = await createServerSupabase();
      services = await AffiliateServiceFactory.createForUser(
        body.userId,
        supabase
      );
    } else {
      // Use environment configuration
      services = AffiliateServiceFactory.createFromEnvironment();
    }

    // Process URL through service chain
    const result = await AffiliateServiceFactory.processUrl(
      services,
      body.rawUrl,
      {
        itemId: body.itemId,
        userId: body.userId,
        forceRefresh: body.forceRefresh,
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[POST /api/affiliate/resolve] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to resolve affiliate URL',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/affiliate/resolve?url=<rawUrl>
 *
 * Alternative GET endpoint for simple URL queries
 * (for testing and simple integrations)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
      return NextResponse.json(
        { error: 'url query parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Use environment configuration (no user-specific)
    const services = AffiliateServiceFactory.createFromEnvironment();

    // Process URL
    const result = await AffiliateServiceFactory.processUrl(
      services,
      rawUrl
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/affiliate/resolve] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to resolve affiliate URL',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
