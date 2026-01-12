/**
 * Supabase client utilities for MCP server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface McpSession {
  userId: string;
  supabaseAccessToken: string;
  supabaseRefreshToken: string;
}

let cachedSession: McpSession | null = null;
let lastSessionCheck = 0;
const SESSION_CACHE_TTL = 60000; // 1 minute

/**
 * Create a Supabase client with optional user authentication
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  accessToken?: string
): SupabaseClient {
  const options: Parameters<typeof createClient>[2] = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  // If we have an access token, use it for authenticated requests
  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(url, anonKey, options);
}

/**
 * Validate MCP token and get session details
 * Returns the user ID and Supabase access token for authenticated requests
 */
export async function validateMcpToken(
  url: string,
  serviceRoleKey: string,
  mcpToken: string
): Promise<McpSession | null> {
  // Check cache
  if (cachedSession && Date.now() - lastSessionCheck < SESSION_CACHE_TTL) {
    return cachedSession;
  }

  // Create admin client
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up the session by token
  const { data: session, error } = await adminClient
    .from('oauth_sessions')
    .select('user_id, supabase_access_token, supabase_refresh_token, expires_at')
    .eq('session_token', mcpToken)
    .eq('client_id', 'mcp')
    .single();

  if (error || !session) {
    console.error('MCP token validation failed:', error?.message || 'Session not found');
    return null;
  }

  // Check if we need to refresh the Supabase token
  const sessionExpired = new Date(session.expires_at) < new Date();

  if (sessionExpired && session.supabase_refresh_token) {
    // Refresh with Supabase
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({ refresh_token: session.supabase_refresh_token }),
    });

    const data = (await response.json()) as { access_token?: string; refresh_token?: string };

    if (response.ok && data.access_token && data.refresh_token) {
      // Update stored tokens
      await adminClient
        .from('oauth_sessions')
        .update({
          supabase_access_token: data.access_token,
          supabase_refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq('session_token', mcpToken);

      cachedSession = {
        userId: session.user_id,
        supabaseAccessToken: data.access_token,
        supabaseRefreshToken: data.refresh_token,
      };
    } else {
      console.error('Failed to refresh Supabase token:', data);
      // Use existing token anyway
      cachedSession = {
        userId: session.user_id,
        supabaseAccessToken: session.supabase_access_token,
        supabaseRefreshToken: session.supabase_refresh_token,
      };
    }
  } else {
    // Update last_used_at
    await adminClient
      .from('oauth_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('session_token', mcpToken);

    cachedSession = {
      userId: session.user_id,
      supabaseAccessToken: session.supabase_access_token,
      supabaseRefreshToken: session.supabase_refresh_token,
    };
  }

  lastSessionCheck = Date.now();
  return cachedSession;
}

/**
 * Verify bag ownership
 */
export async function verifyBagOwnership(
  supabase: SupabaseClient,
  bagCode: string,
  userId?: string
): Promise<{ id: string; owner_id: string } | null> {
  const { data, error } = await supabase
    .from('bags')
    .select('id, owner_id')
    .eq('code', bagCode)
    .single();

  if (error || !data) return null;
  if (userId && data.owner_id !== userId) return null;

  return data;
}

/**
 * Get bag by code with full details
 */
export async function getBagByCode(
  supabase: SupabaseClient,
  code: string,
  userId?: string
) {
  const query = supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      category,
      is_public,
      owner_id,
      created_at,
      updated_at,
      profiles!bags_owner_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      ),
      bag_items (
        id,
        custom_name,
        brand,
        custom_description,
        quantity,
        sort_index,
        created_at,
        catalog_item:catalog_items (
          id,
          name,
          brand,
          description,
          image_url
        ),
        links (
          id,
          url,
          kind,
          label
        )
      )
    `)
    .eq('code', code)
    .single();

  const { data, error } = await query;

  if (error) return null;

  // Check access permissions
  if (!data.is_public && data.owner_id !== userId) {
    return null;
  }

  return data;
}

/**
 * Generate a URL-safe code from a title
 */
export function generateBagCode(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}
