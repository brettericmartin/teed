import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's handle for redirect
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();

  if (!profile?.handle) {
    // If no handle, redirect to settings to set one up
    redirect('/settings');
  }

  // Redirect to unified profile view
  // The /u/[handle] page serves as both dashboard (for owner) and public profile
  redirect(`/u/${profile.handle}`);
}
