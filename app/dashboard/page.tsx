import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  // Fetch user's bags with featured items
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select(`
      *,
      items:bag_items(
        id,
        custom_name,
        custom_photo_id,
        is_featured,
        featured_position
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (bagsError) {
    console.error('Error fetching bags:', bagsError);
  }

  // Get all photo IDs from all bags
  const allPhotoIds = bags
    ?.flatMap((bag: any) =>
      bag.items?.map((item: any) => item.custom_photo_id).filter(Boolean) || []
    ) || [];

  // Fetch media assets for all photos
  let photoUrls: Record<string, string> = {};
  if (allPhotoIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', allPhotoIds);

    if (mediaAssets) {
      photoUrls = mediaAssets.reduce((acc, asset) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // Map photo URLs to items
  const bagsWithPhotos = bags?.map((bag: any) => ({
    ...bag,
    items: bag.items?.map((item: any) => ({
      ...item,
      photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
    })),
  }));

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  // If no profile exists, we have a problem - user signed up but profile wasn't created
  if (!profile) {
    console.error('No profile found for user:', user.id, user.email);
  }

  return (
    <DashboardClient
      initialBags={bagsWithPhotos || []}
      userHandle={profile?.handle || ''}
      displayName={profile?.display_name || ''}
    />
  );
}
