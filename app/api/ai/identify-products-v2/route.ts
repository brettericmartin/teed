import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { validateAndCompressImage } from '@/lib/ai';
import { generateBrandContext } from '@/lib/brandKnowledge';
import type {
  IdentifyProductsRequest,
  IdentifyProductsResponse,
  IdentifiedProduct,
  DetectedObject
} from '@/lib/apis/types';

/**
 * APIS Stage 2: Detailed Product Identification
 *
 * Identifies specific products using validated object types and user context.
 * Includes model year/generation detection.
 *
 * Uses gpt-4o for accurate identification.
 */
export async function POST(request: NextRequest): Promise<NextResponse<IdentifyProductsResponse>> {
  try {
    const body: IdentifyProductsRequest = await request.json();
    const { imageBase64, imageUrl, validatedObjects, userContext, bagContext } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Either imageBase64 or imageUrl is required' },
        { status: 400 }
      );
    }

    if (!validatedObjects || validatedObjects.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No validated objects provided' },
        { status: 400 }
      );
    }

    // Validate image if base64
    let imageSource = imageUrl;
    if (imageBase64) {
      const validation = validateAndCompressImage(imageBase64);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error || 'Invalid image' },
          { status: 400 }
        );
      }
      imageSource = imageBase64;
    }

    // Get categories from validated objects
    const categories = [...new Set(validatedObjects.map(o => o.productCategory))];

    // Load brand knowledge for detected categories
    const brandContext = generateBrandContext(categories, 'detailed');

    // Build object context
    const objectContext = validatedObjects.map((obj, idx) => (
      `${idx + 1}. ${obj.objectType} (${obj.productCategory}) - Location: ${obj.boundingDescription}
   Visual cues: ${obj.visualCues.join(', ') || 'none specified'}
   Certainty: ${obj.certainty}`
    )).join('\n');

    const systemPrompt = `You are an expert product identifier specializing in specific models, brands, and generations.

${brandContext}

═══════════════════════════════════════════════════════════════
USER HAS VALIDATED THESE OBJECTS
═══════════════════════════════════════════════════════════════
${objectContext}
${userContext ? `\nUSER CONTEXT/CORRECTION: "${userContext}"` : ''}
${bagContext ? `\nBAG TYPE: ${bagContext}` : ''}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
Identify the SPECIFIC PRODUCT for each validated object. The user has already confirmed what TYPE of object each is - now identify the exact brand, model, and year/generation.

═══════════════════════════════════════════════════════════════
MODEL YEAR & GENERATION IDENTIFICATION (CRITICAL)
═══════════════════════════════════════════════════════════════
For every product, you MUST attempt to identify the model year or generation:

VISUAL AGE INDICATORS:
- Design language evolution (older vs newer aesthetics)
- Technology features visible (older tech vs current)
- Color schemes tied to specific eras
- Logo/branding style changes over time
- Wear patterns indicating age
- Manufacturing details

GOLF-SPECIFIC YEAR CUES:
- TaylorMade: Red accents = Stealth (2022-23), Blue = Qi10 (2024)
- Titleist T-Series: Badge style changed each generation
- Callaway: Green = Paradym (2023+), Purple = Rogue ST (2022)
- Scotty Cameron: Stitching patterns, logo styles vary by year
- Ping: Orange = G410/G425 (2019-22), Blue/Teal = G430 (2023+)

RETURN THESE FIELDS FOR YEAR:
- modelYear: Best estimate year (e.g., 2022)
- generation: Human-friendly name (e.g., "Gen 1", "Original", "2nd Generation")
- yearConfidence: 0-100 how confident you are in the year
- yearCues: Array of visual cues that indicate the age

═══════════════════════════════════════════════════════════════
CONFIDENCE SCORING (BE CONSERVATIVE)
═══════════════════════════════════════════════════════════════
- 90-100: Clear branding AND model text visible
- 70-89: Brand clear, model inferred from distinct visual features
- 50-69: Can identify brand but model is educated guess
- 30-49: Uncertain, providing best guess with alternatives
- <30: Very uncertain

WHEN CONFIDENCE < 70: You MUST provide alternatives with reasoning.

═══════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════
Return JSON with this structure:
{
  "products": [
    {
      "id": "prod_1",
      "objectId": "obj_1",
      "name": "Specific Product Name",
      "brand": "Brand name",
      "category": "golf|tech|fashion|outdoor",
      "modelYear": 2022,
      "generation": "Gen 1",
      "yearConfidence": 75,
      "yearCues": ["Stitching pattern matches 2022 release", "Logo style is pre-2023"],
      "confidence": 85,
      "identificationMethod": "text-visible|visual-inference|user-provided",
      "matchingReasons": ["Logo clearly visible", "Color matches Qi10 Blue", "Head shape matches Max variant"],
      "colors": {
        "primary": "Carbon Black",
        "secondary": "Qi Blue",
        "finish": "matte"
      },
      "specifications": ["10.5°", "Stiff flex"],
      "alternatives": [
        {
          "name": "Alternative Name",
          "brand": "Brand",
          "modelYear": 2023,
          "confidence": 65,
          "differentiatingFactors": ["This model has X feature, but yours appears to have Y"]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Identify the specific product for each validated object in this image.

IMPORTANT:
1. The user has confirmed WHAT TYPE each object is - now identify the EXACT product
2. Include model year/generation estimates with confidence
3. Provide alternatives when confidence is below 70%
4. Be specific with brand and model names`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageSource!,
                detail: 'high' // High detail for accurate identification
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.2,
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

    // Process and validate products
    const products: IdentifiedProduct[] = (parsed.products || []).map((p: any, index: number) => ({
      id: p.id || `prod_${index + 1}`,
      objectId: p.objectId || validatedObjects[index]?.id || `obj_${index + 1}`,
      name: p.name || 'Unknown Product',
      brand: p.brand || undefined,
      category: p.category || validatedObjects[index]?.productCategory || 'other',
      modelYear: p.modelYear || undefined,
      generation: p.generation || undefined,
      yearConfidence: Math.min(100, Math.max(0, p.yearConfidence || 0)),
      yearCues: p.yearCues || [],
      confidence: Math.min(100, Math.max(0, p.confidence || 50)),
      identificationMethod: ['text-visible', 'visual-inference', 'user-provided', 'brand-knowledge'].includes(p.identificationMethod)
        ? p.identificationMethod
        : 'visual-inference',
      matchingReasons: p.matchingReasons || [],
      colors: p.colors ? {
        primary: p.colors.primary || undefined,
        secondary: p.colors.secondary || undefined,
        accent: p.colors.accent || undefined,
        finish: p.colors.finish || undefined,
        colorway: p.colors.colorway || undefined
      } : undefined,
      specifications: p.specifications || [],
      alternatives: (p.alternatives || []).map((alt: any) => ({
        name: alt.name || 'Alternative',
        brand: alt.brand || undefined,
        modelYear: alt.modelYear || undefined,
        confidence: Math.min(100, Math.max(0, alt.confidence || 50)),
        differentiatingFactors: alt.differentiatingFactors || []
      })),
      confirmedByUser: false
    }));

    console.log(`[APIS Stage 2] Identified ${products.length} products with year detection`);

    return NextResponse.json({ success: true, products });

  } catch (error: any) {
    console.error('[APIS Stage 2] Identification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to identify products' },
      { status: 500 }
    );
  }
}
