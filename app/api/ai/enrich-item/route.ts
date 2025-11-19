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
  brand: string;
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

Product verticals and their SMART DEFAULT formatting:
- Golf: custom_description = "Loft | Shaft | Flex" (e.g., "10.5° | Fujikura Ventus | Stiff")
- Makeup: custom_description = "Shade | Finish | Size" (e.g., "Ruby Woo | Matte | 3g")
- Fashion: custom_description = "Size | Color | Material" (e.g., "Medium | Black | 100% Cotton")
- Tech: custom_description = "Storage | Key Feature | Connectivity" (e.g., "256GB | A17 Pro | USB-C")
- Outdoor: custom_description = "Weight | Rating | Capacity" (e.g., "12.6oz | 20°F | 2-person")

Format enriched details as:
- brand: Brand name ONLY (e.g., "TaylorMade", "MAC", "Patagonia") - REQUIRED
- custom_name: Product Name without brand (2-6 words, concise, e.g., "Stealth 2 Plus Driver")
- custom_description: Formatted specs using pipe separator (adapt to available info, don't guess)
- notes: Product differentiation, fun facts, or why this matters (2-3 sentences, be interesting!)

Confidence scoring:
- 0.9+: Very confident, no questions needed
- 0.7-0.89: Moderately confident, show suggestions but offer questions
- <0.7: Low confidence, definitely need clarification

NOTES SHOULD BE INTERESTING AND USEFUL:
- Include what makes this product special or different from competitors
- Add fun facts, history, or unique features
- Mention typical use cases or who it's for
- Be enthusiastic but genuine - avoid generic marketing speak
- 2-3 sentences max

EXAMPLES OF GOOD NOTES:
✅ "Tour-proven distance with revolutionary carbon face technology. Dustin Johnson used this exact model to win his first Masters. Perfect for high swing speeds looking to maximize ball speed."
✅ "MAC's bestselling lipstick shade worn by everyone from Rihanna to your mom. The Retro Matte formula stays put for 8+ hours without drying. A true makeup icon since 1999."
✅ "The gold standard for ultralight backpacking tents. Weighs less than 3 pounds yet survived a night on Everest. REI's most-returned item because people underestimate how small it packs."

❌ "A good driver for golfers" - too generic!
❌ "Quality lipstick" - boring!
❌ "Nice tent" - useless!

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "brand": "TaylorMade",
      "custom_name": "Stealth 2 Plus Driver",
      "custom_description": "10.5° | Fujikura Ventus | Stiff",
      "notes": "Revolutionary 60-layer carbon face is 24% lighter than titanium. Tour players saw 2mph more ball speed versus SIM2. Built for low-spin bombers who shape shots.",
      "funFactOptions": [
        "Revolutionary 60-layer carbon face is 24% lighter than titanium. Tour players saw 2mph more ball speed versus SIM2. Built for low-spin bombers who shape shots.",
        "First carbon-faced driver to be legal by USGA/R&A. Tiger Woods won the 2023 Genesis Invitational with this exact model.",
        "The Stealth name comes from the blackout finish that reduces glare. Carbon Twist Face tech maintains ball speed on mis-hits better than any previous TaylorMade driver."
      ],
      "category": "Golf Equipment",
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

IMPORTANT: Each suggestion MUST include funFactOptions array with 3 different fun fact variations.
- First option: Technical/performance focused
- Second option: Celebrity/tour player usage focused
- Third option: Historical/innovation focused

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
