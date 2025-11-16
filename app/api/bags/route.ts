import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

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

    // Generate a unique code from title
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

    // Try to insert with generated code, add suffix if collision
    let code = baseCode;
    let attempts = 0;
    let bag = null;

    while (attempts < 10 && !bag) {
      const { data, error } = await supabase
        .from('bags')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          is_public,
          code,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation on code
        if (error.code === '23505' && error.message.includes('code')) {
          // Code collision, try with a suffix
          attempts++;
          const randomSuffix = Math.floor(Math.random() * 1000);
          code = `${baseCode}-${randomSuffix}`;
          continue;
        }

        // Other error
        console.error('Error creating bag:', error);
        return NextResponse.json(
          { error: 'Failed to create bag', details: error.message },
          { status: 500 }
        );
      }

      bag = data;
    }

    if (!bag) {
      return NextResponse.json(
        { error: 'Failed to generate unique code after multiple attempts' },
        { status: 500 }
      );
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
