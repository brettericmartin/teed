/**
 * Export Tools
 *
 * Tools for exporting bag content in various platform-optimized formats.
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const exportTools: Tool[];
/**
 * Handle export tool calls
 */
export declare function handleExportTool(name: string, args: Record<string, unknown> | undefined, supabase: SupabaseClient, userId?: string): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=export.d.ts.map