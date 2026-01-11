import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type {
  BagVersionHistory,
  ItemVersionHistory,
  TimelineEntry,
  VersionHistoryResponse,
} from '@/lib/types/versionHistory';

type RouteParams = {
  params: Promise<{ code: string }>;
};

/**
 * GET /api/bags/[code]/history
 * Get version history and changelog for a bag
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user (optional - public bags are viewable by anyone)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch bag with version tracking fields
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, code, title, description, is_public, owner_id, version_number, update_count, last_major_update, created_at')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check authorization
    const isOwner = user?.id === bag.owner_id;
    if (!bag.is_public && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch bag version history
    const { data: versions, error: versionsError } = await supabase
      .from('bag_version_history')
      .select('*')
      .eq('bag_id', bag.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (versionsError) {
      console.error('Error fetching version history:', versionsError);
    }

    // Fetch item change history
    const { data: itemChanges, error: itemChangesError } = await supabase
      .from('item_version_history')
      .select('*')
      .eq('bag_id', bag.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (itemChangesError) {
      console.error('Error fetching item history:', itemChangesError);
    }

    // Build unified timeline
    const timeline = buildTimeline(versions || [], itemChanges || [], bag.created_at);

    const response: VersionHistoryResponse = {
      bag: {
        id: bag.id,
        title: bag.title,
        version_number: bag.version_number || 1,
        update_count: bag.update_count || 0,
        last_major_update: bag.last_major_update,
        created_at: bag.created_at,
      },
      versions: (versions || []) as BagVersionHistory[],
      itemChanges: (itemChanges || []) as ItemVersionHistory[],
      timeline,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/bags/[code]/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bags/[code]/history
 * Create a manual version snapshot (for major updates)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { change_type = 'major_update', change_summary } = body;

    // Fetch bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create version snapshot using the database function
    const { data: result, error: snapshotError } = await supabase.rpc(
      'create_bag_version_snapshot',
      {
        p_bag_id: bag.id,
        p_change_type: change_type,
        p_change_summary: change_summary || null,
      }
    );

    if (snapshotError) {
      console.error('Error creating version snapshot:', snapshotError);
      return NextResponse.json({ error: 'Failed to create version snapshot' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version_id: result,
    });
  } catch (error) {
    console.error('Error in POST /api/bags/[code]/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Build a unified timeline from version history and item changes
 */
function buildTimeline(
  versions: BagVersionHistory[],
  itemChanges: ItemVersionHistory[],
  bagCreatedAt: string
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Add bag creation entry
  entries.push({
    id: 'created',
    date: bagCreatedAt,
    type: 'bag',
    changeType: 'created',
    summary: 'Created this bag',
  });

  // Add version history entries
  for (const version of versions) {
    // Skip if it's a 'created' entry (we already added it)
    if (version.change_type === 'created') continue;

    entries.push({
      id: version.id,
      date: version.created_at,
      type: 'bag',
      changeType: version.change_type,
      summary: version.change_summary || getDefaultSummary(version.change_type),
      details: {
        itemsAffected: version.items_changed,
      },
    });
  }

  // Add item change entries (group by date to avoid clutter)
  const itemChangesByDate = new Map<string, ItemVersionHistory[]>();
  for (const change of itemChanges) {
    const dateKey = change.created_at.split('T')[0];
    if (!itemChangesByDate.has(dateKey)) {
      itemChangesByDate.set(dateKey, []);
    }
    itemChangesByDate.get(dateKey)!.push(change);
  }

  // Add grouped item changes
  for (const [dateKey, changes] of itemChangesByDate) {
    // For each day, group similar changes
    const addedItems = changes.filter((c) => c.change_type === 'added');
    const updatedItems = changes.filter((c) => c.change_type === 'updated');
    const replacedItems = changes.filter((c) => c.change_type === 'replaced');
    const removedItems = changes.filter((c) => c.change_type === 'removed');

    if (addedItems.length > 0) {
      const firstChange = addedItems[0];
      entries.push({
        id: `added-${dateKey}`,
        date: firstChange.created_at,
        type: 'item',
        changeType: 'added',
        summary: addedItems.length === 1
          ? `Added "${(firstChange.new_value as any)?.custom_name || 'item'}"`
          : `Added ${addedItems.length} items`,
        itemName: addedItems.length === 1 ? (firstChange.new_value as any)?.custom_name : undefined,
        details: {
          itemsAffected: addedItems.length,
        },
      });
    }

    // Show individual replaced items (they're more significant)
    for (const change of replacedItems) {
      entries.push({
        id: change.id,
        date: change.created_at,
        type: 'item',
        changeType: 'replaced',
        summary: change.change_note || 'Replaced item',
        itemName: (change.new_value as any)?.custom_name,
        details: {
          fieldChanged: 'replacement',
        },
      });
    }

    // Group updates
    if (updatedItems.length > 0) {
      const firstChange = updatedItems[0];
      entries.push({
        id: `updated-${dateKey}`,
        date: firstChange.created_at,
        type: 'item',
        changeType: 'updated',
        summary: updatedItems.length === 1
          ? `Updated "${(firstChange.new_value as any) || 'item'}"`
          : `Updated ${updatedItems.length} items`,
        details: {
          itemsAffected: updatedItems.length,
          fieldChanged: updatedItems.length === 1 ? firstChange.field_changed || undefined : undefined,
        },
      });
    }

    if (removedItems.length > 0) {
      entries.push({
        id: `removed-${dateKey}`,
        date: removedItems[0].created_at,
        type: 'item',
        changeType: 'removed',
        summary: removedItems.length === 1
          ? `Removed "${(removedItems[0].old_value as any)?.custom_name || 'item'}"`
          : `Removed ${removedItems.length} items`,
        details: {
          itemsAffected: removedItems.length,
        },
      });
    }
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

function getDefaultSummary(changeType: string): string {
  switch (changeType) {
    case 'items_added':
      return 'Added items';
    case 'items_removed':
      return 'Removed items';
    case 'items_updated':
      return 'Updated items';
    case 'metadata_updated':
      return 'Updated bag details';
    case 'major_update':
      return 'Major update';
    default:
      return 'Updated';
  }
}
