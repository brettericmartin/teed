-- Migration 073: Add email_sent_at column to beta_applications
-- Tracks when confirmation email was sent to prevent duplicates
-- Run with: psql $DATABASE_URL -f scripts/migrations/073_add_email_sent_at.sql

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beta_applications'
    AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE beta_applications
    ADD COLUMN email_sent_at TIMESTAMPTZ;

    COMMENT ON COLUMN beta_applications.email_sent_at IS
      'Timestamp when confirmation/scorecard email was sent';
  END IF;
END
$$;
