import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/export/all
 *
 * DOCTRINE: Li Jin's creator ownership principle; trust-building.
 * Export all user data in portable formats for backup and portability.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get('format') || 'json';

  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch all bags
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (bagsError) {
      console.error('Error fetching bags:', bagsError);
    }

    const bagIds = (bags || []).map(b => b.id);

    // Fetch all items from user's bags
    let items: any[] = [];
    if (bagIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('bag_items')
        .select('*')
        .in('bag_id', bagIds)
        .order('sort_index', { ascending: true });

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
      }
      items = itemsData || [];
    }

    // Fetch all links from user's items
    const itemIds = items.map(i => i.id);
    let links: any[] = [];
    if (itemIds.length > 0) {
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .in('bag_item_id', itemIds);

      if (linksError) {
        console.error('Error fetching links:', linksError);
      }
      links = linksData || [];
    }

    // Fetch profile blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('profile_blocks')
      .select('*')
      .eq('profile_id', user.id)
      .order('sort_order', { ascending: true });

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
    }

    // Fetch saved bags
    const { data: savedBags, error: savedBagsError } = await supabase
      .from('saved_bags')
      .select('bag_id, created_at')
      .eq('user_id', user.id);

    if (savedBagsError) {
      console.error('Error fetching saved bags:', savedBagsError);
    }

    // Fetch follows
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('followed_id, created_at')
      .eq('follower_id', user.id);

    if (followingError) {
      console.error('Error fetching follows:', followingError);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      bags: (bags || []).map(bag => ({
        ...bag,
        items: items.filter(i => i.bag_id === bag.id).map(item => ({
          ...item,
          links: links.filter(l => l.bag_item_id === item.id),
        })),
      })),
      profileBlocks: blocks || [],
      savedBags: savedBags || [],
      following: following || [],
      stats: {
        totalBags: bags?.length || 0,
        totalItems: items.length,
        totalLinks: links.length,
      },
    };

    if (format === 'csv') {
      // For CSV, we flatten the structure - one row per item
      const csvRows: string[] = [];
      const headers = [
        'bag_title', 'bag_code', 'bag_category', 'bag_is_public',
        'item_name', 'item_brand', 'item_description', 'item_notes',
        'item_why_chosen', 'item_price_paid', 'item_purchase_date',
        'link_url', 'link_kind',
      ];
      csvRows.push(headers.join(','));

      for (const bag of exportData.bags) {
        for (const item of bag.items) {
          if (item.links.length > 0) {
            for (const link of item.links) {
              csvRows.push([
                escapeCSV(bag.title),
                escapeCSV(bag.code),
                escapeCSV(bag.category || ''),
                bag.is_public ? 'true' : 'false',
                escapeCSV(item.custom_name || ''),
                escapeCSV(item.brand || ''),
                escapeCSV(item.custom_description || ''),
                escapeCSV(item.notes || ''),
                escapeCSV(item.why_chosen || ''),
                item.price_paid?.toString() || '',
                escapeCSV(item.purchase_date || ''),
                escapeCSV(link.url || ''),
                escapeCSV(link.kind || ''),
              ].join(','));
            }
          } else {
            // Item with no links
            csvRows.push([
              escapeCSV(bag.title),
              escapeCSV(bag.code),
              escapeCSV(bag.category || ''),
              bag.is_public ? 'true' : 'false',
              escapeCSV(item.custom_name || ''),
              escapeCSV(item.brand || ''),
              escapeCSV(item.custom_description || ''),
              escapeCSV(item.notes || ''),
              escapeCSV(item.why_chosen || ''),
              item.price_paid?.toString() || '',
              escapeCSV(item.purchase_date || ''),
              '', '',
            ].join(','));
          }
        }
      }

      const csvContent = csvRows.join('\n');
      const handle = profile?.handle || 'export';
      const filename = `teed-export-${handle}-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format (default)
    const handle = profile?.handle || 'export';
    const filename = `teed-export-${handle}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function escapeCSV(str: string): string {
  if (!str) return '';
  // If the string contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
