-- Migration 068: Bag Completion
-- Adds completion status to bags for the Bag Completion Celebration feature
-- DOCTRINE: Core constructive dopamine - rewards "having built something"

-- Add is_complete boolean flag
ALTER TABLE bags ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE NOT NULL;

-- Add completed_at timestamp for tracking when bag was marked complete
ALTER TABLE bags ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for efficient querying of complete bags
CREATE INDEX IF NOT EXISTS idx_bags_is_complete ON bags(is_complete) WHERE is_complete = true;
CREATE INDEX IF NOT EXISTS idx_bags_completed_at ON bags(completed_at DESC NULLS LAST) WHERE completed_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN bags.is_complete IS 'Whether the creator has marked this bag as complete';
COMMENT ON COLUMN bags.completed_at IS 'Timestamp when the bag was marked complete';

SELECT 'Migration 068 complete: Bag completion fields added' AS status;
