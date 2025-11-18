import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  // Check if user is admin
  if (!(await isAdmin())) {
    redirect('/dashboard');
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user!.id)
    .single();

  return (
    <>
      <Navigation
        userHandle={profile?.handle || ''}
        displayName={profile?.display_name || ''}
        isAuthenticated={true}
      />
      <AdminDashboardClient />
    </>
  );
}
