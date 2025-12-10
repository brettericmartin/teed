import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/adminAuth';

/**
 * GET /api/admin/analytics
 *
 * Fetches analytics data for the admin dashboard
 * Query params:
 *   - range: '7d' | '30d' | '90d' (default: '30d')
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and super_admins can view analytics
    if (admin.role === 'moderator') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse date range
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    let daysBack: number;
    switch (range) {
      case '7d':
        daysBack = 7;
        break;
      case '90d':
        daysBack = 90;
        break;
      default:
        daysBack = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString();

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch cost summary by model using the helper function
    const { data: costSummaryData, error: costError } = await supabaseAdmin
      .rpc('get_api_cost_summary', {
        start_date: startDateStr,
        end_date: new Date().toISOString(),
      });

    if (costError) {
      console.error('Cost summary error:', costError);
    }

    // Fetch top users using the helper function
    const { data: topUsersData, error: usersError } = await supabaseAdmin
      .rpc('get_top_api_users', {
        start_date: startDateStr,
        end_date: new Date().toISOString(),
        limit_count: 10,
      });

    if (usersError) {
      console.error('Top users error:', usersError);
    }

    // Fetch daily trend using the helper function
    const { data: dailyTrendData, error: trendError } = await supabaseAdmin
      .rpc('get_daily_api_trend', {
        days_back: daysBack,
      });

    if (trendError) {
      console.error('Daily trend error:', trendError);
    }

    // Calculate totals from cost summary
    const costSummary = costSummaryData || [];
    const topUsers = topUsersData || [];
    const dailyTrend = dailyTrendData || [];

    const totalCost = costSummary.reduce(
      (sum: number, item: { total_cost_cents: number }) => sum + (item.total_cost_cents || 0),
      0
    );
    const totalCalls = costSummary.reduce(
      (sum: number, item: { total_calls: number }) => sum + (item.total_calls || 0),
      0
    );

    // Calculate total errors from daily trend
    const totalErrors = dailyTrend.reduce(
      (sum: number, day: { error_count: number }) => sum + (day.error_count || 0),
      0
    );

    // ========== SITE ENGAGEMENT ANALYTICS ==========

    // Get total bag views
    const { count: totalBagViews } = await supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'bag_viewed')
      .gte('created_at', startDateStr);

    // Get total link clicks
    const { count: totalLinkClicks } = await supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'link_clicked')
      .gte('created_at', startDateStr);

    // Get discovery page visits
    const { count: discoveryVisits } = await supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_viewed')
      .filter('event_data->>page', 'eq', 'discover')
      .gte('created_at', startDateStr);

    // Get unique visitors (by IP or user_id)
    const { data: uniqueVisitorData } = await supabaseAdmin
      .from('user_activity')
      .select('user_id, ip_address')
      .gte('created_at', startDateStr);

    const uniqueVisitors = new Set(
      uniqueVisitorData?.map(v => v.user_id || v.ip_address).filter(Boolean) || []
    ).size;

    // Get logged-in vs anonymous viewer breakdown
    const { count: loggedInViews } = await supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'bag_viewed')
      .not('user_id', 'is', null)
      .gte('created_at', startDateStr);

    const { count: anonymousViews } = await supabaseAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'bag_viewed')
      .is('user_id', null)
      .gte('created_at', startDateStr);

    // Get unique logged-in vs anonymous visitors
    const loggedInVisitors = new Set(
      uniqueVisitorData?.filter(v => v.user_id).map(v => v.user_id) || []
    ).size;
    const anonymousVisitors = new Set(
      uniqueVisitorData?.filter(v => !v.user_id && v.ip_address).map(v => v.ip_address) || []
    ).size;

    // Get daily engagement trend
    const { data: engagementTrend } = await supabaseAdmin
      .from('user_activity')
      .select('created_at, event_type')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    // Process daily engagement data
    const dailyEngagement: Record<string, { views: number; clicks: number; visitors: Set<string> }> = {};

    engagementTrend?.forEach((event: any) => {
      const date = event.created_at.split('T')[0];
      if (!dailyEngagement[date]) {
        dailyEngagement[date] = { views: 0, clicks: 0, visitors: new Set() };
      }
      if (event.event_type === 'bag_viewed') {
        dailyEngagement[date].views++;
      } else if (event.event_type === 'link_clicked') {
        dailyEngagement[date].clicks++;
      }
    });

    const engagementByDay = Object.entries(dailyEngagement).map(([date, data]) => ({
      date,
      views: data.views,
      clicks: data.clicks,
    }));

    // Get top viewed bags
    const { data: bagViewsRaw } = await supabaseAdmin
      .from('user_activity')
      .select('event_data')
      .eq('event_type', 'bag_viewed')
      .gte('created_at', startDateStr);

    const bagViewCounts: Record<string, { bag_id: string; code: string; count: number }> = {};
    bagViewsRaw?.forEach((v: any) => {
      const bagId = v.event_data?.bag_id;
      const code = v.event_data?.bag_code;
      if (bagId) {
        if (!bagViewCounts[bagId]) {
          bagViewCounts[bagId] = { bag_id: bagId, code: code || 'unknown', count: 0 };
        }
        bagViewCounts[bagId].count++;
      }
    });

    const topBags = Object.values(bagViewCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get referrer breakdown
    const { data: referrerData } = await supabaseAdmin
      .from('user_activity')
      .select('referrer')
      .eq('event_type', 'bag_viewed')
      .gte('created_at', startDateStr)
      .not('referrer', 'is', null);

    const referrerCounts: Record<string, number> = {};
    referrerData?.forEach((r: any) => {
      if (r.referrer) {
        try {
          const domain = new URL(r.referrer).hostname;
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts['direct'] = (referrerCounts['direct'] || 0) + 1;
        }
      }
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get platform stats
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalBags } = await supabaseAdmin
      .from('bags')
      .select('*', { count: 'exact', head: true });

    const { count: totalItems } = await supabaseAdmin
      .from('bag_items')
      .select('*', { count: 'exact', head: true });

    const { count: publicBags } = await supabaseAdmin
      .from('bags')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    return NextResponse.json({
      // AI Cost Analytics
      costSummary,
      topUsers,
      dailyTrend,
      totalCost,
      totalCalls,
      totalErrors,
      // Site Engagement Analytics
      engagement: {
        totalBagViews: totalBagViews || 0,
        totalLinkClicks: totalLinkClicks || 0,
        discoveryVisits: discoveryVisits || 0,
        uniqueVisitors,
        loggedInViews: loggedInViews || 0,
        anonymousViews: anonymousViews || 0,
        loggedInVisitors,
        anonymousVisitors,
        engagementByDay,
        topBags,
        topReferrers,
      },
      // Platform Stats
      platform: {
        totalUsers: totalUsers || 0,
        totalBags: totalBags || 0,
        totalItems: totalItems || 0,
        publicBags: publicBags || 0,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
