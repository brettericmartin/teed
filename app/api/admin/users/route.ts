import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const role = searchParams.get('role');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // First, get all profiles
  let query = supabase
    .from('profiles')
    .select(`
      id,
      handle,
      display_name,
      admin_role,
      beta_tier,
      is_verified,
      created_at,
      last_active_at,
      total_bags,
      total_views
    `)
    .order('created_at', { ascending: false });

  // Filter by role
  if (role && role !== 'all') {
    if (role === 'user') {
      query = query.is('admin_role', null);
    } else {
      query = query.eq('admin_role', role);
    }
  }

  // Search by handle or display name
  if (search) {
    query = query.or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`);
  }

  const { data: profiles, error: profilesError } = await query.limit(100);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }

  // Get emails from auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    // Continue without emails if auth fetch fails
  }

  // Map emails to profiles
  const emailMap = new Map<string, string>();
  if (authUsers?.users) {
    for (const user of authUsers.users) {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    }
  }

  // Get actual bag counts per user
  const userIds = profiles?.map(p => p.id) || [];
  const bagCountMap = new Map<string, number>();
  const viewCountMap = new Map<string, number>();

  if (userIds.length > 0) {
    // Get bag counts
    const { data: bagCounts } = await supabase
      .from('bags')
      .select('owner_id')
      .in('owner_id', userIds);

    if (bagCounts) {
      for (const bag of bagCounts) {
        bagCountMap.set(bag.owner_id, (bagCountMap.get(bag.owner_id) || 0) + 1);
      }
    }

    // Get view counts from user_activity
    const { data: viewCounts } = await supabase
      .from('user_activity')
      .select('event_data')
      .eq('event_type', 'bag_viewed');

    if (viewCounts) {
      for (const view of viewCounts) {
        const ownerId = view.event_data?.owner_id;
        if (ownerId && userIds.includes(ownerId)) {
          viewCountMap.set(ownerId, (viewCountMap.get(ownerId) || 0) + 1);
        }
      }
    }
  }

  const users = profiles?.map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) || 'Unknown',
    total_bags: bagCountMap.get(profile.id) || 0,
    total_views: viewCountMap.get(profile.id) || 0,
  })) || [];

  // Calculate role stats from ALL profiles (not just filtered)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('admin_role');

  const stats = {
    totalUsers: allProfiles?.length || 0,
    superAdmins: allProfiles?.filter(p => p.admin_role === 'super_admin').length || 0,
    admins: allProfiles?.filter(p => p.admin_role === 'admin').length || 0,
    moderators: allProfiles?.filter(p => p.admin_role === 'moderator').length || 0,
  };

  return NextResponse.json({ users, stats });
}
