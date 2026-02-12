import Link from 'next/link';
import type { BlogPostMeta } from '@/lib/blog/types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/blog/types';

interface PostCardProps {
  post: BlogPostMeta;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-default)] hover:shadow-[var(--shadow-2)] transition-all"
    >
      {post.heroImage && (
        <div className="h-[180px] relative overflow-hidden bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--sky-3)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.heroImage}
            alt={post.heroImageAlt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      {!post.heroImage && (
        <div className="h-[180px] bg-gradient-to-br from-[var(--teed-green-3)] to-[var(--evergreen-4)] flex items-center justify-center">
          <span className="text-4xl opacity-30">📝</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">{post.readingTime}</span>
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--teed-green-9)] transition-colors leading-snug mb-1">
          {post.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{post.description}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>{post.author}</span>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </div>
    </Link>
  );
}
