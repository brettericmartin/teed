-- Migration 070: Strategic Initiatives
-- Creates tables for storing detailed strategic initiative plans
-- Evaluated and approved through the Advisory Board framework

-- ============================================================
-- Step 1: Create strategic_initiatives table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.strategic_initiatives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- ────────────────────────────────────────────────────────────
  -- Core Initiative Info
  -- ────────────────────────────────────────────────────────────
  title text NOT NULL,                        -- e.g. "Teed MCP Server"
  slug text NOT NULL UNIQUE,                  -- URL-safe identifier e.g. "mcp-server"
  category text NOT NULL,                     -- 'infrastructure', 'growth', 'monetization', 'product', 'b2b'
  priority integer DEFAULT 0,                 -- Higher = more important (for ordering)
  status text NOT NULL DEFAULT 'draft',       -- 'draft', 'in_review', 'approved', 'in_progress', 'completed', 'archived'

  -- ────────────────────────────────────────────────────────────
  -- Executive Summary
  -- ────────────────────────────────────────────────────────────
  tagline text,                               -- One-line description
  executive_summary text,                     -- 2-3 paragraph summary
  problem_statement text,                     -- What pain does this solve?
  solution_overview text,                     -- What are we building?

  -- ────────────────────────────────────────────────────────────
  -- Detailed Plan (Markdown)
  -- ────────────────────────────────────────────────────────────
  full_plan text,                             -- Complete markdown document
  technical_architecture text,                -- Technical details section
  user_stories jsonb DEFAULT '[]'::jsonb,     -- Array of user story objects
  feature_phases jsonb DEFAULT '[]'::jsonb,   -- Array of {phase, features[]}

  -- ────────────────────────────────────────────────────────────
  -- Business Case
  -- ────────────────────────────────────────────────────────────
  success_metrics jsonb DEFAULT '[]'::jsonb,  -- Array of {metric, target, rationale}
  risk_assessment jsonb DEFAULT '[]'::jsonb,  -- Array of {risk, likelihood, impact, mitigation}
  resource_requirements text,                 -- What do we need?
  estimated_effort text,                      -- 'small', 'medium', 'large', 'xlarge'

  -- ────────────────────────────────────────────────────────────
  -- Advisory Board Evaluation
  -- ────────────────────────────────────────────────────────────
  board_evaluation jsonb DEFAULT '{}'::jsonb, -- Full evaluation scores and verdicts
  -- Structure: {
  --   "daniel_priestley": {"score": 9, "verdict": "approved", "notes": "..."},
  --   "julie_zhuo": {"score": 8, "verdict": "approved", "notes": "..."},
  --   "li_jin": {"score": 10, "verdict": "approved", "notes": "..."},
  --   "emily_heyward": {"score": 8, "verdict": "approved", "notes": "..."},
  --   "codie_sanchez": {"score": 9, "verdict": "approved", "notes": "..."},
  --   "overall_score": 44,
  --   "board_decision": "5/5 APPROVAL"
  -- }
  doctrine_compliance jsonb DEFAULT '[]'::jsonb, -- Array of {check, passed, notes}
  board_notes text,                           -- Overall board commentary

  -- ────────────────────────────────────────────────────────────
  -- Workflow
  -- ────────────────────────────────────────────────────────────
  created_by_admin_id uuid,                   -- Who created this
  reviewed_at timestamptz,                    -- When board reviewed
  approved_at timestamptz,                    -- When approved for implementation
  started_at timestamptz,                     -- When implementation began
  completed_at timestamptz,                   -- When completed

  -- ────────────────────────────────────────────────────────────
  -- Versioning
  -- ────────────────────────────────────────────────────────────
  version integer DEFAULT 1,                  -- Iteration count
  previous_version_id uuid,                   -- Link to previous version
  revision_notes text,                        -- What changed in this version

  -- ────────────────────────────────────────────────────────────
  -- Timestamps
  -- ────────────────────────────────────────────────────────────
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- ────────────────────────────────────────────────────────────
  -- Constraints
  -- ────────────────────────────────────────────────────────────
  CONSTRAINT strategic_initiatives_pkey PRIMARY KEY (id),
  CONSTRAINT strategic_initiatives_status_check CHECK (status IN (
    'draft', 'in_review', 'approved', 'in_progress', 'completed', 'archived'
  )),
  CONSTRAINT strategic_initiatives_category_check CHECK (category IN (
    'infrastructure', 'growth', 'monetization', 'product', 'b2b', 'platform'
  )),
  CONSTRAINT strategic_initiatives_effort_check CHECK (estimated_effort IS NULL OR estimated_effort IN (
    'small', 'medium', 'large', 'xlarge'
  )),
  CONSTRAINT strategic_initiatives_created_by_fkey FOREIGN KEY (created_by_admin_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT strategic_initiatives_previous_version_fkey FOREIGN KEY (previous_version_id)
    REFERENCES public.strategic_initiatives(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.strategic_initiatives IS 'Strategic initiative plans evaluated through Advisory Board framework';
COMMENT ON COLUMN public.strategic_initiatives.board_evaluation IS 'JSON scores from each advisory board member with verdicts';
COMMENT ON COLUMN public.strategic_initiatives.doctrine_compliance IS 'Checklist of Teed doctrine alignment checks';
COMMENT ON COLUMN public.strategic_initiatives.feature_phases IS 'Phased feature breakdown [{phase: "Phase 1", title: "...", features: [...]}]';

-- ============================================================
-- Step 2: Create initiative_comments table for board discussion
-- ============================================================
CREATE TABLE IF NOT EXISTS public.initiative_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL,
  admin_id uuid NOT NULL,

  -- Comment content
  comment text NOT NULL,
  advisor_perspective text,                   -- Which advisor lens: 'daniel_priestley', 'julie_zhuo', etc.
  comment_type text DEFAULT 'feedback',       -- 'feedback', 'question', 'approval', 'revision_request'

  -- Threading
  parent_comment_id uuid,                     -- For replies

  -- Status
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by_admin_id uuid,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT initiative_comments_pkey PRIMARY KEY (id),
  CONSTRAINT initiative_comments_initiative_fkey FOREIGN KEY (initiative_id)
    REFERENCES public.strategic_initiatives(id) ON DELETE CASCADE,
  CONSTRAINT initiative_comments_admin_fkey FOREIGN KEY (admin_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT initiative_comments_parent_fkey FOREIGN KEY (parent_comment_id)
    REFERENCES public.initiative_comments(id) ON DELETE CASCADE,
  CONSTRAINT initiative_comments_resolved_by_fkey FOREIGN KEY (resolved_by_admin_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT initiative_comments_type_check CHECK (comment_type IN (
    'feedback', 'question', 'approval', 'revision_request', 'implementation_note'
  )),
  CONSTRAINT initiative_comments_perspective_check CHECK (advisor_perspective IS NULL OR advisor_perspective IN (
    'daniel_priestley', 'julie_zhuo', 'li_jin', 'emily_heyward', 'codie_sanchez', 'general'
  ))
);

COMMENT ON TABLE public.initiative_comments IS 'Discussion and feedback on strategic initiatives';

-- ============================================================
-- Step 3: Create indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_status ON public.strategic_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_category ON public.strategic_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_priority ON public.strategic_initiatives(priority DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_slug ON public.strategic_initiatives(slug);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_created_at ON public.strategic_initiatives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_initiatives_status_priority ON public.strategic_initiatives(status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_initiative_comments_initiative ON public.initiative_comments(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_comments_admin ON public.initiative_comments(admin_id);
CREATE INDEX IF NOT EXISTS idx_initiative_comments_created_at ON public.initiative_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_initiative_comments_unresolved ON public.initiative_comments(initiative_id)
  WHERE is_resolved = false;

-- ============================================================
-- Step 4: Create updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_strategic_initiatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategic_initiatives_updated_at ON public.strategic_initiatives;
CREATE TRIGGER strategic_initiatives_updated_at
  BEFORE UPDATE ON public.strategic_initiatives
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_initiatives_updated_at();

CREATE OR REPLACE FUNCTION update_initiative_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS initiative_comments_updated_at ON public.initiative_comments;
CREATE TRIGGER initiative_comments_updated_at
  BEFORE UPDATE ON public.initiative_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_initiative_comments_updated_at();

-- ============================================================
-- Step 5: Enable RLS
-- ============================================================
ALTER TABLE public.strategic_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_comments ENABLE ROW LEVEL SECURITY;

-- Admins can view all initiatives
CREATE POLICY "Admins can view initiatives"
  ON public.strategic_initiatives
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Admins can create initiatives
CREATE POLICY "Admins can create initiatives"
  ON public.strategic_initiatives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Admins can update initiatives
CREATE POLICY "Admins can update initiatives"
  ON public.strategic_initiatives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Only super_admin can delete initiatives
CREATE POLICY "Super admins can delete initiatives"
  ON public.strategic_initiatives
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role = 'super_admin'
    )
  );

-- Comments policies (same pattern)
CREATE POLICY "Admins can view comments"
  ON public.initiative_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admins can create comments"
  ON public.initiative_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update own comments"
  ON public.initiative_comments
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete comments"
  ON public.initiative_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role = 'super_admin'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to initiatives"
  ON public.strategic_initiatives
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to comments"
  ON public.initiative_comments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Step 6: Helper functions
-- ============================================================

-- Get initiatives with board scores
CREATE OR REPLACE FUNCTION get_initiatives_overview(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  category text,
  status text,
  tagline text,
  priority integer,
  estimated_effort text,
  overall_score integer,
  board_decision text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.title,
    si.slug,
    si.category,
    si.status,
    si.tagline,
    si.priority,
    si.estimated_effort,
    (si.board_evaluation->>'overall_score')::integer,
    si.board_evaluation->>'board_decision',
    si.created_at,
    si.updated_at
  FROM public.strategic_initiatives si
  WHERE (p_status IS NULL OR si.status = p_status)
    AND (p_category IS NULL OR si.category = p_category)
  ORDER BY si.priority DESC, si.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Count initiatives by status
CREATE OR REPLACE FUNCTION count_initiatives_by_status()
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT si.status, COUNT(*)::bigint
  FROM public.strategic_initiatives si
  GROUP BY si.status
  ORDER BY
    CASE si.status
      WHEN 'in_progress' THEN 1
      WHEN 'approved' THEN 2
      WHEN 'in_review' THEN 3
      WHEN 'draft' THEN 4
      WHEN 'completed' THEN 5
      WHEN 'archived' THEN 6
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
