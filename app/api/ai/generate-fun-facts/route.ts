import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { trackApiUsage } from '@/lib/apiUsageTracker';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type FunFactRequest = {
  brand?: string;
  productName: string;
  category?: string;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body: FunFactRequest = await request.json();
    const { brand, productName, category } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'productName is required' },
        { status: 400 }
      );
    }

    const productFullName = brand ? `${brand} ${productName}` : productName;

    const systemPrompt = `You are a product expert who creates engaging, interesting fun facts about products.

Generate 3 SHORT, INTERESTING fun facts about "${productFullName}".

RULES:
1. Each fact should be 1-2 sentences MAX
2. Focus on genuinely interesting, specific details that would surprise or delight someone
3. Avoid generic statements like "Released in 2024" or "Part of X's lineup"
4. Prioritize: unique features, surprising performance stats, notable users, design innovations, interesting history
5. If you don't know specific facts about this exact product, say so honestly rather than making things up

BAD examples (too generic, boring):
- "Released in 2024 as part of Callaway's driver lineup"
- "Part of the Elyte family of products"
- "Known for its quality construction"

GOOD examples (specific, interesting):
- "The face uses AI-designed micro-deflections that add 2-3mph ball speed on off-center hits"
- "Jon Rahm switched to this driver mid-season and won 3 events in the following 2 months"
- "The carbon crown saves 12g of weight, allowing for a lower CG than any previous model"

Return JSON in this format:
{
  "funFacts": [
    "Interesting fact 1",
    "Interesting fact 2",
    "Interesting fact 3"
  ],
  "confidence": 0.8
}

If you're not confident about this specific product, set confidence low and note that in the facts.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate fun facts for: ${productFullName}${category ? ` (Category: ${category})` : ''}` },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(responseText);

    // Track API usage
    const durationMs = Date.now() - startTime;
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/generate-fun-facts',
      model: 'gpt-4o',
      operationType: 'generate',
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      durationMs,
      status: 'success',
    }).catch(console.error);

    return NextResponse.json({
      funFacts: result.funFacts || [],
      confidence: result.confidence || 0.5,
    });
  } catch (error: any) {
    console.error('Error generating fun facts:', error);

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/generate-fun-facts',
      model: 'gpt-4o',
      operationType: 'generate',
      durationMs: Date.now() - startTime,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Failed to generate fun facts', funFacts: [] },
      { status: 500 }
    );
  }
}
