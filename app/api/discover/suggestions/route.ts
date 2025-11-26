import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

// GET /api/discover/suggestions - Get search suggestions for autocomplete
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    // Search bags by title
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        title,
        code,
        category,
        owner:profiles!bags_owner_id_fkey(
          handle,
          display_name
        )
      `)
      .eq('is_public', true)
      .ilike('title', `%${query}%`)
      .limit(5);

    if (bagsError) {
      console.error('Error fetching bag suggestions:', bagsError);
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    // Search users by handle or display_name
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(3);

    if (usersError) {
      console.error('Error fetching user suggestions:', usersError);
    }

    // Search tags from bags
    const { data: tagBags, error: tagError } = await supabase
      .from('bags')
      .select('tags')
      .eq('is_public', true)
      .not('tags', 'is', null);

    // Extract unique tags that match the query
    const allTags = new Set<string>();
    tagBags?.forEach((bag: any) => {
      bag.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          allTags.add(tag);
        }
      });
    });
    const matchingTags = Array.from(allTags).slice(0, 5);

    // Format suggestions
    const suggestions = {
      bags: bags?.map((bag: any) => ({
        type: 'bag' as const,
        id: bag.id,
        title: bag.title,
        code: bag.code,
        category: bag.category,
        owner: bag.owner,
      })) || [],
      users: users?.map((user: any) => ({
        type: 'user' as const,
        id: user.id,
        handle: user.handle,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      })) || [],
      tags: matchingTags.map(tag => ({
        type: 'tag' as const,
        tag,
      })),
    };

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
