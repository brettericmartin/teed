import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://teed.so';

// Static supabase client for sitemap generation (no auth needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Static pages that should be indexed
const staticPages = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/discover', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/manifesto', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/join', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/updates', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' as const },
];

// Use case landing pages
const useCasePages = [
  'golfers',
  'photographers',
  'creators',
  'travelers',
  'outdoors',
  'tech',
  'musicians',
  'fitness',
];

// Comparison pages
const comparisonPages = [
  'linktree',
  'amazon-lists',
  'notion',
  'spreadsheets',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Start with static pages
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Add use case landing pages
  const useCaseEntries: MetadataRoute.Sitemap = useCasePages.map((useCase) => ({
    url: `${BASE_URL}/for/${useCase}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Add comparison pages
  const comparisonEntries: MetadataRoute.Sitemap = comparisonPages.map((competitor) => ({
    url: `${BASE_URL}/vs/${competitor}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Add authority pages
  const authorityEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/alternatives`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Fetch public profiles with handles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('handle, last_active_at')
    .not('handle', 'is', null)
    .order('last_active_at', { ascending: false, nullsFirst: false })
    .limit(1000);

  const profileEntries: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${BASE_URL}/u/${profile.handle}`,
    lastModified: profile.last_active_at ? new Date(profile.last_active_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Fetch public bags
  const { data: bags } = await supabase
    .from('bags')
    .select(`
      code,
      updated_at,
      owner_id,
      profiles!inner(handle)
    `)
    .eq('is_public', true)
    .eq('is_hidden', false)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(5000);

  const bagEntries: MetadataRoute.Sitemap = (bags || []).map((bag) => {
    const profile = bag.profiles as unknown as { handle: string };
    return {
      url: `${BASE_URL}/u/${profile.handle}/${bag.code}`,
      lastModified: bag.updated_at ? new Date(bag.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    };
  });

  return [
    ...staticEntries,
    ...useCaseEntries,
    ...comparisonEntries,
    ...authorityEntries,
    ...profileEntries,
    ...bagEntries,
  ];
}
