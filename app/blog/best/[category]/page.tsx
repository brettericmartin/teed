import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getRoundupCategory, getAllRoundupSlugs } from '@/lib/blog/categories';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';

const BASE_URL = 'https://teed.so';

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateStaticParams() {
  return getAllRoundupSlugs().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getRoundupCategory(slug);
  if (!cat) return { title: 'Not Found' };

  const url = `${BASE_URL}/blog/best/${cat.slug}`;
  const title = `Best ${cat.name} Collections — Teed`;

  return {
    title,
    description: cat.description,
    keywords: cat.keywords,
    openGraph: {
      title,
      description: cat.description,
      url,
      siteName: 'Teed.club',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cat.description,
    },
    alternates: { canonical: url },
  };
}

export default async function RoundupPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = getRoundupCategory(slug);
  if (!cat) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch public bags in this category
  const { data: bags } = await supabase
    .from('bags')
    .select(
      `
      id, code, title, description, updated_at,
      profiles!inner(handle, display_name, avatar_url),
      items(id, name, brand, photo_url)
    `
    )
    .eq('is_public', true)
    .eq('is_hidden', false)
    .eq('category', cat.supabaseCategory)
    .order('updated_at', { ascending: false })
    .limit(20);

  const sortedBags = (bags || [])
    .map((bag) => ({
      ...bag,
      items: bag.items || [],
      profile: bag.profiles as unknown as {
        handle: string;
        display_name: string | null;
        avatar_url: string | null;
      },
    }))
    .sort((a, b) => b.items.length - a.items.length);

  const url = `${BASE_URL}/blog/best/${cat.slug}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${cat.name} Collections`,
    description: cat.description,
    url,
    numberOfItems: sortedBags.length,
    itemListElement: sortedBags.map((bag, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: bag.title,
      url: `${BASE_URL}/u/${bag.profile.handle}/${bag.code}`,
    })),
  };

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: `Best ${cat.name}`, url },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([itemListSchema, breadcrumbSchema]),
        }}
      />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-6">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--text-primary)] transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-[var(--text-secondary)]">Best {cat.name}</span>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Best {cat.name} Collections
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">{cat.intro}</p>
          </div>

          {/* Bag list */}
          {sortedBags.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-[var(--text-tertiary)]">
                No public {cat.name.toLowerCase()} collections yet. Be the first to share yours!
              </p>
              <Link
                href="/join"
                className="inline-block mt-4 px-5 py-2.5 text-sm font-medium text-white bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedBags.map((bag, index) => {
                const previewItems = (bag.items as Array<{
                  id: string;
                  name: string;
                  brand: string | null;
                  photo_url: string | null;
                }>).slice(0, 5);

                return (
                  <Link
                    key={bag.id}
                    href={`/u/${bag.profile.handle}/${bag.code}`}
                    className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-default)] hover:shadow-[var(--shadow-2)] transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Photo preview strip */}
                      {previewItems.length > 0 && (
                        <div className="flex sm:w-60 shrink-0 h-24 sm:h-auto">
                          {previewItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex-1 bg-[var(--surface-hover)] overflow-hidden"
                            >
                              {item.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.photo_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                                  {item.brand?.[0] || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-[var(--teed-green-11)]">
                                #{index + 1}
                              </span>
                              <h2 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors truncate">
                                {bag.title}
                              </h2>
                            </div>
                            {bag.description && (
                              <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mb-1">
                                {bag.description}
                              </p>
                            )}
                            <p className="text-xs text-[var(--text-tertiary)]">
                              by @{bag.profile.handle} ·{' '}
                              {bag.items.length} item{bag.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              Have a {cat.name.toLowerCase()} collection to share?
            </p>
            <Link
              href="/join"
              className="inline-block px-5 py-2.5 text-sm font-medium text-white bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] rounded-lg transition-colors"
            >
              Create Your Bag
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
