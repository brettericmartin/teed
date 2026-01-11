import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';
import type { UniversalLinkSaveRequest, UniversalLinkSaveResponse } from '@/lib/types/universalLink';
import { generateUniqueBagCode } from '@/lib/bagCodeGenerator';

export const maxDuration = 120; // Extended timeout for batch operations

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function downloadImage(imageUrl: string): Promise<Blob | null> {
  try {
    const isAmazonUrl = imageUrl.includes('amazon') ||
      imageUrl.includes('media-amazon.com') ||
      imageUrl.includes('amazon-adsystem.com');
    const isRetailerUrl = imageUrl.includes('rei.com') ||
      imageUrl.includes('target.com') ||
      imageUrl.includes('walmart.com');

    const userAgent = (isAmazonUrl || isRetailerUrl)
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (compatible; TeedBot/1.0)';

    const response = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': isAmazonUrl ? 'https://www.amazon.com/' :
                   isRetailerUrl ? `https://${new URL(imageUrl).hostname}/` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size < 100) {
      throw new Error(`Image too small (${blob.size} bytes) - likely blocked`);
    }

    const contentType = response.headers.get('content-type') || blob.type;
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`);
    }

    return blob;
  } catch (error) {
    console.error(`[universal-links/save] Failed to download image from ${imageUrl}:`, error);
    return null;
  }
}

// ============================================================
// MAIN ENDPOINT
// ============================================================

/**
 * POST /api/universal-links/save
 *
 * Save all types of links in a single atomic operation:
 * - Embeds: Add as profile blocks
 * - Social: Merge into profile.social_links
 * - Products: Add to specified bag
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: UniversalLinkSaveRequest = await request.json();
    const { profileId, embeds, socialLinks, products } = body;

    // Verify profile ownership
    if (profileId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const response: UniversalLinkSaveResponse = {
      success: true,
      embedsAdded: 0,
      socialLinksAdded: 0,
      productsAdded: 0,
      errors: [],
    };

    // =====================================================
    // 1. SAVE EMBEDS AS PROFILE BLOCKS
    // =====================================================
    if (embeds && embeds.length > 0) {
      console.log(`[universal-links/save] Adding ${embeds.length} embeds`);

      // Get current max sort_order for blocks
      const { data: maxOrderResult } = await supabase
        .from('profile_blocks')
        .select('sort_order')
        .eq('profile_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      let nextSortOrder = (maxOrderResult?.sort_order ?? -1) + 1;

      for (const embed of embeds) {
        try {
          const { error: insertError } = await supabase
            .from('profile_blocks')
            .insert({
              profile_id: user.id,
              block_type: 'embed',
              sort_order: nextSortOrder++,
              is_visible: true,
              width: 'full',
              config: {
                url: embed.url,
                platform: embed.platform,
                title: embed.title || null,
              },
            });

          if (insertError) {
            throw insertError;
          }

          response.embedsAdded++;
        } catch (error) {
          console.error(`[universal-links/save] Failed to add embed:`, error);
          response.errors.push(`Failed to add embed: ${embed.url}`);
        }
      }

      // Enable blocks on profile
      await supabase
        .from('profiles')
        .update({ blocks_enabled: true })
        .eq('id', user.id);
    }

    // =====================================================
    // 2. SAVE SOCIAL LINKS TO PROFILE
    // =====================================================
    if (socialLinks && Object.keys(socialLinks).length > 0) {
      console.log(`[universal-links/save] Adding ${Object.keys(socialLinks).length} social links`);

      try {
        // Get current profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('social_links')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Merge with existing social links (new ones override)
        const mergedLinks = {
          ...(profile?.social_links || {}),
          ...socialLinks,
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ social_links: mergedLinks })
          .eq('id', user.id);

        if (updateError) throw updateError;

        response.socialLinksAdded = Object.keys(socialLinks).length;
      } catch (error) {
        console.error(`[universal-links/save] Failed to update social links:`, error);
        response.errors.push('Failed to update social links');
      }
    }

    // =====================================================
    // 3. SAVE PRODUCTS TO BAG
    // =====================================================
    if (products && products.selections.length > 0) {
      console.log(`[universal-links/save] Adding ${products.selections.length} products`);

      let bagId: string;
      let bagCode = products.bagCode;

      // Create new bag if needed
      if (bagCode === 'new') {
        try {
          // Generate unique code
          const newCode = await generateUniqueBagCode(supabase);
          const title = products.newBagTitle?.trim() || 'My Collection';

          const { data: newBag, error: bagError } = await supabase
            .from('bags')
            .insert({
              code: newCode,
              owner_id: user.id,
              title,
              description: null,
              visibility: 'public',
            })
            .select()
            .single();

          if (bagError || !newBag) {
            throw bagError || new Error('Failed to create bag');
          }

          bagId = newBag.id;
          bagCode = newCode;
          response.newBagCode = newCode;

          console.log(`[universal-links/save] Created new bag: ${newCode}`);
        } catch (error) {
          console.error(`[universal-links/save] Failed to create bag:`, error);
          response.errors.push('Failed to create new bag');
          return NextResponse.json(response);
        }
      } else {
        // Get existing bag
        const { data: bag, error: bagError } = await supabase
          .from('bags')
          .select('id, owner_id')
          .eq('code', bagCode)
          .single();

        if (bagError || !bag) {
          response.errors.push('Bag not found');
          return NextResponse.json(response);
        }

        if (bag.owner_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        bagId = bag.id;
      }

      // Get current max sort_index
      const { data: maxItem } = await supabase
        .from('bag_items')
        .select('sort_index')
        .eq('bag_id', bagId)
        .order('sort_index', { ascending: false })
        .limit(1)
        .single();

      let nextSortIndex = maxItem ? maxItem.sort_index + 1 : 1;

      // Add each product
      for (const selection of products.selections) {
        try {
          // Create the item
          const { data: item, error: itemError } = await supabase
            .from('bag_items')
            .insert({
              bag_id: bagId,
              custom_name: selection.item.custom_name.trim(),
              custom_description: selection.item.custom_description?.trim() || null,
              brand: selection.item.brand?.trim() || null,
              sort_index: nextSortIndex++,
            })
            .select()
            .single();

          if (itemError || !item) {
            throw itemError || new Error('Failed to create item');
          }

          // Upload photo if provided
          if (selection.selectedPhotoUrl) {
            try {
              const imageBlob = await downloadImage(selection.selectedPhotoUrl);

              if (imageBlob) {
                const contentType = imageBlob.type;
                let ext = 'jpg';
                if (contentType.includes('png')) ext = 'png';
                else if (contentType.includes('webp')) ext = 'webp';
                else if (contentType.includes('gif')) ext = 'gif';

                const file = new File([imageBlob], `product.${ext}`, { type: contentType });
                const uploadResult = await uploadItemPhoto(file, user.id, item.id);

                if (uploadResult) {
                  const mediaAssetId = await createMediaAsset(
                    uploadResult.url,
                    user.id,
                    { alt: selection.item.custom_name }
                  );

                  if (mediaAssetId) {
                    await supabase
                      .from('bag_items')
                      .update({
                        custom_photo_id: mediaAssetId,
                        photo_url: uploadResult.url,
                      })
                      .eq('id', item.id);
                  }
                }
              }
            } catch (photoError) {
              console.error(`[universal-links/save] Photo upload failed:`, photoError);
              // Continue without photo
            }
          }

          // Add purchase link if provided
          if (selection.purchaseUrl) {
            try {
              await supabase
                .from('links')
                .insert({
                  bag_item_id: item.id,
                  url: selection.purchaseUrl,
                  kind: 'purchase',
                  label: null,
                  is_auto_generated: false,
                });
            } catch (linkError) {
              console.error(`[universal-links/save] Link creation failed:`, linkError);
              // Continue without link
            }
          }

          response.productsAdded++;
        } catch (error) {
          console.error(`[universal-links/save] Failed to add product:`, error);
          response.errors.push(`Failed to add product: ${selection.item.custom_name}`);
        }
      }

      // Update bag timestamp
      await supabase
        .from('bags')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', bagId);
    }

    // Set overall success based on errors
    response.success = response.errors.length === 0;

    console.log(`[universal-links/save] Complete: ${response.embedsAdded} embeds, ${response.socialLinksAdded} social, ${response.productsAdded} products`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[universal-links/save] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
