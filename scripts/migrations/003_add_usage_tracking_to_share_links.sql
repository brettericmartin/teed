-- Migration 003: Add usage tracking to share_links
-- Enables limited-use and expiring share links

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'max_uses') THEN
    ALTER TABLE share_links ADD COLUMN max_uses integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'uses') THEN
    ALTER TABLE share_links ADD COLUMN uses integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'expires_at') THEN
    ALTER TABLE share_links ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_uses_check') THEN
    ALTER TABLE share_links ADD CONSTRAINT share_links_uses_check CHECK (uses >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_max_uses_check') THEN
    ALTER TABLE share_links ADD CONSTRAINT share_links_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
  END IF;
END $$;

-- Function to validate share link
CREATE OR REPLACE FUNCTION is_share_link_valid(link_id uuid)
RETURNS boolean AS $$
DECLARE
  link_record share_links;
BEGIN
  SELECT * INTO link_record FROM share_links WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check expiration
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;

  -- Check usage limit
  IF link_record.max_uses IS NOT NULL AND link_record.uses >= link_record.max_uses THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_share_link_uses(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE share_links
  SET uses = uses + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
