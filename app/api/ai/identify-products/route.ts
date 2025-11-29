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
 * Identifies products in one or more images using GPT-4 Vision
 * Uses 3-phase census-first approach for accurate item counting
 *
 * Request body:
 * {
 *   image?: string (base64) - single image (legacy)
 *   images?: string[] (base64) - multiple images (up to 10)
 *   bagType?: string,
 *   expectedCategories?: string[]
 * }
 *
 * Response:
 * {
 *   products: IdentifiedProduct[],
 *   totalConfidence: number,
 *   processingTime: number,
 *   warnings?: string[],
 *   census?: { totalObjectsCounted: number, spatialDistribution: {...} },
 *   verification?: { productsIdentified: number, matchesCensus: boolean, completenessConfidence: number }
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
    const { image, images, bagType, expectedCategories } = body;

    // Support both single image (legacy) and multiple images
    const imageArray: string[] = images || (image ? [image] : []);

    // Best Practice: Validate required fields
    if (imageArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Validate max images
    if (imageArray.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed per request' },
        { status: 400 }
      );
    }

    // Best Practice: Validate image formats
    for (const img of imageArray) {
      if (!img.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image format. All images must be base64 encoded.' },
          { status: 400 }
        );
      }
    }

    const startTime = Date.now();

    // Process all images in parallel
    console.log(`[Bulk Identify] Processing ${imageArray.length} image(s)`);
    const results = await Promise.all(
      imageArray.map((img, index) =>
        identifyProductsInImage(img, {
          bagType,
          expectedCategories,
        }).then(result => ({
          ...result,
          imageIndex: index,
        }))
      )
    );

    // Combine all results, adding sourceImageIndex to each product
    const allProducts = results.flatMap(r =>
      r.products.map(product => ({
        ...product,
        sourceImageIndex: r.imageIndex,
      }))
    );
    const avgConfidence = results.reduce((sum, r) => sum + r.totalConfidence, 0) / results.length;
    const totalProcessingTime = Date.now() - startTime;

    // Combine warnings from all images
    const allWarnings = results.flatMap(r => r.warnings || []);

    // Combine census data (sum up counts from all images)
    const combinedCensus = results.some(r => r.census) ? {
      totalObjectsCounted: results.reduce((sum, r) => sum + (r.census?.totalObjectsCounted || 0), 0),
      spatialDistribution: {
        top: results.reduce((sum, r) => sum + (r.census?.spatialDistribution?.top || 0), 0),
        middle: results.reduce((sum, r) => sum + (r.census?.spatialDistribution?.middle || 0), 0),
        bottom: results.reduce((sum, r) => sum + (r.census?.spatialDistribution?.bottom || 0), 0),
      },
    } : undefined;

    // Combine verification data
    const combinedVerification = results.some(r => r.verification) ? {
      productsIdentified: results.reduce((sum, r) => sum + (r.verification?.productsIdentified || 0), 0),
      matchesCensus: results.every(r => r.verification?.matchesCensus !== false),
      completenessConfidence: Math.round(
        results.reduce((sum, r) => sum + (r.verification?.completenessConfidence || 100), 0) / results.length
      ),
      missedItemsEstimate: results.reduce((sum, r) => sum + (r.verification?.missedItemsEstimate || 0), 0) || undefined,
    } : undefined;

    const combinedResult = {
      products: allProducts,
      totalConfidence: Math.round(avgConfidence * 100) / 100,
      processingTime: totalProcessingTime,
      imagesProcessed: imageArray.length,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      census: combinedCensus,
      verification: combinedVerification,
    };

    // Best Practice: Log usage for monitoring
    console.log('AI Vision used:', {
      userId: user.id,
      imagesProcessed: imageArray.length,
      productsFound: allProducts.length,
      avgConfidence: combinedResult.totalConfidence,
      processingTime: totalProcessingTime,
      census: combinedCensus ? {
        totalObjects: combinedCensus.totalObjectsCounted,
        distribution: combinedCensus.spatialDistribution,
      } : null,
      verification: combinedVerification ? {
        identified: combinedVerification.productsIdentified,
        matchesCensus: combinedVerification.matchesCensus,
        completeness: combinedVerification.completenessConfidence,
        missed: combinedVerification.missedItemsEstimate,
      } : null,
      warnings: allWarnings.length,
    });

    // Return results
    return NextResponse.json(combinedResult, { status: 200 });

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
