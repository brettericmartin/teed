import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import BetaHubContent from './BetaHubContent';

export const metadata: Metadata = {
  title: 'Beta Hub - Teed',
  description: 'Your beta tester headquarters',
};

export default async function BetaHubPage() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/beta');
  }

  // Get user's profile with beta info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's beta points
  const { data: points } = await supabase
    .from('beta_points')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get leaderboard
  const { data: leaderboard } = await supabase
    .rpc('get_beta_leaderboard', { limit_count: 10 });

  // Get user's rank if not in top 10
  let userRank = null;
  if (points && leaderboard) {
    const inTop10 = leaderboard.find((l: { user_id: string }) => l.user_id === user.id);
    if (!inTop10) {
      // Calculate user's actual rank
      const { count } = await supabase
        .from('beta_points')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', points.total_points);
      userRank = (count || 0) + 1;
    }
  }

  return (
    <BetaHubContent
      profile={profile}
      points={points}
      leaderboard={leaderboard || []}
      userRank={userRank}
      userId={user.id}
    />
  );
}
