/**
 * MCP Prompts
 *
 * Pre-built prompt templates for common gear management tasks.
 */

import { Prompt, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export const prompts: Prompt[] = [
  {
    name: 'quick_add_gear',
    description: 'Add gear items mentioned in conversation to a bag',
    arguments: [
      {
        name: 'bag_code',
        description: "Target bag code (or 'new' to create one)",
        required: true,
      },
      {
        name: 'items',
        description: 'Comma-separated list of items to add',
        required: true,
      },
    ],
  },
  {
    name: 'review_bag',
    description: 'Get a structured review of bag contents with suggestions',
    arguments: [
      {
        name: 'bag_code',
        description: 'The bag code to review',
        required: true,
      },
      {
        name: 'focus',
        description: 'What to focus on: completeness, organization, or duplicates',
        required: false,
      },
    ],
  },
  {
    name: 'compare_bags',
    description: 'Compare two bags side-by-side',
    arguments: [
      {
        name: 'bag_code_1',
        description: 'First bag code',
        required: true,
      },
      {
        name: 'bag_code_2',
        description: 'Second bag code',
        required: true,
      },
    ],
  },
  {
    name: 'export_for_content',
    description: 'Generate formatted gear list for content creation',
    arguments: [
      {
        name: 'bag_code',
        description: 'The bag code to export',
        required: true,
      },
      {
        name: 'format',
        description: 'Format: youtube, newsletter, or markdown',
        required: true,
      },
    ],
  },
];

/**
 * Handle prompt requests
 */
export async function handleGetPrompt(
  name: string,
  args?: Record<string, string>
): Promise<{ description?: string; messages: PromptMessage[] }> {
  switch (name) {
    case 'quick_add_gear':
      return quickAddGearPrompt(args);

    case 'review_bag':
      return reviewBagPrompt(args);

    case 'compare_bags':
      return compareBagsPrompt(args);

    case 'export_for_content':
      return exportForContentPrompt(args);

    default:
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Unknown prompt: ${name}`,
            },
          },
        ],
      };
  }
}

function quickAddGearPrompt(args?: Record<string, string>): {
  description?: string;
  messages: PromptMessage[];
} {
  const bagCode = args?.bag_code || '[bag_code]';
  const items = args?.items || '[items]';

  return {
    description: `Add multiple items to ${bagCode}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `I want to add the following items to my "${bagCode}" bag on Teed:

${items}

Please:
1. First, check if the bag "${bagCode}" exists using list_my_bags or get_bag
2. If the bag doesn't exist and bag_code is "new", create a new bag with an appropriate name based on the items
3. Add each item to the bag using add_item_to_bag
4. For each item, try to identify the brand from the name
5. Provide a summary of what was added

If any items are ambiguous, ask for clarification before adding.`,
        },
      },
    ],
  };
}

function reviewBagPrompt(args?: Record<string, string>): {
  description?: string;
  messages: PromptMessage[];
} {
  const bagCode = args?.bag_code || '[bag_code]';
  const focus = args?.focus || 'completeness';

  return {
    description: `Review the "${bagCode}" bag`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please review my "${bagCode}" bag on Teed with a focus on ${focus}.

Steps:
1. Get the bag contents using get_bag
2. Analyze the items and provide insights based on the focus area:
   - If "completeness": What items might be missing for a complete setup? Are there gaps?
   - If "organization": How well organized is the bag? Are items grouped logically? Any naming inconsistencies?
   - If "duplicates": Are there any duplicate or redundant items? Items that serve the same purpose?

Provide:
- Summary of what's in the bag
- Specific observations based on the focus
- Actionable recommendations
- Questions to clarify if needed

Be constructive and specific. Reference similar bags on Teed if helpful (use search_bags).`,
        },
      },
    ],
  };
}

function compareBagsPrompt(args?: Record<string, string>): {
  description?: string;
  messages: PromptMessage[];
} {
  const bagCode1 = args?.bag_code_1 || '[bag_code_1]';
  const bagCode2 = args?.bag_code_2 || '[bag_code_2]';

  return {
    description: `Compare "${bagCode1}" and "${bagCode2}"`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please compare these two bags on Teed:
1. "${bagCode1}"
2. "${bagCode2}"

Steps:
1. Get both bags using get_bag
2. Compare them across these dimensions:
   - Items in common (same or similar products)
   - Items unique to each bag
   - Category/purpose differences
   - Brand preferences
   - Price range (if applicable)

Provide:
- Side-by-side comparison summary
- Key differences highlighted
- Which items from one bag might complement the other
- Your observations about the different approaches

Format the comparison clearly so it's easy to understand the differences at a glance.`,
        },
      },
    ],
  };
}

function exportForContentPrompt(args?: Record<string, string>): {
  description?: string;
  messages: PromptMessage[];
} {
  const bagCode = args?.bag_code || '[bag_code]';
  const format = args?.format || 'youtube';

  const formatInstructions: Record<string, string> = {
    youtube: `Format for YouTube video description:
- Start with a brief intro line
- List items with their names and brief descriptions
- Include purchase links where available
- Add relevant hashtags at the end
- Keep it scannable and mobile-friendly`,

    newsletter: `Format for newsletter/email:
- Write engaging intro paragraph
- Group items by category if applicable
- Include brief personal notes/recommendations
- Format links nicely
- Add call-to-action at end`,

    markdown: `Format as clean Markdown:
- Use proper headers and bullet points
- Include brand names
- Add links in Markdown format
- Make it readable and well-structured
- Suitable for blog posts or documentation`,
  };

  return {
    description: `Export "${bagCode}" for ${format}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please export my "${bagCode}" bag from Teed in ${format} format.

Steps:
1. Get the bag contents using get_bag
2. Format the contents according to these guidelines:

${formatInstructions[format] || formatInstructions.markdown}

Additional notes:
- Don't make up information not in the bag
- If items are missing descriptions or links, note that in the output
- Include the Teed bag URL at the end for viewers who want to see the full bag
- Keep the tone professional but personable`,
        },
      },
    ],
  };
}
