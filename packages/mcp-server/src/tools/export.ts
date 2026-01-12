/**
 * Export Tools
 *
 * Tools for exporting bag content in various platform-optimized formats.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SupabaseClient } from '@supabase/supabase-js';

export const exportTools: Tool[] = [
  {
    name: 'export_bag_youtube',
    description: 'Export bag content as a YouTube video description with gear links and affiliate formatting',
    inputSchema: {
      type: 'object',
      properties: {
        bag_code: {
          type: 'string',
          description: 'The bag code to export',
        },
        include_affiliate_disclaimer: {
          type: 'boolean',
          default: true,
          description: 'Include affiliate link disclaimer',
        },
      },
      required: ['bag_code'],
    },
  },
  {
    name: 'export_bag_newsletter',
    description: 'Export bag content as HTML suitable for email newsletters with styled product cards',
    inputSchema: {
      type: 'object',
      properties: {
        bag_code: {
          type: 'string',
          description: 'The bag code to export',
        },
      },
      required: ['bag_code'],
    },
  },
  {
    name: 'export_bag_markdown',
    description: 'Export bag content as clean Markdown for blog posts, Notion, or documentation',
    inputSchema: {
      type: 'object',
      properties: {
        bag_code: {
          type: 'string',
          description: 'The bag code to export',
        },
      },
      required: ['bag_code'],
    },
  },
  {
    name: 'export_bag_text',
    description: 'Export bag content as plain text for quick sharing or copying',
    inputSchema: {
      type: 'object',
      properties: {
        bag_code: {
          type: 'string',
          description: 'The bag code to export',
        },
      },
      required: ['bag_code'],
    },
  },
];

interface BagData {
  title: string;
  description: string | null;
  code: string;
  profiles: { handle: string; display_name: string | null } | Array<{ handle: string; display_name: string | null }>;
  bag_items: Array<{
    custom_name: string | null;
    brand: string | null;
    why_chosen: string | null;
    sort_index: number;
    links: Array<{ url: string; kind: string; label: string | null }> | null;
  }>;
}

/**
 * Handle export tool calls
 */
export async function handleExportTool(
  name: string,
  args: Record<string, unknown> | undefined,
  supabase: SupabaseClient,
  userId?: string
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const bagCode = args?.bag_code as string;
  if (!bagCode) {
    return {
      content: [{ type: 'text', text: 'bag_code is required' }],
      isError: true,
    };
  }

  // Fetch bag with owner and items
  const { data: bag, error } = await supabase
    .from('bags')
    .select(`
      title,
      description,
      code,
      owner_id,
      is_public,
      profiles!bags_owner_id_fkey(
        handle,
        display_name
      ),
      bag_items(
        custom_name,
        brand,
        why_chosen,
        sort_index,
        links(url, kind, label)
      )
    `)
    .eq('code', bagCode)
    .single();

  if (error || !bag) {
    return {
      content: [{ type: 'text', text: `Bag '${bagCode}' not found.` }],
      isError: true,
    };
  }

  // Check access - must be public or owned by user
  if (!bag.is_public && bag.owner_id !== userId) {
    return {
      content: [{ type: 'text', text: 'Access denied - bag is private.' }],
      isError: true,
    };
  }

  const profileData = bag.profiles;
  const owner = (Array.isArray(profileData) ? profileData[0] : profileData) as { handle: string; display_name: string | null } | undefined;
  const handle = owner?.handle || 'unknown';
  const displayName = owner?.display_name || handle;
  const bagUrl = `https://teed.club/u/${handle}/${bagCode}`;

  // Sort items
  const items = (bag.bag_items || []).sort((a, b) => (a.sort_index || 0) - (b.sort_index || 0));

  switch (name) {
    case 'export_bag_youtube':
      return exportYouTube(bag as unknown as BagData, items, bagUrl, displayName, args?.include_affiliate_disclaimer !== false);

    case 'export_bag_newsletter':
      return exportNewsletter(bag as unknown as BagData, items, bagUrl, displayName);

    case 'export_bag_markdown':
      return exportMarkdown(bag as unknown as BagData, items, bagUrl, displayName);

    case 'export_bag_text':
      return exportText(bag as unknown as BagData, items, bagUrl, displayName);

    default:
      return {
        content: [{ type: 'text', text: `Unknown export tool: ${name}` }],
        isError: true,
      };
  }
}

function exportYouTube(
  bag: BagData,
  items: BagData['bag_items'],
  bagUrl: string,
  displayName: string,
  includeDisclaimer: boolean
) {
  const lines: string[] = [];

  // Header
  lines.push(`📦 ${bag.title}`);
  if (bag.description) {
    lines.push(bag.description);
  }
  lines.push('');

  // Items with gear list style
  lines.push('🔗 GEAR & LINKS:');
  lines.push('');

  items.forEach((item) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `${item.brand} ${name}` : name;
    const purchaseLink = item.links?.find((l) =>
      ['purchase', 'affiliate', 'product', 'buy'].includes(l.kind)
    );

    if (purchaseLink) {
      lines.push(`▸ ${fullName}`);
      lines.push(`  ${purchaseLink.url}`);
    } else {
      lines.push(`▸ ${fullName}`);
    }

    if (item.why_chosen) {
      lines.push(`  "${item.why_chosen}"`);
    }
    lines.push('');
  });

  // Footer
  lines.push('─────────────────────────');
  lines.push(`📋 See the full collection: ${bagUrl}`);

  if (includeDisclaimer) {
    lines.push('');
    lines.push('Some links may be affiliate links. Thanks for supporting the channel!');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            format: 'youtube',
            bag_code: bag.code,
            item_count: items.length,
            content: lines.join('\n'),
            message: 'YouTube description generated. Copy the content field to use.',
          },
          null,
          2
        ),
      },
    ],
  };
}

function exportNewsletter(
  bag: BagData,
  items: BagData['bag_items'],
  bagUrl: string,
  displayName: string
) {
  const itemsHtml = items
    .map((item) => {
      const name = item.custom_name || item.brand || 'Item';
      const purchaseLink = item.links?.find((l) =>
        ['purchase', 'affiliate', 'product', 'buy'].includes(l.kind)
      );

      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
              ${item.brand ? `<span style="color: #666; font-weight: 400;">${item.brand}</span> ` : ''}${name}
            </div>
            ${item.why_chosen ? `<div style="font-size: 14px; color: #666; font-style: italic; margin-bottom: 8px;">"${item.why_chosen}"</div>` : ''}
            ${purchaseLink ? `<a href="${purchaseLink.url}" style="display: inline-block; padding: 8px 16px; background: #7A9770; color: white; text-decoration: none; border-radius: 6px; font-size: 13px;">View Product →</a>` : ''}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
    <div style="background: linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px;">${bag.title}</h1>
      <p style="margin: 0; color: #666; font-size: 14px;">Curated by ${displayName}</p>
    </div>
    ${bag.description ? `<div style="padding: 20px 24px; color: #444; font-size: 15px; line-height: 1.5; border-bottom: 1px solid #eee;">${bag.description}</div>` : ''}
    <table style="width: 100%; border-collapse: collapse; padding: 0 24px;">
      ${itemsHtml}
    </table>
    <div style="padding: 24px; text-align: center;">
      <a href="${bagUrl}" style="display: inline-block; padding: 14px 28px; background: #7A9770; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        See Full Collection on Teed →
      </a>
    </div>
    <div style="padding: 16px 24px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">Some links may be affiliate links.</p>
      <p style="margin: 8px 0 0 0;">
        <a href="https://teed.club" style="color: #7A9770; text-decoration: none;">Powered by Teed</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            format: 'newsletter',
            bag_code: bag.code,
            item_count: items.length,
            content: html,
            message: 'Newsletter HTML generated. Copy the content field for your email.',
          },
          null,
          2
        ),
      },
    ],
  };
}

function exportMarkdown(
  bag: BagData,
  items: BagData['bag_items'],
  bagUrl: string,
  displayName: string
) {
  const lines: string[] = [];

  lines.push(`# ${bag.title}`);
  lines.push('');
  lines.push(`*Curated by ${displayName}*`);
  lines.push('');

  if (bag.description) {
    lines.push(bag.description);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  items.forEach((item) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `**${item.brand}** ${name}` : `**${name}**`;
    const purchaseLink = item.links?.find((l) =>
      ['purchase', 'affiliate', 'product', 'buy'].includes(l.kind)
    );

    if (purchaseLink) {
      lines.push(`- [${fullName}](${purchaseLink.url})`);
    } else {
      lines.push(`- ${fullName}`);
    }

    if (item.why_chosen) {
      lines.push(`  > "${item.why_chosen}"`);
    }
    lines.push('');
  });

  lines.push('---');
  lines.push('');
  lines.push(`[See the full collection on Teed](${bagUrl})`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            format: 'markdown',
            bag_code: bag.code,
            item_count: items.length,
            content: lines.join('\n'),
            message: 'Markdown generated. Copy the content field for your blog or docs.',
          },
          null,
          2
        ),
      },
    ],
  };
}

function exportText(
  bag: BagData,
  items: BagData['bag_items'],
  bagUrl: string,
  displayName: string
) {
  const lines: string[] = [];

  lines.push(bag.title);
  lines.push(`by ${displayName}`);
  lines.push('');

  if (bag.description) {
    lines.push(bag.description);
    lines.push('');
  }

  lines.push('Items:');
  items.forEach((item, index) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `${item.brand} ${name}` : name;
    lines.push(`${index + 1}. ${fullName}`);
  });

  lines.push('');
  lines.push(`View: ${bagUrl}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            format: 'text',
            bag_code: bag.code,
            item_count: items.length,
            content: lines.join('\n'),
            message: 'Plain text generated.',
          },
          null,
          2
        ),
      },
    ],
  };
}
