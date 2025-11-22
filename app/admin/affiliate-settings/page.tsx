import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import AffiliateSettingsClient from './AffiliateSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AffiliateSettingsPage() {
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
      <AffiliateSettingsClient />
    </>
  );
}
