import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { checkCollectionBadges } from '@/lib/badges';


/**
 * POST /api/bags
 * Create a new bag
 *
 * Body:
 * {
 *   title: string (required)
 *   description?: string
 *   is_public?: boolean (default: true)
 * }
 *
 * Returns:
 * {
 *   id: uuid
 *   code: string
 *   title: string
 *   description: string
 *   is_public: boolean
 *   owner_id: uuid
 *   created_at: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, is_public = true } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Generate a unique code from title (scoped to user)
    // Convert to lowercase, replace spaces/special chars with hyphens
    let baseCode = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length

    if (!baseCode) {
      baseCode = 'bag';
    }

    // Check for existing codes globally (bags_code_key is a global unique constraint)
    let code = baseCode;
    let suffix = 2;

    while (true) {
      const { data: existingBag } = await supabase
        .from('bags')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (!existingBag) {
        // Code is unique globally
        break;
      }

      // Code exists, try with suffix
      code = `${baseCode}-${suffix}`;
      suffix++;

      if (suffix > 100) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    }

    // Insert the bag with the unique code
    // Explicitly set tags to empty array to satisfy tags_is_array constraint
    const { data: bag, error } = await supabase
      .from('bags')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
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

    if (!bag) {
      return NextResponse.json(
        { error: 'Failed to create bag' },
        { status: 500 }
      );
    }

    // Check and award collection badges (non-blocking)
    const { count: bagCount } = await supabase
      .from('bags')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (bagCount) {
      // Fire and forget - don't block the response
      checkCollectionBadges(user.id, bagCount).catch((err) => {
        console.error('[Badges] Error checking collection badges:', err);
      });
    }

    return NextResponse.json(bag, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/bags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
