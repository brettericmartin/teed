import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import EmbedItemCard from '@/components/embed/EmbedItemCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmbedItemPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch item with bag and owner info
  const { data: item } = await supabase
    .from('bag_items')
    .select(`
      id,
      custom_name,
      brand,
      custom_description,
      notes,
      photo_url,
      custom_photo_id,
      why_chosen,
      links(url, kind),
      bag:bags!bag_items_bag_id_fkey(
        id,
        code,
        title,
        is_public,
        owner:profiles!bags_owner_id_fkey(
          handle,
          display_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!item || !item.bag) {
    notFound();
  }

  // Check if bag is public
  const bag = Array.isArray(item.bag) ? item.bag[0] : item.bag;
  if (!bag?.is_public) {
    notFound();
  }

  const owner = Array.isArray(bag.owner) ? bag.owner[0] : bag.owner;
  if (!owner) {
    notFound();
  }

  // Get photo URL
  let photoUrl = item.photo_url;
  if (item.custom_photo_id) {
    const { data: media } = await supabase
      .from('media_assets')
      .select('url')
      .eq('id', item.custom_photo_id)
      .single();
    if (media) {
      photoUrl = media.url;
    }
  }

  // Find purchase link
  const purchaseLink = item.links?.find((link: any) =>
    ['purchase', 'affiliate', 'product'].includes(link.kind)
  );

  const bagUrl = `https://teed.club/u/${owner.handle}/${bag.code}`;

  return (
    <EmbedItemCard
      name={item.custom_name || item.brand || 'Item'}
      brand={item.brand}
      description={item.custom_description || item.notes}
      photoUrl={photoUrl}
      whyChosen={item.why_chosen}
      purchaseUrl={purchaseLink?.url || null}
      bagTitle={bag.title}
      ownerHandle={owner.handle}
      ownerName={owner.display_name}
      bagUrl={bagUrl}
    />
  );
}
