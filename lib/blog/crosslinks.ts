import { getAllPosts } from './index';
import type { BlogPostMeta } from './types';
import { COMPONENT_CATEGORIES } from '../components';

/**
 * Maps use-case page slugs to relevant blog post tags/slugs.
 * Used to show "Related Articles" on /for/[useCase] pages.
 */
const useCaseToBlogTags: Record<string, string[]> = {
  golfers: ['golf', 'golf bags'],
  'golf-simulators': ['golf simulator', 'simulator', 'launch monitor', 'golf sim'],
  photographers: ['photography', 'camera gear'],
  creators: ['creators', 'creator tools', 'affiliate links', 'monetization'],
  travelers: ['travel', 'travel gear'],
  outdoors: ['outdoors', 'outdoor gear'],
  tech: ['tech', 'tech gear'],
  musicians: ['music', 'music gear'],
  fitness: ['fitness', 'fitness gear'],
};

/**
 * Direct blog slugs per use-case page, shown before the tag-scored fill.
 *
 * TODO(components): the six golf-simulator component guides go here. The slugs
 * are already defined (lib/components COMPONENT_CATEGORIES[*].blogSlug:
 * golf-simulator-hitting-mats, -turf, -projectors, -computers, -launch-monitors,
 * -enclosures) but no post exists yet; a slug with no file is skipped, so this
 * list is safe to leave in place until the posts land under content/blog/.
 */
const useCaseToBlogSlugs: Record<string, string[]> = {
  'golf-simulators': Object.values(COMPONENT_CATEGORIES).map((meta) => meta.blogSlug),
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

  // Direct slugs first (only those that exist as posts), then the tag-scored fill.
  const direct = (useCaseToBlogSlugs[useCaseSlug] || [])
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter((p): p is BlogPostMeta => !!p);
  if (direct.length >= limit) return direct.slice(0, limit);

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

  const fill = scored
    .filter((s) => s.score > 0 && !direct.some((d) => d.slug === s.post.slug))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit - direct.length))
    .map((s) => s.post);

  return [...direct, ...fill];
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
