import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import BagEditorClient from './BagEditorClient';

type PageProps = {
  params: Promise<{
    handle: string;
    code: string;
  }>;
};

export default async function BagEditorPage({ params }: PageProps) {
  const { handle, code } = await params;
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/');
  }

  // Fetch user profile by handle
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    redirect('/dashboard');
  }

  // Verify this is the authenticated user's profile
  if (profile.id !== user.id) {
    redirect('/dashboard');
  }

  // Fetch bag (scoped to this user)
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('code', code)
    .single();

  if (bagError || !bag) {
    redirect('/dashboard');
  }

  // Fetch items for this bag
  const { data: items, error: itemsError } = await supabase
    .from('bag_items')
    .select('*')
    .eq('bag_id', bag.id)
    .order('sort_index', { ascending: true });

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
  }

  // Fetch sections for this bag
  const { data: sections, error: sectionsError } = await supabase
    .from('bag_sections')
    .select('*')
    .eq('bag_id', bag.id)
    .order('sort_index', { ascending: true });

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
  }

  // Fetch links for all items
  const itemIds = items?.map((item) => item.id) || [];
  let links: any[] = [];

  if (itemIds.length > 0) {
    const { data: linksData, error: linksError } = await supabase
      .from('links')
      .select('*')
      .in('bag_item_id', itemIds);

    if (!linksError) {
      links = linksData || [];
    }
  }

  // Fetch photo URLs for items that have custom_photo_id
  const photoIds = items
    ?.map((item) => item.custom_photo_id)
    .filter((id): id is string => id !== null) || [];

  // Also include cover photo if present
  if (bag.cover_photo_id) {
    photoIds.push(bag.cover_photo_id);
  }

  let photoUrls: Record<string, string> = {};

  if (photoIds.length > 0) {
    const { data: mediaAssets, error: mediaError } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', photoIds);

    if (!mediaError && mediaAssets) {
      photoUrls = mediaAssets.reduce((acc, asset) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // Organize links by item and add photo URLs
  const itemsWithLinks = (items || []).map((item) => {
    const photoUrl = item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null;

    return {
      ...item,
      photo_url: photoUrl,
      links: links.filter((link) => link.bag_item_id === item.id),
    };
  });

  // Get cover photo URL if present
  const coverPhotoUrl = bag.cover_photo_id ? photoUrls[bag.cover_photo_id] || null : null;

  const bagWithItems = {
    ...bag,
    cover_photo_url: coverPhotoUrl,
    items: itemsWithLinks,
    sections: sections || [],
  };

  return <BagEditorClient initialBag={bagWithItems} ownerHandle={profile.handle} />;
}
