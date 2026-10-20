import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-sm font-medium text-[var(--text-tertiary)] mb-3">404</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
          That page isn&apos;t on Teed.
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          The link may be old, the bag may be private, or the handle may have changed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/discover"
            className="inline-block px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-semibold rounded-[var(--radius-lg)] transition-colors"
          >
            Discover bags
          </Link>
          <Link
            href="/blog"
            className="inline-block px-6 py-3 bg-[var(--surface)] text-[var(--text-primary)] font-semibold rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--teed-green-6)] transition-colors"
          >
            Read the blog
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
