-- Migration 053: Create Beta Settings Table
-- Stores platform-wide beta configuration (capacity, auto-approval, etc.)

CREATE TABLE IF NOT EXISTS beta_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO beta_settings (key, value, description) VALUES
  ('beta_capacity', '{"total": 50, "reserved_for_codes": 5}'::jsonb,
   'Total beta slots and how many are reserved for invite codes'),
  ('auto_approval_enabled', 'true'::jsonb,
   'Whether to auto-approve applicants when slots are available'),
  ('auto_approval_priority_threshold', '0'::jsonb,
   'Minimum priority score for auto-approval (0 means everyone)'),
  ('beta_phase', '"founding"'::jsonb,
   'Current beta phase: founding, limited, open'),
  ('waitlist_message', '"Thanks for your interest! We review applications regularly."'::jsonb,
   'Message shown to waitlisted users')
ON CONFLICT (key) DO NOTHING;

-- RLS: Anyone can read (for public capacity counter), only admins can update
ALTER TABLE beta_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beta settings"
  ON beta_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update beta settings"
  ON beta_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND admin_role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert beta settings"
  ON beta_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_beta_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_beta_settings_updated_at ON beta_settings;
CREATE TRIGGER update_beta_settings_updated_at
  BEFORE UPDATE ON beta_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_beta_settings_timestamp();

-- Helper function to get a setting value
CREATE OR REPLACE FUNCTION get_beta_setting(setting_key text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT value INTO result FROM beta_settings WHERE key = setting_key;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to update a setting
CREATE OR REPLACE FUNCTION set_beta_setting(
  setting_key text,
  setting_value jsonb,
  admin_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE beta_settings
  SET value = setting_value,
      updated_by = COALESCE(admin_user_id, auth.uid())
  WHERE key = setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_beta_settings_key ON beta_settings(key);

-- Comment
COMMENT ON TABLE beta_settings IS 'Platform-wide beta configuration settings (capacity, auto-approval, etc.)';
