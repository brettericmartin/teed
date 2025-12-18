import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from './serverSupabase';
import { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthResult {
  user: User | null;
  supabase: SupabaseClient;
  error?: string;
}

// Create admin Supabase client for session lookups
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Authenticate a GPT API request
 * Handles both our session tokens (from ChatGPT) and cookie auth (from browser)
 */
export async function authenticateGptRequest(): Promise<AuthResult> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  console.log('GPT auth: Authorization header present:', !!authHeader, authHeader ? `(${authHeader.substring(0, 20)}...)` : '');

  // Bearer token authentication (from ChatGPT)
  if (authHeader?.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7);
    console.log('GPT auth: Looking up session token:', sessionToken.substring(0, 10) + '...');

    // Look up the session in our database
    const adminSupabase = getAdminSupabase();
    const { data: session, error: lookupError } = await adminSupabase
      .from('oauth_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (lookupError || !session) {
      console.error('GPT auth: Session not found for token:', sessionToken.substring(0, 10) + '...', 'Error:', lookupError?.message);

      // Debug: list all sessions to see what's stored
      const { data: allSessions } = await adminSupabase
        .from('oauth_sessions')
        .select('session_token, user_id, created_at')
        .limit(5);
      console.log('GPT auth: Available sessions:', allSessions?.map(s => ({
        token: s.session_token.substring(0, 10) + '...',
        user: s.user_id,
        created: s.created_at
      })));

      return {
        user: null,
        supabase: adminSupabase,
        error: 'Invalid or expired session. Please sign in again.',
      };
    }

    // Create a Supabase client with the stored access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${session.supabase_access_token}` } }
      }
    );

    // Verify the stored token and get user
    const { data, error: authError } = await supabase.auth.getUser(session.supabase_access_token);

    if (authError || !data.user) {
      console.error('GPT auth: Supabase token invalid:', authError?.message);

      // Token might be expired - try to refresh
      console.log('GPT auth: Attempting to refresh expired token...');

      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ refresh_token: session.supabase_refresh_token }),
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error('GPT auth: Refresh failed:', refreshData);
        // Delete the invalid session
        await adminSupabase
          .from('oauth_sessions')
          .delete()
          .eq('id', session.id);

        return {
          user: null,
          supabase,
          error: 'Session expired. Please sign in again.',
        };
      }

      // Update our stored tokens
      await adminSupabase
        .from('oauth_sessions')
        .update({
          supabase_access_token: refreshData.access_token,
          supabase_refresh_token: refreshData.refresh_token,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Create new client with refreshed token
      const refreshedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: { Authorization: `Bearer ${refreshData.access_token}` } }
        }
      );

      console.log('GPT auth: Token refreshed successfully for user:', refreshData.user?.id);
      return { user: refreshData.user, supabase: refreshedSupabase };
    }

    // Update last_used_at
    await adminSupabase
      .from('oauth_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', session.id);

    console.log('GPT auth successful for user:', data.user.id);
    return { user: data.user, supabase };
  }

  // Cookie-based authentication (from browser)
  const supabase = await createServerSupabase();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data.user) {
    return {
      user: null,
      supabase,
      error: 'Unauthorized. Please sign in to your Teed account.',
    };
  }

  return { user: data.user, supabase };
}
