/**
 * Loader for the golf-simulator components knowledge base.
 *
 * Reads content/components/<category>.json at build time (Node only: fs), checks
 * the shape against lib/components/types.ts and caches the result. Files whose
 * name starts with "_" (the fixture, drafts) are skipped; scripts can load one
 * of those explicitly with `loadComponentCategoryFile(path)`.
 *
 * Doctrine reminders that live in code so they cannot drift: no rankings, no
 * "best"; sections are sub-shapes or price tiers only; the StowGolf entry
 * carries the DISCLOSURE sentence verbatim.
 */

import fs from 'fs';
import path from 'path';
import { DISCLOSURE, isOwnedBrand } from '../disclosure';
import {
  COMPONENT_CATEGORY_SLUGS,
  type ComponentCategoryFile,
  type ComponentCategoryMeta,
  type ComponentCategorySlug,
  type ComponentProduct,
  type ComponentSoftware,
  type ComponentSource,
} from './types';

export * from './types';

export const COMPONENTS_DIR = path.join(process.cwd(), 'content', 'components');

/** Price bands used by every category that sections by tier (USD, inclusive upper bounds). */
const LAUNCH_MONITOR_TIERS = [
  { label: 'Under $700', max: 700 },
  { label: '$700 to $2,000', max: 2000 },
  { label: '$2,000 to $6,000', max: 6000 },
  { label: 'Over $6,000' },
];

/**
 * Category metadata, keyed by slug. Order here is the display order on
 * /for/golf-simulators and in docs.
 */
export const COMPONENT_CATEGORIES: Record<ComponentCategorySlug, ComponentCategoryMeta> = {
  'hitting-mats': {
    slug: 'hitting-mats',
    label: 'Hitting mats',
    title: 'Hitting mats for a home sim, as people actually buy them',
    description:
      'The mats that come up again and again in sim-build threads: full-stance and strip mats, tee-strip and fairway inserts, and the ones launch monitors read cleanly. Each entry lists the list price with the date it was read, the specs the maker publishes, what people like and what they complain about, and one thread worth reading before you buy.',
    bagCode: 'sim-hitting-mats',
    blogSlug: 'golf-simulator-hitting-mats',
    sectionsBy: 'subtype',
    librarySubcategory: 'hitting-mat',
  },
  turf: {
    slug: 'turf',
    label: 'Turf',
    title: 'Turf for a home sim, as people actually buy it',
    description:
      'Landing turf, surround turf and putting turf by pile height, the rubber underlay people put beneath it, and the roll-versus-tile choice. Each entry lists the list price with the date it was read, the specs the maker publishes, what people like and what they complain about, and one thread worth reading before you buy.',
    bagCode: 'sim-turf',
    blogSlug: 'golf-simulator-turf',
    sectionsBy: 'subtype',
    librarySubcategory: 'turf',
  },
  projectors: {
    slug: 'projectors',
    label: 'Projectors',
    title: 'Projectors for a home sim, as people actually buy them',
    description:
      'Short-throw, ultra-short-throw and standard-throw projectors people mount in sim rooms, with off-centre mounting (lens shift and offset) called out because most rooms cannot put the projector on the centre line. Each entry lists the list price with the date it was read, throw ratio, lumens and resolution from the maker, and one thread worth reading before you buy.',
    bagCode: 'sim-projectors',
    blogSlug: 'golf-simulator-projectors',
    sectionsBy: 'subtype',
    librarySubcategory: 'projector',
  },
  computers: {
    slug: 'computers',
    label: 'Computers',
    title: 'Computers that run a home sim, as people actually buy them',
    description:
      'Gaming laptops, prebuilt desktops and mini PCs that people run GSPro, E6 and TGC on, the minimum specs each simulator publishes, and the no-PC path from a phone or tablet to a TV. Software is listed with its yearly cost, because that is the line most build guides leave off the total.',
    bagCode: 'sim-computers',
    blogSlug: 'golf-simulator-computers',
    sectionsBy: 'subtype',
    librarySubcategory: 'computer',
  },
  'launch-monitors': {
    slug: 'launch-monitors',
    label: 'Launch monitors',
    title: 'Launch monitors for a home sim, as people actually buy them',
    description:
      'Radar units that sit behind the ball, camera units that sit beside it, and overhead systems, grouped by price. Each entry lists the room depth it forces, the subscription it needs for third-party software, the list price with the date it was read, and one thread worth reading before you buy.',
    bagCode: 'sim-launch-monitors',
    blogSlug: 'golf-simulator-launch-monitors',
    sectionsBy: 'tier',
    priceTiers: LAUNCH_MONITOR_TIERS,
    librarySubcategory: 'launch-monitor',
  },
  enclosures: {
    slug: 'enclosures',
    label: 'Enclosures',
    title: 'Enclosures for a home sim, as people actually buy them',
    description:
      'Net cages, freestanding fold-flat bays, fixed frames and kits, DIY pipe-and-drape builds and retractable roller screens, with a note on what a custom room build costs when a local builder does it. Each entry lists the list price with the date it was read, the footprint it needs, what people like and what they complain about, and one thread worth reading before you buy.',
    bagCode: 'sim-enclosures',
    blogSlug: 'golf-simulator-enclosures',
    sectionsBy: 'subtype',
    librarySubcategory: 'enclosure',
  },
};

export function isComponentCategorySlug(value: unknown): value is ComponentCategorySlug {
  return typeof value === 'string' && (COMPONENT_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getComponentCategoryMeta(slug: string): ComponentCategoryMeta | null {
  return isComponentCategorySlug(slug) ? COMPONENT_CATEGORIES[slug] : null;
}

/** Every category's metadata in display order (whether or not its data file exists yet). */
export function getAllComponentCategoryMeta(): ComponentCategoryMeta[] {
  return COMPONENT_CATEGORY_SLUGS.map((slug) => COMPONENT_CATEGORIES[slug]);
}

// =============================================================================
// Validation (hand-rolled: the repo has no schema library and the shape is small)
// =============================================================================

export class ComponentDataError extends Error {
  constructor(public readonly file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = 'ComponentDataError';
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_TYPES = new Set(['forum', 'reddit', 'review', 'video', 'retailer', 'brand']);
const TIERS = new Set(['core', 'qualified']);
const PERIODS = new Set(['monthly', 'yearly', 'lifetime']);
const PRICING_MODELS = new Set(['subscription', 'one_time', 'free']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === 'string');
}

function fail(file: string, where: string, message: string): never {
  throw new ComponentDataError(file, `${where}: ${message}`);
}

function validatePrice(file: string, where: string, v: unknown): void {
  if (v === null || v === undefined) return;
  if (!isRecord(v)) fail(file, where, 'price must be an object or null');
  if (typeof v.amount !== 'number' || !Number.isFinite(v.amount)) fail(file, where, 'price.amount must be a number');
  if (typeof v.currency !== 'string' || !v.currency) fail(file, where, 'price.currency must be a string');
  if (typeof v.read_on !== 'string' || !DATE_RE.test(v.read_on)) fail(file, where, 'price.read_on must be YYYY-MM-DD');
  if (typeof v.source_url !== 'string' || !v.source_url) fail(file, where, 'price.source_url must be a string');
}

function validateProductCommon(file: string, where: string, p: Record<string, unknown>): void {
  if (typeof p.brand !== 'string' || !p.brand.trim()) fail(file, where, 'brand is required');
  if (typeof p.name !== 'string' || !p.name.trim()) fail(file, where, 'name is required');
  if (!TIERS.has(p.tier as string)) fail(file, where, `tier must be "core" or "qualified" (got ${JSON.stringify(p.tier)})`);
  if (typeof p.mention_count !== 'number' || p.mention_count < 0) fail(file, where, 'mention_count must be a number');
  if (!isStringArray(p.mention_sources)) fail(file, where, 'mention_sources must be a string array');
  validatePrice(file, where, p.price);
  if (typeof p.direct_url !== 'string') fail(file, where, 'direct_url must be a string (empty when none)');
  for (const key of ['fallback_url', 'read_url', 'room_fit', 'who_its_for', 'image_url', 'disclosure'] as const) {
    if (p[key] !== undefined && typeof p[key] !== 'string') fail(file, where, `${key} must be a string when present`);
  }
  if (!isRecord(p.specs)) fail(file, where, 'specs must be an object');
  for (const [k, v] of Object.entries(p.specs)) {
    if (!['string', 'number', 'boolean'].includes(typeof v)) fail(file, where, `specs.${k} must be a string, number or boolean`);
  }
  for (const key of ['pros', 'cons', 'known_issues'] as const) {
    if (!isStringArray(p[key])) fail(file, where, `${key} must be a string array (may be empty)`);
  }
  if (typeof p.why_people_choose_it !== 'string') fail(file, where, 'why_people_choose_it must be a string');
  if (p.subscriptions !== undefined) {
    if (!Array.isArray(p.subscriptions)) fail(file, where, 'subscriptions must be an array');
    p.subscriptions.forEach((s, i) => {
      if (!isRecord(s)) fail(file, where, `subscriptions[${i}] must be an object`);
      if (typeof s.name !== 'string') fail(file, where, `subscriptions[${i}].name must be a string`);
      if (typeof s.amount !== 'number') fail(file, where, `subscriptions[${i}].amount must be a number`);
      if (!PERIODS.has(s.period as string)) fail(file, where, `subscriptions[${i}].period must be monthly, yearly or lifetime`);
    });
  }
  // The disclosure rule: owned brands carry the exact sentence; nothing else may carry one.
  if (isOwnedBrand(p.brand as string)) {
    if (p.disclosure !== DISCLOSURE) fail(file, where, `brand ${p.brand} must carry disclosure exactly: ${JSON.stringify(DISCLOSURE)}`);
  } else if (p.disclosure !== undefined) {
    fail(file, where, `disclosure is only for owned brands (got one on ${p.brand})`);
  }
}

function validateProduct(file: string, where: string, subtypes: string[], v: unknown): asserts v is ComponentProduct {
  if (!isRecord(v)) fail(file, where, 'product must be an object');
  validateProductCommon(file, where, v);
  if (typeof v.subtype !== 'string' || !subtypes.includes(v.subtype)) {
    fail(file, where, `subtype ${JSON.stringify(v.subtype)} is not one of the file's subtypes [${subtypes.join(', ')}]`);
  }
}

function validateSoftware(file: string, where: string, v: unknown): asserts v is ComponentSoftware {
  if (!isRecord(v)) fail(file, where, 'software entry must be an object');
  validateProductCommon(file, where, v);
  if (v.subtype !== undefined && typeof v.subtype !== 'string') fail(file, where, 'subtype must be a string when present');
  if (!PRICING_MODELS.has(v.pricing_model as string)) fail(file, where, 'pricing_model must be subscription, one_time or free');
  if (v.price_period !== undefined && !PERIODS.has(v.price_period as string)) fail(file, where, 'price_period must be monthly, yearly or lifetime');
  if (v.pricing_model === 'subscription' && v.price && !v.price_period) fail(file, where, 'a priced subscription needs price_period');
}

function validateSource(file: string, where: string, v: unknown): asserts v is ComponentSource {
  if (!isRecord(v)) fail(file, where, 'source must be an object');
  if (typeof v.url !== 'string' || !v.url) fail(file, where, 'url is required');
  if (!SOURCE_TYPES.has(v.type as string)) fail(file, where, `type must be one of ${[...SOURCE_TYPES].join(', ')}`);
  for (const key of ['title', 'date', 'what_it_says'] as const) {
    if (typeof v[key] !== 'string') fail(file, where, `${key} must be a string`);
  }
}

/** Throws ComponentDataError when `data` is not a valid category file. */
export function assertComponentCategoryFile(data: unknown, file = 'components'): asserts data is ComponentCategoryFile {
  if (!isRecord(data)) fail(file, 'root', 'must be an object');
  if (!isComponentCategorySlug(data.category)) {
    fail(file, 'category', `${JSON.stringify(data.category)} is not one of ${COMPONENT_CATEGORY_SLUGS.join(', ')}`);
  }
  if (typeof data.read_date !== 'string' || !DATE_RE.test(data.read_date)) fail(file, 'read_date', 'must be YYYY-MM-DD');
  if (!isStringArray(data.subtypes) || data.subtypes.length === 0) fail(file, 'subtypes', 'must be a non-empty string array');
  if (!Array.isArray(data.products)) fail(file, 'products', 'must be an array');
  data.products.forEach((p, i) => validateProduct(file, `products[${i}]`, data.subtypes as string[], p));
  if (data.software !== undefined) {
    if (!Array.isArray(data.software)) fail(file, 'software', 'must be an array');
    data.software.forEach((s, i) => validateSoftware(file, `software[${i}]`, s));
  }
  if (!Array.isArray(data.sources)) fail(file, 'sources', 'must be an array');
  data.sources.forEach((s, i) => validateSource(file, `sources[${i}]`, s));
  if (!isRecord(data.blog_outline)) fail(file, 'blog_outline', 'must be an object');
  if (typeof data.blog_outline.title !== 'string') fail(file, 'blog_outline.title', 'must be a string');
  if (!isStringArray(data.blog_outline.sections)) fail(file, 'blog_outline.sections', 'must be a string array');

  // Duplicate brand+name inside one file would break the seed's upsert key.
  const seen = new Set<string>();
  for (const p of [...(data.products as ComponentProduct[]), ...((data.software as ComponentSoftware[] | undefined) || [])]) {
    const key = productKey(p);
    if (seen.has(key)) fail(file, 'products', `duplicate brand + name: ${key}`);
    seen.add(key);
  }
}

/** Stable identity for a product across the seed and the library: lower-cased "brand name". */
export function productKey(p: { brand: string; name: string }): string {
  return `${p.brand} ${p.name}`.trim().replace(/\s+/g, ' ').toLowerCase();
}

// =============================================================================
// Loading
// =============================================================================

/** Load and validate one file by path (used by scripts for the `_example.json` fixture). */
export function loadComponentCategoryFile(filePath: string): ComponentCategoryFile {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ComponentDataError(filePath, `invalid JSON: ${(err as Error).message}`);
  }
  assertComponentCategoryFile(data, path.basename(filePath));
  const expected = path.basename(filePath, '.json');
  if (!expected.startsWith('_') && expected !== data.category) {
    throw new ComponentDataError(filePath, `file name "${expected}" does not match category "${data.category}"`);
  }
  if (data.sources.length < 20) {
    console.warn(`[components] ${path.basename(filePath)}: ${data.sources.length} sources (plan asks for 20 to 25 minimum)`);
  }
  return data;
}

let cache: Map<ComponentCategorySlug, ComponentCategoryFile> | null = null;

function loadAll(): Map<ComponentCategorySlug, ComponentCategoryFile> {
  if (cache) return cache;
  const map = new Map<ComponentCategorySlug, ComponentCategoryFile>();
  if (fs.existsSync(COMPONENTS_DIR)) {
    const files = fs
      .readdirSync(COMPONENTS_DIR)
      .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
      .sort();
    for (const file of files) {
      const data = loadComponentCategoryFile(path.join(COMPONENTS_DIR, file));
      map.set(data.category, data);
    }
  }
  cache = map;
  return map;
}

/** Drop the cache (scripts that write files and re-read them). */
export function resetComponentCache(): void {
  cache = null;
}

/** Every category that has a data file, in the canonical display order. */
export function getComponentCategories(): ComponentCategoryFile[] {
  const all = loadAll();
  return COMPONENT_CATEGORY_SLUGS.map((slug) => all.get(slug)).filter((f): f is ComponentCategoryFile => !!f);
}

export function getComponentCategory(slug: string): ComponentCategoryFile | null {
  if (!isComponentCategorySlug(slug)) return null;
  return loadAll().get(slug) || null;
}

export interface ComponentProductWithCategory {
  category: ComponentCategorySlug;
  meta: ComponentCategoryMeta;
  product: ComponentProduct | ComponentSoftware;
  /** True for entries from a file's `software` array. */
  isSoftware: boolean;
}

/** Every product (and software entry) across every loaded category, core tier first within a category. */
export function getAllComponentProducts(): ComponentProductWithCategory[] {
  const out: ComponentProductWithCategory[] = [];
  for (const file of getComponentCategories()) {
    const meta = COMPONENT_CATEGORIES[file.category];
    const ordered = [...file.products].sort(tierThenMentions);
    for (const product of ordered) out.push({ category: file.category, meta, product, isSoftware: false });
    for (const product of [...(file.software || [])].sort(tierThenMentions)) {
      out.push({ category: file.category, meta, product, isSoftware: true });
    }
  }
  return out;
}

/** Core before qualified, then by mention count. This is circulation order, not a ranking. */
export function tierThenMentions(a: { tier: string; mention_count: number }, b: { tier: string; mention_count: number }): number {
  if (a.tier !== b.tier) return a.tier === 'core' ? -1 : 1;
  return b.mention_count - a.mention_count;
}

/**
 * The section name a product lands in for its category: its subtype, or the
 * price band when the category sections by tier (unpriced items go to "Price not listed").
 */
export function sectionFor(meta: ComponentCategoryMeta, product: ComponentProduct | ComponentSoftware): string {
  if ('pricing_model' in product) return 'Software';
  if (meta.sectionsBy === 'subtype') return product.subtype;
  const tiers = meta.priceTiers || [];
  const amount = product.price?.amount;
  if (amount === undefined || amount === null) return 'Price not listed';
  for (const tier of tiers) {
    if (tier.max === undefined || amount <= tier.max) return tier.label;
  }
  return tiers.length ? tiers[tiers.length - 1].label : 'Price not listed';
}

/** Section names for a category file in display order (only sections that have at least one item). */
export function sectionsFor(meta: ComponentCategoryMeta, file: ComponentCategoryFile): string[] {
  const order: string[] =
    meta.sectionsBy === 'subtype'
      ? [...file.subtypes]
      : [...(meta.priceTiers || []).map((t) => t.label), 'Price not listed'];
  if (file.software?.length) order.push('Software');
  const used = new Set<string>();
  for (const p of file.products) used.add(sectionFor(meta, p));
  for (const s of file.software || []) used.add(sectionFor(meta, s));
  return order.filter((name) => used.has(name));
}
