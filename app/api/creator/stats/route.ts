import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/creator/stats
 * Get comprehensive creator statistics with human-centric framing
 *
 * Returns:
 * - Impact metrics (people helped, curations shared)
 * - Engagement breakdown (by bag, by item)
 * - Revenue transparency (affiliate earnings if applicable)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time range from query params (default 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all user's bags with basic stats
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        is_public,
        created_at,
        items:bag_items(count)
      `)
      .eq('owner_id', user.id);

    if (bagsError) {
      console.error('Error fetching bags:', bagsError);
      return NextResponse.json({ error: 'Failed to fetch bags' }, { status: 500 });
    }

    const bagIds = bags?.map(b => b.id) || [];

    // Fetch analytics events for the period
    const { data: analyticsEvents, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('event_type, bag_id, item_id, created_at')
      .in('bag_id', bagIds.length > 0 ? bagIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('created_at', startDate.toISOString());

    // Calculate impact metrics
    const bagViews = analyticsEvents?.filter(e => e.event_type === 'bag_view') || [];
    const itemViews = analyticsEvents?.filter(e => e.event_type === 'item_view') || [];
    const linkClicks = analyticsEvents?.filter(e => e.event_type === 'link_click') || [];
    const bagSaves = analyticsEvents?.filter(e => e.event_type === 'bag_save') || [];
    const bagClones = analyticsEvents?.filter(e => e.event_type === 'bag_clone') || [];

    // Unique visitors (simplified - by distinct bag_id + created_at day)
    const uniqueVisitorDays = new Set(
      bagViews.map(e => `${e.bag_id}-${new Date(e.created_at).toDateString()}`)
    ).size;

    // Fetch affiliate click data
    const { data: affiliateClicks, error: affError } = await supabase
      .from('affiliate_clicks')
      .select(`
        id,
        clicked_at,
        affiliate_link:affiliate_links(
          bag_item_id,
          provider,
          bag_item:bag_items(
            bag_id,
            custom_name
          )
        )
      `)
      .gte('clicked_at', startDate.toISOString());

    // Filter to only clicks for this user's bags
    // Note: Supabase returns nested relations as arrays
    const userAffiliateClicks = affiliateClicks?.filter(click => {
      const affiliateLink = Array.isArray(click.affiliate_link) ? click.affiliate_link[0] : click.affiliate_link;
      const bagItem = affiliateLink?.bag_item ? (Array.isArray(affiliateLink.bag_item) ? affiliateLink.bag_item[0] : affiliateLink.bag_item) : null;
      const bagId = bagItem?.bag_id;
      return bagId && bagIds.includes(bagId);
    }) || [];

    // Calculate per-bag breakdown
    const bagBreakdown = bags?.map(bag => {
      const bagViewCount = bagViews.filter(e => e.bag_id === bag.id).length;
      const bagItemViewCount = itemViews.filter(e => e.bag_id === bag.id).length;
      const bagClickCount = linkClicks.filter(e => e.bag_id === bag.id).length;
      const bagSaveCount = bagSaves.filter(e => e.bag_id === bag.id).length;
      const bagCloneCount = bagClones.filter(e => e.bag_id === bag.id).length;
      const affiliateClickCount = userAffiliateClicks.filter(c => {
        const affiliateLink = Array.isArray(c.affiliate_link) ? c.affiliate_link[0] : c.affiliate_link;
        const bagItem = affiliateLink?.bag_item ? (Array.isArray(affiliateLink.bag_item) ? affiliateLink.bag_item[0] : affiliateLink.bag_item) : null;
        return bagItem?.bag_id === bag.id;
      }).length;

      return {
        id: bag.id,
        code: bag.code,
        title: bag.title,
        isPublic: bag.is_public,
        itemCount: bag.items?.[0]?.count || 0,
        views: bagViewCount,
        itemViews: bagItemViewCount,
        linkClicks: bagClickCount,
        saves: bagSaveCount,
        clones: bagCloneCount,
        affiliateClicks: affiliateClickCount,
        // Engagement rate = (clicks + saves + clones) / views
        engagementRate: bagViewCount > 0
          ? Math.round(((bagClickCount + bagSaveCount + bagCloneCount) / bagViewCount) * 100)
          : 0,
      };
    }).sort((a, b) => b.views - a.views) || [];

    // Top performing items
    const itemClickCounts: Record<string, { name: string; clicks: number }> = {};
    userAffiliateClicks.forEach(click => {
      const affiliateLink = Array.isArray(click.affiliate_link) ? click.affiliate_link[0] : click.affiliate_link;
      const bagItem = affiliateLink?.bag_item ? (Array.isArray(affiliateLink.bag_item) ? affiliateLink.bag_item[0] : affiliateLink.bag_item) : null;
      const itemName = bagItem?.custom_name || 'Unknown';
      const itemId = affiliateLink?.bag_item_id || 'unknown';
      if (!itemClickCounts[itemId]) {
        itemClickCounts[itemId] = { name: itemName, clicks: 0 };
      }
      itemClickCounts[itemId].clicks++;
    });
    const topItems = Object.entries(itemClickCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Calculate totals with human-centric framing
    const totalViews = bagViews.length;
    const totalItemsExplored = itemViews.length;
    const totalPeopleHelped = linkClicks.length + bagClones.length; // People who took action
    const totalSaves = bagSaves.length;
    const totalClones = bagClones.length;
    const totalAffiliateClicks = userAffiliateClicks.length;

    // Time-based trends (daily breakdown for charts)
    const dailyStats: Record<string, { views: number; clicks: number; helped: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = { views: 0, clicks: 0, helped: 0 };
    }

    bagViews.forEach(e => {
      const dateKey = new Date(e.created_at).toISOString().split('T')[0];
      if (dailyStats[dateKey]) dailyStats[dateKey].views++;
    });
    linkClicks.forEach(e => {
      const dateKey = new Date(e.created_at).toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].clicks++;
        dailyStats[dateKey].helped++;
      }
    });
    bagClones.forEach(e => {
      const dateKey = new Date(e.created_at).toISOString().split('T')[0];
      if (dailyStats[dateKey]) dailyStats[dateKey].helped++;
    });

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      impact: {
        // Human-centric metrics
        peopleReached: totalViews,
        itemsExplored: totalItemsExplored,
        peopleHelped: totalPeopleHelped,
        curationsInspired: totalClones,
        curationsBookmarked: totalSaves,
      },
      engagement: {
        totalViews,
        totalClicks: linkClicks.length,
        totalAffiliateClicks,
        overallEngagementRate: totalViews > 0
          ? Math.round(((linkClicks.length + totalSaves + totalClones) / totalViews) * 100)
          : 0,
      },
      bags: {
        total: bags?.length || 0,
        public: bags?.filter(b => b.is_public).length || 0,
        breakdown: bagBreakdown,
      },
      topItems,
      trends: {
        daily: Object.entries(dailyStats)
          .map(([date, stats]) => ({ date, ...stats }))
          .reverse(),
      },
      // Messaging suggestions based on performance
      insights: generateInsights({
        totalViews,
        peopleHelped: totalPeopleHelped,
        totalClones,
        topItems,
        bagBreakdown,
      }),
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/creator/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInsights(data: {
  totalViews: number;
  peopleHelped: number;
  totalClones: number;
  topItems: Array<{ name: string; clicks: number }>;
  bagBreakdown: Array<{ title: string; views: number; engagementRate: number }>;
}) {
  const insights: string[] = [];

  if (data.peopleHelped > 0) {
    insights.push(`Your curations have helped ${data.peopleHelped} ${data.peopleHelped === 1 ? 'person' : 'people'} discover products they were looking for.`);
  }

  if (data.totalClones > 0) {
    insights.push(`${data.totalClones} ${data.totalClones === 1 ? 'person has' : 'people have'} been inspired to create their own curations based on yours.`);
  }

  if (data.topItems.length > 0 && data.topItems[0].clicks > 3) {
    insights.push(`Your recommendation of "${data.topItems[0].name}" is resonating - it's your most-clicked item.`);
  }

  const topBag = data.bagBreakdown.find(b => b.views > 0 && b.engagementRate > 10);
  if (topBag) {
    insights.push(`"${topBag.title}" has a ${topBag.engagementRate}% engagement rate - your expertise is valued here.`);
  }

  if (data.totalViews === 0) {
    insights.push('Share your curations to start building your audience. Quality recommendations attract engaged visitors.');
  }

  return insights;
}
