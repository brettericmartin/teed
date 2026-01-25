-- Migration 086: Fix FK Cascade for Item History Preservation
-- CRITICAL: Current FK cascades DELETE, destroying history when items are deleted!
-- FIX: Change to SET NULL to preserve history entries

-- Drop the existing constraint that cascades deletes
ALTER TABLE item_version_history
DROP CONSTRAINT IF EXISTS item_version_history_item_id_fkey;

-- Add new constraint that sets item_id to NULL when item is deleted
-- This preserves the history entry while marking the item as gone
ALTER TABLE item_version_history
ADD CONSTRAINT item_version_history_item_id_fkey
FOREIGN KEY (item_id) REFERENCES bag_items(id) ON DELETE SET NULL;

-- Allow item_id to be NULL (for deleted items)
ALTER TABLE item_version_history
ALTER COLUMN item_id DROP NOT NULL;

-- Backfill item_snapshot for existing 'removed' entries that have old_value but no snapshot
-- This helps recover some history data for items already deleted
UPDATE item_version_history
SET item_snapshot = old_value
WHERE change_type = 'removed'
  AND item_snapshot IS NULL
  AND old_value IS NOT NULL;

-- Also backfill item_snapshot for 'added' entries from new_value
UPDATE item_version_history
SET item_snapshot = new_value
WHERE change_type = 'added'
  AND item_snapshot IS NULL
  AND new_value IS NOT NULL;
