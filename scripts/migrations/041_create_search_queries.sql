-- Migration: Create content_search_queries table for dynamic trend management
-- This allows admins to manage search queries for content discovery

-- Create search queries table
CREATE TABLE IF NOT EXISTS content_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query details
  query TEXT NOT NULL,
  vertical TEXT NOT NULL CHECK (vertical IN (
    'golf', 'camera', 'makeup', 'desk', 'tech', 'edc',
    'fitness', 'music', 'art', 'gaming', 'travel', 'food', 'fashion', 'other'
  )),

  -- Categorization
  query_type TEXT NOT NULL DEFAULT 'evergreen' CHECK (query_type IN (
    'evergreen',      -- Always relevant (e.g., "what's in the bag golf")
    'event',          -- Time-bound event (e.g., "masters 2025 golfer bag")
    'product_launch', -- New product release (e.g., "titleist gt driver 2025")
    'creator',        -- Creator-specific (e.g., "scottie scheffler bag")
    'trending'        -- Currently trending topic
  )),

  -- Priority and scheduling
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- For time-bound queries (events, product launches)
  starts_at TIMESTAMPTZ,  -- When to start using this query
  expires_at TIMESTAMPTZ, -- When to stop using this query

  -- Metadata
  notes TEXT,                    -- Admin notes about this query
  source TEXT,                   -- Where this query came from (manual, ai_suggested, etc.)
  last_used_at TIMESTAMPTZ,      -- When this was last used in discovery
  videos_found INTEGER DEFAULT 0, -- How many videos this query has found

  -- Admin tracking
  created_by_admin_id UUID REFERENCES profiles(id),
  updated_by_admin_id UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_search_queries_vertical ON content_search_queries(vertical);
CREATE INDEX idx_search_queries_active ON content_search_queries(is_active) WHERE is_active = true;
CREATE INDEX idx_search_queries_type ON content_search_queries(query_type);
CREATE INDEX idx_search_queries_priority ON content_search_queries(priority DESC);
CREATE INDEX idx_search_queries_expires ON content_search_queries(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE content_search_queries ENABLE ROW LEVEL SECURITY;

-- RLS policies (admin only)
CREATE POLICY "Admin can view search queries"
  ON content_search_queries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admin can insert search queries"
  ON content_search_queries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin can update search queries"
  ON content_search_queries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin can delete search queries"
  ON content_search_queries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('super_admin', 'admin')
    )
  );

-- Insert default evergreen queries
INSERT INTO content_search_queries (query, vertical, query_type, priority, notes, source) VALUES
-- Golf evergreen
('what''s in the bag golf', 'golf', 'evergreen', 90, 'Core WITB query', 'seed'),
('WITB golf', 'golf', 'evergreen', 85, 'WITB abbreviation', 'seed'),
('pro golfer bag', 'golf', 'evergreen', 80, 'Pro golfer focus', 'seed'),
('golf bag setup', 'golf', 'evergreen', 75, 'Setup/tour style', 'seed'),
('PGA tour what''s in the bag', 'golf', 'evergreen', 85, 'Tour pro bags', 'seed'),

-- Camera evergreen
('what''s in my camera bag', 'camera', 'evergreen', 90, 'Core camera bag query', 'seed'),
('camera gear', 'camera', 'evergreen', 80, 'General camera gear', 'seed'),
('photography kit', 'camera', 'evergreen', 75, 'Photography equipment', 'seed'),
('filmmaker setup', 'camera', 'evergreen', 80, 'Video/cinema focus', 'seed'),
('camera bag tour', 'camera', 'evergreen', 85, 'Bag tour format', 'seed'),

-- Desk evergreen
('desk setup', 'desk', 'evergreen', 90, 'Core desk setup query', 'seed'),
('workspace tour', 'desk', 'evergreen', 85, 'Workspace tours', 'seed'),
('home office setup', 'desk', 'evergreen', 80, 'WFH focus', 'seed'),
('desk tour', 'desk', 'evergreen', 85, 'Tour format', 'seed'),
('gaming setup tour', 'desk', 'evergreen', 75, 'Gaming desk overlap', 'seed'),

-- Tech evergreen
('tech setup', 'tech', 'evergreen', 85, 'General tech setup', 'seed'),
('everyday carry tech', 'tech', 'evergreen', 80, 'Tech EDC', 'seed'),
('gadget collection', 'tech', 'evergreen', 75, 'Gadget focus', 'seed'),
('apple setup', 'tech', 'evergreen', 80, 'Apple ecosystem', 'seed'),

-- EDC evergreen
('everyday carry', 'edc', 'evergreen', 90, 'Core EDC query', 'seed'),
('EDC pocket dump', 'edc', 'evergreen', 85, 'Pocket dump format', 'seed'),
('EDC gear', 'edc', 'evergreen', 80, 'EDC gear focus', 'seed');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_search_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_queries_updated_at
  BEFORE UPDATE ON content_search_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_search_queries_updated_at();

-- Comment
COMMENT ON TABLE content_search_queries IS 'Dynamic search queries for content discovery - managed by admins';
