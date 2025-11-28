import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profile/avatar
 * Upload a new avatar for the current user
 * Accepts: multipart/form-data with 'file' field
 */
export async function POST(request: NextRequest) {
  console.log('[Avatar Upload] Starting POST request');

  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Avatar Upload] Auth check:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.log('[Avatar Upload] Unauthorized:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('[Avatar Upload] File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    if (!file) {
      console.log('[Avatar Upload] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.log('[Avatar Upload] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      console.log('[Avatar Upload] File too large:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Get file extension - default to jpg for cropped blobs
    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const fileName = `${user.id}/avatar.${fileExt}`;

    console.log('[Avatar Upload] Uploading to path:', fileName);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('[Avatar Upload] Buffer size:', buffer.length);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Replace existing file
      });

    console.log('[Avatar Upload] Storage response:', { uploadData, uploadError: uploadError?.message });

    if (uploadError) {
      console.error('[Avatar Upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload avatar: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log('[Avatar Upload] Public URL:', publicUrl);

    // Update profile with new avatar URL (add cache buster to force refresh)
    const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrlWithCacheBust })
      .eq('id', user.id)
      .select()
      .single();

    console.log('[Avatar Upload] Profile update:', { updatedProfile, updateError: updateError?.message });

    if (updateError) {
      console.error('[Avatar Upload] Profile update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update profile with avatar: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('[Avatar Upload] Success!');
    return NextResponse.json({
      avatar_url: avatarUrlWithCacheBust,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('[Avatar Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove the current user's avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current profile to find avatar path
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    // If there's an avatar in storage, delete it
    if (profile?.avatar_url) {
      // Extract path from URL
      const avatarPath = `${user.id}/avatar`;

      // Try to delete files with common extensions
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      for (const ext of extensions) {
        await supabase.storage
          .from('avatars')
          .remove([`${avatarPath}.${ext}`]);
      }
    }

    // Update profile to remove avatar_url
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing avatar from profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar removed successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('DELETE /api/profile/avatar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
