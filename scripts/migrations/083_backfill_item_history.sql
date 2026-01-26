-- Migration 083: Backfill Item History
-- Creates "added" entries for all existing items that don't have history yet

INSERT INTO item_version_history (item_id, bag_id, change_type, new_value, created_at)
SELECT
    bi.id,
    bi.bag_id,
    'added',
    jsonb_build_object(
        'custom_name', bi.custom_name,
        'photo_url', bi.photo_url
    ),
    COALESCE(bi.added_at, bi.created_at, b.created_at)
FROM bag_items bi
JOIN bags b ON b.id = bi.bag_id
WHERE NOT EXISTS (
    SELECT 1 FROM item_version_history ivh
    WHERE ivh.item_id = bi.id AND ivh.change_type = 'added'
);
