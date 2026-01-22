import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getCreatorStats } from '@/lib/stats/creatorStats';
import { getUserBadges, checkImpactBadges } from '@/lib/badges';
import StatsPageClient from './StatsPageClient';

type PageProps = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ days?: string }>;
};

export default async function CreatorStatsPage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const { days: daysParam } = await searchParams;
  const days = parseInt(daysParam || '30');

  const supabase = await createServerSupabase();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user profile by handle
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    redirect('/dashboard');
  }

  // Verify this is the authenticated user's profile
  if (profile.id !== user.id) {
    redirect(`/u/${handle}`);
  }

  // Fetch stats server-side
  const stats = await getCreatorStats(supabase, user.id, days);

  // Fetch user's earned badges
  const badges = await getUserBadges(user.id);

  // Check and award any impact badges based on current stats (non-blocking)
  if (stats) {
    checkImpactBadges(user.id, {
      peopleReached: stats.impact.peopleReached,
      countriesReached: stats.geography.countriesReached,
      saves: stats.impact.curationsBookmarked,
      clones: stats.impact.curationsInspired,
    }).catch((err) => {
      console.error('[Badges] Error checking impact badges:', err);
    });
  }

  return (
    <StatsPageClient
      profile={profile}
      stats={stats}
      selectedDays={days}
      badges={badges}
    />
  );
}
