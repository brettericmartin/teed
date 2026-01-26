# Niche Research Log

This log tracks research sessions for manual QA testing. Each session uses a rotating niche to ensure test data variety.

---

## Niche Rotation Schedule

| Week Pattern | Niche | Research Sources |
|--------------|-------|------------------|
| Week % 4 = 1 | Tech/Electronics | TheVerge, Amazon, Apple, Samsung, Wirecutter |
| Week % 4 = 2 | Golf/Sports | TXG YouTube, Golf Digest, Dick's Sporting Goods, PGA Superstore |
| Week % 4 = 3 | Office/Home | Wirecutter, r/battlestations, IKEA, Herman Miller, Fully |
| Week % 4 = 0 | Fashion/Apparel | Highsnobiety, Huckberry, Nike, Mr Porter, SSENSE |

**Calculation:** `(ISO week number % 4)` where 0 = Fashion

---

## Research Entry Template

```markdown
### [YYYY-MM-DD] - [NICHE NAME]

**Week Number:** [ISO week]

#### Link Item (for URL-based add)
- **URL:** [full product URL]
- **Product:** [expected product name]
- **Brand:** [brand name]
- **Data Quality:** Good / Partial / Poor
- **Notes:** [any observations about page structure]

#### Manual Item (for text-based add)
- **Name:** [product name]
- **Brand:** [brand name]
- **Description:** [2-3 sentence description]
- **Image Source:** [where you'll get the photo]
- **Notes:** [any relevant context]

#### Session Observations
- [Note about data extraction quality]
- [Note about any edge cases found]
```

---

## Research Entries

<!-- Add new entries below, newest first -->

### 2026-01-25 - Fashion/Apparel

**Week Number:** 4 (Week % 4 = 0 → Fashion)

#### Link Item (for URL-based add)
- **URL:** https://www.nike.com/t/air-max-90-mens-shoes-bAZ6AeHT
- **Product:** Nike Air Max 90 Men's Shoes
- **Brand:** Nike
- **Data Quality:** Good - Nike has structured product data
- **Notes:** $135 retail, multiple colorways available. Classic 1990 silhouette.

#### Manual Item (for text-based add)
- **Name:** Patagonia Better Sweater Jacket
- **Brand:** Patagonia
- **Description:** Classic fleece jacket made from 100% recycled polyester. Features zippered handwarmer pockets and a stand-up collar. Fair Trade Certified sewn.
- **Image Source:** Patagonia website
- **Notes:** Good for testing sustainable fashion category

#### Session Observations
- E2E test suite has timeout issues (test infrastructure, not app bugs)
- API endpoints verified working:
  - `GET /api/users/[handle]/bags` - returns profile + public bags
  - `GET /api/bags/[code]` - returns bag with items
  - Public bag pages render correctly (200 status)
  - Profile pages render correctly (200 status)
- Authenticated endpoints (profile/blocks) correctly require auth

---

### [TEMPLATE] - Tech/Electronics

**Week Number:** [example: 5]

#### Link Item (for URL-based add)
- **URL:** https://www.apple.com/shop/product/MK2C3AM/A/magic-keyboard
- **Product:** Magic Keyboard
- **Brand:** Apple
- **Data Quality:** Good
- **Notes:** Apple pages have clean structured data

#### Manual Item (for text-based add)
- **Name:** Logitech MX Master 3S
- **Brand:** Logitech
- **Description:** Wireless productivity mouse with 8K DPI sensor, quiet clicks, and MagSpeed electromagnetic scrolling. Works on any surface including glass.
- **Image Source:** Logitech product page
- **Notes:** Good for testing manual entry with detailed specs

#### Session Observations
- Apple URLs extract well
- Amazon URLs sometimes have truncated descriptions

---

### [TEMPLATE] - Golf/Sports

**Week Number:** [example: 6]

#### Link Item (for URL-based add)
- **URL:** https://www.taylormadegolf.com/Qi10-Driver/DW-TA070.html
- **Product:** Qi10 Driver
- **Brand:** TaylorMade
- **Data Quality:** Good
- **Notes:** Golf manufacturer sites have good product data

#### Manual Item (for text-based add)
- **Name:** Titleist Pro V1 Golf Balls
- **Brand:** Titleist
- **Description:** Tour-level golf ball with high ball speed, low long game spin, and Drop-and-Stop short game control. 388 dimple design for consistent flight.
- **Image Source:** Titleist website
- **Notes:** Good test for consumable product vs equipment

#### Session Observations
- TXG reviews are good for finding recent equipment
- Dick's pages sometimes have slow load times

---

### [TEMPLATE] - Office/Home

**Week Number:** [example: 7]

#### Link Item (for URL-based add)
- **URL:** https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/
- **Product:** Aeron Chair
- **Brand:** Herman Miller
- **Data Quality:** Good
- **Notes:** Premium furniture sites have detailed specs

#### Manual Item (for text-based add)
- **Name:** Fully Jarvis Standing Desk
- **Brand:** Fully
- **Description:** Electric sit-stand desk with programmable height presets, bamboo desktop option, and whisper-quiet motors. Adjusts from 25.5" to 51" height.
- **Image Source:** Fully website
- **Notes:** Good for testing home office category

#### Session Observations
- IKEA URLs may have region-specific paths
- r/battlestations good for discovering products to test

---

### [TEMPLATE] - Fashion/Apparel

**Week Number:** [example: 8]

#### Link Item (for URL-based add)
- **URL:** https://www.nike.com/t/air-max-90-mens-shoes-6n3vKB
- **Product:** Air Max 90
- **Brand:** Nike
- **Data Quality:** Good
- **Notes:** Nike has good structured product data

#### Manual Item (for text-based add)
- **Name:** Patagonia Better Sweater Jacket
- **Brand:** Patagonia
- **Description:** Classic fleece jacket made from 100% recycled polyester. Features zippered handwarmer pockets and a stand-up collar. Fair Trade Certified sewn.
- **Image Source:** Patagonia website
- **Notes:** Good for testing sustainable fashion category

#### Session Observations
- Fashion sites often have variant URLs (size/color)
- Huckberry has good editorial content for context

---

## Quick Reference: Finding Products

### Tech/Electronics
- **TheVerge** — Recent reviews, "best of" lists
- **Wirecutter** — Tested recommendations with direct links
- **Amazon** — Wide variety, check for Prime items with good photos

### Golf/Sports
- **TXG YouTube** — Recent club reviews with links in description
- **Golf Digest** — Hot List, equipment guides
- **PGA Tour Superstore** — Good variety of current equipment

### Office/Home
- **Wirecutter** — Home office guides
- **r/battlestations** — Real-world setups with product IDs
- **Drop (formerly Massdrop)** — Enthusiast keyboard/audio gear

### Fashion/Apparel
- **Highsnobiety** — Sneaker releases, streetwear
- **Huckberry** — Curated menswear with editorial
- **Mr Porter** — Luxury items with detailed product pages
