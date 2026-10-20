import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { classifyUrl } from '@/lib/links/classifyUrl';
import { readProductPage, applyPageFactsToItem, isProductLinkKind } from '@/lib/items/enrichFromLink';

// Reading a product page can take a few seconds (fetch, Firecrawl fallback, AI pass)
export const maxDuration = 30;

/**
 * POST /api/items/[id]/links
 * Add a link to an item
 *
 * Body:
 * {
 *   url: string (required)
 *   kind: string (required) - e.g., 'purchase', 'review', 'video', 'other'
 *   label?: string
 *   metadata?: object - scraped data (title, image, price, etc.)
 * }
 *
 * Returns: Created link object
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the item and verify ownership through bag
    // NOTE: Must specify FK relationship explicitly due to bags.hero_item_id creating a second FK
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags:bags!bag_items_bag_id_fkey(owner_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // @ts-ignore - bags is an object in single select with join
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { url, kind, label, metadata } = body;

    // Validate required fields
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { error: 'url is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!kind || typeof kind !== 'string' || kind.trim().length === 0) {
      return NextResponse.json(
        { error: 'kind is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'url must be a valid URL' },
        { status: 400 }
      );
    }

    // Enrich links with scraped data
    let enrichedMetadata = metadata || null;
    let enrichedLabel = label?.trim() || null;

    // Use Link Intelligence to detect embed URLs (YouTube, TikTok, Instagram, Spotify, etc.)
    const classification = classifyUrl(url);
    const isEmbedUrl = classification.type === 'embed';

    // For video links OR detected embed URLs, scrape to get thumbnail and title
    const shouldProcessAsVideo = kind === 'video' || isEmbedUrl;

    if (shouldProcessAsVideo) {
      try {
        console.log(`[Link Add] Scraping video URL: ${url}`);

        const scrapeResponse = await fetch(
          `${request.nextUrl.origin}/api/scrape-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() }),
          }
        );

        if (scrapeResponse.ok) {
          const scraped = await scrapeResponse.json();

          // Store video metadata
          enrichedMetadata = {
            ...enrichedMetadata,
            title: scraped.title,
            description: scraped.description,
            thumbnail: scraped.image,
            videoType: scraped.videoType,
            videoId: scraped.videoId,
            channel: scraped.brand,
          };

          // Use video title as label if not provided
          if (!enrichedLabel && scraped.title) {
            enrichedLabel = scraped.title;
          }

          console.log(`[Link Add] Video scraped: ${scraped.videoType || 'unknown'} - ${scraped.title}`);

          // If item has no photo and we have a thumbnail, set it as the item's photo
          if (scraped.image) {
            const { data: currentItem } = await supabase
              .from('bag_items')
              .select('photo_url')
              .eq('id', itemId)
              .single();

            if (currentItem && !currentItem.photo_url) {
              await supabase
                .from('bag_items')
                .update({ photo_url: scraped.image })
                .eq('id', itemId);

              // Store that we updated the photo so frontend can refresh
              enrichedMetadata = {
                ...enrichedMetadata,
                item_photo_updated: true,
                item_new_photo_url: scraped.image,
              };

              console.log(`[Link Add] Auto-set item photo from video thumbnail`);
            }
          }
        } else {
          console.warn('[Link Add] Video scraping failed, continuing without enrichment');
        }
      } catch (error) {
        console.error('[Link Add] Video scraping error:', error);
        // Continue without enrichment - don't fail the link creation
      }
    }

    // A product link does the work on its own: read the page (Amazon lookup, JSON-LD, og
    // tags, Firecrawl, AI) and fill the item's empty photo, brand, category and list price.
    // The old path called a GPT page-reader that Amazon blocks and never set a photo.
    if (!isEmbedUrl && isProductLinkKind(kind)) {
      try {
        console.log(`[Link Add] Reading product page: ${url}`);
        const facts = await readProductPage(url.trim());
        if (facts) {
          const { data: currentItem } = await supabase
            .from('bag_items')
            .select('id, brand, category, photo_url, custom_photo_id, specs')
            .eq('id', itemId)
            .single();

          const applied = currentItem
            ? await applyPageFactsToItem(supabase, user.id, currentItem, facts)
            : { updates: {}, filled: [] };

          enrichedMetadata = {
            ...enrichedMetadata,
            product: {
              name: facts.name,
              brand: facts.brand,
              price: facts.price,
              image: facts.imageUrl,
              specifications: facts.specifications.slice(0, 20),
              confidence: facts.confidence,
              source: facts.source,
              read_at: new Date().toISOString(),
            },
            // What the editor should merge into its copy of the item, and the words to show
            item_updates: applied.updates,
            item_filled: applied.filled,
            ...(typeof applied.updates.photo_url === 'string'
              ? { item_photo_updated: true, item_new_photo_url: applied.updates.photo_url }
              : {}),
          };
          console.log(`[Link Add] Page read from ${facts.domain}: filled ${applied.filled.join(', ') || 'nothing'}`);
        } else {
          console.warn('[Link Add] Nothing usable on the product page, link saved without enrichment');
        }
      } catch (error) {
        console.error('[Link Add] Product page enrichment error:', error);
        // Continue without enrichment - don't fail the link creation
      }
    }

    // Create the link
    const { data: link, error: createError } = await supabase
      .from('links')
      .insert({
        bag_item_id: itemId,
        url: url.trim(),
        kind: kind.trim(),
        label: enrichedLabel,
        metadata: enrichedMetadata,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating link:', createError);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', item.bag_id);

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/items/[id]/links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
