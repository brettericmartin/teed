/**
 * Draft Bag Assembler
 * Creates a bag, sections, items, and links in Supabase
 * from a reviewed draft bag.
 */

import { createClient } from '@supabase/supabase-js';
import type { AssembleBagInput, AssembleBagResult } from './types';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Generate a unique bag code from a title.
 */
async function generateUniqueCode(
  supabase: ReturnType<typeof getServiceClient>,
  title: string,
): Promise<string> {
  let baseCode = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  if (!baseCode) baseCode = 'video-bag';

  let code = baseCode;
  let suffix = 2;

  while (suffix < 100) {
    const { data } = await supabase
      .from('bags')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (!data) return code;

    code = `${baseCode}-${suffix}`;
    suffix++;
  }

  // Fallback with timestamp
  return `${baseCode}-${Date.now()}`;
}

/**
 * Assemble and save a draft bag to Supabase.
 * Creates: bag → sections → items → links (+ source video link on bag)
 */
export async function assembleBag(input: AssembleBagInput): Promise<AssembleBagResult> {
  const supabase = getServiceClient();
  const { draftBag, selectedProductIds, editedProducts, bagTitle, bagDescription, ownerId } = input;

  // Filter to selected products only
  const selectedProducts = draftBag.products.filter(p => selectedProductIds.includes(p.id));
  if (selectedProducts.length === 0) {
    throw new Error('No products selected');
  }

  // 1. Create the bag
  const code = await generateUniqueCode(supabase, bagTitle);

  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      title: bagTitle,
      description: bagDescription || draftBag.description,
      code,
      owner_id: ownerId,
      is_public: true,
      tags: draftBag.tags,
    })
    .select('id, code')
    .single();

  if (bagError || !bag) {
    throw new Error(`Failed to create bag: ${bagError?.message || 'Unknown error'}`);
  }

  // 2. Add the source video as the first bag item
  let linkCount = 0;
  const videoTitle = draftBag.videoMetadata.title;
  const videoChannel = draftBag.videoMetadata.channelName;
  const videoLabel = videoChannel ? `${videoTitle} by ${videoChannel}` : videoTitle;

  const { data: videoItem, error: videoItemError } = await supabase
    .from('bag_items')
    .insert({
      bag_id: bag.id,
      custom_name: videoLabel,
      brand: videoChannel || null,
      custom_description: `Source video for this bag`,
      photo_url: draftBag.videoMetadata.thumbnailUrl || null,
      sort_index: 0,
      item_type: 'video',
      specs: {
        pipeline_source: { videoUrl: draftBag.sourceVideoUrl, sources: ['video'] },
        platform: draftBag.videoMetadata.platform,
      },
    })
    .select('id')
    .single();

  if (videoItem) {
    // Add the video URL as a link on the video item
    const { error: videoLinkError } = await supabase.from('links').insert({
      bag_item_id: videoItem.id,
      url: draftBag.sourceVideoUrl,
      kind: 'source',
      label: `Watch: ${videoTitle}`,
      is_auto_generated: true,
      metadata: {
        source: 'video_pipeline',
        video_title: videoTitle,
        channel_name: videoChannel,
        platform: draftBag.videoMetadata.platform,
      },
    });
    if (!videoLinkError) linkCount++;
  } else if (videoItemError) {
    console.error('[Assembler] Failed to create video item:', videoItemError);
  }

  // 3. Create product items (sort_index starts at 1 since video is 0)
  for (let i = 0; i < selectedProducts.length; i++) {
    const product = selectedProducts[i];
    const edits = editedProducts[product.id] || {};

    const productName = edits.name || product.name;
    const productBrand = edits.brand || product.brand;
    const productImage = edits.imageUrl || product.productImageUrl || product.videoFrameUrl;

    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: productName,
        brand: productBrand || null,
        custom_description: product.description || null,
        photo_url: productImage || null,
        sort_index: i + 1,
        item_type: 'physical_product',
        specs: {
          pipeline_source: product.pipelineMetadata,
          video_frame_url: product.videoFrameUrl || null,
        },
      })
      .select('id')
      .single();

    if (itemError || !item) {
      console.error(`[Assembler] Failed to create item "${productName}":`, itemError);
      continue;
    }

    // 4. Create links for this item
    for (const link of product.purchaseLinks) {
      const { error: linkError } = await supabase.from('links').insert({
        bag_item_id: item.id,
        url: link.url,
        kind: 'product',
        label: link.label || `${productBrand} ${productName}`.trim(),
        is_auto_generated: true,
        metadata: {
          source: 'video_pipeline',
          is_affiliate: link.isAffiliate,
          domain: link.domain,
        },
      });

      if (!linkError) linkCount++;
    }
  }

  // 5. Update bag updated_at
  await supabase
    .from('bags')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', bag.id);

  return {
    bagId: bag.id,
    bagCode: bag.code,
    itemCount: selectedProducts.length + (videoItem ? 1 : 0),
    linkCount,
  };
}
