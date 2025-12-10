-- Migration 039: Content Ideas (Social Media Manager)
-- Creates the content_ideas table for the idea machine feature
-- This is the ONLY new table for this feature; everything else uses existing tables

-- ============================================================
-- Step 1: Create content_ideas table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- ────────────────────────────────────────────────────────────
  -- Source info (where the content came from)
  -- ────────────────────────────────────────────────────────────
  source_platform text NOT NULL,           -- 'youtube' initially, extensible to 'tiktok', 'instagram', etc.
  source_url text NOT NULL,                -- canonical video URL
  source_channel_name text,                -- e.g. "Rick Shiels Golf"
  source_creator_handle text,              -- e.g. "@rickshielsgolf" if available
  source_published_at timestamptz,         -- when the source content was published
  source_metadata jsonb DEFAULT '{}'::jsonb,   -- title, description, stats, raw API payload, thumbnails

  -- ────────────────────────────────────────────────────────────
  -- Connection into Teed
  -- ────────────────────────────────────────────────────────────
  primary_bag_id uuid,                     -- optional: a Teed bag representing this creator's setup
  primary_catalog_item_id uuid,            -- optional: main hero item if directly mapped to catalog
  hero_catalog_item_ids jsonb DEFAULT '[]'::jsonb,  -- array of catalog_item UUIDs (when >1 hero)
  hero_bag_item_ids jsonb DEFAULT '[]'::jsonb,      -- array of bag_item UUIDs if mapped to specific bag items

  -- ────────────────────────────────────────────────────────────
  -- Story & angle (what makes this interesting)
  -- ────────────────────────────────────────────────────────────
  vertical text,                            -- 'golf', 'camera', 'makeup', 'desk', 'tech', 'edc', etc.
  idea_title text,                          -- catchy title for the content idea
  idea_summary text,                        -- 2-3 sentence summary
  why_interesting_to_creator text,          -- story/meaning from creator's POV (sentimental, journey, etc.)
  why_interesting_to_audience text,         -- why viewers care (aspirational, educational, relatable)

  -- ────────────────────────────────────────────────────────────
  -- Content assets (LLM generated, editable by admin)
  -- ────────────────────────────────────────────────────────────
  hook_options jsonb DEFAULT '[]'::jsonb,          -- array of short-form hook variations
  -- Example: [{"hook": "This $50 putter outperformed his Scotty Cameron...", "platform": "tiktok", "style": "curiosity"}]

  long_form_outline jsonb DEFAULT '{}'::jsonb,     -- structured outline for long-form video
  -- Example: {"intro": "...", "creator_story": "...", "hero_breakdown": "...", "comparison": "...", "cta": "..."}

  short_form_ideas jsonb DEFAULT '[]'::jsonb,      -- proposed clips/shorts derived from long-form
  -- Example: [{"hook": "...", "duration_seconds": 45, "focus_item": "uuid", "beat_type": "story|tip|reaction"}]

  tags jsonb DEFAULT '[]'::jsonb,                  -- general tags for filtering/discovery
  -- Example: ["sentimental", "tour-pro", "budget", "retro", "high-tech", "underrated"]

  -- ────────────────────────────────────────────────────────────
  -- Affiliate and ethics
  -- ────────────────────────────────────────────────────────────
  affiliate_notes text,                     -- explanation of which links belong to creator vs Teed
  has_creator_affiliate boolean DEFAULT false,  -- true if creator has their own affiliate links

  -- ────────────────────────────────────────────────────────────
  -- Workflow
  -- ────────────────────────────────────────────────────────────
  status text NOT NULL DEFAULT 'new',       -- 'new', 'in_review', 'approved', 'archived', 'rejected'
  created_by_admin_id uuid,                 -- profiles.id of admin that curated/approved
  reviewed_at timestamptz,                  -- when an admin first reviewed
  approved_at timestamptz,                  -- when approved for use

  -- ────────────────────────────────────────────────────────────
  -- Timestamps
  -- ────────────────────────────────────────────────────────────
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- ────────────────────────────────────────────────────────────
  -- Constraints
  -- ────────────────────────────────────────────────────────────
  CONSTRAINT content_ideas_pkey PRIMARY KEY (id),
  CONSTRAINT content_ideas_status_check CHECK (status IN ('new', 'in_review', 'approved', 'archived', 'rejected')),
  CONSTRAINT content_ideas_vertical_check CHECK (vertical IS NULL OR vertical IN (
    'golf', 'camera', 'makeup', 'desk', 'tech', 'edc', 'fitness', 'music', 'art', 'gaming', 'travel', 'food', 'fashion', 'other'
  )),
  CONSTRAINT content_ideas_primary_bag_id_fkey FOREIGN KEY (primary_bag_id) REFERENCES public.bags(id) ON DELETE SET NULL,
  CONSTRAINT content_ideas_primary_catalog_item_id_fkey FOREIGN KEY (primary_catalog_item_id) REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  CONSTRAINT content_ideas_created_by_admin_id_fkey FOREIGN KEY (created_by_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE public.content_ideas IS 'Content ideas generated from external videos (YouTube WITB, etc.) for the Social Media Manager feature';
COMMENT ON COLUMN public.content_ideas.source_metadata IS 'Raw API payload including title, description, view count, likes, thumbnails, etc.';
COMMENT ON COLUMN public.content_ideas.hero_catalog_item_ids IS 'JSON array of catalog_item UUIDs selected as hero/featured items';
COMMENT ON COLUMN public.content_ideas.why_interesting_to_creator IS 'Focus on story, history, sentiment, quirks - not just specs';
COMMENT ON COLUMN public.content_ideas.why_interesting_to_audience IS 'Focus on relatability, aspiration, curiosity, education';
COMMENT ON COLUMN public.content_ideas.has_creator_affiliate IS 'If true, creator affiliate links take priority over Teed links';

-- ============================================================
-- Step 2: Create indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON public.content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_vertical ON public.content_ideas(vertical);
CREATE INDEX IF NOT EXISTS idx_content_ideas_created_at ON public.content_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_ideas_source_url ON public.content_ideas(source_url);
CREATE INDEX IF NOT EXISTS idx_content_ideas_source_platform ON public.content_ideas(source_platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_has_creator_affiliate ON public.content_ideas(has_creator_affiliate);
CREATE INDEX IF NOT EXISTS idx_content_ideas_primary_bag ON public.content_ideas(primary_bag_id) WHERE primary_bag_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_ideas_vertical_status ON public.content_ideas(vertical, status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_reviewed ON public.content_ideas(reviewed_at DESC NULLS LAST);

-- GIN index for JSONB tag searching
CREATE INDEX IF NOT EXISTS idx_content_ideas_tags ON public.content_ideas USING GIN (tags);

-- ============================================================
-- Step 3: Create updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_content_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_ideas_updated_at ON public.content_ideas;
CREATE TRIGGER content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_content_ideas_updated_at();

-- ============================================================
-- Step 4: Enable RLS
-- ============================================================
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

-- Admins can view all content ideas
CREATE POLICY "Admins can view content ideas"
  ON public.content_ideas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Admins can insert content ideas
CREATE POLICY "Admins can create content ideas"
  ON public.content_ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Admins can update content ideas
CREATE POLICY "Admins can update content ideas"
  ON public.content_ideas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Only super_admin can delete content ideas
CREATE POLICY "Super admins can delete content ideas"
  ON public.content_ideas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role = 'super_admin'
    )
  );

-- Service role can do everything (for API ingestion)
CREATE POLICY "Service role full access"
  ON public.content_ideas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Step 5: Helper functions
-- ============================================================

-- Get content ideas by status with optional vertical filter
CREATE OR REPLACE FUNCTION get_content_ideas_by_status(
  p_status text DEFAULT NULL,
  p_vertical text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  source_platform text,
  source_url text,
  source_channel_name text,
  source_published_at timestamptz,
  vertical text,
  idea_title text,
  idea_summary text,
  status text,
  has_creator_affiliate boolean,
  tags jsonb,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.source_platform,
    ci.source_url,
    ci.source_channel_name,
    ci.source_published_at,
    ci.vertical,
    ci.idea_title,
    ci.idea_summary,
    ci.status,
    ci.has_creator_affiliate,
    ci.tags,
    ci.created_at,
    ci.updated_at
  FROM public.content_ideas ci
  WHERE (p_status IS NULL OR ci.status = p_status)
    AND (p_vertical IS NULL OR ci.vertical = p_vertical)
  ORDER BY ci.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Count content ideas by status
CREATE OR REPLACE FUNCTION count_content_ideas_by_status()
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT ci.status, COUNT(*)::bigint
  FROM public.content_ideas ci
  GROUP BY ci.status
  ORDER BY ci.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Log initial setup
INSERT INTO admin_audit_log (
  admin_id,
  admin_email,
  admin_role,
  action,
  target_type,
  details
)
SELECT
  p.id,
  'system',
  COALESCE(p.admin_role, 'system'),
  'system.migration',
  'system',
  jsonb_build_object(
    'reason', 'Content Ideas table created for Social Media Manager feature',
    'migration', '039_create_content_ideas',
    'table_created', 'content_ideas'
  )
FROM profiles p
WHERE p.admin_role = 'super_admin'
LIMIT 1;
