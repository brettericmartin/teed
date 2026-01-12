import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getPersonaById } from '@/lib/scorecard';
import type { ScorecardResult, CategoryScores, ScorecardMode, ScorecardPersonaId } from '@/lib/types/beta';

/**
 * GET /api/beta/applications/[id]/scorecard
 *
 * Fetches scorecard data for a specific application.
 * Returns the scorecard result with persona details and percentile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerSupabase();

    // Fetch the application with scorecard data
    const { data: application, error } = await supabase
      .from('beta_applications')
      .select(`
        id,
        scorecard_score,
        scorecard_category_scores,
        scorecard_persona,
        scorecard_mode
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // If no scorecard data exists, return null
    if (!application.scorecard_score) {
      return NextResponse.json({ scorecard: null });
    }

    // Get percentile from database function
    let percentile = 0;
    try {
      const { data: statsData } = await supabase.rpc('get_scorecard_stats', {
        app_id: id,
      });
      if (statsData) {
        percentile = statsData.percentile ?? 0;
      }
    } catch (err) {
      // Percentile function might not exist yet - ignore
      console.warn('Could not fetch percentile:', err);
    }

    // Get full persona details
    const personaId = application.scorecard_persona as ScorecardPersonaId;
    const persona = getPersonaById(personaId);

    // Build the scorecard result
    const scorecard: ScorecardResult = {
      overallScore: application.scorecard_score,
      categoryScores: application.scorecard_category_scores as CategoryScores,
      persona,
      percentile,
      mode: (application.scorecard_mode as ScorecardMode) || 'monetization',
      topOpportunities: [], // We'll regenerate opportunities client-side if needed
    };

    // Generate opportunities based on category scores
    const { generateOpportunities } = await import('@/lib/scorecard');
    scorecard.topOpportunities = generateOpportunities(
      scorecard.categoryScores,
      scorecard.mode
    );

    return NextResponse.json({ scorecard });
  } catch (err) {
    console.error('Error in scorecard API:', err);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard' },
      { status: 500 }
    );
  }
}
