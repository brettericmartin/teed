-- Migration: Add photo_url column to bag_items
-- This allows storing external image URLs (e.g., YouTube thumbnails) directly on items

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bag_items' AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE bag_items ADD COLUMN photo_url TEXT;
        RAISE NOTICE 'Added photo_url column to bag_items';
    ELSE
        RAISE NOTICE 'photo_url column already exists on bag_items';
    END IF;
END $$;
