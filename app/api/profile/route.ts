import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile
 * Get the current authenticated user's profile
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

    // Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update the current authenticated user's profile
 * Accepts: { display_name?, bio?, handle?, social_links?, avatar_url? }
 */
export async function PATCH(request: NextRequest) {
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
    const { display_name, bio, handle, social_links, avatar_url } = body;

    // Validate input
    const updates: any = {};

    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Display name is required' },
          { status: 400 }
        );
      }
      if (display_name.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be 50 characters or less' },
          { status: 400 }
        );
      }
      updates.display_name = display_name.trim();
    }

    if (bio !== undefined) {
      if (bio !== null && typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string' },
          { status: 400 }
        );
      }
      if (bio && bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be 500 characters or less' },
          { status: 400 }
        );
      }
      updates.bio = bio ? bio.trim() : null;
    }

    if (social_links !== undefined) {
      if (social_links !== null && typeof social_links !== 'object') {
        return NextResponse.json(
          { error: 'Social links must be an object' },
          { status: 400 }
        );
      }

      // Validate social links structure
      const allowedPlatforms = [
        'instagram', 'twitter', 'youtube', 'tiktok', 'website', 'twitch',
        'facebook', 'threads', 'pinterest', 'snapchat', 'discord',
        'telegram', 'whatsapp', 'email', 'spotify', 'soundcloud',
        'patreon', 'github', 'linkedin', 'behance', 'dribbble', 'substack'
      ];
      if (social_links) {
        for (const [platform, value] of Object.entries(social_links)) {
          if (!allowedPlatforms.includes(platform)) {
            return NextResponse.json(
              { error: `Invalid social platform: ${platform}` },
              { status: 400 }
            );
          }
          if (typeof value !== 'string') {
            return NextResponse.json(
              { error: `Social link value for ${platform} must be a string` },
              { status: 400 }
            );
          }
        }
      }

      updates.social_links = social_links || {};
    }

    if (handle !== undefined) {
      if (typeof handle !== 'string' || handle.trim().length === 0) {
        return NextResponse.json(
          { error: 'Handle is required' },
          { status: 400 }
        );
      }

      const cleanHandle = handle.trim().toLowerCase();

      // Validate handle format (3-30 chars, lowercase alphanumeric + underscore)
      if (cleanHandle.length < 3 || cleanHandle.length > 30) {
        return NextResponse.json(
          { error: 'Handle must be between 3 and 30 characters' },
          { status: 400 }
        );
      }

      if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
        return NextResponse.json(
          { error: 'Handle can only contain lowercase letters, numbers, and underscores' },
          { status: 400 }
        );
      }

      // Check if handle is already taken by another user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', cleanHandle)
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Handle is already taken' },
          { status: 409 }
        );
      }

      updates.handle = cleanHandle;
    }

    if (avatar_url !== undefined) {
      if (avatar_url !== null && typeof avatar_url !== 'string') {
        return NextResponse.json(
          { error: 'Avatar URL must be a string' },
          { status: 400 }
        );
      }
      updates.avatar_url = avatar_url;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('PATCH /api/profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
