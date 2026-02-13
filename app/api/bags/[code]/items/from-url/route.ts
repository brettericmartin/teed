import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { inferItemType } from '@/lib/itemTypes/inference';
import { classifyUrl } from '@/lib/links/classifyUrl';
import { fetchOEmbed } from '@/lib/linkIntelligence';
import { identifyProduct } from '@/lib/linkIdentification';

export const maxDuration = 30;

/**
 * POST /api/bags/[code]/items/from-url
 * Add a new item to a bag by processing a product URL
 *
 * Body:
 * {
 *   url: string (required) - The product URL to process
 * }
 *
 * Returns: Created item object with extracted product details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag and verify ownership (include context for item type inference)
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, title, category, tags')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get the highest sort_index for this bag
    const { data: maxSortItem } = await supabase
      .from('bag_items')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    const nextSortIndex = (maxSortItem?.sort_index ?? -1) + 1;

    // Process the URL to extract product information
    let productInfo: {
      name?: string;
      description?: string;
      brand?: string;
      imageUrl?: string;
      price?: string;
    } = {};

    // Check if this is an embed URL (YouTube, TikTok, etc.) — use oEmbed instead of AI
    const classification = classifyUrl(url);

    if (classification.type === 'embed') {
      // Use oEmbed to get channel name, video title, and thumbnail
      const oembed = await fetchOEmbed(url);
      if (oembed) {
        productInfo = {
          name: oembed.title,
          brand: oembed.authorName,
          imageUrl: oembed.thumbnailUrl,
        };
      } else {
        // oEmbed failed — use basic info from embed data
        productInfo = {
          name: `${classification.platform} video`,
          brand: classification.platform,
        };
      }
    } else {
      // Product URL — use the link identification pipeline directly
      try {
        const identification = await identifyProduct(url, {
          fetchTimeout: 8000,
          earlyExitConfidence: 0.85,
        });

        productInfo = {
          name: identification.fullName || identification.productName,
          brand: identification.brand || undefined,
          imageUrl: identification.imageUrl || undefined,
          price: identification.price || undefined,
        };
      } catch (error) {
        console.error('[from-url] identifyProduct error:', error);
        // Fallback to basic info from URL
        const domain = parsedUrl.hostname.replace('www.', '');
        productInfo = {
          name: `Product from ${domain}`,
          brand: domain.split('.')[0],
        };
      }
    }

    // Infer item type from URL, product info, and bag context
    const inferredType = inferItemType({
      url,
      productName: productInfo.name,
      brand: productInfo.brand,
      bagTitle: bag.title,
      bagCategory: bag.category,
      bagTags: bag.tags,
    });

    // Create the item with inferred type
    const { data: newItem, error: insertError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: productInfo.name || 'New Item',
        custom_description: productInfo.description || null,
        brand: productInfo.brand || null,
        photo_url: productInfo.imageUrl || null,
        sort_index: nextSortIndex,
        quantity: 1,
        item_type: inferredType,
      })
      .select()
      .single();

    if (insertError || !newItem) {
      console.error('Error creating item:', insertError);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      );
    }

    // Add the link to the item
    const isEmbed = classification.type === 'embed';
    const { error: linkError } = await supabase
      .from('links')
      .insert({
        bag_item_id: newItem.id,
        url: url,
        kind: isEmbed ? 'video' : 'purchase',
        label: parsedUrl.hostname.replace('www.', ''),
        metadata: productInfo.price ? { price: productInfo.price } : null,
      });

    if (linkError) {
      console.error('Error creating link:', linkError);
      // Don't fail the request, item was created
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/bags/[code]/items/from-url:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
