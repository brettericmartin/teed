import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PublicBagView from './PublicBagView';

// Public Supabase client (no auth required for public bags)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ handle: string; code: string }>;
}

export default async function UserBagPage({ params }: PageProps) {
  const { handle, code } = await params;

  // First, fetch the user profile to get owner_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', handle)
    .single();

  // If user doesn't exist, show 404
  if (profileError || !profile) {
    notFound();
  }

  // Fetch the bag with all items and links (scoped to this user)
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
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  // If bag doesn't exist or is private, show 404
  if (error || !bag) {
    notFound();
  }

  // Sort items by sort_index
  const sortedItems = bag.items?.sort((a: any, b: any) => a.sort_index - b.sort_index) || [];

  // Check if bag has affiliate links
  const itemIds = bag.items?.map((item: any) => item.id) || [];
  let hasAffiliateLinks = false;
  let disclosureText = undefined;

  if (itemIds.length > 0) {
    // Check for affiliate links
    const { data: affiliateLinks } = await supabase
      .from('affiliate_links')
      .select('id')
      .in('bag_item_id', itemIds)
      .eq('is_active', true)
      .limit(1);

    hasAffiliateLinks = (affiliateLinks?.length || 0) > 0;

    // If has affiliate links, fetch creator's disclosure settings
    if (hasAffiliateLinks) {
      const { data: creatorSettings } = await supabase
        .from('creator_settings')
        .select('custom_disclosure_text')
        .eq('profile_id', profile.id)
        .single();

      disclosureText = creatorSettings?.custom_disclosure_text || undefined;
    }
  }

  return (
    <PublicBagView
      bag={bag}
      items={sortedItems}
      ownerHandle={profile.handle}
      ownerName={profile.display_name}
      hasAffiliateLinks={hasAffiliateLinks}
      disclosureText={disclosureText}
    />
  );
}
