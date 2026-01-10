import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ExportFormat = 'youtube' | 'newsletter' | 'markdown' | 'text';

/**
 * Export bag content in various platform-optimized formats.
 *
 * GET /api/export/{code}?format=youtube|newsletter|markdown|text
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'text') as ExportFormat;

  // Fetch bag with owner and items
  const { data: bag } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      owner:profiles!bags_owner_id_fkey(
        handle,
        display_name
      ),
      items:bag_items(
        id,
        custom_name,
        brand,
        custom_description,
        notes,
        why_chosen,
        sort_index,
        links(url, kind, label)
      )
    `)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) {
    return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
  }

  const owner = Array.isArray(bag.owner) ? bag.owner[0] : bag.owner;
  const handle = owner?.handle || 'unknown';
  const displayName = owner?.display_name || handle;
  const bagUrl = `https://teed.club/u/${handle}/${code}`;

  // Sort items
  const items = (bag.items || []).sort((a: any, b: any) => a.sort_index - b.sort_index);

  let content: string;
  let contentType: string;

  switch (format) {
    case 'youtube':
      content = generateYouTubeDescription(bag, items, bagUrl, displayName);
      contentType = 'text/plain';
      break;
    case 'newsletter':
      content = generateNewsletterHtml(bag, items, bagUrl, displayName);
      contentType = 'text/html';
      break;
    case 'markdown':
      content = generateMarkdown(bag, items, bagUrl, displayName);
      contentType = 'text/markdown';
      break;
    default:
      content = generatePlainText(bag, items, bagUrl, displayName);
      contentType = 'text/plain';
  }

  return new Response(content, {
    headers: {
      'Content-Type': `${contentType}; charset=utf-8`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function generateYouTubeDescription(
  bag: any,
  items: any[],
  bagUrl: string,
  displayName: string
): string {
  const lines: string[] = [];

  // Header
  lines.push(`📦 ${bag.title}`);
  if (bag.description) {
    lines.push(bag.description);
  }
  lines.push('');

  // Items with timestamps style (like YouTube gear lists)
  lines.push('🔗 GEAR & LINKS:');
  lines.push('');

  items.forEach((item: any, index: number) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `${item.brand} ${name}` : name;
    const purchaseLink = item.links?.find((l: any) =>
      ['purchase', 'affiliate', 'product'].includes(l.kind)
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
  lines.push('');
  lines.push('Some links may be affiliate links. Thanks for supporting the channel!');

  return lines.join('\n');
}

function generateNewsletterHtml(
  bag: any,
  items: any[],
  bagUrl: string,
  displayName: string
): string {
  const itemsHtml = items
    .map((item: any) => {
      const name = item.custom_name || item.brand || 'Item';
      const purchaseLink = item.links?.find((l: any) =>
        ['purchase', 'affiliate', 'product'].includes(l.kind)
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px;">${bag.title}</h1>
      <p style="margin: 0; color: #666; font-size: 14px;">Curated by ${displayName}</p>
    </div>

    <!-- Description -->
    ${bag.description ? `<div style="padding: 20px 24px; color: #444; font-size: 15px; line-height: 1.5; border-bottom: 1px solid #eee;">${bag.description}</div>` : ''}

    <!-- Items -->
    <table style="width: 100%; border-collapse: collapse; padding: 0 24px;">
      ${itemsHtml}
    </table>

    <!-- CTA -->
    <div style="padding: 24px; text-align: center;">
      <a href="${bagUrl}" style="display: inline-block; padding: 14px 28px; background: #7A9770; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        See Full Collection on Teed →
      </a>
    </div>

    <!-- Footer -->
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
}

function generateMarkdown(
  bag: any,
  items: any[],
  bagUrl: string,
  displayName: string
): string {
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

  items.forEach((item: any) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `**${item.brand}** ${name}` : `**${name}**`;
    const purchaseLink = item.links?.find((l: any) =>
      ['purchase', 'affiliate', 'product'].includes(l.kind)
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

  return lines.join('\n');
}

function generatePlainText(
  bag: any,
  items: any[],
  bagUrl: string,
  displayName: string
): string {
  const lines: string[] = [];

  lines.push(bag.title);
  lines.push(`by ${displayName}`);
  lines.push('');

  if (bag.description) {
    lines.push(bag.description);
    lines.push('');
  }

  lines.push('Items:');
  items.forEach((item: any, index: number) => {
    const name = item.custom_name || item.brand || 'Item';
    const fullName = item.brand && item.custom_name ? `${item.brand} ${name}` : name;
    lines.push(`${index + 1}. ${fullName}`);
  });

  lines.push('');
  lines.push(`View: ${bagUrl}`);

  return lines.join('\n');
}
