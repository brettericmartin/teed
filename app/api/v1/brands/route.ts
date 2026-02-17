import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, v1Headers } from '@/lib/api/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/v1/brands
 *
 * Returns all brands with item counts from public bags.
 * Lets AI agents check what Teed has context for.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. 60 requests per minute.' },
      { status: 429, headers: { ...v1Headers(), 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    // Get all items from public bags with brand info
    const { data: items, error } = await supabase
      .from('bag_items')
      .select(`
        brand,
        why_chosen,
        bags!inner (
          is_public
        )
      `)
      .eq('bags.is_public', true)
      .not('brand', 'is', null)
      .neq('brand', '');

    if (error) {
      console.error('Brands query error:', error);
      return NextResponse.json(
        { error: 'Query failed' },
        { status: 500, headers: v1Headers() }
      );
    }

    // Aggregate by brand
    const brandMap = new Map<string, { count: number; with_context: number }>();
    for (const item of items || []) {
      const brand = item.brand!.trim();
      const existing = brandMap.get(brand) || { count: 0, with_context: 0 };
      existing.count++;
      if (item.why_chosen) existing.with_context++;
      brandMap.set(brand, existing);
    }

    // Sort by count descending
    const brands = Array.from(brandMap.entries())
      .map(([name, stats]) => ({
        name,
        item_count: stats.count,
        with_context: stats.with_context,
      }))
      .sort((a, b) => b.item_count - a.item_count);

    return NextResponse.json(
      {
        total: brands.length,
        brands,
      },
      { headers: v1Headers() }
    );
  } catch (err) {
    console.error('Unexpected error in brands:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: v1Headers() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: v1Headers() });
}
