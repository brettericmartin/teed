import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
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
    .select('handle, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (!profile?.handle || /^user_[a-f0-9]{8}$/.test(profile.handle)) {
    redirect('/complete-profile');
  }

  // Check if user has any bags
  const { count: bagCount } = await supabase
    .from('bags')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  // If user has bags or completed onboarding, go straight to profile
  if ((bagCount && bagCount > 0) || profile.onboarding_completed_at) {
    const welcomeParam = params.welcome === 'true' ? '?welcome=true' : '';
    redirect(`/u/${profile.handle}${welcomeParam}`);
  }

  // Show onboarding survey for new users without bags
  return (
    <Suspense>
      <OnboardingSurvey
        userName={user.user_metadata?.display_name || profile.handle}
        userEmail={user.email || ''}
        userHandle={profile.handle}
      />
    </Suspense>
  );
}
