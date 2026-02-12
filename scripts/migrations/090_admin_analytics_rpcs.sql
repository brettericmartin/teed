-- Admin analytics RPCs for dashboard tabs
-- These functions power the Growth/Funnel, Retention, Content, and Feature tabs

-- 1. Activation funnel: count users at each stage
CREATE OR REPLACE FUNCTION get_activation_funnel(start_date timestamptz DEFAULT now() - interval '30 days')
RETURNS TABLE (
  stage text,
  user_count bigint
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  -- Signed up (all profiles created after start_date)
  SELECT 'signed_up'::text, count(*) FROM profiles WHERE created_at >= start_date
  UNION ALL
  -- Created first bag
  SELECT 'created_bag'::text, count(DISTINCT owner_id) FROM bags WHERE created_at >= start_date
  UNION ALL
  -- Added first item
  SELECT 'added_item'::text, count(DISTINCT b.owner_id)
  FROM bag_items bi
  JOIN bags b ON b.id = bi.bag_id
  WHERE bi.created_at >= start_date
  UNION ALL
  -- Made bag public
  SELECT 'made_public'::text, count(DISTINCT owner_id) FROM bags WHERE is_public = true AND created_at >= start_date
  UNION ALL
  -- Got first view (has bag_viewed event)
  SELECT 'got_view'::text, count(DISTINCT (ua.event_data->>'owner_id'))
  FROM user_activity ua
  WHERE ua.event_type = 'bag_viewed'
  AND ua.created_at >= start_date
  AND ua.event_data->>'owner_id' IS NOT NULL;
$$;

-- 2. Weekly cohort retention
CREATE OR REPLACE FUNCTION get_weekly_cohort_retention(weeks_back int DEFAULT 8)
RETURNS TABLE (
  cohort_week date,
  week_number int,
  cohort_size bigint,
  retained_users bigint,
  retention_rate numeric
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH cohorts AS (
    SELECT
      id AS user_id,
      date_trunc('week', created_at)::date AS cohort_week
    FROM profiles
    WHERE created_at >= now() - (weeks_back || ' weeks')::interval
  ),
  activity AS (
    SELECT DISTINCT
      user_id,
      date_trunc('week', last_active_at)::date AS active_week
    FROM profiles
    WHERE last_active_at IS NOT NULL
    AND created_at >= now() - (weeks_back || ' weeks')::interval
  ),
  cohort_sizes AS (
    SELECT cohort_week, count(*) AS cohort_size
    FROM cohorts
    GROUP BY cohort_week
  ),
  retention AS (
    SELECT
      c.cohort_week,
      ((a.active_week - c.cohort_week) / 7)::int AS week_number,
      count(DISTINCT c.user_id) AS retained_users
    FROM cohorts c
    LEFT JOIN activity a ON a.user_id = c.user_id AND a.active_week >= c.cohort_week
    GROUP BY c.cohort_week, week_number
  )
  SELECT
    r.cohort_week,
    r.week_number,
    cs.cohort_size,
    r.retained_users,
    CASE WHEN cs.cohort_size > 0
      THEN round((r.retained_users::numeric / cs.cohort_size) * 100, 1)
      ELSE 0
    END AS retention_rate
  FROM retention r
  JOIN cohort_sizes cs ON cs.cohort_week = r.cohort_week
  WHERE r.week_number >= 0 AND r.week_number <= weeks_back
  ORDER BY r.cohort_week, r.week_number;
$$;

-- 3. Active user metrics (DAU/WAU/MAU)
CREATE OR REPLACE FUNCTION get_active_user_metrics(days_back int DEFAULT 90)
RETURNS TABLE (
  metric_date date,
  dau bigint,
  wau bigint,
  mau bigint
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH dates AS (
    SELECT generate_series(
      (now() - (days_back || ' days')::interval)::date,
      now()::date,
      '1 day'::interval
    )::date AS d
  ),
  daily_active AS (
    SELECT
      last_active_at::date AS active_date,
      id AS user_id
    FROM profiles
    WHERE last_active_at >= now() - (days_back || ' days')::interval
  )
  SELECT
    dates.d AS metric_date,
    (SELECT count(DISTINCT user_id) FROM daily_active WHERE active_date = dates.d) AS dau,
    (SELECT count(DISTINCT user_id) FROM daily_active WHERE active_date BETWEEN dates.d - 6 AND dates.d) AS wau,
    (SELECT count(DISTINCT user_id) FROM daily_active WHERE active_date BETWEEN dates.d - 29 AND dates.d) AS mau
  FROM dates
  ORDER BY dates.d;
$$;

-- 4. User health segments
CREATE OR REPLACE FUNCTION get_user_health_segments()
RETURNS TABLE (
  segment text,
  user_count bigint,
  percentage numeric
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH total AS (
    SELECT count(*) AS total_users FROM profiles
  ),
  segments AS (
    SELECT
      CASE
        WHEN last_active_at >= now() - interval '24 hours' THEN 'power'
        WHEN last_active_at >= now() - interval '7 days' THEN 'regular'
        WHEN last_active_at >= now() - interval '30 days' THEN 'casual'
        WHEN last_active_at >= now() - interval '90 days' THEN 'dormant'
        ELSE 'churned'
      END AS segment,
      count(*) AS user_count
    FROM profiles
    GROUP BY segment
  )
  SELECT
    s.segment,
    s.user_count,
    CASE WHEN t.total_users > 0
      THEN round((s.user_count::numeric / t.total_users) * 100, 1)
      ELSE 0
    END AS percentage
  FROM segments s, total t
  ORDER BY
    CASE s.segment
      WHEN 'power' THEN 1
      WHEN 'regular' THEN 2
      WHEN 'casual' THEN 3
      WHEN 'dormant' THEN 4
      WHEN 'churned' THEN 5
    END;
$$;

-- 5. Content page stats (requires page_viewed events from Phase 1)
CREATE OR REPLACE FUNCTION get_content_page_stats(start_date timestamptz DEFAULT now() - interval '30 days')
RETURNS TABLE (
  page text,
  views bigint,
  unique_sessions bigint
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    event_data->>'page' AS page,
    count(*) AS views,
    count(DISTINCT session_id) AS unique_sessions
  FROM user_activity
  WHERE event_type = 'page_viewed'
  AND created_at >= start_date
  AND event_data->>'page' IS NOT NULL
  GROUP BY event_data->>'page'
  ORDER BY views DESC
  LIMIT 50;
$$;

-- 6. Feature adoption (requires new events from Phase 1)
CREATE OR REPLACE FUNCTION get_feature_adoption(start_date timestamptz DEFAULT now() - interval '30 days')
RETURNS TABLE (
  feature text,
  unique_users bigint,
  total_events bigint
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    event_type AS feature,
    count(DISTINCT user_id) AS unique_users,
    count(*) AS total_events
  FROM user_activity
  WHERE created_at >= start_date
  AND event_type IN (
    'bag_created', 'item_added', 'search_performed',
    'bag_shared', 'bag_cloned', 'item_copied_to_bag',
    'paste_detected', 'settings_saved', 'social_link_clicked'
  )
  GROUP BY event_type
  ORDER BY unique_users DESC;
$$;
