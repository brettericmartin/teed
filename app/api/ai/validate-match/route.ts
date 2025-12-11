import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { validateAndCompressImage } from '@/lib/ai';
import type {
  ValidateMatchRequest,
  ValidateMatchResponse,
  ValidationResult
} from '@/lib/apis/types';

/**
 * APIS Stage 4: Visual Validation
 *
 * Compares the enriched product information/image against the user's original source.
 * THIS generates the REAL confidence score - not the AI's guess, but actual match verification.
 *
 * This is the key innovation: confidence is now "how well does found product match what user has"
 * instead of "how confident is AI in its initial guess"
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidateMatchResponse>> {
  try {
    const body: ValidateMatchRequest = await request.json();
    const { sourceImage, enrichedProduct } = body;

    if (!sourceImage) {
      return NextResponse.json(
        { success: false, error: 'sourceImage is required' },
        { status: 400 }
      );
    }

    if (!enrichedProduct) {
      return NextResponse.json(
        { success: false, error: 'enrichedProduct is required' },
        { status: 400 }
      );
    }

    // Validate source image if base64
    let sourceImageUrl = sourceImage;
    if (sourceImage.startsWith('data:image/')) {
      const validation = validateAndCompressImage(sourceImage);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error || 'Invalid source image' },
          { status: 400 }
        );
      }
      sourceImageUrl = sourceImage;
    }

    // Build the prompt with product context
    const productContext = `
Product to validate:
- Name: ${enrichedProduct.name}
- Brand: ${enrichedProduct.brand || 'Unknown'}
- Category: ${enrichedProduct.category}
- Model Year: ${enrichedProduct.modelYear || 'Unknown'}
- Generation: ${enrichedProduct.generation || 'Unknown'}
- Colors: ${enrichedProduct.colors ? `Primary: ${enrichedProduct.colors.primary}, Secondary: ${enrichedProduct.colors.secondary || 'N/A'}` : 'Unknown'}
- Specifications: ${enrichedProduct.specifications?.join(', ') || 'None'}
${enrichedProduct.productImage?.imageUrl ? `- Product Image URL: ${enrichedProduct.productImage.imageUrl}` : ''}
`;

    const systemPrompt = `You are a product validation expert. Your job is to compare a user's image against product information we found, and determine if they match.

${productContext}

You must analyze the user's image and determine:
1. Does the product in their image match the product we identified?
2. How confident are you in this match?
3. What specific aspects match or don't match?

THIS IS CRITICAL: Your confidence score will be shown to users as THE confidence score. Be accurate and conservative.
- If colors don't match, that's a major discrepancy
- If the shape/form is different, that's a major discrepancy
- If brand logos don't match, that's a major discrepancy
- If model year indicators don't match, note that

Return JSON with this exact structure:
{
  "visualMatchScore": 85,
  "matchDetails": {
    "colorMatch": { "matches": true, "confidence": 90, "notes": "Primary color matches" },
    "shapeMatch": { "matches": true, "confidence": 95, "notes": "Mallet shape confirmed" },
    "brandLogoMatch": { "matches": true, "confidence": 80, "notes": "Scotty Cameron logo visible" },
    "modelDetailsMatch": { "matches": true, "confidence": 75, "notes": "Appears to be Phantom X series" },
    "yearIndicatorsMatch": { "matches": false, "confidence": 60, "notes": "Stitching pattern suggests newer model" }
  },
  "discrepancies": ["Year might be different - found product is 2022, this looks like 2023 stitching"],
  "recommendation": "likely"
}

Scoring guidelines:
- visualMatchScore 90-100: Near-perfect match, very confident
- visualMatchScore 70-89: Good match with minor uncertainties
- visualMatchScore 50-69: Possible match but significant uncertainty
- visualMatchScore 30-49: Poor match, likely different product
- visualMatchScore <30: Does not match

recommendation values:
- "confirmed": 85+ score, no major discrepancies
- "likely": 65-84 score, minor discrepancies
- "uncertain": 40-64 score, significant discrepancies
- "mismatch": <40 score, clearly different product`;

    const userPrompt = `Analyze this image and validate if it matches the product we identified (${enrichedProduct.brand || ''} ${enrichedProduct.name}).

Look for:
1. Color match - does the primary color match?
2. Shape match - does the overall shape/form match?
3. Brand indicators - any visible logos, text, or brand signatures?
4. Model details - specific features of this model?
5. Year indicators - any visual cues about when this was made?

Be thorough and honest about discrepancies.`;

    // Build message content - include product image if available for comparison
    const messageContent: any[] = [
      { type: 'text', text: userPrompt },
      {
        type: 'image_url',
        image_url: {
          url: sourceImageUrl,
          detail: 'high' // High detail for accurate validation
        }
      }
    ];

    // If we have a product image, include it for side-by-side comparison
    if (enrichedProduct.productImage?.imageUrl) {
      messageContent.push({
        type: 'text',
        text: '\n\nHere is the product image we found for comparison:'
      });
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: enrichedProduct.productImage.imageUrl,
          detail: 'high'
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Full model for accurate validation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageContent }
      ],
      max_tokens: 1000,
      temperature: 0.2, // Low for consistency
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No response from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    // Build validation result
    const validation: ValidationResult = {
      productId: enrichedProduct.id,
      visualMatchScore: Math.min(100, Math.max(0, parsed.visualMatchScore || 50)),
      matchDetails: {
        colorMatch: {
          matches: parsed.matchDetails?.colorMatch?.matches ?? false,
          confidence: parsed.matchDetails?.colorMatch?.confidence ?? 50,
          notes: parsed.matchDetails?.colorMatch?.notes
        },
        shapeMatch: {
          matches: parsed.matchDetails?.shapeMatch?.matches ?? false,
          confidence: parsed.matchDetails?.shapeMatch?.confidence ?? 50,
          notes: parsed.matchDetails?.shapeMatch?.notes
        },
        brandLogoMatch: {
          matches: parsed.matchDetails?.brandLogoMatch?.matches ?? false,
          confidence: parsed.matchDetails?.brandLogoMatch?.confidence ?? 50,
          notes: parsed.matchDetails?.brandLogoMatch?.notes
        },
        modelDetailsMatch: {
          matches: parsed.matchDetails?.modelDetailsMatch?.matches ?? false,
          confidence: parsed.matchDetails?.modelDetailsMatch?.confidence ?? 50,
          notes: parsed.matchDetails?.modelDetailsMatch?.notes
        },
        yearIndicatorsMatch: {
          matches: parsed.matchDetails?.yearIndicatorsMatch?.matches ?? false,
          confidence: parsed.matchDetails?.yearIndicatorsMatch?.confidence ?? 50,
          notes: parsed.matchDetails?.yearIndicatorsMatch?.notes
        }
      },
      discrepancies: parsed.discrepancies || [],
      recommendation: ['confirmed', 'likely', 'uncertain', 'mismatch'].includes(parsed.recommendation)
        ? parsed.recommendation
        : 'uncertain',
      sourceImageUrl: sourceImage.startsWith('data:') ? undefined : sourceImage,
      foundImageUrl: enrichedProduct.productImage?.imageUrl
    };

    console.log(`[APIS Stage 4] Validation complete: ${validation.visualMatchScore}% match, recommendation: ${validation.recommendation}`);

    return NextResponse.json({ success: true, validation });

  } catch (error: any) {
    console.error('[APIS Stage 4] Validation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate match' },
      { status: 500 }
    );
  }
}
