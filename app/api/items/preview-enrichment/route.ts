import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { findBestProductLinks, detectProductAge } from '@/lib/services/SmartLinkFinder';
import { openai } from '@/lib/openaiClient';

/**
 * POST /api/items/preview-enrichment
 * Generates enrichment suggestions WITHOUT saving them
 * Returns preview data for user approval
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
    const { bagId } = body;

    if (!bagId) {
      return NextResponse.json({ error: 'bagId is required' }, { status: 400 });
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

    // Get all items
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, brand, custom_description, notes')
      .eq('bag_id', bagId);

    if (itemsError) {
      console.error('[preview-enrichment] Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    if (!items || items.length === 0) {
      console.log('[preview-enrichment] No items in bag');
      return NextResponse.json({ suggestions: [] });
    }

    // Get existing links
    const itemIds = items.map(item => item.id);
    const { data: existingLinks } = await supabase
      .from('links')
      .select('bag_item_id, is_auto_generated')
      .in('bag_item_id', itemIds);

    const itemsWithUserLinks = new Set(
      existingLinks?.filter(link => !link.is_auto_generated).map(link => link.bag_item_id) || []
    );

    const itemsWithAutoLinks = new Set(
      existingLinks?.filter(link => link.is_auto_generated).map(link => link.bag_item_id) || []
    );

    console.log(`[preview-enrichment] Processing ${items.length} items in parallel`);

    // Process all items in parallel for faster response
    const suggestionPromises = items.map(async (item) => {
      if (!item.custom_name) {
        console.log(`[preview-enrichment] Skipping item ${item.id} - no custom_name`);
        return null;
      }

      const suggestion: any = {
        itemId: item.id,
        itemName: item.custom_name,
        current: {
          brand: item.brand,
          description: item.custom_description,
          notes: item.notes,
          hasLink: itemsWithUserLinks.has(item.id) || itemsWithAutoLinks.has(item.id),
        },
        suggested: {},
      };

      // Always generate enrichment suggestions (even if item has data)
      try {
        const enrichResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a product enrichment assistant. Generate detailed product information.

Return ONLY valid JSON:
{
  "brand": "Brand Name",
  "custom_description": "Specs with | separator (e.g., 10.5° | Stiff | Graphite)",
  "notes": "Interesting 2-3 sentence fun fact with product differentiation"
}

Always provide ALL fields, even if some data already exists.`,
            },
            {
              role: 'user',
              content: `Product: "${item.custom_name}"
${item.brand ? `Current brand: ${item.brand}` : ''}
${item.custom_description ? `Current description: ${item.custom_description}` : ''}
${item.notes ? `Current notes: ${item.notes}` : ''}

Generate fresh, detailed information for all fields.`,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const enrichedData = JSON.parse(enrichResponse.choices[0]?.message?.content || '{}');

        // Always offer suggestions, user can choose to replace or not
        if (enrichedData.brand) {
          suggestion.suggested.brand = enrichedData.brand;
        }
        if (enrichedData.custom_description) {
          suggestion.suggested.description = enrichedData.custom_description;
        }
        if (enrichedData.notes) {
          suggestion.suggested.notes = enrichedData.notes;
        }
      } catch (error) {
        console.error(`Failed to enrich item ${item.id}:`, error);
      }

      // Always generate link suggestion (even if item has links)
      if (!itemsWithUserLinks.has(item.id)) {
        try {
          const brandToUse = suggestion.suggested.brand || item.brand;
          const ageDetection = detectProductAge(item.custom_name, brandToUse);

          const linkResult = await findBestProductLinks({
            name: item.custom_name,
            brand: brandToUse,
            isVintage: ageDetection.isVintage,
          });

          const recommendedLink = linkResult.primaryLink;

          suggestion.suggested.link = {
            url: recommendedLink.url,
            label: recommendedLink.label,
            source: recommendedLink.source,
            reason: linkResult.reasoning,
          };
        } catch (error) {
          console.error(`Failed to generate link for item ${item.id}:`, error);
        }
      }

      // Only add if we have suggestions
      const suggestedFieldsCount = Object.keys(suggestion.suggested).length;
      console.log(`[preview-enrichment] Item "${item.custom_name}": ${suggestedFieldsCount} suggested fields`);

      if (suggestedFieldsCount > 0) {
        return suggestion;
      }
      return null;
    });

    // Wait for all items to be processed
    const allSuggestions = await Promise.all(suggestionPromises);
    const suggestions = allSuggestions.filter(s => s !== null);

    console.log(`[preview-enrichment] Returning ${suggestions.length} suggestions`);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in preview-enrichment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
