import { Suspense } from 'react';
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
      items:bag_items!bag_items_bag_id_fkey (
        id,
        custom_name,
        brand,
        custom_description,
        notes,
        quantity,
        sort_index,
        custom_photo_id,
        photo_url,
        promo_codes,
        is_featured,
        links (
          id,
          url,
          kind,
          label,
          metadata,
          is_auto_generated
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

  // Fetch photo URLs for items that have custom_photo_id
  const photoIds = bag.items
    ?.map((item: any) => item.custom_photo_id)
    .filter((id: string | null): id is string => id !== null) || [];

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
      photoUrls = mediaAssets.reduce((acc: Record<string, string>, asset: { id: string; url: string }) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {});
    }
  }

  // Sort items by sort_index and add photo URLs
  // Priority: custom_photo_id (uploaded) > photo_url (external URL)
  const sortedItems = bag.items
    ?.map((item: any) => ({
      ...item,
      photo_url: item.custom_photo_id
        ? photoUrls[item.custom_photo_id] || item.photo_url || null
        : item.photo_url || null,
    }))
    .sort((a: any, b: any) => a.sort_index - b.sort_index) || [];

  // Get cover photo URL if present
  const coverPhotoUrl = bag.cover_photo_id ? photoUrls[bag.cover_photo_id] || null : null;

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

  // Create bag object with cover photo URL
  const bagWithCover = {
    ...bag,
    cover_photo_url: coverPhotoUrl,
  };

  return (
    <Suspense fallback={<BagViewSkeleton />}>
      <PublicBagView
        bag={bagWithCover}
        items={sortedItems}
        ownerHandle={profile.handle}
        ownerName={profile.display_name}
        ownerId={profile.id}
        hasAffiliateLinks={hasAffiliateLinks}
        disclosureText={disclosureText}
      />
    </Suspense>
  );
}

function BagViewSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="h-4 w-32 bg-[var(--grey-3)] rounded mb-4" />
          <div className="h-8 w-64 bg-[var(--grey-3)] rounded mb-2" />
          <div className="h-4 w-48 bg-[var(--grey-3)] rounded" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--surface)] rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]">
              <div className="aspect-square bg-[var(--grey-3)]" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-[var(--grey-3)] rounded" />
                <div className="h-5 w-32 bg-[var(--grey-3)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
