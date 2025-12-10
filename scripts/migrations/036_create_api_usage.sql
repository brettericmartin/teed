-- Migration 036: API Usage Tracking
-- Track AI API calls for cost monitoring and analytics

-- ============================================================
-- Step 1: Create api_usage table
-- ============================================================
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who made the request
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Request classification
  endpoint text NOT NULL,                  -- '/api/ai/identify-products'
  model text,                              -- 'gpt-4o', 'gpt-4o-mini', 'google-search'
  operation_type text NOT NULL,            -- 'identify', 'enrich', 'search', 'analyze', 'generate'

  -- Token usage (for OpenAI)
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost tracking (in cents for precision)
  estimated_cost_cents integer DEFAULT 0,

  -- Request metadata
  request_size_bytes integer,              -- Payload size (for images)
  response_size_bytes integer,
  duration_ms integer,                     -- Processing time

  -- Status tracking
  status text NOT NULL DEFAULT 'success',  -- 'success', 'error', 'rate_limited'
  error_code text,
  error_message text,

  -- Context
  session_id text,
  bag_id uuid,

  -- Rate limiting info
  rate_limit_remaining integer,
  rate_limit_reset_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- Step 2: Create indexes for analytics queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_model ON api_usage(model);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_cost_analysis ON api_usage(user_id, model, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_date_cost ON api_usage(created_at, estimated_cost_cents);

-- ============================================================
-- Step 3: Create daily summaries table for dashboard performance
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_usage_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,

  -- User metrics
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  active_users integer DEFAULT 0,

  -- Bag metrics
  total_bags_created integer DEFAULT 0,
  total_items_added integer DEFAULT 0,

  -- AI usage by model
  gpt4o_calls integer DEFAULT 0,
  gpt4o_tokens integer DEFAULT 0,
  gpt4o_cost_cents integer DEFAULT 0,
  gpt4o_mini_calls integer DEFAULT 0,
  gpt4o_mini_tokens integer DEFAULT 0,
  gpt4o_mini_cost_cents integer DEFAULT 0,
  google_search_calls integer DEFAULT 0,
  google_search_cost_cents integer DEFAULT 0,

  -- Aggregates
  total_api_calls integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  total_cost_cents integer DEFAULT 0,

  -- Error tracking
  total_errors integer DEFAULT 0,
  rate_limit_events integer DEFAULT 0,

  -- Engagement
  total_views integer DEFAULT 0,
  total_link_clicks integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_usage_summaries(date DESC);

-- ============================================================
-- Step 4: RLS Policies
-- ============================================================
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_summaries ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own api_usage"
  ON api_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all usage
CREATE POLICY "Admins can view all api_usage"
  ON api_usage FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- System can insert usage records
CREATE POLICY "System can insert api_usage"
  ON api_usage FOR INSERT
  WITH CHECK (true);

-- Only admins can view daily summaries
CREATE POLICY "Admins can view daily_summaries"
  ON daily_usage_summaries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- System can manage daily summaries
CREATE POLICY "System can manage daily_summaries"
  ON daily_usage_summaries FOR ALL TO service_role
  WITH CHECK (true);

-- ============================================================
-- Step 5: Helper functions for analytics
-- ============================================================

-- Get total API cost for a date range
CREATE OR REPLACE FUNCTION get_api_cost_summary(
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  model text,
  total_calls bigint,
  total_tokens bigint,
  total_cost_cents bigint,
  avg_cost_per_call numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_usage.model,
    COUNT(*)::bigint as total_calls,
    SUM(api_usage.total_tokens)::bigint as total_tokens,
    SUM(api_usage.estimated_cost_cents)::bigint as total_cost_cents,
    ROUND(AVG(api_usage.estimated_cost_cents), 2) as avg_cost_per_call
  FROM api_usage
  WHERE api_usage.created_at BETWEEN start_date AND end_date
    AND api_usage.status = 'success'
  GROUP BY api_usage.model
  ORDER BY total_cost_cents DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get top users by API spend
CREATE OR REPLACE FUNCTION get_top_api_users(
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now(),
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  handle text,
  total_calls bigint,
  total_cost_cents bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_usage.user_id,
    profiles.handle,
    COUNT(*)::bigint as total_calls,
    SUM(api_usage.estimated_cost_cents)::bigint as total_cost_cents
  FROM api_usage
  JOIN profiles ON api_usage.user_id = profiles.id
  WHERE api_usage.created_at BETWEEN start_date AND end_date
    AND api_usage.status = 'success'
    AND api_usage.user_id IS NOT NULL
  GROUP BY api_usage.user_id, profiles.handle
  ORDER BY total_cost_cents DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get daily API usage trend
CREATE OR REPLACE FUNCTION get_daily_api_trend(
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  total_calls bigint,
  total_tokens bigint,
  total_cost_cents bigint,
  error_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_usage.created_at::date as date,
    COUNT(*)::bigint as total_calls,
    SUM(api_usage.total_tokens)::bigint as total_tokens,
    SUM(api_usage.estimated_cost_cents)::bigint as total_cost_cents,
    COUNT(*) FILTER (WHERE api_usage.status = 'error')::bigint as error_count
  FROM api_usage
  WHERE api_usage.created_at >= now() - (days_back || ' days')::interval
  GROUP BY api_usage.created_at::date
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comments
COMMENT ON TABLE api_usage IS 'Tracks all AI API calls for cost monitoring and analytics';
COMMENT ON TABLE daily_usage_summaries IS 'Pre-aggregated daily metrics for dashboard performance';
