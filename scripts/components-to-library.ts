/**
 * Merge every qualified simulator component into lib/productLibrary/data/golf.json
 * so the quick-add recognises each product by name.
 *
 * Source: content/components/<category>.json via lib/components (the same files
 * the bag seed reads). Shape: lib/productLibrary/schema.ts Product, nested under
 * its BrandCatalog. Subcategory comes from the category metadata
 * (hitting-mat, turf, projector, computer, launch-monitor, enclosure; software
 * entries get "sim-software"). Keywords from name, brand and subtype; msrp from
 * price.amount; productUrl from direct_url (else fallback_url); imageUrl only
 * when image_url is https and answers 200 (--check-images, or any real run).
 *
 * Idempotent by brand + name (case-insensitive): an existing product is left
 * alone unless --update is passed, and then only entries this script created
 * (specifications.component_category is set) are refreshed. Existing entries
 * are never reordered or reformatted: the file round-trips byte for byte
 * through JSON.stringify(..., null, 2) with CRLF, so appending is the only
 * visible change. productCount / variantCount / lastUpdated are recomputed.
 *
 * Usage (from the repo root):
 *   npx tsx scripts/components-to-library.ts                     all categories, writes golf.json
 *   npx tsx scripts/components-to-library.ts --category turf
 *   npx tsx scripts/components-to-library.ts --file path.json
 *   npx tsx scripts/components-to-library.ts --fixture --dry-run   prints what would be added, no write
 *   ... --update          refresh msrp / productUrl / lastUpdated on entries this script created
 *   ... --check-images    verify image URLs during a dry run
 *
 * No env, no database. The only side effect is the JSON file.
 */

import fs from 'fs';
import path from 'path';
import {
  COMPONENTS_DIR,
  COMPONENT_CATEGORIES,
  getComponentCategories,
  getComponentCategory,
  loadComponentCategoryFile,
  tierThenMentions,
  SEEDABLE_TIERS,
  type ComponentCategoryFile,
  type ComponentCategoryMeta,
  type ComponentProduct,
  type ComponentSoftware,
} from '../lib/components';
import { verifiedHttpsUrl } from '../lib/components/urlIsLive';
import type { BrandCatalog, Product, ProductLibrary } from '../lib/productLibrary/schema';

const LIBRARY_PATH = path.join(process.cwd(), 'lib', 'productLibrary', 'data', 'golf.json');

type Args = { dryRun: boolean; update: boolean; checkImages: boolean; category?: string; file?: string };

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, update: false, checkImages: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--update') args.update = true;
    else if (a === '--check-images') args.checkImages = true;
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
// Mapping (pure)
// =============================================================================

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = norm(s);
    if (!s.trim() || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

type Entry = ComponentProduct | ComponentSoftware;

function subcategoryFor(meta: ComponentCategoryMeta, p: Entry): string {
  return 'pricing_model' in p ? 'sim-software' : meta.librarySubcategory;
}

function keywordsFor(meta: ComponentCategoryMeta, p: Entry): string[] {
  const subtype = 'subtype' in p && p.subtype ? p.subtype : 'software';
  const subtypeWords = 'pricing_model' in p ? 'simulator software' : subtype.replace(/-/g, ' ');
  const categoryWords = meta.label.toLowerCase();
  return uniq([
    `${p.brand} ${p.name}`,
    p.name,
    `${p.brand} ${subtypeWords}`,
    `${p.brand} ${categoryWords}`,
    `${p.name} ${categoryWords}`,
    `${subtypeWords} golf simulator`,
    `${p.brand} golf simulator ${subtypeWords}`,
  ].map((s) => s.toLowerCase()));
}

/** The year the research read the price, or the maker's release year when the specs carry one. */
function releaseYearFor(p: Entry, file: ComponentCategoryFile): number {
  const fromSpecs = p.specs.release_year;
  if (typeof fromSpecs === 'number' && fromSpecs > 1990) return fromSpecs;
  return Number(file.read_date.slice(0, 4));
}

function toProduct(meta: ComponentCategoryMeta, file: ComponentCategoryFile, p: Entry, imageUrl: string | null): Product {
  const id = `${slugify(p.brand)}-${slugify(p.name)}`;
  const subcategory = subcategoryFor(meta, p);
  const productUrl = p.direct_url || p.fallback_url || undefined;
  const specifications: Product['specifications'] = {
    ...p.specs,
    component_category: file.category,
    component_subtype: 'subtype' in p && p.subtype ? p.subtype : 'software',
    component_tier: p.tier,
    mention_count: p.mention_count,
  };
  if ('pricing_model' in p) {
    specifications.pricing_model = p.pricing_model;
    if (p.price_period) specifications.price_period = p.price_period;
    if (p.platform) specifications.platform = p.platform;
  }
  if (p.price) specifications.price_read_on = p.price.read_on;

  return {
    id,
    name: p.name,
    brand: p.brand,
    category: 'golf',
    subcategory,
    releaseYear: releaseYearFor(p, file),
    msrp: p.price?.amount,
    // Nothing invented: the visual signature stays empty until someone looks at the product.
    visualSignature: { primaryColors: [], patterns: [], designCues: [], distinguishingFeatures: [] },
    referenceImages: { primary: imageUrl || '' },
    specifications,
    variants: [{ sku: id, variantName: 'Standard', specifications: {}, availability: 'current' }],
    searchKeywords: keywordsFor(meta, p),
    aliases: uniq([p.name, `${p.brand} ${p.name}`]),
    productUrl,
    description: p.who_its_for || undefined,
    features: p.pros.length ? [...p.pros] : undefined,
    lastUpdated: `${file.read_date}T00:00:00.000Z`,
    source: 'manual',
    dataConfidence: p.tier === 'core' ? 75 : 65,
  };
}

function findBrand(library: ProductLibrary, brand: string): BrandCatalog | undefined {
  const key = norm(brand);
  return library.brands.find((b) => norm(b.name) === key || (b.aliases || []).some((a) => norm(a) === key));
}

function findProduct(catalog: BrandCatalog, name: string): Product | undefined {
  const key = norm(name);
  return catalog.products.find((p) => norm(p.name) === key || (p.aliases || []).some((a) => norm(a) === key));
}

function recount(library: ProductLibrary): void {
  library.productCount = library.brands.reduce((n, b) => n + b.products.length, 0);
  library.variantCount = library.brands.reduce((n, b) => n + b.products.reduce((m, p) => m + p.variants.length, 0), 0);
}

// =============================================================================
// Merge
// =============================================================================

type Plan = {
  add: { brand: string; newBrand: boolean; product: Product; entry: Entry }[];
  update: { brand: string; product: Product; entry: Entry }[];
  skip: { brand: string; name: string; reason: string }[];
};

async function planMerge(library: ProductLibrary, files: ComponentCategoryFile[], args: Args): Promise<Plan> {
  const plan: Plan = { add: [], update: [], skip: [] };
  const verify = !args.dryRun || args.checkImages;
  // Brands this run adds, so two products of one new brand share one catalog.
  const pendingBrands = new Set<string>();

  for (const file of files) {
    const meta = COMPONENT_CATEGORIES[file.category];
    const entries: Entry[] = [...file.products, ...(file.software || [])].filter((p) => SEEDABLE_TIERS.has(p.tier)).sort(tierThenMentions);
    for (const entry of entries) {
      const catalog = findBrand(library, entry.brand);
      const existing = catalog ? findProduct(catalog, entry.name) : undefined;
      if (existing) {
        const ours = typeof existing.specifications?.component_category === 'string';
        if (args.update && ours) {
          const imageUrl = verify ? await verifiedHttpsUrl(entry.image_url) : null;
          plan.update.push({ brand: catalog!.name, product: toProduct(meta, file, entry, imageUrl), entry });
        } else {
          plan.skip.push({ brand: catalog!.name, name: entry.name, reason: ours ? 'already present (pass --update to refresh)' : 'already present (not created by this script)' });
        }
        continue;
      }
      const imageUrl = verify ? await verifiedHttpsUrl(entry.image_url) : null;
      if (!verify && entry.image_url && /^https:\/\//i.test(entry.image_url)) {
        console.log(`  image not checked in dry run (pass --check-images): ${entry.brand} ${entry.name}`);
      }
      const brandName = catalog?.name || entry.brand;
      const newBrand = !catalog && !pendingBrands.has(norm(entry.brand));
      if (!catalog) pendingBrands.add(norm(entry.brand));
      plan.add.push({ brand: brandName, newBrand, product: toProduct(meta, file, entry, imageUrl), entry });
    }
  }
  return plan;
}

function applyPlan(library: ProductLibrary, plan: Plan, stamp: string): void {
  for (const { brand, product, entry } of plan.add) {
    let catalog = findBrand(library, brand);
    if (!catalog) {
      catalog = {
        name: brand,
        aliases: [],
        website: originOf(entry.direct_url),
        products: [],
        lastUpdated: stamp,
      };
      library.brands.push(catalog); // appended, never inserted, so nothing above it moves
    }
    catalog.products.push(product);
    catalog.lastUpdated = stamp;
  }
  for (const { brand, product } of plan.update) {
    const catalog = findBrand(library, brand)!;
    const index = catalog.products.findIndex((p) => norm(p.name) === norm(product.name));
    const current = catalog.products[index];
    // Refresh only what research can change; keep the id and anything a human may have edited.
    catalog.products[index] = {
      ...current,
      msrp: product.msrp,
      productUrl: product.productUrl,
      specifications: { ...current.specifications, ...product.specifications },
      searchKeywords: uniq([...current.searchKeywords, ...product.searchKeywords]),
      referenceImages: product.referenceImages.primary ? product.referenceImages : current.referenceImages,
      features: product.features || current.features,
      description: product.description || current.description,
      lastUpdated: product.lastUpdated,
    };
    catalog.lastUpdated = stamp;
  }
  recount(library);
  library.lastUpdated = stamp;
}

function readLibrary(): { library: ProductLibrary; crlf: boolean } {
  const raw = fs.readFileSync(LIBRARY_PATH, 'utf-8');
  return { library: JSON.parse(raw) as ProductLibrary, crlf: raw.includes('\r\n') };
}

function writeLibrary(library: ProductLibrary, crlf: boolean): void {
  let text = JSON.stringify(library, null, 2) + '\n';
  if (crlf) text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(LIBRARY_PATH, text, 'utf-8');
}

function selectFiles(args: Args): ComponentCategoryFile[] {
  if (args.file) return [loadComponentCategoryFile(args.file)];
  if (args.category) {
    const file = getComponentCategory(args.category);
    if (!file) throw new Error(`No content/components/${args.category}.json (or the slug is not one of the six categories).`);
    return [file];
  }
  const files = getComponentCategories();
  if (!files.length) throw new Error(`No category files in ${COMPONENTS_DIR} (files starting with "_" are skipped; use --fixture or --file).`);
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = selectFiles(args);
  const { library, crlf } = readLibrary();
  const before = { brands: library.brands.length, products: library.productCount, variants: library.variantCount };

  const plan = await planMerge(library, files, args);

  console.log(`golf.json before: ${before.brands} brands, ${before.products} products, ${before.variants} variants`);
  for (const a of plan.add) {
    console.log(`  + ${a.product.brand} ${a.product.name}  [${a.product.subcategory}${a.newBrand ? ', new brand' : ''}]  msrp ${a.product.msrp ?? 'none'}  url ${a.product.productUrl || 'none'}  image ${a.product.referenceImages.primary || 'none'}`);
  }
  for (const u of plan.update) console.log(`  ~ ${u.product.brand} ${u.product.name}  (refresh)`);
  for (const s of plan.skip) console.log(`  = ${s.brand} ${s.name}  ${s.reason}`);

  if (args.dryRun) {
    const newBrands = plan.add.filter((a) => a.newBrand).length;
    console.log(`\n[dry run] would add ${plan.add.length} product(s) (${newBrands} new brand(s)), refresh ${plan.update.length}, skip ${plan.skip.length}. golf.json not written.`);
    if (plan.add.length) {
      console.log('first entry as it would be written:');
      console.log(JSON.stringify(plan.add[0].product, null, 2).replace(/^/gm, '  '));
    }
    return;
  }

  if (!plan.add.length && !plan.update.length) {
    console.log('\nNothing to write.');
    return;
  }
  applyPlan(library, plan, new Date().toISOString());
  writeLibrary(library, crlf);
  console.log(`\nWrote ${LIBRARY_PATH}: ${library.brands.length} brands, ${library.productCount} products, ${library.variantCount} variants (added ${plan.add.length}, refreshed ${plan.update.length}).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
