import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import EmbedBagView from '@/components/embed/EmbedBagView';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ handle: string; code: string }>;
}

export default async function EmbedBagPage({ params }: PageProps) {
  const { handle, code } = await params;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', handle)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch bag with items
  const { data: bag } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      items:bag_items(
        id,
        custom_name,
        brand,
        photo_url,
        custom_photo_id,
        sort_index
      )
    `)
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) {
    notFound();
  }

  // Get photo URLs for items with custom photos
  const photoIds = (bag.items || [])
    .map((item: any) => item.custom_photo_id)
    .filter((id: string | null): id is string => id !== null);

  let photoUrls: Record<string, string> = {};
  if (photoIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', photoIds);

    if (mediaAssets) {
      photoUrls = mediaAssets.reduce((acc: Record<string, string>, asset: { id: string; url: string }) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {});
    }
  }

  // Map items with photo URLs
  const items = (bag.items || [])
    .sort((a: any, b: any) => a.sort_index - b.sort_index)
    .map((item: any) => ({
      id: item.id,
      name: item.custom_name || item.brand || 'Item',
      brand: item.brand,
      photoUrl: item.custom_photo_id ? photoUrls[item.custom_photo_id] : item.photo_url,
    }));

  const bagUrl = `https://teed.club/u/${handle}/${code}`;

  return (
    <EmbedBagView
      title={bag.title}
      description={bag.description}
      ownerHandle={profile.handle}
      ownerName={profile.display_name}
      itemCount={items.length}
      items={items}
      bagUrl={bagUrl}
    />
  );
}
