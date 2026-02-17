import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { resolveProduct } from '@/lib/products/resolveProduct';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return { title: 'Product Not Found | Teed' };
  }

  const displayName = product.brand
    ? `${product.brand} ${product.name}`
    : product.name;

  const title = `${displayName} — Real-World Reviews & Context | Teed`;
  const description = `See why ${product.stats.uniqueCurators} ${product.stats.uniqueCurators === 1 ? 'curator' : 'curators'} chose the ${displayName}. Real context: why they picked it, what they pair it with, and what they considered instead.`;

  return {
    title,
    description,
    openGraph: {
      title: displayName,
      description,
      url: `https://teed.club/products/${slug}`,
      siteName: 'Teed.club',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: displayName,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  const displayName = product.brand
    ? `${product.brand} ${product.name}`
    : product.name;

  // Find the best photo from appearances
  const photo = product.appearances.find((a) => a.photoUrl)?.photoUrl;

  // Build JSON-LD: Product with aggregated Reviews
  const reviews = product.appearances
    .filter((a) => a.whyChosen)
    .map((a) => ({
      '@type': 'Review',
      reviewBody: a.whyChosen,
      author: {
        '@type': 'Person',
        name: a.curator.displayName || a.curator.handle,
        url: `https://teed.club/u/${a.curator.handle}`,
      },
    }));

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    ...(product.brand && {
      brand: { '@type': 'Brand', name: product.brand },
    }),
    ...(photo && { image: photo }),
    ...(reviews.length > 0 && { review: reviews }),
    url: `https://teed.club/products/${slug}`,
  };

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Teed.club', url: 'https://teed.club' },
    { name: 'Products', url: 'https://teed.club/products' },
    { name: displayName, url: `https://teed.club/products/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-[var(--app-bg)]">
        {/* Header */}
        <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <nav className="text-sm text-[var(--text-secondary)] mb-4">
              <Link href="/" className="hover:text-[var(--text-primary)]">
                Teed
              </Link>
              {' / '}
              <span>Products</span>
              {' / '}
              <span className="text-[var(--text-primary)]">{displayName}</span>
            </nav>

            <div className="flex items-start gap-6">
              {photo && (
                <div className="flex-shrink-0 hidden sm:block">
                  <img
                    src={photo}
                    alt={displayName}
                    className="w-28 h-28 object-contain bg-[var(--sky-2)] rounded-xl border border-[var(--border-subtle)]"
                  />
                </div>
              )}
              <div>
                {product.brand && (
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    {product.brand}
                  </p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-[var(--teed-green-2)] text-[var(--teed-green-11)] rounded-full text-sm font-medium">
                    Used by {product.stats.uniqueCurators}{' '}
                    {product.stats.uniqueCurators === 1 ? 'curator' : 'curators'}
                  </span>
                  <span className="px-3 py-1 bg-[var(--sky-2)] text-[var(--sky-11)] rounded-full text-sm font-medium">
                    In {product.stats.totalAppearances}{' '}
                    {product.stats.totalAppearances === 1 ? 'bag' : 'bags'}
                  </span>
                  {product.stats.withContext > 0 && (
                    <span className="px-3 py-1 bg-[var(--amber-2)] text-[var(--amber-11)] rounded-full text-sm font-medium">
                      {product.stats.withContext} with context
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearances */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Who Uses This & Why
          </h2>

          <div className="space-y-6">
            {product.appearances.map((appearance) => (
              <div
                key={appearance.itemId}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/u/${appearance.curator.handle}/${appearance.bag.code}`}
                      className="text-sm font-medium text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)]"
                    >
                      @{appearance.curator.handle}
                    </Link>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {' '}in{' '}
                    </span>
                    <Link
                      href={`/u/${appearance.curator.handle}/${appearance.bag.code}`}
                      className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--teed-green-9)]"
                    >
                      {appearance.bag.title}
                    </Link>
                    {appearance.bag.category && (
                      <span className="ml-2 px-2 py-0.5 bg-[var(--sky-2)] text-[var(--sky-11)] text-xs rounded-full">
                        {appearance.bag.category}
                      </span>
                    )}
                  </div>
                  {appearance.pricePaid && (
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      ${appearance.pricePaid.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Why Chosen - the hero content */}
                {appearance.whyChosen && (
                  <div className="mt-4 bg-[var(--teed-green-1)] border border-[var(--teed-green-6)] rounded-lg p-4">
                    <p className="text-sm font-medium text-[var(--teed-green-11)] mb-1">
                      Why they chose this
                    </p>
                    <p className="text-[var(--text-primary)]">{appearance.whyChosen}</p>
                  </div>
                )}

                {/* Compared To */}
                {appearance.comparedTo && (
                  <div className="mt-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-medium">Compared to:</span> {appearance.comparedTo}
                    </p>
                  </div>
                )}

                {/* Alternatives */}
                {appearance.alternatives && appearance.alternatives.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm text-[var(--text-secondary)] font-medium">
                      Also considered:
                    </span>
                    {appearance.alternatives.map((alt, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 bg-[var(--sand-3)] text-[var(--sand-11)] text-sm rounded-full"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-[var(--border-subtle)]">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              Do you use the {displayName}?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-all"
            >
              Add it to your bag on Teed
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
