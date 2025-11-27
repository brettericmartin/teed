import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { uploadItemPhoto, createMediaAsset } from '@/lib/supabaseStorage';
import { createClient } from '@supabase/supabase-js';

// Create admin client for queries that need to bypass RLS
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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
    const { imageUrl, itemId, filename } = body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Verify user owns the item - use admin client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[upload-from-url] Looking up item:', itemId);
    const { data: item, error: itemError } = await supabaseAdmin
      .from('bag_items')
      .select('bag_id, bags!inner(owner_id)')
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

    // Check ownership
    const bags = item.bags as any;
    const bag = Array.isArray(bags) ? bags[0] : bags;
    if (bag?.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload photos for this item' },
        { status: 403 }
      );
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

    // Convert blob to File
    const file = new File(
      [imageBlob],
      filename || `product-${Date.now()}.jpg`,
      { type: imageBlob.type }
    );

    // Upload to Supabase Storage
    const { url, path } = await uploadItemPhoto(file, user.id, itemId);

    // Create media_assets record
    const mediaAssetId = await createMediaAsset(url, user.id, {
      sourceType: 'user_upload', // Only 'user_upload' and null are allowed by DB constraint
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
