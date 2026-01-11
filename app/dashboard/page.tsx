import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
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
  // Preserve welcome param for celebration modal
  const welcomeParam = params.welcome === 'true' ? '?welcome=true' : '';
  redirect(`/u/${profile.handle}${welcomeParam}`);
}
