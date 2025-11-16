import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EnrichmentRequest = {
  userInput: string;
  bagContext?: string;
  existingAnswers?: Record<string, string>;
};

type ProductSuggestion = {
  custom_name: string;
  custom_description: string;
  notes: string;
  category: string;
  confidence: number;
};

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
};

type EnrichmentResponse = {
  suggestions: ProductSuggestion[];
  clarificationNeeded: boolean;
  questions: ClarificationQuestion[];
};

/**
 * POST /api/ai/enrich-item
 *
 * Generates product suggestions and clarification questions based on user input
 *
 * Body:
 * {
 *   userInput: string          // User's item description
 *   bagContext?: string        // Optional: bag title/category for context
 *   existingAnswers?: object   // Optional: answers from previous clarifications
 * }
 *
 * Returns:
 * {
 *   suggestions: ProductSuggestion[]       // 3-5 enriched product suggestions
 *   clarificationNeeded: boolean           // Whether to show questions
 *   questions: ClarificationQuestion[]     // Questions if needed
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnrichmentRequest = await request.json();
    const { userInput, bagContext, existingAnswers = {} } = body;

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    // Build context for AI
    let contextPrompt = '';
    if (bagContext) {
      contextPrompt += `Bag context: "${bagContext}"\n`;
    }
    if (Object.keys(existingAnswers).length > 0) {
      contextPrompt += `User has answered:\n${JSON.stringify(existingAnswers, null, 2)}\n`;
    }

    const systemPrompt = `You are a product enrichment assistant for Teed, an app that helps users catalog their belongings.

Your job is to:
1. Detect the product vertical (makeup/beauty, golf equipment, fashion, tech/EDC, outdoor/camping)
2. Generate 3-5 specific product suggestions with enriched details
3. Determine if clarification questions are needed
4. Generate clarification questions if confidence is low

Product verticals and their key details:
- Makeup/Beauty: Brand, product type, shade/color, finish, price
- Golf Equipment: Brand, model, loft, shaft specs, flex
- Fashion/Clothing: Brand, item type, size, color, material, price
- Tech/EDC: Brand, model, storage/capacity, key specs
- Outdoor/Camping: Brand, weight, temperature rating, material, capacity

Format enriched details as:
- custom_name: Brand + Product Name (2-6 words, concise)
- custom_description: "Spec 1 | Spec 2 | Spec 3" (use | separator, 3-5 specs)
- notes: Why this matters, use case, or helpful context (1-2 sentences)

Confidence scoring:
- 0.9+: Very confident, no questions needed
- 0.7-0.89: Moderately confident, show suggestions but offer questions
- <0.7: Low confidence, definitely need clarification

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "custom_name": "Product Name",
      "custom_description": "Spec 1 | Spec 2 | Spec 3",
      "notes": "Context and use case",
      "category": "Vertical Name",
      "confidence": 0.85
    }
  ],
  "clarificationNeeded": true,
  "questions": [
    {
      "id": "type",
      "question": "What type of [item]?",
      "options": ["Option 1", "Option 2", "Option 3", "Other"]
    }
  ]
}

Order suggestions by confidence (highest first). Limit to max 2 questions.`;

    const userPrompt = `${contextPrompt}User input: "${userInput}"

Generate product suggestions and determine if clarification is needed.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const result: EnrichmentResponse = JSON.parse(responseText);

    // Validate response structure
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error('Invalid response format: missing suggestions array');
    }

    // Sort suggestions by confidence
    result.suggestions.sort((a, b) => b.confidence - a.confidence);

    // Determine if clarification is truly needed
    const topConfidence = result.suggestions[0]?.confidence || 0;
    result.clarificationNeeded = topConfidence < 0.9 && result.questions && result.questions.length > 0;

    console.log('AI Enrichment Result:', {
      input: userInput,
      suggestionsCount: result.suggestions.length,
      topConfidence,
      clarificationNeeded: result.clarificationNeeded,
      questionsCount: result.questions?.length || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in AI enrichment:', error);

    // Return a fallback response
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
