import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client for cross-user analytics queries
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface RouteContext {
  params: Promise<{ bagId: string }>;
}

/**
 * GET /api/analytics/bags/[bagId]
 * Get analytics for a specific bag
 *
 * Query params:
 * - days: number of days to look back (default: 30)
 *
 * Returns aggregate analytics for the bag owner
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { bagId } = await context.params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Verify authentication
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, title, owner_id')
      .eq('id', bagId)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client to query analytics across all users
    const supabaseAdmin = getSupabaseAdmin();

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Query bag_viewed events
    const { data: viewEvents, error: viewError } = await supabaseAdmin
      .from('user_activity')
      .select('session_id, device_type, created_at, event_data')
      .eq('event_type', 'bag_viewed')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (viewError) {
      console.error('[Analytics] View query error:', viewError);
    }

    // Query link_clicked events (with event_data for per-item breakdown)
    const { data: clickEvents, error: clickError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at, event_data')
      .eq('event_type', 'link_clicked')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (clickError) {
      console.error('[Analytics] Click query error:', clickError);
    }

    // Query bag_saved events
    const { data: saveEvents, error: saveError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('event_type', 'bag_saved')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (saveError) {
      console.error('[Analytics] Save query error:', saveError);
    }

    // Query bag_cloned events
    const { data: cloneEvents, error: cloneError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('event_type', 'bag_cloned')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (cloneError) {
      console.error('[Analytics] Clone query error:', cloneError);
    }

    // Query bag_shared events
    const { data: shareEvents, error: shareError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('event_type', 'bag_shared')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (shareError) {
      console.error('[Analytics] Share query error:', shareError);
    }

    // Calculate metrics
    const views = viewEvents || [];
    const clicks = clickEvents || [];
    const saves = saveEvents || [];
    const clones = cloneEvents || [];
    const shares = shareEvents || [];

    const totalViews = views.length;
    const uniqueVisitors = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
    const linkClicks = clicks.length;
    const averageViewsPerDay = days > 0 ? Math.round((totalViews / days) * 10) / 10 : 0;

    // Calculate daily views breakdown
    const dailyViews: Record<string, number> = {};
    views.forEach((v) => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      dailyViews[date] = (dailyViews[date] || 0) + 1;
    });

    // Calculate device breakdown
    const devices: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    views.forEach((v) => {
      const device = v.device_type || 'desktop';
      if (device in devices) {
        devices[device]++;
      } else {
        devices['desktop']++;
      }
    });

    // Calculate engagement rate
    const engagementRate = totalViews > 0 ? Math.round((linkClicks / totalViews) * 1000) / 10 : 0;

    // Calculate referrer domain breakdown
    const referrerCounts: Record<string, number> = {};
    views.forEach((v: any) => {
      const referrer = v.event_data?.referrer || v.event_data?.referrer_domain;
      if (referrer && typeof referrer === 'string') {
        try {
          const domain = referrer.startsWith('http')
            ? new URL(referrer).hostname.replace(/^www\./, '')
            : referrer.replace(/^www\./, '');
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
        }
      }
    });
    const topReferrers = Object.entries(referrerCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Per-item click breakdown
    const itemClickCounts: Record<string, { name: string; clicks: number }> = {};
    clicks.forEach((c: any) => {
      const itemId = c.event_data?.item_id || c.event_data?.itemId;
      const itemName = c.event_data?.item_name || c.event_data?.itemName || 'Unknown';
      if (itemId) {
        if (!itemClickCounts[itemId]) {
          itemClickCounts[itemId] = { name: itemName, clicks: 0 };
        }
        itemClickCounts[itemId].clicks++;
      }
    });
    const topClickedItems = Object.entries(itemClickCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const analyticsData = {
      bagId,
      bagTitle: bag.title,
      period: {
        days,
        startDate: startDateStr,
      },
      metrics: {
        totalViews,
        uniqueVisitors,
        linkClicks,
        saves: saves.length,
        clones: clones.length,
        shares: shares.length,
        averageViewsPerDay,
        engagementRate,
      },
      breakdown: {
        dailyViews,
        devices,
        topReferrers,
        topClickedItems,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
