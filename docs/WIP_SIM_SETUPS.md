# WIP: Golf-simulator setups section

**Started:** 2026-10-17 · **Branch:** `sim-setups-2026-10-17`

## Problem

Teed has no home for a *setup* (a whole build with grouped parts) as opposed to a bag of clubs, and no
golf-simulator surface at all. The owner wants Teed to be the reference site for home simulator builds
(every part, price paid, why chosen, history as parts change) that routes readers to stowgolf.com for
the enclosure. Two existing primitives were built but never wired into the UI: `bag_sections` and
owner-editable `bags.tags`. Separately, every canonical URL on the live site pointed at `teed.so`,
which does not resolve.

## Approach

- Canonicals: `https://teed.so` → `https://www.teed.club` everywhere (`app/*`, `lib/seo`, sitemap, RSS).
  Visible copy mentioning `teed.so/...` updated too. `hello@teed.so` in the RSS author left for the owner.
- New category value `golf-sim` ("Golf Sim") in `lib/categories.ts` + colour; roundup
  `/blog/best/golf-simulator-setups` in `lib/blog/categories.ts`; use-case page `/for/golf-simulators`
  in `lib/data/useCases.ts`; cross-links; sitemap; homepage footer link.
- Sections UI: `SectionManager` rendered in the bag editor; `ItemCard` edit form gets a Section select;
  public `PublicBagView` groups items by section (all views except carousel) via `groupItemsBySection`.
- Tags: `PUT /api/bags/[code]` accepts `tags` (normalized, ≤20); editor gets a chip input with autosave.
- Seed: `scripts/create-garage-sim-bag.ts` builds the owner's garage sim as the first `golf-sim` bag.

## Status

- [x] Canonical host fixed in code
- [x] `golf-sim` category + roundup + `/for/golf-simulators` + sitemap + footer
- [x] Section manager in editor, section select on items, grouped public view
- [x] Tags editable (API + editor)
- [x] Seed script written (links curl-verified 2026-10-17)
- [ ] Typecheck + local run (needs `.env.local` from the Vercel project)
- [ ] Seed the garage-sim bag under @brett
- [ ] Browser verification of editor + public view + /for/golf-simulators
- [x] Branch pushed (5d39c84). **Preview build FAILED: `supabaseKey is required`** at module load in 26 admin/API routes — the Vercel *Preview* environment has no env vars (this is the project's first preview deploy ever; production builds fine). Fix = owner enables the env vars for Preview in Vercel → Settings → Environment Variables, then redeploy. Not a code change on this branch.
- [ ] Owner merges after preview verification

## Files touched

`lib/categories.ts`, `lib/blog/categories.ts`, `lib/blog/crosslinks.ts`, `lib/data/useCases.ts`,
`lib/data/comparisons.ts`, `lib/types/bagViewTypes.ts`, `lib/api/domains/bags.ts`,
`app/api/bags/[code]/route.ts`, `app/u/[handle]/[code]/PublicBagView.tsx`,
`app/u/[handle]/[code]/edit/BagEditorClient.tsx`, `.../edit/components/{ItemCard,ItemList,SortableItemCard}.tsx`,
`app/sitemap.ts`, `components/home/HomeClient.tsx`, `app/{about,alternatives,blog/*,for,vs,page}.tsx`,
`scripts/create-garage-sim-bag.ts`.

## Verification

- `npx tsc --noEmit`
- Editor: create sections, assign items via the item edit form, add tags → autosave → reload persists.
- Public bag with sections shows section headings in grid/masonry/editorial/list; carousel stays flat.
- `/for/golf-simulators`, `/blog/best/golf-simulator-setups`, `/discover?category=golf-sim` render.
- Canonical `<link>` on any page starts with `https://www.teed.club`.

## Week 1 (2026-10-19, branch `teed-setups-w1`, worktree `C:\Users\brett\dev\teed-w1`)

Council memo 2026-10-18 ("Sim Setups"), build-sequence row 1. Ships on `npx tsc --noEmit`
alone; nothing browser-verified (no `.env.local`, Vercel Preview has no env vars). Full list of
files and what still needs a running app: `docs/WEEK1_2026-10-19.md`.

- `lib/disclosure.ts` (the one sentence, `isOwnedBrand`), `lib/outbound.ts` (`stowgolfUrl()` with
  `utm_source=teed&utm_medium=bag&utm_campaign=<code>&ref=TEED-<CODE>`), `lib/bags/totals.ts`
  (`computeTotals`: paid / yearly / unpriced; "paid" and "list", never "total cost"),
  `scripts/check-totals.ts` fixture test (`npx tsx scripts/check-totals.ts`).
- Public bag: List is the default for `golf-sim` bags or any sectioned bag; section headers carry a
  subtotal and a 3-px tint rule (`lib/sectionTints.ts`); bag total in the header meta row; the
  List row has a price cell, spec pairs, why-chosen with the evergreen rule, collapsed notes, the
  exit "{verb} · {domain}", "+1 link", and the disclosure line under StowGolf items; the modal
  shows the disclosure and (golf-sim only) makes the retailer exit the primary button.
- Bag-level `links` (kind `source` = "Source:" line, others = "Read" row) are fetched and rendered.
- Seed amended per copy-bank T1/T3 (subscriptions as yearly `specs`, StowGolf `list_price` /
  `founders_price` / dimensions, every stowgolf.com URL via `stowgolfUrl()`, `--dry-run`).
- Discover writes category / tags / search / sort to the URL; `/discover?category=golf-sim` is
  filtered server-side on first paint.
- `/for/golf-simulators`: T4 copy, five FAQs, real setups under the hero (`SetupCard`), honest
  closing block, `SiteFooter` on `/for/*`, nav `whitespace-nowrap`.

### Worktree rule

Every build branch runs in its own git worktree (`git worktree add ../teed-w<N> -b <branch>`).
The main checkout at `C:\Users\brett\dev\teed` is shared with other agents and flipped branches
mid-session on 2026-10-18; two agents in one working tree lose edits. Merge order:
`sim-setups-2026-10-17` -> `teed-fixes-2026-10-18` -> `teed-setups-w1` -> one branch per week.

### Metadata: prefixed tags now, `setup_meta` proposed after day 30

For the 30-day test the setup metadata (budget tier, room W x H x D, source credit, reviewed
date) is carried as prefixed tags (`budget:`, `room:`, `build:`, `fit:`, `source:`, week 2 renders
them as chips and hides them from the `#tag` row). A `bags.setup_meta` jsonb column is
**proposed, after day 30**, only if the test passes. The seed does not carry the prefixed tags yet.

### Still open after week 1

- [ ] Run the seed with `.env.local` (`npx tsx scripts/create-garage-sim-bag.ts`); dry run works.
- [ ] Brett's two facts: the mat (maker, size, price) and the BenQ price paid, or "owned before the
      build, price not recorded".
- [ ] Vercel Preview env vars, then browser verification of the List row at 390 px, the modal, the
      `/for/golf-simulators` fetch and Discover's URL state.
- [ ] Week 2: metadata chips, seed framework (`scripts/setups/_lib.ts`), first permissioned DIY bag,
      "Start from the sim template", fork keeps sections, Playwright spec.
