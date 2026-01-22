import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';
import type {
  ProfileStorySettings,
  UpdateStorySettingsRequest,
} from '@/lib/types/profileStory';
import { DEFAULT_STORY_SETTINGS } from '@/lib/types/profileStory';

/**
 * GET /api/profile/story/settings
 * Get current story settings
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('story_settings')
      .eq('id', user.id)
      .single();

    const settings: ProfileStorySettings =
      profile?.story_settings || DEFAULT_STORY_SETTINGS;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/profile/story/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile/story/settings
 * Update story settings (partial update supported)
 *
 * Body: UpdateStorySettingsRequest
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateStorySettingsRequest = await request.json();

    // Get current settings from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('story_settings')
      .eq('id', user.id)
      .single();

    const currentSettings: ProfileStorySettings =
      profile?.story_settings || DEFAULT_STORY_SETTINGS;

    // Merge updates
    const updatedSettings: ProfileStorySettings = {
      ...currentSettings,
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.show_timestamps !== undefined && {
        show_timestamps: body.show_timestamps,
      }),
      ...(body.max_public_entries !== undefined && {
        max_public_entries: Math.max(0, Math.min(body.max_public_entries, 100)),
      }),
      defaults: {
        ...currentSettings.defaults,
        ...(body.defaults || {}),
      },
    };

    // Update profiles story_settings
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ story_settings: updatedSettings })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating story settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('PATCH /api/profile/story/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
