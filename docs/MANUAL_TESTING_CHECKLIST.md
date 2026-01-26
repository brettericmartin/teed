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
