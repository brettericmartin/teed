import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/serverSupabase';
import Navigation from '@/components/Navigation';
import FeedClient from './FeedClient';

export default async function FeedPage() {
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  // Fetch feed data (bags from followed users)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/feed`, {
    cache: 'no-store',
    headers: {
      cookie: `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  let bags = [];
  if (response.ok) {
    const data = await response.json();
    bags = data.bags || [];
  }

  return (
    <>
      <Navigation
        userHandle={profile?.handle || ''}
        displayName={profile?.display_name || ''}
        isAuthenticated={true}
      />
      <FeedClient initialBags={bags} />
    </>
  );
}
