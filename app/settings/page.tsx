import { createServerSupabase } from '@/lib/serverSupabase';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings - Teed.club',
  description: 'Manage your Teed profile settings',
};

export default async function SettingsPage() {
  const supabase = await createServerSupabase();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // If profile doesn't exist, redirect to dashboard
    // (this shouldn't happen if the trigger is working)
    redirect('/dashboard');
  }

  return <SettingsClient initialProfile={profile} userEmail={user.email || ''} />;
}
