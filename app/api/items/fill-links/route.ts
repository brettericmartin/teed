import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { findBestProductLinks, detectProductAge } from '@/lib/services/SmartLinkFinder';

/**
 * POST /api/items/fill-links
 * Auto-generate smart product links for items that don't have user-created links
 *
 * This endpoint:
 * 1. Uses AI to find the BEST place to buy each product (not just Amazon)
 * 2. Considers product type, age, category to recommend appropriate sources
 * 3. Passes through affiliate system when possible
 * 4. Prioritizes genuine recommendations over affiliate revenue
 *
 * Body:
 * {
 *   bagId: string (required) - Bag ID to process
 * }
 *
 * Returns:
 * {
 *   processed: number - Number of items processed
 *   linksAdded: number - Number of links created
 *   items: Array<{ itemId: string, linkAdded: boolean, reason?: string, source?: string }>
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
      .select('id, owner_id')
      .eq('id', bagId)
      .single();

    if (bagError || !bag || bag.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Bag not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all items in the bag with category info
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, brand, category')
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
    let linksAdded = 0;

    // Process each item
    for (const item of items) {
      // Skip if item already has a user-created link
      if (itemsWithUserLinks.has(item.id)) {
        results.push({
          itemId: item.id,
          linkAdded: false,
          reason: 'Item already has user-created links',
        });
        continue;
      }

      // Check if item already has an auto-generated link
      const hasAutoLink = existingLinks?.some(
        link => link.bag_item_id === item.id && link.is_auto_generated
      );

      if (hasAutoLink) {
        results.push({
          itemId: item.id,
          linkAdded: false,
          reason: 'Item already has auto-generated link',
        });
        continue;
      }

      if (!item.custom_name) {
        results.push({
          itemId: item.id,
          linkAdded: false,
          reason: 'No product name available',
        });
        continue;
      }

      // Detect if product is vintage/old
      const ageDetection = detectProductAge(item.custom_name, item.brand);

      // Use AI to find the best purchase sources
      let linkResult;
      try {
        linkResult = await findBestProductLinks({
          name: item.custom_name,
          brand: item.brand,
          category: item.category,
          isVintage: ageDetection.isVintage,
        });

        console.log(`Smart link for "${item.custom_name}":`, {
          source: linkResult.primaryLink.source,
          reason: linkResult.reasoning,
          isVintage: ageDetection.isVintage,
        });
      } catch (error) {
        console.error(`Failed to find smart links for item ${item.id}:`, error);
        // Fallback to basic search
        const searchQuery = item.brand
          ? `${item.brand} ${item.custom_name}`
          : item.custom_name;
        linkResult = {
          primaryLink: {
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`,
            source: 'google',
            label: 'Find on Google Shopping',
            reason: 'Fallback search',
            priority: 10,
            affiliatable: false,
          },
          recommendations: [],
          reasoning: 'Fallback due to error',
        };
      }

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
          // Use original recommended URL
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

      if (createError) {
        console.error(`Failed to create link for item ${item.id}:`, createError);
        results.push({
          itemId: item.id,
          linkAdded: false,
          reason: 'Failed to create link',
        });
        continue;
      }

      linksAdded++;
      results.push({
        itemId: item.id,
        linkAdded: true,
        source: recommendedLink.source,
      });
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bagId);

    return NextResponse.json({
      processed: items.length,
      linksAdded,
      items: results,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/fill-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
