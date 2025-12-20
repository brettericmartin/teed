-- AI Visual Corrections Table
-- Stores user corrections with full visual context for learning
-- This enables the AI to learn from mistakes and improve future identifications

CREATE TABLE IF NOT EXISTS ai_visual_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Visual features from Stage 1 (what AI "saw")
  object_type text NOT NULL,                    -- e.g., "driver", "fairway wood", "iron"
  item_type_reasoning text,                     -- Why AI thought it was this type
  primary_color text,
  secondary_colors text[],                      -- Array of colors
  materials text[],                             -- Array of materials detected
  brand_indicators text[],                      -- Visual brand cues
  design_era text,                              -- "modern", "transitional", "classic"

  -- OCR text found
  ocr_brand_text text,                          -- Brand text from OCR
  ocr_model_text text,                          -- Model text from OCR
  ocr_all_texts jsonb,                          -- Full OCR results as JSON

  -- Original AI guess that was corrected
  original_name text NOT NULL,
  original_brand text,
  original_confidence integer,
  original_matching_reasons text[],

  -- User's correction
  corrected_name text NOT NULL,
  corrected_brand text,
  correction_type text NOT NULL,                -- 'name', 'brand', 'both', 'item_type'

  -- What changed (for learning)
  change_summary text,                          -- e.g., "Driver → Fairway Wood"
  learning_notes text,                          -- AI-generated notes on what to look for

  -- Image data (optional - for similarity matching)
  image_hash text,                              -- Perceptual hash for finding similar images
  cropped_image_url text,                       -- URL if stored

  -- Metadata
  category text DEFAULT 'golf',                 -- Category hint used
  times_applied integer DEFAULT 0,              -- How many times this correction was used
  last_applied_at timestamptz,
  created_at timestamptz DEFAULT now(),

  -- For efficient querying
  brand_normalized text GENERATED ALWAYS AS (lower(trim(coalesce(corrected_brand, original_brand)))) STORED,
  model_keywords text[]                         -- Extracted keywords for searching
);

-- Indexes for efficient correction lookup
CREATE INDEX IF NOT EXISTS idx_visual_corrections_brand
  ON ai_visual_corrections(brand_normalized);

CREATE INDEX IF NOT EXISTS idx_visual_corrections_object_type
  ON ai_visual_corrections(object_type);

CREATE INDEX IF NOT EXISTS idx_visual_corrections_category
  ON ai_visual_corrections(category);

CREATE INDEX IF NOT EXISTS idx_visual_corrections_ocr_model
  ON ai_visual_corrections(ocr_model_text)
  WHERE ocr_model_text IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visual_corrections_created
  ON ai_visual_corrections(created_at DESC);

-- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_visual_corrections_materials
  ON ai_visual_corrections USING gin(materials);

CREATE INDEX IF NOT EXISTS idx_visual_corrections_keywords
  ON ai_visual_corrections USING gin(model_keywords);

-- Comments for documentation
COMMENT ON TABLE ai_visual_corrections IS 'Stores user corrections to AI identifications with full visual context for learning';
COMMENT ON COLUMN ai_visual_corrections.change_summary IS 'Human-readable summary of what changed, e.g., "Driver → Fairway Wood"';
COMMENT ON COLUMN ai_visual_corrections.learning_notes IS 'AI-generated notes on visual cues to distinguish this correction in future';
COMMENT ON COLUMN ai_visual_corrections.times_applied IS 'Counter for how often this correction influenced future identifications';
