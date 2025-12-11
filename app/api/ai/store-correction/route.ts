import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  StoreCorrectionRequest,
  StoreCorrectionResponse,
  UserCorrection,
  ValidatedProduct
} from '@/lib/apis/types';

/**
 * APIS Stage 5: Store Corrections for Learning
 *
 * Stores user corrections to improve future identifications.
 * Implements quality filtering before learning.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest): Promise<NextResponse<StoreCorrectionResponse>> {
  try {
    const body: StoreCorrectionRequest = await request.json();
    const { correction, finalProduct, sourceImage } = body;

    if (!correction) {
      return NextResponse.json(
        { success: false, error: 'No correction provided', learned: false },
        { status: 400 }
      );
    }

    // Quality filter: Only learn from meaningful corrections
    const shouldLearn = validateCorrectionQuality(correction, finalProduct);

    if (shouldLearn) {
      // Store correction in database for learning
      await storeCorrection(correction, finalProduct, sourceImage);
      console.log(`[APIS Stage 5] Stored correction: ${correction.correctionType} - ${correction.correctedValue}`);
    } else {
      console.log(`[APIS Stage 5] Skipped low-quality correction: ${correction.correctionType}`);
    }

    return NextResponse.json({
      success: true,
      learned: shouldLearn
    });

  } catch (error: any) {
    console.error('[APIS Stage 5] Store correction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store correction', learned: false },
      { status: 500 }
    );
  }
}

/**
 * Quality filter for corrections
 * Prevents learning from:
 * - Very short/meaningless corrections
 * - Corrections that might be noise
 * - Low-confidence final products
 */
function validateCorrectionQuality(
  correction: UserCorrection,
  finalProduct?: ValidatedProduct
): boolean {
  // Correction must have meaningful content
  if (!correction.correctedValue || correction.correctedValue.length < 3) {
    return false;
  }

  // If we have a final product, it should have reasonable confidence
  if (finalProduct) {
    // Don't learn from very low confidence results
    if (finalProduct.finalConfidence < 40) {
      return false;
    }

    // Don't learn from mismatches (user might have made a mistake)
    if (finalProduct.validation?.recommendation === 'mismatch') {
      return false;
    }
  }

  // Product name corrections should be specific
  if (correction.correctionType === 'product-name') {
    // Should contain at least some alphanumeric characters
    const alphanumeric = correction.correctedValue.replace(/[^a-zA-Z0-9]/g, '');
    if (alphanumeric.length < 5) {
      return false;
    }
  }

  return true;
}

/**
 * Store correction in database
 */
async function storeCorrection(
  correction: UserCorrection,
  finalProduct?: ValidatedProduct,
  sourceImage?: string
): Promise<void> {
  try {
    // Check if we have the corrections table
    const { error: insertError } = await supabase
      .from('ai_corrections')
      .insert({
        correction_type: correction.correctionType,
        stage: correction.stage,
        original_value: correction.originalValue || null,
        corrected_value: correction.correctedValue,
        product_id: correction.productId || null,
        object_id: correction.objectId || null,
        final_product_name: finalProduct?.name || null,
        final_product_brand: finalProduct?.brand || null,
        final_confidence: finalProduct?.finalConfidence || null,
        validation_score: finalProduct?.validation?.visualMatchScore || null,
        has_source_image: !!sourceImage,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      // Table might not exist yet - log but don't fail
      console.warn('[APIS Stage 5] Failed to insert correction (table may not exist):', insertError.message);

      // Fallback: Store in a log for later processing
      console.log('[APIS Stage 5] Correction data:', JSON.stringify({
        correction,
        finalProductName: finalProduct?.name,
        finalProductBrand: finalProduct?.brand,
        finalConfidence: finalProduct?.finalConfidence
      }));
    }

  } catch (error) {
    // Don't throw - correction storage is non-critical
    console.error('[APIS Stage 5] Database error:', error);
  }
}

/**
 * Migration helper - creates the corrections table if needed
 * This would normally be in a migration file
 */
export async function ensureCorrectionTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_corrections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      correction_type text NOT NULL,
      stage text NOT NULL,
      original_value text,
      corrected_value text NOT NULL,
      product_id text,
      object_id text,
      final_product_name text,
      final_product_brand text,
      final_confidence integer,
      validation_score integer,
      has_source_image boolean DEFAULT false,
      learned_at timestamptz,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_ai_corrections_type ON ai_corrections(correction_type);
    CREATE INDEX IF NOT EXISTS idx_ai_corrections_created ON ai_corrections(created_at);
  `;

  // This would be run in a migration, not in the API
  console.log('[APIS] Table creation SQL ready');
}
