/**
 * Search & Discovery Tools
 *
 * Tools for searching and discovering public bags and items.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const searchTools: Tool[];
/**
 * Handle search tool calls
 */
export declare function handleSearchTool(name: string, args: Record<string, unknown> | undefined, supabase: SupabaseClient): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=search.d.ts.map