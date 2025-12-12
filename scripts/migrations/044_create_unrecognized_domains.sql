-- Migration: Create unrecognized_domains table
-- Purpose: Track domains that aren't in our brand database for future expansion

-- Table to store unrecognized domains with frequency tracking
CREATE TABLE IF NOT EXISTS unrecognized_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,

  -- Sample URLs for context (store last 5)
  sample_urls TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- User tracking (who submitted links from this domain)
  unique_users INTEGER NOT NULL DEFAULT 1,

  -- Admin actions
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'added', 'ignored', 'blocked')),
  added_to_database_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,

  -- Suggested categorization from AI (optional)
  suggested_brand TEXT,
  suggested_category TEXT,
  suggested_tier TEXT CHECK (suggested_tier IN ('luxury', 'premium', 'mid', 'value')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_unrecognized_domains_status ON unrecognized_domains(status);
CREATE INDEX IF NOT EXISTS idx_unrecognized_domains_occurrence ON unrecognized_domains(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_unrecognized_domains_last_seen ON unrecognized_domains(last_seen_at DESC);

-- Function to upsert unrecognized domain
CREATE OR REPLACE FUNCTION upsert_unrecognized_domain(
  p_domain TEXT,
  p_url TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_sample_urls TEXT[];
BEGIN
  -- Try to insert or update
  INSERT INTO unrecognized_domains (domain, sample_urls)
  VALUES (p_domain, CASE WHEN p_url IS NOT NULL THEN ARRAY[p_url] ELSE ARRAY[]::TEXT[] END)
  ON CONFLICT (domain) DO UPDATE SET
    last_seen_at = NOW(),
    occurrence_count = unrecognized_domains.occurrence_count + 1,
    -- Keep last 5 sample URLs
    sample_urls = CASE
      WHEN p_url IS NOT NULL AND NOT (p_url = ANY(unrecognized_domains.sample_urls))
      THEN (ARRAY[p_url] || unrecognized_domains.sample_urls)[1:5]
      ELSE unrecognized_domains.sample_urls
    END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE unrecognized_domains ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify (admin_role is stored in profiles table)
CREATE POLICY "Admins can view unrecognized domains"
  ON unrecognized_domains
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

CREATE POLICY "Admins can modify unrecognized domains"
  ON unrecognized_domains
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_unrecognized_domains_updated_at
  BEFORE UPDATE ON unrecognized_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
