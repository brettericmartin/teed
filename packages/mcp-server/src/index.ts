#!/usr/bin/env node
/**
 * Teed MCP Server
 *
 * Enable AI assistants to manage gear bags through the Model Context Protocol.
 * Supports Claude Desktop, ChatGPT, and other MCP-compatible clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

import { createSupabaseClient, validateMcpToken } from './utils/supabase.js';
import { bagTools, handleBagTool } from './tools/bags.js';
import { itemTools, handleItemTool } from './tools/items.js';
import { searchTools, handleSearchTool } from './tools/search.js';
import { exportTools, handleExportTool } from './tools/export.js';
import { resources, handleReadResource } from './resources/index.js';
import { prompts, handleGetPrompt } from './prompts/index.js';

// Load environment variables
dotenv.config();

const SERVER_NAME = 'teed';
const SERVER_VERSION = '1.0.0';

// Cached session for validated MCP tokens
interface McpSession {
  userId: string;
  supabaseAccessToken: string;
}

let validatedSession: McpSession | null = null;

/**
 * Main server setup
 */
async function main() {
  // Verify required environment variables
  const supabaseUrl = process.env.TEED_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.TEED_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables:');
    console.error('  TEED_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    console.error('  TEED_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Combine all tools
  const allTools = [...bagTools, ...itemTools, ...searchTools, ...exportTools];

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Helper to get authenticated session
  async function getSession(): Promise<McpSession | null> {
    if (validatedSession) return validatedSession;

    const mcpToken = process.env.TEED_ACCESS_TOKEN;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If we have an MCP token and service role key, validate it
    if (mcpToken?.startsWith('teed_mcp_') && serviceRoleKey && supabaseUrl) {
      const session = await validateMcpToken(supabaseUrl, serviceRoleKey, mcpToken);
      if (session) {
        validatedSession = {
          userId: session.userId,
          supabaseAccessToken: session.supabaseAccessToken,
        };
        return validatedSession;
      }
    }

    // Fallback: use environment variables directly (for development)
    const userId = process.env.TEED_USER_ID;
    if (userId) {
      validatedSession = {
        userId,
        supabaseAccessToken: mcpToken || '',
      };
      return validatedSession;
    }

    return null;
  }

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Get authenticated session
      const session = await getSession();
      const userId = session?.userId;
      const accessToken = session?.supabaseAccessToken;

      // Create authenticated Supabase client
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, accessToken);

      // Route to appropriate handler
      if (bagTools.some((t) => t.name === name)) {
        return await handleBagTool(name, args, supabase, userId);
      }
      if (itemTools.some((t) => t.name === name)) {
        return await handleItemTool(name, args, supabase, userId);
      }
      if (searchTools.some((t) => t.name === name)) {
        return await handleSearchTool(name, args, supabase);
      }
      if (exportTools.some((t) => t.name === name)) {
        return await handleExportTool(name, args, supabase, userId);
      }

      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const session = await getSession();
    const userId = session?.userId;
    const accessToken = session?.supabaseAccessToken;
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, accessToken);

    return await handleReadResource(uri, supabase, userId);
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  // Get prompt content
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleGetPrompt(name, args);
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Teed MCP Server v${SERVER_VERSION} started`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
