-- Migration: Add grid layout columns to profile_blocks for react-grid-layout support
-- This enables free-form grid positioning with x, y, width, height coordinates
-- Part of the 12-column grid system implementation

-- Add new grid columns (with defaults for backward compatibility)
ALTER TABLE profile_blocks
ADD COLUMN IF NOT EXISTS grid_x integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_y integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_w integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS grid_h integer DEFAULT 2;

-- Add constraints for grid values
-- grid_x: column position 0-11 (12-column grid)
-- grid_w: width 1-12 columns
-- grid_h: height in rows (minimum 1)
ALTER TABLE profile_blocks
ADD CONSTRAINT IF NOT EXISTS valid_grid_x CHECK (grid_x >= 0 AND grid_x < 12);

ALTER TABLE profile_blocks
ADD CONSTRAINT IF NOT EXISTS valid_grid_w CHECK (grid_w >= 1 AND grid_w <= 12);

ALTER TABLE profile_blocks
ADD CONSTRAINT IF NOT EXISTS valid_grid_h CHECK (grid_h >= 1);

-- Add index for sorting by grid position
CREATE INDEX IF NOT EXISTS idx_profile_blocks_grid_position
ON profile_blocks (profile_id, grid_y, grid_x);

-- Comments for documentation
COMMENT ON COLUMN profile_blocks.grid_x IS 'Grid column position (0-11 in 12-column grid)';
COMMENT ON COLUMN profile_blocks.grid_y IS 'Grid row position';
COMMENT ON COLUMN profile_blocks.grid_w IS 'Block width in grid columns (1-12)';
COMMENT ON COLUMN profile_blocks.grid_h IS 'Block height in grid rows';
