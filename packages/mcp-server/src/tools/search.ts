/**
 * Search & Discovery Tools
 *
 * Tools for searching and discovering public bags and items.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';

export const searchTools: Tool[] = [
  {
    name: 'discover_featured_bags',
    description: 'Get featured and trending bags curated by Teed. Great for discovering popular setups and getting inspiration.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_bags',
    description: 'Search public bags across the Teed community',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches titles, descriptions)',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        limit: {
          type: 'integer',
          default: 10,
          maximum: 50,
          description: 'Maximum number of results (default: 10, max: 50)',
        },
      },
    },
  },
  {
    name: 'search_items',
    description: 'Search for specific items across public bags',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (product names, brands)',
        },
        brand: {
          type: 'string',
          description: 'Filter by brand',
        },
        category: {
          type: 'string',
          description: 'Filter by bag category',
        },
        limit: {
          type: 'integer',
          default: 20,
          maximum: 100,
          description: 'Maximum number of results (default: 20, max: 100)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_public_bags',
    description: 'Get public bags from a specific user by their handle',
    inputSchema: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: "User's handle (without @)",
        },
      },
      required: ['handle'],
    },
  },
];

/**
 * Handle search tool calls
 */
export async function handleSearchTool(
  name: string,
  args: Record<string, unknown> | undefined,
  supabase: SupabaseClient
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case 'discover_featured_bags':
      return discoverFeaturedBags(supabase);

    case 'search_bags':
      return searchBags(supabase, args);

    case 'search_items':
      return searchItems(supabase, args);

    case 'get_user_public_bags':
      return getUserPublicBags(supabase, args);

    default:
      return {
        content: [{ type: 'text', text: `Unknown search tool: ${name}` }],
        isError: true,
      };
  }
}

// Featured bag codes - curated by Teed
const FEATURED_BAG_CODES = [
  { handle: 'teed', code: 'christmas-list-2' },
  { handle: 'brett', code: 'sean-walsh-s-break-50-bag' },
  { handle: 'teed', code: 'matt-scharff-s-golf-bag' },
  { handle: 'teed', code: 'peter-mckinnon-camera-bag' },
  { handle: 'teed', code: 'ryder-rivadeneyra-s-golf-filming-master-bag' },
];

async function discoverFeaturedBags(supabase: SupabaseClient) {
  const bags = await Promise.all(
    FEATURED_BAG_CODES.map(async ({ handle, code }) => {
      // Get the profile by handle
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, handle, display_name')
        .eq('handle', handle)
        .single();

      if (!profile) return null;

      // Get the bag
      const { data: bag } = await supabase
        .from('bags')
        .select(`
          id,
          title,
          description,
          code,
          category,
          bag_items (count)
        `)
        .eq('owner_id', profile.id)
        .eq('code', code)
        .eq('is_public', true)
        .single();

      if (!bag) return null;

      return {
        code: bag.code,
        title: bag.title,
        description: bag.description,
        category: bag.category,
        item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
        owner: `@${profile.handle}`,
        owner_name: profile.display_name,
        url: `https://teed.club/u/${profile.handle}/${bag.code}`,
      };
    })
  );

  const validBags = bags.filter(Boolean);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            featured_bags: validBags,
            total_count: validBags.length,
            message: `Found ${validBags.length} featured bags curated by Teed. These showcase popular setups and gear configurations.`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function searchBags(
  supabase: SupabaseClient,
  args: Record<string, unknown> | undefined
) {
  const query = args?.query as string | undefined;
  const category = args?.category as string | undefined;
  const limit = Math.min((args?.limit as number) || 10, 50);

  let dbQuery = supabase
    .from('bags')
    .select(
      `
      id,
      code,
      title,
      description,
      category,
      created_at,
      updated_at,
      profiles!bags_owner_id_fkey (
        handle,
        display_name
      ),
      bag_items (count)
    `
    )
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Apply text search if query provided
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Apply category filter
  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return {
      content: [{ type: 'text', text: `Error searching bags: ${error.message}` }],
      isError: true,
    };
  }

  const results = (data || []).map((bag: Record<string, unknown>) => {
    const owner = bag.profiles as Record<string, unknown>;
    return {
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      owner: owner?.handle ? `@${owner.handle}` : 'unknown',
      owner_name: owner?.display_name,
      item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
      url: `https://teed.club/u/${owner?.handle}/${bag.code}`,
      updated_at: bag.updated_at,
    };
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query: query || null,
            category: category || null,
            results,
            total_count: results.length,
            message: `Found ${results.length} bags${query ? ` matching '${query}'` : ''}`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function searchItems(
  supabase: SupabaseClient,
  args: Record<string, unknown> | undefined
) {
  const query = args?.query as string;
  const brand = args?.brand as string | undefined;
  const category = args?.category as string | undefined;
  const limit = Math.min((args?.limit as number) || 20, 100);

  if (!query) {
    return {
      content: [{ type: 'text', text: 'query is required for item search' }],
      isError: true,
    };
  }

  let dbQuery = supabase
    .from('bag_items')
    .select(
      `
      id,
      custom_name,
      brand,
      custom_description,
      quantity,
      bags!inner (
        code,
        title,
        category,
        is_public,
        profiles!bags_owner_id_fkey (
          handle,
          display_name
        )
      )
    `
    )
    .eq('bags.is_public', true)
    .or(`custom_name.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(limit);

  // Apply brand filter
  if (brand) {
    dbQuery = dbQuery.ilike('brand', `%${brand}%`);
  }

  // Apply category filter through bags
  if (category) {
    dbQuery = dbQuery.eq('bags.category', category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return {
      content: [{ type: 'text', text: `Error searching items: ${error.message}` }],
      isError: true,
    };
  }

  const results = (data || []).map((item: Record<string, unknown>) => {
    const bag = item.bags as Record<string, unknown>;
    const owner = bag?.profiles as Record<string, unknown>;
    return {
      id: item.id,
      name: item.custom_name,
      brand: item.brand,
      description: item.custom_description,
      quantity: item.quantity,
      bag: {
        code: bag?.code,
        title: bag?.title,
        category: bag?.category,
      },
      owner: owner?.handle ? `@${owner.handle}` : 'unknown',
      bag_url: `https://teed.club/u/${owner?.handle}/${bag?.code}`,
    };
  });

  // Aggregate by brand for summary
  const brandCounts: Record<string, number> = {};
  results.forEach((item) => {
    const brandName = item.brand as string | undefined;
    if (brandName) {
      brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
    }
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            query,
            brand: brand || null,
            category: category || null,
            results,
            total_count: results.length,
            brand_summary: brandCounts,
            message: `Found ${results.length} items matching '${query}'`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function getUserPublicBags(
  supabase: SupabaseClient,
  args: Record<string, unknown> | undefined
) {
  let handle = args?.handle as string;
  if (!handle) {
    return {
      content: [{ type: 'text', text: 'handle is required' }],
      isError: true,
    };
  }

  // Remove @ if present
  handle = handle.replace(/^@/, '');

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    return {
      content: [{ type: 'text', text: `User @${handle} not found.` }],
      isError: true,
    };
  }

  // Get their public bags
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select(
      `
      code,
      title,
      description,
      category,
      updated_at,
      bag_items (count)
    `
    )
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (bagsError) {
    return {
      content: [{ type: 'text', text: `Error fetching bags: ${bagsError.message}` }],
      isError: true,
    };
  }

  const bagResults = (bags || []).map((bag: Record<string, unknown>) => ({
    code: bag.code,
    title: bag.title,
    description: bag.description,
    category: bag.category,
    item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
    url: `https://teed.club/u/${handle}/${bag.code}`,
    updated_at: bag.updated_at,
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            user: {
              handle: `@${profile.handle}`,
              display_name: profile.display_name,
              bio: profile.bio,
              profile_url: `https://teed.club/u/${profile.handle}`,
            },
            bags: bagResults,
            total_bags: bagResults.length,
          },
          null,
          2
        ),
      },
    ],
  };
}
