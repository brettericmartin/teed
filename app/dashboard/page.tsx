import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/serverSupabase';
import BetaGate from './BetaGate';
import OnboardingSurvey from './OnboardingSurvey';

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string; ref?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, beta_tier, beta_approved_at')
    .eq('id', user.id)
    .single();

  if (!profile?.handle) {
    redirect('/settings');
  }

  // If user has beta_tier set, they're approved — redirect to profile
  if (profile.beta_tier) {
    const welcomeParam = params.welcome === 'true' ? '?welcome=true' : '';
    redirect(`/u/${profile.handle}${welcomeParam}`);
  }

  // Check for beta application via user_id (service role needed to bypass RLS for server-side)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: application } = await serviceSupabase
    .from('beta_applications')
    .select('id, status, waitlist_position, priority_score, approval_odds_percent')
    .eq('user_id', user.id)
    .maybeSingle();

  // If application is approved but no beta_tier yet, fix it and redirect
  if (application?.status === 'approved') {
    await serviceSupabase
      .from('profiles')
      .update({ beta_tier: 'standard', beta_approved_at: new Date().toISOString() })
      .eq('id', user.id);
    const welcomeParam = params.welcome === 'true' ? '?welcome=true' : '';
    redirect(`/u/${profile.handle}${welcomeParam}`);
  }

  // If no application at all, show onboarding survey
  if (!application) {
    return (
      <Suspense>
        <OnboardingSurvey
          userName={user.user_metadata?.display_name || profile.handle}
          userEmail={user.email || ''}
        />
      </Suspense>
    );
  }

  // Render BetaGate for pending/waitlisted users
  return (
    <BetaGate
      userEmail={user.email || ''}
      userName={user.user_metadata?.display_name || profile.handle}
      application={{
        id: application.id,
        status: application.status,
        waitlist_position: application.waitlist_position,
        priority_score: application.priority_score,
        approval_odds_percent: application.approval_odds_percent,
      }}
    />
  );
}
