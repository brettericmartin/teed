import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { uploadItemPhoto, createMediaAsset, deleteMediaAsset } from '@/lib/supabaseStorage';
import { validateExternalUrl } from '@/lib/urlValidation';

/**
 * POST /api/media/upload-from-url
 *
 * Download an image from a URL and upload to Supabase Storage
 * This bypasses CORS restrictions by downloading server-side
 *
 * Request body (JSON):
 * - imageUrl: URL of the image to download
 * - itemId: ID of item this photo belongs to
 * - filename?: Optional filename (defaults to sanitized item name)
 *
 * Response:
 * {
 *   mediaAssetId: string,
 *   url: string,
 *   thumbnailUrl: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using consistent server supabase client
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[upload-from-url] Auth check:', { hasUser: !!user, authError: authError?.message });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { imageUrl, itemId, filename, existingMediaAssetId } = body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // Validate URL is not targeting internal/private resources (SSRF protection)
    const urlError = validateExternalUrl(imageUrl);
    if (urlError) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Verify user owns the item
    // NOTE: Must specify the FK relationship explicitly because there are two:
    // 1. bag_items.bag_id -> bags.id (item belongs to bag)
    // 2. bags.hero_item_id -> bag_items.id (bag has hero item)
    console.log('[upload-from-url] Looking up item:', itemId);
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('id, bag_id, bags:bags!bag_items_bag_id_fkey(owner_id)')
      .eq('id', itemId)
      .single();

    console.log('[upload-from-url] Item lookup result:', {
      hasItem: !!item,
      itemError: itemError?.message,
      itemErrorCode: itemError?.code,
    });

    if (itemError || !item) {
      console.error('[upload-from-url] Item not found:', { itemId, error: itemError });
      return NextResponse.json(
        { error: 'Item not found', details: itemError?.message },
        { status: 404 }
      );
    }

    // Check ownership - bags is an object in single select with join
    // @ts-ignore
    if (item.bags?.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload photos for this item' },
        { status: 403 }
      );
    }

    // Delete existing media asset if provided (replacing an image)
    if (existingMediaAssetId) {
      try {
        console.log('[upload-from-url] Deleting existing media asset:', existingMediaAssetId);
        await deleteMediaAsset(existingMediaAssetId);
        console.log('[upload-from-url] Successfully deleted existing media asset');
      } catch (deleteError: any) {
        // Log but don't fail - the old asset may already be deleted or invalid
        console.warn('[upload-from-url] Failed to delete existing media asset:', deleteError.message);
      }
    }

    // Download image from URL (server-side, bypasses CORS)
    console.log('Downloading image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TeedBot/1.0)',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download image from URL' },
        { status: 400 }
      );
    }

    // Get image data as blob
    const imageBlob = await imageResponse.blob();

    // Validate it's an image
    if (!imageBlob.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageBlob.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Parse image dimensions from binary headers (lightweight, no dependencies)
    let imgWidth: number | undefined;
    let imgHeight: number | undefined;
    try {
      const buffer = new Uint8Array(await imageBlob.arrayBuffer());
      const dimensions = parseImageDimensions(buffer, imageBlob.type);
      if (dimensions) {
        imgWidth = dimensions.width;
        imgHeight = dimensions.height;
        console.log(`[upload-from-url] Image dimensions: ${imgWidth}x${imgHeight}`);
        if (imgWidth < 200 || imgHeight < 200) {
          console.warn(`[upload-from-url] WARNING: Small image (${imgWidth}x${imgHeight}) from ${imageUrl}`);
        }
      }
    } catch (dimError) {
      console.warn('[upload-from-url] Could not parse image dimensions:', dimError);
    }

    // Convert blob to File
    const file = new File(
      [imageBlob],
      filename || `product-${Date.now()}.jpg`,
      { type: imageBlob.type }
    );

    // Upload to Supabase Storage
    const { url, path } = await uploadItemPhoto(file, user.id, itemId);

    // Create media_assets record with dimensions
    const mediaAssetId = await createMediaAsset(url, user.id, {
      sourceType: 'user_upload', // Only 'user_upload' and null are allowed by DB constraint
      width: imgWidth,
      height: imgHeight,
    });

    console.log('Successfully uploaded image from URL:', { mediaAssetId, url });

    // Return media asset info
    return NextResponse.json(
      {
        mediaAssetId,
        url,
        thumbnailUrl: url,
        path,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Upload from URL error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to upload image from URL' },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

/**
 * Parse image dimensions from binary data without external dependencies.
 * Supports JPEG (SOF0/SOF2 markers) and PNG (IHDR chunk).
 */
function parseImageDimensions(
  buffer: Uint8Array,
  mimeType: string
): { width: number; height: number } | null {
  if (mimeType === 'image/png' && buffer.length >= 24) {
    // PNG: width and height are at bytes 16-23 in the IHDR chunk (big-endian uint32)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      if (width > 0 && height > 0) return { width, height };
    }
  }

  if ((mimeType === 'image/jpeg' || mimeType === 'image/jpg') && buffer.length >= 2) {
    // JPEG: scan for SOF0 (0xFFC0) or SOF2 (0xFFC2) marker
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        // SOF0 or SOF2 marker
        if (marker === 0xc0 || marker === 0xc2) {
          const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
          const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
          if (width > 0 && height > 0) return { width, height };
        }
        // Skip to next marker using segment length
        const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
        offset += 2 + segmentLength;
      }
    }
  }

  return null;
}
