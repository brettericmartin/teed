import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

// POST to batch approve top N applications
export async function POST(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const body = await request.json();
  const { count, tier = 'standard' } = body;

  if (!count || count < 1 || count > 100) {
    return NextResponse.json(
      { error: 'Count must be between 1 and 100' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Call the batch approve function
  const { data, error } = await supabase.rpc('batch_approve_applications', {
    count_to_approve: count,
    approving_admin_id: admin.id,
    assigned_tier: tier,
  });

  if (error) {
    console.error('Error batch approving applications:', error);
    return NextResponse.json(
      { error: 'Failed to batch approve', details: error.message },
      { status: 500 }
    );
  }

  if (!data?.success) {
    return NextResponse.json(
      { error: data?.error || 'Batch approval failed', capacity: data?.capacity },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Approved ${data.approved_count} applications`,
    requested: data.requested,
    approved_count: data.approved_count,
    available_slots: data.available_slots,
    results: data.results,
  });
}

// GET preview of top N applications that would be approved
export async function GET(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '10');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get top N pending applications by priority
  const { data: applications, error } = await supabase
    .from('beta_applications')
    .select('id, name, email, priority_score, referral_tier, successful_referrals, approval_odds_percent')
    .eq('status', 'pending')
    .order('priority_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(count);

  if (error) {
    console.error('Error fetching preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }

  // Get capacity
  const { data: capacity } = await supabase.rpc('get_beta_capacity');

  return NextResponse.json({
    applications,
    capacity,
    will_approve: Math.min(count, capacity?.available || 0, applications?.length || 0),
  });
}
