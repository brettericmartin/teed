import { createServerSupabase } from '@/lib/serverSupabase';
import Navigation from '@/components/Navigation';
import DiscoverClient from './DiscoverClient';

export default async function DiscoverPage() {
  const supabase = await createServerSupabase();

  // Check if user is authenticated (optional for discover page)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // Fetch discover data (all public bags) directly from Supabase
  const { data: bags } = await supabase
    .from('bags')
    .select(`
      *,
      items:bag_items!bag_items_bag_id_fkey(
        id,
        custom_name,
        custom_photo_id,
        is_featured,
        featured_position
      ),
      owner:profiles!bags_owner_id_fkey(
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(100);

  // Get all photo IDs from all bags
  const allPhotoIds = bags
    ?.flatMap((bag: any) =>
      bag.items?.map((item: any) => item.custom_photo_id).filter(Boolean) || []
    ) || [];

  // Fetch media assets for all photos
  let photoUrls: Record<string, string> = {};
  if (allPhotoIds.length > 0) {
    // Batch in chunks of 100 to avoid URL length limits on .in() queries
    const BATCH_SIZE = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < allPhotoIds.length; i += BATCH_SIZE) {
      chunks.push(allPhotoIds.slice(i, i + BATCH_SIZE));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        supabase
          .from('media_assets')
          .select('id, url')
          .in('id', chunk)
      )
    );

    for (const { data: mediaAssets } of results) {
      for (const asset of mediaAssets || []) {
        photoUrls[asset.id] = asset.url;
      }
    }
  }

  // Map photo URLs to items
  const bagsWithPhotos = bags?.map((bag: any) => ({
    ...bag,
    items: bag.items?.map((item: any) => ({
      ...item,
      photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
    })),
  })) || [];

  return (
    <>
      <Navigation
        userHandle={profile?.handle || ''}
        displayName={profile?.display_name || ''}
        isAuthenticated={!!user}
      />
      <DiscoverClient initialBags={bagsWithPhotos} />
    </>
  );
}
