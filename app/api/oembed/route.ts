import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OEmbedResponse {
  type: 'rich' | 'photo' | 'video' | 'link';
  version: '1.0';
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name: string;
  provider_url: string;
  cache_age?: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  width?: number;
  height?: number;
}

/**
 * oEmbed endpoint for universal embedding support.
 *
 * Supports URLs in these formats:
 * - https://teed.club/u/{handle}/{code} - Bag embeds
 * - https://teed.club/u/{handle} - Profile embeds
 * - https://teed.club/embed/item/{id} - Item embeds
 *
 * Query params:
 * - url (required): The URL to embed
 * - format: json (default) or xml
 * - maxwidth: Maximum embed width
 * - maxheight: Maximum embed height
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const format = searchParams.get('format') || 'json';
    const maxwidth = parseInt(searchParams.get('maxwidth') || '600');
    const maxheight = parseInt(searchParams.get('maxheight') || '400');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      );
    }

    if (format !== 'json' && format !== 'xml') {
      return NextResponse.json(
        { error: 'Invalid format. Must be json or xml' },
        { status: 400 }
      );
    }

    // Parse the URL to determine content type
    const parsed = parseUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'URL not supported. Must be a teed.club profile or bag URL' },
        { status: 404 }
      );
    }

    let response: OEmbedResponse | null = null;

    if (parsed.type === 'bag') {
      response = await getBagOEmbed(parsed.handle!, parsed.code!, maxwidth, maxheight);
    } else if (parsed.type === 'item') {
      response = await getItemOEmbed(parsed.itemId!, maxwidth, maxheight);
    } else {
      response = await getProfileOEmbed(parsed.handle!, maxwidth, maxheight);
    }

    if (!response) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Return JSON or XML based on format
    if (format === 'xml') {
      return new NextResponse(toXml(response), {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('oEmbed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseUrl(url: string): { type: 'bag' | 'profile' | 'item'; handle?: string; code?: string; itemId?: string } | null {
  try {
    const parsed = new URL(url);

    // Accept teed.club or localhost for development
    if (!['teed.club', 'www.teed.club', 'localhost'].includes(parsed.hostname)) {
      return null;
    }

    // Match /embed/item/{id}
    const itemMatch = parsed.pathname.match(/^\/embed\/item\/([a-f0-9-]+)\/?$/i);
    if (itemMatch) {
      return { type: 'item', itemId: itemMatch[1] };
    }

    // Match /u/{handle}/{code} or /u/{handle}
    const bagMatch = parsed.pathname.match(/^\/u\/([^/]+)\/([^/]+)\/?$/);
    if (bagMatch) {
      return { type: 'bag', handle: bagMatch[1], code: bagMatch[2] };
    }

    const profileMatch = parsed.pathname.match(/^\/u\/([^/]+)\/?$/);
    if (profileMatch) {
      return { type: 'profile', handle: profileMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
}

async function getBagOEmbed(
  handle: string,
  code: string,
  maxwidth: number,
  maxheight: number
): Promise<OEmbedResponse | null> {
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', handle)
    .single();

  if (!profile) return null;

  // Fetch bag with item count
  const { data: bag } = await supabase
    .from('bags')
    .select('id, code, title, description')
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) return null;

  // Get item count
  const { count: itemCount } = await supabase
    .from('bag_items')
    .select('id', { count: 'exact', head: true })
    .eq('bag_id', bag.id);

  const displayName = profile.display_name || handle;
  const bagUrl = `https://teed.club/u/${handle}/${code}`;
  const embedUrl = `https://teed.club/embed/bag/${handle}/${code}`;
  const thumbnailUrl = `https://teed.club/api/og/bag/${handle}/${code}`;

  // Calculate responsive dimensions (maintain 16:9-ish aspect ratio)
  const width = Math.min(maxwidth, 600);
  const height = Math.min(maxheight, Math.round(width * 0.75));

  return {
    type: 'rich',
    version: '1.0',
    title: bag.title,
    author_name: displayName,
    author_url: `https://teed.club/u/${handle}`,
    provider_name: 'Teed.club',
    provider_url: 'https://teed.club',
    cache_age: 3600,
    thumbnail_url: thumbnailUrl,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: generateEmbedHtml(embedUrl, bag.title, width, height),
    width,
    height,
  };
}

async function getItemOEmbed(
  itemId: string,
  maxwidth: number,
  maxheight: number
): Promise<OEmbedResponse | null> {
  // Fetch item with bag and owner info
  const { data: item } = await supabase
    .from('bag_items')
    .select(`
      id,
      custom_name,
      brand,
      photo_url,
      custom_photo_id,
      why_chosen,
      bag:bags!bag_items_bag_id_fkey(
        id,
        code,
        title,
        is_public,
        owner:profiles!bags_owner_id_fkey(
          handle,
          display_name
        )
      )
    `)
    .eq('id', itemId)
    .single();

  if (!item || !item.bag) return null;

  // Check if bag is public
  const bag = Array.isArray(item.bag) ? item.bag[0] : item.bag;
  if (!bag?.is_public) return null;

  const owner = Array.isArray(bag.owner) ? bag.owner[0] : bag.owner;
  if (!owner) return null;

  // Get photo URL for thumbnail
  let photoUrl = item.photo_url;
  if (item.custom_photo_id) {
    const { data: media } = await supabase
      .from('media_assets')
      .select('url')
      .eq('id', item.custom_photo_id)
      .single();
    if (media) {
      photoUrl = media.url;
    }
  }

  const itemName = item.custom_name || item.brand || 'Item';
  const displayName = owner.display_name || owner.handle;
  const bagUrl = `https://teed.club/u/${owner.handle}/${bag.code}`;
  const itemUrl = `https://teed.club/embed/item/${itemId}`;

  // Item cards are more horizontal - 500x180
  const width = Math.min(maxwidth, 500);
  const height = Math.min(maxheight, 180);

  return {
    type: 'rich',
    version: '1.0',
    title: item.brand ? `${item.brand} ${itemName}` : itemName,
    author_name: displayName,
    author_url: `https://teed.club/u/${owner.handle}`,
    provider_name: 'Teed.club',
    provider_url: 'https://teed.club',
    cache_age: 3600,
    thumbnail_url: photoUrl || undefined,
    thumbnail_width: photoUrl ? 400 : undefined,
    thumbnail_height: photoUrl ? 400 : undefined,
    html: generateEmbedHtml(itemUrl, itemName, width, height),
    width,
    height,
  };
}

async function getProfileOEmbed(
  handle: string,
  maxwidth: number,
  maxheight: number
): Promise<OEmbedResponse | null> {
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio')
    .eq('handle', handle)
    .single();

  if (!profile) return null;

  // Get public bag count
  const { count: bagCount } = await supabase
    .from('bags')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', profile.id)
    .eq('is_public', true);

  const displayName = profile.display_name || handle;
  const profileUrl = `https://teed.club/u/${handle}`;
  const embedUrl = `https://teed.club/embed/profile/${handle}`;
  const thumbnailUrl = `https://teed.club/api/og/profile/${handle}`;

  // Calculate responsive dimensions
  const width = Math.min(maxwidth, 400);
  const height = Math.min(maxheight, Math.round(width * 1.2));

  return {
    type: 'rich',
    version: '1.0',
    title: `${displayName}'s Teed.club`,
    author_name: displayName,
    author_url: profileUrl,
    provider_name: 'Teed.club',
    provider_url: 'https://teed.club',
    cache_age: 3600,
    thumbnail_url: thumbnailUrl,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: generateEmbedHtml(embedUrl, `${displayName}'s profile`, width, height),
    width,
    height,
  };
}

function generateEmbedHtml(
  embedUrl: string,
  title: string,
  width: number,
  height: number
): string {
  // Generate iframe embed code
  return `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" scrolling="no" allowtransparency="true" title="${escapeHtml(title)}" style="border-radius: 12px; border: 1px solid #e5e7eb;"></iframe>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toXml(response: OEmbedResponse): string {
  const entries = Object.entries(response)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `  <${key}>${escapeHtml(String(value))}</${key}>`)
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<oembed>
${entries}
</oembed>`;
}
