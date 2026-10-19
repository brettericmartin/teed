# Teed Manual Testing Checklist

A comprehensive, repeatable QA process for testing Teed's core workflows.

---

## Automated Testing (Recommended)

Run the automated QA test script for quick verification:

```bash
# Basic tests (public endpoints, no auth required)
npx tsx scripts/manual-qa-test.ts

# Full tests including database operations
npx tsx scripts/manual-qa-test.ts --auth
```

The script tests:
- All public pages load correctly
- User profile and bag APIs work
- Public views render with correct content
- Auth endpoints require authentication
- Affiliate URL resolution
- Error handling (404s)
- Database bag/item/link creation (with --auth)

---

## Pre-Flight Checks (Browser Testing)

Before starting a browser test session:

- [ ] Dev server running: `npm run dev`
- [ ] Logged in as your test account
- [ ] Browser DevTools open (Network tab + Console)
- [ ] Incognito/private window ready for public view testing
- [ ] Test session template copied from `/docs/testing/TEST_SESSION_TEMPLATE.md`

---

## Part 1: Niche Research (5-10 minutes)

Each test session uses a rotating niche to ensure variety in test data.

### Rotation Schedule

| Week Pattern | Niche | Research Sources |
|--------------|-------|------------------|
| Week % 4 = 1 | Tech/Electronics | TheVerge, Amazon, Apple, Wirecutter |
| Week % 4 = 2 | Golf/Sports | TXG YouTube, Golf Digest, Dick's |
| Week % 4 = 3 | Office/Home | Wirecutter, r/battlestations, IKEA |
| Week % 4 = 0 | Fashion/Apparel | Highsnobiety, Huckberry, Nike |

**Calculate:** Get current ISO week number, then `week % 4`

### Research Tasks

1. **Find 1 product URL** for URL-based item adding:
   - Must be a live product page (not a category or search results)
   - Preferably with: product name, brand, description, and image visible
   - Log in `/docs/testing/NICHE_RESEARCH_LOG.md`

2. **Prepare 1 manual item** for text-based entry:
   - Product name and brand
   - 2-3 sentence description
   - Image source (save image locally or note URL)
   - Log in `/docs/testing/NICHE_RESEARCH_LOG.md`

---

## Part 2: Complete Bag Workflow (15-20 minutes)

### 2.1 Create New Bag

1. Navigate to Dashboard or click "New Bag"
2. Name bag: `QA Test - [Niche] - [YYYY-MM-DD]`
3. **VERIFY:** Bag created with unique code
4. **VERIFY:** Redirected to bag editor

### 2.2 Add Item via URL (AI-Powered)

Uses: `POST /api/bags/[code]/items/from-url`

1. Paste the product URL from research
2. Wait for AI extraction to complete
3. **VERIFY:** Product name extracted
4. **VERIFY:** Brand extracted (if available on page)
5. **VERIFY:** Description populated
6. **VERIFY:** Product image loaded
7. **VERIFY:** Retail link auto-added to item

### 2.3 Add Item via Manual Text Entry

Uses: `POST /api/bags/[code]/items`

1. Click "Add Item" (manual mode)
2. Enter product name from research
3. Enter brand
4. Enter description
5. **VERIFY:** Item created with entered data

### 2.4 Upload Photo for Manual Item

1. Click to add/edit photo on manual item
2. Upload the prepared image
3. **VERIFY:** Image uploads and displays
4. **VERIFY:** Image appears in item card

### 2.5 AI Enrichment

Uses: `POST /api/items/apply-enrichment`

1. On the manual item, click "Enhance with AI" (or similar)
2. Wait for enrichment to complete
3. **VERIFY:** Description enhanced or expanded
4. **VERIFY:** Additional metadata may appear
5. **VERIFY:** Original data not lost/overwritten destructively

### 2.6 Toggle Featured/Favorite Status

1. On Item 1 (URL-based): Toggle Featured ON
2. **VERIFY:** Featured indicator appears
3. On Item 2 (Manual): Toggle Favorite ON then OFF
4. **VERIFY:** Favorite state changes correctly

### 2.7 Set Hero Item

1. Set Item 1 as the Hero item for the bag
2. **VERIFY:** Hero indicator appears on item
3. **VERIFY:** Only one hero item allowed (if applicable)

### 2.8 Reorder Items via Drag

1. Drag Item 2 above Item 1
2. **VERIFY:** Order changes in UI
3. **VERIFY:** Order persists after page refresh
4. Drag back to original order (optional)

### 2.9 Add Cover Photo

Uses: `POST /api/bags/[code]/cover-photo`

1. Click to add bag cover photo
2. Upload an image
3. **VERIFY:** Cover photo displays on bag
4. **VERIFY:** Cover appears in bag card on dashboard

### 2.10 Additional Bag Features

Test as applicable:

#### Links
- [ ] Add a manual link to an item (`POST /api/items/[id]/links`)
- [ ] Edit link label
- [ ] Delete a link

#### Sections (if implemented)
- [ ] Add a section divider
- [ ] Rename section
- [ ] Delete section

#### Visibility
- [ ] Set bag to Private
- [ ] **VERIFY:** Bag not visible in incognito
- [ ] Set bag to Public
- [ ] **VERIFY:** Bag visible in incognito

#### Share
- [ ] Copy bag share link
- [ ] **VERIFY:** Link works in incognito

#### Analysis (if implemented)
- [ ] Run bag analysis
- [ ] **VERIFY:** Analysis displays

#### History (if implemented)
- [ ] View item history
- [ ] **VERIFY:** Changes logged

### 2.11 Verify Public View

1. Copy bag URL
2. Open in incognito window (logged out)
3. **VERIFY:** Bag title displays
4. **VERIFY:** Cover photo displays
5. **VERIFY:** Both items visible with photos
6. **VERIFY:** Hero item highlighted appropriately
7. **VERIFY:** Links are clickable
8. **VERIFY:** No edit controls visible

---

### 2.12 Sections & Tags (added 2026-10-17)

- [ ] In the bag editor, the **Sections** panel appears above the item list once the bag has items
- [ ] "Add Section" creates a section; rename and delete work; deleting a section with items leaves them unsectioned
- [ ] Editing an item shows a **Section** select when sections exist; saving assigns it (reload persists)
- [ ] **Tags** row: typing a tag and pressing Enter or comma adds a lowercase chip; the x removes it; Backspace on an empty input removes the last chip; autosave fires (reload persists)
- [ ] Public bag view: with at least one item assigned, items render under section headings (name, count, description) in Grid, Flow, Editorial and List views; Slides stays one continuous carousel
- [ ] Unassigned items appear under "Everything else" after the named sections
- [ ] Tags on the public view link to `/discover?tags=...`
- [ ] `/for/golf-simulators`, `/blog/best/golf-simulator-setups` and `/discover?category=golf-sim` render; a bag with category "Golf Sim" shows in all three
- [ ] View source on any page: canonical `<link>` and JSON-LD URLs start with `https://www.teed.club`

### 2.13 Setup bags, golf-sim (added 2026-10-19, week 1)

Seed first: `set -a && source .env.local && set +a && npx tsx scripts/create-garage-sim-bag.ts`
(`--dry-run` prints the payload without touching the database). Then open `/u/brett/garage-sim-fall-2026`.

- [ ] The bag opens in **List** view on desktop and on a 390-px phone with no `?style` in the URL; the view picker still switches views and `?style=` round-trips
- [ ] A bag in any other category still opens in Flow (desktop) / Editorial (mobile)
- [ ] Header meta row shows "Total listed $x · n of m priced · $y a year" (subscriptions counted per year); an older bag with no prices shows no total and no price column
- [ ] Each section header: small-caps name, item count, subtotal on the right ("from 2 of 3 priced" when an item is unpriced), a 3-px coloured left rule (evergreen enclosure, sky launch monitor, sand projector, grey PC, green mat); the description under it is plain sans
- [ ] List row: thumb / text / price / exit on desktop; stacked rows on mobile with a full-width 44-px exit; names wrap to two lines, never truncate
- [ ] Price cell: `$476` for price paid, `$2,495 list` in grey for the StowGolf sample, `$250 a year` for GSPro, an en dash for the laptop
- [ ] Spec pairs on the StowGolf row read "Width 10 ft · Height 90 in · Depth 5 ft" (list and founders prices are not shown as pairs)
- [ ] Why-chosen sits under the specs with a 2-px evergreen left rule and no emoji; the StowGolf row shows "Disclosure: Brett Martin runs Teed and builds StowGolf." under it in 12-px grey; no other row shows it
- [ ] "More" expands the notes inline without opening the modal; clicking anywhere else on the row opens the modal
- [ ] Exit button reads "See it · stowgolf.com" on the StowGolf row and "Carl's Place · carlofet.com" style elsewhere (domain always shown); "+1 link" opens the modal
- [ ] Every stowgolf.com link carries `utm_source=teed&utm_medium=bag&utm_campaign=garage-sim-fall-2026&ref=TEED-GARAGE-SIM-FALL-202`
- [ ] Hero item shows an outline "Centerpiece" chip; nothing amber anywhere
- [ ] Modal on the StowGolf item: "Why I chose this" with the evergreen rule, the disclosure line under Notes, "See it · stowgolf.com" as the primary button and "Add to My Bag" as an outline button (signed in, not own bag). On a non-golf-sim bag the modal is unchanged
- [ ] Under the bag description: "Source: How this bay was finished · stowgolf.com" (the bag-level `source` link); other bag-level links appear in a "Read" row under the tags
- [ ] `/discover?category=golf-sim` paints only golf-sim bags on first load; picking a category, tag, search or sort updates the URL (defaults omitted, no scroll jump); the browser back button is not polluted
- [ ] `/for/golf-simulators`: H1 "Home golf simulator setups, part by part", "Browse setups" scrolls to `#setups`, "Document your setup" goes to `/signup?ref=golf-sim`, the free-to-read line and the disclosure line sit under the buttons, no emoji
- [ ] `#setups` lists the seeded bag as a card (16:9 cover or 2 x 2 photo tiles, title, total, item count, @brett); the section is absent when no public golf-sim bag exists; the count line reads "1 so far · as of <month year>"
- [ ] FAQ shows five questions, collapsed at 390 px, open on desktop; the closing block reads "Add yours" with the real count and no "Join thousands" line
- [ ] Footer renders on `/for/*` with About and Manifesto links; `/for/golfers` and the other use-case pages look as before (single CTA to `/join`, emoji, two-column pains/solutions)
- [ ] 390 px: "Sign In" and "Sign Up" stay on one line in the nav; the hero (H1, sub, both buttons, free-to-read, disclosure) fits in the first screen with the top of the first card visible

## Part 3: Complete Panel Workflow (10-15 minutes)

### Panel Types Reference

Rotate through panel types across sessions:

| Type | Key Property | Grid Constraints |
|------|-------------|------------------|
| Header | alignment: left/center/right | w:12, h:2-5 |
| Bio | size: compact/standard/expanded | w:12, h:1-4 |
| Social Links | style: icons/pills/list | w:6, h:1-3 |
| Embed | platform (auto-detected) | w:12, h:3-8 |
| Featured Bags | style: grid/carousel/list | w:12, h:2-8 |
| Custom Text | variant: heading/paragraph | w:6, h:1-4 |
| Spacer | size: sm/md/lg/xl | w:12, h:1-3 |
| Divider | width: full/half/third | w:12, h:1 |
| Quote | showQuotationMarks: toggle | w:12, h:1-4 |
| Affiliate Disclosure | disclosureType | w:12, h:1-2 |
| Story | maxItems | w:12, h:2-10 |

### 3.1 Enter Profile Edit Mode

1. Navigate to your profile (`/u/[handle]`)
2. Click "Edit Profile" or edit button
3. **VERIFY:** Edit mode activated
4. **VERIFY:** Add panel button visible

### 3.2 Add Panel

Uses: `POST /api/profile/blocks`

1. Click "Add Panel"
2. Select the panel type for this session
3. **VERIFY:** Panel appears in layout
4. **VERIFY:** Default configuration applied

### 3.3 Resize Panel

1. Attempt to resize panel width
2. **VERIFY:** Grid constraints respected (see table above)
3. Attempt to resize panel height
4. **VERIFY:** Min/max height enforced
5. **VERIFY:** Changes persist after save

### 3.4 Change One Property

Uses: `PUT /api/profile/blocks`

1. Open panel settings/configuration
2. Change the "Key Property" for this panel type (see table)
3. **VERIFY:** Property change reflected in preview
4. **VERIFY:** Auto-save triggers (1.5s debounce)

### 3.5 Change Property Back

1. Change the property back to its original value
2. **VERIFY:** Change reflected
3. **VERIFY:** Auto-save triggers

### 3.6 Delete Panel

1. Click delete/remove on the panel
2. Confirm deletion if prompted
3. **VERIFY:** Panel removed from layout
4. **VERIFY:** Deletion persists after refresh

### 3.7 Verify Public Profile View

1. Open profile in incognito window
2. **VERIFY:** Profile loads without edit controls
3. Check mobile responsiveness:
   - Open DevTools
   - Toggle device toolbar
   - Select mobile viewport (iPhone 12 Pro or similar)
4. **VERIFY:** Layout adapts to mobile
5. **VERIFY:** Panels stack appropriately

---

## Part 4: Cross-Cutting Concerns

### Auto-Save Behavior

- [ ] Make a change and wait 1.5 seconds
- [ ] **VERIFY:** Save indicator appears
- [ ] **VERIFY:** No data loss on rapid edits
- [ ] **VERIFY:** Save completes before navigation

### Error Handling

- [ ] Open Network tab in DevTools
- [ ] Throttle to "Slow 3G"
- [ ] Make an edit
- [ ] **VERIFY:** Loading states display
- [ ] **VERIFY:** Timeout errors handled gracefully
- [ ] Reset network throttling

### Mobile Responsiveness

- [ ] Test bag editor on mobile viewport
- [ ] **VERIFY:** Item cards stack properly
- [ ] **VERIFY:** Touch targets adequate (44px min)
- [ ] **VERIFY:** No horizontal scroll on mobile

### Performance Checks

- [ ] Note any slow operations (> 2 seconds)
- [ ] Check for console errors
- [ ] Check for failed network requests

---

## Part 5: Cleanup & Verification

### Final Verification

Confirm the test session created:

- [ ] 1 test bag named `QA Test - [Niche] - [DATE]`
- [ ] Item 1 (URL-based) has:
  - [ ] AI-extracted name and brand
  - [ ] Description from page
  - [ ] Product photo
  - [ ] At least one link
  - [ ] Featured status set
  - [ ] Hero item designation
- [ ] Item 2 (Manual) has:
  - [ ] Manually entered name/brand
  - [ ] Uploaded photo
  - [ ] AI-enriched description
- [ ] Bag has cover photo
- [ ] Bag is publicly visible

### Optional Cleanup

If not keeping test artifacts:

- [ ] Delete test bag
- [ ] Remove any test panels from profile
- [ ] Clear uploaded test images (if applicable)

---

## Appendix A: API Reference

| Feature | Endpoint | Method |
|---------|----------|--------|
| Create bag | `/api/bags` | POST |
| Get bag | `/api/bags/[code]` | GET |
| Update bag | `/api/bags/[code]` | PATCH |
| Add item from URL | `/api/bags/[code]/items/from-url` | POST |
| Add item manually | `/api/bags/[code]/items` | POST |
| Update item | `/api/items/[id]` | PUT |
| Delete item | `/api/items/[id]` | DELETE |
| AI enrichment | `/api/items/apply-enrichment` | POST |
| Reorder items | `/api/bags/[code]/items` | PATCH |
| Cover photo | `/api/bags/[code]/cover-photo` | POST |
| Add link | `/api/items/[id]/links` | POST |
| Profile panels | `/api/profile/blocks` | GET/POST/PUT/DELETE |

---

## Appendix B: E2E Test Coverage

These flows have automated Playwright coverage:

| File | Coverage |
|------|----------|
| `01-auth.spec.ts` | Authentication flows |
| `02-bag-management.spec.ts` | Bag and item CRUD |
| `03-link-management.spec.ts` | Link operations |
| `04-public-sharing.spec.ts` | Sharing and QR codes |
| `05-user-profile.spec.ts` | Profiles and attribution |

Manual testing focuses on:
- Visual verification (E2E can't assess "looks right")
- Edge cases with real-world data
- Cross-browser behavior
- Performance perception
- Mobile touch interactions

---

## Appendix C: Issue Reporting Template

When finding issues, capture:

```markdown
## Issue: [Brief Description]

**Severity:** Critical / High / Medium / Low

**Area:** Bag Editor / Item Management / Profile / API / UI

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Viewport: [Desktop/Mobile]
- Test Data: [Niche, URL used, etc.]

**Screenshots/Console Errors:**
[Attach if relevant]
```

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-25 | Initial checklist created |
| 2026-10-17 | Added 2.12 Sections & Tags, golf-sim pages, canonical host check |
| 2026-10-19 | Added 2.13 Setup bags (golf-sim): List default, totals, StowGolf row, modal, bag-level links, Discover URL state, /for/golf-simulators |
