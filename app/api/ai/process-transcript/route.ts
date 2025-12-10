import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { openai } from '@/lib/openaiClient';
import { generateBrandContext, loadCategoryKnowledge } from '@/lib/brandKnowledge';
import { trackApiUsage } from '@/lib/apiUsageTracker';

export const maxDuration = 60; // Transcripts can be long

/**
 * Detect the likely category from bagType and transcript content
 */
function detectCategory(bagType?: string, transcript?: string): string | null {
  // Category keyword mapping for detection
  const categoryKeywords: Record<string, string[]> = {
    golf: ['golf', 'driver', 'iron', 'putter', 'wedge', 'titleist', 'taylormade', 'callaway', 'ping', 'mizuno'],
    outdoor: ['hiking', 'camping', 'backpack', 'tent', 'outdoor', 'trail', 'osprey', 'patagonia', 'arc\'teryx'],
    tech: ['tech', 'gadget', 'electronics', 'laptop', 'phone', 'tablet', 'apple', 'samsung', 'sony'],
    fashion: ['fashion', 'clothing', 'apparel', 'shirt', 'pants', 'dress', 'nike', 'adidas', 'supreme'],
    makeup: ['makeup', 'cosmetics', 'beauty', 'lipstick', 'foundation', 'mascara', 'fenty', 'mac', 'nars'],
    photography: ['camera', 'lens', 'photography', 'photo', 'video', 'canon', 'nikon', 'sony', 'fujifilm'],
    gaming: ['gaming', 'game', 'console', 'pc', 'xbox', 'playstation', 'nintendo', 'razer', 'logitech'],
    music: ['music', 'guitar', 'piano', 'drums', 'audio', 'studio', 'fender', 'gibson', 'yamaha'],
    fitness: ['fitness', 'gym', 'workout', 'exercise', 'crossfit', 'weights', 'rogue', 'nike', 'under armour'],
    travel: ['travel', 'luggage', 'suitcase', 'bag', 'carry-on', 'samsonite', 'away', 'rimowa'],
    edc: ['edc', 'everyday carry', 'knife', 'flashlight', 'wallet', 'benchmade', 'spyderco', 'leatherman'],
  };

  // First, try to detect from bagType
  if (bagType) {
    const lowerBagType = bagType.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerBagType.includes(keyword))) {
        return category;
      }
    }
  }

  // Then, try to detect from transcript content
  if (transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const categoryScores: Record<string, number> = {};

    // Count keyword matches for each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      categoryScores[category] = keywords.filter(keyword =>
        lowerTranscript.includes(keyword)
      ).length;
    }

    // Return the category with the highest score (if > 0)
    const maxScore = Math.max(...Object.values(categoryScores));
    if (maxScore > 0) {
      const detectedCategory = Object.entries(categoryScores)
        .find(([_, score]) => score === maxScore)?.[0];
      return detectedCategory || null;
    }
  }

  return null;
}

/**
 * POST /api/ai/process-transcript
 *
 * Processes video/podcast transcripts to extract product mentions.
 * Uses brand knowledge when available to improve product identification accuracy.
 *
 * Request body:
 * {
 *   transcript: string (required) - The transcript text
 *   bagType?: string - Type of bag for context (e.g., "Golf Bag", "Camera Bag")
 *   youtubeUrl?: string - Optional YouTube URL for context
 * }
 *
 * Response:
 * {
 *   products: IdentifiedProduct[],
 *   totalConfidence: number,
 *   processingTime: number,
 *   metadata: {
 *     transcriptLength: number,
 *     productsFound: number,
 *     youtubeUrl?: string,
 *     detectedCategory?: string,
 *     usedBrandKnowledge: boolean
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // Read-only for this endpoint
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { transcript, bagType, youtubeUrl } = body;

    // Validate required fields
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check transcript length
    const transcriptLength = transcript.trim().length;
    if (transcriptLength > 100000) {
      return NextResponse.json(
        { error: 'Transcript is too long. Maximum 100,000 characters.' },
        { status: 400 }
      );
    }

    if (transcriptLength < 50) {
      return NextResponse.json(
        { error: 'Transcript is too short. Please provide at least 50 characters.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    console.log(`[Transcript Processing] Processing transcript (${transcriptLength} chars)`);

    // Detect category and load brand knowledge
    const detectedCategory = detectCategory(bagType, transcript);
    let brandContext = '';

    if (detectedCategory) {
      const knowledge = loadCategoryKnowledge(detectedCategory);
      if (knowledge) {
        brandContext = generateBrandContext(detectedCategory, 'standard');
        console.log(`[Transcript Processing] Using brand knowledge for category: ${detectedCategory}`);
      } else {
        console.log(`[Transcript Processing] No brand knowledge available for category: ${detectedCategory}`);
      }
    } else {
      console.log('[Transcript Processing] Could not detect category from bagType/transcript');
    }

    // Build the system prompt with optional brand knowledge
    const systemPrompt = `You are an expert at extracting product mentions from video/podcast transcripts.

Your task is to identify SPECIFIC products mentioned in the transcript. Focus on:
- Products that are explicitly named or described
- Brand names and model numbers when mentioned
- Equipment, tools, gear, accessories
- Avoid generic mentions (e.g., "I use a camera" without specifics)
${brandContext ? `\n${brandContext}\n\nUSE THE BRAND KNOWLEDGE ABOVE TO:
- Recognize brand-specific terminology in speech
- Correctly spell brand and model names (even if misspelled in transcript)
- Identify specific products mentioned based on visual descriptions
- Match color descriptions to known brand colorways
- Understand common abbreviations and nicknames for brands/products
` : ''}
Return ONLY valid JSON in this format:
{
  "products": [
    {
      "name": "Product Model/Name",
      "brand": "Brand Name",
      "category": "Product Category",
      "description": "Brief description from context (specs, color, features)",
      "confidence": 0.85,
      "reasoning": "Why you identified this product and confidence level",
      "mentionContext": "Relevant quote from transcript showing the mention"
    }
  ]
}

CONFIDENCE SCORING (BE CONSERVATIVE):
- 90-100: Explicit brand + model mentioned (e.g., "TaylorMade Stealth 2 driver")
- 70-89: Brand clear, model inferred from context
- 50-69: Product type clear but brand/model uncertain
- 30-49: Vague mention, making educated guess
- <30: Very uncertain

IMPORTANT:
- Only extract products that are CLEARLY mentioned
- If no specific products are mentioned, return empty products array
- Don't invent products that aren't there
- Higher confidence for explicit mentions with brand/model
- Lower confidence for "I have a..." without details${brandContext ? '\n- Use brand knowledge to improve spelling and identification accuracy' : ''}`;

    // Use GPT-4 to extract product mentions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `${bagType ? `Context: This is a ${bagType}\n\n` : ''}${youtubeUrl ? `Video URL: ${youtubeUrl}\n\n` : ''}Extract product mentions from this transcript:

${transcript.trim()}`,
        },
      ],
      temperature: 0.3, // Lower temperature for consistent extraction
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"products":[]}');

    // Transform to match IdentifiedProduct format
    const products = (result.products || []).map((product: any) => ({
      name: product.name || 'Unknown Product',
      brand: product.brand || null,
      category: product.category || null,
      description: product.description || null,
      confidence: product.confidence || 0.5,
      reasoning: product.reasoning || '',
      source: 'transcript',
      metadata: {
        mentionContext: product.mentionContext || '',
        youtubeUrl: youtubeUrl || null,
      },
    }));

    // Calculate average confidence
    const avgConfidence = products.length > 0
      ? products.reduce((sum: number, p: any) => sum + p.confidence, 0) / products.length
      : 0;

    const processingTime = Date.now() - startTime;

    const response = {
      products,
      totalConfidence: Math.round(avgConfidence * 100) / 100,
      processingTime,
      metadata: {
        transcriptLength,
        productsFound: products.length,
        youtubeUrl: youtubeUrl || null,
        detectedCategory: detectedCategory || null,
        usedBrandKnowledge: !!brandContext,
      },
    };

    console.log(`[Transcript Processing] Found ${products.length} products in ${processingTime}ms`);
    console.log('AI Transcript Processing Result:', {
      userId: user.id,
      transcriptLength,
      productsFound: products.length,
      avgConfidence: response.totalConfidence,
      processingTime,
      detectedCategory: detectedCategory || 'none',
      usedBrandKnowledge: !!brandContext,
    });

    // Track API usage
    trackApiUsage({
      userId: user.id,
      endpoint: '/api/ai/process-transcript',
      model: 'gpt-4o',
      operationType: 'transcript',
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      requestSizeBytes: transcriptLength,
      durationMs: processingTime,
      status: 'success',
    }).catch(console.error);

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Transcript processing error:', {
      message: error.message,
      status: error?.status,
      code: error?.code,
    });

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/process-transcript',
      model: 'gpt-4o',
      operationType: 'transcript',
      durationMs: 0,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);

    const errorMessage = error.message || 'Failed to process transcript';
    const statusCode = error?.status === 429 ? 429 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
