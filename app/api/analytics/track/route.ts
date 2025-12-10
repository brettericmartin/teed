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
    const { event_type, event_data } = body;

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
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || event_data?.referrer || null;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;

    // Insert the activity record
    const { error } = await supabase
      .from('user_activity')
      .insert({
        event_type,
        event_data: enrichedEventData,
        user_id: user?.id || null,
        user_agent: userAgent,
        referrer: referrer,
        ip_address: ipAddress,
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
