import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { BlogPostMeta } from './types';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function parseMdxFile(filePath: string): { meta: BlogPostMeta; content: string } | null {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const stats = readingTime(content);
  const slug = path.basename(filePath, '.mdx');

  const meta: BlogPostMeta = {
    slug,
    title: data.title || slug,
    description: data.description || '',
    publishedAt: data.publishedAt || new Date().toISOString(),
    updatedAt: data.updatedAt,
    author: data.author || 'Teed',
    category: data.category || 'guide',
    tags: data.tags || [],
    keywords: data.keywords || [],
    heroImage: data.heroImage,
    heroImageAlt: data.heroImageAlt,
    readingTime: stats.text,
    draft: data.draft ?? false,
    showcaseBag: data.showcaseBag,
    relatedSlugs: data.relatedSlugs,
  };

  return { meta, content };
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    const result = parseMdxFile(path.join(BLOG_DIR, file));
    if (result && !result.meta.draft) {
      posts.push(result.meta);
    }
  }

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): { meta: BlogPostMeta; content: string } | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return parseMdxFile(filePath);
}

export function getPostsByCategory(category: BlogPostMeta['category']): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    post.tags.forEach((t) => tags.add(t));
  }
  return Array.from(tags).sort();
}

export function getAllCategories(): BlogPostMeta['category'][] {
  const cats = new Set<BlogPostMeta['category']>();
  for (const post of getAllPosts()) {
    cats.add(post.category);
  }
  return Array.from(cats);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const post = getPostBySlug(slug);
  if (!post) return [];

  // First try explicit related slugs
  if (post.meta.relatedSlugs?.length) {
    const related = post.meta.relatedSlugs
      .map((s) => getPostBySlug(s)?.meta)
      .filter((p): p is BlogPostMeta => !!p)
      .slice(0, limit);
    if (related.length >= limit) return related;
  }

  // Fall back to same category
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.category === post.meta.category)
    .slice(0, limit);
}
