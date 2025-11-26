import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { findBestProductLinks, detectProductAge } from '@/lib/services/SmartLinkFinder';
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
 * POST /api/items/fill-info
 * Enriches items with BOTH AI-generated details AND smart product links
 *
 * This endpoint:
 * 1. Fills missing product details (brand, description, fun facts)
 * 2. Generates smart product links using AI
 * 3. Generates categorical tags for the bag based on items
 * 4. Only fills items that have incomplete information
 *
 * Body:
 * {
 *   bagId: string (required) - Bag ID to process
 * }
 *
 * Returns:
 * {
 *   processed: number - Number of items processed
 *   detailsEnriched: number - Number of items with details added
 *   linksAdded: number - Number of links created
 *   tagsGenerated: string[] - Tags generated for the bag
 *   items: Array<{ itemId: string, detailsAdded: boolean, linkAdded: boolean, reason?: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { bagId } = body;

    if (!bagId) {
      return NextResponse.json(
        { error: 'bagId is required' },
        { status: 400 }
      );
    }

    // Verify bag ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, title')
      .eq('id', bagId)
      .single();

    if (bagError || !bag || bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Bag not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all items in the bag
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, brand, category, custom_description, notes')
      .eq('bag_id', bagId);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        processed: 0,
        detailsEnriched: 0,
        linksAdded: 0,
        items: [],
      });
    }

    // Get existing links for these items
    const itemIds = items.map(item => item.id);
    const { data: existingLinks } = await supabase
      .from('links')
      .select('bag_item_id, is_auto_generated')
      .in('bag_item_id', itemIds);

    // Create a map of items that have user-created links
    const itemsWithUserLinks = new Set(
      existingLinks
        ?.filter(link => !link.is_auto_generated)
        .map(link => link.bag_item_id) || []
    );

    const results = [];
    let detailsEnriched = 0;
    let linksAdded = 0;

    // Process each item
    for (const item of items) {
      const result: any = {
        itemId: item.id,
        detailsAdded: false,
        linkAdded: false,
      };

      if (!item.custom_name) {
        result.reason = 'No product name available';
        results.push(result);
        continue;
      }

      // Step 1: Enrich details if missing
      const needsEnrichment = !item.brand || !item.custom_description || !item.notes;

      if (needsEnrichment) {
        try {
          console.log(`Enriching details for: ${item.custom_name}`);

          const enrichResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are a product enrichment assistant. Fill in missing details for products.

Return ONLY valid JSON:
{
  "brand": "Brand Name",
  "custom_description": "Specs using | separator (e.g., 10.5° | Stiff | Graphite)",
  "notes": "Interesting 2-3 sentence fun fact about the product"
}

Be specific and interesting. If you can't determine something, use your best judgment.`,
              },
              {
                role: 'user',
                content: `Product: "${item.custom_name}"
${item.brand ? `Existing brand: ${item.brand}` : ''}
${item.category ? `Category: ${item.category}` : ''}

Fill in missing: ${!item.brand ? 'brand' : ''} ${!item.custom_description ? 'description' : ''} ${!item.notes ? 'notes' : ''}`,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          });

          const enrichedData = JSON.parse(enrichResponse.choices[0]?.message?.content || '{}');

          // Update item with enriched data
          const updateData: any = {};
          if (!item.brand && enrichedData.brand) updateData.brand = enrichedData.brand;
          if (!item.custom_description && enrichedData.custom_description)
            updateData.custom_description = enrichedData.custom_description;
          if (!item.notes && enrichedData.notes) updateData.notes = enrichedData.notes;

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('bag_items')
              .update(updateData)
              .eq('id', item.id);

            if (!updateError) {
              result.detailsAdded = true;
              detailsEnriched++;
              console.log(`✅ Enriched: ${item.custom_name}`, updateData);
            }
          }
        } catch (error) {
          console.error(`Failed to enrich item ${item.id}:`, error);
        }
      }

      // Step 2: Add smart link if needed
      if (itemsWithUserLinks.has(item.id)) {
        result.linkReason = 'Item already has user-created links';
      } else {
        const hasAutoLink = existingLinks?.some(
          link => link.bag_item_id === item.id && link.is_auto_generated
        );

        if (hasAutoLink) {
          result.linkReason = 'Item already has auto-generated link';
        } else {
          // Use enriched brand if we just added it
          const brandToUse = item.brand || (result.detailsAdded ? 'Unknown' : undefined);

          // Detect if product is vintage/old
          const ageDetection = detectProductAge(item.custom_name, brandToUse);

          // Use AI to find the best purchase sources
          try {
            const linkResult = await findBestProductLinks({
              name: item.custom_name,
              brand: brandToUse,
              category: item.category,
              isVintage: ageDetection.isVintage,
            });

            const recommendedLink = linkResult.primaryLink;

            // Try to convert to affiliate link if applicable
            let finalUrl = recommendedLink.url;
            let affiliateProvider = 'none';

            if (recommendedLink.affiliatable) {
              try {
                const affiliateResponse = await fetch(
                  `${request.nextUrl.origin}/api/affiliate/resolve`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      rawUrl: recommendedLink.url,
                      userId: user.id,
                      itemId: item.id,
                    }),
                  }
                );

                if (affiliateResponse.ok) {
                  const affiliateData = await affiliateResponse.json();
                  finalUrl = affiliateData.affiliateUrl || recommendedLink.url;
                  affiliateProvider = affiliateData.provider || 'none';
                }
              } catch (error) {
                console.error('Failed to resolve affiliate URL:', error);
              }
            }

            // Create auto-generated link
            const { error: createError } = await supabase
              .from('links')
              .insert({
                bag_item_id: item.id,
                url: finalUrl,
                kind: 'product',
                label: recommendedLink.label,
                is_auto_generated: true,
                metadata: {
                  ai_source: recommendedLink.source,
                  ai_reasoning: linkResult.reasoning,
                  is_vintage: ageDetection.isVintage,
                  auto_generated_at: new Date().toISOString(),
                  affiliate_provider: affiliateProvider,
                },
              });

            if (!createError) {
              result.linkAdded = true;
              linksAdded++;
              console.log(`✅ Added link: ${item.custom_name} → ${recommendedLink.source}`);
            }
          } catch (error) {
            console.error(`Failed to create link for item ${item.id}:`, error);
            result.linkReason = 'Failed to generate link';
          }
        }
      }

      results.push(result);
    }

    // Step 3: Generate categorical tags for the bag based on items
    let tagsGenerated: string[] = [];

    // Get current bag tags
    const { data: currentBag } = await supabase
      .from('bags')
      .select('tags, title, description, category')
      .eq('id', bagId)
      .single();

    const currentTags = currentBag?.tags || [];

    // Only generate tags if bag has items and fewer than 3 tags
    if (items.length > 0 && currentTags.length < 3) {
      try {
        // Collect all item info for tag generation
        const itemSummary = items
          .filter(item => item.custom_name)
          .map(item => `${item.custom_name}${item.brand ? ` (${item.brand})` : ''}${item.category ? ` [${item.category}]` : ''}`)
          .join(', ');

        console.log(`Generating tags for bag with items: ${itemSummary}`);

        const tagResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a tag generator for product collections. Given a list of items, suggest 2-4 categorical tags.

IMPORTANT RULES:
- Only use tags from this approved list: ${CATEGORICAL_TAGS.join(', ')}
- Choose tags that describe the USE CASE or ACTIVITY, not brands
- Be specific but not too niche
- If the bag title or category gives context, use it

Return ONLY valid JSON array of lowercase tag strings:
["tag1", "tag2", "tag3"]`,
            },
            {
              role: 'user',
              content: `Bag title: "${currentBag?.title || 'Untitled'}"
${currentBag?.category ? `Category: ${currentBag.category}` : ''}
${currentBag?.description ? `Description: ${currentBag.description}` : ''}

Items in bag: ${itemSummary}

Suggest 2-4 categorical tags:`,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const tagContent = tagResponse.choices[0]?.message?.content || '[]';
        // Handle both array format and object with tags key
        let suggestedTags: string[];
        try {
          const parsed = JSON.parse(tagContent);
          suggestedTags = Array.isArray(parsed) ? parsed : (parsed.tags || []);
        } catch {
          suggestedTags = [];
        }

        // Filter to only approved categorical tags and merge with existing
        const validTags = suggestedTags
          .map(t => t.toLowerCase().trim())
          .filter(t => CATEGORICAL_TAGS.includes(t) && !currentTags.includes(t));

        if (validTags.length > 0) {
          tagsGenerated = validTags;
          const newTags = [...currentTags, ...validTags].slice(0, 5); // Max 5 tags

          await supabase
            .from('bags')
            .update({ tags: newTags })
            .eq('id', bagId);

          console.log(`✅ Generated tags: ${validTags.join(', ')}`);
        }
      } catch (error) {
        console.error('Failed to generate tags:', error);
      }
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bagId);

    console.log(`
✅ Fill Info Complete:
   - Processed: ${items.length} items
   - Details enriched: ${detailsEnriched}
   - Links added: ${linksAdded}
   - Tags generated: ${tagsGenerated.length > 0 ? tagsGenerated.join(', ') : 'none'}
    `);

    return NextResponse.json({
      processed: items.length,
      detailsEnriched,
      linksAdded,
      tagsGenerated,
      items: results,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/fill-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
