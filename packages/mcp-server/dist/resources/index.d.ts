/**
 * MCP Resources
 *
 * Resources expose data that AI assistants can read into their context.
 */
import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';
export declare const resources: Resource[];
export declare const resourceTemplates: {
    uriTemplate: string;
    name: string;
    description: string;
    mimeType: string;
}[];
/**
 * Handle resource read requests
 */
export declare function handleReadResource(uri: string, supabase: SupabaseClient, userId?: string): Promise<{
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}>;
//# sourceMappingURL=index.d.ts.map