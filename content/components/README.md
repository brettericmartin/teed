# Golf-simulator components data

One JSON file per category, written by the research agents described in the vault plan
(`02-Projects/Teed/components/00-components-plan.md`, 2026-10-19) and read by
`lib/components/index.ts`. The files are the source of truth for the six reference bags on the
`@teed` house account, the six category blog posts, and the product-library entries that let the
quick-add recognise every qualified product by name.

## Files

| File | Category | Bag code | Blog slug |
|---|---|---|---|
| `hitting-mats.json` | Hitting mats | `sim-hitting-mats` | `golf-simulator-hitting-mats` |
| `turf.json` | Turf | `sim-turf` | `golf-simulator-turf` |
| `projectors.json` | Projectors | `sim-projectors` | `golf-simulator-projectors` |
| `computers.json` | Computers (plus a `software` array) | `sim-computers` | `golf-simulator-computers` |
| `launch-monitors.json` | Launch monitors | `sim-launch-monitors` | `golf-simulator-launch-monitors` |
| `enclosures.json` | Enclosures | `sim-enclosures` | `golf-simulator-enclosures` |

`_example.json` is a fixture of fake products for testing the scripts. **Any file whose name starts
with `_` is skipped by the loader**, so drafts can sit here as `_draft-projectors.json` until they are
ready. The file name must equal the `category` field.

## Shape

The TypeScript types in `lib/components/types.ts` are the contract; the loader validates every file
against them at build time and throws `ComponentDataError` naming the file and field. In short:

```json
{
  "category": "launch-monitors",
  "read_date": "2026-10-19",
  "subtypes": ["radar", "camera", "overhead"],
  "products": [
    {
      "brand": "Rapsodo",
      "name": "MLM2PRO",
      "subtype": "radar",
      "tier": "core",
      "mention_count": 14,
      "mention_sources": ["https://..."],
      "price": { "amount": 699, "currency": "USD", "read_on": "2026-10-19", "source_url": "https://..." },
      "direct_url": "https://rapsodo.com/...",
      "fallback_url": "https://www.amazon.com/...",
      "read_url": "https://golfsimulatorforum.com/...",
      "specs": { "technology": "radar + camera", "placement": "6 to 8 ft behind the ball", "min_room_depth_ft": 16 },
      "subscriptions": [{ "name": "Premium", "amount": 199.99, "period": "yearly", "required_for": "GSPro, E6" }],
      "room_fit": "...",
      "who_its_for": "...",
      "pros": ["..."], "cons": ["..."], "known_issues": ["..."],
      "why_people_choose_it": "one or two sentences in a builder's voice, sourced",
      "image_url": "https://... (maker's product image, if the page exposes one; else empty)"
    }
  ],
  "software": [ "computers.json only: the product shape plus pricing_model, price_period, platform, minimum_pc" ],
  "sources": [ { "url": "", "type": "forum|reddit|review|video|retailer|brand", "title": "", "date": "", "what_it_says": "" } ],
  "blog_outline": { "title": "", "sections": ["..."] }
}
```

Rules the validator enforces:

- `category` is one of the six slugs; `read_date` and every `price.read_on` are `YYYY-MM-DD`.
- Every product's `subtype` is one of the file's `subtypes` (that list is also the section order).
- `tier` is `core` (10 or more independent sources) or `qualified` (5 to 9). Fewer than 5 does not
  go in the file at all. The one exception is StowGolf.
- `price` is an object with the date read and the source URL, or `null`. Never a guess.
- `direct_url` is a string (empty when the maker has no product page; the seed then uses
  `fallback_url` as the exit).
- A product from an owned brand (`lib/disclosure.ts`, today only StowGolf) must carry
  `"disclosure": "Disclosure: Brett Martin runs Teed and builds StowGolf."` verbatim; no other
  product may carry a `disclosure` field.
- `brand + name` is unique inside a file; it is the upsert key for the seed and the library.
- Fewer than 20 `sources` logs a warning (the plan asks for 20 to 25) but does not fail.

## Doctrine

No rankings, no "best", no urgency. Sections are sub-shapes or price bands; within a section the
seed orders core before qualified and then by mention count, which is circulation, not a verdict.
No em dashes in prose fields. Only canon numbers for StowGolf.

## What the files become

See `docs/COMPONENTS_2026-10-19.md` for the pipeline and commands.
