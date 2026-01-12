/**
 * Discovery Library Gaps API
 *
 * GET /api/discovery/gaps - List library gaps
 * POST /api/discovery/gaps/resolve - Resolve a gap
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidCategory, getAllCategories } from '@/lib/discovery';
import type { DiscoveryCategory } from '@/lib/discovery';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'mention_count';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

    // Build query
    let query = supabase
      .from('discovery_library_gaps')
      .select('*', { count: 'exact' });

    // Filter by category
    if (category && category !== 'all') {
      if (!isValidCategory(category)) {
        return NextResponse.json(
          { error: `Invalid category: ${category}`, validCategories: getAllCategories() },
          { status: 400 }
        );
      }
      query = query.eq('category', category);
    }

    // Filter by resolved status
    if (resolved === 'true') {
      query = query.eq('resolved', true);
    } else if (resolved === 'false') {
      query = query.eq('resolved', false);
    }

    // Sort
    const validSortFields = ['mention_count', 'last_seen_at', 'first_seen_at', 'product_name', 'brand'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'mention_count';
    query = query.order(sortField, { ascending: sortOrder });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Gaps API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const gaps = (data || []).map((g) => ({
      id: g.id,
      productName: g.product_name,
      brand: g.brand,
      category: g.category,
      mentionCount: g.mention_count,
      sourceUrls: g.source_urls || [],
      firstSeenAt: g.first_seen_at,
      lastSeenAt: g.last_seen_at,
      resolved: g.resolved,
      resolvedAt: g.resolved_at,
      resolvedCatalogId: g.resolved_catalog_id,
    }));

    // Get summary statistics
    const { data: statsData } = await supabase
      .from('discovery_library_gaps')
      .select('category, resolved, mention_count, brand')
      .eq('resolved', false);

    const stats = {
      totalUnresolved: statsData?.length || 0,
      totalMentions: statsData?.reduce((sum, g) => sum + g.mention_count, 0) || 0,
      byCategory: {} as Record<string, number>,
      topBrands: [] as { brand: string; count: number }[],
    };

    if (statsData) {
      // Count by category
      for (const g of statsData) {
        stats.byCategory[g.category] = (stats.byCategory[g.category] || 0) + 1;
      }

      // Count by brand
      const brandCounts = new Map<string, number>();
      for (const g of statsData) {
        const brand = g.brand || 'Unknown';
        brandCounts.set(brand, (brandCounts.get(brand) || 0) + g.mention_count);
      }
      stats.topBrands = [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([brand, count]) => ({ brand, count }));
    }

    return NextResponse.json({
      gaps,
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error('[Gaps API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, gapId, catalogItemId } = body;

    if (action === 'resolve') {
      if (!gapId) {
        return NextResponse.json({ error: 'gapId is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('discovery_library_gaps')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_catalog_id: catalogItemId || null,
        })
        .eq('id', gapId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Gap resolved' });
    }

    if (action === 'dismiss') {
      if (!gapId) {
        return NextResponse.json({ error: 'gapId is required' }, { status: 400 });
      }

      // Mark as resolved without a catalog match (dismissed)
      const { error } = await supabase
        .from('discovery_library_gaps')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', gapId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Gap dismissed' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Gaps API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
