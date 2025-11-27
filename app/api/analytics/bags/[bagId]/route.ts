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
      .select('session_id, device_type, created_at')
      .eq('event_type', 'bag_viewed')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (viewError) {
      console.error('[Analytics] View query error:', viewError);
    }

    // Query link_clicked events
    const { data: clickEvents, error: clickError } = await supabaseAdmin
      .from('user_activity')
      .select('created_at')
      .eq('event_type', 'link_clicked')
      .gte('created_at', startDateStr)
      .contains('event_data', { bag_id: bagId });

    if (clickError) {
      console.error('[Analytics] Click query error:', clickError);
    }

    // Calculate metrics
    const views = viewEvents || [];
    const clicks = clickEvents || [];

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
        averageViewsPerDay,
      },
      breakdown: {
        dailyViews,
        devices,
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
