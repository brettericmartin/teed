import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';
import { ProfileBlock } from '@/lib/blocks/types';

/**
 * GET /api/profile/blocks
 * Get the current authenticated user's profile blocks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's profile blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('profile_blocks')
      .select('*')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: true });

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
      return NextResponse.json(
        { error: 'Failed to fetch blocks' },
        { status: 500 }
      );
    }

    // Map snake_case database columns to camelCase for grid fields
    const mappedBlocks = (blocks || []).map((block: any) => ({
      ...block,
      gridX: block.grid_x ?? 0,
      gridY: block.grid_y ?? 0,
      gridW: block.grid_w ?? 12,
      gridH: block.grid_h ?? 2,
    }));

    return NextResponse.json(mappedBlocks);
  } catch (error) {
    console.error('GET /api/profile/blocks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/blocks
 * Replace all blocks for the current user's profile
 * This is used for bulk save after editing
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { blocks } = body as { blocks: ProfileBlock[] };

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'Blocks must be an array' },
        { status: 400 }
      );
    }

    // Validate each block belongs to this user
    for (const block of blocks) {
      if (block.profile_id !== user.id) {
        return NextResponse.json(
          { error: 'Cannot modify blocks for another user' },
          { status: 403 }
        );
      }
    }

    // Delete existing blocks and insert new ones in a transaction
    // First, delete all existing blocks
    const { error: deleteError } = await supabase
      .from('profile_blocks')
      .delete()
      .eq('profile_id', user.id);

    if (deleteError) {
      console.error('Error deleting blocks:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update blocks' },
        { status: 500 }
      );
    }

    // Insert new blocks if any
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        id: block.id,
        profile_id: user.id,
        block_type: block.block_type,
        sort_order: index,
        is_visible: block.is_visible,
        width: block.width || 'full',
        // Grid layout fields
        grid_x: block.gridX ?? 0,
        grid_y: block.gridY ?? index * 2,
        grid_w: block.gridW ?? 12,
        grid_h: block.gridH ?? 2,
        config: block.config,
      }));

      const { error: insertError } = await supabase
        .from('profile_blocks')
        .insert(blocksToInsert);

      if (insertError) {
        console.error('Error inserting blocks:', insertError);
        return NextResponse.json(
          { error: 'Failed to save blocks' },
          { status: 500 }
        );
      }
    }

    // Enable blocks for this profile if not already
    await supabase
      .from('profiles')
      .update({ blocks_enabled: true })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/profile/blocks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/blocks
 * Add a single block to the user's profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { block_type, config, is_visible = true, width = 'full', gridX, gridY, gridW, gridH } = body;

    if (!block_type) {
      return NextResponse.json(
        { error: 'block_type is required' },
        { status: 400 }
      );
    }

    // Get the current max sort_order
    const { data: maxOrderResult } = await supabase
      .from('profile_blocks')
      .select('sort_order')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderResult?.sort_order ?? -1) + 1;

    // Insert the new block
    const { data: newBlock, error: insertError } = await supabase
      .from('profile_blocks')
      .insert({
        profile_id: user.id,
        block_type,
        sort_order: nextSortOrder,
        is_visible,
        width,
        // Grid layout fields
        grid_x: gridX ?? 0,
        grid_y: gridY ?? nextSortOrder * 2,
        grid_w: gridW ?? 12,
        grid_h: gridH ?? 2,
        config: config || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting block:', insertError);
      return NextResponse.json(
        { error: 'Failed to create block' },
        { status: 500 }
      );
    }

    // Map snake_case to camelCase for grid fields
    const mappedBlock = {
      ...newBlock,
      gridX: newBlock.grid_x ?? 0,
      gridY: newBlock.grid_y ?? 0,
      gridW: newBlock.grid_w ?? 12,
      gridH: newBlock.grid_h ?? 2,
    };

    return NextResponse.json(mappedBlock);
  } catch (error) {
    console.error('POST /api/profile/blocks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
