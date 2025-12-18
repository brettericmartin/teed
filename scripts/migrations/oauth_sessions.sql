-- OAuth Sessions table for managing ChatGPT OAuth tokens
-- This stores Supabase tokens server-side and issues our own session tokens to ChatGPT

CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE, -- Our token given to ChatGPT
  supabase_access_token TEXT NOT NULL,
  supabase_refresh_token TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- When the session should be refreshed
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_session_token ON oauth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON oauth_sessions(user_id);

-- Enable RLS
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (API routes use service role)
CREATE POLICY "Service role full access" ON oauth_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
