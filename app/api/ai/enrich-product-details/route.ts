import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';

/**
 * POST /api/ai/enrich-product-details
 *
 * Enriches a specific product with detailed information:
 * - Brand (if not provided)
 * - Formatted specs/description
 * - Fun facts and product differentiation
 * - Notes about why it matters
 *
 * This is called when:
 * 1. User selects a product from AI suggestions
 * 2. User provides a product link
 * 3. User wants to auto-fill details for an item
 *
 * Body:
 * {
 *   productName: string          // Product name (required)
 *   brand?: string              // Brand if known
 *   category?: string           // Product category
 *   url?: string                // Product URL if available
 *   existingDetails?: string    // Any existing details to enhance
 * }
 *
 * Returns:
 * {
 *   brand: string
 *   custom_description: string  // Formatted specs (e.g., "10.5° | Fujikura Ventus | Stiff")
 *   notes: string              // Product differentiation, fun facts, why it matters
 *   fun_facts?: string[]       // Array of interesting facts about the product
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, brand, category, url, existingDetails } = body;

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: 'productName is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert product researcher who provides detailed, interesting information about products.

Your job is to enrich product details with:
1. Accurate brand identification
2. Properly formatted specifications
3. Product differentiation (what makes this special/different)
4. Fun facts and interesting context
5. Why this product matters or typical use cases

FORMATTING STANDARDS (use pipe separator for specs):
- Golf: "Loft | Shaft | Flex" (e.g., "10.5° | Fujikura Ventus | Stiff")
- Makeup: "Shade | Finish | Size" (e.g., "Ruby Woo | Matte | 3g")
- Fashion: "Size | Color | Material" (e.g., "Medium | Black | 100% Cotton")
- Tech: "Storage | Key Feature | Connectivity" (e.g., "256GB | A17 Pro | USB-C")
- Outdoor: "Weight | Rating | Capacity" (e.g., "12.6oz | 20°F | 2-person")

NOTES GUIDELINES:
- 2-3 sentences max
- Focus on what makes this product special or different
- Include practical context (use cases, target audience)
- Be enthusiastic but authentic
- Avoid marketing speak - be genuine

FUN FACTS:
- Include 2-4 interesting facts about the product
- Can be historical, technical, or cultural
- Should be genuinely interesting, not just specs restated

Return ONLY valid JSON in this exact format:
{
  "brand": "Brand Name",
  "custom_description": "Formatted specs using pipes",
  "notes": "Why this product is special and who it's for",
  "fun_facts": [
    "Interesting fact 1",
    "Interesting fact 2"
  ]
}

Be specific and accurate. If you don't have enough information, say so rather than guessing.`;

    let contextInfo = '';
    if (brand) contextInfo += `Brand: ${brand}\n`;
    if (category) contextInfo += `Category: ${category}\n`;
    if (url) contextInfo += `Product URL: ${url}\n`;
    if (existingDetails) contextInfo += `Existing details: ${existingDetails}\n`;

    const userPrompt = `Enrich this product with detailed information:

Product: "${productName}"
${contextInfo}

Provide brand, formatted specifications, product differentiation notes, and fun facts.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use full model for better product knowledge
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Balanced for accuracy + interesting facts
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // Validate response
    if (!result.brand || !result.custom_description || !result.notes) {
      console.warn('Incomplete AI response:', result);
    }

    console.log('Product enrichment result:', {
      product: productName,
      brand: result.brand,
      hasFunFacts: result.fun_facts?.length > 0,
    });

    return NextResponse.json({
      brand: result.brand || brand || 'Unknown',
      custom_description: result.custom_description || '',
      notes: result.notes || '',
      fun_facts: result.fun_facts || [],
    });
  } catch (error) {
    console.error('Error enriching product details:', error);

    return NextResponse.json(
      {
        error: 'Failed to enrich product details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
