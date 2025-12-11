import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Storage bucket name
const BUCKET_NAME = 'item-photos';

// Create admin client for storage
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

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/bags/[code]/cover-photo
 * Upload a cover photo for a bag
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;

    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bag and verify ownership
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const aspectRatio = formData.get('aspectRatio') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate aspect ratio if provided
    const validAspectRatios = ['4/1', '21/9', '16/9', '3/2', '4/3'];
    const coverPhotoAspect = aspectRatio && validAspectRatios.includes(aspectRatio) ? aspectRatio : '21/9';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload to storage
    const supabaseAdmin = getSupabaseAdmin();
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/covers/${bag.id}-${timestamp}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Cover photo upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    const publicUrl = publicUrlData.publicUrl;

    // Create media asset record
    // Note: source_type must be 'user_upload' or null due to DB constraint
    const { data: mediaAsset, error: mediaError } = await supabaseAdmin
      .from('media_assets')
      .insert({
        owner_id: user.id,
        url: publicUrl,
        source_type: 'user_upload',
        alt: `Cover photo for ${code}`,
      })
      .select('id')
      .single();

    if (mediaError) {
      console.error('Media asset creation error:', mediaError);
      return NextResponse.json({ error: 'Failed to create media record' }, { status: 500 });
    }

    // Update bag with cover photo and aspect ratio
    const { error: updateError } = await supabaseAdmin
      .from('bags')
      .update({
        cover_photo_id: mediaAsset.id,
        cover_photo_aspect: coverPhotoAspect,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bag.id);

    if (updateError) {
      console.error('Bag update error:', updateError);
      return NextResponse.json({ error: 'Failed to update bag' }, { status: 500 });
    }

    return NextResponse.json({
      mediaAssetId: mediaAsset.id,
      url: publicUrl,
      aspectRatio: coverPhotoAspect,
    });
  } catch (error: any) {
    console.error('Cover photo upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload cover photo' }, { status: 500 });
  }
}

/**
 * DELETE /api/bags/[code]/cover-photo
 * Remove cover photo from a bag
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, cover_photo_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update bag to remove cover photo and reset aspect ratio
    const supabaseAdmin = getSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin
      .from('bags')
      .update({
        cover_photo_id: null,
        cover_photo_aspect: '21/9',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bag.id);

    if (updateError) {
      console.error('Bag update error:', updateError);
      return NextResponse.json({ error: 'Failed to update bag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cover photo delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove cover photo' }, { status: 500 });
  }
}
