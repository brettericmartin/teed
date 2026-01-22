import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';
import type {
  ProfileStoryEntry,
  ProfileStoryResponse,
  ProfileStorySettings,
  ProfileTimelineEntry,
} from '@/lib/types/profileStory';
import {
  DEFAULT_STORY_SETTINGS,
  getChangeTypeSummary,
  formatStoryDate,
} from '@/lib/types/profileStory';

/**
 * GET /api/profile/story
 * Get the authenticated user's profile story/timeline
 *
 * Query params:
 *   - limit: number (default 50, max 100)
 *   - offset: number (default 0)
 *   - include_hidden: boolean (default false)
 *   - types: comma-separated change types to filter by
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeHidden = searchParams.get('include_hidden') === 'true';
    const typesFilter = searchParams.get('types')?.split(',').filter(Boolean) || [];

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile with story_settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, created_at, story_settings')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch story settings from profiles
    const settings: ProfileStorySettings =
      (profile as any)?.story_settings || DEFAULT_STORY_SETTINGS;

    // Build query for story entries
    let query = supabase
      .from('profile_story')
      .select('*', { count: 'exact' })
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by visibility (owners can see hidden)
    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    // Filter by types if specified
    if (typesFilter.length > 0) {
      query = query.in('change_type', typesFilter);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: entries, error: entriesError, count } = await query;

    if (entriesError) {
      console.error('Error fetching profile story:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
    }

    // Build timeline from entries
    const timeline = buildProfileTimeline(entries || [], settings);

    const response: ProfileStoryResponse = {
      profile: {
        id: profile.id,
        handle: profile.handle,
        display_name: profile.display_name,
        created_at: profile.created_at,
      },
      entries: (entries || []) as ProfileStoryEntry[],
      timeline,
      settings,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/profile/story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Build timeline entries from raw database entries
 */
function buildProfileTimeline(
  entries: ProfileStoryEntry[],
  settings: ProfileStorySettings
): ProfileTimelineEntry[] {
  return entries
    .filter((entry) => {
      // Apply default visibility from settings if entry is visible
      if (entry.is_visible && !settings.defaults[entry.change_type]) {
        return false;
      }
      return true;
    })
    .map((entry) => ({
      id: entry.id,
      date: entry.created_at,
      changeType: entry.change_type,
      entityType: entry.entity_type,
      summary: entry.change_summary || getChangeTypeSummary(entry.change_type),
      isVisible: entry.is_visible,
      details: {
        entityId: entry.entity_id || undefined,
        fieldChanged: entry.field_changed || undefined,
        oldValue: entry.old_value,
        newValue: entry.new_value,
        platform:
          entry.entity_type === 'social_link' ? entry.entity_id || undefined : undefined,
        blockType:
          entry.entity_type === 'block'
            ? (entry.new_value as Record<string, unknown>)?.block_type as string
            : undefined,
      },
    }));
}
