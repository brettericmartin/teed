-- ═══════════════════════════════════════════════════════════
-- Migration 037: Add moderation columns to bags table
-- Enables featuring and flagging bags for admin control
-- ═══════════════════════════════════════════════════════════

-- Add is_featured column for homepage/discover featuring
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'is_featured') THEN
    ALTER TABLE bags ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add is_flagged column for content moderation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'is_flagged') THEN
    ALTER TABLE bags ADD COLUMN is_flagged boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add flag_reason column for moderation notes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'flag_reason') THEN
    ALTER TABLE bags ADD COLUMN flag_reason text;
  END IF;
END $$;

-- Add is_hidden column for soft-delete / hiding from public
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'is_hidden') THEN
    ALTER TABLE bags ADD COLUMN is_hidden boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add featured_at timestamp to track when bag was featured
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'featured_at') THEN
    ALTER TABLE bags ADD COLUMN featured_at timestamptz;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bags_is_featured ON bags(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_bags_is_flagged ON bags(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_bags_is_hidden ON bags(is_hidden) WHERE is_hidden = true;
CREATE INDEX IF NOT EXISTS idx_bags_featured_at ON bags(featured_at DESC NULLS LAST) WHERE is_featured = true;

-- Add comments for documentation
COMMENT ON COLUMN bags.is_featured IS 'Whether this bag is featured on discover/homepage';
COMMENT ON COLUMN bags.is_flagged IS 'Whether this bag has been flagged for review';
COMMENT ON COLUMN bags.flag_reason IS 'Reason for flagging (spam, inappropriate, etc.)';
COMMENT ON COLUMN bags.is_hidden IS 'Whether this bag is hidden from public view (soft-delete)';
COMMENT ON COLUMN bags.featured_at IS 'Timestamp when bag was featured';

SELECT 'Migration 037 complete: Bag moderation columns added' AS status;
