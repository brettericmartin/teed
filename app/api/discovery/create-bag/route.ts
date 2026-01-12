/**
 * Create Bag from Approved Products API
 *
 * Creates a curated bag from approved discovered products.
 * POST /api/discovery/create-bag
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/adminAuth';
import {
  curateResearchResults,
  createBagInDatabase,
  getTeedUserId,
} from '@/lib/discovery/agents/curationAgent';
import { isValidCategory } from '@/lib/discovery';
import type { DiscoveryCategory, ResearchResult, DiscoveredProduct } from '@/lib/discovery';

export async function POST(request: Request) {
  try {
    // Verify admin access
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, title, description, productIds } = body;

    // Validate category
    if (!isValidCategory(category)) {
      return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get @teed user
    const teedUserId = await getTeedUserId(supabase);
    if (!teedUserId) {
      return NextResponse.json({ error: '@teed user not found' }, { status: 500 });
    }

    // Get approved products (either specific IDs or all approved for category)
    let query = supabase
      .from('discovered_products')
      .select(`
        *,
        source:discovery_sources!inner(*)
      `)
      .eq('review_status', 'approved');

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      query = query.eq('source.category', category);
    }

    const { data: approvedProducts, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!approvedProducts || approvedProducts.length === 0) {
      return NextResponse.json(
        { error: 'No approved products found for this category' },
        { status: 400 }
      );
    }

    console.log(`[Create Bag] Found ${approvedProducts.length} approved products for ${category}`);

    // Group products by source to build ResearchResult structure
    const sourceMap = new Map<string, {
      source: any;
      products: DiscoveredProduct[];
    }>();

    for (const p of approvedProducts) {
      const sourceId = p.source.id;
      if (!sourceMap.has(sourceId)) {
        sourceMap.set(sourceId, {
          source: p.source,
          products: [],
        });
      }
      sourceMap.get(sourceId)!.products.push({
        name: p.product_name,
        brand: p.brand || '',
        description: p.description || '',
        whyNotable: p.why_notable || '',
        confidence: p.confidence,
        specs: p.specs,
        priceRange: p.price_range,
        sourceLink: p.source_link,
        imageUrl: p.image_url,
        productLinks: p.product_links || [],
        buyUrl: p.buy_url,
      });
    }

    // Convert to ResearchResult format
    const researchResults: ResearchResult[] = Array.from(sourceMap.values()).map(({ source, products }) => ({
      category: source.category as DiscoveryCategory,
      sourceType: source.source_type,
      sourceUrl: source.source_url,
      sourceTitle: source.source_title || 'Unknown Source',
      sourceThumbnail: source.metadata?.thumbnail,
      products,
      theme: source.metadata?.theme || `Trending in ${category}`,
      creatorName: source.metadata?.creatorName,
      viewCount: source.metadata?.viewCount,
      discoveredAt: new Date(source.created_at),
    }));

    // Curate results into bags
    const bags = await curateResearchResults(researchResults, category as DiscoveryCategory);

    if (bags.length === 0) {
      return NextResponse.json(
        { error: 'Could not create bag - not enough items with images' },
        { status: 400 }
      );
    }

    // Override title/description if provided
    const bag = bags[0];
    if (title) bag.title = title;
    if (description) bag.description = description;

    // Create bag in database
    const bagId = await createBagInDatabase(bag, teedUserId, supabase);

    if (!bagId) {
      return NextResponse.json({ error: 'Failed to create bag in database' }, { status: 500 });
    }

    // Mark products as added to bag
    const productIdsToUpdate = approvedProducts.map(p => p.id);
    await supabase
      .from('discovered_products')
      .update({
        added_to_bag_id: bagId,
        review_status: 'archived', // Move to archived after adding to bag
      })
      .in('id', productIdsToUpdate);

    // Get the created bag details
    const { data: createdBag } = await supabase
      .from('bags')
      .select('id, code, title')
      .eq('id', bagId)
      .single();

    return NextResponse.json({
      success: true,
      bag: {
        id: bagId,
        code: createdBag?.code,
        title: createdBag?.title,
        itemCount: bag.items.length,
      },
      message: `Created bag with ${bag.items.length} items`,
      url: `/u/teed/${createdBag?.code}`,
    });
  } catch (error) {
    console.error('[Create Bag API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
