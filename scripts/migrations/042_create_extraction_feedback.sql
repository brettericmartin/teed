-- Migration: Create extraction_feedback table for learning loop
-- This table captures admin corrections to improve extraction accuracy over time

-- ═══════════════════════════════════════════════════════════════════
-- Create extraction_feedback table
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS extraction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to content idea
  content_idea_id UUID NOT NULL REFERENCES content_ideas(id) ON DELETE CASCADE,

  -- What the AI extracted (for comparison)
  original_extraction JSONB NOT NULL,

  -- What the admin corrected it to
  admin_corrections JSONB NOT NULL,

  -- Type of correction for categorization
  correction_type TEXT NOT NULL CHECK (correction_type IN (
    'missed_product',      -- AI missed a product that was in the video
    'wrong_brand',         -- AI got the brand wrong
    'wrong_model',         -- AI got the model wrong
    'wrong_category',      -- AI assigned wrong category
    'false_positive',      -- AI detected something that wasn't there
    'content_type',        -- AI misdetected single_hero vs roundup vs comparison
    'hero_score',          -- Admin adjusted hero score significantly
    'multiple'             -- Multiple correction types
  )),

  -- Validation stage where correction was made
  validation_stage TEXT NOT NULL CHECK (validation_stage IN (
    'object_validation',   -- Stage 1: Confirming what objects were detected
    'product_validation'   -- Stage 2: Confirming product identifications
  )),

  -- Optional admin notes explaining the correction
  admin_notes TEXT,

  -- Which admin made the correction
  admin_id UUID REFERENCES profiles(id),

  -- Video vertical for category analysis
  vertical TEXT,

  -- Source type where product was found/missed
  source_type TEXT CHECK (source_type IN ('description', 'transcript', 'frame', 'all')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- Indexes for efficient querying
-- ═══════════════════════════════════════════════════════════════════

-- Query by content idea
CREATE INDEX idx_extraction_feedback_content_idea
  ON extraction_feedback(content_idea_id);

-- Query by correction type (for analysis)
CREATE INDEX idx_extraction_feedback_correction_type
  ON extraction_feedback(correction_type);

-- Query by vertical (for category-specific improvements)
CREATE INDEX idx_extraction_feedback_vertical
  ON extraction_feedback(vertical);

-- Query by admin (for auditing)
CREATE INDEX idx_extraction_feedback_admin
  ON extraction_feedback(admin_id);

-- Recent corrections
CREATE INDEX idx_extraction_feedback_created_at
  ON extraction_feedback(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- Add extraction_metadata column to content_ideas if not exists
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas'
    AND column_name = 'extraction_metadata'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN extraction_metadata JSONB;
    COMMENT ON COLUMN content_ideas.extraction_metadata IS 'Metadata from unified extraction (sources, content type, etc.)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Add validated_products column to content_ideas
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas'
    AND column_name = 'validated_products'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN validated_products JSONB;
    COMMENT ON COLUMN content_ideas.validated_products IS 'Admin-validated products after extraction review';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Add validation status columns
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas'
    AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN validation_status TEXT
      CHECK (validation_status IN ('pending', 'object_validated', 'product_validated', 'completed'));
    ALTER TABLE content_ideas ADD COLUMN validated_at TIMESTAMPTZ;
    ALTER TABLE content_ideas ADD COLUMN validated_by_admin_id UUID REFERENCES profiles(id);

    COMMENT ON COLUMN content_ideas.validation_status IS 'Current validation stage';
    COMMENT ON COLUMN content_ideas.validated_at IS 'When validation was completed';
    COMMENT ON COLUMN content_ideas.validated_by_admin_id IS 'Admin who performed validation';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE extraction_feedback ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY admin_all ON extraction_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IN ('admin', 'moderator')
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- Comments
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON TABLE extraction_feedback IS 'Captures admin corrections to AI product extraction for continuous learning';
COMMENT ON COLUMN extraction_feedback.original_extraction IS 'JSON of what AI originally extracted';
COMMENT ON COLUMN extraction_feedback.admin_corrections IS 'JSON of admin corrections (added, removed, modified products)';
COMMENT ON COLUMN extraction_feedback.correction_type IS 'Category of correction for pattern analysis';
COMMENT ON COLUMN extraction_feedback.admin_notes IS 'Optional explanation of why correction was needed';
