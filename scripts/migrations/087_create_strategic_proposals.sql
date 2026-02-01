-- Migration 087: Create Strategic Proposals Table
-- For reviewing strategic research and making decisions on vertical expansion, features, partnerships

-- Create the strategic_proposals table
CREATE TABLE strategic_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,              -- 2-3 sentence overview
  content TEXT NOT NULL,              -- Full markdown white paper content
  category TEXT NOT NULL,             -- e.g., 'vertical_expansion', 'product_feature', 'partnership'

  -- Research metadata
  research_sources TEXT[],            -- URLs or descriptions of sources
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),

  -- Decision tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'needs_research')),
  admin_feedback TEXT,                -- Free-form feedback from reviewer
  decision_rationale TEXT,            -- Why approved/rejected
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'claude'    -- Usually AI-generated
);

-- Indexes for filtering
CREATE INDEX idx_proposals_status ON strategic_proposals(status);
CREATE INDEX idx_proposals_category ON strategic_proposals(category);
CREATE INDEX idx_proposals_created_at ON strategic_proposals(created_at DESC);

-- Enable RLS
ALTER TABLE strategic_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can read/write proposals
CREATE POLICY "Admins can view proposals"
  ON strategic_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

CREATE POLICY "Admins can insert proposals"
  ON strategic_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

CREATE POLICY "Admins can update proposals"
  ON strategic_proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_strategic_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategic_proposals_updated_at
  BEFORE UPDATE ON strategic_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_proposals_updated_at();
