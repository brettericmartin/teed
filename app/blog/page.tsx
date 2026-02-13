import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTracker } from '@/components/analytics/PageTracker';
import { getAllPosts, getAllCategories } from '@/lib/blog';
import { CATEGORY_LABELS } from '@/lib/blog/types';
import PostCard from '@/components/blog/PostCard';

const BASE_URL = 'https://teed.so';

export const metadata: Metadata = {
  title: 'Blog — Teed.club',
  description:
    'Guides, showcases, and build logs from Teed. Learn how to organize and share your gear, discover curated collections, and explore our product philosophy.',
  keywords: [
    'gear blog',
    'product curation',
    'gear guides',
    'collection sharing',
    'teed blog',
  ],
  openGraph: {
    title: 'Blog — Teed.club',
    description:
      'Guides, showcases, and build logs from Teed.',
    url: `${BASE_URL}/blog`,
    siteName: 'Teed.club',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — Teed.club',
    description:
      'Guides, showcases, and build logs from Teed.',
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
    types: {
      'application/rss+xml': `${BASE_URL}/blog/rss.xml`,
    },
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const categories = getAllCategories();
  const activeCategory = params.category || null;
  const posts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Teed.club Blog',
    description: 'Guides, showcases, and build logs from Teed.club.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Teed.club',
      url: BASE_URL,
    },
  };

  return (
    <>
      <PageTracker page="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Blog
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
              Guides, showcases, and build logs. How people organize their gear — and how we build Teed.
            </p>
          </div>

          {/* Category filter pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href="/blog"
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  !activeCategory
                    ? 'bg-[var(--teed-green-9)] text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${cat}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    activeCategory === cat
                      ? 'bg-[var(--teed-green-9)] text-white'
                      : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
          )}

          {/* Post grid */}
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-[var(--text-tertiary)]">
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          {/* RSS link */}
          <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] text-center">
            <Link
              href="/blog/rss.xml"
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Subscribe via RSS
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
