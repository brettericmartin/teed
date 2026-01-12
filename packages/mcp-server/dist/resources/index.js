"use strict";
/**
 * MCP Resources
 *
 * Resources expose data that AI assistants can read into their context.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceTemplates = exports.resources = void 0;
exports.handleReadResource = handleReadResource;
exports.resources = [
    {
        uri: 'teed://profile',
        name: 'My Teed Profile',
        description: 'The authenticated user\'s profile information',
        mimeType: 'application/json',
    },
    {
        uri: 'teed://bags',
        name: 'My Bags',
        description: 'List of all bags owned by the user',
        mimeType: 'application/json',
    },
];
// Resource templates (for dynamic URIs)
exports.resourceTemplates = [
    {
        uriTemplate: 'teed://bags/{code}',
        name: 'Bag Contents',
        description: 'Full contents of a specific bag',
        mimeType: 'application/json',
    },
];
/**
 * Handle resource read requests
 */
async function handleReadResource(uri, supabase, userId) {
    // Parse the URI
    const url = new URL(uri);
    const path = url.pathname;
    if (uri === 'teed://profile') {
        return readProfile(supabase, userId);
    }
    if (uri === 'teed://bags') {
        return readBagList(supabase, userId);
    }
    // Handle bag-specific URIs: teed://bags/{code}
    const bagMatch = path.match(/^\/\/bags\/(.+)$/);
    if (bagMatch) {
        const bagCode = bagMatch[1];
        return readBagContents(supabase, bagCode, userId);
    }
    return {
        contents: [
            {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Unknown resource' }),
            },
        ],
    };
}
async function readProfile(supabase, userId) {
    if (!userId) {
        return {
            contents: [
                {
                    uri: 'teed://profile',
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Authentication required' }),
                },
            ],
        };
    }
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, bio, avatar_url, created_at')
        .eq('id', userId)
        .single();
    if (error || !profile) {
        return {
            contents: [
                {
                    uri: 'teed://profile',
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Profile not found' }),
                },
            ],
        };
    }
    // Get bag count
    const { count: bagCount } = await supabase
        .from('bags')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);
    // Get total item count
    const { count: itemCount } = await supabase
        .from('bag_items')
        .select('*, bags!inner(owner_id)', { count: 'exact', head: true })
        .eq('bags.owner_id', userId);
    return {
        contents: [
            {
                uri: 'teed://profile',
                mimeType: 'application/json',
                text: JSON.stringify({
                    handle: `@${profile.handle}`,
                    display_name: profile.display_name,
                    bio: profile.bio,
                    avatar_url: profile.avatar_url,
                    profile_url: `https://teed.club/u/${profile.handle}`,
                    stats: {
                        total_bags: bagCount || 0,
                        total_items: itemCount || 0,
                    },
                    member_since: profile.created_at,
                }),
            },
        ],
    };
}
async function readBagList(supabase, userId) {
    if (!userId) {
        return {
            contents: [
                {
                    uri: 'teed://bags',
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Authentication required' }),
                },
            ],
        };
    }
    const { data: bags, error } = await supabase
        .from('bags')
        .select(`
      code,
      title,
      description,
      category,
      is_public,
      updated_at,
      bag_items (count)
    `)
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
    if (error) {
        return {
            contents: [
                {
                    uri: 'teed://bags',
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Failed to fetch bags' }),
                },
            ],
        };
    }
    // Get user handle for URLs
    const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', userId)
        .single();
    const handle = profile?.handle || 'user';
    const bagList = (bags || []).map((bag) => ({
        code: bag.code,
        title: bag.title,
        description: bag.description,
        category: bag.category,
        is_public: bag.is_public,
        item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
        url: `https://teed.club/u/${handle}/${bag.code}`,
        resource_uri: `teed://bags/${bag.code}`,
        updated_at: bag.updated_at,
    }));
    return {
        contents: [
            {
                uri: 'teed://bags',
                mimeType: 'application/json',
                text: JSON.stringify({
                    total: bagList.length,
                    bags: bagList,
                }),
            },
        ],
    };
}
async function readBagContents(supabase, bagCode, userId) {
    const { data: bag, error } = await supabase
        .from('bags')
        .select(`
      id,
      code,
      title,
      description,
      category,
      is_public,
      owner_id,
      updated_at,
      profiles!bags_owner_id_fkey (
        handle,
        display_name
      ),
      bag_items (
        id,
        custom_name,
        brand,
        custom_description,
        quantity,
        sort_index,
        links (
          url,
          kind,
          label
        )
      )
    `)
        .eq('code', bagCode)
        .single();
    if (error || !bag) {
        return {
            contents: [
                {
                    uri: `teed://bags/${bagCode}`,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Bag not found' }),
                },
            ],
        };
    }
    // Check access
    if (!bag.is_public && bag.owner_id !== userId) {
        return {
            contents: [
                {
                    uri: `teed://bags/${bagCode}`,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: 'Access denied - bag is private' }),
                },
            ],
        };
    }
    const profileData = bag.profiles;
    const owner = (Array.isArray(profileData) ? profileData[0] : profileData);
    const items = bag.bag_items
        .sort((a, b) => (a.sort_index || 0) - (b.sort_index || 0))
        .map((item) => ({
        id: item.id,
        name: item.custom_name,
        brand: item.brand,
        description: item.custom_description,
        quantity: item.quantity,
        links: item.links,
    }));
    return {
        contents: [
            {
                uri: `teed://bags/${bagCode}`,
                mimeType: 'application/json',
                text: JSON.stringify({
                    code: bag.code,
                    title: bag.title,
                    description: bag.description,
                    category: bag.category,
                    is_public: bag.is_public,
                    is_owner: bag.owner_id === userId,
                    owner: {
                        handle: `@${owner?.handle}`,
                        display_name: owner?.display_name,
                    },
                    url: `https://teed.club/u/${owner?.handle}/${bag.code}`,
                    item_count: items.length,
                    items,
                    updated_at: bag.updated_at,
                }),
            },
        ],
    };
}
//# sourceMappingURL=index.js.map