import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageTracker } from '@/components/analytics/PageTracker';
import {
  Camera,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  List,
  QrCode,
  Image as ImageIcon,
  Folder,
  ChevronRight,
} from 'lucide-react';
import { getUseCaseBySlug, getAllUseCaseSlugs, UseCase } from '@/lib/data/useCases';
import { getPostsForUseCase } from '@/lib/blog/crosslinks';
import { RelatedArticles } from '@/components/blog/RelatedArticles';

type PageProps = {
  params: Promise<{ useCase: string }>;
};

export async function generateStaticParams() {
  const slugs = getAllUseCaseSlugs();
  return slugs.map((useCase) => ({ useCase }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { useCase: slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: 'Not Found | Teed',
    };
  }

  return {
    title: useCase.metaTitle,
    description: useCase.metaDescription,
    keywords: useCase.keywords,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `https://teed.so/for/${useCase.slug}`,
      siteName: 'Teed',
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      images: [
        {
          url: 'https://teed.so/og-image.png',
          width: 1200,
          height: 630,
          alt: useCase.headline,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: useCase.metaTitle,
      description: useCase.metaDescription,
    },
    alternates: {
      canonical: `https://teed.so/for/${useCase.slug}`,
    },
  };
}

const iconMap = {
  camera: Camera,
  share: Share2,
  sparkles: Sparkles,
  trending: TrendingUp,
  users: Users,
  zap: Zap,
  list: List,
  qrcode: QrCode,
  image: ImageIcon,
  folder: Folder,
};

function generateFaqSchema(useCase: UseCase) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: useCase.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateBreadcrumbSchema(useCase: UseCase) {
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
        name: useCase.title,
        item: `https://teed.so/for/${useCase.slug}`,
      },
    ],
  };
}

export default async function UseCasePage({ params }: PageProps) {
  const { useCase: slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  const faqSchema = generateFaqSchema(useCase);
  const breadcrumbSchema = generateBreadcrumbSchema(useCase);
  const relatedPosts = getPostsForUseCase(slug);

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

      <PageTracker page={`for/${slug}`} />
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
            <li className="text-[var(--text-primary)]">{useCase.title}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-7xl mb-6">{useCase.heroEmoji}</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
              {useCase.headline}
            </h1>
            <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-10 max-w-3xl mx-auto">
              {useCase.subheadline}
            </p>
            <Link
              href="/join"
              className="inline-block px-10 py-4 bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)] hover:scale-105"
            >
              {useCase.ctaText}
            </Link>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Pain Points */}
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                  Sound familiar?
                </h2>
                <ul className="space-y-4">
                  {useCase.painPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[var(--error)] text-xl mt-0.5">-</span>
                      <span className="text-[var(--text-secondary)]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                  Teed makes it easy
                </h2>
                <ul className="space-y-4">
                  {useCase.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[var(--teed-green-9)] text-xl mt-0.5">+</span>
                      <span className="text-[var(--text-secondary)]">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-12">
              Features for {useCase.title}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCase.features.map((feature, index) => {
                const Icon = iconMap[feature.icon];
                return (
                  <div
                    key={index}
                    className="p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] hover:shadow-[var(--shadow-3)] transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--teed-green-5)] rounded-[var(--radius-lg)] flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[var(--teed-green-10)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {useCase.faqs.map((faq, index) => (
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
        <RelatedArticles posts={relatedPosts} heading={`${useCase.title} on the Blog`} />

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-10">
              Join thousands of {useCase.title.toLowerCase()} already using Teed to organize and share their gear.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/join"
                className="inline-block px-10 py-4 bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)]"
              >
                {useCase.ctaText}
              </Link>
              <Link
                href="/discover"
                className="inline-block px-10 py-4 bg-[var(--surface)] text-[var(--text-primary)] text-lg font-semibold rounded-[var(--radius-xl)] border border-[var(--border-default)] hover:border-[var(--teed-green-6)] transition-all duration-300"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
