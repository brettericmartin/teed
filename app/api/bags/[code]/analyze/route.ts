import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { analyzeBag } from '@/lib/analyzer';

/**
 * GET /api/bags/[code]/analyze
 * Analyze a bag and return insights/recommendations
 *
 * Query params:
 * - ai: boolean (default: false) - Include AI-powered missing item suggestions
 *
 * Returns:
 * {
 *   bagId: string
 *   bagCode: string
 *   bagTitle: string
 *   overallScore: number
 *   grade: 'A' | 'B' | 'C' | 'D' | 'F'
 *   dimensions: DimensionScore[]
 *   topIssues: AnalysisIssue[]
 *   quickWins: AnalysisIssue[]
 *   missingItems: MissingItem[]
 *   strengths: string[]
 *   analyzedAt: string
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeAI = searchParams.get('ai') === 'true';

    // Verify user owns the bag
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only analyze your own bags' },
        { status: 403 }
      );
    }

    // Run analysis
    const result = await analyzeBag({
      bagCode: code,
      userId: user.id,
      includeAIAnalysis: includeAI,
    });

    return NextResponse.json({
      ...result,
      analyzedAt: result.analyzedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API] /api/bags/[code]/analyze error:', error.message);
    return NextResponse.json(
      { error: 'Failed to analyze bag' },
      { status: 500 }
    );
  }
}
