import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import {
  generateIdeas,
  getQuickSuggestions,
  gatherUserContext,
  IDEA_TEMPLATES,
  IDEA_CATEGORY_INFO,
} from '@/lib/ideas';
import type { IdeaCategory } from '@/lib/ideas/types';

/**
 * GET /api/bags/ideas
 * Get bag idea suggestions for the authenticated user
 *
 * Query params:
 * - limit: number (default: 5, max: 10)
 * - category: IdeaCategory (optional, filter to specific category)
 * - quick: boolean (optional, use template-based suggestions instead of AI)
 *
 * Returns:
 * {
 *   ideas: BagIdea[]
 *   analysis?: UserAnalysis (only with AI generation)
 *   generatedAt: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);
    const focusCategory = searchParams.get('category') as IdeaCategory | null;
    const useQuick = searchParams.get('quick') === 'true';

    // Validate category if provided
    if (focusCategory && !IDEA_CATEGORY_INFO[focusCategory]) {
      return NextResponse.json(
        { error: `Invalid category: ${focusCategory}` },
        { status: 400 }
      );
    }

    if (useQuick) {
      // Fast template-based suggestions
      const context = await gatherUserContext(user.id);
      const ideas = getQuickSuggestions(context, limit);

      return NextResponse.json({
        ideas,
        generatedAt: new Date().toISOString(),
        source: 'templates',
      });
    }

    // AI-powered suggestions
    const result = await generateIdeas({
      userId: user.id,
      limit,
      focusCategory: focusCategory || undefined,
    });

    return NextResponse.json({
      ideas: result.ideas,
      analysis: result.analysis,
      generatedAt: result.generatedAt.toISOString(),
      source: 'ai',
    });
  } catch (error: any) {
    console.error('[API] /api/bags/ideas error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bags/ideas
 * Generate personalized bag ideas with custom options
 *
 * Body:
 * {
 *   limit?: number (default: 5, max: 10)
 *   focusCategory?: IdeaCategory
 *   excludeCategories?: IdeaCategory[]
 *   creativityLevel?: 'conservative' | 'balanced' | 'adventurous'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      limit = 5,
      focusCategory,
      excludeCategories,
      creativityLevel = 'balanced',
    } = body;

    // Validate
    const validLimit = Math.min(Math.max(1, limit), 10);
    const validCreativity = ['conservative', 'balanced', 'adventurous'].includes(creativityLevel)
      ? creativityLevel
      : 'balanced';

    // Generate ideas
    const result = await generateIdeas({
      userId: user.id,
      limit: validLimit,
      focusCategory,
      excludeCategories,
      creativityLevel: validCreativity,
    });

    return NextResponse.json({
      ideas: result.ideas,
      analysis: result.analysis,
      generatedAt: result.generatedAt.toISOString(),
      source: 'ai',
    });
  } catch (error: any) {
    console.error('[API] /api/bags/ideas POST error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bags/ideas/templates
 * Get available idea templates (no auth required)
 */
export async function OPTIONS() {
  return NextResponse.json({
    templates: IDEA_TEMPLATES,
    categories: IDEA_CATEGORY_INFO,
  });
}
