import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import UserProfileClient from './UserProfileClient';
import { createServerSupabase } from '@/lib/serverSupabase';

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function UserProfilePage({ params }: PageProps) {
  const { handle } = await params;

  // Query database directly instead of HTTP fetch
  const supabase = await createServerSupabase();

  // Find the user by handle
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, banner_url, bio, social_links, created_at')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch user's public bags
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select('id, code, title, description, background_image, is_public, created_at, updated_at')
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (bagsError) {
    console.error('Error fetching user bags:', bagsError);
    notFound();
  }

  return (
    <>
      <Navigation isAuthenticated={false} />
      <UserProfileClient profile={profile} bags={bags || []} />
    </>
  );
}
