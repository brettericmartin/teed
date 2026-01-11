import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Package, Layers, ExternalLink, User, Clock, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manifesto - Teed',
  description: 'What Teed is, what it is not, and why it exists. A calm, permanent home for your curations.',
};

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-elevated)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teed
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            What Teed Is
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            A place for curations to exist, be understood, and be shared.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">

          {/* Core Identity */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              The Core Idea
            </h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                Teed is a <strong className="text-[var(--text-primary)]">canonical reference and springboard utility</strong>.
              </p>
              <p>
                You create bags. Bags contain items. Items have links. Links take people where they need to go.
              </p>
              <p>
                That&apos;s it.
              </p>
              <p>
                When someone lands on your profile or bag, they should understand what it is,
                what it contains, and where to go next&mdash;in about ten seconds.
              </p>
            </div>
          </section>

          {/* Bags */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--teed-green-3)] rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[var(--teed-green-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Bags Are Primary
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                A bag is the atomic unit of meaning on Teed. It&apos;s a container for products,
                gear, tools, or recommendations that belong together.
              </p>
              <p>
                Bags can be:
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span><strong className="text-[var(--text-primary)]">Snapshots</strong> — frozen in time, representing a moment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span><strong className="text-[var(--text-primary)]">Living setups</strong> — updated as things change, with optional history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span><strong className="text-[var(--text-primary)]">Versioned chapters</strong> — forked into new bags, preserving the original</span>
                </li>
              </ul>
              <p>
                There is no penalty for inactivity. There is no concept of &ldquo;stale.&rdquo;
                A bag from two years ago is just as valid as one from today.
              </p>
            </div>
          </section>

          {/* What Teed Is Not */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              What Teed Is Not
            </h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                Teed is not a social network. There are no feeds, no algorithmic timelines,
                no notifications designed to pull you back.
              </p>
              <p>
                Teed is not an engagement platform. We don&apos;t count your views, don&apos;t rank your content,
                don&apos;t show you who&apos;s watching.
              </p>
              <p>
                Teed is not a content mill. There&apos;s no pressure to post, no freshness score,
                no penalty for going quiet.
              </p>
              <p className="text-[var(--text-primary)] font-medium">
                If you never log in again, your bags stay exactly as you left them.
              </p>
            </div>
          </section>

          {/* Hierarchy */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--sky-3)] rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-[var(--sky-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                The Hierarchy
              </h2>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-6 font-mono text-sm">
              <div className="text-[var(--text-primary)]">1. Bags <span className="text-[var(--text-tertiary)]">— containers of meaning</span></div>
              <div className="text-[var(--text-secondary)] ml-4">└── 2. Items <span className="text-[var(--text-tertiary)]">— products with context</span></div>
              <div className="text-[var(--text-secondary)] ml-8">└── 3. Links <span className="text-[var(--text-tertiary)]">— where to buy or learn</span></div>
              <div className="text-[var(--text-secondary)] ml-12">└── 4. Profile <span className="text-[var(--text-tertiary)]">— the map to your bags</span></div>
            </div>
            <p className="mt-4 text-[var(--text-secondary)]">
              Everything serves the bag. Items exist within bags. Links serve items.
              Profiles are maps to bags&mdash;not feeds, not engagement surfaces.
            </p>
          </section>

          {/* Links */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--sand-3)] rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-[var(--sand-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Links Are Utilities
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                Teed doesn&apos;t replace other platforms. It explains and routes to them.
              </p>
              <p>
                Every outbound destination should be clearly named and briefly explained.
                Users should know where they&apos;re going and why before they click.
              </p>
              <p>
                Teed centralizes understanding, not infrastructure. We&apos;re the map, not the territory.
              </p>
            </div>
          </section>

          {/* Profiles */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--grey-3)] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--grey-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Profiles Are Maps
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                A profile answers three questions:
              </p>
              <ol className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] font-medium">1.</span>
                  <span>Who is this?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] font-medium">2.</span>
                  <span>What have they curated?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] font-medium">3.</span>
                  <span>Where should I go next?</span>
                </li>
              </ol>
              <p>
                Profiles frame bags first, then provide explained exits to other platforms
                where you create, sell, or share.
              </p>
            </div>
          </section>

          {/* Dopamine Philosophy */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--teed-green-3)] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--teed-green-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Constructive Satisfaction
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                Teed rewards <em>having built something</em>, not <em>returning to check something</em>.
              </p>
              <p>
                The satisfaction comes from:
              </p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span>Visual craft and beauty in your curations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span>The completion of a bag that represents something real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span>Pride in ownership of your collections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--teed-green-9)] mt-1.5">•</span>
                  <span>Quiet affirmation when someone saves or shares your work</span>
                </li>
              </ul>
              <p>
                There are no rankings, no trending lists, no urgency, no FOMO.
                Just things you&apos;ve made, preserved and shareable.
              </p>
            </div>
          </section>

          {/* Permanence */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--evergreen-3)] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--evergreen-9)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Permanence Over Recency
              </h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                A bag from 2023 and a bag from today are equally valid.
                Neither is &ldquo;fresher&rdquo; or &ldquo;more relevant.&rdquo;
              </p>
              <p>
                Continuity is optional. Preservation is mandatory.
              </p>
              <p>
                When you build something on Teed, it stays. It doesn&apos;t decay, doesn&apos;t get
                buried, doesn&apos;t lose visibility because you haven&apos;t posted in a while.
              </p>
              <p className="text-[var(--text-primary)] font-medium">
                This is a place to build things that last.
              </p>
            </div>
          </section>

          {/* Closing */}
          <section className="text-center py-8">
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              Ready to create something permanent?
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-[var(--evergreen-12)] text-white font-medium rounded-xl hover:bg-[var(--evergreen-11)] transition-colors"
            >
              Create Your First Bag
            </Link>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] text-center text-sm text-[var(--text-tertiary)]">
          <Link href="/" className="hover:text-[var(--text-secondary)]">
            Teed
          </Link>
          {' · '}
          <Link href="/discover" className="hover:text-[var(--text-secondary)]">
            Discover
          </Link>
          {' · '}
          <Link href="/updates" className="hover:text-[var(--text-secondary)]">
            Updates
          </Link>
        </div>
      </main>
    </div>
  );
}
