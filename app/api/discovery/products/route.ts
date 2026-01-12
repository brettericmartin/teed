/**
 * Discovery Products API
 *
 * Get discovered products for review.
 * GET /api/discovery/products?status=pending&category=golf&limit=50
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidCategory, getAllCategories } from '@/lib/discovery';
import type { DiscoveryCategory } from '@/lib/discovery';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'archived', 'all'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}`, validStatuses },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && category !== 'all' && !isValidCategory(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}`, validCategories: getAllCategories() },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
      .from('discovered_products')
      .select(`
        id,
        product_name,
        brand,
        description,
        why_notable,
        source_link,
        image_url,
        confidence,
        specs,
        price_range,
        product_links,
        buy_url,
        review_status,
        reviewed_at,
        review_notes,
        created_at,
        source:discovery_sources!inner(
          id,
          source_url,
          source_title,
          source_type,
          category,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('review_status', status);
    }

    // Filter by category (via source join)
    if (category && category !== 'all') {
      query = query.eq('source.category', category);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('[Discovery Products API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform response with both link types:
    // 1. source.url = where we discovered it (YouTube/article)
    // 2. productLinks/buyUrl = where to purchase
    const transformedProducts = (products || []).map((p: any) => ({
      id: p.id,
      name: p.product_name,
      brand: p.brand,
      description: p.description,
      whyNotable: p.why_notable,
      sourceLink: p.source_link,
      imageUrl: p.image_url,
      confidence: p.confidence,
      specs: p.specs,
      priceRange: p.price_range,
      productLinks: p.product_links || [],
      buyUrl: p.buy_url,
      reviewStatus: p.review_status,
      reviewedAt: p.reviewed_at,
      reviewNotes: p.review_notes,
      createdAt: p.created_at,
      // Source where the product was discovered (YouTube, TikTok, article)
      source: p.source ? {
        id: p.source.id,
        url: p.source.source_url,
        title: p.source.source_title,
        type: p.source.source_type,
        category: p.source.category,
        creatorName: p.source.metadata?.creatorName,
        viewCount: p.source.metadata?.viewCount,
      } : null,
    }));

    // Get counts by status for this category
    let countsQuery = supabase
      .from('discovered_products')
      .select('review_status, source:discovery_sources!inner(category)');

    if (category && category !== 'all') {
      countsQuery = countsQuery.eq('source.category', category);
    }

    const { data: allProducts } = await countsQuery;

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      archived: 0,
      total: 0,
    };

    for (const p of allProducts || []) {
      statusCounts.total++;
      const s = (p as any).review_status as keyof typeof statusCounts;
      if (s in statusCounts) {
        statusCounts[s]++;
      }
    }

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        offset,
        limit,
        total: statusCounts.total,
      },
      statusCounts,
    });
  } catch (error) {
    console.error('[Discovery Products API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
