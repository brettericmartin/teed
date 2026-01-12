/**
 * MCP Prompts
 *
 * Pre-built prompt templates for common gear management tasks.
 */
import { Prompt, PromptMessage } from '@modelcontextprotocol/sdk/types.js';
export declare const prompts: Prompt[];
/**
 * Handle prompt requests
 */
export declare function handleGetPrompt(name: string, args?: Record<string, string>): Promise<{
    description?: string;
    messages: PromptMessage[];
}>;
//# sourceMappingURL=index.d.ts.map