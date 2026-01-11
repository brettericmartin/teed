import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import CreatorStatsClient from './CreatorStatsClient';

type PageProps = {
  params: Promise<{ handle: string }>;
};

export default async function CreatorStatsPage({ params }: PageProps) {
  const { handle } = await params;
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
    // Can't view other people's stats
    redirect(`/u/${handle}`);
  }

  return <CreatorStatsClient profile={profile} />;
}
