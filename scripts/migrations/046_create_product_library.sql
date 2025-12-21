-- Product Library: Persistent cache for scraped product data
-- Reduces Firecrawl API usage by storing successful scrapes
-- Can be used by all users to avoid re-scraping the same products

CREATE TABLE IF NOT EXISTS product_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- URL matching (primary lookup key)
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL, -- SHA256 hash for fast lookup (unique index)
    domain TEXT NOT NULL,

    -- Product identification
    brand TEXT,
    product_name TEXT,
    full_name TEXT,
    category TEXT,

    -- Product details
    description TEXT,
    price TEXT,
    image_url TEXT,
    specifications TEXT[], -- Array of specs

    -- Quality/source metadata
    confidence REAL NOT NULL DEFAULT 0.0,
    source TEXT NOT NULL, -- 'firecrawl', 'jina', 'structured_data', 'user_corrected'
    scrape_successful BOOLEAN NOT NULL DEFAULT true,

    -- Usage tracking
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_hit_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by URL hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_library_url_hash
    ON product_library(url_hash);

-- Lookup by domain for analytics
CREATE INDEX IF NOT EXISTS idx_product_library_domain
    ON product_library(domain);

-- Find high-confidence entries
CREATE INDEX IF NOT EXISTS idx_product_library_confidence
    ON product_library(confidence DESC) WHERE confidence >= 0.7;

-- Find recent entries
CREATE INDEX IF NOT EXISTS idx_product_library_created_at
    ON product_library(created_at DESC);

-- RLS policies
ALTER TABLE product_library ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (for lookups)
CREATE POLICY "Allow authenticated read" ON product_library
    FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (from API routes)
CREATE POLICY "Service role can insert" ON product_library
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update" ON product_library
    FOR UPDATE TO service_role USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_product_library_timestamp ON product_library;
CREATE TRIGGER update_product_library_timestamp
    BEFORE UPDATE ON product_library
    FOR EACH ROW
    EXECUTE FUNCTION update_product_library_updated_at();

-- Grant permissions
GRANT SELECT ON product_library TO authenticated;
GRANT ALL ON product_library TO service_role;
