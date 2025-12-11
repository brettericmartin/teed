/**
 * Two-Stage Product Validation API
 * Stage 1: Object Validation - Confirm/reject detected objects
 * Stage 2: Product Validation - Confirm/correct product identifications
 *
 * Also captures feedback for the learning loop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { ContentIdea } from '@/lib/types/contentIdeas';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Types for validation stages
interface ObjectValidation {
  // Products the admin confirmed
  confirmedProducts: Array<{
    id: string;      // Temporary ID from extraction
    name: string;
    brand?: string;
    category?: string;
    confirmed: boolean;
  }>;
  // Products the admin added that were missed
  addedProducts: Array<{
    name: string;
    brand?: string;
    category?: string;
    source: 'admin_added';
    notes?: string;
  }>;
  // Content type confirmation/correction
  contentType: 'single_hero' | 'roundup' | 'comparison';
  contentTypeCorrected: boolean;
  // Optional notes
  notes?: string;
}

interface ProductValidation {
  // Validated products with admin corrections
  validatedProducts: Array<{
    id: string;
    originalName: string;
    originalBrand?: string;
    // Admin-corrected values (or same as original if correct)
    name: string;
    brand?: string;
    model?: string;
    category?: string;
    heroScore?: number;
    // Correction tracking
    wasCorrected: boolean;
    correctionNotes?: string;
    // Purchase links
    links?: Array<{
      url: string;
      domain: string;
      label?: string;
      isAffiliate: boolean;
    }>;
  }>;
  // Optional overall notes
  notes?: string;
}

interface FeedbackRecord {
  content_idea_id: string;
  original_extraction: Record<string, unknown>;
  admin_corrections: Record<string, unknown>;
  correction_type: string;
  validation_stage: string;
  admin_notes?: string;
  admin_id: string;
  vertical?: string;
  source_type?: string;
}

/**
 * POST /api/admin/content-ideas/[id]/validate
 * Submit validation for either stage 1 or stage 2
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body = await request.json();

    const { stage, validation } = body as {
      stage: 'object_validation' | 'product_validation';
      validation: ObjectValidation | ProductValidation;
    };

    if (!stage || !validation) {
      return NextResponse.json(
        { error: 'Missing stage or validation data' },
        { status: 400 }
      );
    }

    // Fetch the content idea
    const { data: contentIdea, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !contentIdea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const idea = contentIdea as ContentIdea;

    if (stage === 'object_validation') {
      return handleObjectValidation(id, idea, validation as ObjectValidation, admin);
    } else if (stage === 'product_validation') {
      return handleProductValidation(id, idea, validation as ProductValidation, admin);
    } else {
      return NextResponse.json({ error: 'Invalid validation stage' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Validate] Error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Stage 1: Object Validation
 */
async function handleObjectValidation(
  ideaId: string,
  idea: ContentIdea,
  validation: ObjectValidation,
  admin: { id: string }
) {
  const originalProducts = idea.extracted_products || [];
  const feedbackRecords: FeedbackRecord[] = [];

  // Track corrections
  const rejectedProducts = validation.confirmedProducts.filter(p => !p.confirmed);
  const addedProducts = validation.addedProducts || [];
  const contentTypeCorrected = validation.contentTypeCorrected;

  // Record false positives (rejected products)
  for (const rejected of rejectedProducts) {
    const original = originalProducts.find(p =>
      p.name?.toLowerCase() === rejected.name?.toLowerCase()
    );

    feedbackRecords.push({
      content_idea_id: ideaId,
      original_extraction: { product: original || rejected },
      admin_corrections: { action: 'rejected', reason: 'false_positive' },
      correction_type: 'false_positive',
      validation_stage: 'object_validation',
      admin_id: admin.id,
      vertical: idea.vertical || undefined,
      source_type: (original as { sources?: string[] })?.sources?.[0] || 'unknown',
    });
  }

  // Record missed products (admin added)
  for (const added of addedProducts) {
    feedbackRecords.push({
      content_idea_id: ideaId,
      original_extraction: { action: 'product_not_detected' },
      admin_corrections: { product: added },
      correction_type: 'missed_product',
      validation_stage: 'object_validation',
      admin_notes: added.notes,
      admin_id: admin.id,
      vertical: idea.vertical || undefined,
      source_type: 'admin_added',
    });
  }

  // Record content type correction
  if (contentTypeCorrected) {
    feedbackRecords.push({
      content_idea_id: ideaId,
      original_extraction: {
        contentType: idea.extraction_metadata?.contentType || 'unknown',
      },
      admin_corrections: { contentType: validation.contentType },
      correction_type: 'content_type',
      validation_stage: 'object_validation',
      admin_id: admin.id,
      vertical: idea.vertical || undefined,
    });
  }

  // Save feedback records
  if (feedbackRecords.length > 0) {
    const { error: feedbackError } = await supabaseAdmin
      .from('extraction_feedback')
      .insert(feedbackRecords);

    if (feedbackError) {
      console.error('[Validate] Failed to save feedback:', feedbackError);
    }
  }

  // Build validated products list
  const confirmedIds = new Set(
    validation.confirmedProducts
      .filter(p => p.confirmed)
      .map(p => p.id)
  );

  const validatedProducts = [
    // Original products that were confirmed
    ...originalProducts.filter((_, idx) =>
      confirmedIds.has(String(idx)) || confirmedIds.has(originalProducts[idx]?.name)
    ),
    // Admin-added products
    ...addedProducts.map(p => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      sources: ['admin_added'] as string[],
      confidence: 100,
      isHeroCandidate: false,
      heroScore: 50,
    })),
  ];

  // Update content idea
  const { error: updateError } = await supabaseAdmin
    .from('content_ideas')
    .update({
      validated_products: validatedProducts,
      validation_status: 'object_validated',
      extraction_metadata: {
        ...idea.extraction_metadata,
        contentType: validation.contentType,
        objectValidationAt: new Date().toISOString(),
        objectValidationNotes: validation.notes,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', ideaId);

  if (updateError) {
    console.error('[Validate] Failed to update content idea:', updateError);
    return NextResponse.json(
      { error: 'Failed to save validation' },
      { status: 500 }
    );
  }

  // Log admin action
  await logAdminAction(
    { id: admin.id } as Parameters<typeof logAdminAction>[0],
    'settings.update',
    'content_ideas',
    ideaId,
    {
      subAction: 'validate_objects',
      confirmedCount: validation.confirmedProducts.filter(p => p.confirmed).length,
      rejectedCount: rejectedProducts.length,
      addedCount: addedProducts.length,
      contentTypeCorrected,
    }
  );

  return NextResponse.json({
    success: true,
    stage: 'object_validation',
    validatedProducts,  // Include the actual products for the client
    validatedProductCount: validatedProducts.length,
    feedbackRecorded: feedbackRecords.length,
    nextStage: 'product_validation',
  });
}

/**
 * Handle Stage 2: Product Validation
 */
async function handleProductValidation(
  ideaId: string,
  idea: ContentIdea,
  validation: ProductValidation,
  admin: { id: string }
) {
  const feedbackRecords: FeedbackRecord[] = [];
  const validatedProducts = idea.validated_products || idea.extracted_products || [];

  // Track corrections
  for (const validated of validation.validatedProducts) {
    if (validated.wasCorrected) {
      // Determine correction type
      let correctionType = 'multiple';
      const original = validatedProducts.find(p =>
        p.name?.toLowerCase() === validated.originalName?.toLowerCase()
      );

      if (validated.brand !== validated.originalBrand) {
        correctionType = 'wrong_brand';
      } else if (validated.name !== validated.originalName) {
        correctionType = 'wrong_model';
      } else if (validated.heroScore && original?.heroScore &&
                 Math.abs(validated.heroScore - (original.heroScore || 0)) > 20) {
        correctionType = 'hero_score';
      }

      feedbackRecords.push({
        content_idea_id: ideaId,
        original_extraction: {
          name: validated.originalName,
          brand: validated.originalBrand,
          product: original,
        },
        admin_corrections: {
          name: validated.name,
          brand: validated.brand,
          model: validated.model,
          category: validated.category,
          heroScore: validated.heroScore,
        },
        correction_type: correctionType,
        validation_stage: 'product_validation',
        admin_notes: validated.correctionNotes,
        admin_id: admin.id,
        vertical: idea.vertical || undefined,
        source_type: (original as { sources?: string[] })?.sources?.[0] || 'unknown',
      });
    }
  }

  // Save feedback records
  if (feedbackRecords.length > 0) {
    const { error: feedbackError } = await supabaseAdmin
      .from('extraction_feedback')
      .insert(feedbackRecords);

    if (feedbackError) {
      console.error('[Validate] Failed to save feedback:', feedbackError);
    }
  }

  // Build final validated products list
  const finalProducts = validation.validatedProducts.map(v => {
    const original = validatedProducts.find(p =>
      p.name?.toLowerCase() === v.originalName?.toLowerCase()
    );

    return {
      ...original,
      name: v.name,
      brand: v.brand,
      model: v.model,
      category: v.category,
      heroScore: v.heroScore ?? original?.heroScore,
      isHeroCandidate: (v.heroScore ?? original?.heroScore ?? 0) >= 70,
      validated: true,
      // Include links from validation (may have been added/edited by admin)
      links: v.links || original?.links || [],
    };
  });

  // Update content idea
  const { error: updateError } = await supabaseAdmin
    .from('content_ideas')
    .update({
      validated_products: finalProducts,
      extracted_products: finalProducts, // Also update extracted_products for backward compat
      validation_status: 'product_validated',
      validated_at: new Date().toISOString(),
      validated_by_admin_id: admin.id,
      extraction_metadata: {
        ...idea.extraction_metadata,
        productValidationAt: new Date().toISOString(),
        productValidationNotes: validation.notes,
        validationComplete: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', ideaId);

  if (updateError) {
    console.error('[Validate] Failed to update content idea:', updateError);
    return NextResponse.json(
      { error: 'Failed to save validation' },
      { status: 500 }
    );
  }

  // Log admin action
  await logAdminAction(
    { id: admin.id } as Parameters<typeof logAdminAction>[0],
    'settings.update',
    'content_ideas',
    ideaId,
    {
      subAction: 'validate_products',
      productCount: finalProducts.length,
      correctionsCount: feedbackRecords.length,
    }
  );

  return NextResponse.json({
    success: true,
    stage: 'product_validation',
    validatedProducts: finalProducts,  // Include the final validated products
    finalProductCount: finalProducts.length,
    feedbackRecorded: feedbackRecords.length,
    validationComplete: true,
  });
}

/**
 * GET /api/admin/content-ideas/[id]/validate
 * Get current validation status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = await params;

    const { data: contentIdea, error } = await supabaseAdmin
      .from('content_ideas')
      .select(`
        id,
        extracted_products,
        validated_products,
        validation_status,
        validated_at,
        validated_by_admin_id,
        extraction_metadata
      `)
      .eq('id', id)
      .single();

    if (error || !contentIdea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const hasExtraction = contentIdea.extracted_products &&
                          Array.isArray(contentIdea.extracted_products) &&
                          contentIdea.extracted_products.length > 0;

    return NextResponse.json({
      hasExtraction,
      extractedProductCount: hasExtraction ? contentIdea.extracted_products.length : 0,
      validatedProductCount: contentIdea.validated_products?.length || 0,
      validationStatus: contentIdea.validation_status || 'pending',
      validatedAt: contentIdea.validated_at,
      extractionMetadata: contentIdea.extraction_metadata,
      // For UI to know which stage to show
      currentStage: !hasExtraction
        ? 'needs_extraction'
        : contentIdea.validation_status === 'product_validated'
          ? 'complete'
          : contentIdea.validation_status === 'object_validated'
            ? 'product_validation'
            : 'object_validation',
    });
  } catch (error) {
    console.error('[Validate] Get status error:', error);
    return NextResponse.json(
      { error: 'Failed to get validation status' },
      { status: 500 }
    );
  }
}
