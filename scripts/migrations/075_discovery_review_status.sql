-- Migration 075: Add Review Status to Discovered Products
-- Enables admin review workflow before creating bags

-- Add review status columns to discovered_products
ALTER TABLE discovered_products
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add constraint for valid review statuses
ALTER TABLE discovered_products
DROP CONSTRAINT IF EXISTS discovered_products_review_status_check;

ALTER TABLE discovered_products
ADD CONSTRAINT discovered_products_review_status_check
CHECK (review_status IN ('pending', 'approved', 'rejected', 'archived'));

-- Add index for filtering by review status
CREATE INDEX IF NOT EXISTS idx_discovered_products_review_status
ON discovered_products(review_status);

CREATE INDEX IF NOT EXISTS idx_discovered_products_pending
ON discovered_products(review_status, created_at DESC)
WHERE review_status = 'pending';

-- Add specs and price columns to store enriched data (if not exists)
ALTER TABLE discovered_products
ADD COLUMN IF NOT EXISTS specs JSONB,
ADD COLUMN IF NOT EXISTS price_range TEXT;

COMMENT ON COLUMN discovered_products.review_status IS 'pending, approved, rejected, or archived';
COMMENT ON COLUMN discovered_products.reviewed_at IS 'When the product was reviewed';
COMMENT ON COLUMN discovered_products.reviewed_by IS 'Admin who reviewed the product';
COMMENT ON COLUMN discovered_products.review_notes IS 'Admin notes about the review decision';
COMMENT ON COLUMN discovered_products.specs IS 'Extracted product specifications as JSON';
COMMENT ON COLUMN discovered_products.price_range IS 'Approximate price range (e.g., "$499", "$300-400")';
