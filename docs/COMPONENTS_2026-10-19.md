# Components knowledge base (`components-2026-10-19`, 2026-10-19)

Scaffolding for the golf-simulator components knowledge base from the vault plan
(`02-Projects/Teed/components/00-components-plan.md`, Brett's 2026-10-19 directive). Branch
`components-2026-10-19` on top of `teed-setups-w1`, worktree `C:\Users\brett\dev\teed-w2`. One
commit per step; nothing merged, nothing touched in the database, nothing sent.

The research itself (six category JSON files with 20 to 25 sources each) is **not** on this branch.
Everything here runs against the fixture `content/components/_example.json` until the real files
land.

## The pipeline

```
research agent (one per category)
   └─ writes content/components/<category>.json        the shape in lib/components/types.ts
        │
        ├─ lib/components/index.ts                     validates at build time, caches, exposes
        │     getComponentCategories() / getComponentCategory(slug) / getAllComponentProducts()
        │
        ├─ scripts/seed-components.ts                  → six reference bags on @teed (sim-<category>)
        │
        ├─ scripts/components-to-library.ts            → lib/productLibrary/data/golf.json entries
        │                                                 (quick-add recognises the products by name)
        │
        ├─ content/blog/<blogSlug>.mdx                 one guide per category, from the template,
        │     (copy content/blog/_component-template.mdx)  embeds the bag with <BagEmbed/>
        │
        └─ /for/golf-simulators "Components" strip     cards link to the bag, else the guide, else hide
```

The category metadata (bag code, bag title and description, blog slug, whether sections are
sub-shapes or price bands, library subcategory) lives in one place:
`COMPONENT_CATEGORIES` in `lib/components/index.ts`.

| Category | Bag code | Sections | Blog slug | Library subcategory |
|---|---|---|---|---|
| hitting-mats | `sim-hitting-mats` | subtype | `golf-simulator-hitting-mats` | `hitting-mat` |
| turf | `sim-turf` | subtype | `golf-simulator-turf` | `turf` |
| projectors | `sim-projectors` | subtype | `golf-simulator-projectors` | `projector` |
| computers | `sim-computers` | subtype (+ "Software") | `golf-simulator-computers` | `computer` (`sim-software`) |
| launch-monitors | `sim-launch-monitors` | price band | `golf-simulator-launch-monitors` | `launch-monitor` |
| enclosures | `sim-enclosures` | subtype | `golf-simulator-enclosures` | `enclosure` |

Launch monitors section by price band (Under $700 · $700 to $2,000 · $2,000 to $6,000 · Over
$6,000 · Price not listed) because the plan names price tiers as that category's sub-shape; every
other category sections by its `subtypes` array, in the file's order.

## Step by step

### 1. Research JSON

Each agent writes `content/components/<category>.json` (shape and rules:
`content/components/README.md`, types: `lib/components/types.ts`). The loader throws a
`ComponentDataError` naming the file and field on any shape problem, so `npx tsc --noEmit` is not
enough to validate a data file; run either script with `--dry-run --category <slug>`.

Rules the loader enforces that the plan states: `tier` is `core` (10 or more independent sources)
or `qualified` (5 to 9); prices are `{ amount, currency, read_on, source_url }` or `null`; a
product from an owned brand (StowGolf) carries `"disclosure"` equal to `DISCLOSURE` from
`lib/disclosure.ts` and no other product may; `brand + name` is unique in a file.

### 2. Seed the reference bags

```
npx tsx scripts/seed-components.ts --dry-run                 # all files, no DB, no network
npx tsx scripts/seed-components.ts --dry-run --category turf
npx tsx scripts/seed-components.ts --fixture --dry-run       # content/components/_example.json
npx tsx scripts/seed-components.ts --file C:\path\to\staging.json --dry-run
npx tsx scripts/seed-components.ts                           # writes (needs env, see below)
npx tsx scripts/seed-components.ts --category enclosures --prune
npx tsx scripts/seed-components.ts --emit-sql --category turf --out docs/sql/sim-turf.sql
                                                             # SQL for the Supabase MCP (no env, no DB)
```

What it writes, per category, on the house account (`profiles.handle = 'teed'`, id
`2c3e503a-78ce-4a8d-ae37-60b4a16d916e`; the script refuses to run if the handle resolves to a
different id):

- `bags`: code `sim-<category>`, category `golf-sim`, title and description from the metadata
  (description ends with "Prices and links were read on <date>"), tags
  `component:<category>`, `golf-sim`, `reference`, `is_public` true. `hero_item_id` is set to the
  first item only when the bag has none.
- `bag_sections`: one per sub-shape or price band that has at least one item, `sort_index` in
  file order. Upserted by `(bag_id, name)`.
- `bag_items`: one per product. `custom_name` = `"<brand> <name>"`, `brand`,
  `custom_description` = `who_its_for`, `why_chosen` = `why_people_choose_it`, `notes` = the
  compact About (disclosure line first for StowGolf; then Pros / Cons / Known issues / Room fit /
  Subscriptions / Pricing / "Price read <date> from <domain>" / "Discussed in N independent
  sources"), `price_paid` null, `specs` = the product's specs plus `list_price`, `price_read_on`,
  `subtype`, `tier`, `mention_count` (and `section` when it differs from the subtype),
  `item_type` `physical_product`. Entries from the `software` array are `item_type` `software`
  with `specs.pricing_model`; subscriptions carry `price_amount` + `price_period` (never
  `list_price`) so `lib/bags/totals.ts` counts them per year. Upserted by `(bag_id, custom_name)`.
- `bag_items.photo_url`: `image_url` only when it is https and answers 200 on the day the seed
  runs (`lib/components/urlIsLive.ts`: HEAD, then GET on 405/403); otherwise null so `ItemImage`
  shows its tinted fallback. Dry runs skip the check unless `--check-images`.
- `links` per item (replaced on every run): `direct_url` → kind `product`, label
  `See it · <domain>`; `fallback_url` → kind `purchase`, `Also at <domain>`; `read_url` → kind
  `review`, `Read · <domain>`. Every stowgolf.com URL goes through `stowgolfUrl()` so the exit
  carries `utm_source=teed&utm_medium=bag&utm_campaign=sim-enclosures&ref=TEED-SIM-ENCLOSURES`;
  its label stays `See it · stowgolf.com`.

Re-running updates in place and never duplicates. Items in the bag that are no longer in the JSON
are listed with a warning and deleted only with `--prune`.

#### 2b. `--emit-sql`: loading a bag through the Supabase MCP

The chief has database access through the Supabase MCP but no local service-role key, so the seed
can also write the upsert path out as plain SQL instead of running it:

```
npx tsx scripts/seed-components.ts --emit-sql --category turf --out docs/sql/sim-turf.sql
npx tsx scripts/seed-components.ts --emit-sql --category turf --check-images --out docs/sql/sim-turf.sql
npx tsx scripts/seed-components.ts --emit-sql --out docs/sql/all-components.sql     # every category
npx tsx scripts/seed-components.ts --fixture --emit-sql --out docs/_fixture.sql      # smoke test, then delete
```

Needs no env and makes no database call. Without `--out` the SQL goes to stdout. `--dry-run` and
`--prune` do not combine with it.

What the file is: one PostgreSQL script, `BEGIN` ... `COMMIT`, with a `DO $seed$ ... $seed$` block
per bag that does exactly what `seedBag()` does, in the same order:

1. `SELECT id FROM profiles WHERE handle = 'teed'` into `v_owner`; `RAISE EXCEPTION` unless it equals
   `2c3e503a-78ce-4a8d-ae37-60b4a16d916e` (the same refusal as the script).
2. `bags` found by `(owner_id, code)`; insert or update `title`, `description`, `category`
   `golf-sim`, `tags` jsonb, `is_public` true, `updated_at = now()`.
3. `bag_sections` by `(bag_id, name)` with `sort_index` in file order (column names from migration 065).
4. `bag_items` by `(bag_id, custom_name)`: `section_id`, `brand`, `custom_description`,
   `why_chosen`, `notes`, `price_paid` NULL, `item_type`, `specs` jsonb, `photo_url`, `quantity` 1,
   `sort_index`.
5. `links`: `DELETE ... WHERE bag_item_id = v_item`, then one `INSERT` per item in product, purchase,
   review order (`bag_item_id`, `kind`, `url`, `label`, from migration 001; `links` has no sort
   column, so order is insertion order, as the script does). Re-runs never duplicate.
6. `hero_item_id` set to the first item only when the bag has none; items in the bag that are not
   in the JSON are counted in a `RAISE NOTICE` and never deleted (there is no `--prune` in SQL).
7. A final `SELECT` of bag code, section count, item count and link count for the bags in the file.

Every text value is dollar-quoted (`$q$...$q$`) and every JSON value is `$j$...$j$::jsonb`, so
apostrophes, newlines and backslashes in the research need no escaping; the tag is bumped
(`$q1$`) if a value happens to contain it. The whole file is one transaction: any failure rolls back
everything, and running it twice leaves the same rows.

**`--emit-sql` never checks images.** Every `photo_url` is `NULL` unless the run also passes
`--check-images`, in which case each https `image_url` is fetched and kept only on a 200 (same
rule as the write path). The header comment of the file says which of the two it was.

How the chief applies it: generate one file per category, read it, then pass its contents to the
Supabase MCP as one migration per category (`apply_migration` with a name like
`seed_sim_turf_2026_10_19`; `execute_sql` also works for a re-run). The MCP runs the statement
inside its own transaction, so Postgres may log a notice about `BEGIN` while a transaction is
already in progress; that is harmless, and the final `COMMIT` is a no-op in that case. Check the
summary row that comes back (sections, items, links) against the `[emit-sql] wrote ...` line the
script printed, then open `/u/teed/sim-<category>`. The generated `.sql` files are a build output,
not source: keep them out of the repo or delete them after they are applied.

### 3. Product-library entries

```
npx tsx scripts/components-to-library.ts --dry-run           # prints what would be added
npx tsx scripts/components-to-library.ts --fixture --dry-run
npx tsx scripts/components-to-library.ts                     # writes golf.json (no env needed)
npx tsx scripts/components-to-library.ts --update            # refresh entries this script created
```

Appends a `Product` (schema: `lib/productLibrary/schema.ts`) to the brand's catalog in
`lib/productLibrary/data/golf.json`, creating the brand catalog at the end of `brands` when it is
new. `id` = `<brand-slug>-<name-slug>`, `category` `golf`, `subcategory` from the table above,
`msrp` = `price.amount`, `productUrl` = `direct_url` else `fallback_url`,
`referenceImages.primary` = verified image or `""`, `searchKeywords` from name, brand and
sub-shape, `aliases` = name and brand + name, `specifications` = the specs plus
`component_category`, `component_subtype`, `component_tier`, `mention_count`,
`price_read_on`. `visualSignature` is left empty (nothing invented). `releaseYear` is
`specs.release_year` when the research sourced one, else the year of `read_date`. `source` is
`manual`, `dataConfidence` 75 for core and 65 for qualified.

Idempotent by brand + name (case-insensitive, aliases included); existing entries are skipped,
and `--update` refreshes only entries whose `specifications.component_category` is set. The file
round-trips byte for byte through `JSON.stringify(..., null, 2)` with CRLF, verified on
2026-10-19, so the only diff is the appended entries plus `productCount`, `variantCount` and
`lastUpdated` at the root. A fixture run added 3 products / 2 brands, re-ran as "Nothing to
write", and was reverted; the committed `golf.json` is unchanged.

### 4. Blog posts

Copy `content/blog/_component-template.mdx` to `content/blog/<blogSlug>.mdx`, fill the angle
brackets, remove `draft: true`. The template carries the frontmatter (`category: "guide"`, tags
`golf simulator` + `<category>`, keywords, `showcaseBag: { handle: "teed", code: "sim-<category>" }`)
and the section skeleton: who this is for · the sub-shapes · the products people actually buy
(`<BagEmbed handle="teed" code="sim-<category>" />`) · what the forum argues about · the costs
nobody prints · if the bay has to fold away (only where relevant) · sources. The disclosure
sentence from `lib/disclosure.ts` follows every StowGolf mention, verbatim.

`lib/blog/index.ts` now skips any `.mdx` whose name starts with `_` in `getAllPosts()` and
`getPostBySlug()`, which also covers the blog index, `[slug]` static params, the sitemap and RSS.

### 5. The Components strip and cross-links

`/for/golf-simulators` renders a "Components" section under "Setups" (`app/for/[useCase]/page.tsx`,
gated on `discoverCategory === 'golf-sim'`). `lib/components/strip.ts` builds one card per category
in order: it links to `/u/teed/sim-<category>` when that bag exists on the house account (public,
not hidden; one anon query with `profiles!inner`), else to `/blog/<blogSlug>` when that post
exists, else the card is hidden. With no env the bag check returns nothing and the strip falls
through to the guides. `components/bag/ComponentCard.tsx` reuses the `SetupCard` shell (hairline,
no shadow, hover moves the border colour); the meta line reads "N items · reference list" or
"Guide".

`lib/blog/crosslinks.ts` lists the six guide slugs for `golf-simulators` (derived from
`COMPONENT_CATEGORIES`, with a `TODO(components)` where they go). `getPostsForUseCase()` now
shows direct slugs that exist first, then the tag-scored fill; slugs with no post are skipped, so
the list is inert until the posts land.

## Environment

| Command | Needs |
|---|---|
| `npx tsc --noEmit`, both scripts with `--dry-run` | nothing |
| `seed-components.ts --dry-run --check-images`, `components-to-library.ts --dry-run --check-images` | network only |
| `seed-components.ts --emit-sql` | nothing (`--check-images` adds network); the file is applied through the Supabase MCP |
| `seed-components.ts` (write) | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (dotenv loads it) or the shell; exits 2 with a message otherwise |
| `components-to-library.ts` (write) | network for image checks; no env |
| `/for/golf-simulators` bag check at render | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as the Setups strip) |

Node is not on the sandbox PATH on this machine; from Git Bash call
`"/c/Program Files/nodejs/node.exe" node_modules/tsx/dist/cli.mjs scripts/<name>.ts ...`
(`npx.cmd` fails on the space in the path there). From PowerShell `npx tsx ...` is fine.

## Verification done on this branch

- `npx tsc --noEmit`: app code clean; the ~85 pre-existing errors are all in `tests/**` and
  `packages/mcp-server/**`, untouched.
- `scripts/seed-components.ts --fixture --dry-run`: 1 bag, 3 sections (gaming-laptop,
  prebuilt-desktop, Software), 3 items (1 software), 6 links, the http image skipped.
- `scripts/seed-components.ts --fixture --emit-sql --out docs/_fixture.sql`: one DO block, the
  same 3 sections / 3 items / 6 links, every `photo_url` NULL, multi-line notes and the apostrophe
  in "maker's page" intact inside `$q$` quotes; the file was read through and then deleted. Not run
  against the database.
- `scripts/components-to-library.ts --fixture --dry-run`: would add 3 products (2 new brands).
  A real run against the fixture appended 185 lines and removed only the three root counters;
  the second run wrote nothing; `golf.json` was then reverted.
- Blog loader: `getAllPosts()` contains no `_` slug; `getPostBySlug('_component-template')` is null;
  the template's frontmatter parses with gray-matter.

## Not done, and why

- No research files: the six `content/components/<category>.json` are the research agents' output
  and are not on this branch. The seed and the library merge have only been dry-run on the fixture.
- No database run: no `.env.local` in the worktree, and the brief says never change the database.
- Not browser-verified: the Components strip and the card have not been rendered. With no bags
  and no posts the strip hides itself, so the page should look as it did before this branch.
- The `BagEmbed` in `lib/blog/mdx-components.tsx` is the static "Featured bag" card (title is the
  code, no item photos); `components/blog/BagEmbed.tsx` (the live one, with item photos) is not
  what MDX renders. Wiring the live one into MDX is a separate change.
- Week-2 items from `docs/WIP_SIM_SETUPS.md` are untouched.
