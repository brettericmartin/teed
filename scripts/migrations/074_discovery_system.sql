-- Migration 074: Discovery Curation Team System
-- Tracks content discovery, product extraction, and automated bag creation
-- Run with: node -e "require('pg')..." or via pg client

-- ============================================================================
-- Discovery Sources - Track content we've researched
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,  -- 'youtube', 'tiktok', 'website', 'rss'
  source_url TEXT NOT NULL,
  source_title TEXT,
  category TEXT NOT NULL,  -- 'golf', 'tech', 'photography', 'edc', 'fitness'
  transcript TEXT,  -- YouTube/TikTok transcript if available
  metadata JSONB DEFAULT '{}',  -- Additional source metadata (views, likes, etc.)
  processed_at TIMESTAMPTZ,  -- When we finished processing
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT discovery_sources_url_unique UNIQUE (source_url)
);

COMMENT ON TABLE discovery_sources IS 'Content sources discovered and processed by the Discovery Curation Team';
COMMENT ON COLUMN discovery_sources.source_type IS 'Type of source: youtube, tiktok, website, rss';
COMMENT ON COLUMN discovery_sources.category IS 'Category: golf, tech, photography, edc, fitness';
COMMENT ON COLUMN discovery_sources.transcript IS 'Video transcript for product extraction';

-- ============================================================================
-- Discovered Products - Products extracted from sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovered_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES discovery_sources(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  why_notable TEXT,  -- What makes this product interesting/trending
  source_link TEXT,  -- Link from original content (affiliate, product page)
  image_url TEXT,  -- Best image we found
  image_source TEXT,  -- Where image came from: 'source', 'library', 'manufacturer', 'google'
  confidence INTEGER DEFAULT 50,  -- 0-100 identification confidence
  matched_catalog_id UUID,  -- Reference to product library if matched
  added_to_bag_id UUID REFERENCES bags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE discovered_products IS 'Products extracted from discovery sources';
COMMENT ON COLUMN discovered_products.confidence IS '0-100 confidence in product identification';
COMMENT ON COLUMN discovered_products.image_source IS 'Where the image came from: source, library, manufacturer, google';

-- ============================================================================
-- Discovery Runs - Track each discovery execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  status TEXT DEFAULT 'running',  -- 'running', 'completed', 'failed'
  sources_found INTEGER DEFAULT 0,
  sources_processed INTEGER DEFAULT 0,
  products_found INTEGER DEFAULT 0,
  bags_created INTEGER DEFAULT 0,
  bag_ids UUID[] DEFAULT '{}',  -- IDs of bags created in this run
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  run_config JSONB DEFAULT '{}'  -- Config used for this run
);

COMMENT ON TABLE discovery_runs IS 'Tracks each execution of the Discovery Curation Team';

-- ============================================================================
-- Library Gaps - Products we couldn't match (for expansion)
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_library_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  mention_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  source_urls TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_catalog_id UUID,

  CONSTRAINT discovery_gaps_unique UNIQUE (product_name, brand, category)
);

COMMENT ON TABLE discovery_library_gaps IS 'Products mentioned in content but not in our library';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_discovery_sources_category ON discovery_sources(category);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_type ON discovery_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_created ON discovery_sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_processed ON discovery_sources(processed_at);

CREATE INDEX IF NOT EXISTS idx_discovered_products_source ON discovered_products(source_id);
CREATE INDEX IF NOT EXISTS idx_discovered_products_confidence ON discovered_products(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_products_bag ON discovered_products(added_to_bag_id);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_category ON discovery_runs(category);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON discovery_runs(status);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_started ON discovery_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_gaps_category ON discovery_library_gaps(category);
CREATE INDEX IF NOT EXISTS idx_discovery_gaps_mentions ON discovery_library_gaps(mention_count DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_gaps_unresolved ON discovery_library_gaps(resolved) WHERE resolved = FALSE;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Increment gap mention count or create new gap
CREATE OR REPLACE FUNCTION record_library_gap(
  p_product_name TEXT,
  p_brand TEXT,
  p_category TEXT,
  p_source_url TEXT
) RETURNS UUID AS $$
DECLARE
  gap_id UUID;
BEGIN
  INSERT INTO discovery_library_gaps (product_name, brand, category, source_urls)
  VALUES (p_product_name, p_brand, p_category, ARRAY[p_source_url])
  ON CONFLICT (product_name, brand, category) DO UPDATE
  SET
    mention_count = discovery_library_gaps.mention_count + 1,
    last_seen_at = NOW(),
    source_urls = CASE
      WHEN NOT (p_source_url = ANY(discovery_library_gaps.source_urls))
      THEN array_append(discovery_library_gaps.source_urls, p_source_url)
      ELSE discovery_library_gaps.source_urls
    END
  RETURNING id INTO gap_id;

  RETURN gap_id;
END;
$$ LANGUAGE plpgsql;

-- Get discovery stats for a category
CREATE OR REPLACE FUNCTION get_discovery_stats(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  category TEXT,
  total_sources BIGINT,
  total_products BIGINT,
  total_bags BIGINT,
  unresolved_gaps BIGINT,
  last_run TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p_category, ds.category) as category,
    COUNT(DISTINCT ds.id) as total_sources,
    COUNT(DISTINCT dp.id) as total_products,
    COUNT(DISTINCT dp.added_to_bag_id) as total_bags,
    (SELECT COUNT(*) FROM discovery_library_gaps g
     WHERE (p_category IS NULL OR g.category = p_category) AND NOT g.resolved) as unresolved_gaps,
    (SELECT MAX(started_at) FROM discovery_runs r
     WHERE p_category IS NULL OR r.category = p_category) as last_run
  FROM discovery_sources ds
  LEFT JOIN discovered_products dp ON dp.source_id = ds.id
  WHERE p_category IS NULL OR ds.category = p_category
  GROUP BY COALESCE(p_category, ds.category);
END;
$$ LANGUAGE plpgsql;
