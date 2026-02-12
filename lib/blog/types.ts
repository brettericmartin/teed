export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  updatedAt?: string;
  author: string;
  category:
    | 'philosophy'
    | 'guide'
    | 'showcase'
    | 'comparison'
    | 'build-log'
    | 'roundup';
  tags: string[];
  keywords: string[];
  heroImage?: string;
  heroImageAlt?: string;
  readingTime: string; // computed
  draft?: boolean;
  // For showcase posts
  showcaseBag?: { handle: string; code: string };
  // Cross-links
  relatedSlugs?: string[];
}

export const CATEGORY_LABELS: Record<BlogPostMeta['category'], string> = {
  philosophy: 'Philosophy',
  guide: 'Guide',
  showcase: 'Showcase',
  comparison: 'Comparison',
  'build-log': 'Build Log',
  roundup: 'Roundup',
};

export const CATEGORY_COLORS: Record<BlogPostMeta['category'], string> = {
  philosophy: 'bg-[var(--evergreen-4)] text-[var(--evergreen-11)]',
  guide: 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]',
  showcase: 'bg-[var(--sky-4)] text-[var(--sky-11)]',
  comparison: 'bg-[var(--copper-4)] text-[var(--copper-11)]',
  'build-log': 'bg-[var(--sand-4)] text-[var(--sand-11)]',
  roundup: 'bg-[var(--teed-green-3)] text-[var(--teed-green-12)]',
};
