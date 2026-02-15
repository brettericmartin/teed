import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/serverSupabase';
import { calculateScorecardResult, serializeScorecardForDB } from '@/lib/scorecard';
import type { SurveyResponses } from '@/lib/types/beta';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let body: {
    // Required for unauthenticated flow only
    email?: string;
    password?: string;
    name?: string;
    handle?: string;
    // Always required
    surveyResponses: SurveyResponses;
    referralCode?: string;
    primaryNiche: string;
    primaryNicheOther?: string;
    audienceSize: string;
    primaryPlatform: string;
    affiliateStatus: string;
    biggestFrustrations: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { surveyResponses, referralCode } = body;

  // Detect authenticated user
  let authenticatedUser: { id: string; email: string; name: string } | null = null;
  try {
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      authenticatedUser = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.display_name || '',
      };
    }
  } catch {
    // Not authenticated — continue with full flow
  }

  let userId: string;
  let email: string;
  let name: string;

  if (authenticatedUser) {
    // =============================================
    // Authenticated flow: survey only, no account creation
    // =============================================
    userId = authenticatedUser.id;
    email = authenticatedUser.email;
    name = authenticatedUser.name;

    if (!surveyResponses) {
      return NextResponse.json({ error: 'Missing survey responses' }, { status: 400 });
    }

    // Check duplicate application by user_id
    const { data: existingApp } = await supabase
      .from('beta_applications')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        { error: 'You have already completed the survey.' },
        { status: 409 }
      );
    }
  } else {
    // =============================================
    // Unauthenticated flow: full account creation + survey
    // =============================================
    const { email: bodyEmail, password, name: bodyName, handle } = body;

    // 1. Validate input
    if (!bodyEmail || !password || !bodyName || !handle || !surveyResponses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      return NextResponse.json({ error: 'Invalid handle format' }, { status: 400 });
    }

    email = bodyEmail;
    name = bodyName;

    // 2. Check email not already in beta_applications
    const { data: existingApp } = await supabase
      .from('beta_applications')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        { error: 'This email has already applied. Check your inbox for updates!' },
        { status: 409 }
      );
    }

    // 3. Check handle availability
    const { data: existingHandle } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .maybeSingle();

    if (existingHandle) {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
    }

    // 4. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        handle: handle.toLowerCase(),
        display_name: name,
      },
    });

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Try signing in instead.' },
          { status: 409 }
        );
      }
      console.error('Auth user creation error:', authError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    userId = authData.user.id;
  }

  // =============================================
  // Shared: scorecard, application insert, auto-approve
  // =============================================

  // Resolve referral code
  const refValue = referralCode || null;
  const isUUID = refValue && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refValue);
  const isInviteCode = refValue && /^TEED-[A-Z0-9]+$/i.test(refValue);

  let referrerAppId: string | null = isUUID ? refValue : null;

  if (refValue && !isUUID && !isInviteCode) {
    const { data: lookupData } = await supabase.rpc('lookup_referrer', {
      ref_value: refValue,
    });
    if (lookupData) {
      referrerAppId = lookupData;
    }
  }

  // Calculate scorecard
  const scorecardResult = calculateScorecardResult(surveyResponses);
  const scorecardData = serializeScorecardForDB(scorecardResult);

  // Insert beta_applications
  const useCase = body.primaryNiche === 'other' ? (body.primaryNicheOther || body.primaryNiche) : body.primaryNiche;

  const { data: appData, error: insertError } = await supabase
    .from('beta_applications')
    .insert({
      email: email.toLowerCase(),
      name,
      full_name: name,
      user_id: userId,
      primary_use_case: useCase,
      use_case: useCase,
      follower_range: body.audienceSize,
      social_platform: body.primaryPlatform,
      monetization_interest: body.affiliateStatus === 'actively' || body.affiliateStatus === 'sometimes',
      biggest_challenge: body.biggestFrustrations?.[0] || null,
      survey_responses: surveyResponses,
      referred_by_code: isInviteCode ? refValue : null,
      referred_by_application_id: referrerAppId,
      source: refValue ? 'referral' : 'organic',
      ...scorecardData,
    })
    .select('waitlist_position, id')
    .single();

  if (insertError) {
    // Only rollback auth user if we created one (unauthenticated flow)
    if (!authenticatedUser) {
      console.error('Application insert error:', insertError);
      await supabase.auth.admin.deleteUser(userId);
    }
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }

  // Try auto-approve
  let autoApproved = false;
  try {
    const { data: approveResult } = await supabase.rpc('try_auto_approve_application', {
      application_id: appData.id,
    });
    if (approveResult?.success || approveResult?.auto_approved) {
      autoApproved = true;
    }
  } catch (err) {
    console.error('Auto-approve check error (non-fatal):', err);
  }

  // Belt-and-suspenders: if auto-approved, ensure profile beta_tier is set
  if (autoApproved) {
    await supabase
      .from('profiles')
      .update({ beta_tier: 'standard', beta_approved_at: new Date().toISOString() })
      .eq('id', userId)
      .is('beta_tier', null);
  }

  return NextResponse.json({
    applicationId: appData.id,
    waitlistPosition: appData.waitlist_position,
    autoApproved,
  });
}
