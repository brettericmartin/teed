import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import SearchQueriesClient from './SearchQueriesClient';

export const dynamic = 'force-dynamic';

export default async function SearchQueriesPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/content-ideas/queries');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .single();

  if (!profile?.admin_role) {
    redirect('/dashboard');
  }

  return (
    <SearchQueriesClient
      adminRole={profile.admin_role}
      adminId={user.id}
    />
  );
}
