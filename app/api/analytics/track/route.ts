import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/analytics/track
 * Track analytics events (views, clicks, etc.)
 * Works for both authenticated and anonymous users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();
    const { event_type, event_data } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Allowed event types for public tracking
    const allowedEvents = ['bag_viewed', 'link_clicked', 'profile_viewed'];
    if (!allowedEvents.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Check if tracking is allowed (respect DNT header)
    const dnt = request.headers.get('DNT') || request.headers.get('dnt');
    if (dnt === '1') {
      return NextResponse.json({ success: true, tracked: false });
    }

    // Get optional user (can be anonymous)
    const { data: { user } } = await supabase.auth.getUser();

    // Parse device info
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = parseDeviceType(userAgent);

    // Generate session ID for anonymous tracking
    const ip = getClientIp(request);
    const sessionId = generateSessionId(ip, userAgent);

    // Insert event
    const { error: insertError } = await supabase
      .from('user_activity')
      .insert({
        user_id: user?.id || null,
        event_type,
        event_data: event_data || {},
        session_id: sessionId,
        device_type: deviceType,
        page_url: request.headers.get('referer'),
        referrer: event_data?.referrer,
      });

    if (insertError) {
      console.error('[Analytics Track] Insert error:', insertError);
      // Don't fail the request for tracking errors
    }

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    console.error('[Analytics Track] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getClientIp(request: NextRequest): string | null {
  const headers = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) return value.split(',')[0].trim();
  }
  return null;
}

function parseDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/i.test(ua) && !/ipad|tablet/i.test(ua)) return 'mobile';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

function generateSessionId(ip: string | null, userAgent: string): string {
  const input = `${ip || 'anon'}-${userAgent}-${new Date().toISOString().split('T')[0]}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
