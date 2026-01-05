import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile/theme
 * Get the current authenticated user's profile theme
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's profile theme
    const { data: theme, error: themeError } = await supabase
      .from('profile_themes')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (themeError && themeError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is ok
      console.error('Error fetching theme:', themeError);
      return NextResponse.json(
        { error: 'Failed to fetch theme' },
        { status: 500 }
      );
    }

    // Return theme or null if not set
    return NextResponse.json(theme || null);
  } catch (error) {
    console.error('GET /api/profile/theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/theme
 * Update or create the user's profile theme
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate colors (must be valid hex colors if provided)
    const colorFields = ['primary_color', 'accent_color', 'background_color', 'text_color', 'background_gradient_start', 'background_gradient_end'];
    for (const field of colorFields) {
      const value = body[field];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return NextResponse.json(
            { error: `${field} must be a valid hex color (e.g., #FF5500)` },
            { status: 400 }
          );
        }
      }
    }

    // Validate enums
    if (body.background_type && !['solid', 'gradient', 'image'].includes(body.background_type)) {
      return NextResponse.json(
        { error: 'background_type must be one of: solid, gradient, image' },
        { status: 400 }
      );
    }

    if (body.card_style && !['elevated', 'flat', 'outlined'].includes(body.card_style)) {
      return NextResponse.json(
        { error: 'card_style must be one of: elevated, flat, outlined' },
        { status: 400 }
      );
    }

    if (body.border_radius && !['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(body.border_radius)) {
      return NextResponse.json(
        { error: 'border_radius must be one of: none, sm, md, lg, xl, 2xl, full' },
        { status: 400 }
      );
    }

    // Build update object
    const themeData = {
      profile_id: user.id,
      primary_color: body.primary_color,
      accent_color: body.accent_color,
      background_color: body.background_color,
      text_color: body.text_color,
      background_type: body.background_type,
      background_gradient_start: body.background_gradient_start,
      background_gradient_end: body.background_gradient_end,
      background_gradient_direction: body.background_gradient_direction,
      background_image_url: body.background_image_url,
      card_style: body.card_style,
      border_radius: body.border_radius,
    };

    // Remove undefined values
    Object.keys(themeData).forEach(key => {
      if ((themeData as any)[key] === undefined) {
        delete (themeData as any)[key];
      }
    });

    // Upsert theme (insert or update)
    const { data: theme, error: upsertError } = await supabase
      .from('profile_themes')
      .upsert(themeData, {
        onConflict: 'profile_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting theme:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save theme' },
        { status: 500 }
      );
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('PUT /api/profile/theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/theme
 * Reset the user's profile theme to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete user's theme
    const { error: deleteError } = await supabase
      .from('profile_themes')
      .delete()
      .eq('profile_id', user.id);

    if (deleteError) {
      console.error('Error deleting theme:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profile/theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
