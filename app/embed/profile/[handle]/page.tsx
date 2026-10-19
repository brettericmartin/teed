import { notFound } from 'next/navigation';
import { getSupabasePublic } from '@/lib/supabasePublic';
import EmbedProfileView from '@/components/embed/EmbedProfileView';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function EmbedProfilePage({ params }: PageProps) {
  const { handle } = await params;

  // Fetch profile
  const { data: profile } = await getSupabasePublic()
    .from('profiles')
    .select('id, handle, display_name, avatar_url, bio')
    .eq('handle', handle)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch public bags with item counts
  const { data: bags } = await getSupabasePublic()
    .from('bags')
    .select(`
      code,
      title,
      items:bag_items!bag_items_bag_id_fkey(id)
    `)
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(5);

  const bagsWithCounts = (bags || []).map((bag: any) => ({
    code: bag.code,
    title: bag.title,
    itemCount: bag.items?.length || 0,
  }));

  const profileUrl = `https://teed.club/u/${handle}`;

  return (
    <EmbedProfileView
      handle={profile.handle}
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
      bio={profile.bio}
      bagCount={bagsWithCounts.length}
      bags={bagsWithCounts}
      profileUrl={profileUrl}
    />
  );
}
