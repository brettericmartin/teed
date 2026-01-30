import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { getAllComparisonSlugs, getComparisonBySlug } from '@/lib/data/comparisons';

export const metadata: Metadata = {
  title: 'Best Tools for Sharing Gear Collections | Teed Alternatives',
  description: 'Compare the best tools for creating and sharing gear collections, equipment lists, and product recommendations. See how Teed compares to Linktree, Amazon Lists, Notion, and more.',
  keywords: [
    'gear list tools',
    'equipment sharing apps',
    'product list maker',
    'linktree alternative',
    'amazon list alternative',
    'gear collection app',
    'best gear list app',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://teed.so/alternatives',
    siteName: 'Teed',
    title: 'Best Tools for Sharing Gear Collections',
    description: 'Compare tools for creating and sharing gear collections.',
  },
  alternates: {
    canonical: 'https://teed.so/alternatives',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Best Tools for Sharing Gear Collections',
  description: 'Comparison of tools for creating and sharing gear collections',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Teed',
      url: 'https://teed.so',
      description: 'Purpose-built platform for creating and sharing curated gear collections',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Linktree',
      url: 'https://linktr.ee',
      description: 'General link-in-bio tool for aggregating social links',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Amazon Lists',
      description: 'Amazon-only product lists and wishlists',
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Notion',
      url: 'https://notion.so',
      description: 'General workspace that can be configured for gear tracking',
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: 'Spreadsheets',
      description: 'Google Sheets or Excel for manual gear tracking',
    },
  ],
};

export default function AlternativesPage() {
  const comparisonSlugs = getAllComparisonSlugs();
  const comparisons = comparisonSlugs.map((slug) => getComparisonBySlug(slug)!);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <li className="text-[var(--text-primary)]">Alternatives</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Best Tools for Sharing Gear Collections
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              Compare the best ways to create, organize, and share your gear lists, equipment
              inventories, and product recommendations.
            </p>
          </div>
        </section>

        {/* Tool Categories */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Types of Gear Sharing Tools
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--teed-green-6)]">
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  Purpose-Built Platforms
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Tools designed specifically for gear sharing with product cards, images, and affiliate support.
                </p>
                <span className="text-xs font-medium text-[var(--teed-green-9)]">
                  Example: Teed
                </span>
              </div>
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  Link-in-Bio Tools
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  General link aggregators that can list products but lack rich product features.
                </p>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Example: Linktree
                </span>
              </div>
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  Retailer Lists
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Built-in list features from retailers, limited to that store&apos;s products.
                </p>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Example: Amazon Lists
                </span>
              </div>
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="font-bold text-[var(--text-primary)] mb-2">
                  General Tools
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Databases and spreadsheets that require manual setup for gear tracking.
                </p>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Example: Notion, Sheets
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Detailed Comparisons
            </h2>
            <div className="space-y-4">
              {comparisons.map((comparison) => (
                <Link
                  key={comparison.slug}
                  href={`/vs/${comparison.slug}`}
                  className="flex items-center justify-between p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:shadow-[var(--shadow-3)] transition-all duration-300 group"
                >
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                      Teed vs {comparison.competitorName}
                    </h3>
                    <p className="text-[var(--text-secondary)]">{comparison.verdict}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[var(--text-tertiary)] group-hover:text-[var(--teed-green-9)] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Teed */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Why Choose Teed?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Purpose-Built',
                  desc: 'Designed specifically for gear sharing, not adapted from another use case',
                },
                {
                  title: 'AI-Powered',
                  desc: 'Upload a photo and Teed identifies products automatically',
                },
                {
                  title: 'Any Store',
                  desc: 'Works with products from any retailer, not just Amazon',
                },
                {
                  title: 'Affiliate Ready',
                  desc: 'Automatic affiliate link conversion built in',
                },
                {
                  title: 'Beautiful Pages',
                  desc: 'Product cards with images, not plain text lists',
                },
                {
                  title: 'Free to Use',
                  desc: 'All core features free, no hidden paywalls',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]"
                >
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
              Ready to try the best gear sharing tool?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Create your first collection in minutes.
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
