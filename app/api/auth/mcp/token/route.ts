import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Generate a secure MCP access token
 */
function generateMcpToken(): string {
  return `teed_mcp_${crypto.randomBytes(32).toString('base64url')}`;
}

/**
 * GET /api/auth/mcp/token
 *
 * Generate an MCP access token for the authenticated user.
 * This token can be used to configure Claude Desktop or other MCP clients.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Create Supabase client to verify user is logged in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if user is logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Please sign in to generate an MCP token' },
      { status: 401 }
    );
  }

  // Get user's session for access token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Session not found' },
      { status: 401 }
    );
  }

  // Get user profile for handle
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  // Create admin Supabase client for database operations
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if user already has an MCP token
  const { data: existingSession } = await adminSupabase
    .from('oauth_sessions')
    .select('session_token, created_at')
    .eq('user_id', user.id)
    .eq('client_id', 'mcp')
    .single();

  let mcpToken: string;

  if (existingSession) {
    // Return existing token
    mcpToken = existingSession.session_token;

    // Update the stored Supabase tokens
    await adminSupabase
      .from('oauth_sessions')
      .update({
        supabase_access_token: session.access_token,
        supabase_refresh_token: session.refresh_token,
        expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), // 1 year
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('client_id', 'mcp');
  } else {
    // Generate new token
    mcpToken = generateMcpToken();

    // Store the session
    const { error: insertError } = await adminSupabase.from('oauth_sessions').insert({
      user_id: user.id,
      session_token: mcpToken,
      supabase_access_token: session.access_token,
      supabase_refresh_token: session.refresh_token,
      client_id: 'mcp',
      scope: 'bags:read bags:write items:read items:write',
      expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), // 1 year
    });

    if (insertError) {
      console.error('Failed to store MCP session:', insertError);
      return NextResponse.json(
        { error: 'server_error', message: 'Failed to create MCP token' },
        { status: 500 }
      );
    }
  }

  // Return the configuration for Claude Desktop
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      handle: profile?.handle ? `@${profile.handle}` : undefined,
      display_name: profile?.display_name,
    },
    mcp_config: {
      command: 'npx',
      args: ['-y', '@teed/mcp-server'],
      env: {
        TEED_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        TEED_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        TEED_USER_ID: user.id,
        TEED_ACCESS_TOKEN: mcpToken,
      },
    },
    instructions: `Add this to your Claude Desktop configuration file:

~/.config/claude/claude_desktop_config.json (macOS/Linux)
%APPDATA%\\Claude\\claude_desktop_config.json (Windows)

{
  "mcpServers": {
    "teed": ${JSON.stringify(
      {
        command: 'npx',
        args: ['-y', '@teed/mcp-server'],
        env: {
          TEED_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          TEED_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          TEED_USER_ID: user.id,
          TEED_ACCESS_TOKEN: mcpToken,
        },
      },
      null,
      6
    )}
  }
}`,
  });
}

/**
 * DELETE /api/auth/mcp/token
 *
 * Revoke the user's MCP token.
 */
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Please sign in to revoke your MCP token' },
      { status: 401 }
    );
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: deleteError } = await adminSupabase
    .from('oauth_sessions')
    .delete()
    .eq('user_id', user.id)
    .eq('client_id', 'mcp');

  if (deleteError) {
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to revoke MCP token' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'MCP token revoked. You will need to generate a new one to use Claude Desktop with Teed.',
  });
}
