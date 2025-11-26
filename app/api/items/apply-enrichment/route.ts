import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { openai } from '@/lib/openaiClient';

// Predefined categorical tags (not brands, just categories/activities)
const CATEGORICAL_TAGS = [
  'golf', 'travel', 'tech', 'edc', 'camping', 'photography', 'fitness',
  'gaming', 'music', 'outdoor', 'work', 'fashion', 'cooking', 'fishing',
  'hiking', 'cycling', 'running', 'yoga', 'skiing', 'snowboarding',
  'surfing', 'diving', 'hunting', 'woodworking', 'art', 'crafts',
  'streaming', 'podcasting', 'video', 'audio', 'productivity', 'minimal',
  'luxury', 'budget', 'vintage', 'everyday', 'weekend', 'professional',
  'beginner', 'enthusiast', 'creator', 'athlete', 'commuter', 'home-office'
];

/**
 * POST /api/items/apply-enrichment
 * Applies approved enrichment suggestions and generates bag tags
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bagId, approvedSuggestions } = body;

    if (!bagId || !approvedSuggestions || !Array.isArray(approvedSuggestions)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify bag ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('id', bagId)
      .single();

    if (bagError || !bag || bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Bag not found or unauthorized' }, { status: 404 });
    }

    let detailsEnriched = 0;
    let linksAdded = 0;

    // Apply each approved suggestion
    for (const suggestion of approvedSuggestions) {
      const { itemId, brand, description, notes, link } = suggestion;

      // Update item details
      if (brand || description || notes) {
        const updateData: any = {};
        if (brand) updateData.brand = brand;
        if (description) updateData.custom_description = description;
        if (notes) updateData.notes = notes;

        const { error: updateError } = await supabase
          .from('bag_items')
          .update(updateData)
          .eq('id', itemId);

        if (!updateError) {
          detailsEnriched++;
        }
      }

      // Add link
      if (link) {
        // Try to convert to affiliate link
        let finalUrl = link.url;
        let affiliateProvider = 'none';

        try {
          const affiliateResponse = await fetch(
            `${request.nextUrl.origin}/api/affiliate/resolve`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rawUrl: link.url,
                userId: user.id,
                itemId: itemId,
              }),
            }
          );

          if (affiliateResponse.ok) {
            const affiliateData = await affiliateResponse.json();
            finalUrl = affiliateData.affiliateUrl || link.url;
            affiliateProvider = affiliateData.provider || 'none';
          }
        } catch (error) {
          console.error('Failed to resolve affiliate URL:', error);
        }

        const { error: linkError } = await supabase.from('links').insert({
          bag_item_id: itemId,
          url: finalUrl,
          kind: 'product',
          label: link.label,
          is_auto_generated: true,
          metadata: {
            ai_source: link.source,
            ai_reasoning: link.reason,
            auto_generated_at: new Date().toISOString(),
            affiliate_provider: affiliateProvider,
          },
        });

        if (!linkError) {
          linksAdded++;
        }
      }
    }

    // Generate categorical tags for the bag based on items
    let tagsGenerated: string[] = [];

    // Get bag info and all items
    const { data: bagInfo } = await supabase
      .from('bags')
      .select('tags, title, description, category')
      .eq('id', bagId)
      .single();

    const { data: allItems } = await supabase
      .from('bag_items')
      .select('custom_name, brand, category')
      .eq('bag_id', bagId);

    const currentTags = bagInfo?.tags || [];

    // Only generate tags if bag has fewer than 3 tags
    if (allItems && allItems.length > 0 && currentTags.length < 3) {
      try {
        const itemSummary = allItems
          .filter(item => item.custom_name)
          .map(item => `${item.custom_name}${item.brand ? ` (${item.brand})` : ''}${item.category ? ` [${item.category}]` : ''}`)
          .join(', ');

        console.log(`Generating tags for bag with items: ${itemSummary}`);

        const tagResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a tag generator for product collections. Suggest 2-4 categorical tags.

RULES:
- Only use tags from: ${CATEGORICAL_TAGS.join(', ')}
- Choose tags for USE CASE/ACTIVITY, not brands
- Return JSON: {"tags": ["tag1", "tag2"]}`,
            },
            {
              role: 'user',
              content: `Bag: "${bagInfo?.title || 'Untitled'}"${bagInfo?.category ? ` (${bagInfo.category})` : ''}
Items: ${itemSummary}
Suggest 2-4 tags:`,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const tagContent = tagResponse.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(tagContent);
        const suggestedTags = Array.isArray(parsed) ? parsed : (parsed.tags || []);

        // Filter to approved tags only
        const validTags = suggestedTags
          .map((t: string) => t.toLowerCase().trim())
          .filter((t: string) => CATEGORICAL_TAGS.includes(t) && !currentTags.includes(t));

        if (validTags.length > 0) {
          tagsGenerated = validTags;
          const newTags = [...currentTags, ...validTags].slice(0, 5);

          await supabase
            .from('bags')
            .update({ tags: newTags, updated_at: new Date().toISOString() })
            .eq('id', bagId);

          console.log(`✅ Generated tags: ${validTags.join(', ')}`);
        } else {
          // Just update timestamp
          await supabase
            .from('bags')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', bagId);
        }
      } catch (error) {
        console.error('Failed to generate tags:', error);
        // Still update timestamp even if tag generation fails
        await supabase
          .from('bags')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', bagId);
      }
    } else {
      // Just update timestamp
      await supabase
        .from('bags')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bagId);
    }

    return NextResponse.json({
      success: true,
      detailsEnriched,
      linksAdded,
      tagsGenerated,
    });
  } catch (error) {
    console.error('Error applying enrichments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
