-- Migration: Convert existing 'width' values to grid coordinates
-- This migrates data from the old full/half width system to the new grid system

-- Convert full-width blocks: width = 12 columns
UPDATE profile_blocks
SET grid_w = 12, grid_x = 0
WHERE width = 'full' OR width IS NULL;

-- Convert half-width blocks: width = 6 columns
-- Position them alternating left (x=0) and right (x=6) based on sort order
WITH half_width_blocks AS (
  SELECT
    id,
    profile_id,
    sort_order,
    ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY sort_order) as position_in_profile
  FROM profile_blocks
  WHERE width = 'half'
)
UPDATE profile_blocks pb
SET
  grid_w = 6,
  grid_x = CASE
    WHEN hwb.position_in_profile % 2 = 1 THEN 0  -- Odd positions go left
    ELSE 6  -- Even positions go right
  END
FROM half_width_blocks hwb
WHERE pb.id = hwb.id;

-- Set grid_y based on sort_order for initial vertical positioning
-- Multiply by 2 to give room for blocks of varying heights
UPDATE profile_blocks
SET grid_y = sort_order * 2;

-- Set default heights based on block type
-- These are sensible defaults that can be adjusted by users
UPDATE profile_blocks SET grid_h = 3 WHERE block_type = 'header';
UPDATE profile_blocks SET grid_h = 2 WHERE block_type = 'bio';
UPDATE profile_blocks SET grid_h = 2 WHERE block_type = 'social_links';
UPDATE profile_blocks SET grid_h = 4 WHERE block_type = 'embed';
UPDATE profile_blocks SET grid_h = 4 WHERE block_type = 'featured_bags';
UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'custom_text';
UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'spacer';
UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'divider';
UPDATE profile_blocks SET grid_h = 3 WHERE block_type = 'destinations';

-- Note: The 'width' column is kept for backward compatibility
-- It can be removed in a future migration once all clients are updated
