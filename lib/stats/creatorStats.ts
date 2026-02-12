import { SupabaseClient } from '@supabase/supabase-js';

// Map of common retailer domains to display names
const RETAILER_NAMES: Record<string, string> = {
  'amazon.com': 'Amazon',
  'amzn.to': 'Amazon',
  'rei.com': 'REI',
  'backcountry.com': 'Backcountry',
  'moosejaw.com': 'Moosejaw',
  'dickssportinggoods.com': "Dick's Sporting Goods",
  'golfgalaxy.com': 'Golf Galaxy',
  'pgatoursuperstore.com': 'PGA Tour Superstore',
  'callaway.com': 'Callaway',
  'titleist.com': 'Titleist',
  'taylormadegolf.com': 'TaylorMade',
  'golf.com': 'Golf.com',
  'budgetgolf.com': 'Budget Golf',
  'rockbottomgolf.com': 'Rock Bottom Golf',
  'globalgolf.com': 'GlobalGolf',
  'ebay.com': 'eBay',
  'walmart.com': 'Walmart',
  'target.com': 'Target',
  'etsy.com': 'Etsy',
  'shopify.com': 'Shopify Store',
  'apple.com': 'Apple',
  'bestbuy.com': 'Best Buy',
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
  'underarmour.com': 'Under Armour',
  'footjoy.com': 'FootJoy',
  'pumagolf.com': 'Puma Golf',
};

// Map of common traffic source domains to display names
const TRAFFIC_SOURCE_NAMES: Record<string, { displayName: string; description: string }> = {
  'youtube.com': { displayName: 'YouTube viewers', description: 'love your bags' },
  'youtu.be': { displayName: 'YouTube viewers', description: 'love your bags' },
  'instagram.com': { displayName: 'Instagram followers', description: 'discover your picks' },
  'twitter.com': { displayName: 'Twitter/X followers', description: 'find your curations' },
  'x.com': { displayName: 'X followers', description: 'find your curations' },
  'facebook.com': { displayName: 'Facebook friends', description: 'explore your bags' },
  'tiktok.com': { displayName: 'TikTok viewers', description: 'discover your gear' },
  'reddit.com': { displayName: 'Reddit community', description: 'found your bags' },
  'linkedin.com': { displayName: 'LinkedIn connections', description: 'check out your picks' },
  'pinterest.com': { displayName: 'Pinterest users', description: 'save your curations' },
  'google.com': { displayName: 'Google searchers', description: 'discovered you' },
  'bing.com': { displayName: 'Bing searchers', description: 'found your bags' },
  't.co': { displayName: 'Twitter/X followers', description: 'find your curations' },
};

// Map country codes to names (common ones)
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
  'DE': 'Germany', 'FR': 'France', 'JP': 'Japan', 'BR': 'Brazil', 'IN': 'India',
  'MX': 'Mexico', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands', 'SE': 'Sweden',
  'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'NZ': 'New Zealand', 'IE': 'Ireland',
  'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium', 'PT': 'Portugal', 'PL': 'Poland',
  'KR': 'South Korea', 'SG': 'Singapore', 'HK': 'Hong Kong', 'TW': 'Taiwan', 'ZA': 'South Africa',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code.toUpperCase();
}

function getTrafficSourceDisplayName(domain: string): string {
  const info = TRAFFIC_SOURCE_NAMES[domain];
  if (info) return info.displayName;
  // Capitalize first letter
  const baseName = domain.split('.')[0];
  return baseName.charAt(0).toUpperCase() + baseName.slice(1) + ' visitors';
}

function getTrafficSourceDescription(domain: string): string {
  const info = TRAFFIC_SOURCE_NAMES[domain];
  return info?.description || 'explore your bags';
}

/**
 * Generate a natural language impact story (board-approved: celebrates, doesn't pressure)
 */
function generateImpactStoryInternal(data: {
  peopleReached: number;
  curationsInspired: number;
  curationsBookmarked: number;
  countriesReached: number;
  topBag?: { title: string; views: number };
  topRetailer?: { displayName: string; clicks: number };
}): string {
  const { peopleReached, curationsInspired, curationsBookmarked, countriesReached, topBag, topRetailer } = data;

  if (peopleReached === 0) {
    return '';
  }

  const parts: string[] = [];

  // Opening: reach + geography
  if (countriesReached > 1) {
    parts.push(`Your curations have reached ${peopleReached.toLocaleString()} people across ${countriesReached} countries.`);
  } else {
    parts.push(`Your curations have reached ${peopleReached.toLocaleString()} people.`);
  }

  // Best bag
  if (topBag && topBag.views > 0) {
    parts.push(`Your ${topBag.title} is your most discovered collection, with ${topBag.views} people exploring your picks.`);
  }

  // Inspiration
  if (curationsInspired > 0) {
    const verb = curationsInspired === 1 ? 'was' : 'were';
    parts.push(`${curationsInspired} ${curationsInspired === 1 ? 'person' : 'people'} ${verb} so inspired they created their own collections.`);
  }

  // Saves
  if (curationsBookmarked > 0 && curationsInspired === 0) {
    parts.push(`${curationsBookmarked} ${curationsBookmarked === 1 ? 'person has' : 'people have'} saved your picks for later.`);
  }

  // Top retailer
  if (topRetailer && topRetailer.clicks >= 3) {
    parts.push(`${topRetailer.displayName} is where people shop your recommendations most.`);
  }

  return parts.join(' ');
}

/**
 * Extract domain from URL and get display name
 */
function getDomainInfo(url: string): { domain: string; displayName: string } {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // Check for known retailers
    for (const [key, name] of Object.entries(RETAILER_NAMES)) {
      if (domain.includes(key) || domain.endsWith(key)) {
        return { domain: key, displayName: name };
      }
    }

    // Capitalize first letter of domain for display
    const displayName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    return { domain, displayName };
  } catch {
    return { domain: 'unknown', displayName: 'Unknown' };
  }
}

export type CreatorStats = {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalBags: number;
    publicBags: number;
    totalItems: number;
    totalViews: number;
    totalClicks: number;
    engagementRate: number;
    clickThroughRate: number; // clicks / views as percentage
  };
  impact: {
    peopleReached: number;
    peopleHelped: number;
    curationsInspired: number;
    curationsBookmarked: number;
  };
  bags: Array<{
    id: string;
    code: string;
    title: string;
    isPublic: boolean;
    itemCount: number;
    views: number;
    clicks: number;
    saves: number;
    clones: number;
    engagementRate: number;
  }>;
  topItems: Array<{
    id: string;
    name: string;
    bagTitle: string;
    clicks: number;
  }>;
  // Affiliate tracking: clicks by retailer/domain
  clicksByRetailer: Array<{
    domain: string;
    displayName: string;
    clicks: number;
    percentage: number;
  }>;
  // Top clicked links with URLs for affiliate tracking
  topLinks: Array<{
    id: string;
    url: string;
    domain: string;
    itemName: string;
    bagTitle: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    type: 'view' | 'click' | 'save' | 'clone';
    bagTitle: string;
    itemName?: string;
    url?: string;
    date: string;
  }>;
  // Enhanced insights (board-approved features)
  impactStory: string; // AI-generated natural language summary
  highlights: Array<{
    type: 'best_day' | 'most_loved_item' | 'biggest_fan' | 'milestone';
    title: string;
    subtitle: string;
    value?: number;
    date?: string;
  }>;
  geography: {
    countriesReached: number;
    topCountries: Array<{ country: string; countryCode: string; views: number }>;
  };
  trafficSources: Array<{
    source: string;        // 'youtube.com', 'instagram.com', 'direct', etc.
    displayName: string;   // 'YouTube viewers'
    description: string;   // 'love your bags'
    views: number;
  }>;
  followers: {
    total: number;
    newInPeriod: number;
  };
  profileViews: number;
  socialClicks: Array<{
    platform: string;
    clicks: number;
  }>;
  totalShares: number;
};

export async function getCreatorStats(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<CreatorStats | null> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all user's bags with item counts
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        is_public,
        created_at
      `)
      .eq('owner_id', userId);

    if (bagsError) {
      console.error('[Stats] Error fetching bags:', bagsError);
      return null;
    }

    // Get item counts separately to avoid relationship issues
    const bagIds = bags?.map(b => b.id) || [];

    let itemCounts: Record<string, number> = {};
    if (bagIds.length > 0) {
      const { data: items } = await supabase
        .from('bag_items')
        .select('bag_id')
        .in('bag_id', bagIds);

      items?.forEach(item => {
        itemCounts[item.bag_id] = (itemCounts[item.bag_id] || 0) + 1;
      });
    }

    const totalItems = Object.values(itemCounts).reduce((sum, count) => sum + count, 0);

    if (!bags || bags.length === 0) {
      return {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        overview: {
          totalBags: 0,
          publicBags: 0,
          totalItems: 0,
          totalViews: 0,
          totalClicks: 0,
          engagementRate: 0,
          clickThroughRate: 0,
        },
        impact: {
          peopleReached: 0,
          peopleHelped: 0,
          curationsInspired: 0,
          curationsBookmarked: 0,
        },
        bags: [],
        topItems: [],
        clicksByRetailer: [],
        topLinks: [],
        recentActivity: [],
        impactStory: '',
        highlights: [],
        geography: { countriesReached: 0, topCountries: [] },
        trafficSources: [],
        followers: { total: 0, newInPeriod: 0 },
        profileViews: 0,
        socialClicks: [],
        totalShares: 0,
      };
    }

    // Fetch user_activity events for this user's bags
    // The table stores bag_id in event_data JSONB field
    const { data: activityEvents, error: activityError } = await supabase
      .from('user_activity')
      .select('event_type, event_data, created_at')
      .gte('created_at', startDate.toISOString())
      .in('event_type', ['bag_viewed', 'link_clicked', 'bag_saved', 'bag_cloned', 'item_viewed'])
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('[Stats] Error fetching activity:', activityError);
      // Continue with empty events rather than failing
    }

    // Filter events to only those for this user's bags
    const events = (activityEvents || []).filter(e => {
      const bagId = e.event_data?.bag_id || e.event_data?.bagId;
      const ownerId = e.event_data?.owner_id || e.event_data?.ownerId;
      return bagId && (bagIds.includes(bagId) || ownerId === userId);
    });

    // Categorize events
    const bagViews = events.filter(e => e.event_type === 'bag_viewed');
    const linkClicks = events.filter(e => e.event_type === 'link_clicked');
    const bagSaves = events.filter(e => e.event_type === 'bag_saved');
    const bagClones = events.filter(e => e.event_type === 'bag_cloned');

    // Calculate totals
    const totalViews = bagViews.length;
    const totalClicks = linkClicks.length;
    const totalSaves = bagSaves.length;
    const totalClones = bagClones.length;

    // Per-bag breakdown
    const bagBreakdown = bags.map(bag => {
      const views = bagViews.filter(e =>
        (e.event_data?.bag_id || e.event_data?.bagId) === bag.id
      ).length;
      const clicks = linkClicks.filter(e =>
        (e.event_data?.bag_id || e.event_data?.bagId) === bag.id
      ).length;
      const saves = bagSaves.filter(e =>
        (e.event_data?.bag_id || e.event_data?.bagId) === bag.id
      ).length;
      const clones = bagClones.filter(e =>
        (e.event_data?.bag_id || e.event_data?.bagId) === bag.id
      ).length;

      return {
        id: bag.id,
        code: bag.code,
        title: bag.title,
        isPublic: bag.is_public,
        itemCount: itemCounts[bag.id] || 0,
        views,
        clicks,
        saves,
        clones,
        engagementRate: views > 0 ? Math.round(((clicks + saves + clones) / views) * 100) : 0,
      };
    }).sort((a, b) => b.views - a.views);

    // Top clicked items
    const itemClickCounts: Record<string, { name: string; bagTitle: string; clicks: number }> = {};
    linkClicks.forEach(click => {
      const bagId = click.event_data?.bag_id || click.event_data?.bagId;
      const itemId = click.event_data?.item_id || click.event_data?.itemId || 'unknown';
      const itemName = click.event_data?.item_name || click.event_data?.itemName || 'Unknown Item';
      const bag = bags.find(b => b.id === bagId);

      if (!itemClickCounts[itemId]) {
        itemClickCounts[itemId] = {
          name: itemName,
          bagTitle: bag?.title || 'Unknown Bag',
          clicks: 0,
        };
      }
      itemClickCounts[itemId].clicks++;
    });

    const topItems = Object.entries(itemClickCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Clicks by retailer/domain for affiliate tracking
    const retailerCounts: Record<string, { displayName: string; clicks: number }> = {};
    linkClicks.forEach(click => {
      const url = click.event_data?.url;
      if (url) {
        const { domain, displayName } = getDomainInfo(url);
        if (!retailerCounts[domain]) {
          retailerCounts[domain] = { displayName, clicks: 0 };
        }
        retailerCounts[domain].clicks++;
      }
    });

    const clicksByRetailer = Object.entries(retailerCounts)
      .map(([domain, data]) => ({
        domain,
        displayName: data.displayName,
        clicks: data.clicks,
        percentage: totalClicks > 0 ? Math.round((data.clicks / totalClicks) * 100) : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Top clicked links with URLs for affiliate tracking
    const linkClickCounts: Record<string, {
      url: string;
      domain: string;
      itemName: string;
      bagTitle: string;
      clicks: number;
    }> = {};

    linkClicks.forEach(click => {
      const url = click.event_data?.url;
      const linkId = click.event_data?.link_id || click.event_data?.linkId || 'unknown';
      const itemName = click.event_data?.item_name || click.event_data?.itemName || 'Unknown Item';
      const bagId = click.event_data?.bag_id || click.event_data?.bagId;
      const bag = bags.find(b => b.id === bagId);

      if (url && linkId !== 'unknown') {
        const { domain } = getDomainInfo(url);
        if (!linkClickCounts[linkId]) {
          linkClickCounts[linkId] = {
            url,
            domain,
            itemName,
            bagTitle: bag?.title || 'Unknown Bag',
            clicks: 0,
          };
        }
        linkClickCounts[linkId].clicks++;
      }
    });

    const topLinks = Object.entries(linkClickCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Recent activity (last 10 events)
    const recentActivity = events.slice(0, 10).map(e => {
      const bagId = e.event_data?.bag_id || e.event_data?.bagId;
      const bag = bags.find(b => b.id === bagId);

      let type: 'view' | 'click' | 'save' | 'clone' = 'view';
      if (e.event_type === 'link_clicked') type = 'click';
      if (e.event_type === 'bag_saved') type = 'save';
      if (e.event_type === 'bag_cloned') type = 'clone';

      // Include extra data for click events (useful for affiliate tracking)
      const itemName = type === 'click' ? (e.event_data?.item_name || e.event_data?.itemName) : undefined;
      const url = type === 'click' ? e.event_data?.url : undefined;

      return {
        type,
        bagTitle: bag?.title || 'Unknown',
        itemName,
        url,
        date: e.created_at,
      };
    });

    // === ENHANCED INSIGHTS (Board-Approved Features) ===

    // Geographic reach - count unique countries from event_data.country_code
    const countryCounts: Record<string, number> = {};
    events.forEach(e => {
      const countryCode = e.event_data?.country_code;
      if (countryCode && typeof countryCode === 'string') {
        countryCounts[countryCode] = (countryCounts[countryCode] || 0) + 1;
      }
    });

    const topCountries = Object.entries(countryCounts)
      .map(([countryCode, views]) => ({
        country: getCountryName(countryCode),
        countryCode,
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const geography = {
      countriesReached: Object.keys(countryCounts).length,
      topCountries,
    };

    // Traffic sources - aggregate by referrer_domain
    const sourceCounts: Record<string, number> = {};
    events.forEach(e => {
      const referrerDomain = e.event_data?.referrer_domain;
      if (referrerDomain && typeof referrerDomain === 'string') {
        // Normalize the domain
        const normalizedDomain = referrerDomain.replace(/^www\./, '').toLowerCase();
        sourceCounts[normalizedDomain] = (sourceCounts[normalizedDomain] || 0) + 1;
      }
    });

    const trafficSources = Object.entries(sourceCounts)
      .map(([source, views]) => ({
        source,
        displayName: getTrafficSourceDisplayName(source),
        description: getTrafficSourceDescription(source),
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Highlights - find best moments (celebrate peaks, not averages)
    const highlights: Array<{
      type: 'best_day' | 'most_loved_item' | 'biggest_fan' | 'milestone';
      title: string;
      subtitle: string;
      value?: number;
      date?: string;
    }> = [];

    // Best day (most views in a single day)
    const viewsByDay: Record<string, number> = {};
    bagViews.forEach(e => {
      const day = e.created_at.split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    });

    const bestDay = Object.entries(viewsByDay)
      .sort(([, a], [, b]) => b - a)[0];

    if (bestDay && bestDay[1] >= 3) {
      const [dateStr, count] = bestDay;
      const date = new Date(dateStr);
      highlights.push({
        type: 'best_day',
        title: `${count} people discovered your bags`,
        subtitle: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: count,
        date: dateStr,
      });
    }

    // Most loved item (most clicks)
    const topClickedItem = topItems[0];
    if (topClickedItem && topClickedItem.clicks >= 2 && topClickedItem.name !== 'Unknown Item') {
      highlights.push({
        type: 'most_loved_item',
        title: topClickedItem.name,
        subtitle: `${topClickedItem.clicks} people explored this`,
        value: topClickedItem.clicks,
      });
    }

    // Milestone achievements
    if (totalClones >= 1) {
      highlights.push({
        type: 'milestone',
        title: `Inspired ${totalClones} collection${totalClones > 1 ? 's' : ''}`,
        subtitle: 'People building on your taste',
        value: totalClones,
      });
    }

    // Follower data
    const { count: totalFollowers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: newFollowersInPeriod } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .gte('created_at', startDate.toISOString());

    // Profile views — how many people visited creator's profile
    const { count: profileViews } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'profile_viewed')
      .contains('event_data', { profile_id: userId })
      .gte('created_at', startDate.toISOString());

    // Social link clicks — which social links on profile get clicks
    // Get user handle to filter social click events
    const { data: profileData } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', userId)
      .single();

    const userHandle = profileData?.handle;
    let socialClicks: Array<{ platform: string; clicks: number }> = [];
    if (userHandle) {
      const { data: socialClickEvents } = await supabase
        .from('user_activity')
        .select('event_data')
        .eq('event_type', 'social_link_clicked')
        .contains('event_data', { profile_handle: userHandle })
        .gte('created_at', startDate.toISOString());

      const socialPlatformCounts: Record<string, number> = {};
      (socialClickEvents || []).forEach(e => {
        const platform = e.event_data?.platform || 'unknown';
        socialPlatformCounts[platform] = (socialPlatformCounts[platform] || 0) + 1;
      });
      socialClicks = Object.entries(socialPlatformCounts)
        .map(([platform, clicks]) => ({ platform, clicks }))
        .sort((a, b) => b.clicks - a.clicks);
    }

    // Bag shares — how many times creator's bags were shared
    const { data: shareEvents } = await supabase
      .from('user_activity')
      .select('event_data')
      .eq('event_type', 'bag_shared')
      .gte('created_at', startDate.toISOString());

    const totalShares = (shareEvents || []).filter(e => {
      const bagId = e.event_data?.bag_id;
      return bagId && bagIds.includes(bagId);
    }).length;

    // Generate impact story (natural language summary)
    const impactStory = generateImpactStoryInternal({
      peopleReached: totalViews,
      curationsInspired: totalClones,
      curationsBookmarked: totalSaves,
      countriesReached: geography.countriesReached,
      topBag: bagBreakdown[0],
      topRetailer: clicksByRetailer[0],
    });

    return {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      overview: {
        totalBags: bags.length,
        publicBags: bags.filter(b => b.is_public).length,
        totalItems,
        totalViews,
        totalClicks,
        engagementRate: totalViews > 0 ? Math.round(((totalClicks + totalSaves + totalClones) / totalViews) * 100) : 0,
        clickThroughRate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0,
      },
      impact: {
        peopleReached: totalViews,
        peopleHelped: totalClicks + totalClones,
        curationsInspired: totalClones,
        curationsBookmarked: totalSaves,
      },
      bags: bagBreakdown,
      topItems,
      clicksByRetailer,
      topLinks,
      recentActivity,
      impactStory,
      highlights,
      geography,
      trafficSources,
      followers: {
        total: totalFollowers || 0,
        newInPeriod: newFollowersInPeriod || 0,
      },
      profileViews: profileViews || 0,
      socialClicks,
      totalShares,
    };
  } catch (error) {
    console.error('[Stats] Unexpected error:', error);
    return null;
  }
}
