import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'priority';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Build query
  let query = supabase
    .from('beta_applications')
    .select(`
      id,
      email,
      name,
      status,
      priority_score,
      referral_tier,
      successful_referrals,
      approval_odds_percent,
      survey_responses,
      source,
      referred_by_code,
      referred_by_application_id,
      waitlist_position,
      admin_notes,
      reviewed_at,
      reviewed_by,
      auto_approved,
      auto_approval_reason,
      created_at,
      updated_at
    `);

  // Filter by status
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Search by name or email
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  // Sort
  switch (sort) {
    case 'priority':
      query = query.order('priority_score', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'referrals':
      query = query.order('successful_referrals', { ascending: false, nullsFirst: false });
      break;
    case 'odds':
      query = query.order('approval_odds_percent', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('priority_score', { ascending: false, nullsFirst: false });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('Error fetching beta applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }

  // Get status counts for tabs
  const { data: statusCounts } = await supabase
    .from('beta_applications')
    .select('status');

  const counts = {
    all: statusCounts?.length || 0,
    pending: statusCounts?.filter(a => a.status === 'pending').length || 0,
    approved: statusCounts?.filter(a => a.status === 'approved').length || 0,
    rejected: statusCounts?.filter(a => a.status === 'rejected').length || 0,
    waitlisted: statusCounts?.filter(a => a.status === 'waitlisted').length || 0,
  };

  // Get capacity info
  const { data: capacityData } = await supabase.rpc('get_beta_capacity');

  // Get referrer info for applications that were referred
  const referredAppIds = applications
    ?.filter(a => a.referred_by_application_id)
    .map(a => a.referred_by_application_id) || [];

  let referrerMap: Record<string, { name: string; email: string }> = {};
  if (referredAppIds.length > 0) {
    const { data: referrers } = await supabase
      .from('beta_applications')
      .select('id, name, email')
      .in('id', referredAppIds);

    if (referrers) {
      referrerMap = Object.fromEntries(
        referrers.map(r => [r.id, { name: r.name, email: r.email }])
      );
    }
  }

  // Enrich applications with referrer info
  const enrichedApplications = applications?.map(app => ({
    ...app,
    referrer: app.referred_by_application_id
      ? referrerMap[app.referred_by_application_id]
      : null,
  }));

  return NextResponse.json({
    applications: enrichedApplications,
    counts,
    capacity: capacityData,
    pagination: {
      limit,
      offset,
      total: counts.all,
    },
  });
}
