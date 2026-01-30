import { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Share2, Sparkles, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Teed - The Gear Collection Platform',
  description: 'Teed is a platform for creating, organizing, and sharing curated collections of gear, products, and recommendations. Learn about our mission to help people showcase what they use.',
  keywords: [
    'about teed',
    'what is teed',
    'gear collection platform',
    'product sharing app',
    'gear list maker',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://teed.so/about',
    siteName: 'Teed',
    title: 'About Teed - The Gear Collection Platform',
    description: 'Learn about Teed, the platform for creating and sharing curated gear collections.',
  },
  alternates: {
    canonical: 'https://teed.so/about',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  mainEntity: {
    '@type': 'Organization',
    name: 'Teed',
    url: 'https://teed.so',
    description: 'Platform for creating and sharing curated gear collections',
    foundingDate: '2024',
  },
};

export default function AboutPage() {
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
            <li className="text-[var(--text-primary)]">About</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-6">
              What is Teed?
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              Teed is a platform for creating, organizing, and sharing curated collections of gear,
              products, and recommendations. Think &quot;link in bio&quot; but for your actual stuff &mdash;
              the gear you use, love, and want to share with others.
            </p>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Who is Teed for?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: 'Golfers', desc: 'Share your bag setup and discover what others play', emoji: '⛳' },
                { title: 'Photographers', desc: 'Document your gear for insurance and sharing', emoji: '📷' },
                { title: 'Content Creators', desc: 'Build gear pages your audience will love', emoji: '🎬' },
                { title: 'Travelers', desc: 'Create reusable packing lists', emoji: '✈️' },
                { title: 'Outdoor Enthusiasts', desc: 'Organize hiking and camping gear', emoji: '🏔️' },
                { title: 'Tech Enthusiasts', desc: 'Share desk setups and EDC', emoji: '💻' },
                { title: 'Musicians', desc: 'Catalog instruments and studio gear', emoji: '🎸' },
                { title: 'Fitness Enthusiasts', desc: 'Document gym bags and home gyms', emoji: '💪' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
              How Teed Works
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Create a collection',
                  desc: 'Sign up and create your first "bag" - a themed collection of gear or products.',
                },
                {
                  step: 2,
                  title: 'Add your items',
                  desc: 'Add products via photo upload (AI identifies them), URL paste, or manual entry.',
                },
                {
                  step: 3,
                  title: 'Organize and customize',
                  desc: 'Arrange items with drag-and-drop, add sections, descriptions, and custom photos.',
                },
                {
                  step: 4,
                  title: 'Share your unique URL',
                  desc: 'Get a clean link like teed.so/u/yourname/mybag to share anywhere.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-6 p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]"
                >
                  <span className="w-10 h-10 rounded-full bg-[var(--teed-green-8)] text-white flex items-center justify-center font-bold flex-shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
              Key Features
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Camera,
                  title: 'AI Photo Recognition',
                  desc: 'Upload a photo and Teed identifies products automatically',
                },
                {
                  icon: Share2,
                  title: 'Beautiful Sharing',
                  desc: 'Clean URLs and mobile-optimized pages for sharing anywhere',
                },
                {
                  icon: TrendingUp,
                  title: 'Affiliate Links',
                  desc: 'Automatic affiliate link conversion to monetize recommendations',
                },
                {
                  icon: Sparkles,
                  title: 'Smart Organization',
                  desc: 'Drag-and-drop sorting, sections, and featured items',
                },
                {
                  icon: Users,
                  title: 'Community',
                  desc: 'Follow creators, discover collections, build your audience',
                },
                {
                  icon: Zap,
                  title: 'QR Codes',
                  desc: 'Generate QR codes for physical sharing',
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--teed-green-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[var(--teed-green-10)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Differentiators */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
              What Makes Teed Different
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Built for Products, Not Just Links
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Unlike link-in-bio tools that just aggregate links, Teed is designed specifically
                  for showcasing products with rich details, images, prices, and descriptions.
                </p>
              </div>
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Works with Any Store
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Amazon lists only work with Amazon. Teed lets you curate products from any
                  retailer - specialty shops, direct-to-consumer brands, anywhere.
                </p>
              </div>
              <div className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  Permanent, Not Ephemeral
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Your collections stay relevant. No freshness penalties, no expiring content.
                  Your gear page is a permanent resource for your audience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
              Ready to create your first collection?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Join the growing community of creators sharing their gear on Teed.
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
