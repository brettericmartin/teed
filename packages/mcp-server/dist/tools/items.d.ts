/**
 * Item Management Tools
 *
 * Tools for adding, updating, and removing items from bags.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const itemTools: Tool[];
/**
 * Handle item tool calls
 */
export declare function handleItemTool(name: string, args: Record<string, unknown> | undefined, supabase: SupabaseClient, userId?: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=items.d.ts.map