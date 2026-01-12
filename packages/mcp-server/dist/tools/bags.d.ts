/**
 * Bag Management Tools
 *
 * Tools for creating, reading, updating, and deleting gear bags.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const bagTools: Tool[];
/**
 * Handle bag tool calls
 */
export declare function handleBagTool(name: string, args: Record<string, unknown> | undefined, supabase: SupabaseClient, userId?: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=bags.d.ts.map