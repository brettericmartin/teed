-- Migration: Add width column to profile_blocks for half-width block support
-- This enables blocks to be displayed side-by-side in a grid layout

-- Add width column with default 'full'
ALTER TABLE profile_blocks
ADD COLUMN IF NOT EXISTS width text NOT NULL DEFAULT 'full';

-- Add constraint for valid width values
ALTER TABLE profile_blocks
ADD CONSTRAINT valid_block_width CHECK (
  width IN ('full', 'half')
);

-- Comment on the new column
COMMENT ON COLUMN profile_blocks.width IS 'Block width: full (100%) or half (50%) for side-by-side layouts';
