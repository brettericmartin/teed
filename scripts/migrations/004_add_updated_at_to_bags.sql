-- Migration 004: Add updated_at timestamp to bags
-- Track last modification time for bags

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'updated_at') THEN
    ALTER TABLE bags ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_bags_updated_at ON bags;
CREATE TRIGGER update_bags_updated_at
  BEFORE UPDATE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing bags
UPDATE bags
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;
