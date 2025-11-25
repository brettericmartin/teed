import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import DashboardClient from './DashboardClient';
import BetaGate from './BetaGate';

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

  // Check beta access first
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, beta_tier, beta_approved_at, total_views, total_bags, total_followers, stats_updated_at')
    .eq('id', user.id)
    .single();

  // If user doesn't have beta access, show the beta gate
  if (!profile?.beta_tier) {
    return <BetaGate userEmail={user.email || ''} userName={profile?.display_name || ''} />;
  }

  // Fetch user's bags with featured items
  // Sort by: pinned first (by pinned_at DESC), then by created_at DESC
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
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
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

  // Profile already fetched above for beta check

  return (
    <DashboardClient
      initialBags={bagsWithPhotos || []}
      userHandle={profile?.handle || ''}
      displayName={profile?.display_name || ''}
      profileStats={{
        totalViews: profile?.total_views || 0,
        totalBags: profile?.total_bags || 0,
        totalFollowers: profile?.total_followers || 0,
        statsUpdatedAt: profile?.stats_updated_at || null,
      }}
    />
  );
}
