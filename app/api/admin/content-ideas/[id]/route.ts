import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import { generateHooksAndLongForm, generateShortFormFromLongForm, detectVideoContentType } from '@/lib/contentIdeas/generation';
import type { ContentIdea, UpdateContentIdeaRequest } from '@/lib/types/contentIdeas';

// Use service role for database operations
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
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = await params;

    // Fetch content idea
    const { data, error } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    // Fetch related data if available
    let primaryBag = null;
    let primaryCatalogItem = null;
    let heroCatalogItems: unknown[] = [];
    let createdByAdmin = null;

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

    if (data.primary_catalog_item_id) {
      const { data: item } = await supabaseAdmin
        .from('catalog_items')
        .select('id, brand, model, category_id, image_url')
        .eq('id', data.primary_catalog_item_id)
        .single();

      if (item) {
        primaryCatalogItem = item;
      }
    }

    if (data.hero_catalog_item_ids && Array.isArray(data.hero_catalog_item_ids) && data.hero_catalog_item_ids.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('catalog_items')
        .select('id, brand, model, category_id, image_url')
        .in('id', data.hero_catalog_item_ids);

      heroCatalogItems = items || [];
    }

    if (data.created_by_admin_id) {
      const { data: adminUser } = await supabaseAdmin
        .from('profiles')
        .select('id, handle, display_name')
        .eq('id', data.created_by_admin_id)
        .single();

      createdByAdmin = adminUser;
    }

    // Return enriched content idea
    const enrichedIdea = {
      ...data,
      primaryBag,
      primaryCatalogItem,
      heroCatalogItems,
      createdByAdmin,
    };

    return NextResponse.json(enrichedIdea);
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
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body: UpdateContentIdeaRequest = await request.json();

    // Verify content idea exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    const allowedFields = [
      'idea_title',
      'idea_summary',
      'why_interesting_to_creator',
      'why_interesting_to_audience',
      'hook_options',
      'long_form_outline',
      'short_form_ideas',
      'tags',
      'affiliate_notes',
      'status',
      'primary_bag_id',
      'primary_catalog_item_id',
      'hero_catalog_item_ids',
      'hero_bag_item_ids',
      'vertical',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field as keyof UpdateContentIdeaRequest];
      }
    }

    // Handle status transitions
    if (body.status) {
      if (body.status === 'in_review' && existing.status === 'new') {
        updates.reviewed_at = new Date().toISOString();
      }
      if (body.status === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.created_by_admin_id = admin.id;
      }
    }

    // Update content idea
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

    // Log admin action
    await logAdminAction(admin, 'content.flag', 'content_ideas', id, {
      action: 'update',
      fields_updated: Object.keys(updates),
      old_status: existing.status,
      new_status: body.status || existing.status,
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
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;

    // Verify content idea exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('id, source_url, idea_title')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    // Delete content idea
    const { error: deleteError } = await supabaseAdmin
      .from('content_ideas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting content idea:', deleteError);
      return NextResponse.json({ error: 'Failed to delete content idea' }, { status: 500 });
    }

    // Log admin action
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
 * POST /api/admin/content-ideas/[id]?action=regenerate
 * Regenerate hooks/outline for a content idea
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'regenerate' && action !== 'create-bag') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch content idea
    const { data: idea, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !idea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    if (action === 'regenerate') {
      // Regenerate hooks and outline
      const hooksOutput = await generateHooksAndLongForm(idea as ContentIdea, []);
      const shortFormOutput = await generateShortFormFromLongForm(
        hooksOutput.long_form_outline || {
          intro: '',
          creatorStory: '',
          heroBreakdown: '',
          bagContext: '',
          cta: '',
        },
        [],
        idea.vertical || 'other'
      );

      // Update content idea
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('content_ideas')
        .update({
          hook_options: hooksOutput.hook_options,
          long_form_outline: hooksOutput.long_form_outline,
          short_form_ideas: shortFormOutput.short_form_ideas,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating regenerated content:', updateError);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
      }

      // Log admin action
      await logAdminAction(admin, 'content.flag', 'content_ideas', id, {
        action: 'regenerate',
        hooks_generated: hooksOutput.hook_options?.length || 0,
        short_form_generated: shortFormOutput.short_form_ideas?.length || 0,
      });

      return NextResponse.json(updated);
    }

    if (action === 'create-bag') {
      // Get extracted products and video info
      const products = idea.extracted_products || [];
      const youtube = idea.source_metadata?.youtube;
      const extractedLinks = idea.source_metadata?.extractedLinks || [];

      // Detect video content type to determine bag structure
      const videoTitle = youtube?.title || idea.idea_title || '';
      const videoDescription = youtube?.description || '';
      const contentType = detectVideoContentType(videoTitle, videoDescription, products.length);

      // Sort products by hero score (highest first)
      const sortedProducts = [...products].sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0));

      // For single_hero videos, only the top item is the "main" item
      // Others are just "also mentioned" in the description
      const isSingleHero = contentType === 'single_hero';
      const heroProduct = sortedProducts[0]; // The main focus item
      const alsoMentioned = isSingleHero ? sortedProducts.slice(1) : [];

      // Build rich description with video context
      const descriptionParts = [];
      if (idea.idea_summary) {
        descriptionParts.push(idea.idea_summary);
      }
      if (youtube?.title) {
        descriptionParts.push(`\nBased on: "${youtube.title}" by ${idea.source_channel_name || 'Unknown'}`);
      }
      if (idea.source_url) {
        descriptionParts.push(`\nSource: ${idea.source_url}`);
      }

      // For single-hero videos, add "also mentioned" items to description
      if (isSingleHero && alsoMentioned.length > 0) {
        const mentionedNames = alsoMentioned
          .slice(0, 5) // Max 5 mentions
          .map(p => p.brand ? `${p.brand} ${p.name}` : p.name);
        descriptionParts.push(`\nAlso mentioned: ${mentionedNames.join(', ')}`);
      }

      // Create a new bag from this content idea
      const { data: newBag, error: bagError } = await supabaseAdmin
        .from('bags')
        .insert({
          owner_id: admin.id,
          title: idea.idea_title || `${idea.source_channel_name}'s Setup`,
          description: descriptionParts.join('\n'),
          category: idea.vertical || null,
          is_public: false, // Start as private draft
          tags: idea.tags || [],
        })
        .select('id, code')
        .single();

      if (bagError) {
        console.error('Error creating bag:', bagError);
        return NextResponse.json({ error: 'Failed to create bag' }, { status: 500 });
      }

      // Create items from extracted products
      const createdItems: Array<{ id: string; name: string; brand: string | null; isHero: boolean; isVideo?: boolean }> = [];
      const itemLinkMap: Map<string, string[]> = new Map(); // item id -> link URLs

      // First, create the source video as an item
      if (idea.source_url && youtube?.title) {
        const { data: videoItem, error: videoItemError } = await supabaseAdmin
          .from('bag_items')
          .insert({
            bag_id: newBag.id,
            custom_name: youtube.title,
            custom_description: 'Source video for this collection',
            brand: idea.source_channel_name || null,
            notes: `Channel: ${idea.source_channel_name || 'Unknown'}\nPublished: ${youtube.publishedAt ? new Date(youtube.publishedAt).toLocaleDateString() : 'Unknown'}`,
            sort_index: 0,
            is_featured: false,
          })
          .select('id')
          .single();

        if (!videoItemError && videoItem) {
          createdItems.push({
            id: videoItem.id,
            name: youtube.title,
            brand: idea.source_channel_name || null,
            isHero: false,
            isVideo: true,
          });
          // Add the YouTube link
          itemLinkMap.set(videoItem.id, [idea.source_url]);
        }
      }

      // Try to match extracted links to products
      const linkProductMatches = new Map<string, string[]>();
      for (const link of extractedLinks) {
        if (link.productHint || link.label) {
          const hint = (link.productHint || link.label || '').toLowerCase();
          for (const product of products) {
            const productName = product.name.toLowerCase();
            const brandName = (product.brand || '').toLowerCase();
            if (hint.includes(productName) || hint.includes(brandName) ||
                productName.includes(hint) || (brandName && hint.includes(brandName))) {
              const existing = linkProductMatches.get(product.name) || [];
              existing.push(link.url);
              linkProductMatches.set(product.name, existing);
              break;
            }
          }
        }
      }

      // Determine which products to create as items
      // Single hero: just the hero + maybe 2-3 notable supporting items
      // Roundup/comparison: all items
      let productsToCreate = sortedProducts;
      if (isSingleHero) {
        // For single hero: create the hero item + up to 2 high-scoring supporting items
        const heroItems = sortedProducts.filter(p => p === heroProduct);
        const supportingItems = sortedProducts
          .filter(p => p !== heroProduct && (p.heroScore || 0) >= 40)
          .slice(0, 2);
        productsToCreate = [...heroItems, ...supportingItems];
      }

      for (let i = 0; i < productsToCreate.length; i++) {
        const product = productsToCreate[i];
        const isHeroItem = product === heroProduct;

        // Build item notes from product context
        const notesParts: string[] = [];

        // For single-hero videos, mark supporting items clearly
        if (isSingleHero && !isHeroItem) {
          notesParts.push('📎 Also mentioned in video');
        }

        if (product.mentionContext) {
          notesParts.push(product.mentionContext);
        }
        if (product.storySignals && product.storySignals.length > 0) {
          notesParts.push(`Story signals: ${product.storySignals.join(', ')}`);
        }

        const { data: newItem, error: itemError } = await supabaseAdmin
          .from('bag_items')
          .insert({
            bag_id: newBag.id,
            custom_name: product.name,
            custom_description: product.category || null,
            brand: product.brand || null,
            notes: notesParts.join('\n') || null,
            sort_index: i + 1, // Start at 1, video is at 0
            is_featured: isHeroItem, // Only hero item is featured in single-hero videos
          })
          .select('id')
          .single();

        if (itemError) {
          console.error('Error creating item:', itemError, product);
          continue;
        }

        if (newItem) {
          createdItems.push({
            id: newItem.id,
            name: product.name,
            brand: product.brand || null,
            isHero: isHeroItem,
          });

          // Add any matched links
          const matchedLinks = linkProductMatches.get(product.name);
          if (matchedLinks) {
            itemLinkMap.set(newItem.id, matchedLinks);
          }
        }
      }

      // Create links for items
      let linksCreated = 0;
      for (const [itemId, urls] of itemLinkMap) {
        for (const url of urls) {
          const { error: linkError } = await supabaseAdmin.from('links').insert({
            bag_item_id: itemId,
            url,
            kind: url.includes('amazon') ? 'amazon' : url.includes('youtube') ? 'youtube' : 'website',
            label: 'Source Link',
            is_auto_generated: true,
          });

          if (!linkError) {
            linksCreated++;
          }
        }
      }

      // Set hero item
      const heroItem = createdItems.find(i => i.isHero);
      if (heroItem) {
        await supabaseAdmin
          .from('bags')
          .update({ hero_item_id: heroItem.id })
          .eq('id', newBag.id);
      }

      // Update content idea with bag reference
      await supabaseAdmin
        .from('content_ideas')
        .update({
          primary_bag_id: newBag.id,
        })
        .eq('id', id);

      // Log admin action
      await logAdminAction(admin, 'content.flag', 'content_ideas', id, {
        action: 'create_bag',
        bag_id: newBag.id,
        bag_code: newBag.code,
        content_type: contentType,
        items_created: createdItems.length,
        links_created: linksCreated,
        hero_item: heroItem?.name || null,
      });

      return NextResponse.json({
        success: true,
        bag: newBag,
        contentType,
        itemsCreated: createdItems.length,
        heroItem: heroItem ? { name: heroItem.name, brand: heroItem.brand } : null,
        linksCreated,
        message: isSingleHero
          ? `Created bag focused on "${heroItem?.name}" with ${createdItems.length - 1} supporting items`
          : `Created bag with ${createdItems.length} items and ${linksCreated} links`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Content idea action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
