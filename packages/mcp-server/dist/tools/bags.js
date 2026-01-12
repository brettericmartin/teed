"use strict";
/**
 * Bag Management Tools
 *
 * Tools for creating, reading, updating, and deleting gear bags.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bagTools = void 0;
exports.handleBagTool = handleBagTool;
const supabase_js_1 = require("../utils/supabase.js");
exports.bagTools = [
    {
        name: 'list_my_bags',
        description: 'Get all bags owned by the authenticated user with item counts',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    description: 'Filter by category (optional)',
                },
                include_private: {
                    type: 'boolean',
                    default: true,
                    description: 'Include private bags in results',
                },
            },
        },
    },
    {
        name: 'get_bag',
        description: 'Get detailed information about a specific bag including all items',
        inputSchema: {
            type: 'object',
            properties: {
                bag_code: {
                    type: 'string',
                    description: "The bag's URL code (e.g., 'tournament-ready')",
                },
            },
            required: ['bag_code'],
        },
    },
    {
        name: 'create_bag',
        description: 'Create a new gear bag for the authenticated user',
        inputSchema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: "Name of the bag (e.g., 'Tournament Golf Bag', 'Travel Tech Kit')",
                },
                description: {
                    type: 'string',
                    description: "Optional description explaining the bag's purpose",
                },
                category: {
                    type: 'string',
                    enum: [
                        'golf',
                        'travel',
                        'tech',
                        'camping',
                        'photography',
                        'fitness',
                        'cooking',
                        'music',
                        'art',
                        'gaming',
                        'other',
                    ],
                    description: 'Category for organization and discovery',
                },
                is_public: {
                    type: 'boolean',
                    default: true,
                    description: 'Whether the bag is visible to others',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'update_bag',
        description: "Update a bag's title, description, or visibility",
        inputSchema: {
            type: 'object',
            properties: {
                bag_code: {
                    type: 'string',
                    description: 'The bag code to update',
                },
                title: {
                    type: 'string',
                    description: 'New title for the bag',
                },
                description: {
                    type: 'string',
                    description: 'New description for the bag',
                },
                category: {
                    type: 'string',
                    description: 'New category for the bag',
                },
                is_public: {
                    type: 'boolean',
                    description: 'Whether the bag is visible to others',
                },
            },
            required: ['bag_code'],
        },
    },
    {
        name: 'delete_bag',
        description: 'Permanently delete a bag and all its items. Use with caution.',
        inputSchema: {
            type: 'object',
            properties: {
                bag_code: {
                    type: 'string',
                    description: 'The bag code to delete',
                },
                confirm: {
                    type: 'boolean',
                    description: 'Must be true to confirm deletion',
                },
            },
            required: ['bag_code', 'confirm'],
        },
    },
];
/**
 * Handle bag tool calls
 */
async function handleBagTool(name, args, supabase, userId) {
    switch (name) {
        case 'list_my_bags':
            return listMyBags(supabase, userId, args);
        case 'get_bag':
            return getBag(supabase, userId, args);
        case 'create_bag':
            return createBag(supabase, userId, args);
        case 'update_bag':
            return updateBag(supabase, userId, args);
        case 'delete_bag':
            return deleteBag(supabase, userId, args);
        default:
            return {
                content: [{ type: 'text', text: `Unknown bag tool: ${name}` }],
                isError: true,
            };
    }
}
async function listMyBags(supabase, userId, args) {
    if (!userId) {
        return {
            content: [{ type: 'text', text: 'Authentication required to list your bags.' }],
            isError: true,
        };
    }
    const category = args?.category;
    const includePrivate = args?.include_private !== false;
    let query = supabase
        .from('bags')
        .select(`
      id,
      code,
      title,
      description,
      category,
      is_public,
      created_at,
      updated_at,
      bag_items (count)
    `)
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });
    if (category) {
        query = query.eq('category', category);
    }
    if (!includePrivate) {
        query = query.eq('is_public', true);
    }
    const { data, error } = await query;
    if (error) {
        return {
            content: [{ type: 'text', text: `Error fetching bags: ${error.message}` }],
            isError: true,
        };
    }
    const bags = (data || []).map((bag) => ({
        code: bag.code,
        title: bag.title,
        description: bag.description,
        category: bag.category,
        is_public: bag.is_public,
        item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
        updated_at: bag.updated_at,
    }));
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    count: bags.length,
                    bags,
                }, null, 2),
            },
        ],
    };
}
async function getBag(supabase, userId, args) {
    const bagCode = args?.bag_code;
    if (!bagCode) {
        return {
            content: [{ type: 'text', text: 'bag_code is required' }],
            isError: true,
        };
    }
    const bag = await (0, supabase_js_1.getBagByCode)(supabase, bagCode, userId);
    if (!bag) {
        return {
            content: [{ type: 'text', text: `Bag '${bagCode}' not found or access denied.` }],
            isError: true,
        };
    }
    // Format the response
    const profileData = bag.profiles;
    const owner = (Array.isArray(profileData) ? profileData[0] : profileData);
    const items = bag.bag_items.map((item) => {
        const catalogItem = item.catalog_item;
        return {
            id: item.id,
            name: item.custom_name || catalogItem?.name,
            brand: item.brand || catalogItem?.brand,
            description: item.custom_description || catalogItem?.description,
            quantity: item.quantity,
            image_url: catalogItem?.image_url,
            links: item.links,
        };
    });
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    bag: {
                        code: bag.code,
                        title: bag.title,
                        description: bag.description,
                        category: bag.category,
                        is_public: bag.is_public,
                        url: `https://teed.club/u/${owner?.handle}/${bag.code}`,
                        owner: {
                            handle: owner?.handle,
                            display_name: owner?.display_name,
                        },
                        item_count: items.length,
                        items,
                        updated_at: bag.updated_at,
                    },
                }, null, 2),
            },
        ],
    };
}
async function createBag(supabase, userId, args) {
    if (!userId) {
        return {
            content: [{ type: 'text', text: 'Authentication required to create a bag.' }],
            isError: true,
        };
    }
    const title = args?.title;
    if (!title) {
        return {
            content: [{ type: 'text', text: 'title is required' }],
            isError: true,
        };
    }
    // Generate a unique code
    let code = (0, supabase_js_1.generateBagCode)(title);
    let suffix = 0;
    // Check for existing codes and add suffix if needed
    while (true) {
        const checkCode = suffix > 0 ? `${code}-${suffix}` : code;
        const { data: existing } = await supabase
            .from('bags')
            .select('id')
            .eq('owner_id', userId)
            .eq('code', checkCode)
            .single();
        if (!existing) {
            code = checkCode;
            break;
        }
        suffix++;
    }
    // Get user handle for URL
    const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', userId)
        .single();
    const { data: bag, error } = await supabase
        .from('bags')
        .insert({
        owner_id: userId,
        title,
        code,
        description: args?.description,
        category: args?.category,
        is_public: args?.is_public !== false,
    })
        .select()
        .single();
    if (error) {
        return {
            content: [{ type: 'text', text: `Error creating bag: ${error.message}` }],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    bag: {
                        code: bag.code,
                        title: bag.title,
                        url: `https://teed.club/u/${profile?.handle}/${bag.code}`,
                        item_count: 0,
                    },
                    message: `Created '${title}' bag. Ready to add items.`,
                }, null, 2),
            },
        ],
    };
}
async function updateBag(supabase, userId, args) {
    if (!userId) {
        return {
            content: [{ type: 'text', text: 'Authentication required to update a bag.' }],
            isError: true,
        };
    }
    const bagCode = args?.bag_code;
    if (!bagCode) {
        return {
            content: [{ type: 'text', text: 'bag_code is required' }],
            isError: true,
        };
    }
    // Verify ownership
    const bag = await (0, supabase_js_1.verifyBagOwnership)(supabase, bagCode, userId);
    if (!bag) {
        return {
            content: [{ type: 'text', text: `Bag '${bagCode}' not found or access denied.` }],
            isError: true,
        };
    }
    // Build update object
    const updates = {};
    if (args?.title)
        updates.title = args.title;
    if (args?.description !== undefined)
        updates.description = args.description;
    if (args?.category)
        updates.category = args.category;
    if (args?.is_public !== undefined)
        updates.is_public = args.is_public;
    if (Object.keys(updates).length === 0) {
        return {
            content: [{ type: 'text', text: 'No fields to update.' }],
            isError: true,
        };
    }
    const { error } = await supabase.from('bags').update(updates).eq('id', bag.id);
    if (error) {
        return {
            content: [{ type: 'text', text: `Error updating bag: ${error.message}` }],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `Updated '${bagCode}' bag.`,
                    updated_fields: Object.keys(updates),
                }, null, 2),
            },
        ],
    };
}
async function deleteBag(supabase, userId, args) {
    if (!userId) {
        return {
            content: [{ type: 'text', text: 'Authentication required to delete a bag.' }],
            isError: true,
        };
    }
    const bagCode = args?.bag_code;
    const confirm = args?.confirm;
    if (!bagCode) {
        return {
            content: [{ type: 'text', text: 'bag_code is required' }],
            isError: true,
        };
    }
    if (!confirm) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Deletion requires confirm: true. This will permanently delete the bag and all its items.',
                },
            ],
            isError: true,
        };
    }
    // Verify ownership
    const bag = await (0, supabase_js_1.verifyBagOwnership)(supabase, bagCode, userId);
    if (!bag) {
        return {
            content: [{ type: 'text', text: `Bag '${bagCode}' not found or access denied.` }],
            isError: true,
        };
    }
    const { error } = await supabase.from('bags').delete().eq('id', bag.id);
    if (error) {
        return {
            content: [{ type: 'text', text: `Error deleting bag: ${error.message}` }],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `Deleted '${bagCode}' bag and all its items.`,
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=bags.js.map