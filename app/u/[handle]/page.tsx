import { notFound } from 'next/navigation';
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

  // Check if current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser();

  // Find the profile by handle
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, banner_url, bio, social_links, created_at')
    .eq('handle', handle)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Check if this is the user's own profile
  const isOwnProfile = user?.id === profile.id;

  // Fetch user's public bags (or all bags if viewing own profile)
  const bagsQuery = supabase
    .from('bags')
    .select('id, code, title, description, background_image, is_public, created_at, updated_at')
    .eq('owner_id', profile.id)
    .order('updated_at', { ascending: false });

  // Only show public bags to other users
  if (!isOwnProfile) {
    bagsQuery.eq('is_public', true);
  }

  const { data: bags, error: bagsError } = await bagsQuery;

  if (bagsError) {
    console.error('Error fetching user bags:', bagsError);
    notFound();
  }

  return (
    <UserProfileClient
      profile={profile}
      bags={bags || []}
      isOwnProfile={isOwnProfile}
    />
  );
}
