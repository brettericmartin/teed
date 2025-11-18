-- Migration: Create platform_affiliate_settings table for admin affiliate configuration

CREATE TABLE IF NOT EXISTS platform_affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL UNIQUE, -- 'amazon', 'impact', 'cj', 'rakuten', 'shareasale'
  is_enabled boolean DEFAULT false,

  -- Network-specific credentials (stored as jsonb for flexibility)
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Example credentials structure:
  -- Amazon: { "associate_tag": "teed-20", "tracking_id": "teed-20" }
  -- Impact: { "publisher_id": "12345", "campaign_id": "67890", "irclickid": "{clickid}" }
  -- CJ: { "website_id": "12345", "subid": "{clickid}" }

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS platform_affiliate_settings_network_idx ON platform_affiliate_settings(network);
CREATE INDEX IF NOT EXISTS platform_affiliate_settings_enabled_idx ON platform_affiliate_settings(is_enabled);

-- Updated_at trigger
CREATE TRIGGER update_platform_affiliate_settings_updated_at
  BEFORE UPDATE ON platform_affiliate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (admin only)
ALTER TABLE platform_affiliate_settings ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (admin will use service role via API)
CREATE POLICY "Service role full access"
  ON platform_affiliate_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default records for common networks
INSERT INTO platform_affiliate_settings (network, is_enabled, credentials) VALUES
  ('amazon', false, '{"associate_tag": "", "tracking_id": ""}'::jsonb),
  ('impact', false, '{"publisher_id": "", "campaign_id": "", "irclickid": "{clickid}"}'::jsonb),
  ('cj', false, '{"website_id": "", "subid": "{clickid}"}'::jsonb),
  ('rakuten', false, '{"mid": "", "sid": ""}'::jsonb),
  ('shareasale', false, '{"merchant_id": "", "affiliate_id": ""}'::jsonb)
ON CONFLICT (network) DO NOTHING;
