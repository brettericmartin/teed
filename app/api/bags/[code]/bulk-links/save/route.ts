import { validateExternalUrl } from '@/lib/urlValidation';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';

export const maxDuration = 60; // Extended timeout for batch operations

// ============================================================
// TYPES
// ============================================================

interface LinkSelection {
  resultIndex: number;
  item: {
    custom_name: string;
    brand: string;
    custom_description: string;
    notes?: string;
  };
  selectedPhotoUrl: string;
  purchaseUrl: string;
}

interface CreatedItem {
  index: number;
  itemId: string;
  linkId?: string;
  photoUploaded: boolean;
}

interface SaveFailure {
  index: number;
  error: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const PHOTO_CONCURRENCY = 4;

async function downloadImage(imageUrl: string): Promise<Blob | null> {
  try {
    // Detect which site we're fetching from
    const isAmazonUrl = imageUrl.includes('amazon') ||
      imageUrl.includes('media-amazon.com') ||
      imageUrl.includes('amazon-adsystem.com');
    const isRetailerUrl = imageUrl.includes('rei.com') ||
      imageUrl.includes('target.com') ||
      imageUrl.includes('walmart.com');

    // Use browser-like headers for sites that block bots
    const userAgent = (isAmazonUrl || isRetailerUrl)
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (compatible; TeedBot/1.0)';

    // Follow redirects by hand so every hop passes the same address check,
    // and give up after 10 seconds so one slow site can't stall the save.
    const signal = AbortSignal.timeout(10_000);
    let currentUrl = imageUrl;
    let response: Response | null = null;
    for (let hop = 0; hop <= 5; hop++) {
      const urlError = validateExternalUrl(currentUrl);
      if (urlError) throw new Error(`Blocked image URL: ${urlError}`);
      const res = await fetch(currentUrl, {
        redirect: 'manual',
        signal,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': isAmazonUrl ? 'https://www.amazon.com/' :
                     isRetailerUrl ? `https://${new URL(imageUrl).hostname}/` : '',
        },
      });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (!location) {
        response = res;
        break;
      }
      currentUrl = new URL(location, currentUrl).toString();
    }
    if (!response) {
      throw new Error('Too many redirects');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large (${declaredSize} bytes)`);
    }

    // Verify we got actual image data (not a tiny blocked response)
    const blob = await response.blob();
    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large (${blob.size} bytes)`);
    }
    if (blob.size < 100) {
      throw new Error(`Image too small (${blob.size} bytes) - likely blocked`);
    }

    const contentType = response.headers.get('content-type') || blob.type;
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`);
    }

    return blob;
  } catch (error) {
    console.error(`[bulk-links/save] Failed to download image from ${imageUrl}:`, error);
    return null;
  }
}

async function attachPhoto(
  supabase: any,
  userId: string,
  itemId: string,
  selection: LinkSelection
): Promise<boolean> {
  try {
    const imageBlob = await downloadImage(selection.selectedPhotoUrl as string);
    if (!imageBlob) return false;

    // Determine file extension from content type
    const contentType = imageBlob.type;
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    const file = new File([imageBlob], `product.${ext}`, { type: contentType });
    const uploadResult = await uploadItemPhoto(file, userId, itemId);
    if (!uploadResult) return false;

    const mediaAssetId = await createMediaAsset(uploadResult.url, userId, {
      alt: selection.item.custom_name,
    });
    if (!mediaAssetId) return false;

    await supabase
      .from('bag_items')
      .update({ custom_photo_id: mediaAssetId, photo_url: uploadResult.url })
      .eq('id', itemId);
    return true;
  } catch (photoError) {
    console.error(`[bulk-links/save] Photo upload failed for item ${itemId}:`, photoError);
    return false;
  }
}

// ============================================================
// MAIN ENDPOINT
// ============================================================

/**
 * POST /api/bags/[code]/bulk-links/save
 * Save user-selected items from bulk link processing
 *
 * Body: { selections: LinkSelection[] }
 * Returns: { createdItems: CreatedItem[], failures: SaveFailure[] }
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

    // Get the bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .eq('owner_id', user.id)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { selections } = body;

    if (!Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json(
        { error: 'selections must be a non-empty array' },
        { status: 400 }
      );
    }

    console.log(`[bulk-links/save] Saving ${selections.length} items to bag ${code}`);

    // Get the current max sort_index for this bag
    const { data: maxItem } = await supabase
      .from('bag_items')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    let nextSortIndex = maxItem ? maxItem.sort_index + 1 : 1;

    const createdItems: CreatedItem[] = [];
    const failures: SaveFailure[] = [];
    const photoJobs: { createdIndex: number; itemId: string; selection: LinkSelection }[] = [];

    // Process each selection sequentially to maintain sort order
    for (const selection of selections as LinkSelection[]) {
      try {
        // Validate selection
        if (!selection.item?.custom_name) {
          throw new Error('Item name is required');
        }

        // Step 1: Create the item
        const { data: item, error: createError } = await supabase
          .from('bag_items')
          .insert({
            bag_id: bag.id,
            custom_name: selection.item.custom_name.trim(),
            custom_description: selection.item.custom_description?.trim() || null,
            brand: selection.item.brand?.trim() || null,
            notes: selection.item.notes?.trim() || null,
            sort_index: nextSortIndex++,
          })
          .select()
          .single();

        if (createError || !item) {
          throw new Error(`Failed to create item: ${createError?.message}`);
        }

        const photoUploaded = false;
        let linkId: string | undefined;

        // Step 3: Add purchase link if provided
        if (selection.purchaseUrl) {
          try {
            const { data: link, error: linkError } = await supabase
              .from('links')
              .insert({
                bag_item_id: item.id,
                url: selection.purchaseUrl,
                kind: 'purchase',
                label: null,
                is_auto_generated: false,
              })
              .select()
              .single();

            if (!linkError && link) {
              linkId = link.id;
            }
          } catch (linkError) {
            console.error(`[bulk-links/save] Link creation failed for item ${item.id}:`, linkError);
            // Continue without link - don't fail the entire item
          }
        }

        createdItems.push({
          index: selection.resultIndex,
          itemId: item.id,
          linkId,
          photoUploaded,
        });

        // Step 2: Queue the photo; photos are fetched in parallel after the loop
        // so a batch of slow image hosts can't run past the time limit.
        if (selection.selectedPhotoUrl) {
          photoJobs.push({ createdIndex: createdItems.length - 1, itemId: item.id, selection });
        }

        console.log(`[bulk-links/save] Created item ${item.id} (photo queued: ${!!selection.selectedPhotoUrl}, link: ${!!linkId})`);
      } catch (error) {
        console.error(`[bulk-links/save] Failed to save selection ${selection.resultIndex}:`, error);
        failures.push({
          index: selection.resultIndex,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Fetch and attach photos, a few at a time
    for (let i = 0; i < photoJobs.length; i += PHOTO_CONCURRENCY) {
      const batch = photoJobs.slice(i, i + PHOTO_CONCURRENCY);
      const results = await Promise.all(
        batch.map((job) => attachPhoto(supabase, user.id, job.itemId, job.selection))
      );
      batch.forEach((job, k) => {
        createdItems[job.createdIndex].photoUploaded = results[k];
      });
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    console.log(`[bulk-links/save] Completed: ${createdItems.length} created, ${failures.length} failed`);

    return NextResponse.json({
      createdItems,
      failures,
    });
  } catch (error) {
    console.error('[bulk-links/save] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
