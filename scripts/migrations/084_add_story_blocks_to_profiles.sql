-- Migration 084: Add Story Blocks to Existing Profiles
-- Adds "The Story" block to profiles that don't have one yet

-- First, update the valid_block_type constraint to include 'story'
ALTER TABLE profile_blocks DROP CONSTRAINT IF EXISTS valid_block_type;
ALTER TABLE profile_blocks ADD CONSTRAINT valid_block_type
  CHECK (block_type IN (
    'header', 'bio', 'social_links', 'embed', 'featured_bags',
    'custom_text', 'spacer', 'divider', 'destinations', 'quote',
    'affiliate_disclosure', 'story'
  ));

-- Insert Story block for profiles that don't have one
INSERT INTO profile_blocks (
  profile_id,
  block_type,
  sort_order,
  is_visible,
  width,
  config,
  grid_x,
  grid_y,
  grid_w,
  grid_h
)
SELECT
  p.id as profile_id,
  'story' as block_type,
  -- Place it after the last existing block
  COALESCE((
    SELECT MAX(sort_order) + 1
    FROM profile_blocks pb
    WHERE pb.profile_id = p.id
  ), 10) as sort_order,
  true as is_visible,
  'full' as width,
  jsonb_build_object(
    'title', 'The Story',
    'showTitle', true,
    'maxItems', 5,
    'showFiltersBar', true,
    'groupByTimePeriod', true,
    'showProfileChanges', true,
    'showBagChanges', true
  ) as config,
  0 as grid_x,
  -- Place at the bottom of the grid
  COALESCE((
    SELECT MAX(grid_y) + COALESCE(MAX(grid_h), 4)
    FROM profile_blocks pb
    WHERE pb.profile_id = p.id
  ), 24) as grid_y,
  12 as grid_w,
  6 as grid_h
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM profile_blocks pb
  WHERE pb.profile_id = p.id
    AND pb.block_type = 'story'
);
