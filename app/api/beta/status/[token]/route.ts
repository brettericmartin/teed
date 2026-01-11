import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/status/[token]
 *
 * Returns application status for a given status token.
 * This allows applicants to check their status without authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Status token required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('get_application_status_by_token', {
      status_token: token,
    });

    if (error) {
      console.error('Error fetching status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: 500 }
      );
    }

    if (!data?.found) {
      return NextResponse.json(
        { error: 'Invalid status token' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
