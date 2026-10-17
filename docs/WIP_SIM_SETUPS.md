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
- [ ] Push branch; Vercel preview; owner merges

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
