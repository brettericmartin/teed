import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type {
  BagVersionHistory,
  ItemVersionHistory,
  TimelineEntry,
  VersionHistoryResponse,
  ItemSnapshot,
} from '@/lib/types/versionHistory';

type RouteParams = {
  params: Promise<{ code: string }>;
};

// Simple item info for checking existence
interface BagItem {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  brand: string | null;
  custom_description: string | null;
}

/**
 * GET /api/bags/[code]/history
 * Get version history and changelog for a bag
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('include_hidden') === 'true';

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

    // Fetch item change history with new columns
    const { data: itemChanges, error: itemChangesError } = await supabase
      .from('item_version_history')
      .select('*')
      .eq('bag_id', bag.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (itemChangesError) {
      console.error('Error fetching item history:', itemChangesError);
    }

    // Fetch current bag items to check which still exist
    const { data: currentItems, error: itemsError } = await supabase
      .from('bag_items')
      .select('id, custom_name, photo_url, brand, custom_description')
      .eq('bag_id', bag.id);

    if (itemsError) {
      console.error('Error fetching bag items:', itemsError);
    }

    // Create a map of existing items for quick lookup
    const existingItemsMap = new Map<string, BagItem>();
    (currentItems || []).forEach((item: BagItem) => {
      existingItemsMap.set(item.id, item);
    });

    // Build unified timeline with enriched data
    const timeline = buildTimeline(
      versions || [],
      itemChanges || [],
      bag.created_at,
      existingItemsMap,
      isOwner && includeHidden
    );

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
 * Now includes itemId, itemExists, itemSnapshot for click-to-item feature
 */
function buildTimeline(
  versions: BagVersionHistory[],
  itemChanges: ItemVersionHistory[],
  bagCreatedAt: string,
  existingItemsMap: Map<string, BagItem>,
  includeHidden: boolean
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Helper to check if item exists and get current data
  const getItemInfo = (itemId: string | null, historyEntry: ItemVersionHistory) => {
    if (!itemId) {
      // Item was deleted (FK set to NULL) - use snapshot
      const snapshot = historyEntry.item_snapshot || historyEntry.old_value || historyEntry.new_value;
      return {
        itemId: null,
        itemExists: false,
        itemSnapshot: snapshot as ItemSnapshot | undefined,
      };
    }

    const existingItem = existingItemsMap.get(itemId);
    if (existingItem) {
      // Item still exists - use current data
      return {
        itemId,
        itemExists: true,
        itemSnapshot: {
          custom_name: existingItem.custom_name,
          photo_url: existingItem.photo_url,
          brand: existingItem.brand,
          custom_description: existingItem.custom_description,
        } as ItemSnapshot,
      };
    }

    // Item ID exists in history but not in bag - was deleted
    const snapshot = historyEntry.item_snapshot || historyEntry.old_value || historyEntry.new_value;
    return {
      itemId,
      itemExists: false,
      itemSnapshot: snapshot as ItemSnapshot | undefined,
    };
  };

  // Add bag creation entry
  entries.push({
    id: 'created',
    date: bagCreatedAt,
    type: 'bag',
    changeType: 'created',
    summary: 'Created this bag',
    isVisible: true,
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
      isVisible: true,
      details: {
        itemsAffected: version.items_changed,
      },
    });
  }

  // Process individual item changes (don't group - show each as clickable entry)
  for (const change of itemChanges) {
    // Filter by visibility if not including hidden
    const isVisible = change.is_visible !== false;
    if (!includeHidden && !isVisible) continue;

    const itemInfo = getItemInfo(change.item_id, change);
    const itemName = getItemName(change);

    // Use doctrine-compliant language: "Retired" instead of "Removed"
    let summary: string;
    switch (change.change_type) {
      case 'added':
        summary = `Added "${itemName}"`;
        break;
      case 'removed':
        summary = `Retired "${itemName}"`;
        break;
      case 'updated':
        summary = `Refined "${itemName}"`;
        break;
      case 'replaced':
        summary = change.change_note || `Switched to "${itemName}"`;
        break;
      case 'restored':
        summary = `Restored "${itemName}"`;
        break;
      default:
        summary = `Changed "${itemName}"`;
    }

    entries.push({
      id: change.id,
      date: change.created_at,
      type: 'item',
      changeType: change.change_type,
      summary,
      itemName,
      isVisible,
      // Item linking for click-to-item
      itemId: itemInfo.itemId,
      itemExists: itemInfo.itemExists,
      itemSnapshot: itemInfo.itemSnapshot,
      // Curator notes
      curatorNote: change.change_note,
      noteUpdatedAt: change.note_updated_at,
      details: {
        fieldChanged: change.field_changed || undefined,
        oldValue: typeof change.old_value === 'string' ? change.old_value : undefined,
        newValue: typeof change.new_value === 'string' ? change.new_value : undefined,
      },
    });
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

/**
 * Get item name from history entry
 */
function getItemName(change: ItemVersionHistory): string {
  // Try item_snapshot first (most complete)
  if (change.item_snapshot && typeof change.item_snapshot === 'object') {
    const snapshot = change.item_snapshot as any;
    if (snapshot.custom_name) return snapshot.custom_name;
  }

  // Try new_value (for added/updated items)
  if (change.new_value && typeof change.new_value === 'object') {
    const newVal = change.new_value as any;
    if (newVal.custom_name) return newVal.custom_name;
  }

  // Try old_value (for removed items)
  if (change.old_value && typeof change.old_value === 'object') {
    const oldVal = change.old_value as any;
    if (oldVal.custom_name) return oldVal.custom_name;
  }

  return 'item';
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
