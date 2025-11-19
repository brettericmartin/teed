-- ═══════════════════════════════════════════════════════════
-- Migration 011: Create affiliate_links table
-- Enables affiliate monetization tracking with FTC compliance
-- ═══════════════════════════════════════════════════════════

-- Create affiliate_links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this link points to
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE NOT NULL,

  -- URL details
  raw_url text NOT NULL,
  affiliate_url text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('none', 'amazon', 'aggregator', 'direct')),
  merchant_domain text,

  -- FTC Compliance (Critical Addition)
  disclosure_text text DEFAULT 'As an Amazon Associate, I earn from qualifying purchases.',
  disclosure_required boolean DEFAULT true NOT NULL,

  -- Amazon 24-hour cookie compliance
  cookie_expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,

  -- Tracking
  clicks integer DEFAULT 0 NOT NULL,
  last_click_at timestamptz,
  last_clicked_ip inet,
  last_clicked_user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  UNIQUE(bag_item_id, provider),
  CHECK (clicks >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_links_item ON affiliate_links(bag_item_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_provider ON affiliate_links(provider);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_merchant ON affiliate_links(merchant_domain);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_links_expires ON affiliate_links(cookie_expires_at) WHERE cookie_expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public affiliate links viewable by all" ON affiliate_links;
DROP POLICY IF EXISTS "Users can view own affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Users can manage own affiliate links" ON affiliate_links;

-- RLS Policy: Public bags' affiliate links are viewable by everyone
CREATE POLICY "Public affiliate links viewable by all"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.is_public = true
    )
  );

-- RLS Policy: Users can view their own affiliate links
CREATE POLICY "Users can view own affiliate links"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can manage affiliate links for their bags
CREATE POLICY "Users can manage own affiliate links"
  ON affiliate_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_affiliate_links_updated_at ON affiliate_links;
CREATE TRIGGER trigger_update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_links_updated_at();

-- Function to check if affiliate link is expired (Amazon 24hr cookie)
CREATE OR REPLACE FUNCTION is_affiliate_link_expired(link_id uuid)
RETURNS boolean AS $$
DECLARE
  link_record affiliate_links;
BEGIN
  SELECT * INTO link_record FROM affiliate_links WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Check if link is marked inactive
  IF link_record.is_active = false THEN
    RETURN true;
  END IF;

  -- Check if cookie has expired (Amazon 24hr rule)
  IF link_record.cookie_expires_at IS NOT NULL AND link_record.cookie_expires_at < now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- Migration 011 Complete
-- ═══════════════════════════════════════════════════════════

SELECT 'Migration 011: affiliate_links table created successfully! ✅' AS status;
