import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import PublicBagView from './PublicBagView';
import {
  generateBagJsonLd,
  generateBreadcrumbJsonLd,
} from '@/lib/seo/structuredData';

// Public Supabase client (no auth required for public bags)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ handle: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle, code } = await params;

  // Fetch bag info for metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('handle', handle)
    .single();

  if (!profile) {
    return {
      title: 'Bag Not Found | Teed',
    };
  }

  const { data: bag } = await supabase
    .from('bags')
    .select('title, description, cover_photo_id')
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) {
    return {
      title: 'Bag Not Found | Teed',
    };
  }

  const title = `${bag.title} | Teed`;
  const description = bag.description || `${bag.title} by ${profile.display_name || handle}`;
  const url = `https://teed.club/u/${handle}/${code}`;

  // Dynamic OG image - always use the generated image for rich previews
  const ogImageUrl = `https://teed.club/api/og/bag/${handle}/${code}`;

  // oEmbed discovery URL
  const oembedUrl = `https://teed.club/api/oembed?url=${encodeURIComponent(url)}&format=json`;

  return {
    title,
    description,
    openGraph: {
      title: bag.title,
      description,
      url,
      siteName: 'Teed',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: bag.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: bag.title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      // oEmbed discovery for platforms like Notion, Slack, etc.
      types: {
        'application/json+oembed': oembedUrl,
      },
    },
  };
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

  // Fetch the bag with all items, links, and sections (scoped to this user)
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
        section_id,
        why_chosen,
        specs,
        compared_to,
        alternatives,
        price_paid,
        purchase_date,
        links (
          id,
          url,
          kind,
          label,
          metadata,
          is_auto_generated
        )
      ),
      sections:bag_sections (
        id,
        name,
        description,
        sort_index,
        collapsed_by_default
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

  // Generate structured data for SEO and AI discoverability
  const bagJsonLd = generateBagJsonLd(
    {
      id: bag.id,
      code: code,
      title: bag.title,
      description: bag.description,
      createdAt: bag.created_at,
      updatedAt: bag.updated_at,
      itemCount: sortedItems.length,
    },
    {
      handle: profile.handle,
      displayName: profile.display_name,
      bio: null,
      avatarUrl: null,
      createdAt: '',
    },
    sortedItems.map((item: any) => ({
      id: item.id,
      name: item.custom_name || item.brand || 'Item',
      brand: item.brand,
      description: item.custom_description || item.notes,
      photoUrl: item.photo_url,
      purchaseUrl: item.links?.[0]?.url || null,
      pricePaid: item.price_paid,
      purchaseDate: item.purchase_date,
    }))
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Teed', url: 'https://teed.club' },
    { name: profile.display_name || profile.handle, url: `https://teed.club/u/${profile.handle}` },
    { name: bag.title, url: `https://teed.club/u/${profile.handle}/${code}` },
  ]);

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bagJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
    </>
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
