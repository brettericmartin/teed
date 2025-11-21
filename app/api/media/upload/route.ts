import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';

/**
 * POST /api/media/upload
 *
 * Upload photo for an item and create media_assets record
 *
 * Request body (multipart/form-data):
 * - file: Image file (max 2MB)
 * - itemId: ID of item this photo belongs to
 * - alt?: Alt text for accessibility
 *
 * Response:
 * {
 *   mediaAssetId: string,
 *   url: string,
 *   thumbnailUrl: string (same as url for now)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // Read-only
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = formData.get('itemId') as string | null;
    const alt = formData.get('alt') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Verify user owns the item
    const { data: item, error: itemError } = await supabase
      .from('bag_items')
      .select('bag_id, bags!inner(owner_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const bags = item.bags as any;
    const bag = Array.isArray(bags) ? bags[0] : bags;
    if (bag?.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload photos for this item' },
        { status: 403 }
      );
    }

    // Upload to Supabase Storage
    const { url, path } = await uploadItemPhoto(file, user.id, itemId);

    // Get image dimensions (optional, best effort)
    let width: number | undefined;
    let height: number | undefined;
    try {
      // Note: getImageDimensions works in browser, not server
      // For server-side, we'll skip dimensions for now
      // Could use sharp or similar library if needed
    } catch (err) {
      console.log('Could not get image dimensions:', err);
    }

    // Create media_assets record
    const mediaAssetId = await createMediaAsset(url, user.id, {
      alt: alt || undefined,
      width,
      height,
      sourceType: 'user_upload',
    });

    // Return media asset info
    return NextResponse.json(
      {
        mediaAssetId,
        url,
        thumbnailUrl: url, // For now, same as url. Could generate thumbnail later
        path,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Photo upload error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
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
