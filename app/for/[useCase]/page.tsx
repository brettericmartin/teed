import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
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
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SetupCard, type SetupCardProps } from '@/components/bag/SetupCard';
import { ComponentCard } from '@/components/bag/ComponentCard';
import { getComponentStripCards } from '@/lib/components/strip';
import { computeTotals, formatBagTotalLine, type TotalsItem } from '@/lib/bags/totals';
import { DISCLOSURE } from '@/lib/disclosure';
import { SITE_URL } from '@/lib/siteUrl';
import { resolveItemPhoto, thumbUrl } from '@/lib/items/photo';

type PageProps = {
  params: Promise<{ useCase: string }>;
};

/** How many setups the index strip shows this week (pagination and chips come later). */
const SETUPS_LIMIT = 24;

export async function generateStaticParams() {
  const slugs = getAllUseCaseSlugs();
  return slugs.map((useCase) => ({ useCase }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { useCase: slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: 'Not Found | Teed.club',
    };
  }

  return {
    title: useCase.metaTitle,
    description: useCase.metaDescription,
    keywords: useCase.keywords,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${SITE_URL}/for/${useCase.slug}`,
      siteName: 'Teed.club',
      title: useCase.metaTitle,
      description: useCase.metaDescription,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
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
      canonical: `${SITE_URL}/for/${useCase.slug}`,
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
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: useCase.title,
        item: `${SITE_URL}/for/${useCase.slug}`,
      },
    ],
  };
}

type SetupRow = {
  id: string;
  code: string;
  title: string;
  updated_at: string | null;
  cover_photo_id: string | null;
  owner: { handle: string; display_name: string | null; avatar_url: string | null } | null;
  items: {
    id: string;
    custom_name: string | null;
    brand: string | null;
    custom_photo_id: string | null;
    photo_url: string | null;
    price_paid: number | null;
    specs: Record<string, unknown> | null;
    sort_index: number;
  }[];
};

/**
 * Public bags in the use case's category, newest first (same shape as the
 * roundup query in app/blog/best/[category]/page.tsx, with the bag_items FK
 * hint the Discover page uses). Returns [] on any error so the page still renders.
 */
async function fetchSetups(category: string): Promise<SetupCardProps[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('bags')
    .select(
      `
      id, code, title, updated_at, cover_photo_id,
      owner:profiles!bags_owner_id_fkey(handle, display_name, avatar_url),
      items:bag_items!bag_items_bag_id_fkey(id, custom_name, brand, custom_photo_id, photo_url, price_paid, specs, sort_index)
    `
    )
    .eq('is_public', true)
    .eq('is_hidden', false)
    .eq('category', category)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(SETUPS_LIMIT);

  if (error || !data) return [];
  const rows = data as unknown as SetupRow[];

  // Resolve uploaded photos (cover + up to four item photos per bag) in one query
  const photoIds = new Set<string>();
  for (const bag of rows) {
    if (bag.cover_photo_id) photoIds.add(bag.cover_photo_id);
    for (const item of (bag.items || []).slice(0, 8)) {
      if (item.custom_photo_id) photoIds.add(item.custom_photo_id);
    }
  }
  const photoUrls: Record<string, string> = {};
  if (photoIds.size > 0) {
    const { data: assets } = await supabase
      .from('media_assets')
      .select('id, url')
      .in('id', Array.from(photoIds));
    for (const asset of assets || []) photoUrls[asset.id] = asset.url;
  }

  return rows
    .filter((bag) => bag.owner?.handle)
    .map((bag) => {
      const items = [...(bag.items || [])].sort((a, b) => a.sort_index - b.sort_index);
      const totals = computeTotals(
        items.map((it) => ({ price_paid: it.price_paid, specs: it.specs as TotalsItem['specs'] }))
      );
      // Thumbnails go through /api/proxy-image?w=: the page was 3.1 MB because two makers'
      // originals (913 KB and 800 KB) were loading into 200 px tiles.
      const itemPhotos = items
        .map((it) => ({
          url: thumbUrl(resolveItemPhoto(it, photoUrls), 320),
          label: it.brand || it.custom_name || 'Item',
        }))
        .filter((p): p is { url: string; label: string } => Boolean(p.url))
        .slice(0, 4);
      return {
        href: `/u/${bag.owner!.handle}/${bag.code}`,
        title: bag.title,
        coverUrl: thumbUrl(bag.cover_photo_id ? photoUrls[bag.cover_photo_id] || null : null, 800),
        itemPhotos,
        totalLine: formatBagTotalLine(totals),
        itemCount: items.length,
        curator: {
          handle: bag.owner!.handle,
          display_name: bag.owner!.display_name,
          avatar_url: bag.owner!.avatar_url,
        },
      };
    });
}

function asOfLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  // Real bags on the page (landing evaluation #2). Only when the use case has a category.
  const setups = useCase.discoverCategory ? await fetchSetups(useCase.discoverCategory) : [];
  const setupCount = setups.length;
  // Components strip (golf-sim only): the six reference lists, or their guides until a list is seeded.
  const componentCards = useCase.discoverCategory === 'golf-sim' ? await getComponentStripCards() : [];
  const noun = useCase.bagNoun || 'bag';
  const nounPlural = `${noun}s`;

  // Hero CTAs: optional overrides with fallbacks so the other /for pages do not change
  const primaryCta = useCase.primaryCta || useCase.ctaText;
  const primaryHref = useCase.primaryHref || '/join';
  const hasSecondary = Boolean(useCase.secondaryCta && useCase.secondaryHref);
  // The "build one" CTA: the secondary override when set (golf-sim: /signup?ref=golf-sim), else /join as before
  const buildHref = useCase.secondaryHref || '/join';
  const buildCta = useCase.secondaryCta || useCase.ctaText;
  const browseHref = setupCount > 0
    ? '#setups'
    : useCase.discoverCategory
      ? `/discover?category=${useCase.discoverCategory}`
      : '/discover';
  const browseLabel = useCase.bagNoun ? `All ${nounPlural}` : 'Browse bags';
  const isSetupsPage = Boolean(useCase.primaryHref === '#setups');

  const buttonPrimary =
    'inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 min-h-[44px] bg-[var(--teed-green-9)] text-white text-base font-semibold rounded-[var(--radius-lg)] hover:bg-[var(--teed-green-10)] transition-colors';
  const buttonOutline =
    'inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 min-h-[44px] bg-[var(--surface)] text-[var(--text-primary)] text-base font-semibold rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--evergreen-6)] transition-colors';

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

        {/* Hero Section (mobile-first spacing only on the setups page; others unchanged) */}
        <section className={`${isSetupsPage ? 'py-10 sm:py-16' : 'py-16'} px-4 sm:px-6 lg:px-8`}>
          <div className="max-w-4xl mx-auto text-center">
            {useCase.heroEmoji && <div className="text-7xl mb-6">{useCase.heroEmoji}</div>}
            <h1 className={`${isSetupsPage ? 'text-3xl sm:text-5xl md:text-6xl mb-5 sm:mb-6 leading-tight' : 'text-4xl sm:text-5xl md:text-6xl mb-6'} font-bold text-[var(--text-primary)]`}>
              {useCase.headline}
            </h1>
            <p className={`${isSetupsPage ? 'text-lg sm:text-2xl mb-8 sm:mb-10' : 'text-xl sm:text-2xl mb-10'} text-[var(--text-secondary)] max-w-3xl mx-auto`}>
              {useCase.subheadline}
            </p>
            {hasSecondary ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link href={primaryHref} className={buttonPrimary}>
                  {primaryCta}
                </Link>
                <Link href={useCase.secondaryHref!} className={buttonOutline}>
                  {useCase.secondaryCta}
                </Link>
              </div>
            ) : (
              <Link
                href={primaryHref}
                className="inline-block px-10 py-4 bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)] hover:scale-105"
              >
                {primaryCta}
              </Link>
            )}
            {useCase.underCtaLine && (
              <p className="mt-4 text-sm text-[var(--text-tertiary)]">{useCase.underCtaLine}</p>
            )}
            {useCase.showDisclosure && (
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">{DISCLOSURE}</p>
            )}
          </div>
        </section>

        {/* Setups: real bags, directly under the hero; hidden when there are none */}
        {setupCount > 0 && (
          <section id="setups" className="scroll-mt-20 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)]">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 mb-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-2xl sm:text-[28px] font-bold text-[var(--text-primary)]">
                    {useCase.setupsHeading || 'Setups'}
                  </h2>
                  <span className="text-sm text-[var(--text-tertiary)] tabular-nums">
                    {setupCount} so far · as of {asOfLabel()}
                  </span>
                </div>
                <Link
                  href={buildHref}
                  className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] text-sm font-medium text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--evergreen-6)] transition-colors"
                >
                  Add yours
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {setups.map((setup) => (
                  <SetupCard key={setup.href} {...setup} />
                ))}
              </div>
              {useCase.discoverCategory && (
                <p className="mt-6 text-sm text-[var(--text-secondary)]">
                  <Link
                    href={`/discover?category=${useCase.discoverCategory}`}
                    className="underline underline-offset-2 hover:text-[var(--text-primary)]"
                  >
                    {browseLabel} on Discover
                  </Link>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Components: one card per part category; a card links to the @teed reference bag when it
            exists, else to the guide, and is hidden when neither exists yet. */}
        {componentCards.length > 0 && (
          <section id="components" className="scroll-mt-20 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)]">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                <h2 className="text-2xl sm:text-[28px] font-bold text-[var(--text-primary)]">Components</h2>
                <span className="text-sm text-[var(--text-tertiary)]">one list per part</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-3xl">
                What people actually buy for each part of a home sim, grouped by shape and price, with the list price, the date it was read and one thread worth reading. Not ranked.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {componentCards.map((card) => (
                  <ComponentCard key={card.slug} {...card} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* What every setup shows (features), then what guides leave out (pains). For the
            other pages the order stays pains/solutions then features. */}
        {isSetupsPage ? (
          <>
            <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6 sm:mb-8">
                  {useCase.featuresHeading || useCase.solutionHeading || 'What every setup here shows'}
                </h2>
                <ul className="space-y-3 mb-10 max-w-3xl">
                  {useCase.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[var(--teed-green-9)] text-xl leading-6">+</span>
                      <span className="text-[var(--text-secondary)]">{solution}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {useCase.features.map((feature, index) => {
                    const Icon = iconMap[feature.icon];
                    return (
                      <div
                        key={index}
                        className="p-4 sm:p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]"
                      >
                        <div className="w-10 h-10 bg-[var(--teed-green-2)] rounded-[var(--radius-lg)] flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-[var(--teed-green-10)]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5">
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

            <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
                  {useCase.problemHeading || 'Sound familiar?'}
                </h2>
                <ul className="space-y-3 max-w-3xl">
                  {useCase.painPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-[var(--text-tertiary)] text-xl leading-6">·</span>
                      <span className="text-[var(--text-secondary)]">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Problem/Solution Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]">
              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12">
                  {/* Pain Points */}
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                      {useCase.problemHeading || 'Sound familiar?'}
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
                      {useCase.solutionHeading || 'Teed makes it easy'}
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
                  {useCase.featuresHeading || `Features for ${useCase.title}`}
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
          </>
        )}

        {/* FAQ Section */}
        <section className={`${isSetupsPage ? 'py-14 sm:py-20' : 'py-20'} px-4 sm:px-6 lg:px-8 bg-[var(--surface-elevated)]`}>
          <div className="max-w-3xl mx-auto">
            <h2 className={`${isSetupsPage ? 'text-2xl sm:text-4xl mb-8 sm:mb-12' : 'text-3xl sm:text-4xl mb-12'} font-bold text-[var(--text-primary)] text-center`}>
              {isSetupsPage ? 'Questions' : 'Frequently Asked Questions'}
            </h2>
            {/* Setups page: collapsed <details> below sm (no JS), open cards from sm up */}
            {isSetupsPage && (
              <div className="space-y-3 sm:hidden">
                {useCase.faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]"
                  >
                    <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold text-[var(--text-primary)] flex items-start justify-between gap-4">
                      <span>{faq.question}</span>
                      <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--text-tertiary)] transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            )}
            <div className={`space-y-6 ${isSetupsPage ? 'hidden sm:block' : ''}`}>
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

        {/* Related Blog Posts (renders nothing when empty) */}
        <RelatedArticles posts={relatedPosts} heading={`${useCase.title} on the Blog`} />

        {/* Closing: honest, no invented numbers ("Join thousands of ..." is gone on every page) */}
        <section className={`${isSetupsPage ? 'py-14 sm:py-20' : 'py-20'} px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teed-green-2)] via-[var(--teed-green-3)] to-[var(--sky-2)]`}>
          <div className="max-w-3xl mx-auto text-center">
            {isSetupsPage ? (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5">
                  Add yours
                </h2>
                <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 sm:mb-10">
                  It takes about twenty minutes. Your setup stays up as long as you want it, and it comes down on one message.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
                  Ready to get started?
                </h2>
                <p className="text-xl text-[var(--text-secondary)] mb-10">
                  Organize and share your gear with Teed.club.
                </p>
              </>
            )}
            <div className={`flex flex-col sm:flex-row ${isSetupsPage ? 'items-stretch sm:items-center gap-3 sm:gap-4' : 'items-center gap-4'} justify-center`}>
              <Link
                href={buildHref}
                className="inline-flex items-center justify-center px-10 py-4 min-h-[48px] bg-[var(--teed-green-8)] text-white text-lg font-semibold rounded-[var(--radius-xl)] hover:bg-[var(--teed-green-9)] transition-all duration-300 shadow-[var(--shadow-3)] hover:shadow-[var(--shadow-4)]"
              >
                {buildCta}
              </Link>
              <Link
                href={browseHref}
                className="inline-flex items-center justify-center px-10 py-4 min-h-[48px] bg-[var(--surface)] text-[var(--text-primary)] text-lg font-semibold rounded-[var(--radius-xl)] border border-[var(--border-default)] hover:border-[var(--teed-green-6)] transition-all duration-300"
              >
                {browseLabel}
              </Link>
            </div>
            {isSetupsPage && (
              <p className="mt-6 text-sm text-[var(--text-tertiary)] tabular-nums">
                {setupCount} {setupCount === 1 ? noun : nounPlural} so far.
              </p>
            )}
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
