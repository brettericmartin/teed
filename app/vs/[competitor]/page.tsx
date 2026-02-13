import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Minus, ChevronRight } from 'lucide-react';
import { PageTracker } from '@/components/analytics/PageTracker';
import { getComparisonBySlug, getAllComparisonSlugs, Comparison } from '@/lib/data/comparisons';
import { getPostsForComparison } from '@/lib/blog/crosslinks';
import { RelatedArticles } from '@/components/blog/RelatedArticles';

type PageProps = {
  params: Promise<{ competitor: string }>;
};

export async function generateStaticParams() {
  const slugs = getAllComparisonSlugs();
  return slugs.map((competitor) => ({ competitor }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitor: slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    return {
      title: 'Not Found | Teed.club',
    };
  }

  return {
    title: comparison.metaTitle,
    description: comparison.metaDescription,
    keywords: comparison.keywords,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `https://teed.so/vs/${comparison.slug}`,
      siteName: 'Teed.club',
      title: comparison.metaTitle,
      description: comparison.metaDescription,
      images: [
        {
          url: 'https://teed.so/og-image.png',
          width: 1200,
          height: 630,
          alt: comparison.headline,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: comparison.metaTitle,
      description: comparison.metaDescription,
    },
    alternates: {
      canonical: `https://teed.so/vs/${comparison.slug}`,
    },
  };
}

function generateFaqSchema(comparison: Comparison) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: comparison.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateBreadcrumbSchema(comparison: Comparison) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://teed.so',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Comparisons',
        item: 'https://teed.so/alternatives',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `vs ${comparison.competitorName}`,
        item: `https://teed.so/vs/${comparison.slug}`,
      },
    ],
  };
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-[var(--teed-green-9)]" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-[var(--text-tertiary)]" />;
  }
  return <span className="text-sm text-[var(--text-secondary)]">{value}</span>;
}

function WinnerBadge({ winner }: { winner: 'teed' | 'competitor' | 'tie' }) {
  if (winner === 'teed') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--teed-green-3)] text-[var(--teed-green-11)]">
        Teed
      </span>
    );
  }
  if (winner === 'tie') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--grey-3)] text-[var(--grey-11)]">
        Tie
      </span>
    );
  }
  return null;
}

export default async function ComparisonPage({ params }: PageProps) {
  const { competitor: slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) {
    notFound();
  }

  const faqSchema = generateFaqSchema(comparison);
  const breadcrumbSchema = generateBreadcrumbSchema(comparison);
  const relatedPosts = getPostsForComparison(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PageTracker page={`vs/${slug}`} />
      <div className="min-h-screen bg-[var(--background)]">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <li>
              <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li>
              <Link href="/alternatives" className="hover:text-[var(--text-primary)] transition-colors">
                Alternatives
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li className="text-[var(--text-primary)]">vs {comparison.competitorName}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
              {comparison.headline}
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              {comparison.verdict}
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Feature Comparison
            </h2>
            <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)] font-semibold text-[var(--text-primary)]">
                <div>Feature</div>
                <div className="text-center">Teed</div>
                <div className="text-center">{comparison.competitorName}</div>
                <div className="text-center">Better</div>
              </div>

              {/* Table Rows */}
              {comparison.features.map((feature, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-4 gap-4 p-4 items-center ${
                    index % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-elevated)]'
                  }`}
                >
                  <div className="text-[var(--text-primary)]">{feature.name}</div>
                  <div className="flex justify-center">
                    <FeatureCell value={feature.teed} />
                  </div>
                  <div className="flex justify-center">
                    <FeatureCell value={feature.competitor} />
                  </div>
                  <div className="flex justify-center">
                    <WinnerBadge winner={feature.winner} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When to Use Each */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              When to Use Each
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Teed Better For */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-6 border border-[var(--teed-green-6)]">
                <h3 className="text-xl font-bold text-[var(--teed-green-10)] mb-4">
                  Choose Teed if you want to...
                </h3>
                <ul className="space-y-3">
                  {comparison.teedBetterFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[var(--teed-green-9)] mt-0.5 flex-shrink-0" />
                      <span className="text-[var(--text-secondary)]">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/join"
                  className="mt-6 inline-block w-full text-center px-6 py-3 bg-[var(--teed-green-8)] text-white font-semibold rounded-[var(--radius-lg)] hover:bg-[var(--teed-green-9)] transition-colors"
                >
                  Try Teed Free
                </Link>
              </div>

              {/* Competitor Better For */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-subtle)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  {comparison.competitorName} might be better if you want to...
                </h3>
                <ul className="space-y-3">
                  {comparison.competitorBetterFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Minus className="w-5 h-5 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                      <span className="text-[var(--text-secondary)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Migration Guide */}
        {comparison.migrationSteps && (
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
                How to Switch from {comparison.competitorName} to Teed
              </h2>
              <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-6 border border-[var(--border-subtle)]">
                <ol className="space-y-4">
                  {comparison.migrationSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-[var(--teed-green-3)] text-[var(--teed-green-10)] flex items-center justify-center font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-[var(--text-secondary)] pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {comparison.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-6 border border-[var(--border-subtle)]"
                >
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Blog Posts */}
        <RelatedArticles posts={relatedPosts} heading="Learn More" />

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
              Ready to try Teed?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Create beautiful, shareable gear collections in minutes.
            </p>
            <Link
              href="/join"
              className="inline-block px-10 py-4 bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)]"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
