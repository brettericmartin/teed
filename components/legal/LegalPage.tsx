import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * Shared shell for /privacy and /terms: breadcrumb, dated header, sections of
 * short plain-English paragraphs, and the site footer. Same tokens and widths
 * as /about so the legal pages read as part of the site, not a bolt-on.
 */
export type LegalSection = {
  id: string;
  heading: string;
  paragraphs: React.ReactNode[];
};

type LegalPageProps = {
  crumb: string;
  kicker: string;
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
};

export function LegalPage({ crumb, kicker, title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <li>
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li className="text-[var(--text-primary)]">{crumb}</li>
        </ol>
      </nav>

      <header className="px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            {kicker} · updated {updated}
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight">
            {title}
          </h1>
          <div className="mt-5 text-lg text-[var(--text-secondary)] leading-relaxed">{intro}</div>
        </div>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="On this page" className="mb-10 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {s.heading}
              </a>
            ))}
          </nav>

          <div className="space-y-10 border-t border-[var(--border-subtle)] pt-10">
            {sections.map((s) => (
              <article key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">{s.heading}</h2>
                <div className="space-y-3 text-[var(--text-secondary)] leading-relaxed">
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export const SUPPORT_EMAIL = 'hello@teed.club';

export function MailLink({ children = SUPPORT_EMAIL }: { children?: React.ReactNode }) {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--teed-green-9)] font-medium hover:underline">
      {children}
    </a>
  );
}
