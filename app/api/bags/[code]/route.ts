import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/bags/[code]
 * Get a bag by its code, including all items and their links
 *
 * Returns:
 * {
 *   id: uuid
 *   code: string
 *   title: string
 *   description: string
 *   is_public: boolean
 *   owner_id: uuid
 *   background_image: string | null
 *   created_at: string
 *   updated_at: string | null
 *   items: Array<{
 *     id: uuid
 *     custom_name: string | null
 *     custom_description: string | null
 *     quantity: number
 *     sort_index: number
 *     notes: string | null
 *     links: Array<{
 *       id: uuid
 *       url: string
 *       kind: string
 *       label: string | null
 *       metadata: object | null
 *     }>
 *   }>
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get the bag by code
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('*')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check if user has access to this bag
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isOwner = user?.id === bag.owner_id;
    const isPublic = bag.is_public === true;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Get all items in this bag
    const { data: items, error: itemsError } = await supabase
      .from('bag_items')
      .select('*')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching bag items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch bag items' },
        { status: 500 }
      );
    }

    // Get all links for these items
    const itemIds = items?.map((item) => item.id) || [];
    let links: any[] = [];

    if (itemIds.length > 0) {
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .in('bag_item_id', itemIds);

      if (linksError) {
        console.error('Error fetching links:', linksError);
        // Continue without links rather than failing
      } else {
        links = linksData || [];
      }
    }

    // Get photo URLs for items that have custom_photo_id
    const photoIds = items
      ?.map((item) => item.custom_photo_id)
      .filter((id): id is string => id !== null) || [];

    let photoUrls: Record<string, string> = {};

    if (photoIds.length > 0) {
      const { data: mediaAssets, error: mediaError } = await supabase
        .from('media_assets')
        .select('id, url')
        .in('id', photoIds);

      if (mediaError) {
        console.error('Error fetching media assets:', mediaError);
        // Continue without photos rather than failing
      } else {
        // Create a map of media asset ID -> URL
        photoUrls = (mediaAssets || []).reduce((acc, asset) => {
          acc[asset.id] = asset.url;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Organize links by item and include photo URL
    const itemsWithLinks = (items || []).map((item: any) => {
      const photoUrl = item.custom_photo_id ? photoUrls[item.custom_photo_id] || null : null;

      return {
        ...item,
        photo_url: photoUrl,
        links: links.filter((link) => link.bag_item_id === item.id),
      };
    });

    // Debug logging
    console.log(`GET /api/bags/${code} - Items with photos:`, itemsWithLinks.map(i => ({
      name: i.custom_name,
      custom_photo_id: i.custom_photo_id,
      has_photo_url: !!i.photo_url
    })));

    // Return bag with items and links
    return NextResponse.json({
      ...bag,
      items: itemsWithLinks,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bags/[code]
 * Update a bag
 *
 * Body:
 * {
 *   title?: string
 *   description?: string
 *   is_public?: boolean
 *   background_image?: string
 * }
 *
 * Returns: Updated bag object
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag to verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.is_public !== undefined) {
      updates.is_public = Boolean(body.is_public);
    }

    if (body.background_image !== undefined) {
      updates.background_image = body.background_image?.trim() || null;
    }

    // Always update updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update the bag
    const { data: updatedBag, error: updateError } = await supabase
      .from('bags')
      .update(updates)
      .eq('id', bag.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating bag:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bag' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBag);
  } catch (error) {
    console.error('Unexpected error in PUT /api/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bags/[code]
 * Delete a bag (cascade deletes items and links)
 *
 * Returns: { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag to verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the bag (cascade will handle items and links)
    const { error: deleteError } = await supabase
      .from('bags')
      .delete()
      .eq('id', bag.id);

    if (deleteError) {
      console.error('Error deleting bag:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/bags/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
