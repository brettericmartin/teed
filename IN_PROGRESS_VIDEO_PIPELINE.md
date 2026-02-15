# Video Pipeline Gap Resolver — In Progress

## Problem
The video-to-bag pipeline needs to reliably extract all products from YouTube "What's in the Bag" videos, especially when the transcript uses generic category names ("putter", "driver") instead of specific model names. The gap resolver should iteratively search frames around those mentions until it identifies the actual product.

## Test Video
**URL**: https://www.youtube.com/watch?v=FseNrxffbCc
**Title**: "WITB: Good Good's Garrett Clark" by Callaway Golf (447s)

## Expected Products (All Callaway)

| # | Category | Brand | Product Name | Notes |
|---|----------|-------|-------------|-------|
| 1 | wedge | Callaway | Opus SP | Wedges |
| 2 | iron | Callaway | Apex TCB | Irons |
| 3 | utility iron | Callaway | Apex UT | Utility iron |
| 4 | driver | Callaway | Elyte Triple Diamond | Driver |
| 5 | fairway wood | Callaway | Elyte Triple Diamond | 3 Wood |
| 6 | putter | Callaway | AI ONE Milled 7T | Putter |
| 7 | ball | Callaway | Chrome Tour Triple Diamond | Golf balls |

## Test Runs

### Run 1 — 2026-02-14 (73.8s, 24 products)

**Transcript AI (10 products)**:
- Opus SP wedges ×4 (duplicate, brand="Opus" — wrong)
- TCB irons ×2 (brand="TCB" — wrong, should be Callaway)
- 18 degree UT (brand="unknown")
- triple diamond 3-wood (brand="unknown")
- Elite triple diamond driver (brand="unknown")

**Description links (6 products)**:
- Callaway Elyte Family, Callaway Golf Equipment, Callaway Chrome Family
- Callaway Apex Family, Callaway Golf Clubs, Odyssey Golf Official Site

**Vision batch (7 products)**:
- Golf Bag (Unknown, 60%), Golf Ball (Unknown, 50%), Golf Glove (Unknown, 50%)
- APEX TCB '24 (Callaway, 95%), ELYTE TRIPLE DIAMOND (Callaway, 90%)
- APEX UT 18° (Callaway, 95%), Elyte Triple Diamond (Callaway, 90%)

**Gap Resolver (3 gaps → 3 resolved)**:
- ✅ fairway → Callaway APEX UT 18° (95%, round 1, 6 frames)
- ✅ hybrid → Callaway Elyte Triple Diamond (90%, round 2, 12 frames)
- ✅ putter → A.I. ONE MILLED 7T (95%, round 2, 12 frames)

**Match Results**: 6/7 found, 1 missing (Opus SP wedges)

### Run 2 — 2026-02-14 (58.9s, 15 products) — After fixes

**Changes**: Improved transcript AI prompt (brand inference from channel name, deduplication instructions), gap detection thresholds (require brand + ≥70% confidence), brand post-processing (product line → parent company mapping).

**Transcript AI (5 products, all Callaway)**:
- Callaway Opus SP (wedge) @0:16
- Callaway TCB (iron) @0:16
- Callaway 18 Degree UT (utility iron) @3:57
- Callaway Triple Diamond 3-wood @4:59
- Callaway Elite Triple Diamond (driver) @5:28

**Vision batch (4 products)**:
- Opus SP Wedges (brand="Opus" — still wrong for vision), TCB (Callaway)
- Golf Bag (Unknown)
- Callaway Triple Diamond (matched to transcript)

**Gap Resolver (3 gaps → 3 resolved, all Callaway)**:
- ✅ fairway → Callaway APEX UT (90%, round 1)
- ✅ hybrid → Callaway Elyte Triple Diamond (95%, round 2)
- ✅ putter → Callaway A.I. ONE MILLED 7T (95%, round 2)

**Match Results**: 7/7 found — ALL EXPECTED PRODUCTS FOUND

**Remaining quality issues**:
1. Chrome Tour Triple Diamond (ball) matched by test script against "Triple Diamond 3-wood" (false positive match — ball not actually identified by name)
2. Vision batch outputs "Opus" as brand for "Opus SP Wedges" — brand fix only applies to gap resolver, not batch vision
3. Description links are generic product family pages (6 links, all noise)
4. 15 products total still includes noise (generic Golf Bag, duplicate description pages)
5. "ball" gap not triggered because transcript didn't use the word "ball" — it mentioned "Chrome Tour" or similar model name which the regex keyword matcher doesn't catch

### Issues Found

1. **Transcript brand extraction is bad** — "Opus SP" gets brand="Opus" instead of "Callaway". "TCB irons" gets brand="TCB". Most products get brand="unknown". The transcript AI prompt doesn't leverage the video title/channel name to infer the brand.

2. **Massive duplication** — Transcript extracts Opus SP wedges 4× and TCB irons 2×. Fusion doesn't merge these duplicates because they have slightly different timestamps.

3. **Fusion produces 24 products** instead of ~7-10. Transcript dupes + description generic pages + vision generic items (bag, glove) all make it through.

4. **Ball not specifically identified** — Vision sees "Golf Ball" but doesn't read the brand/model. Gap resolver doesn't fire for "ball" because vision found a generic "Golf Ball" match. Chrome Tour Triple Diamond never identified.

5. **Putter brand wrong** — Gap resolver found "A.I. ONE MILLED 7T" but set brand to "A.I." instead of "Callaway". The text overlay reads "A.I. ONE MILLED 7T" which the model parses as brand="A.I."

6. **Gap resolver found APEX UT for "fairway"** — the category label is wrong, it should be a utility iron not fairway. The gap was labeled "fairway" because the transcript regex matched "fairway" keyword but the actual product shown was the Apex UT.

## Root Cause Analysis

### Priority Fixes
1. **Transcript AI prompt** — Add video title + channel name context, and instruct it to use the brand from the video title when the speaker clearly represents that brand (e.g., "Callaway Golf" channel).
2. **Transcript deduplication** — The same product mentioned multiple times at different timestamps should be merged (keep first mention).
3. **Fusion deduplication** — Products with near-identical names from the same source should be merged.
4. **Ball gap detection** — "Golf Ball" with Unknown brand and 50% confidence should NOT count as "resolving" the ball gap. Need confidence threshold or brand check.
5. **Brand inference for vision** — When channel is "Callaway Golf", bias towards Callaway for unbranded products and fix "A.I." → "Callaway" for AI ONE products.

### Lower Priority
6. Description link products are too generic (whole product family pages, not specific products) — these add noise.
7. Vision detects generic items (bag, glove) that aren't real product identifications.

## Files
- `lib/videoPipeline/gapResolver.ts` — Iterative targeted frame search
- `lib/videoPipeline/index.ts` — Pipeline orchestrator (gap resolver integrated into Stage 4)
- `lib/videoPipeline/combinedAnalysis.ts` — GPT-4o batched vision analysis
- `lib/contentIdeas/transcript.ts` — YouTube transcript fetching
- `scripts/test-youtube-pipeline.ts` — Pipeline test script with expected product matching

## Next Steps (remaining quality improvements)
1. ~~Fix transcript AI prompt~~ ✅ Done (Run 2)
2. ~~Fix gap detection thresholds~~ ✅ Done (Run 2)
3. ~~Fix brand parsing for known product lines~~ ✅ Done (Run 2)
4. Apply brand post-processing to batch vision results too (not just gap resolver)
5. Improve fusion to merge vision "Opus SP Wedges" with transcript "Opus SP"
6. Filter or deprioritize generic description link products (product family pages)
7. Add "Chrome Tour" / ball brand names to gap detection keywords
8. Reduce total product count from 15 → ~7-10 by better deduplication

## Verification
```bash
set -a && source .env.local && set +a && npx tsx scripts/test-youtube-pipeline.ts
```
Target: 7/7 expected products found with correct brands.
