import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PublicBagView from './PublicBagView';

// Public Supabase client (no auth required for public bags)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicBagPage({ params }: PageProps) {
  const { code } = await params;

  // Fetch the bag with all items and links
  const { data: bag, error } = await supabase
    .from('bags')
    .select(`
      *,
      owner:profiles!owner_id (
        handle,
        display_name
      ),
      items:bag_items (
        id,
        custom_name,
        custom_description,
        notes,
        quantity,
        sort_index,
        links (
          id,
          url,
          kind,
          label,
          metadata
        )
      )
    `)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  // If bag doesn't exist or is private, show 404
  if (error || !bag) {
    notFound();
  }

  // Sort items by sort_index
  const sortedItems = bag.items?.sort((a: any, b: any) => a.sort_index - b.sort_index) || [];

  return (
    <PublicBagView
      bag={bag}
      items={sortedItems}
      ownerHandle={bag.owner?.handle || 'user'}
      ownerName={bag.owner?.display_name || 'User'}
    />
  );
}
