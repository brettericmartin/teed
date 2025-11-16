-- Migration 002: Add code field to bags table
-- Enables simple URLs like /c/camping-kit

-- Add code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'code') THEN
    ALTER TABLE bags ADD COLUMN code text;
  END IF;
END $$;

-- Make it unique
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bags_code_key') THEN
    ALTER TABLE bags ADD CONSTRAINT bags_code_key UNIQUE (code);
  END IF;
END $$;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_bags_code ON bags(code) WHERE code IS NOT NULL;

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_bag_code(title_text text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter int := 0;
BEGIN
  -- Convert to lowercase, replace non-alphanumeric with hyphens
  base_code := lower(regexp_replace(title_text, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Trim leading/trailing hyphens
  base_code := trim(both '-' from base_code);

  -- Limit length
  base_code := substring(base_code from 1 for 50);

  -- Handle empty codes
  IF base_code = '' THEN
    base_code := 'bag';
  END IF;

  final_code := base_code;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM bags WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate code on insert
CREATE OR REPLACE FUNCTION auto_generate_bag_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_bag_code(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_bag_code ON bags;
CREATE TRIGGER trigger_auto_generate_bag_code
  BEFORE INSERT ON bags
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_bag_code();

-- Backfill existing bags with codes
UPDATE bags
SET code = generate_bag_code(title)
WHERE code IS NULL;
