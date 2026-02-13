import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * RSS Feed for a user's profile.
 * Shows their public bags as feed items.
 *
 * GET /u/{handle}/feed.xml
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url')
    .eq('handle', handle)
    .single();

  if (!profile) {
    return new Response('Profile not found', { status: 404 });
  }

  // Fetch public bags
  const { data: bags } = await supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      created_at,
      updated_at,
      items:bag_items(id)
    `)
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(20);

  const displayName = profile.display_name || profile.handle;
  const baseUrl = 'https://teed.club';
  const profileUrl = `${baseUrl}/u/${handle}`;
  const feedUrl = `${profileUrl}/feed.xml`;

  const rss = generateRssFeed({
    title: `${displayName}'s Teed.club`,
    description: profile.bio || `${displayName}'s curated collections on Teed.club`,
    link: profileUrl,
    feedUrl,
    imageUrl: profile.avatar_url,
    items: (bags || []).map((bag: any) => ({
      title: bag.title,
      description: bag.description || `${bag.title} - ${bag.items?.length || 0} items`,
      link: `${profileUrl}/${bag.code}`,
      guid: `${profileUrl}/${bag.code}`,
      pubDate: new Date(bag.updated_at || bag.created_at),
      categories: ['collection'],
    })),
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
  categories?: string[];
}

interface FeedOptions {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  imageUrl?: string | null;
  items: FeedItem[];
}

function generateRssFeed(options: FeedOptions): string {
  const { title, description, link, feedUrl, imageUrl, items } = options;

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
      <description><![CDATA[${item.description}]]></description>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${formatDate(item.pubDate)}</pubDate>
      ${item.categories?.map((cat) => `<category>${escapeXml(cat)}</category>`).join('\n      ') || ''}
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description><![CDATA[${description}]]></description>
    <link>${escapeXml(link)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${formatDate(new Date())}</lastBuildDate>
    <generator>Teed</generator>
    ${imageUrl ? `<image>
      <url>${escapeXml(imageUrl)}</url>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
    </image>` : ''}
    ${itemsXml}
  </channel>
</rss>`;
}
