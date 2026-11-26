import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Storage Helper Functions
 * Handles file uploads, media_assets records, and URL generation
 */

// Storage bucket name for item photos
const BUCKET_NAME = 'item-photos';

// Create server-side Supabase client with service role for storage operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Try both possible env var names
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // Debug: log all SUPABASE env vars (keys only, not values)
  const allEnvKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
  console.log('Available SUPABASE env vars:', allEnvKeys);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase env check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValue: supabaseUrl ? 'set' : 'missing',
      serviceKeyLength: supabaseServiceKey?.length || 0,
      availableKeys: allEnvKeys,
    });
    throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, ServiceKey=${!!supabaseServiceKey}, AvailableKeys=${allEnvKeys.join(',')}`);
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Upload image to Supabase Storage
 *
 * @param file - The file to upload (File or Blob)
 * @param userId - User ID for organizing storage
 * @param itemId - Item ID for organizing storage
 * @returns Public URL of uploaded image
 */
export async function uploadItemPhoto(
  file: File | Blob,
  userId: string,
  itemId: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseAdmin();

  // Generate unique filename with safe extension
  const timestamp = Date.now();
  let fileExt = 'jpg';
  if (file instanceof File && file.name) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase();
      if (ext && /^[a-z0-9]+$/.test(ext)) {
        fileExt = ext;
      }
    }
  }
  const fileName = `${timestamp}.${fileExt}`;
  const filePath = `${userId}/${itemId}/${fileName}`;

  // Debug logging
  console.log('Upload attempt:', {
    filePath,
    fileSize: file.size,
    fileType: file.type,
    isFile: file instanceof File,
    fileName: file instanceof File ? file.name : 'blob',
  });

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Supabase Storage upload error:', {
      error,
      filePath,
      fileType: file.type,
      fileSize: file.size,
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Delete image from Supabase Storage
 *
 * @param path - Storage path to delete
 */
export async function deleteItemPhoto(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Supabase Storage delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Create media_assets record in database
 *
 * @param url - Public URL of uploaded image
 * @param ownerId - User ID who owns the media
 * @param metadata - Optional metadata (width, height, alt text)
 * @returns Created media asset ID
 */
export async function createMediaAsset(
  url: string,
  ownerId: string,
  metadata?: {
    width?: number;
    height?: number;
    alt?: string;
    sourceType?: string;
  }
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      owner_id: ownerId,
      url,
      source_type: metadata?.sourceType || 'user_upload',
      alt: metadata?.alt || '',
      width: metadata?.width,
      height: metadata?.height,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Media asset creation error:', error);
    throw new Error(`Failed to create media asset record: ${error.message}`);
  }

  return data.id;
}

/**
 * Delete a media_assets record and its storage file.
 *
 * Only the owner's assets are touched. The record is deleted first and the
 * file only after that succeeds, so a photo that is still used by an item
 * (the foreign key blocks the delete) keeps its file instead of turning into
 * a broken image.
 *
 * @param mediaAssetId - ID of media asset to delete
 * @param ownerId - ID of the user who must own the asset
 */
export async function deleteMediaAsset(mediaAssetId: string, ownerId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: mediaAsset, error: fetchError } = await supabase
    .from('media_assets')
    .select('url, owner_id')
    .eq('id', mediaAssetId)
    .single();

  if (fetchError || !mediaAsset) {
    throw new Error(`Failed to find media asset: ${fetchError?.message || 'not found'}`);
  }

  if (mediaAsset.owner_id !== ownerId) {
    throw new Error('Media asset belongs to another user');
  }

  const { error: deleteError } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', mediaAssetId)
    .eq('owner_id', ownerId);

  if (deleteError) {
    if (deleteError.code === '23503') {
      // Still used by an item: keep the record and the file.
      throw new Error('Media asset is still in use');
    }
    console.error('Failed to delete media asset record:', deleteError);
    throw new Error(`Failed to delete media asset: ${deleteError.message}`);
  }

  // Extract path from URL (last part after bucket name)
  // URL format: https://.../storage/v1/object/public/item-photos/path/to/file.jpg
  const storagePath = mediaAsset.url.split(`/${BUCKET_NAME}/`)[1];
  if (storagePath) {
    await deleteItemPhoto(storagePath);
  }
}

/**
 * Get image dimensions from File/Blob
 *
 * @param file - Image file
 * @returns Width and height
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
