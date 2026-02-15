import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';

export const maxDuration = 60; // Extended timeout for batch operations

// ============================================================
// TYPES
// ============================================================

interface TextSelection {
  item: {
    custom_name: string;
    brand: string;
    custom_description: string;
  };
  selectedPhotoUrl: string;
  purchaseUrl?: string;
  purchaseLabel?: string;
}

interface CreatedItem {
  index: number;
  itemId: string;
  photoUploaded: boolean;
}

interface SaveFailure {
  index: number;
  error: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function downloadImage(imageUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Verify we got actual image data (not a tiny blocked response)
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
    console.error(`[bulk-text/save] Failed to download image from ${imageUrl}:`, error);
    return null;
  }
}

// ============================================================
// MAIN ENDPOINT
// ============================================================

/**
 * POST /api/bags/[code]/bulk-text/save
 * Save user-selected items from bulk text processing
 *
 * Body: { selections: TextSelection[] }
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

    console.log(`[bulk-text/save] Saving ${selections.length} items to bag ${code}`);

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

    // Process each selection sequentially to maintain sort order
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i] as TextSelection;

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
            sort_index: nextSortIndex++,
          })
          .select()
          .single();

        if (createError || !item) {
          throw new Error(`Failed to create item: ${createError?.message}`);
        }

        let photoUploaded = false;

        // Step 2: Upload photo if provided
        if (selection.selectedPhotoUrl) {
          try {
            const imageBlob = await downloadImage(selection.selectedPhotoUrl);

            if (imageBlob) {
              // Determine file extension from content type
              const contentType = imageBlob.type;
              let ext = 'jpg';
              if (contentType.includes('png')) ext = 'png';
              else if (contentType.includes('webp')) ext = 'webp';
              else if (contentType.includes('gif')) ext = 'gif';

              // Create a File object from the blob
              const file = new File([imageBlob], `product.${ext}`, { type: contentType });

              // Upload to Supabase storage (file, userId, itemId)
              const uploadResult = await uploadItemPhoto(file, user.id, item.id);

              if (uploadResult) {
                // Create media asset record (url, ownerId, metadata)
                const mediaAssetId = await createMediaAsset(
                  uploadResult.url,
                  user.id,
                  { alt: selection.item.custom_name }
                );

                if (mediaAssetId) {
                  // Update item with photo
                  await supabase
                    .from('bag_items')
                    .update({
                      custom_photo_id: mediaAssetId,
                      photo_url: uploadResult.url,
                    })
                    .eq('id', item.id);

                  photoUploaded = true;
                }
              }
            }
          } catch (photoError) {
            console.error(`[bulk-text/save] Photo upload failed for item ${item.id}:`, photoError);
            // Continue without photo - don't fail the entire item
          }
        }

        // Step 3: Add purchase link if provided
        let linkAdded = false;
        if (selection.purchaseUrl) {
          try {
            await supabase
              .from('links')
              .insert({
                bag_item_id: item.id,
                url: selection.purchaseUrl,
                kind: 'purchase',
                label: selection.purchaseLabel || undefined,
                is_auto_generated: true,
              });
            linkAdded = true;
          } catch (linkError) {
            console.error(`[bulk-text/save] Link insert failed for item ${item.id}:`, linkError);
            // Continue without link - don't fail the entire item
          }
        }

        createdItems.push({
          index: i,
          itemId: item.id,
          photoUploaded,
        });

        console.log(`[bulk-text/save] Created item ${item.id} (photo: ${photoUploaded}, link: ${linkAdded})`);
      } catch (error) {
        console.error(`[bulk-text/save] Failed to save selection ${i}:`, error);
        failures.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update bag's updated_at timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bag.id);

    console.log(`[bulk-text/save] Completed: ${createdItems.length} created, ${failures.length} failed`);

    return NextResponse.json({
      createdItems,
      failures,
    });
  } catch (error) {
    console.error('[bulk-text/save] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
