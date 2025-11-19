import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';

/**
 * Enhance a user's product description into an optimized Google Image Search query
 *
 * POST /api/ai/enhance-search-query
 * Body: { description: string, productName: string, brand?: string }
 * Returns: { query: string }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, productName, brand } = body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    console.log('Enhancing search query:', { description, productName, brand });

    const systemPrompt = `You are a Google Image Search expert. Your job is to convert user descriptions of products into highly effective Google Image Search queries that will find the exact product image they're looking for.

Rules:
1. Create a concise, keyword-rich search query (not a sentence)
2. Include brand name if provided
3. Include specific details from the description (color, model, size, type, etc.)
4. Use product-specific terminology
5. Avoid generic words like "product", "item", "thing"
6. Maximum 10 words
7. Prioritize specificity over length

Examples:
Input: "black running shoes with white swoosh" for product "Air Max 90" by "Nike"
Output: Nike Air Max 90 black white running shoes

Input: "the blue one with the logo" for product "Water Bottle" by "Hydro Flask"
Output: Hydro Flask blue water bottle

Input: "camping tent that fits 4 people, green" for product "Half Dome 4" by "REI"
Output: REI Half Dome 4 person green tent

Input: "wireless over-ear with noise canceling" for product "QuietComfort 45" by "Bose"
Output: Bose QuietComfort 45 wireless noise canceling headphones`;

    const userPrompt = `Product: ${productName}
${brand ? `Brand: ${brand}` : ''}
User Description: ${description}

Generate the optimal Google Image Search query:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, focused results
      max_tokens: 50,
    });

    const enhancedQuery = completion.choices[0]?.message?.content?.trim();

    if (!enhancedQuery) {
      throw new Error('Failed to generate enhanced query');
    }

    console.log('Enhanced search query:', enhancedQuery);

    return NextResponse.json({
      query: enhancedQuery,
    });

  } catch (error: any) {
    console.error('Enhance search query error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance search query' },
      { status: 500 }
    );
  }
}
