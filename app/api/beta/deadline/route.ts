import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/deadline
 *
 * Public endpoint that returns the founding cohort deadline info.
 * Used by landing pages to show countdown timers and urgency messaging.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Call the database function that calculates deadline info
    const { data, error } = await supabase.rpc('get_beta_deadline');

    if (error) {
      console.error('Error fetching beta deadline:', error);

      // Return fallback data if the function doesn't exist yet
      return NextResponse.json(
        {
          has_deadline: false,
          message: 'Founding cohort open',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for 60 seconds - deadline doesn't change often
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in beta deadline endpoint:', error);

    return NextResponse.json(
      { error: 'Failed to fetch deadline' },
      { status: 500 }
    );
  }
}
