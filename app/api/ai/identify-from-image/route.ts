import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { trackApiUsage } from '@/lib/apiUsageTracker';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ProductIdentification = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
  brand?: string;
  funFactOptions?: string[];
  productUrl?: string;
  imageUrl?: string;
  price?: string;
};

// Known brands for detection (same as enrich-item route)
const KNOWN_BRANDS: Record<string, string> = {
  // Golf - Equipment
  'taylormade': 'golf', 'callaway': 'golf', 'titleist': 'golf', 'ping': 'golf', 'cobra': 'golf',
  'mizuno': 'golf', 'srixon': 'golf', 'cleveland': 'golf', 'bridgestone': 'golf', 'wilson': 'golf',
  'vice golf': 'golf', 'kirkland': 'golf', 'bushnell': 'golf', 'garmin': 'golf', 'blue tees': 'golf',
  // Golf - Apparel
  'travis mathew': 'golf', 'g/fore': 'golf', 'peter millar': 'golf', 'greyson': 'golf',
  'good good': 'golf', 'good good golf': 'golf', 'ace high': 'golf', 'bad birdie': 'golf',
  'malbon': 'golf', 'eastside golf': 'golf', 'nocturnal': 'golf',
  // Tech
  'apple': 'tech', 'samsung': 'tech', 'sony': 'tech', 'bose': 'tech', 'google': 'tech',
  'tryx': 'tech', 'luca': 'tech',
  // Fashion
  'nike': 'fashion', 'adidas': 'fashion', 'patagonia': 'fashion', 'north face': 'fashion',
};

// Detect brand from text hint - prefer last-appearing brand
function detectBrandFromHint(hint: string): string | null {
  if (!hint) return null;
  const hintLower = hint.toLowerCase();

  const matchingBrands: { brand: string; position: number }[] = [];
  for (const brand of Object.keys(KNOWN_BRANDS)) {
    const position = hintLower.indexOf(brand);
    if (position !== -1) {
      matchingBrands.push({ brand, position });
    }
  }

  if (matchingBrands.length > 0) {
    // Pick the brand that appears LAST in the hint
    matchingBrands.sort((a, b) => b.position - a.position);
    return matchingBrands[0].brand;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { imageBase64, textHint, bagContext } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Detect brand from text hint
    const detectedBrand = detectBrandFromHint(textHint);
    console.log(`[identify-from-image] Processing image with hint: "${textHint || 'none'}", detected brand: "${detectedBrand || 'none'}"`);

    // Build the prompt based on whether we have a text hint
    let userPrompt = '';

    // If we detected a brand, tell the AI to use it
    const brandInstruction = detectedBrand
      ? `\n\nIMPORTANT: The user specified the brand "${detectedBrand.toUpperCase()}". ALL suggestions MUST use this brand. Do NOT suggest products from other brands.`
      : '';

    if (textHint && textHint.trim()) {
      userPrompt = `The user has provided a hint to help identify this product: "${textHint}"
${brandInstruction}

Use the hint combined with the image to identify the specific product. The hint may contain:
- Brand name (use this as the brand for ALL suggestions)
- Product line or model name
- Product type or description

${bagContext ? `Context: This is for a "${bagContext}" collection.` : ''}`;
    } else {
      userPrompt = `Identify the main products visible in this image. Focus on items that appear to be the subject of the photo (clothing, gear, accessories, etc).

${bagContext ? `Context: This is for a "${bagContext}" collection.` : ''}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a product identification expert. Analyze images and identify products with high accuracy.

IMPORTANT: Return MULTIPLE possible matches (3-5 options) when the exact product isn't certain. Include:
1. Your best guess at the exact product (highest confidence)
2. Alternative models from the SAME BRAND
3. Variations that might match

CRITICAL - BRAND HANDLING:
- If the user provides a brand name in their hint, ALL suggestions MUST use that brand
- Do NOT suggest products from other brands when the user has specified one
- The brand in the hint takes priority over what you see in the image

For each product, return a JSON object with:
- custom_name: The product name (model name, NOT including brand)
- custom_description: LEAVE EMPTY "" unless you know actual specs. Do NOT make up colors, sizes, or materials
- notes: Any interesting details about the product
- category: Product category (e.g., "hat", "polo", "driver", "bag", "PC Case", etc.)
- confidence: Your confidence level 0-1 (1 = certain identification)
- brand: Brand name (REQUIRED - use the brand from user hint if provided)
- funFactOptions: Array of 2-3 interesting facts about this product/brand
- productUrl: If you know the official product page URL, include it (optional)
- imageUrl: If you know a direct image URL for this product, include it (optional)

DO NOT MAKE UP SPECS: If you don't know the actual color, size, material - leave custom_description empty.

Always respond with valid JSON in this format:
{
  "products": [
    {
      "custom_name": "Ace High Polo",
      "custom_description": "",
      "notes": "Part of Good Good's premium golf apparel line",
      "category": "Golf Apparel",
      "confidence": 0.85,
      "brand": "Good Good",
      "funFactOptions": ["...", "..."],
      "productUrl": "https://goodgood.com/products/ace-high-polo",
      "imageUrl": "https://cdn.goodgood.com/ace-high-polo.jpg"
    }
  ]
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    console.log(`[identify-from-image] GPT-4V response:`, content);

    // Parse the JSON response
    let products: ProductIdentification[] = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      products = parsed.products || [];
    } catch (parseError) {
      console.error('[identify-from-image] Failed to parse response:', parseError);
      // Try to extract any product info from the text
      return NextResponse.json({
        suggestions: [],
        error: 'Failed to parse product identification',
        rawResponse: content
      });
    }

    // Ensure all products have required fields
    const suggestions: ProductIdentification[] = products.map((p: any) => ({
      custom_name: p.custom_name || p.name || 'Unknown Product',
      custom_description: p.custom_description || p.description || '',
      notes: p.notes || '',
      category: p.category || 'item',
      confidence: p.confidence || 0.7,
      brand: p.brand,
      funFactOptions: p.funFactOptions || [],
      productUrl: p.productUrl,
      imageUrl: p.imageUrl,
      price: p.price,
    }));

    console.log(`[identify-from-image] Identified ${suggestions.length} products`);

    // Track API usage
    const durationMs = Date.now() - startTime;
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/identify-from-image',
      model: 'gpt-4o',
      operationType: 'identify',
      inputTokens: response.usage?.prompt_tokens || 1500, // Vision uses ~1500 tokens per image
      outputTokens: response.usage?.completion_tokens || 0,
      durationMs,
      status: 'success',
    }).catch(console.error);

    return NextResponse.json({
      suggestions,
      searchTier: 'vision',
    });

  } catch (error: any) {
    console.error('[identify-from-image] Error:', error);

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/identify-from-image',
      model: 'gpt-4o',
      operationType: 'identify',
      durationMs: Date.now() - startTime,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);

    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Please check your API credits.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to identify products from image' },
      { status: 500 }
    );
  }
}
