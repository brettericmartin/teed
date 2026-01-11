import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/beta/notifications/[id]
 *
 * Returns notifications for a specific application.
 * Query params:
 * - limit: number of notifications to return (default 20)
 * - unread: if true, only return unread notifications
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const unreadOnly = searchParams.get('unread') === 'true';

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('get_referral_notifications', {
      app_id: id,
      limit_count: limit,
      unread_only: unreadOnly,
    });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { notifications: [], unread_count: 0 },
        { status: 200 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('referral_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_application_id', id)
      .is('read_at', null);

    return NextResponse.json({
      notifications: data || [],
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beta/notifications/[id]
 *
 * Marks notifications as read.
 * Body: { notification_ids?: string[] } - if not provided, marks all as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const notificationIds = body.notification_ids || null;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc('mark_notifications_read', {
      app_id: id,
      notification_ids: notificationIds,
    });

    if (error) {
      console.error('Error marking notifications read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marked_count: data || 0,
    });
  } catch (error) {
    console.error('Error in mark read endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
