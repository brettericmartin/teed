import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/platform-stats - Public platform stats for social proof
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const [collectionsResult, itemsResult, creatorsData] = await Promise.all([
      supabase
        .from('bags')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true),
      supabase
        .from('bag_items')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('bags')
        .select('owner_id'),
    ]);

    const collections = collectionsResult.count || 0;
    const items = itemsResult.count || 0;
    const creators = new Set(creatorsData.data?.map(b => b.owner_id) || []).size;

    return NextResponse.json(
      { collections, creators, items },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300',
        },
      }
    );
  } catch (error) {
    console.error('Platform stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
