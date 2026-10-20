import Link from 'next/link';

/**
 * The site footer, extracted from HomeClient so marketing pages (/for/*) carry
 * the same links. Server-renderable: no client hooks.
 *
 * Privacy and Terms links are deliberately absent until those pages exist.
 */
export function SiteFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-3xl font-serif font-medium tracking-tight text-[var(--text-primary)] mb-4">Teed.club</div>
        <p className="font-serif italic text-[var(--text-secondary)] mb-6">
          Organize. Curate. Share.
        </p>
        <div className="divider-gradient mx-auto mb-6" />
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[var(--text-tertiary)]">
          <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">
            About
          </Link>
          <Link href="/manifesto" className="hover:text-[var(--text-primary)] transition-colors">
            Manifesto
          </Link>
          <Link href="/discover" className="hover:text-[var(--text-primary)] transition-colors">
            Discover
          </Link>
          <Link href="/blog" className="hover:text-[var(--text-primary)] transition-colors">
            Blog
          </Link>
          <Link href="/signup" className="hover:text-[var(--text-primary)] transition-colors">
            Sign Up Free
          </Link>
          <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
            Sign In
          </Link>
          <Link href="/for/golfers" className="hover:text-[var(--text-primary)] transition-colors">
            Golfers
          </Link>
          <Link href="/for/golf-simulators" className="hover:text-[var(--text-primary)] transition-colors">
            Golf Sims
          </Link>
          <Link href="/for/creators" className="hover:text-[var(--text-primary)] transition-colors">
            Creators
          </Link>
          <Link href="/for/travelers" className="hover:text-[var(--text-primary)] transition-colors">
            Travelers
          </Link>
          <Link href="/for/tech" className="hover:text-[var(--text-primary)] transition-colors">
            Tech
          </Link>
        </nav>
        <p className="mt-8 text-xs text-[var(--text-tertiary)]">
          &copy; 2026 Teed. Made with care for organizers everywhere.
        </p>
      </div>
    </footer>
  );
}
