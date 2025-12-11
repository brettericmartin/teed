-- Migration: Add cover_photo_aspect to bags table
-- This allows users to customize the aspect ratio of their cover photo

-- Add cover_photo_aspect column (stores aspect ratio as text like '21/9', '16/9', '4/3')
ALTER TABLE bags ADD COLUMN IF NOT EXISTS cover_photo_aspect TEXT DEFAULT '21/9';

-- Add comment for documentation
COMMENT ON COLUMN bags.cover_photo_aspect IS 'Aspect ratio of the cover photo as width/height (e.g., 21/9, 16/9, 4/3)';
