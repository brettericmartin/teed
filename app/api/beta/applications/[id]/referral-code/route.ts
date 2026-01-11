import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/beta/applications/[id]/referral-code
 * Get the current custom referral code for an application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: app, error } = await supabase
    .from('beta_applications')
    .select('id, custom_referral_code')
    .eq('id', id)
    .single();

  if (error || !app) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teed.club';
  const referralCode = app.custom_referral_code || id;
  const referralLink = `${baseUrl}/apply?ref=${referralCode}`;

  return NextResponse.json({
    application_id: id,
    custom_code: app.custom_referral_code,
    referral_link: referralLink,
    is_custom: !!app.custom_referral_code,
  });
}

/**
 * POST /api/beta/applications/[id]/referral-code
 * Claim a custom referral code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: 'Code is required' },
      { status: 400 }
    );
  }

  // Call the claim function
  const { data, error } = await supabase.rpc('claim_custom_referral_code', {
    app_id: id,
    code: code,
  });

  if (error) {
    console.error('Error claiming code:', error);
    return NextResponse.json(
      { error: 'Failed to claim code', details: error.message },
      { status: 500 }
    );
  }

  if (!data?.success) {
    return NextResponse.json(
      { error: data?.error || 'Failed to claim code' },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teed.club';

  return NextResponse.json({
    success: true,
    code: data.code,
    referral_link: `${baseUrl}/apply?ref=${data.code}`,
  });
}

/**
 * Check if a code is available (without claiming)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: 'Code is required' },
      { status: 400 }
    );
  }

  // Call the check function
  const { data, error } = await supabase.rpc('check_custom_code_available', {
    code: code,
  });

  if (error) {
    console.error('Error checking code:', error);
    return NextResponse.json(
      { error: 'Failed to check code' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    available: data?.available || false,
    error: data?.error || null,
    normalized_code: data?.normalized_code || null,
  });
}
