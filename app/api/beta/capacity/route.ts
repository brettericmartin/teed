import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { BetaCapacity } from '@/lib/types/beta';

/**
 * GET /api/beta/capacity
 *
 * Public endpoint that returns live beta capacity stats.
 * Used by the landing page to show "X of Y spots filled" counter.
 *
 * Response is cached for 30 seconds to reduce DB load while still
 * providing near-real-time updates.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Call the database function that calculates capacity
    const { data, error } = await supabase.rpc('get_beta_capacity');

    if (error) {
      console.error('Error fetching beta capacity:', error);

      // Return fallback data if the function doesn't exist yet
      // (migration not run)
      return NextResponse.json(
        {
          total: 50,
          used: 0,
          available: 50,
          reserved_for_codes: 5,
          effective_capacity: 45,
          pending_applications: 0,
          approved_this_week: 0,
          is_at_capacity: false,
          percent_full: 0,
        } as BetaCapacity,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      );
    }

    const capacity = data as BetaCapacity;

    return NextResponse.json(capacity, {
      headers: {
        // Cache for 30 seconds, allow stale for 60 seconds while revalidating
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error in beta capacity endpoint:', error);

    return NextResponse.json(
      { error: 'Failed to fetch capacity' },
      { status: 500 }
    );
  }
}
