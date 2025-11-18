import { createServerSupabase } from '@/lib/serverSupabase';
import Navigation from '@/components/Navigation';
import DiscoverClient from './DiscoverClient';

export default async function DiscoverPage() {
  const supabase = await createServerSupabase();

  // Check if user is authenticated (optional for discover page)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // Fetch discover data (all public bags)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/discover`, {
    cache: 'no-store',
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
        isAuthenticated={!!user}
      />
      <DiscoverClient initialBags={bags} />
    </>
  );
}
