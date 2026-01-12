/**
 * Supabase client utilities for MCP server
 */
import { SupabaseClient } from '@supabase/supabase-js';
interface McpSession {
    userId: string;
    supabaseAccessToken: string;
    supabaseRefreshToken: string;
}
/**
 * Create a Supabase client with optional user authentication
 */
export declare function createSupabaseClient(url: string, anonKey: string, accessToken?: string): SupabaseClient;
/**
 * Validate MCP token and get session details
 * Returns the user ID and Supabase access token for authenticated requests
 */
export declare function validateMcpToken(url: string, serviceRoleKey: string, mcpToken: string): Promise<McpSession | null>;
/**
 * Verify bag ownership
 */
export declare function verifyBagOwnership(supabase: SupabaseClient, bagCode: string, userId?: string): Promise<{
    id: string;
    owner_id: string;
} | null>;
/**
 * Get bag by code with full details
 */
export declare function getBagByCode(supabase: SupabaseClient, code: string, userId?: string): Promise<{
    id: any;
    code: any;
    title: any;
    description: any;
    category: any;
    is_public: any;
    owner_id: any;
    created_at: any;
    updated_at: any;
    profiles: {
        id: any;
        handle: any;
        display_name: any;
        avatar_url: any;
    }[];
    bag_items: {
        id: any;
        custom_name: any;
        brand: any;
        custom_description: any;
        quantity: any;
        sort_index: any;
        created_at: any;
        catalog_item: {
            id: any;
            name: any;
            brand: any;
            description: any;
            image_url: any;
        }[];
        links: {
            id: any;
            url: any;
            kind: any;
            label: any;
        }[];
    }[];
} | null>;
/**
 * Generate a URL-safe code from a title
 */
export declare function generateBagCode(title: string): string;
export {};
//# sourceMappingURL=supabase.d.ts.map