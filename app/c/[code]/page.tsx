import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Public Supabase client (no auth required for public bags)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ code: string }>;
}

type BagWithOwner = {
  code: string;
  is_public: boolean;
  owner: {
    handle: string;
  } | null;
};

// Legacy route - redirects to new username-scoped URL
export default async function LegacyPublicBagPage({ params }: PageProps) {
  const { code } = await params;

  // Fetch the bag to get owner's handle
  const { data: bag, error } = await supabase
    .from('bags')
    .select(`
      code,
      is_public,
      owner:profiles!owner_id (
        handle
      )
    `)
    .eq('code', code)
    .eq('is_public', true)
    .single() as { data: BagWithOwner | null; error: any };

  // If bag doesn't exist or is private, show 404
  if (error || !bag || !bag.owner?.handle) {
    notFound();
  }

  // Redirect to new username-scoped URL
  redirect(`/u/${bag.owner.handle}/${code}`);
}
