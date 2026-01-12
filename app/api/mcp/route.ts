import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * MCP HTTP Transport Endpoint
 *
 * This endpoint provides HTTP-based access to the Teed MCP server.
 * It implements a simplified JSON-RPC interface for MCP tool calls.
 *
 * POST /api/mcp
 * Headers:
 *   Authorization: Bearer <mcp_token>
 *   Content-Type: application/json
 *
 * Body:
 *   { "method": "tools/call", "params": { "name": "tool_name", "arguments": {...} } }
 */

// Create admin Supabase client
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Create user Supabase client
function getUserSupabase(accessToken?: string) {
  const options: Parameters<typeof createClient>[2] = {
    auth: { autoRefreshToken: false, persistSession: false },
  };

  if (accessToken) {
    options.global = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
}

interface McpSession {
  userId: string;
  supabaseAccessToken: string;
}

async function validateMcpToken(mcpToken: string): Promise<McpSession | null> {
  const adminSupabase = getAdminSupabase();

  const { data: session, error } = await adminSupabase
    .from('oauth_sessions')
    .select('user_id, supabase_access_token, supabase_refresh_token, expires_at')
    .eq('session_token', mcpToken)
    .eq('client_id', 'mcp')
    .single();

  if (error || !session) {
    return null;
  }

  // Check if token needs refresh
  const sessionExpired = new Date(session.expires_at) < new Date();

  if (sessionExpired && session.supabase_refresh_token) {
    // Refresh with Supabase
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ refresh_token: session.supabase_refresh_token }),
      }
    );

    const data = (await response.json()) as { access_token?: string; refresh_token?: string };

    if (response.ok && data.access_token && data.refresh_token) {
      await adminSupabase
        .from('oauth_sessions')
        .update({
          supabase_access_token: data.access_token,
          supabase_refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq('session_token', mcpToken);

      return {
        userId: session.user_id,
        supabaseAccessToken: data.access_token,
      };
    }
  }

  // Update last_used_at
  await adminSupabase
    .from('oauth_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('session_token', mcpToken);

  return {
    userId: session.user_id,
    supabaseAccessToken: session.supabase_access_token,
  };
}

// Tool implementations (simplified versions of MCP tools)
async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  session: McpSession | null
) {
  const supabase = getUserSupabase(session?.supabaseAccessToken);
  const userId = session?.userId;

  switch (toolName) {
    case 'list_my_bags':
      return listMyBags(supabase, userId, args);
    case 'get_bag':
      return getBag(supabase, userId, args);
    case 'search_bags':
      return searchBags(supabase, args);
    case 'search_items':
      return searchItems(supabase, args);
    case 'discover_featured_bags':
      return discoverFeaturedBags(supabase);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function listMyBags(
  supabase: ReturnType<typeof getUserSupabase>,
  userId: string | undefined,
  args: Record<string, unknown>
) {
  if (!userId) {
    return { error: 'Authentication required' };
  }

  const { data, error } = await supabase
    .from('bags')
    .select('code, title, description, category, is_public, updated_at, bag_items(count)')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const bags = (data || []).map((bag: Record<string, unknown>) => ({
    code: bag.code,
    title: bag.title,
    description: bag.description,
    category: bag.category,
    is_public: bag.is_public,
    item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
    updated_at: bag.updated_at,
  }));

  return { bags, count: bags.length };
}

async function getBag(
  supabase: ReturnType<typeof getUserSupabase>,
  userId: string | undefined,
  args: Record<string, unknown>
) {
  const bagCode = args?.bag_code as string;
  if (!bagCode) {
    return { error: 'bag_code is required' };
  }

  const { data: bag, error } = await supabase
    .from('bags')
    .select(`
      code, title, description, category, is_public, owner_id, updated_at,
      profiles!bags_owner_id_fkey(handle, display_name),
      bag_items(id, custom_name, brand, custom_description, quantity, sort_index,
        links(url, kind, label))
    `)
    .eq('code', bagCode)
    .single();

  if (error || !bag) {
    return { error: 'Bag not found' };
  }

  if (!bag.is_public && bag.owner_id !== userId) {
    return { error: 'Access denied' };
  }

  const profileData = bag.profiles;
  const owner = (Array.isArray(profileData) ? profileData[0] : profileData) as Record<string, unknown> | undefined;

  return {
    bag: {
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      is_public: bag.is_public,
      owner: { handle: owner?.handle, display_name: owner?.display_name },
      items: bag.bag_items,
      url: `https://teed.club/u/${owner?.handle}/${bag.code}`,
    },
  };
}

async function searchBags(
  supabase: ReturnType<typeof getUserSupabase>,
  args: Record<string, unknown>
) {
  const query = args?.query as string | undefined;
  const category = args?.category as string | undefined;
  const limit = Math.min((args?.limit as number) || 10, 50);

  let dbQuery = supabase
    .from('bags')
    .select(`
      code, title, description, category, updated_at,
      profiles!bags_owner_id_fkey(handle, display_name),
      bag_items(count)
    `)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return { error: error.message };
  }

  const results = (data || []).map((bag: Record<string, unknown>) => {
    const owner = bag.profiles as Record<string, unknown>;
    return {
      code: bag.code,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      owner: owner?.handle ? `@${owner.handle}` : 'unknown',
      item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
      url: `https://teed.club/u/${owner?.handle}/${bag.code}`,
    };
  });

  return { results, count: results.length };
}

async function searchItems(
  supabase: ReturnType<typeof getUserSupabase>,
  args: Record<string, unknown>
) {
  const query = args?.query as string;
  if (!query) {
    return { error: 'query is required' };
  }

  const limit = Math.min((args?.limit as number) || 20, 100);

  const { data, error } = await supabase
    .from('bag_items')
    .select(`
      id, custom_name, brand, custom_description,
      bags!inner(code, title, category, is_public, profiles!bags_owner_id_fkey(handle))
    `)
    .eq('bags.is_public', true)
    .or(`custom_name.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  const results = (data || []).map((item: Record<string, unknown>) => {
    const bag = item.bags as Record<string, unknown>;
    const owner = bag?.profiles as Record<string, unknown>;
    return {
      id: item.id,
      name: item.custom_name,
      brand: item.brand,
      bag: { code: bag?.code, title: bag?.title },
      owner: owner?.handle ? `@${owner.handle}` : 'unknown',
      bag_url: `https://teed.club/u/${owner?.handle}/${bag?.code}`,
    };
  });

  return { results, count: results.length };
}

const FEATURED_BAG_CODES = [
  { handle: 'teed', code: 'christmas-list-2' },
  { handle: 'brett', code: 'sean-walsh-s-break-50-bag' },
  { handle: 'teed', code: 'matt-scharff-s-golf-bag' },
  { handle: 'teed', code: 'peter-mckinnon-camera-bag' },
];

async function discoverFeaturedBags(supabase: ReturnType<typeof getUserSupabase>) {
  const bags = await Promise.all(
    FEATURED_BAG_CODES.map(async ({ handle, code }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, handle, display_name')
        .eq('handle', handle)
        .single();

      if (!profile) return null;

      const { data: bag } = await supabase
        .from('bags')
        .select('code, title, description, category, bag_items(count)')
        .eq('owner_id', profile.id)
        .eq('code', code)
        .eq('is_public', true)
        .single();

      if (!bag) return null;

      return {
        code: bag.code,
        title: bag.title,
        description: bag.description,
        category: bag.category,
        item_count: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
        owner: `@${profile.handle}`,
        url: `https://teed.club/u/${profile.handle}/${bag.code}`,
      };
    })
  );

  return { featured_bags: bags.filter(Boolean) };
}

/**
 * GET /api/mcp - List available tools
 */
export async function GET() {
  return NextResponse.json({
    name: 'teed',
    version: '1.0.0',
    tools: [
      { name: 'list_my_bags', description: 'List your bags (requires auth)' },
      { name: 'get_bag', description: 'Get bag details' },
      { name: 'search_bags', description: 'Search public bags' },
      { name: 'search_items', description: 'Search items across bags' },
      { name: 'discover_featured_bags', description: 'Get featured bags' },
    ],
    auth_endpoint: '/api/auth/mcp/token',
  });
}

/**
 * POST /api/mcp - Call a tool
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    let session: McpSession | null = null;

    if (authHeader?.startsWith('Bearer teed_mcp_')) {
      const token = authHeader.slice(7);
      session = await validateMcpToken(token);
    }

    // Parse request body
    const body = await request.json();
    const { method, params } = body;

    if (method !== 'tools/call') {
      return NextResponse.json(
        { error: 'invalid_method', message: 'Only tools/call method is supported' },
        { status: 400 }
      );
    }

    const toolName = params?.name as string;
    const toolArgs = (params?.arguments || {}) as Record<string, unknown>;

    if (!toolName) {
      return NextResponse.json(
        { error: 'invalid_params', message: 'Tool name is required' },
        { status: 400 }
      );
    }

    const result = await handleToolCall(toolName, toolArgs, session);

    return NextResponse.json({
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      },
    });
  } catch (error) {
    console.error('MCP endpoint error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
