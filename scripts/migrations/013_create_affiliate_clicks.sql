-- ═══════════════════════════════════════════════════════════
-- Migration 013: Create affiliate_clicks table
-- Enables detailed click tracking and analytics
-- ═══════════════════════════════════════════════════════════

-- Create affiliate_clicks table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link reference
  affiliate_link_id uuid REFERENCES affiliate_links(id) ON DELETE CASCADE NOT NULL,

  -- Tracking data
  clicked_at timestamptz DEFAULT now() NOT NULL,
  ip_address inet,
  user_agent text,
  referrer text,

  -- Session info (for conversion tracking)
  session_id text,

  -- Geographic data (optional, can be populated via IP lookup)
  country_code char(2),
  region text,

  -- Device categorization (parsed from user_agent)
  device_type text, -- 'mobile', 'tablet', 'desktop', 'unknown'

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session ON affiliate_clicks(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_country ON affiliate_clicks(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_device ON affiliate_clicks(device_type) WHERE device_type IS NOT NULL;

-- Composite index for common analytics queries (clicks per link per day)
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_date ON affiliate_clicks(affiliate_link_id, clicked_at DESC);

-- Enable RLS
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view clicks for their affiliate links" ON affiliate_clicks;
DROP POLICY IF EXISTS "System can insert clicks" ON affiliate_clicks;

-- RLS Policy: Users can view clicks for their own affiliate links
CREATE POLICY "Users can view clicks for their affiliate links"
  ON affiliate_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliate_links al
      JOIN bag_items bi ON al.bag_item_id = bi.id
      JOIN bags b ON bi.bag_id = b.id
      WHERE al.id = affiliate_clicks.affiliate_link_id
        AND b.owner_id = auth.uid()
    )
  );

-- RLS Policy: Allow system to insert clicks (for tracking endpoint)
CREATE POLICY "System can insert clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Function to increment click counter on affiliate_links
CREATE OR REPLACE FUNCTION increment_affiliate_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE affiliate_links
  SET
    clicks = clicks + 1,
    last_click_at = NEW.clicked_at,
    last_clicked_ip = NEW.ip_address,
    last_clicked_user_agent = NEW.user_agent
  WHERE id = NEW.affiliate_link_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment clicks counter
DROP TRIGGER IF EXISTS trigger_increment_affiliate_link_clicks ON affiliate_clicks;
CREATE TRIGGER trigger_increment_affiliate_link_clicks
  AFTER INSERT ON affiliate_clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_affiliate_link_clicks();

-- Function to get click statistics for a bag
CREATE OR REPLACE FUNCTION get_bag_click_stats(bag_uuid uuid)
RETURNS TABLE (
  total_clicks bigint,
  unique_sessions bigint,
  clicks_last_7_days bigint,
  clicks_last_30_days bigint,
  top_item_name text,
  top_item_clicks bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_clicks,
    COUNT(DISTINCT ac.session_id)::bigint as unique_sessions,
    COUNT(*) FILTER (WHERE ac.clicked_at > now() - interval '7 days')::bigint as clicks_last_7_days,
    COUNT(*) FILTER (WHERE ac.clicked_at > now() - interval '30 days')::bigint as clicks_last_30_days,
    (
      SELECT bi.name
      FROM affiliate_clicks ac2
      JOIN affiliate_links al2 ON ac2.affiliate_link_id = al2.id
      JOIN bag_items bi ON al2.bag_item_id = bi.id
      WHERE bi.bag_id = bag_uuid
      GROUP BY bi.id, bi.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_item_name,
    (
      SELECT COUNT(*)::bigint
      FROM affiliate_clicks ac2
      JOIN affiliate_links al2 ON ac2.affiliate_link_id = al2.id
      JOIN bag_items bi ON al2.bag_item_id = bi.id
      WHERE bi.bag_id = bag_uuid
      GROUP BY bi.id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_item_clicks
  FROM affiliate_clicks ac
  JOIN affiliate_links al ON ac.affiliate_link_id = al.id
  JOIN bag_items bi ON al.bag_item_id = bi.id
  WHERE bi.bag_id = bag_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- Migration 013 Complete
-- ═══════════════════════════════════════════════════════════

SELECT 'Migration 013: affiliate_clicks table created successfully! ✅' AS status;
