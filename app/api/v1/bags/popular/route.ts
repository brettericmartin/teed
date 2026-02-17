import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, v1Headers } from '@/lib/api/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/v1/bags/popular?category=golf&limit=10
 *
 * Returns the richest public bags ranked by item count and why_chosen density.
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
  const category = searchParams.get('category');
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

  try {
    let query = supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        description,
        category,
        updated_at,
        profiles!bags_owner_id_fkey (
          handle,
          display_name
        ),
        bag_items (
          id,
          custom_name,
          brand,
          why_chosen
        )
      `)
      .eq('is_public', true)
      .eq('is_hidden', false)
      .order('updated_at', { ascending: false })
      .limit(100); // Fetch more to sort by richness

    if (category) {
      query = query.eq('category', category);
    }

    const { data: bags, error } = await query;

    if (error) {
      console.error('Popular bags error:', error);
      return NextResponse.json(
        { error: 'Query failed' },
        { status: 500, headers: v1Headers() }
      );
    }

    // Score and rank bags by richness
    const scored = (bags || [])
      .map((bag) => {
        const items = bag.bag_items || [];
        const itemCount = items.length;
        const whyChosenCount = items.filter((i: any) => i.why_chosen).length;
        const contextDensity = itemCount > 0 ? whyChosenCount / itemCount : 0;
        // Score: item count * (1 + context density) to reward both size and context
        const score = itemCount * (1 + contextDensity);
        const profile = bag.profiles as any;

        return {
          title: bag.title,
          description: bag.description,
          category: bag.category,
          url: `https://teed.club/u/${profile.handle}/${bag.code}`,
          curator: {
            handle: profile.handle,
            display_name: profile.display_name,
          },
          stats: {
            item_count: itemCount,
            why_chosen_count: whyChosenCount,
            context_density: Math.round(contextDensity * 100),
          },
          updated_at: bag.updated_at,
          _score: score,
        };
      })
      .filter((b) => b.stats.item_count > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...rest }) => rest);

    return NextResponse.json(
      {
        category: category || 'all',
        total: scored.length,
        bags: scored,
      },
      { headers: v1Headers() }
    );
  } catch (err) {
    console.error('Unexpected error in popular bags:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: v1Headers() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: v1Headers() });
}
