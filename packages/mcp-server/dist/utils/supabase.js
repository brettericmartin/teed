"use strict";
/**
 * Supabase client utilities for MCP server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseClient = createSupabaseClient;
exports.validateMcpToken = validateMcpToken;
exports.verifyBagOwnership = verifyBagOwnership;
exports.getBagByCode = getBagByCode;
exports.generateBagCode = generateBagCode;
const supabase_js_1 = require("@supabase/supabase-js");
let cachedSession = null;
let lastSessionCheck = 0;
const SESSION_CACHE_TTL = 60000; // 1 minute
/**
 * Create a Supabase client with optional user authentication
 */
function createSupabaseClient(url, anonKey, accessToken) {
    const options = {
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
    return (0, supabase_js_1.createClient)(url, anonKey, options);
}
/**
 * Validate MCP token and get session details
 * Returns the user ID and Supabase access token for authenticated requests
 */
async function validateMcpToken(url, serviceRoleKey, mcpToken) {
    // Check cache
    if (cachedSession && Date.now() - lastSessionCheck < SESSION_CACHE_TTL) {
        return cachedSession;
    }
    // Create admin client
    const adminClient = (0, supabase_js_1.createClient)(url, serviceRoleKey, {
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
        const data = (await response.json());
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
        }
        else {
            console.error('Failed to refresh Supabase token:', data);
            // Use existing token anyway
            cachedSession = {
                userId: session.user_id,
                supabaseAccessToken: session.supabase_access_token,
                supabaseRefreshToken: session.supabase_refresh_token,
            };
        }
    }
    else {
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
async function verifyBagOwnership(supabase, bagCode, userId) {
    const { data, error } = await supabase
        .from('bags')
        .select('id, owner_id')
        .eq('code', bagCode)
        .single();
    if (error || !data)
        return null;
    if (userId && data.owner_id !== userId)
        return null;
    return data;
}
/**
 * Get bag by code with full details
 */
async function getBagByCode(supabase, code, userId) {
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
    if (error)
        return null;
    // Check access permissions
    if (!data.is_public && data.owner_id !== userId) {
        return null;
    }
    return data;
}
/**
 * Generate a URL-safe code from a title
 */
function generateBagCode(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}
//# sourceMappingURL=supabase.js.map