import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { PageTracker } from '@/components/analytics/PageTracker';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { getMDXComponents } from '@/lib/blog/mdx-components';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import PostHeader from '@/components/blog/PostHeader';
import TableOfContents from '@/components/blog/TableOfContents';
import PostCard from '@/components/blog/PostCard';

const BASE_URL = 'https://teed.so';

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  const { meta } = post;
  const url = `${BASE_URL}/blog/${meta.slug}`;

  return {
    title: `${meta.title} — Teed Blog`,
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: meta.author }],
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: 'Teed.club',
      type: 'article',
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt,
      authors: [meta.author],
      tags: meta.tags,
      ...(meta.heroImage && {
        images: [{ url: meta.heroImage, alt: meta.heroImageAlt || meta.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      ...(meta.heroImage && { images: [meta.heroImage] }),
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content } = post;
  const relatedPosts = getRelatedPosts(slug, 3);
  const url = `${BASE_URL}/blog/${meta.slug}`;

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    url,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt || meta.publishedAt,
    author: {
      '@type': meta.author === 'Teed.club' ? 'Organization' : 'Person',
      name: meta.author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Teed.club',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    keywords: meta.keywords.join(', '),
    ...(meta.heroImage && {
      image: { '@type': 'ImageObject', url: meta.heroImage },
    }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: meta.title, url },
  ]);

  return (
    <>
      <PageTracker page={`blog/${slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([blogPostingSchema, breadcrumbSchema]),
        }}
      />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-10">
            {/* Main content */}
            <article className="min-w-0 flex-1 max-w-3xl">
              <PostHeader meta={meta} />

              {/* Hero image */}
              {meta.heroImage && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meta.heroImage}
                    alt={meta.heroImageAlt || meta.title}
                    className="w-full"
                  />
                </div>
              )}

              {/* MDX content */}
              <div className="blog-content">
                <MDXRemote source={content} components={getMDXComponents()} />
              </div>

              {/* Tags */}
              {meta.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-[var(--border-subtle)]">
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Table of contents sidebar */}
            <TableOfContents content={content} />
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-10 border-t border-[var(--border-subtle)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                Related posts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((rp) => (
                  <PostCard key={rp.slug} post={rp} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
