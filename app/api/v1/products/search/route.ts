import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, v1Headers } from '@/lib/api/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/v1/products/search?q=Sony+A7IV&limit=20
 *
 * Public product context API for AI agents.
 * Returns all public bags containing a product, with why_chosen,
 * compared_to, alternatives, and paired items.
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

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Search query (q) is required' },
      { status: 400, headers: v1Headers() }
    );
  }

  const searchTerm = query.trim();

  try {
    // Search items in public bags
    const { data: items, error } = await supabase
      .from('bag_items')
      .select(`
        id,
        custom_name,
        brand,
        custom_description,
        why_chosen,
        compared_to,
        alternatives,
        specs,
        price_paid,
        photo_url,
        bag_id,
        bags!inner (
          id,
          code,
          title,
          category,
          description,
          is_public,
          profiles!bags_owner_id_fkey (
            handle,
            display_name
          )
        )
      `)
      .eq('bags.is_public', true)
      .or(`custom_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Product search error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500, headers: v1Headers() }
      );
    }

    // Build product context response
    const results = (items || []).map((item) => {
      const bag = item.bags as any;
      const profile = bag.profiles;

      // Get sibling items in the same bag (paired items)
      return {
        product: {
          name: item.custom_name,
          brand: item.brand,
          description: item.custom_description,
          photo_url: item.photo_url,
          price_paid: item.price_paid,
          specs: item.specs,
        },
        context: {
          why_chosen: item.why_chosen,
          compared_to: item.compared_to,
          alternatives: item.alternatives,
        },
        bag: {
          title: bag.title,
          category: bag.category,
          description: bag.description,
          url: `https://teed.club/u/${profile.handle}/${bag.code}`,
        },
        curator: {
          handle: profile.handle,
          display_name: profile.display_name,
          profile_url: `https://teed.club/u/${profile.handle}`,
        },
      };
    });

    // Compute aggregate stats
    const uniqueBags = new Set(results.map((r) => r.bag.url));
    const uniqueCurators = new Set(results.map((r) => r.curator.handle));
    const withContext = results.filter((r) => r.context.why_chosen);

    return NextResponse.json(
      {
        query: searchTerm,
        total: results.length,
        stats: {
          bags_containing: uniqueBags.size,
          curators: uniqueCurators.size,
          with_why_chosen: withContext.length,
        },
        results,
      },
      { headers: v1Headers() }
    );
  } catch (err) {
    console.error('Unexpected error in product search:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: v1Headers() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: v1Headers() });
}
