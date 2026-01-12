-- Migration 071: Creator Scorecard System
-- Adds scorecard scoring to beta applications for enhanced applicant experience
-- Run with: psql $DATABASE_URL -f scripts/migrations/071_scorecard_system.sql

-- ============================================================================
-- Add Scorecard Columns
-- ============================================================================

-- Add scorecard fields to beta_applications
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS scorecard_score INTEGER,
  ADD COLUMN IF NOT EXISTS scorecard_category_scores JSONB,
  ADD COLUMN IF NOT EXISTS scorecard_persona TEXT,
  ADD COLUMN IF NOT EXISTS scorecard_percentile INTEGER,
  ADD COLUMN IF NOT EXISTS scorecard_mode TEXT DEFAULT 'monetization';

-- scorecard_category_scores structure:
-- {
--   "organization": 75,
--   "sharing": 60,
--   "monetization": 80,  -- OR "impact" depending on mode
--   "documentation": 45
-- }

-- scorecard_mode: 'monetization' | 'impact'
-- Determines which scoring mode was used (based on user's monetization interest)

COMMENT ON COLUMN beta_applications.scorecard_score IS 'Overall scorecard score (0-100)';
COMMENT ON COLUMN beta_applications.scorecard_category_scores IS 'JSONB with scores per category: organization, sharing, monetization/impact, documentation';
COMMENT ON COLUMN beta_applications.scorecard_persona IS 'Assigned persona: gear_architect, organized_creator, aspiring_organizer, emerging_curator, fresh_start';
COMMENT ON COLUMN beta_applications.scorecard_percentile IS 'Percentile ranking among all scored applications';
COMMENT ON COLUMN beta_applications.scorecard_mode IS 'Scoring mode used: monetization or impact (based on user preference)';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_beta_applications_scorecard_score
  ON beta_applications(scorecard_score DESC) WHERE scorecard_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_applications_scorecard_persona
  ON beta_applications(scorecard_persona) WHERE scorecard_persona IS NOT NULL;

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to calculate percentile for a given score
CREATE OR REPLACE FUNCTION calculate_scorecard_percentile(input_score INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_count INTEGER;
  below_count INTEGER;
BEGIN
  -- Count total applications with scores
  SELECT COUNT(*) INTO total_count
  FROM beta_applications
  WHERE scorecard_score IS NOT NULL;

  -- If no scored applications yet, return 50 (middle)
  IF total_count = 0 THEN
    RETURN 50;
  END IF;

  -- Count applications with lower scores
  SELECT COUNT(*) INTO below_count
  FROM beta_applications
  WHERE scorecard_score IS NOT NULL
    AND scorecard_score < input_score;

  -- Calculate percentile (cap at 99 to be humble)
  RETURN LEAST(ROUND((below_count::NUMERIC / total_count) * 100), 99);
END;
$$;

-- Function to get comprehensive scorecard stats for an application
CREATE OR REPLACE FUNCTION get_scorecard_stats(app_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  app_record RECORD;
  calculated_percentile INTEGER;
BEGIN
  -- Fetch application
  SELECT
    scorecard_score,
    scorecard_category_scores,
    scorecard_persona,
    scorecard_mode
  INTO app_record
  FROM beta_applications
  WHERE id = app_id;

  -- Check if application exists
  IF app_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  -- Check if scorecard data exists
  IF app_record.scorecard_score IS NULL THEN
    RETURN jsonb_build_object('error', 'No scorecard data for this application');
  END IF;

  -- Calculate current percentile
  calculated_percentile := calculate_scorecard_percentile(app_record.scorecard_score);

  -- Update stored percentile
  UPDATE beta_applications
  SET scorecard_percentile = calculated_percentile
  WHERE id = app_id;

  -- Return scorecard stats
  RETURN jsonb_build_object(
    'score', app_record.scorecard_score,
    'category_scores', app_record.scorecard_category_scores,
    'persona', app_record.scorecard_persona,
    'percentile', calculated_percentile,
    'mode', COALESCE(app_record.scorecard_mode, 'monetization')
  );
END;
$$;

-- ============================================================================
-- Permissions
-- ============================================================================

-- Grant execute on functions to authenticated users (for API access)
GRANT EXECUTE ON FUNCTION calculate_scorecard_percentile(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_scorecard_stats(UUID) TO authenticated;

-- Service role needs full access
GRANT EXECUTE ON FUNCTION calculate_scorecard_percentile(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_scorecard_stats(UUID) TO service_role;

-- ============================================================================
-- Done
-- ============================================================================

-- To verify migration:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'beta_applications' AND column_name LIKE 'scorecard%';
