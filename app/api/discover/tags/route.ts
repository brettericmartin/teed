import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/discover/tags - Get popular tags across all public bags
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all public bags with their tags
    const { data: bags, error } = await supabase
      .from('bags')
      .select('tags')
      .eq('is_public', true)
      .not('tags', 'is', null);

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    bags?.forEach((bag: any) => {
      if (Array.isArray(bag.tags)) {
        bag.tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string') {
            tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1;
          }
        });
      }
    });

    // Sort by count and limit
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({ tags: sortedTags }, { status: 200 });
  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
