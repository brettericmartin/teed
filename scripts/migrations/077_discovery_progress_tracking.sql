-- Migration 077: Add Progress Tracking to Discovery Runs
-- Enables visual progress updates during discovery execution

-- Add progress tracking columns to discovery_runs
ALTER TABLE discovery_runs
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'starting',
ADD COLUMN IF NOT EXISTS phase_progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMPTZ;

-- Add constraint for valid phases
ALTER TABLE discovery_runs
DROP CONSTRAINT IF EXISTS discovery_runs_phase_check;

ALTER TABLE discovery_runs
ADD CONSTRAINT discovery_runs_phase_check
CHECK (current_phase IN ('starting', 'searching', 'extracting', 'enriching', 'creating_bags', 'gap_analysis', 'completed', 'failed'));

-- Add constraint for phase progress (0-100)
ALTER TABLE discovery_runs
DROP CONSTRAINT IF EXISTS discovery_runs_progress_check;

ALTER TABLE discovery_runs
ADD CONSTRAINT discovery_runs_progress_check
CHECK (phase_progress >= 0 AND phase_progress <= 100);

-- Index for active runs (for polling)
CREATE INDEX IF NOT EXISTS idx_discovery_runs_active
ON discovery_runs(status, last_progress_update DESC)
WHERE status = 'running';

COMMENT ON COLUMN discovery_runs.current_phase IS 'Current execution phase: starting, searching, extracting, enriching, creating_bags, gap_analysis, completed, failed';
COMMENT ON COLUMN discovery_runs.phase_progress IS 'Progress within current phase (0-100)';
COMMENT ON COLUMN discovery_runs.last_progress_update IS 'Timestamp of last progress update';
