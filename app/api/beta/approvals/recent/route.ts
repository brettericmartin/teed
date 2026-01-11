import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/approvals/recent
 *
 * Public endpoint that returns recent beta approvals for social proof.
 * Shows first name, creator type, niche, and approval time.
 * Names are partially anonymized (first name only).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '5'), 10);

    const supabase = await createServerSupabase();

    // Call the database function
    const { data, error } = await supabase.rpc('get_recent_approvals', {
      limit_count: limit,
    });

    if (error) {
      console.error('Error fetching recent approvals:', error);

      // Return empty data if function doesn't exist
      return NextResponse.json(
        {
          approvals: [],
          count: 0,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for 30 seconds
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error in recent approvals endpoint:', error);

    return NextResponse.json(
      { error: 'Failed to fetch recent approvals' },
      { status: 500 }
    );
  }
}
