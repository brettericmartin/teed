import { notFound } from 'next/navigation';
import UnifiedProfileView from './UnifiedProfileView';
import { createServerSupabase } from '@/lib/serverSupabase';
import { ProfileBlock, DEFAULT_BLOCK_GRID } from '@/lib/blocks/types';

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function UserProfilePage({ params }: PageProps) {
  const { handle } = await params;

  // Query database directly instead of HTTP fetch
  const supabase = await createServerSupabase();

  // Check if current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser();

  // Find the profile by handle (including blocks_enabled flag)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, banner_url, bio, social_links, created_at, blocks_enabled')
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
      const { data: mediaAssets } = await supabase
        .from('media_assets')
        .select('id, url')
        .in('id', allPhotoIds);

      photoUrls = (mediaAssets || []).reduce((acc: Record<string, string>, asset: any) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {});
    }

    // Map photo URLs to items (always map, even if no photos)
    bags = bags.map((bag: any) => ({
      ...bag,
      items: bag.items?.map((item: any) => ({
        ...item,
        photo_url: item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null,
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

  // Always use the unified blocks view
  return (
    <UnifiedProfileView
      profile={profile}
      bags={bags || []}
      blocks={blocks}
      theme={theme}
      isOwnProfile={isOwnProfile}
    />
  );
}
