/**
 * Seed the six golf-simulator component reference bags on the @teed house account
 * from content/components/<category>.json (lib/components).
 *
 * One bag per category, code `sim-<category>`, category `golf-sim`, sections =
 * the file's subtypes (or price bands when the category sections by tier), one
 * item per product. Idempotent: the bag is found by (owner_id, code), sections
 * by (bag_id, name), items by (bag_id, custom_name); re-running updates in
 * place and never duplicates. Items that are in the bag but no longer in the
 * JSON are reported, and deleted only with --prune.
 *
 * Links per item: direct_url -> kind "product" "See it · <domain>";
 * fallback_url -> kind "purchase" "Also at <domain>"; read_url -> kind "review"
 * "Read · <domain>". Every stowgolf.com exit goes through stowgolfUrl() so the
 * visit carries utm_source=teed and ref=TEED-<CODE>; the StowGolf item's notes
 * start with the DISCLOSURE sentence.
 *
 * Photos: `image_url` becomes bag_items.photo_url only when it is an https URL
 * that answers 200 on the day the seed runs (HEAD, then GET on 405); otherwise
 * photo_url stays null so ItemImage's tinted fallback shows.
 *
 * Usage (from the repo root; env comes from .env.local via dotenv):
 *   npx tsx scripts/seed-components.ts                      all content/components/*.json
 *   npx tsx scripts/seed-components.ts --category turf      one category
 *   npx tsx scripts/seed-components.ts --file path.json     a staging file (e.g. the scratchpad)
 *   npx tsx scripts/seed-components.ts --fixture            content/components/_example.json
 *   ... --dry-run        print counts and the first item; no DB, no network
 *   ... --check-images   verify image URLs during a dry run (network, no DB)
 *   ... --prune          delete items no longer in the JSON
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY unless --dry-run.
 */

import path from 'path';
import dotenv from 'dotenv';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  COMPONENTS_DIR,
  COMPONENT_CATEGORIES,
  getComponentCategories,
  getComponentCategory,
  loadComponentCategoryFile,
  sectionFor,
  sectionsFor,
  tierThenMentions,
  type ComponentCategoryFile,
  type ComponentCategoryMeta,
  type ComponentProduct,
  type ComponentSoftware,
} from '../lib/components';
import { DISCLOSURE, isOwnedBrand } from '../lib/disclosure';
import { STOWGOLF_ORIGIN, stowgolfUrl } from '../lib/outbound';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const HOUSE_HANDLE = 'teed';
const HOUSE_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';
const BAG_CATEGORY = 'golf-sim';

type Args = {
  dryRun: boolean;
  checkImages: boolean;
  prune: boolean;
  category?: string;
  file?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, checkImages: false, prune: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--check-images') args.checkImages = true;
    else if (a === '--prune') args.prune = true;
    else if (a === '--fixture') args.file = path.join(COMPONENTS_DIR, '_example.json');
    else if (a === '--category') args.category = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a.startsWith('--category=')) args.category = a.slice('--category='.length);
    else if (a.startsWith('--file=')) args.file = a.slice('--file='.length);
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

// =============================================================================
// Payload (pure: JSON -> rows). Nothing here touches the network or the DB.
// =============================================================================

type SeedLink = { url: string; kind: 'product' | 'purchase' | 'review'; label: string };

type SeedItem = {
  customName: string;
  brand: string;
  section: string;
  customDescription: string | null;
  whyChosen: string | null;
  notes: string | null;
  itemType: 'physical_product' | 'software';
  specs: Record<string, string | number | boolean>;
  /** Candidate image; becomes photo_url only after verification. */
  imageUrl: string | null;
  links: SeedLink[];
};

type SeedBag = {
  code: string;
  title: string;
  description: string;
  tags: string[];
  sections: string[];
  items: SeedItem[];
};

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function isStowgolfUrl(url: string): boolean {
  try {
    return new URL(url).origin === STOWGOLF_ORIGIN;
  } catch {
    return false;
  }
}

/** stowgolf.com exits carry the Teed campaign; everything else passes through. */
function exitUrl(url: string, bagCode: string): string {
  if (!isStowgolfUrl(url)) return url;
  const u = new URL(url);
  return stowgolfUrl(`${u.pathname}${u.search}`, bagCode);
}

function buildLinks(p: ComponentProduct | ComponentSoftware, bagCode: string): SeedLink[] {
  const links: SeedLink[] = [];
  if (p.direct_url) {
    links.push({ url: exitUrl(p.direct_url, bagCode), kind: 'product', label: `See it · ${domainOf(p.direct_url)}` });
  }
  if (p.fallback_url) {
    links.push({ url: exitUrl(p.fallback_url, bagCode), kind: 'purchase', label: `Also at ${domainOf(p.fallback_url)}` });
  }
  if (p.read_url) {
    links.push({ url: p.read_url, kind: 'review', label: `Read · ${domainOf(p.read_url)}` });
  }
  return links;
}

function moneyLine(amount: number, period?: string): string {
  const n = Number.isInteger(amount) ? `$${amount.toLocaleString('en-US')}` : `$${amount.toFixed(2)}`;
  return period ? `${n} ${period}` : n;
}

/** The compact "About" that becomes bag_items.notes. Empty groups are left out. */
function buildNotes(p: ComponentProduct | ComponentSoftware): string | null {
  const lines: string[] = [];
  if (isOwnedBrand(p.brand)) lines.push(DISCLOSURE);
  if (p.pros.length) lines.push(`Pros: ${p.pros.join('; ')}`);
  if (p.cons.length) lines.push(`Cons: ${p.cons.join('; ')}`);
  if (p.known_issues.length) lines.push(`Known issues: ${p.known_issues.join('; ')}`);
  if (p.room_fit) lines.push(`Room fit: ${p.room_fit}`);
  if (p.subscriptions?.length) {
    lines.push(
      `Subscriptions: ${p.subscriptions
        .map((s) => `${s.name} ${moneyLine(s.amount, s.period)}${s.required_for ? ` (for ${s.required_for})` : ''}`)
        .join('; ')}`
    );
  }
  if ('pricing_model' in p) {
    const bits = [`Pricing: ${p.pricing_model.replace('_', ' ')}`];
    if (p.platform) bits.push(`runs on ${p.platform}`);
    if (p.minimum_pc) bits.push(`minimum PC ${p.minimum_pc}`);
    lines.push(bits.join('; '));
  }
  if (p.price) lines.push(`Price read ${p.price.read_on} from ${domainOf(p.price.source_url)}`);
  if (p.mention_count) lines.push(`Discussed in ${p.mention_count} independent sources`);
  return lines.length ? lines.join('\n') : null;
}

function buildSpecs(p: ComponentProduct | ComponentSoftware, section: string): Record<string, string | number | boolean> {
  const specs: Record<string, string | number | boolean> = { ...p.specs };
  const software = 'pricing_model' in p ? p : null;
  if (software) {
    specs.pricing_model = software.pricing_model;
    if (software.price) {
      if (software.pricing_model === 'subscription') {
        // Totals read price_amount x period as yearly money, never as a one-time purchase.
        specs.price_amount = software.price.amount;
        specs.price_period = software.price_period || 'yearly';
      } else if (software.pricing_model === 'one_time') {
        specs.list_price = software.price.amount;
      }
      specs.price_read_on = software.price.read_on;
    }
    if (software.platform) specs.platform = software.platform;
  } else if (p.price) {
    specs.list_price = p.price.amount;
    specs.price_read_on = p.price.read_on;
    if (p.price.currency && p.price.currency !== 'USD') specs.price_currency = p.price.currency;
  }
  specs.subtype = 'subtype' in p && p.subtype ? p.subtype : 'software';
  specs.tier = p.tier;
  specs.mention_count = p.mention_count;
  if (section !== specs.subtype) specs.section = section;
  return specs;
}

function buildItem(p: ComponentProduct | ComponentSoftware, meta: ComponentCategoryMeta): SeedItem {
  const section = sectionFor(meta, p);
  const image = p.image_url && /^https:\/\//i.test(p.image_url) ? p.image_url : null;
  return {
    customName: `${p.brand} ${p.name}`.trim().replace(/\s+/g, ' '),
    brand: p.brand,
    section,
    customDescription: p.who_its_for || null,
    whyChosen: p.why_people_choose_it || null,
    notes: buildNotes(p),
    itemType: 'pricing_model' in p ? 'software' : 'physical_product',
    specs: buildSpecs(p, section),
    imageUrl: image,
    links: buildLinks(p, meta.bagCode),
  };
}

function readDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function buildBag(file: ComponentCategoryFile): SeedBag {
  const meta = COMPONENT_CATEGORIES[file.category];
  const sections = sectionsFor(meta, file);
  const items: SeedItem[] = [];
  // Section order, then core before qualified, then mention count (circulation, not a ranking).
  for (const section of sections) {
    const inSection = [...file.products, ...(file.software || [])]
      .filter((p) => sectionFor(meta, p) === section)
      .sort(tierThenMentions);
    for (const p of inSection) items.push(buildItem(p, meta));
  }
  return {
    code: meta.bagCode,
    title: meta.title,
    description: `${meta.description} Prices and links were read on ${readDateLabel(file.read_date)}.`,
    tags: [`component:${file.category}`, BAG_CATEGORY, 'reference'],
    sections,
    items,
  };
}

// =============================================================================
// Image verification (network only; no DB)
// =============================================================================

async function urlIsLive(url: string): Promise<boolean> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: controller.signal });
      return res.status;
    } catch {
      return 0;
    } finally {
      clearTimeout(timer);
    }
  };
  let status = await attempt('HEAD');
  if (status === 405 || status === 403 || status === 0) status = await attempt('GET');
  return status === 200;
}

async function verifyImages(bag: SeedBag): Promise<Record<string, string | null>> {
  const photos: Record<string, string | null> = {};
  for (const item of bag.items) {
    if (!item.imageUrl) {
      photos[item.customName] = null;
      continue;
    }
    const ok = await urlIsLive(item.imageUrl);
    photos[item.customName] = ok ? item.imageUrl : null;
    if (!ok) console.warn(`  image not 200, leaving photo null: ${item.customName} (${item.imageUrl})`);
  }
  return photos;
}

// =============================================================================
// Database (service role)
// =============================================================================

async function resolveOwner(supabase: SupabaseClient): Promise<string> {
  const { data: byHandle } = await supabase.from('profiles').select('id, handle').eq('handle', HOUSE_HANDLE).maybeSingle();
  if (byHandle) {
    if (byHandle.id !== HOUSE_USER_ID) {
      throw new Error(`@${HOUSE_HANDLE} resolved to ${byHandle.id}, expected ${HOUSE_USER_ID}; refusing to seed under the wrong account.`);
    }
    return byHandle.id as string;
  }
  const { data: byId, error } = await supabase.from('profiles').select('id, handle').eq('id', HOUSE_USER_ID).maybeSingle();
  if (error || !byId) throw new Error(`House account @${HOUSE_HANDLE} (${HOUSE_USER_ID}) not found: ${error?.message || 'no row'}`);
  console.warn(`  @${HOUSE_HANDLE} not found by handle; using id ${HOUSE_USER_ID} (handle is @${byId.handle})`);
  return byId.id as string;
}

async function upsertBag(supabase: SupabaseClient, ownerId: string, bag: SeedBag): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: findError } = await supabase
    .from('bags')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('code', bag.code)
    .maybeSingle();
  if (findError) throw new Error(`bags lookup failed (${bag.code}): ${findError.message}`);

  const fields = {
    title: bag.title,
    description: bag.description,
    category: BAG_CATEGORY,
    tags: bag.tags,
    is_public: true,
  };

  if (existing) {
    const { error } = await supabase.from('bags').update(fields).eq('id', existing.id);
    if (error) throw new Error(`bags update failed (${bag.code}): ${error.message}`);
    return { id: existing.id as string, created: false };
  }
  const { data: created, error } = await supabase
    .from('bags')
    .insert({ owner_id: ownerId, code: bag.code, ...fields })
    .select('id')
    .single();
  if (error || !created) throw new Error(`bags insert failed (${bag.code}): ${error?.message}`);
  return { id: created.id as string, created: true };
}

async function upsertSections(supabase: SupabaseClient, bagId: string, names: string[]): Promise<Map<string, string>> {
  const { data: rows, error } = await supabase.from('bag_sections').select('id, name').eq('bag_id', bagId);
  if (error) throw new Error(`bag_sections lookup failed: ${error.message}`);
  const byName = new Map<string, string>((rows || []).map((r) => [r.name as string, r.id as string]));

  for (const [index, name] of names.entries()) {
    const id = byName.get(name);
    if (id) {
      const { error: upErr } = await supabase.from('bag_sections').update({ sort_index: index }).eq('id', id);
      if (upErr) throw new Error(`bag_sections update failed (${name}): ${upErr.message}`);
    } else {
      const { data: sec, error: insErr } = await supabase
        .from('bag_sections')
        .insert({ bag_id: bagId, name, sort_index: index })
        .select('id')
        .single();
      if (insErr || !sec) throw new Error(`bag_sections insert failed (${name}): ${insErr?.message}`);
      byName.set(name, sec.id as string);
    }
  }
  return byName;
}

async function replaceLinks(supabase: SupabaseClient, itemId: string, links: SeedLink[]): Promise<void> {
  const { error: delErr } = await supabase.from('links').delete().eq('bag_item_id', itemId);
  if (delErr) throw new Error(`links delete failed (${itemId}): ${delErr.message}`);
  if (!links.length) return;
  const { error: insErr } = await supabase
    .from('links')
    .insert(links.map((l) => ({ bag_item_id: itemId, url: l.url, kind: l.kind, label: l.label })));
  if (insErr) throw new Error(`links insert failed (${itemId}): ${insErr.message}`);
}

async function seedBag(supabase: SupabaseClient, ownerId: string, bag: SeedBag, prune: boolean): Promise<void> {
  console.log(`\n${bag.code}: ${bag.title}`);
  const photos = await verifyImages(bag);

  const { id: bagId, created } = await upsertBag(supabase, ownerId, bag);
  console.log(`  bag ${created ? 'created' : 'updated'} (${bagId})`);

  const sectionIds = await upsertSections(supabase, bagId, bag.sections);

  const { data: existingItems, error: itemsErr } = await supabase
    .from('bag_items')
    .select('id, custom_name')
    .eq('bag_id', bagId);
  if (itemsErr) throw new Error(`bag_items lookup failed: ${itemsErr.message}`);
  const existingByName = new Map<string, string>((existingItems || []).map((r) => [r.custom_name as string, r.id as string]));

  let inserted = 0;
  let updated = 0;
  let firstItemId: string | null = null;
  const seen = new Set<string>();

  for (const [index, item] of bag.items.entries()) {
    seen.add(item.customName);
    const row = {
      bag_id: bagId,
      section_id: sectionIds.get(item.section) || null,
      custom_name: item.customName,
      brand: item.brand,
      custom_description: item.customDescription,
      why_chosen: item.whyChosen,
      notes: item.notes,
      price_paid: null, // nobody paid it; list price lives in specs.list_price
      item_type: item.itemType,
      specs: item.specs,
      photo_url: photos[item.customName] ?? null,
      quantity: 1,
      sort_index: index + 1,
    };

    const existingId = existingByName.get(item.customName);
    let itemId: string;
    if (existingId) {
      const { error } = await supabase.from('bag_items').update(row).eq('id', existingId);
      if (error) throw new Error(`bag_items update failed (${item.customName}): ${error.message}`);
      itemId = existingId;
      updated += 1;
    } else {
      const { data: ins, error } = await supabase.from('bag_items').insert(row).select('id').single();
      if (error || !ins) throw new Error(`bag_items insert failed (${item.customName}): ${error?.message}`);
      itemId = ins.id as string;
      inserted += 1;
    }
    if (!firstItemId) firstItemId = itemId;
    await replaceLinks(supabase, itemId, item.links);
  }

  const stale = [...existingByName.entries()].filter(([name]) => !seen.has(name));
  if (stale.length) {
    if (prune) {
      const { error } = await supabase.from('bag_items').delete().in('id', stale.map(([, id]) => id));
      if (error) throw new Error(`bag_items prune failed: ${error.message}`);
      console.log(`  pruned ${stale.length} item(s) no longer in the JSON`);
    } else {
      console.warn(`  ${stale.length} item(s) in the bag are not in the JSON (pass --prune to delete): ${stale.map(([n]) => n).join(', ')}`);
    }
  }

  if (firstItemId) {
    const { data: bagRow } = await supabase.from('bags').select('hero_item_id').eq('id', bagId).single();
    if (bagRow && !bagRow.hero_item_id) {
      await supabase.from('bags').update({ hero_item_id: firstItemId }).eq('id', bagId);
    }
  }

  console.log(`  ${bag.sections.length} sections, ${inserted} items inserted, ${updated} updated. View at /u/${HOUSE_HANDLE}/${bag.code}`);
}

// =============================================================================
// Main
// =============================================================================

function selectFiles(args: Args): ComponentCategoryFile[] {
  if (args.file) return [loadComponentCategoryFile(args.file)];
  if (args.category) {
    const file = getComponentCategory(args.category);
    if (!file) {
      throw new Error(`No content/components/${args.category}.json (or the slug is not one of the six categories).`);
    }
    return [file];
  }
  const files = getComponentCategories();
  if (!files.length) throw new Error(`No category files in ${COMPONENTS_DIR} (files starting with "_" are skipped; use --fixture or --file).`);
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = selectFiles(args);
  const bags = files.map(buildBag);

  if (args.dryRun) {
    for (const bag of bags) {
      const linkCount = bag.items.reduce((n, i) => n + i.links.length, 0);
      const software = bag.items.filter((i) => i.itemType === 'software').length;
      const withImage = bag.items.filter((i) => i.imageUrl).length;
      console.log(`\n[dry run] ${bag.code}: "${bag.title}"`);
      console.log(`  tags: ${bag.tags.join(', ')}`);
      console.log(`  ${bag.sections.length} sections: ${bag.sections.join(' | ')}`);
      console.log(`  ${bag.items.length} items (${software} software), ${linkCount} links, ${withImage} candidate https image(s)`);
      if (args.checkImages && withImage) {
        const photos = await verifyImages(bag);
        console.log(`  verified images: ${Object.values(photos).filter(Boolean).length} of ${withImage}`);
      } else if (withImage) {
        console.log('  images not checked (pass --check-images)');
      }
      console.log('  first item:');
      console.log(JSON.stringify(bag.items[0], null, 2).replace(/^/gm, '    '));
    }
    console.log(`\n[dry run] ${bags.length} bag(s). No database call made.`);
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (put them in .env.local or the shell), or pass --dry-run.'
    );
    process.exit(2);
  }
  // Imported after dotenv so the lazy client sees the env; it throws a clear message when a var is missing.
  const { getSupabaseAdmin } = await import('../lib/supabaseAdmin');
  const supabase = getSupabaseAdmin();
  const ownerId = await resolveOwner(supabase);

  for (const bag of bags) {
    await seedBag(supabase, ownerId, bag, args.prune);
  }
  console.log(`\nDone: ${bags.length} bag(s) on @${HOUSE_HANDLE}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
