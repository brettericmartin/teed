import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  return (
    <DashboardClient
      initialBags={bags || []}
      userHandle={profile?.handle || ''}
      displayName={profile?.display_name || ''}
    />
  );
}
