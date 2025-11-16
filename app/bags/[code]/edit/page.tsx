import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import BagEditorClient from './BagEditorClient';

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function BagEditorPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/');
  }

  // Fetch bag
  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .select('*')
    .eq('code', code)
    .single();

  if (bagError || !bag) {
    redirect('/dashboard');
  }

  // Verify ownership
  if (bag.owner_id !== user.id) {
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

  const bagWithItems = {
    ...bag,
    items: itemsWithLinks,
  };

  return <BagEditorClient initialBag={bagWithItems} />;
}
