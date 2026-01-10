import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * RSS Feed for a bag.
 * Shows items in the bag as feed items.
 *
 * GET /u/{handle}/{code}/feed.xml
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string; code: string }> }
) {
  const { handle, code } = await params;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', handle)
    .single();

  if (!profile) {
    return new Response('Profile not found', { status: 404 });
  }

  // Fetch bag with items
  const { data: bag } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      updated_at,
      items:bag_items(
        id,
        custom_name,
        brand,
        custom_description,
        notes,
        photo_url,
        custom_photo_id,
        created_at,
        updated_at,
        links(url, kind)
      )
    `)
    .eq('owner_id', profile.id)
    .eq('code', code)
    .eq('is_public', true)
    .single();

  if (!bag) {
    return new Response('Bag not found', { status: 404 });
  }

  // Get photo URLs for items
  const photoIds = (bag.items || [])
    .map((item: any) => item.custom_photo_id)
    .filter((id: string | null): id is string => id !== null);

  let photoUrls: Record<string, string> = {};
  if (photoIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', photoIds);

    if (mediaAssets) {
      photoUrls = mediaAssets.reduce((acc: Record<string, string>, asset: { id: string; url: string }) => {
        acc[asset.id] = asset.url;
        return acc;
      }, {});
    }
  }

  const displayName = profile.display_name || profile.handle;
  const baseUrl = 'https://teed.club';
  const bagUrl = `${baseUrl}/u/${handle}/${code}`;
  const feedUrl = `${bagUrl}/feed.xml`;

  const rss = generateRssFeed({
    title: `${bag.title} by ${displayName}`,
    description: bag.description || `${bag.title} - A curated collection by ${displayName}`,
    link: bagUrl,
    feedUrl,
    items: (bag.items || []).map((item: any) => {
      const name = item.custom_name || item.brand || 'Item';
      const photoUrl = item.custom_photo_id ? photoUrls[item.custom_photo_id] : item.photo_url;
      const purchaseLink = item.links?.find((l: any) => ['purchase', 'affiliate', 'product'].includes(l.kind));

      return {
        title: item.brand ? `${item.brand} - ${name}` : name,
        description: item.custom_description || item.notes || name,
        link: purchaseLink?.url || bagUrl,
        guid: `${bagUrl}#item-${item.id}`,
        pubDate: new Date(item.updated_at || item.created_at),
        imageUrl: photoUrl,
      };
    }),
  });

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

interface FeedItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  pubDate: Date;
  imageUrl?: string | null;
}

interface FeedOptions {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  items: FeedItem[];
}

function generateRssFeed(options: FeedOptions): string {
  const { title, description, link, feedUrl, items } = options;

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const formatDate = (date: Date): string => {
    return date.toUTCString();
  };

  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description><![CDATA[${item.description}${item.imageUrl ? `<br/><img src="${item.imageUrl}" alt="${escapeXml(item.title)}"/>` : ''}]]></description>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <pubDate>${formatDate(item.pubDate)}</pubDate>
      ${item.imageUrl ? `<enclosure url="${escapeXml(item.imageUrl)}" type="image/jpeg"/>` : ''}
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(title)}</title>
    <description><![CDATA[${description}]]></description>
    <link>${escapeXml(link)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${formatDate(new Date())}</lastBuildDate>
    <generator>Teed</generator>
    ${itemsXml}
  </channel>
</rss>`;
}
