import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

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

    // Enrich product links with AI analysis
    let enrichedMetadata = metadata || null;
    let enrichedLabel = label?.trim() || null;

    if (kind === 'product') {
      try {
        console.log(`[Link Add] Analyzing product URL: ${url}`);

        const analyzeResponse = await fetch(
          `${request.nextUrl.origin}/api/ai/analyze-product-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() }),
          }
        );

        if (analyzeResponse.ok) {
          const analysis = await analyzeResponse.json();

          // Store AI analysis in metadata
          enrichedMetadata = {
            ...enrichedMetadata,
            ai_analysis: {
              brand: analysis.brand,
              productName: analysis.productName,
              category: analysis.category,
              specs: analysis.specs,
              price: analysis.price,
              color: analysis.color,
              confidence: analysis.confidence,
              analyzed_at: analysis.extracted_at,
            },
          };

          // Use AI-extracted product name as label if not provided
          if (!enrichedLabel && analysis.productName) {
            enrichedLabel = analysis.brand && analysis.productName
              ? `${analysis.brand} ${analysis.productName}`
              : analysis.productName;
          }

          console.log(`[Link Add] AI analysis complete (confidence: ${analysis.confidence})`);

          // If the item is missing brand/category, update it with AI findings
          if (analysis.confidence >= 0.7) {
            const { data: currentItem } = await supabase
              .from('bag_items')
              .select('brand, category, custom_name')
              .eq('id', itemId)
              .single();

            const updates: any = {};
            if (!currentItem?.brand && analysis.brand) {
              updates.brand = analysis.brand;
            }
            if (!currentItem?.category && analysis.category) {
              updates.category = analysis.category;
            }

            if (Object.keys(updates).length > 0) {
              await supabase
                .from('bag_items')
                .update(updates)
                .eq('id', itemId);

              console.log(`[Link Add] Updated item with AI data:`, updates);
            }
          }
        } else {
          console.warn('[Link Add] AI analysis failed, continuing without enrichment');
        }
      } catch (error) {
        console.error('[Link Add] AI enrichment error:', error);
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
