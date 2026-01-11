-- Migration 054: Enhance Beta Applications
-- Adds survey_responses JSONB, approval tracking, and source tracking

-- Store full survey responses as JSONB (flexible for 10+ questions)
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS survey_responses jsonb DEFAULT '{}';
-- Structure:
-- {
--   "creator_type": "professional_creator",
--   "primary_niche": "golf",
--   "audience_size": "10k-50k",
--   "primary_platform": "instagram",
--   "affiliate_status": "actively",
--   "revenue_goals": "500-2000",
--   "current_tools": ["linktree", "amazon"],
--   "biggest_frustration": "time_consuming",
--   "magic_wand_feature": "AI that finds all my products automatically",
--   "usage_intent": "immediately"
-- }

-- Track which admin approved (foreign key to profiles)
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);

-- Add name column if not exists (some existing records might use full_name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'beta_applications' AND column_name = 'name') THEN
    ALTER TABLE beta_applications ADD COLUMN name text;
    -- Copy from full_name if it exists
    UPDATE beta_applications SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
  END IF;
END $$;

-- Add source tracking for analytics (organic, referral, social, partner, ad)
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'organic';

-- Add use_case column for backwards compatibility with new survey
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS use_case text;

-- Index for survey response analysis
CREATE INDEX IF NOT EXISTS idx_beta_applications_survey
  ON beta_applications USING gin(survey_responses);

-- Index for approval tracking
CREATE INDEX IF NOT EXISTS idx_beta_applications_approved_by
  ON beta_applications(approved_by) WHERE approved_by IS NOT NULL;

-- Updated priority score calculation function
CREATE OR REPLACE FUNCTION calculate_application_priority(app_row beta_applications)
RETURNS integer AS $$
DECLARE
  score integer := 0;
  survey jsonb;
BEGIN
  survey := COALESCE(app_row.survey_responses, '{}'::jsonb);

  -- Audience size scoring (from survey or follower_range)
  score := score + CASE COALESCE(survey->>'audience_size', app_row.follower_range)
    WHEN '50k+' THEN 40
    WHEN '100k+' THEN 40
    WHEN '10k-50k' THEN 30
    WHEN '10k-100k' THEN 30
    WHEN '1k-10k' THEN 20
    WHEN '1K-10K' THEN 20
    WHEN 'under_1k' THEN 10
    WHEN '0-1k' THEN 10
    ELSE 5
  END;

  -- Affiliate status scoring
  score := score + CASE survey->>'affiliate_status'
    WHEN 'actively' THEN 25
    WHEN 'sometimes' THEN 15
    WHEN 'want_to_start' THEN 10
    ELSE 0
  END;

  -- Creator type scoring
  score := score + CASE survey->>'creator_type'
    WHEN 'professional_creator' THEN 20
    WHEN 'brand_ambassador' THEN 15
    WHEN 'serious_hobbyist' THEN 10
    WHEN 'building_audience' THEN 5
    ELSE 0
  END;

  -- Usage intent (commitment indicator)
  score := score + CASE survey->>'usage_intent'
    WHEN 'immediately' THEN 15
    WHEN 'this_week' THEN 10
    WHEN 'explore_first' THEN 5
    ELSE 0
  END;

  -- Referral bonus (came via invite code)
  IF app_row.referred_by_code IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Early application bonus (first 100 get extra points)
  IF app_row.waitlist_position IS NOT NULL AND app_row.waitlist_position <= 100 THEN
    score := score + GREATEST(10 - (app_row.waitlist_position / 10), 0);
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate priority on insert/update
CREATE OR REPLACE FUNCTION update_application_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_score := calculate_application_priority(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_priority_on_application ON beta_applications;
CREATE TRIGGER calculate_priority_on_application
  BEFORE INSERT OR UPDATE OF survey_responses, follower_range, referred_by_code
  ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_priority();

-- Comment
COMMENT ON COLUMN beta_applications.survey_responses IS 'JSONB storage for 10-question survey responses';
COMMENT ON COLUMN beta_applications.approved_by IS 'Admin who approved this application';
COMMENT ON COLUMN beta_applications.source IS 'Traffic source: organic, referral, social, partner, ad';
