-- Migration 025: Survey Responses Table
-- Stores NPS scores, onboarding surveys, feature ratings, and exit interviews

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who responded
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Survey classification
  survey_type text NOT NULL CHECK (survey_type IN (
    'nps',              -- Net Promoter Score (0-10)
    'onboarding',       -- Post-onboarding feedback
    'feature_rating',   -- Rating a specific feature (1-5)
    'micro',            -- Quick contextual survey (1-5 or emoji)
    'exit'              -- Exit interview when churning
  )),

  -- What triggered this survey
  trigger_event text,
  -- Examples: 'day_7', 'day_30', 'monthly', 'first_bag_created', 'ai_used', 'inactive_14_days'

  -- Numeric score
  score integer,
  -- NPS: 0-10
  -- Feature/micro: 1-5
  -- Onboarding: 1-5

  -- Structured answers (for multi-question surveys)
  answers jsonb DEFAULT '{}',
  -- Example for onboarding:
  -- { "ease_of_use": 4, "found_what_needed": true, "would_recommend": true }

  -- Open-ended feedback
  feedback_text text,

  -- Context
  feature_name text,     -- For feature_rating surveys
  page_url text,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_type ON survey_responses(survey_type);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created ON survey_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_nps ON survey_responses(score) WHERE survey_type = 'nps';

-- RLS Policies
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own survey responses"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can submit responses
CREATE POLICY "Users can submit survey responses"
  ON survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to calculate current NPS score
CREATE OR REPLACE FUNCTION calculate_nps(days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  promoters bigint;
  passives bigint;
  detractors bigint;
  total bigint;
  nps_score numeric;
BEGIN
  -- Count responses by category
  SELECT
    COUNT(*) FILTER (WHERE score >= 9) as promoters,
    COUNT(*) FILTER (WHERE score BETWEEN 7 AND 8) as passives,
    COUNT(*) FILTER (WHERE score <= 6) as detractors,
    COUNT(*) as total
  INTO promoters, passives, detractors, total
  FROM survey_responses
  WHERE survey_type = 'nps'
    AND created_at > now() - (days_back || ' days')::interval;

  IF total = 0 THEN
    RETURN jsonb_build_object(
      'nps_score', null,
      'promoters', 0,
      'passives', 0,
      'detractors', 0,
      'total_responses', 0
    );
  END IF;

  -- NPS = % Promoters - % Detractors
  nps_score := ROUND((promoters::numeric / total * 100) - (detractors::numeric / total * 100));

  RETURN jsonb_build_object(
    'nps_score', nps_score,
    'promoters', promoters,
    'passives', passives,
    'detractors', detractors,
    'total_responses', total,
    'promoter_pct', ROUND(promoters::numeric / total * 100, 1),
    'passive_pct', ROUND(passives::numeric / total * 100, 1),
    'detractor_pct', ROUND(detractors::numeric / total * 100, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should see NPS survey
CREATE OR REPLACE FUNCTION should_show_nps_survey(check_user_id uuid)
RETURNS boolean AS $$
DECLARE
  last_nps_date timestamptz;
  user_signup_date timestamptz;
  days_since_signup integer;
BEGIN
  -- Get user's signup date
  SELECT created_at INTO user_signup_date
  FROM profiles
  WHERE id = check_user_id;

  IF user_signup_date IS NULL THEN
    RETURN false;
  END IF;

  days_since_signup := EXTRACT(DAY FROM now() - user_signup_date);

  -- Get last NPS response
  SELECT MAX(created_at) INTO last_nps_date
  FROM survey_responses
  WHERE user_id = check_user_id
    AND survey_type = 'nps';

  -- Show on day 7, 30, then every 90 days
  IF last_nps_date IS NULL THEN
    -- Never taken: show at day 7 or later
    RETURN days_since_signup >= 7;
  ELSE
    -- Has taken before: show if 90+ days since last one
    RETURN (now() - last_nps_date) > interval '90 days';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE survey_responses IS 'User survey responses including NPS, feature ratings, and exit interviews';
