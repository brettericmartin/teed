import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import Navigation from '@/components/Navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  // Fetch user's bags
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (bagsError) {
    console.error('Error fetching bags:', bagsError);
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  // If no profile exists, we have a problem - user signed up but profile wasn't created
  if (!profile) {
    console.error('No profile found for user:', user.id, user.email);
  }

  return (
    <>
      <Navigation
        userHandle={profile?.handle || ''}
        displayName={profile?.display_name || ''}
        isAuthenticated={true}
      />
      <DashboardClient
        initialBags={bags || []}
        userHandle={profile?.handle || ''}
        displayName={profile?.display_name || ''}
      />
    </>
  );
}
