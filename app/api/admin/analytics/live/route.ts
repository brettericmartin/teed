import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: admin } = await supabase.from('admins').select('role').eq('user_id', user.id).single();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Last 50 user activity events with user info
    const { data: events, error: eventsError } = await supabase
      .from('user_activity')
      .select(`
        event_type,
        event_data,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error('Error fetching live activity:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch live activity' }, { status: 500 });
    }

    // Fetch profiles for users in the events
    const userIds = [...new Set((events || []).map(e => e.user_id).filter(Boolean))];
    let profileMap: Record<string, { handle: string; display_name: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, handle, display_name')
        .in('id', userIds);
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map(p => [p.id, { handle: p.handle, display_name: p.display_name }]));
      }
    }

    const formattedEvents = (events || []).map(event => ({
      event_type: event.event_type,
      event_data: event.event_data,
      created_at: event.created_at,
      user_handle: event.user_id ? profileMap[event.user_id]?.handle || null : null,
      user_name: event.user_id ? profileMap[event.user_id]?.display_name || null : null,
    }));

    return NextResponse.json({
      events: formattedEvents,
    });
  } catch (error) {
    console.error('Live activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
