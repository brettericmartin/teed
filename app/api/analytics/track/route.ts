import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/track
 * Track user activity events (page views, clicks, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, event_data, session_id: clientSessionId } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    // Use service role for inserting analytics (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to get authenticated user (optional)
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();

    // For bag_viewed events, look up the owner_id from the bag
    let enrichedEventData = { ...event_data };
    if (event_type === 'bag_viewed' && event_data?.bag_id) {
      const { data: bag } = await supabase
        .from('bags')
        .select('owner_id')
        .eq('id', event_data.bag_id)
        .single();

      if (bag?.owner_id) {
        enrichedEventData.owner_id = bag.owner_id;
      }
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || event_data?.referrer || null;
    const pageUrl = event_data?.page_url || null;

    // Extract country code from Vercel geo headers (privacy-friendly, country-level only)
    const countryCode = request.headers.get('x-vercel-ip-country') || null;

    // Extract referrer domain for traffic source analysis
    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        // Invalid URL, leave as null
      }
    }

    // Add country and referrer domain to event data for stats aggregation
    if (countryCode) {
      enrichedEventData.country_code = countryCode;
    }
    if (referrerDomain) {
      enrichedEventData.referrer_domain = referrerDomain;
    }

    // Parse user agent for device info
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Extract browser name
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Extract OS
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Use client-provided session ID or generate a fallback
    const sessionId = clientSessionId || Math.random().toString(36).substring(2, 8);

    // Insert the activity record
    const { error } = await supabase
      .from('user_activity')
      .insert({
        event_type,
        event_data: enrichedEventData,
        user_id: user?.id || null,
        session_id: sessionId,
        page_url: pageUrl,
        referrer: referrer,
        device_type: deviceType,
        browser: browser,
        os: os,
      });

    if (error) {
      console.error('Error tracking activity:', error);
      // Don't expose internal errors to client
      return NextResponse.json({ success: false }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    // Silently fail for analytics - don't break the user experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
