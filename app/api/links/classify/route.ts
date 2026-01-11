import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import {
  classifyUrls,
  parseUrlsFromInput,
  type ClassificationResult,
  type ClassificationSummary,
} from '@/lib/links/classifyUrl';

export const maxDuration = 10; // 10 seconds should be plenty for classification

/**
 * POST /api/links/classify
 *
 * Classify URLs into embed, social, or product categories.
 * This is a fast, synchronous operation (no scraping).
 *
 * Request body:
 * - urls: string[] - Array of URLs to classify
 * OR
 * - input: string - Raw text to parse for URLs
 *
 * Response:
 * - results: ClassificationResult[] - Classification for each URL
 * - summary: ClassificationSummary - Count by type
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { urls, input } = body;

    // Get URLs from either format
    let urlsToClassify: string[];

    if (Array.isArray(urls)) {
      urlsToClassify = urls.slice(0, 25); // Max 25
    } else if (typeof input === 'string') {
      urlsToClassify = parseUrlsFromInput(input, 25);
    } else {
      return NextResponse.json(
        { error: 'Either urls array or input string is required' },
        { status: 400 }
      );
    }

    if (urlsToClassify.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs found' },
        { status: 400 }
      );
    }

    // Classify all URLs (synchronous, no network calls)
    const { results, summary } = classifyUrls(urlsToClassify);

    return NextResponse.json({
      results,
      summary,
    });
  } catch (error) {
    console.error('POST /api/links/classify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
