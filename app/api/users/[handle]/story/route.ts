import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type {
  ProfileStoryEntry,
  ProfileStorySettings,
  ProfileTimelineEntry,
} from '@/lib/types/profileStory';
import { DEFAULT_STORY_SETTINGS, getChangeTypeSummary } from '@/lib/types/profileStory';

type RouteParams = {
  params: Promise<{ handle: string }>;
};

/**
 * GET /api/users/[handle]/story
 * Get public profile story/timeline for any user
 * Only returns visible entries
 *
 * Query params:
 *   - limit: number (default 50, max 100)
 *   - offset: number (default 0)
 *   - types: comma-separated change types to filter by
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = await params;
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const typesFilter =
      searchParams.get('types')?.split(',').filter(Boolean) || [];

    // Fetch profile by handle (including story_settings)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, created_at, story_settings')
      .eq('handle', handle)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get story settings from profile
    const settings: ProfileStorySettings =
      (profile as any)?.story_settings || DEFAULT_STORY_SETTINGS;

    // Check if story is enabled
    if (!settings.enabled) {
      return NextResponse.json({
        profile: {
          id: profile.id,
          handle: profile.handle,
          display_name: profile.display_name,
          created_at: profile.created_at,
        },
        entries: [],
        timeline: [],
        settings: { enabled: false, show_timestamps: settings.show_timestamps },
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    }

    // Respect max_public_entries setting
    const effectiveLimit = Math.min(limit, settings.max_public_entries);

    // Build query - ONLY visible entries for public access
    let query = supabase
      .from('profile_story')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile.id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    // Filter by types if specified
    if (typesFilter.length > 0) {
      query = query.in('change_type', typesFilter);
    }

    // Apply pagination
    query = query.range(offset, offset + effectiveLimit - 1);

    const { data: entries, error: entriesError, count } = await query;

    if (entriesError) {
      console.error('Error fetching profile story:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
    }

    // Build timeline (already filtered to visible only)
    const timeline: ProfileTimelineEntry[] = (entries || [])
      .filter((entry: ProfileStoryEntry) => settings.defaults[entry.change_type])
      .map((entry: ProfileStoryEntry) => ({
        id: entry.id,
        date: entry.created_at,
        changeType: entry.change_type,
        entityType: entry.entity_type,
        summary: entry.change_summary || getChangeTypeSummary(entry.change_type),
        isVisible: true,
        details: {
          platform:
            entry.entity_type === 'social_link' ? entry.entity_id || undefined : undefined,
          blockType:
            entry.entity_type === 'block'
              ? (entry.new_value as Record<string, unknown>)?.block_type as string
              : undefined,
        },
      }));

    return NextResponse.json({
      profile: {
        id: profile.id,
        handle: profile.handle,
        display_name: profile.display_name,
        created_at: profile.created_at,
      },
      entries: entries || [],
      timeline,
      settings: { enabled: settings.enabled, show_timestamps: settings.show_timestamps },
      pagination: {
        total: Math.min(count || 0, settings.max_public_entries),
        limit: effectiveLimit,
        offset,
        hasMore: (count || 0) > offset + effectiveLimit,
      },
    });
  } catch (error) {
    console.error('GET /api/users/[handle]/story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
