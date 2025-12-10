-- Migration: Create team_generations table for multi-agent content generation
-- This table tracks team generation runs and their outputs

-- Create team_generations table
CREATE TABLE IF NOT EXISTS team_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_idea_id UUID NOT NULL REFERENCES content_ideas(id) ON DELETE CASCADE,

  -- Generation status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_wave INTEGER DEFAULT 0 CHECK (current_wave >= 0 AND current_wave <= 3),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

  -- Wave outputs (stored separately for progressive loading)
  wave1_output JSONB,
  wave2_output JSONB,
  wave3_output JSONB,

  -- Final merged output
  final_output JSONB,

  -- Token usage tracking
  token_usage JSONB DEFAULT '{"wave1": 0, "wave2": 0, "wave3": 0, "total": 0}',

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by content idea
CREATE INDEX IF NOT EXISTS idx_team_generations_content_idea
ON team_generations(content_idea_id);

-- Index for finding in-progress generations
CREATE INDEX IF NOT EXISTS idx_team_generations_status
ON team_generations(status) WHERE status = 'running';

-- Add columns to content_ideas for team-generated content
ALTER TABLE content_ideas
ADD COLUMN IF NOT EXISTS team_hooks JSONB,
ADD COLUMN IF NOT EXISTS team_platform_content JSONB,
ADD COLUMN IF NOT EXISTS team_bag_qa JSONB,
ADD COLUMN IF NOT EXISTS team_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS team_generation_id UUID REFERENCES team_generations(id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_team_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_generations_updated_at ON team_generations;
CREATE TRIGGER team_generations_updated_at
  BEFORE UPDATE ON team_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_generations_updated_at();

-- RLS Policies (admin only)
ALTER TABLE team_generations ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything (use is_admin function from migration 035)
CREATE POLICY "Admins can manage team generations" ON team_generations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Grant access
GRANT ALL ON team_generations TO authenticated;
GRANT ALL ON team_generations TO service_role;

-- Comment on table
COMMENT ON TABLE team_generations IS 'Tracks multi-agent content generation runs for content ideas';
COMMENT ON COLUMN team_generations.wave1_output IS 'Product Details Expert + Fun Facts Expert outputs';
COMMENT ON COLUMN team_generations.wave2_output IS 'Virality Manager output';
COMMENT ON COLUMN team_generations.wave3_output IS 'Platform Specialists + Bag QA outputs';
COMMENT ON COLUMN team_generations.final_output IS 'Merged output from all agents';
