import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import UnifiedProfileView from './UnifiedProfileView';
import { createServerSupabase } from '@/lib/serverSupabase';
import { ProfileBlock, DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';
import {
  generateProfileJsonLd,
  generateBreadcrumbJsonLd,
} from '@/lib/seo/structuredData';
import { createClient } from '@supabase/supabase-js';

// Static supabase client for metadata generation (no auth)
const supabaseStatic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<{
    welcome?: string;
    edit?: string;
    action?: 'link' | 'block' | 'social';
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;

  const { data: profile } = await supabaseStatic
    .from('profiles')
    .select('id, display_name, bio, avatar_url')
    .eq('handle', handle)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | Teed.club',
    };
  }

  // Get public bag count
  const { count: bagCount } = await supabaseStatic
    .from('bags')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', profile.id)
    .eq('is_public', true);

  const displayName = profile.display_name || handle;
  const title = `${displayName} (@${handle}) | Teed`;
  const description = profile.bio || `${displayName}'s curated collections on Teed • ${bagCount || 0} collection${bagCount === 1 ? '' : 's'}`;
  const url = `https://teed.club/u/${handle}`;
  const ogImageUrl = `https://teed.club/api/og/profile/${handle}`;

  // oEmbed discovery URL
  const oembedUrl = `https://teed.club/api/oembed?url=${encodeURIComponent(url)}&format=json`;

  return {
    title,
    description,
    openGraph: {
      title: displayName,
      description,
      url,
      siteName: 'Teed.club',
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Teed profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
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

export default async function UserProfilePage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const search = await searchParams;
  const showWelcome = search.welcome === 'true';
  const initialAction = search.action;
  const startInEditMode = search.edit === 'true';

  // Query database directly instead of HTTP fetch
  const supabase = await createServerSupabase();

  // Check if current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser();

  // Find the profile by handle (including blocks_enabled flag and beta_tier)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, banner_url, bio, social_links, created_at, blocks_enabled, beta_tier')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === profile.id;

  // Fetch user's public bags (or all bags if viewing own profile) WITH items
  const bagsQuery = supabase
    .from('bags')
    .select(`
      id, code, title, description, background_image, is_public, created_at, updated_at, category,
      items:bag_items!bag_items_bag_id_fkey(
        id,
        custom_name,
        custom_photo_id,
        is_featured,
        featured_position
      )
    `)
    .eq('owner_id', profile.id)
    .order('updated_at', { ascending: false });

  // Only show public bags to other users
  if (!isOwnProfile) {
    bagsQuery.eq('is_public', true);
  }

  const { data: bagsRaw, error: bagsError } = await bagsQuery;

  // Fetch photo URLs for all items
  let bags: any[] = bagsRaw || [];
  if (bags.length > 0) {
    const allPhotoIds = bags
      .flatMap((bag: any) =>
        bag.items?.map((item: any) => item.custom_photo_id).filter(Boolean) || []
      );

    let photoUrls: Record<string, string> = {};
    if (allPhotoIds.length > 0) {
      // Batch in chunks of 100 to avoid URL length limits on .in() queries
      const BATCH_SIZE = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < allPhotoIds.length; i += BATCH_SIZE) {
        chunks.push(allPhotoIds.slice(i, i + BATCH_SIZE));
      }

      const results = await Promise.all(
        chunks.map(chunk =>
          supabase
            .from('media_assets')
            .select('id, url')
            .in('id', chunk)
        )
      );

      for (const { data: mediaAssets } of results) {
        for (const asset of mediaAssets || []) {
          photoUrls[asset.id] = asset.url;
        }
      }
    }

    // Map photo URLs to items (always map, even if no photos)
    bags = bags.map((bag: any) => ({
      ...bag,
      items: bag.items?.map((item: any) => ({
        ...item,
        photo_url: item.custom_photo_id
          ? photoUrls[item.custom_photo_id] || item.photo_url || null
          : item.photo_url || null,
      })) || [],
    }));
  }

  if (bagsError) {
    console.error('Error fetching user bags:', bagsError);
    notFound();
  }

  // Fetch profile blocks
  const { data: existingBlocks } = await supabase
    .from('profile_blocks')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true });

  // Fetch profile theme
  const { data: theme } = await supabase
    .from('profile_themes')
    .select('*')
    .eq('profile_id', profile.id)
    .single();

  // Map snake_case database columns to camelCase for grid fields
  let blocks: ProfileBlock[] = (existingBlocks || []).map((block: any) => ({
    ...block,
    gridX: block.grid_x ?? 0,
    gridY: block.grid_y ?? block.sort_order * 2,
    gridW: block.grid_w ?? DEFAULT_BLOCK_GRID[block.block_type as keyof typeof DEFAULT_BLOCK_GRID]?.w ?? 12,
    gridH: block.grid_h ?? DEFAULT_BLOCK_GRID[block.block_type as keyof typeof DEFAULT_BLOCK_GRID]?.h ?? 2,
  }));

  if (blocks.length === 0) {
    // Generate default blocks with grid coordinates
    const now = new Date().toISOString();
    let currentY = 0;

    const createBlock = (
      blockType: keyof typeof DEFAULT_BLOCK_GRID,
      sortOrder: number,
      config: Record<string, any>
    ): ProfileBlock => {
      const gridDefaults = DEFAULT_BLOCK_GRID[blockType];
      const block: ProfileBlock = {
        id: crypto.randomUUID(),
        profile_id: profile.id,
        block_type: blockType,
        sort_order: sortOrder,
        is_visible: true,
        width: 'full',
        gridX: 0,
        gridY: currentY,
        gridW: gridDefaults.w,
        gridH: gridDefaults.h,
        config,
        created_at: now,
        updated_at: now,
      };
      currentY += gridDefaults.h;
      return block;
    };

    blocks = [
      createBlock('header', 0, { size: 'standard', alignment: 'center' }),
      createBlock('bio', 1, { size: 'standard' }),
      createBlock('social_links', 2, { style: 'icons' }),
      createBlock('featured_bags', 3, { max_display: 6 }),
    ];
  }

  // Get member number for welcome celebration (only if showing welcome)
  let memberNumber: number | undefined;
  if (showWelcome && isOwnProfile) {
    const { data: capacity } = await supabase.rpc('get_beta_capacity');
    memberNumber = capacity?.current ?? 43;
  }

  // Generate structured data for SEO and AI discoverability
  const profileJsonLd = generateProfileJsonLd(
    {
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
    },
    profile.social_links as Record<string, string> | undefined
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Teed.club', url: 'https://teed.club' },
    { name: profile.display_name || profile.handle, url: `https://teed.club/u/${profile.handle}` },
  ]);

  // Always use the unified blocks view
  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <UnifiedProfileView
        profile={profile}
        bags={bags || []}
        blocks={blocks}
        theme={theme}
        isOwnProfile={isOwnProfile}
        showWelcome={showWelcome && isOwnProfile}
        memberNumber={memberNumber}
        initialAction={initialAction}
        startInEditMode={startInEditMode && isOwnProfile}
      />
    </>
  );
}
