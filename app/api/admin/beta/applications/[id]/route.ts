import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET single application with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get application
  const { data: application, error } = await supabase
    .from('beta_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !application) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    );
  }

  // Get referral stats
  const { data: referralStats } = await supabase.rpc('get_referral_stats', {
    app_id: id,
  });

  // Get applications this one referred
  const { data: referredApplications } = await supabase
    .from('beta_applications')
    .select('id, name, email, status, created_at')
    .eq('referred_by_application_id', id)
    .order('created_at', { ascending: false });

  // Get referrer info if exists
  let referrer = null;
  if (application.referred_by_application_id) {
    const { data: referrerData } = await supabase
      .from('beta_applications')
      .select('id, name, email, status')
      .eq('id', application.referred_by_application_id)
      .single();
    referrer = referrerData;
  }

  return NextResponse.json({
    application,
    referralStats,
    referredApplications,
    referrer,
  });
}

// POST to approve/reject application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const { id } = await params;
  const body = await request.json();
  const { action, tier = 'standard', reason } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "approve" or "reject"' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get applicant name for email
  const { data: application } = await supabase
    .from('beta_applications')
    .select('name')
    .eq('id', id)
    .single();

  const applicantName = application?.name || 'there';

  if (action === 'approve') {
    // Call the approve function
    const { data, error } = await supabase.rpc('approve_beta_application', {
      application_id: id,
      approving_admin_id: admin.id,
      assigned_tier: tier,
    });

    if (error) {
      console.error('Error approving application:', error);
      return NextResponse.json(
        { error: 'Failed to approve application', details: error.message },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Approval failed' },
        { status: 400 }
      );
    }

    // Send approval email (don't block on email failure)
    sendApprovalEmail(data.applicant_email, {
      name: applicantName,
      inviteCode: data.invite_code,
      tier: data.tier,
    }).catch((err) => {
      console.error('Failed to send approval email:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved',
      invite_code: data.invite_code,
      tier: data.tier,
      applicant_email: data.applicant_email,
    });
  } else {
    // Call the reject function
    const { data, error } = await supabase.rpc('reject_beta_application', {
      application_id: id,
      rejecting_admin_id: admin.id,
      rejection_reason: reason || null,
    });

    if (error) {
      console.error('Error rejecting application:', error);
      return NextResponse.json(
        { error: 'Failed to reject application', details: error.message },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Rejection failed' },
        { status: 400 }
      );
    }

    // Send rejection email (don't block on email failure)
    sendRejectionEmail(data.applicant_email, {
      name: applicantName,
      reason,
    }).catch((err) => {
      console.error('Failed to send rejection email:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      applicant_email: data.applicant_email,
    });
  }
}

// PATCH to update admin notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const { id } = await params;
  const body = await request.json();
  const { admin_notes } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase
    .from('beta_applications')
    .update({
      admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating admin notes:', error);
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
