import { NextRequest, NextResponse } from 'next/server';
import { authenticateGptRequest } from '@/lib/gptAuth';

/**
 * GET /api/gpt/bags
 * List all bags owned by the authenticated user
 */
export async function GET() {
  console.log('GET /api/gpt/bags called');
  try {
    const { user, supabase, error: authError } = await authenticateGptRequest();

    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get user's profile for handle
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single();

    // Fetch user's bags with item count
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        description,
        category,
        is_public,
        created_at,
        updated_at
      `)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (bagsError) {
      console.error('Error fetching user bags:', bagsError);
      return NextResponse.json(
        { error: 'Failed to fetch bags' },
        { status: 500 }
      );
    }

    // Get item counts for each bag
    const bagIds = (bags || []).map(b => b.id);
    let itemCounts: Record<string, number> = {};

    if (bagIds.length > 0) {
      const { data: counts } = await supabase
        .from('bag_items')
        .select('bag_id')
        .in('bag_id', bagIds);

      if (counts) {
        counts.forEach(item => {
          itemCounts[item.bag_id] = (itemCounts[item.bag_id] || 0) + 1;
        });
      }
    }

    // Format bags with item count and URL
    const formattedBags = (bags || []).map(bag => ({
      id: bag.id,
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_public: bag.is_public,
      item_count: itemCounts[bag.id] || 0,
      url: profile?.handle ? `https://teed.club/u/${profile.handle}/${bag.code}` : null,
      created_at: bag.created_at,
      updated_at: bag.updated_at,
    }));

    return NextResponse.json({ bags: formattedBags });
  } catch (error) {
    console.error('Unexpected error in GET /api/gpt/bags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gpt/bags
 * Create a new bag for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await authenticateGptRequest();

    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized. Please sign in to your Teed account.' },
        { status: 401 }
      );
    }

    // Get user's profile for handle
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single();

    // Parse request body
    const body = await request.json();
    const { title, description, category, is_public = true } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate category if provided
    const allowedCategories = [
      'golf', 'travel', 'tech', 'camping', 'photography',
      'fitness', 'cooking', 'music', 'art', 'gaming', 'other'
    ];
    if (category && !allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${allowedCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique code from title
    let baseCode = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    if (!baseCode) baseCode = 'bag';

    // Check for existing codes
    let code = baseCode;
    let suffix = 2;

    while (true) {
      const { data: existingBag } = await supabase
        .from('bags')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (!existingBag) break;

      code = `${baseCode}-${suffix}`;
      suffix++;

      if (suffix > 100) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    }

    // Insert the bag
    const { data: bag, error } = await supabase
      .from('bags')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        is_public,
        code,
        tags: [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bag:', error);
      return NextResponse.json(
        { error: 'Failed to create bag', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: bag.id,
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_public: bag.is_public,
      url: profile?.handle ? `https://teed.club/u/${profile.handle}/${bag.code}` : null,
      message: `Bag "${bag.title}" created successfully!`,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/gpt/bags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
