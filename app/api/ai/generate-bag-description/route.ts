import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabase } from '@/lib/serverSupabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/ai/generate-bag-description
 *
 * DOCTRINE: Permanent value without engagement pressure;
 * professional presentation optimized for search and social.
 *
 * Generates compelling bag descriptions and meta content
 * optimized for SEO and social sharing.
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
    bagCode: string;
    type: 'description' | 'meta' | 'both';
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bagCode, type = 'both' } = body;

  if (!bagCode) {
    return NextResponse.json({ error: 'bagCode is required' }, { status: 400 });
  }

  // Fetch the bag with its items
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select(`
      id,
      title,
      description,
      category,
      tags,
      owner_id,
      bag_items (
        custom_name,
        brand,
        custom_description,
        is_featured
      )
    `)
    .eq('code', bagCode)
    .single();

  if (bagError || !bag) {
    return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
  }

  // Verify ownership
  if (bag.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to edit this bag' }, { status: 403 });
  }

  // Get owner's profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('id', user.id)
    .single();

  const items = bag.bag_items || [];
  const featuredItems = items.filter((i: any) => i.is_featured);
  const topItems = featuredItems.length > 0 ? featuredItems : items.slice(0, 5);

  const itemsContext = topItems.map((i: any) =>
    `${i.brand ? `${i.brand} ` : ''}${i.custom_name}${i.custom_description ? ` - ${i.custom_description}` : ''}`
  ).join('\n');

  const systemPrompt = `You are an SEO and content optimization assistant for a curation platform.

Generate compelling, authentic content that:
- Captures the essence of the collection without hype or clickbait
- Uses natural language that appeals to both humans and search engines
- Avoids generic phrases like "the best" or "must-have"
- Focuses on what makes this collection valuable and unique
- Is specific about the items and their context`;

  const results: { description?: string; metaDescription?: string } = {};

  try {
    if (type === 'description' || type === 'both') {
      const descPrompt = `Generate a compelling bag description (2-3 sentences, 50-100 words) for:

Title: "${bag.title}"
${bag.category ? `Category: ${bag.category}` : ''}
${bag.tags?.length ? `Tags: ${bag.tags.join(', ')}` : ''}
${bag.description ? `Current description: "${bag.description}"` : ''}
Items (${items.length} total):
${itemsContext || 'No items yet'}
${profile?.display_name ? `Creator: ${profile.display_name}` : ''}

Write ONLY the description - no preamble, no quotes. Make it engaging but authentic.`;

      const descCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: descPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      results.description = descCompletion.choices[0]?.message?.content?.trim() || '';
    }

    if (type === 'meta' || type === 'both') {
      const metaPrompt = `Generate an SEO meta description (exactly 150-160 characters) for:

Title: "${bag.title}"
${bag.category ? `Category: ${bag.category}` : ''}
${bag.tags?.length ? `Tags: ${bag.tags.join(', ')}` : ''}
Items (${items.length} total):
${itemsContext || 'No items yet'}

Requirements:
- MUST be between 150-160 characters (critical for SEO)
- Include key items or themes
- End with a complete thought (no cutoff)
- Be specific and compelling

Write ONLY the meta description - no preamble, no character count, no quotes.`;

      const metaCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: metaPrompt },
        ],
        max_tokens: 80,
        temperature: 0.7,
      });

      results.metaDescription = metaCompletion.choices[0]?.message?.content?.trim() || '';
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('Error generating bag description:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
