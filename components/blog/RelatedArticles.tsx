import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { BlogPostMeta } from '@/lib/blog/types';
import { CATEGORY_LABELS } from '@/lib/blog/types';

interface RelatedArticlesProps {
  posts: BlogPostMeta[];
  heading?: string;
}

export function RelatedArticles({ posts, heading = 'Related Articles' }: RelatedArticlesProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <BookOpen className="w-5 h-5 text-[var(--teed-green-9)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{heading}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-5 hover:border-[var(--teed-green-6)] hover:shadow-[var(--shadow-2)] transition-all duration-200"
            >
              <span className="text-xs font-medium text-[var(--teed-green-10)] uppercase tracking-wider">
                {CATEGORY_LABELS[post.category]}
              </span>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mt-2 mb-2 group-hover:text-[var(--teed-green-10)] transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] line-clamp-2">{post.description}</p>
              <span className="text-xs text-[var(--text-tertiary)] mt-3 block">
                {post.readingTime}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
