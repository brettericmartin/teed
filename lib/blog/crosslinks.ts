import { getAllPosts } from './index';
import type { BlogPostMeta } from './types';

/**
 * Maps use-case page slugs to relevant blog post tags/slugs.
 * Used to show "Related Articles" on /for/[useCase] pages.
 */
const useCaseToBlogTags: Record<string, string[]> = {
  golfers: ['golf', 'golf bags'],
  photographers: ['photography', 'camera gear'],
  creators: ['creators', 'creator tools', 'affiliate links', 'monetization'],
  travelers: ['travel', 'travel gear'],
  outdoors: ['outdoors', 'outdoor gear'],
  tech: ['tech', 'tech gear'],
  musicians: ['music', 'music gear'],
  fitness: ['fitness', 'fitness gear'],
};

/**
 * Maps comparison page slugs to relevant blog post slugs/tags.
 */
const comparisonToBlogSlugs: Record<string, string[]> = {
  linktree: ['embed-your-collection-anywhere', 'best-affiliate-link-tools-for-creators'],
  'amazon-lists': ['whats-in-my-bag-complete-guide', 'best-affiliate-link-tools-for-creators'],
  notion: ['teed-vs-spreadsheets'],
  spreadsheets: ['teed-vs-spreadsheets'],
};

/**
 * Get blog posts relevant to a use-case page.
 */
export function getPostsForUseCase(useCaseSlug: string, limit = 3): BlogPostMeta[] {
  const tags = useCaseToBlogTags[useCaseSlug] || [];
  const allPosts = getAllPosts();

  // Score posts by how many matching tags they have
  const scored = allPosts.map((post) => {
    let score = 0;
    for (const tag of tags) {
      if (post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) score += 2;
      if (post.keywords.some((k) => k.toLowerCase().includes(tag.toLowerCase()))) score += 1;
    }
    // Boost guides for use-case pages
    if (post.category === 'guide') score += 1;
    if (post.category === 'showcase') score += 1;
    return { post, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}

/**
 * Get blog posts relevant to a comparison page.
 */
export function getPostsForComparison(comparisonSlug: string, limit = 3): BlogPostMeta[] {
  const directSlugs = comparisonToBlogSlugs[comparisonSlug] || [];
  const allPosts = getAllPosts();

  // Direct slug matches first
  const direct = directSlugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter((p): p is BlogPostMeta => !!p);

  if (direct.length >= limit) return direct.slice(0, limit);

  // Fill with comparison-category posts
  const remaining = allPosts
    .filter((p) => p.category === 'comparison' && !direct.some((d) => d.slug === p.slug))
    .slice(0, limit - direct.length);

  return [...direct, ...remaining];
}
