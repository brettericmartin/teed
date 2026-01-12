#!/usr/bin/env node
"use strict";
/**
 * Teed MCP Server
 *
 * Enable AI assistants to manage gear bags through the Model Context Protocol.
 * Supports Claude Desktop, ChatGPT, and other MCP-compatible clients.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dotenv = __importStar(require("dotenv"));
const supabase_js_1 = require("./utils/supabase.js");
const bags_js_1 = require("./tools/bags.js");
const items_js_1 = require("./tools/items.js");
const search_js_1 = require("./tools/search.js");
const export_js_1 = require("./tools/export.js");
const index_js_2 = require("./resources/index.js");
const index_js_3 = require("./prompts/index.js");
// Load environment variables
dotenv.config();
const SERVER_NAME = 'teed';
const SERVER_VERSION = '1.0.0';
let validatedSession = null;
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
    const server = new index_js_1.Server({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            tools: {},
            resources: {},
            prompts: {},
        },
    });
    // Combine all tools
    const allTools = [...bags_js_1.bagTools, ...items_js_1.itemTools, ...search_js_1.searchTools, ...export_js_1.exportTools];
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        return { tools: allTools };
    });
    // Helper to get authenticated session
    async function getSession() {
        if (validatedSession)
            return validatedSession;
        const mcpToken = process.env.TEED_ACCESS_TOKEN;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        // If we have an MCP token and service role key, validate it
        if (mcpToken?.startsWith('teed_mcp_') && serviceRoleKey && supabaseUrl) {
            const session = await (0, supabase_js_1.validateMcpToken)(supabaseUrl, serviceRoleKey, mcpToken);
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
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            // Get authenticated session
            const session = await getSession();
            const userId = session?.userId;
            const accessToken = session?.supabaseAccessToken;
            // Create authenticated Supabase client
            const supabase = (0, supabase_js_1.createSupabaseClient)(supabaseUrl, supabaseKey, accessToken);
            // Route to appropriate handler
            if (bags_js_1.bagTools.some((t) => t.name === name)) {
                return await (0, bags_js_1.handleBagTool)(name, args, supabase, userId);
            }
            if (items_js_1.itemTools.some((t) => t.name === name)) {
                return await (0, items_js_1.handleItemTool)(name, args, supabase, userId);
            }
            if (search_js_1.searchTools.some((t) => t.name === name)) {
                return await (0, search_js_1.handleSearchTool)(name, args, supabase);
            }
            if (export_js_1.exportTools.some((t) => t.name === name)) {
                return await (0, export_js_1.handleExportTool)(name, args, supabase, userId);
            }
            return {
                content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                isError: true,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                content: [{ type: 'text', text: `Error: ${message}` }],
                isError: true,
            };
        }
    });
    // List available resources
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
        return { resources: index_js_2.resources };
    });
    // Read resource content
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        const session = await getSession();
        const userId = session?.userId;
        const accessToken = session?.supabaseAccessToken;
        const supabase = (0, supabase_js_1.createSupabaseClient)(supabaseUrl, supabaseKey, accessToken);
        return await (0, index_js_2.handleReadResource)(uri, supabase, userId);
    });
    // List available prompts
    server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => {
        return { prompts: index_js_3.prompts };
    });
    // Get prompt content
    server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        return await (0, index_js_3.handleGetPrompt)(name, args);
    });
    // Start server with stdio transport
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error(`Teed MCP Server v${SERVER_VERSION} started`);
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map