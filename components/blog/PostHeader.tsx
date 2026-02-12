import Link from 'next/link';
import type { BlogPostMeta } from '@/lib/blog/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/blog/types';

interface PostHeaderProps {
  meta: BlogPostMeta;
}

export default function PostHeader({ meta }: PostHeaderProps) {
  return (
    <header className="mb-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-6">
        <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[var(--text-primary)] transition-colors">
          Blog
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate">{meta.title}</span>
      </nav>

      {/* Category badge */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[meta.category]}`}
        >
          {CATEGORY_LABELS[meta.category]}
        </span>
        <span className="text-sm text-[var(--text-tertiary)]">{meta.readingTime}</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-4">
        {meta.title}
      </h1>

      {/* Description */}
      <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
        {meta.description}
      </p>

      {/* Meta line */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-tertiary)] pb-6 border-b border-[var(--border-subtle)]">
        <span className="font-medium text-[var(--text-primary)]">{meta.author}</span>
        <span>·</span>
        <time dateTime={meta.publishedAt}>
          {new Date(meta.publishedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        {meta.updatedAt && (
          <>
            <span>·</span>
            <span>
              Updated{' '}
              {new Date(meta.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
