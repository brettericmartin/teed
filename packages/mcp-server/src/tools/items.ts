/**
 * Item Management Tools
 *
 * Tools for adding, updating, and removing items from bags.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { verifyBagOwnership } from '../utils/supabase.js';

export const itemTools: Tool[] = [
  {
    name: 'add_item_to_bag',
    description: 'Add a new item to a bag. Can include product details and purchase links.',
    inputSchema: {
      type: 'object',
      properties: {
        bag_code: {
          type: 'string',
          description: 'The bag to add the item to',
        },
        name: {
          type: 'string',
          description: "Product name (e.g., 'Titleist TSR3 Driver')",
        },
        brand: {
          type: 'string',
          description: "Brand name (e.g., 'Titleist', 'Apple', 'Sony')",
        },
        description: {
          type: 'string',
          description: 'Personal notes about this item',
        },
        purchase_url: {
          type: 'string',
          description: 'URL where this item can be purchased',
        },
        image_url: {
          type: 'string',
          description: 'URL to product image',
        },
        quantity: {
          type: 'integer',
          default: 1,
          description: 'Number of this item (default: 1)',
        },
      },
      required: ['bag_code', 'name'],
    },
  },
  {
    name: 'update_item',
    description: "Update an existing item's details",
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'The item ID to update',
        },
        name: {
          type: 'string',
          description: 'New name for the item',
        },
        brand: {
          type: 'string',
          description: 'New brand for the item',
        },
        description: {
          type: 'string',
          description: 'New description/notes for the item',
        },
        quantity: {
          type: 'integer',
          description: 'New quantity',
        },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'remove_item_from_bag',
    description: 'Remove an item from a bag',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'The item ID to remove',
        },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'move_item_to_bag',
    description: 'Move an item from one bag to another',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'The item ID to move',
        },
        target_bag_code: {
          type: 'string',
          description: 'The bag code to move the item to',
        },
      },
      required: ['item_id', 'target_bag_code'],
    },
  },
  {
    name: 'copy_item_to_bag',
    description: 'Copy an item (including from public bags) to one of your bags',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'The item ID to copy',
        },
        target_bag_code: {
          type: 'string',
          description: 'Your bag code to copy the item to',
        },
      },
      required: ['item_id', 'target_bag_code'],
    },
  },
];

/**
 * Handle item tool calls
 */
export async function handleItemTool(
  name: string,
  args: Record<string, unknown> | undefined,
  supabase: SupabaseClient,
  userId?: string
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case 'add_item_to_bag':
      return addItemToBag(supabase, userId, args);

    case 'update_item':
      return updateItem(supabase, userId, args);

    case 'remove_item_from_bag':
      return removeItemFromBag(supabase, userId, args);

    case 'move_item_to_bag':
      return moveItemToBag(supabase, userId, args);

    case 'copy_item_to_bag':
      return copyItemToBag(supabase, userId, args);

    default:
      return {
        content: [{ type: 'text', text: `Unknown item tool: ${name}` }],
        isError: true,
      };
  }
}

async function addItemToBag(
  supabase: SupabaseClient,
  userId: string | undefined,
  args: Record<string, unknown> | undefined
) {
  if (!userId) {
    return {
      content: [{ type: 'text', text: 'Authentication required to add items.' }],
      isError: true,
    };
  }

  const bagCode = args?.bag_code as string;
  const name = args?.name as string;

  if (!bagCode || !name) {
    return {
      content: [{ type: 'text', text: 'bag_code and name are required' }],
      isError: true,
    };
  }

  // Verify bag ownership
  const bag = await verifyBagOwnership(supabase, bagCode, userId);
  if (!bag) {
    return {
      content: [{ type: 'text', text: `Bag '${bagCode}' not found or access denied.` }],
      isError: true,
    };
  }

  // Get current max sort_index
  const { data: maxIndexData } = await supabase
    .from('bag_items')
    .select('sort_index')
    .eq('bag_id', bag.id)
    .order('sort_index', { ascending: false })
    .limit(1)
    .single();

  const nextSortIndex = (maxIndexData?.sort_index ?? -1) + 1;

  // Insert the item
  const { data: item, error } = await supabase
    .from('bag_items')
    .insert({
      bag_id: bag.id,
      custom_name: name,
      brand: args?.brand as string | undefined,
      custom_description: args?.description as string | undefined,
      quantity: (args?.quantity as number) || 1,
      sort_index: nextSortIndex,
    })
    .select()
    .single();

  if (error) {
    return {
      content: [{ type: 'text', text: `Error adding item: ${error.message}` }],
      isError: true,
    };
  }

  // If there's a purchase URL, add it as a link
  const purchaseUrl = args?.purchase_url as string | undefined;
  if (purchaseUrl) {
    await supabase.from('links').insert({
      item_id: item.id,
      url: purchaseUrl,
      kind: 'buy',
      label: 'Buy',
    });
  }

  // Get updated item count
  const { count } = await supabase
    .from('bag_items')
    .select('*', { count: 'exact', head: true })
    .eq('bag_id', bag.id);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            item: {
              id: item.id,
              name: item.custom_name,
              brand: item.brand,
              bag_code: bagCode,
            },
            bag_item_count: count || 0,
            message: `Added ${name} to your bag.`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function updateItem(
  supabase: SupabaseClient,
  userId: string | undefined,
  args: Record<string, unknown> | undefined
) {
  if (!userId) {
    return {
      content: [{ type: 'text', text: 'Authentication required to update items.' }],
      isError: true,
    };
  }

  const itemId = args?.item_id as string;
  if (!itemId) {
    return {
      content: [{ type: 'text', text: 'item_id is required' }],
      isError: true,
    };
  }

  // Verify item ownership through bag
  const { data: item, error: fetchError } = await supabase
    .from('bag_items')
    .select('id, bag_id, bags!inner(owner_id)')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return {
      content: [{ type: 'text', text: 'Item not found.' }],
      isError: true,
    };
  }

  const bagData = item.bags;
  const bagOwner = (Array.isArray(bagData) ? bagData[0]?.owner_id : (bagData as Record<string, unknown>)?.owner_id);
  if (bagOwner !== userId) {
    return {
      content: [{ type: 'text', text: 'Access denied. You can only update items in your own bags.' }],
      isError: true,
    };
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (args?.name) updates.custom_name = args.name;
  if (args?.brand !== undefined) updates.brand = args.brand;
  if (args?.description !== undefined) updates.custom_description = args.description;
  if (args?.quantity !== undefined) updates.quantity = args.quantity;

  if (Object.keys(updates).length === 0) {
    return {
      content: [{ type: 'text', text: 'No fields to update.' }],
      isError: true,
    };
  }

  const { error } = await supabase.from('bag_items').update(updates).eq('id', itemId);

  if (error) {
    return {
      content: [{ type: 'text', text: `Error updating item: ${error.message}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Item updated.',
            updated_fields: Object.keys(updates),
          },
          null,
          2
        ),
      },
    ],
  };
}

async function removeItemFromBag(
  supabase: SupabaseClient,
  userId: string | undefined,
  args: Record<string, unknown> | undefined
) {
  if (!userId) {
    return {
      content: [{ type: 'text', text: 'Authentication required to remove items.' }],
      isError: true,
    };
  }

  const itemId = args?.item_id as string;
  if (!itemId) {
    return {
      content: [{ type: 'text', text: 'item_id is required' }],
      isError: true,
    };
  }

  // Verify item ownership through bag
  const { data: item, error: fetchError } = await supabase
    .from('bag_items')
    .select('id, custom_name, bag_id, bags!inner(owner_id)')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return {
      content: [{ type: 'text', text: 'Item not found.' }],
      isError: true,
    };
  }

  const bagData = item.bags;
  const bagOwner = (Array.isArray(bagData) ? bagData[0]?.owner_id : (bagData as Record<string, unknown>)?.owner_id);
  if (bagOwner !== userId) {
    return {
      content: [{ type: 'text', text: 'Access denied. You can only remove items from your own bags.' }],
      isError: true,
    };
  }

  const { error } = await supabase.from('bag_items').delete().eq('id', itemId);

  if (error) {
    return {
      content: [{ type: 'text', text: `Error removing item: ${error.message}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: `Removed '${item.custom_name}' from bag.`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function moveItemToBag(
  supabase: SupabaseClient,
  userId: string | undefined,
  args: Record<string, unknown> | undefined
) {
  if (!userId) {
    return {
      content: [{ type: 'text', text: 'Authentication required to move items.' }],
      isError: true,
    };
  }

  const itemId = args?.item_id as string;
  const targetBagCode = args?.target_bag_code as string;

  if (!itemId || !targetBagCode) {
    return {
      content: [{ type: 'text', text: 'item_id and target_bag_code are required' }],
      isError: true,
    };
  }

  // Verify item ownership
  const { data: item, error: fetchError } = await supabase
    .from('bag_items')
    .select('id, custom_name, bags!inner(owner_id)')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return {
      content: [{ type: 'text', text: 'Item not found.' }],
      isError: true,
    };
  }

  const bagData = item.bags;
  const bagOwner = (Array.isArray(bagData) ? bagData[0]?.owner_id : (bagData as Record<string, unknown>)?.owner_id);
  if (bagOwner !== userId) {
    return {
      content: [{ type: 'text', text: 'Access denied. You can only move items from your own bags.' }],
      isError: true,
    };
  }

  // Verify target bag ownership
  const targetBag = await verifyBagOwnership(supabase, targetBagCode, userId);
  if (!targetBag) {
    return {
      content: [{ type: 'text', text: `Target bag '${targetBagCode}' not found or access denied.` }],
      isError: true,
    };
  }

  // Move the item
  const { error } = await supabase.from('bag_items').update({ bag_id: targetBag.id }).eq('id', itemId);

  if (error) {
    return {
      content: [{ type: 'text', text: `Error moving item: ${error.message}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: `Moved '${item.custom_name}' to '${targetBagCode}'.`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function copyItemToBag(
  supabase: SupabaseClient,
  userId: string | undefined,
  args: Record<string, unknown> | undefined
) {
  if (!userId) {
    return {
      content: [{ type: 'text', text: 'Authentication required to copy items.' }],
      isError: true,
    };
  }

  const itemId = args?.item_id as string;
  const targetBagCode = args?.target_bag_code as string;

  if (!itemId || !targetBagCode) {
    return {
      content: [{ type: 'text', text: 'item_id and target_bag_code are required' }],
      isError: true,
    };
  }

  // Get source item (can be from public bag)
  const { data: sourceItem, error: fetchError } = await supabase
    .from('bag_items')
    .select('*, bags!inner(is_public, owner_id)')
    .eq('id', itemId)
    .single();

  if (fetchError || !sourceItem) {
    return {
      content: [{ type: 'text', text: 'Item not found.' }],
      isError: true,
    };
  }

  // Check if source bag is public or owned by user
  const sourceBag = sourceItem.bags as Record<string, unknown>;
  if (!sourceBag.is_public && sourceBag.owner_id !== userId) {
    return {
      content: [{ type: 'text', text: 'Access denied. Item is from a private bag.' }],
      isError: true,
    };
  }

  // Verify target bag ownership
  const targetBag = await verifyBagOwnership(supabase, targetBagCode, userId);
  if (!targetBag) {
    return {
      content: [{ type: 'text', text: `Target bag '${targetBagCode}' not found or access denied.` }],
      isError: true,
    };
  }

  // Get next sort index
  const { data: maxIndexData } = await supabase
    .from('bag_items')
    .select('sort_index')
    .eq('bag_id', targetBag.id)
    .order('sort_index', { ascending: false })
    .limit(1)
    .single();

  const nextSortIndex = (maxIndexData?.sort_index ?? -1) + 1;

  // Copy the item
  const { data: newItem, error: insertError } = await supabase
    .from('bag_items')
    .insert({
      bag_id: targetBag.id,
      custom_name: sourceItem.custom_name,
      brand: sourceItem.brand,
      custom_description: sourceItem.custom_description,
      quantity: sourceItem.quantity,
      catalog_item_id: sourceItem.catalog_item_id,
      sort_index: nextSortIndex,
    })
    .select()
    .single();

  if (insertError) {
    return {
      content: [{ type: 'text', text: `Error copying item: ${insertError.message}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            item: {
              id: newItem.id,
              name: newItem.custom_name,
              brand: newItem.brand,
            },
            message: `Copied '${sourceItem.custom_name}' to '${targetBagCode}'.`,
          },
          null,
          2
        ),
      },
    ],
  };
}
