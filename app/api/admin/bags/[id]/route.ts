import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi, checkPermission } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/bags/[id]
 * Get single bag details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: bag, error } = await supabase
    .from('bags')
    .select(
      `
      *,
      profiles!bags_owner_id_fkey (
        id,
        handle,
        display_name
      ),
      bag_items!bag_items_bag_id_fkey (
        id,
        title,
        brand,
        photo_url
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !bag) {
    return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
  }

  return NextResponse.json({ bag });
}

/**
 * PATCH /api/admin/bags/[id]
 * Update bag moderation status (feature, flag, hide)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;
  const { admin } = result;

  const { id } = await params;
  const body = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get current bag state
  const { data: currentBag, error: fetchError } = await supabase
    .from('bags')
    .select('id, title, code, category, is_featured, is_flagged, is_hidden, is_spotlight, flag_reason, owner_id')
    .eq('id', id)
    .single();

  if (fetchError || !currentBag) {
    return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
  }

  // Build update object based on action
  const updates: Record<string, unknown> = {};
  let action: string | null = null;
  const details: Record<string, unknown> = {
    bag_id: id,
    bag_title: currentBag.title,
    bag_code: currentBag.code,
  };

  // Handle feature action
  if ('is_featured' in body) {
    // Only admin+ can feature
    if (!checkPermission(admin, 'canHideContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to feature bags' },
        { status: 403 }
      );
    }

    // Use new category if provided, otherwise use current category
    const targetCategory = body.category || currentBag.category;

    // If featuring, unfeature other bags in the same category (only one featured per category)
    if (body.is_featured && targetCategory) {
      await supabase
        .from('bags')
        .update({ is_featured: false, featured_at: null })
        .eq('category', targetCategory)
        .eq('is_featured', true)
        .neq('id', id);
    }

    updates.is_featured = body.is_featured;
    updates.featured_at = body.is_featured ? new Date().toISOString() : null;
    action = body.is_featured ? 'content.feature' : 'content.unfeature';
    details.previous_featured = currentBag.is_featured;
    details.new_featured = body.is_featured;
    details.category = targetCategory;
  }

  // Handle flag action
  if ('is_flagged' in body) {
    if (!checkPermission(admin, 'canFlagContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to flag bags' },
        { status: 403 }
      );
    }
    updates.is_flagged = body.is_flagged;
    updates.flag_reason = body.is_flagged ? body.flag_reason || null : null;
    action = body.is_flagged ? 'content.flag' : 'content.unflag';
    details.previous_flagged = currentBag.is_flagged;
    details.new_flagged = body.is_flagged;
    details.flag_reason = body.flag_reason;
  }

  // Handle hide action
  if ('is_hidden' in body) {
    if (!checkPermission(admin, 'canHideContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to hide bags' },
        { status: 403 }
      );
    }
    updates.is_hidden = body.is_hidden;
    action = body.is_hidden ? 'content.hide' : 'content.restore';
    details.previous_hidden = currentBag.is_hidden;
    details.new_hidden = body.is_hidden;
  }

  // Handle spotlight action
  if ('is_spotlight' in body) {
    if (!checkPermission(admin, 'canHideContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to set spotlight' },
        { status: 403 }
      );
    }

    // Use new category if provided, otherwise use current category
    const targetCategory = body.category || currentBag.category;

    // If setting as spotlight, first remove spotlight from other bags in same category
    if (body.is_spotlight && targetCategory) {
      await supabase
        .from('bags')
        .update({ is_spotlight: false, is_featured: false })
        .eq('category', targetCategory)
        .eq('is_spotlight', true)
        .neq('id', id);
    }

    updates.is_spotlight = body.is_spotlight;
    action = body.is_spotlight ? 'content.spotlight' : 'content.unspotlight';
    details.previous_spotlight = currentBag.is_spotlight;
    details.new_spotlight = body.is_spotlight;
    details.category = targetCategory;
  }

  // Handle public/private toggle
  if ('is_public' in body) {
    if (!checkPermission(admin, 'canHideContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change visibility' },
        { status: 403 }
      );
    }
    updates.is_public = body.is_public;
  }

  // Handle category update
  if ('category' in body) {
    if (!checkPermission(admin, 'canHideContent')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change category' },
        { status: 403 }
      );
    }
    updates.category = body.category;
    details.previous_category = currentBag.category;
    details.new_category = body.category;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  // Perform update
  const { data: updatedBag, error: updateError } = await supabase
    .from('bags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating bag:', updateError);
    return NextResponse.json({ error: 'Failed to update bag' }, { status: 500 });
  }

  // Log admin action
  if (action) {
    await logAdminAction(admin, action as Parameters<typeof logAdminAction>[1], 'bag', id, details);
  }

  return NextResponse.json({ bag: updatedBag });
}

/**
 * DELETE /api/admin/bags/[id]
 * Permanently delete a bag (super_admin/admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  if (!checkPermission(admin, 'canDeleteContent')) {
    return NextResponse.json(
      { error: 'Insufficient permissions to delete bags' },
      { status: 403 }
    );
  }

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get bag info for logging
  const { data: bag, error: fetchError } = await supabase
    .from('bags')
    .select('id, title, code, owner_id')
    .eq('id', id)
    .single();

  if (fetchError || !bag) {
    return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
  }

  // Delete the bag (cascades to items, links, etc.)
  const { error: deleteError } = await supabase.from('bags').delete().eq('id', id);

  if (deleteError) {
    console.error('Error deleting bag:', deleteError);
    return NextResponse.json({ error: 'Failed to delete bag' }, { status: 500 });
  }

  // Log admin action
  await logAdminAction(admin, 'content.delete', 'bag', id, {
    bag_title: bag.title,
    bag_code: bag.code,
    owner_id: bag.owner_id,
  });

  return NextResponse.json({ success: true });
}
