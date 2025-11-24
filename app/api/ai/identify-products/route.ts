import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { identifyProductsInImage } from '@/lib/ai';

// Increase body size limit for large images (iPhone photos can be 5-10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

// For Next.js App Router, also export runtime config
export const maxDuration = 60; // Allow up to 60 seconds for AI processing

/**
 * POST /api/ai/identify-products
 *
 * Identifies products in an image using GPT-4 Vision
 *
 * Request body:
 * {
 *   image: string (base64),
 *   bagType?: string,
 *   expectedCategories?: string[]
 * }
 *
 * Response:
 * {
 *   products: IdentifiedProduct[],
 *   totalConfidence: number,
 *   processingTime: number,
 *   warnings?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Best Practice: Verify authentication
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

    // Parse request body with error handling for large payloads
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Failed to parse request body:', parseError.message);
      return NextResponse.json(
        { error: 'Failed to parse image. The image may be too large. Please try a smaller image.' },
        { status: 413 }
      );
    }
    const { image, bagType, expectedCategories } = body;

    // Best Practice: Validate required fields
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Best Practice: Validate image format
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be base64 encoded.' },
        { status: 400 }
      );
    }

    // Call AI function
    const result = await identifyProductsInImage(image, {
      bagType,
      expectedCategories,
    });

    // Best Practice: Log usage for monitoring
    console.log('AI Vision used:', {
      userId: user.id,
      productsFound: result.products.length,
      confidence: result.totalConfidence,
      processingTime: result.processingTime,
    });

    // Return results
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    // Best Practice: Detailed error logging
    console.error('Product identification error:', {
      message: error.message,
      status: error?.status,
      code: error?.code,
    });

    // Best Practice: User-friendly error messages
    const errorMessage = error.message || 'Failed to identify products';
    const statusCode = error?.status === 429 ? 429 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Best Practice: Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
