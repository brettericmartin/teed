/**
 * An item's address inside its bag: `?item=<slug>` on the bag page.
 *
 * Items have no slug column, so the slug is derived from brand + name, with the
 * id's first block appended only when two items in the same bag would collide.
 * `findItemBySlug` also accepts a raw item id so old links keep working.
 */

interface SluggableItem {
  id: string;
  brand?: string | null;
  custom_name?: string | null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function baseSlug(item: SluggableItem): string {
  const name = (item.custom_name || '').trim();
  const brand = (item.brand || '').trim();
  const text = brand && name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`.trim();
  return slugify(text) || item.id.slice(0, 8);
}

/** Slug for one item, unique within `all` (the bag's items). */
export function itemSlug(item: SluggableItem, all: SluggableItem[]): string {
  const base = baseSlug(item);
  const clashes = all.filter((other) => other.id !== item.id && baseSlug(other) === base);
  return clashes.length > 0 ? `${base}-${item.id.slice(0, 8)}` : base;
}

export function findItemBySlug<T extends SluggableItem>(items: T[], slug: string): T | null {
  if (!slug) return null;
  return items.find((it) => itemSlug(it, items) === slug) || items.find((it) => it.id === slug) || null;
}
