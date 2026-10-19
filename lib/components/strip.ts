/**
 * The "Components" strip on /for/golf-simulators: one card per category, in
 * the canonical order, linking to the @teed reference bag when it exists, else
 * to the category's blog post when that exists, else not shown at all.
 *
 * Server only. Returns [] on any error so the page still renders.
 */

import { createClient } from '@supabase/supabase-js';
import { getPostBySlug } from '../blog';
import { getAllComponentCategoryMeta, type ComponentCategoryMeta } from './index';

export const HOUSE_HANDLE = 'teed';

export interface ComponentStripCard {
  slug: ComponentCategoryMeta['slug'];
  label: string;
  /** First sentence of the category description. */
  blurb: string;
  href: string;
  kind: 'bag' | 'guide';
  /** Items in the reference bag (bag cards only). */
  itemCount?: number;
}

type BagRow = { code: string; items: { id: string }[] | null };

function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : text).trim();
}

/** Codes of the house-account reference bags that are public and not hidden, with their item counts. */
async function fetchHouseBags(codes: string[]): Promise<Map<string, number>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const found = new Map<string, number>();
  if (!url || !key || !codes.length) return found;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('bags')
    .select(
      `
      code,
      owner:profiles!bags_owner_id_fkey!inner(handle),
      items:bag_items!bag_items_bag_id_fkey(id)
    `
    )
    .eq('owner.handle', HOUSE_HANDLE)
    .eq('is_public', true)
    .eq('is_hidden', false)
    .in('code', codes);

  if (error || !data) return found;
  for (const row of data as unknown as BagRow[]) {
    found.set(row.code, (row.items || []).length);
  }
  return found;
}

export async function getComponentStripCards(): Promise<ComponentStripCard[]> {
  const metas = getAllComponentCategoryMeta();
  let bags = new Map<string, number>();
  try {
    bags = await fetchHouseBags(metas.map((m) => m.bagCode));
  } catch {
    bags = new Map();
  }

  const cards: ComponentStripCard[] = [];
  for (const meta of metas) {
    const base = { slug: meta.slug, label: meta.label, blurb: firstSentence(meta.description) };
    if (bags.has(meta.bagCode)) {
      cards.push({ ...base, href: `/u/${HOUSE_HANDLE}/${meta.bagCode}`, kind: 'bag', itemCount: bags.get(meta.bagCode) });
      continue;
    }
    let post: ReturnType<typeof getPostBySlug> = null;
    try {
      post = getPostBySlug(meta.blogSlug);
    } catch {
      post = null;
    }
    if (post && !post.meta.draft) {
      cards.push({ ...base, href: `/blog/${meta.blogSlug}`, kind: 'guide' });
    }
    // Neither exists yet: the card is hidden rather than linking to a 404.
  }
  return cards;
}
