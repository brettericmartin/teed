-- Migration 082: Enable Item History Tracking
-- Enables the trigger that automatically records item changes to item_version_history

-- Enable the trigger that was disabled in migration 066
ALTER TABLE bag_items ENABLE TRIGGER track_item_changes_trigger;

-- Also create initial "created" entries for bags that don't have any version history yet
-- This gives existing bags a starting point in their timeline
INSERT INTO bag_version_history (bag_id, version_number, change_type, change_summary, items_changed, created_at)
SELECT
    b.id,
    1,
    'created',
    'Created this bag',
    (SELECT COUNT(*) FROM bag_items WHERE bag_id = b.id),
    b.created_at
FROM bags b
WHERE NOT EXISTS (
    SELECT 1 FROM bag_version_history bvh
    WHERE bvh.bag_id = b.id AND bvh.change_type = 'created'
)
ON CONFLICT (bag_id, version_number) DO NOTHING;

-- Update bags that don't have version_number set
UPDATE bags
SET version_number = 1
WHERE version_number IS NULL OR version_number = 0;
