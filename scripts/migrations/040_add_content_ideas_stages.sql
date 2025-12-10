-- Migration 040: Add Staged Workflow to Content Ideas
-- Adds new status values for discovery → screening → generation workflow

-- ============================================================
-- Step 1: Update status constraint to support staged workflow
-- ============================================================

-- Drop existing constraint
ALTER TABLE public.content_ideas
DROP CONSTRAINT IF EXISTS content_ideas_status_check;

-- Add new constraint with staged workflow statuses
ALTER TABLE public.content_ideas
ADD CONSTRAINT content_ideas_status_check
CHECK (status IN (
  -- Stage 1: Discovery (lightweight, no LLM)
  'discovered',        -- Found via YouTube scan, basic metadata only

  -- Stage 2: Screening (admin selection)
  'screening',         -- In screening queue for admin review
  'selected',          -- Admin selected for full generation
  'skipped',           -- Admin passed on this one

  -- Stage 3: Generation (full LLM pipeline)
  'generating',        -- Currently running LLM generation
  'generated',         -- Full content generated, ready for review

  -- Stage 4: Final review & publish
  'in_review',         -- Final review before approval
  'approved',          -- Approved for use
  'archived',          -- Archived (done or no longer relevant)
  'rejected',          -- Rejected

  -- Legacy (keep for backwards compatibility)
  'new'                -- Legacy status, treat as 'discovered'
));

-- ============================================================
-- Step 2: Add stage tracking columns
-- ============================================================

-- Add discovery timestamp
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS discovered_at timestamptz;

-- Add screening timestamp
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS screened_at timestamptz;

-- Add generation timestamp
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS generated_at timestamptz;

-- Add screened_by (who selected this)
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS screened_by_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add screening notes (why selected/skipped)
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS screening_notes text;

-- Add quick product extraction (lightweight, pre-generation)
ALTER TABLE public.content_ideas
ADD COLUMN IF NOT EXISTS extracted_products jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- Step 3: Add indexes for staged queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_content_ideas_discovered ON public.content_ideas(discovered_at DESC)
  WHERE status IN ('discovered', 'screening');

CREATE INDEX IF NOT EXISTS idx_content_ideas_selected ON public.content_ideas(screened_at DESC)
  WHERE status = 'selected';

CREATE INDEX IF NOT EXISTS idx_content_ideas_generated ON public.content_ideas(generated_at DESC)
  WHERE status IN ('generated', 'in_review');

-- ============================================================
-- Step 4: Migrate existing data
-- ============================================================

-- Set discovered_at for existing records that don't have it
UPDATE public.content_ideas
SET discovered_at = created_at
WHERE discovered_at IS NULL;

-- Migrate 'new' status to 'discovered' for any existing records
UPDATE public.content_ideas
SET status = 'discovered'
WHERE status = 'new';

-- ============================================================
-- Step 5: Add comments
-- ============================================================

COMMENT ON COLUMN public.content_ideas.status IS 'Workflow status: discovered → screening/selected/skipped → generating/generated → in_review → approved/rejected/archived';
COMMENT ON COLUMN public.content_ideas.discovered_at IS 'When the video was first discovered via YouTube scan';
COMMENT ON COLUMN public.content_ideas.screened_at IS 'When admin screened (selected or skipped) this idea';
COMMENT ON COLUMN public.content_ideas.generated_at IS 'When full LLM generation completed';
COMMENT ON COLUMN public.content_ideas.extracted_products IS 'Lightweight product extraction from video title/description (pre-generation)';
COMMENT ON COLUMN public.content_ideas.screening_notes IS 'Admin notes explaining selection or skip decision';
