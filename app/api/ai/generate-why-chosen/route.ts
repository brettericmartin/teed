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

  // Fetch sibling items from the same bag for collection cohesiveness
  const { data: siblingItems } = await supabase
    .from('bag_items')
    .select('custom_name, brand')
    .eq('bag_id', item.bag_id)
    .neq('id', itemId)
    .limit(20);

  const siblingList = siblingItems
    ?.filter((s: { custom_name: string | null }) => s.custom_name)
    .map((s: { custom_name: string | null; brand: string | null }) =>
      s.brand ? `${s.custom_name} by ${s.brand}` : s.custom_name
    ) ?? [];

  // Build the prompt
  const toneGuides: Record<string, string> = {
    professional: 'Write in a professional, authoritative tone suitable for a product review or buying guide.',
    casual: 'Write in a friendly, conversational tone as if explaining to a friend why you picked this.',
    enthusiast: 'Write with genuine enthusiasm and expertise, as someone who deeply cares about their gear.',
  };

  const systemPrompt = `You are a curation assistant helping creators explain why they chose specific items for their collections.

Generate exactly 3 distinct "Why I Chose This" options, each 1-2 sentences. Each option should take a different angle:
1. Focus on the product's standout feature or quality
2. Focus on the personal experience or problem it solves
3. Focus on how it fits into the broader collection or compares to alternatives

${toneGuides[tone]}

Guidelines:
- Be specific about what makes this item special
- Reference the product's strengths or unique qualities
- If alternatives or comparisons are provided, subtly acknowledge the decision process
- Keep it genuine and authentic, not salesy
- Don't use generic phrases like "it's the best" without backing it up
- Consider how this item fits into the broader collection context

Return the 3 options as a JSON array of strings. Example format:
["Option 1 text here.", "Option 2 text here.", "Option 3 text here."]

Return ONLY the JSON array, no other text.`;

  const userPrompt = `Generate 3 "Why I Chose This" options for:

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
${siblingList.length > 0 ? `- This item is part of a collection that also includes: ${siblingList.join(', ')}. Consider how this item complements the collection.` : ''}

${brandContext ? `Brand Background: ${brandContext}` : ''}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    // Parse the JSON array response
    let options: string[] = [];
    try {
      // Try to extract JSON array from the response (handle potential markdown wrapping)
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        options = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, treat the whole response as a single option
      options = [raw];
    }

    // Ensure we have at least one option
    if (options.length === 0) {
      options = [raw];
    }

    // Return both new multi-option format and legacy single-option format
    return NextResponse.json({
      success: true,
      options,
      whyChosen: options[0] || '', // backward compat: first option as the single value
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
