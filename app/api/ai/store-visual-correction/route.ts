import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

/**
 * Store Visual Correction API
 *
 * Stores user corrections with full visual context for learning.
 * Also generates AI notes on what visual cues should distinguish the correction.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VisualCorrectionRequest {
  // Visual features from Stage 1
  visualDescription: {
    objectType: string;
    itemTypeReasoning?: string;
    primaryColor: string;
    secondaryColors: string[];
    materials: string[];
    brandIndicators: string[];
    designEra?: string;
    ocrTexts?: Array<{
      text: string;
      type: 'brand' | 'model' | 'serial' | 'other';
      confidence: number;
    }>;
  };

  // Original AI guess
  originalGuess: {
    name: string;
    brand: string;
    confidence: number;
    matchingReasons: string[];
  };

  // User's correction
  correction: {
    name: string;
    brand: string;
  };

  // Context
  category?: string;
  croppedImageBase64?: string;
}

export interface VisualCorrectionResponse {
  success: boolean;
  correctionId?: string;
  changeSummary?: string;
  learningNotes?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VisualCorrectionResponse>> {
  try {
    const body: VisualCorrectionRequest = await request.json();
    const { visualDescription, originalGuess, correction, category } = body;

    // Validate required fields
    if (!visualDescription || !originalGuess || !correction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine what changed
    const nameChanged = correction.name !== originalGuess.name;
    const brandChanged = correction.brand !== originalGuess.brand;

    if (!nameChanged && !brandChanged) {
      // No actual correction made
      return NextResponse.json({
        success: true,
        changeSummary: 'No changes detected',
      });
    }

    // Determine correction type
    let correctionType = 'name';
    if (nameChanged && brandChanged) correctionType = 'both';
    else if (brandChanged) correctionType = 'brand';

    // Create change summary
    let changeSummary = '';
    if (nameChanged) {
      changeSummary = `"${originalGuess.name}" → "${correction.name}"`;
    }
    if (brandChanged) {
      if (changeSummary) changeSummary += ', ';
      changeSummary += `Brand: "${originalGuess.brand}" → "${correction.brand}"`;
    }

    // Extract OCR texts
    const ocrBrandText = visualDescription.ocrTexts?.find(t => t.type === 'brand')?.text;
    const ocrModelText = visualDescription.ocrTexts?.find(t => t.type === 'model')?.text;

    // Generate learning notes using AI
    let learningNotes = '';
    try {
      learningNotes = await generateLearningNotes(
        visualDescription,
        originalGuess,
        correction
      );
    } catch (err) {
      console.warn('[Visual Correction] Failed to generate learning notes:', err);
    }

    // Extract model keywords for searching
    const modelKeywords = extractModelKeywords(correction.name, originalGuess.name);

    // Store in database
    const { data, error: insertError } = await supabase
      .from('ai_visual_corrections')
      .insert({
        object_type: visualDescription.objectType,
        item_type_reasoning: visualDescription.itemTypeReasoning,
        primary_color: visualDescription.primaryColor,
        secondary_colors: visualDescription.secondaryColors,
        materials: visualDescription.materials,
        brand_indicators: visualDescription.brandIndicators,
        design_era: visualDescription.designEra,
        ocr_brand_text: ocrBrandText,
        ocr_model_text: ocrModelText,
        ocr_all_texts: visualDescription.ocrTexts ? JSON.stringify(visualDescription.ocrTexts) : null,
        original_name: originalGuess.name,
        original_brand: originalGuess.brand,
        original_confidence: originalGuess.confidence,
        original_matching_reasons: originalGuess.matchingReasons,
        corrected_name: correction.name,
        corrected_brand: correction.brand,
        correction_type: correctionType,
        change_summary: changeSummary,
        learning_notes: learningNotes,
        category: category || 'general',
        model_keywords: modelKeywords,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Visual Correction] Database insert error:', insertError);
      // Log for debugging but don't fail - corrections are non-critical
      return NextResponse.json({
        success: true,
        changeSummary,
        learningNotes,
        error: 'Stored in logs only (table may not exist)',
      });
    }

    console.log(`[Visual Correction] Stored correction: ${changeSummary}`);

    return NextResponse.json({
      success: true,
      correctionId: data?.id,
      changeSummary,
      learningNotes,
    });

  } catch (error: unknown) {
    console.error('[Visual Correction] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to store correction' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI learning notes
 * These notes help future identifications understand what visual cues distinguish this correction
 */
async function generateLearningNotes(
  visualDescription: VisualCorrectionRequest['visualDescription'],
  originalGuess: VisualCorrectionRequest['originalGuess'],
  correction: VisualCorrectionRequest['correction']
): Promise<string> {
  const prompt = `A user corrected an AI product identification. Generate a brief learning note (1-2 sentences) explaining what visual cues should distinguish the correct product from the original guess.

ORIGINAL AI GUESS:
- Name: ${originalGuess.name}
- Brand: ${originalGuess.brand}
- Reasons for guess: ${originalGuess.matchingReasons.join(', ')}

VISUAL FEATURES DETECTED:
- Object type: ${visualDescription.objectType}
- Item type reasoning: ${visualDescription.itemTypeReasoning || 'N/A'}
- Colors: ${visualDescription.primaryColor}, ${visualDescription.secondaryColors.join(', ')}
- Materials: ${visualDescription.materials.join(', ')}
- Brand indicators: ${visualDescription.brandIndicators.join(', ')}
- OCR text found: ${visualDescription.ocrTexts?.map(t => t.text).join(', ') || 'None'}

USER'S CORRECTION:
- Corrected name: ${correction.name}
- Corrected brand: ${correction.brand}

Generate a concise learning note focusing on:
1. What visual difference should have indicated the correct product
2. Common confusion points to watch for

Example: "P-7TW irons have thinner toplines and less offset than P790. Look for the 'TW' marking on the cavity."`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at identifying product differences. Generate concise, actionable learning notes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 150,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

/**
 * Extract searchable keywords from product names
 */
function extractModelKeywords(correctedName: string, originalName: string): string[] {
  const keywords: Set<string> = new Set();

  // Extract from both names
  [correctedName, originalName].forEach(name => {
    // Split on spaces, dashes, underscores
    const parts = name.split(/[\s\-_]+/);
    parts.forEach(part => {
      // Only keep meaningful parts (alphanumeric, at least 2 chars)
      const cleaned = part.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleaned.length >= 2) {
        keywords.add(cleaned);
      }
    });

    // Also extract model numbers (like P790, Qi10, etc.)
    const modelMatches = name.match(/[A-Z]?[a-z]*\d+[A-Z]?[a-z]*/gi);
    modelMatches?.forEach(m => keywords.add(m.toLowerCase()));
  });

  return Array.from(keywords);
}
