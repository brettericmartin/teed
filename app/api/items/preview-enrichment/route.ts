import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { findBestProductLinks, detectProductAge } from '@/lib/services/SmartLinkFinder';
import { openai } from '@/lib/openaiClient';
import { generateBrandContext, loadCategoryKnowledge } from '@/lib/brandKnowledge';

type ClarificationQuestion = {
  id: string;
  question: string;
  options: string[];
  itemId: string;
};

/**
 * Detect likely categories from bag metadata and item names
 * Returns array of detected categories for brand knowledge loading
 */
function detectCategories(bagCategory?: string, bagTags?: any, itemNames?: string[]): string[] {
  const categories: string[] = [];
  const text = `${bagCategory || ''} ${JSON.stringify(bagTags || [])} ${(itemNames || []).join(' ')}`.toLowerCase();

  // Category detection patterns
  const categoryPatterns: Record<string, string[]> = {
    golf: ['golf', 'driver', 'iron', 'wedge', 'putter', 'taylormade', 'callaway', 'titleist', 'ping', 'cobra', 'mizuno'],
    makeup: ['makeup', 'beauty', 'cosmetic', 'lipstick', 'eyeshadow', 'foundation', 'mac', 'nars', 'fenty', 'dior'],
    tech: ['tech', 'electronics', 'phone', 'laptop', 'tablet', 'airpods', 'apple', 'samsung', 'sony'],
    fashion: ['fashion', 'clothing', 'shirt', 'pants', 'dress', 'jacket', 'nike', 'adidas', 'patagonia'],
    outdoor: ['outdoor', 'camping', 'hiking', 'tent', 'sleeping bag', 'backpack', 'arc\'teryx', 'rei'],
    photography: ['camera', 'lens', 'photography', 'photo', 'canon', 'nikon', 'sony'],
    gaming: ['gaming', 'game', 'console', 'controller', 'playstation', 'xbox', 'nintendo'],
    music: ['music', 'guitar', 'instrument', 'audio', 'speaker', 'fender', 'gibson'],
    fitness: ['fitness', 'gym', 'workout', 'exercise', 'crossfit', 'sports'],
    travel: ['travel', 'luggage', 'suitcase', 'bag'],
    edc: ['edc', 'knife', 'flashlight', 'wallet', 'everyday carry'],
  };

  // Check each category's patterns
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * POST /api/items/preview-enrichment
 * Generates enrichment suggestions WITHOUT saving them
 * Returns preview data for user approval
 * Now includes clarification questions for low-confidence items
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
    const { bagId, clarificationAnswers, itemIds: selectedItemIds } = body; // Accept answers and optional item filter

    if (!bagId) {
      return NextResponse.json({ error: 'bagId is required' }, { status: 400 });
    }

    // Verify bag ownership and get category/tags for brand knowledge
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, category, tags')
      .eq('id', bagId)
      .single();

    if (bagError || !bag || bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Bag not found or unauthorized' }, { status: 404 });
    }

    // Get items (filtered by itemIds if provided)
    let itemsQuery = supabase
      .from('bag_items')
      .select('id, custom_name, brand, custom_description, notes')
      .eq('bag_id', bagId);

    // Filter to specific items if selectedItemIds provided
    if (selectedItemIds && Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
      itemsQuery = itemsQuery.in('id', selectedItemIds);
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      console.error('[preview-enrichment] Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    if (!items || items.length === 0) {
      console.log('[preview-enrichment] No items to process');
      return NextResponse.json({ suggestions: [] });
    }

    // Detect categories and load brand knowledge
    const itemNames = items.map(item => `${item.brand || ''} ${item.custom_name || ''}`).filter(Boolean);
    const detectedCategories = detectCategories(bag.category, bag.tags, itemNames);

    let brandContext = '';
    if (detectedCategories.length > 0) {
      brandContext = generateBrandContext(detectedCategories, 'standard');
      console.log(`[preview-enrichment] Loaded brand knowledge for: ${detectedCategories.join(', ')}`);
    } else {
      console.log('[preview-enrichment] No specific categories detected, proceeding without brand knowledge');
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

      // Check if we have answers for this item from previous clarification
      const itemAnswers = clarificationAnswers?.[item.id] || {};
      const hasAnswers = Object.keys(itemAnswers).length > 0;

      // Always generate enrichment suggestions (even if item has data)
      try {
        const enrichResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a product enrichment assistant. Generate detailed product information.
${brandContext}
${brandContext ? `
IMPORTANT: Use the Brand Knowledge Base above to:
- Recognize brand-specific terminology and colorway names
- Identify specific model names and variations
- Use correct color terms (e.g., "Qi10 Blue" instead of just "blue")
- Provide accurate product details based on brand signature features
- Match visual cues and design elements to specific brands

` : ''}
Return ONLY valid JSON:
{
  "brand": "Brand Name",
  "custom_description": "Specs with | separator (e.g., 10.5° | Stiff | Graphite)",
  "notes": "Interesting 2-3 sentence fun fact with product differentiation",
  "confidence": 0.85,
  "clarificationNeeded": false,
  "questions": []
}

Confidence scoring:
- 0.9+: Very confident in the identification
- 0.7-0.89: Moderately confident, might benefit from clarification
- <0.7: Low confidence, definitely need clarification

If confidence < 0.85 and no user answers provided, include 1-2 clarification questions with visual-friendly options.
Question format: { "id": "type", "question": "What type is this?", "options": ["Option A", "Option B", "Option C", "Other"] }

Always provide ALL fields, even if some data already exists.`,
            },
            {
              role: 'user',
              content: `Product: "${item.custom_name}"
${item.brand ? `Current brand: ${item.brand}` : ''}
${item.custom_description ? `Current description: ${item.custom_description}` : ''}
${item.notes ? `Current notes: ${item.notes}` : ''}
${hasAnswers ? `User provided answers: ${JSON.stringify(itemAnswers)}` : ''}

Generate fresh, detailed information for all fields.${hasAnswers ? ' Use the user answers to improve accuracy.' : ''}`,
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

        // Track confidence and questions
        suggestion.confidence = enrichedData.confidence || 0.9;

        // Only include questions if no answers were provided and confidence is low
        if (!hasAnswers && enrichedData.clarificationNeeded && enrichedData.questions?.length > 0) {
          suggestion.clarificationNeeded = true;
          suggestion.questions = enrichedData.questions.map((q: any) => ({
            ...q,
            itemId: item.id,
          }));
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

    // Collect all clarification questions
    const allQuestions: ClarificationQuestion[] = suggestions
      .filter(s => s.clarificationNeeded && s.questions?.length > 0)
      .flatMap(s => s.questions);

    // Check if any items need clarification
    const needsClarification = allQuestions.length > 0;

    console.log(`[preview-enrichment] Returning ${suggestions.length} suggestions, ${allQuestions.length} questions`);
    return NextResponse.json({
      suggestions,
      needsClarification,
      questions: allQuestions,
    });
  } catch (error) {
    console.error('Error in preview-enrichment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
