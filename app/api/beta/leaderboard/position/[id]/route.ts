import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/leaderboard/position/[id]
 *
 * Returns a specific applicant's leaderboard position and context.
 * The ID is the application UUID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('get_leaderboard_position', {
      app_id: id,
    });

    if (error) {
      console.error('Error fetching leaderboard position:', error);
      return NextResponse.json(
        { error: 'Failed to fetch position' },
        { status: 500 }
      );
    }

    if (!data?.found) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error in leaderboard position endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard position' },
      { status: 500 }
    );
  }
}
