import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabase } from '@/lib/serverSupabase';
import { generateBrandContext } from '@/lib/brandKnowledge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/ai/generate-why-chosen
 *
 * DOCTRINE: Fills `why_chosen` field with permanent value;
 * constructive dopamine from articulated stories.
 *
 * Generates personalized item narratives by analyzing context,
 * comparisons, and decision criteria.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    itemId: string;
    bagContext?: string;
    tone?: 'professional' | 'casual' | 'enthusiast';
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { itemId, bagContext, tone = 'casual' } = body;

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  // Fetch the item with its bag context
  const { data: item, error: itemError } = await supabase
    .from('bag_items')
    .select(`
      id,
      custom_name,
      brand,
      custom_description,
      notes,
      specs,
      compared_to,
      alternatives,
      price_paid,
      bag_id,
      bags!inner(id, title, category, description, owner_id)
    `)
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Verify ownership
  const bag = item.bags as unknown as { id: string; title: string; category: string; description: string; owner_id: string };
  if (bag.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to edit this item' }, { status: 403 });
  }

  // Get brand knowledge for richer context
  const brandContext = item.brand ? await generateBrandContext(item.brand) : null;

  // Build the prompt
  const toneGuides: Record<string, string> = {
    professional: 'Write in a professional, authoritative tone suitable for a product review or buying guide.',
    casual: 'Write in a friendly, conversational tone as if explaining to a friend why you picked this.',
    enthusiast: 'Write with genuine enthusiasm and expertise, as someone who deeply cares about their gear.',
  };

  const systemPrompt = `You are a curation assistant helping creators explain why they chose specific items for their collections.

Generate a brief "Why I Chose This" explanation (2-3 sentences max) that captures the essence of why this item is in the collection.

${toneGuides[tone]}

Guidelines:
- Be specific about what makes this item special
- Reference the product's strengths or unique qualities
- If alternatives or comparisons are provided, subtly acknowledge the decision process
- Keep it genuine and authentic, not salesy
- Don't use generic phrases like "it's the best" without backing it up
- Consider how this item fits into the broader collection context`;

  const userPrompt = `Generate a "Why I Chose This" explanation for:

Product: ${item.custom_name}${item.brand ? ` by ${item.brand}` : ''}
${item.custom_description ? `Description: ${item.custom_description}` : ''}
${item.notes ? `Notes: ${item.notes}` : ''}
${item.compared_to ? `Compared to: ${item.compared_to}` : ''}
${item.alternatives?.length ? `Alternatives considered: ${item.alternatives.join(', ')}` : ''}
${item.price_paid ? `Price paid: $${item.price_paid}` : ''}
${item.specs && Object.keys(item.specs).length > 0 ? `Specs: ${JSON.stringify(item.specs)}` : ''}

Collection Context:
- Collection: "${bag.title}"
${bag.category ? `- Category: ${bag.category}` : ''}
${bag.description ? `- About: ${bag.description}` : ''}
${bagContext ? `- Additional context: ${bagContext}` : ''}

${brandContext ? `Brand Background: ${brandContext}` : ''}

Generate ONLY the "Why I Chose This" text - no preamble, no quotes, just the explanation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const whyChosen = completion.choices[0]?.message?.content?.trim() || '';

    // Return the generated text (don't auto-save, let the client decide)
    return NextResponse.json({
      success: true,
      whyChosen,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Error generating why_chosen:', error);

    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
