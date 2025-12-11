-- Migration: Create ai_corrections table for APIS learning system
-- This table stores user corrections to improve future AI identifications

CREATE TABLE IF NOT EXISTS ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Correction details
  correction_type text NOT NULL,  -- 'object-type', 'product-name', 'brand', 'year', 'added-item', 'removed-item'
  stage text NOT NULL,            -- Which APIS stage the correction was made at
  original_value text,            -- What the AI originally identified (if applicable)
  corrected_value text NOT NULL,  -- What the user corrected it to

  -- Reference IDs
  product_id text,                -- ID of the product being corrected
  object_id text,                 -- ID of the detected object being corrected

  -- Final product info (for learning context)
  final_product_name text,
  final_product_brand text,
  final_confidence integer,       -- 0-100
  validation_score integer,       -- Visual match score from stage 4

  -- Source tracking
  has_source_image boolean DEFAULT false,

  -- Learning status
  learned_at timestamptz,         -- When this correction was used for retraining

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_corrections_type ON ai_corrections(correction_type);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_created ON ai_corrections(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_brand ON ai_corrections(final_product_brand);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_learned ON ai_corrections(learned_at);

-- Comment
COMMENT ON TABLE ai_corrections IS 'Stores user corrections from APIS for learning and improvement';
