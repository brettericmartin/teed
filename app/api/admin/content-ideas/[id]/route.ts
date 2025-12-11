import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type { UpdateContentIdeaRequest, ExtractedLink } from '@/lib/types/contentIdeas';
import { extractBrandFromProductName } from '@/lib/brandKnowledge';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/content-ideas/[id]
 * Get a single content idea with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    // Fetch related bag if available
    let primaryBag = null;
    if (data.primary_bag_id) {
      const { data: bag } = await supabaseAdmin
        .from('bags')
        .select('id, code, title, owner_id')
        .eq('id', data.primary_bag_id)
        .single();

      if (bag) {
        const { data: owner } = await supabaseAdmin
          .from('profiles')
          .select('id, handle, display_name')
          .eq('id', bag.owner_id)
          .single();

        primaryBag = {
          ...bag,
          owner: owner || { id: bag.owner_id, handle: 'unknown', display_name: 'Unknown' },
        };
      }
    }

    return NextResponse.json({
      ...data,
      primaryBag,
    });
  } catch (error) {
    console.error('Get content idea error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/content-ideas/[id]
 * Update a content idea
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body: UpdateContentIdeaRequest = await request.json();

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const allowedFields = [
      'idea_title',
      'idea_summary',
      'tags',
      'status',
      'primary_bag_id',
      'vertical',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field as keyof UpdateContentIdeaRequest];
      }
    }

    if (body.status === 'approved') {
      updates.approved_at = new Date().toISOString();
      updates.created_by_admin_id = admin.id;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('content_ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating content idea:', updateError);
      return NextResponse.json({ error: 'Failed to update content idea' }, { status: 500 });
    }

    await logAdminAction(admin, 'content.flag', 'content_ideas', id, {
      action: 'update',
      fields_updated: Object.keys(updates),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update content idea error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/content-ideas/[id]
 * Delete a content idea
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('id, source_url, idea_title')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('content_ideas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting content idea:', deleteError);
      return NextResponse.json({ error: 'Failed to delete content idea' }, { status: 500 });
    }

    await logAdminAction(admin, 'content.delete', 'content_ideas', id, {
      source_url: existing.source_url,
      idea_title: existing.idea_title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete content idea error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/content-ideas/[id]?action=create-bag
 * Create a bag from content idea's description links
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'create-bag') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: idea, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !idea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    // Get data from source metadata
    const youtube = idea.source_metadata?.youtube;
    const extractedLinks = idea.source_metadata?.extractedLinks || [];
    const videoTitle = youtube?.title || idea.idea_title || 'Untitled';
    const creatorName = idea.source_channel_name || 'Unknown Creator';

    // Filter to links with product hints
    const productLinks = extractedLinks.filter(
      (link: ExtractedLink) => link.productHint || link.label
    );

    console.log(`[CreateBag] Creating bag from ${productLinks.length} links`);

    // Create bag
    const bagTitle = `${creatorName}'s Setup`;
    const bagDescription = `📺 Source: [${videoTitle}](${idea.source_url}) by ${creatorName}`;

    // Generate unique code from title (same logic as /api/bags)
    let baseCode = bagTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    if (!baseCode) {
      baseCode = 'bag';
    }

    let code = baseCode;
    let suffix = 2;

    while (suffix < 100) {
      const { data: existingBag } = await supabaseAdmin
        .from('bags')
        .select('id')
        .eq('owner_id', admin.id)
        .eq('code', code)
        .maybeSingle();

      if (!existingBag) break;
      code = `${baseCode}-${suffix}`;
      suffix++;
    }

    const { data: newBag, error: bagError } = await supabaseAdmin
      .from('bags')
      .insert({
        owner_id: admin.id,
        code,
        title: bagTitle,
        description: bagDescription,
        category: idea.vertical || null,
        is_public: false,
        tags: idea.tags || [],
        // Note: cover_photo_id requires a media_asset, not a URL
        // TODO: Upload thumbnail to storage and create media_asset
      })
      .select('id, code')
      .single();

    if (bagError) {
      console.error('[CreateBag] Error:', bagError);
      return NextResponse.json({ error: 'Failed to create bag', details: bagError.message }, { status: 500 });
    }

    // Create items from product links
    const createdItems: Array<{ id: string; name: string }> = [];
    let linksCreated = 0;

    // Add source video as first item
    if (idea.source_url && youtube?.title) {
      const { data: videoItem } = await supabaseAdmin
        .from('bag_items')
        .insert({
          bag_id: newBag.id,
          custom_name: youtube.title,
          custom_description: 'Source video',
          brand: creatorName,
          sort_index: 0,
          is_featured: false,
        })
        .select('id')
        .single();

      if (videoItem) {
        await supabaseAdmin.from('links').insert({
          bag_item_id: videoItem.id,
          url: idea.source_url,
          kind: 'youtube',
          label: 'Watch Video',
          is_auto_generated: true,
        });
        linksCreated++;
      }
    }

    // Create items from each product link
    for (let i = 0; i < productLinks.length; i++) {
      const link = productLinks[i];
      const fullName = link.productHint || link.label || `Product ${i + 1}`;

      // Extract brand from product name (e.g., "Sony FX3" → brand: "Sony", name: "FX3")
      const { brand, productName } = extractBrandFromProductName(fullName);

      const { data: newItem, error: itemError } = await supabaseAdmin
        .from('bag_items')
        .insert({
          bag_id: newBag.id,
          custom_name: productName,
          brand: brand || undefined,
          sort_index: i + 1,
          is_featured: i === 0,
        })
        .select('id')
        .single();

      if (itemError) continue;

      if (newItem) {
        createdItems.push({ id: newItem.id, name: productName });

        const { error: linkError } = await supabaseAdmin.from('links').insert({
          bag_item_id: newItem.id,
          url: link.url,
          kind: link.domain.includes('amazon') ? 'amazon' : 'website',
          label: link.label || 'Buy',
          is_auto_generated: true,
        });
        if (!linkError) linksCreated++;
      }
    }

    // Set hero item
    if (createdItems.length > 0) {
      await supabaseAdmin
        .from('bags')
        .update({ hero_item_id: createdItems[0].id })
        .eq('id', newBag.id);
    }

    // Link content idea to bag
    await supabaseAdmin
      .from('content_ideas')
      .update({ primary_bag_id: newBag.id })
      .eq('id', id);

    await logAdminAction(admin, 'content.flag', 'content_ideas', id, {
      action: 'create_bag',
      bag_id: newBag.id,
      bag_code: newBag.code,
      items_created: createdItems.length,
      links_created: linksCreated,
    });

    return NextResponse.json({
      success: true,
      bag: newBag,
      itemsCreated: createdItems.length,
      linksCreated,
      message: `Created bag with ${createdItems.length} items`,
    });
  } catch (error) {
    console.error('Content idea action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
