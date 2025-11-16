# TEED MVP EXECUTION GUIDE FOR CLAUDE

This is a step-by-step guide for building the Teed MVP. Follow each step sequentially, verify it works, then proceed to the next.

---

## PHASE 0: DATABASE SETUP & VERIFICATION

**Step 1: Execute Database Migrations**
- Run `node scripts/execute-migrations.mjs` to execute all 4 migrations
- Verify each migration succeeds (check for errors)
- If migration fails: Check Supabase connection, verify syntax, check for existing tables

**Step 2: Verify Schema**
- Query each new table to confirm it exists: `links`, `bags.code`, `share_links.max_uses`
- Test foreign key relationships (insert test row, verify constraints)
- Check RLS policies are applied
- If issues: Use `node scripts/verify-schema.mjs` to debug

**Step 3: Test Database Connections**
- Create test bag with code field
- Create test item and attach test link
- Delete test data
- If connection fails: Check Supabase credentials, verify .env.local

---

## PHASE 1: CORE API ENDPOINTS

**Step 4: Create Bags API**
- Build `/app/api/bags/route.ts` (POST - create bag)
- Auto-generate unique code (slug from title + random suffix)
- Test: POST with {title, description, privacy} → Returns bag with code
- Verify: Query Supabase to confirm bag exists
- If fails: Check auth context, verify RLS policies

**Step 5: Get Bag by Code**
- Build `/app/api/bags/[code]/route.ts` (GET)
- Include all bag_items with their links (JOIN query)
- Test: GET `/api/bags/camping-kit` → Returns full bag data
- If 404: Verify code exists, check RLS policies for public access

**Step 6: Update & Delete Bag**
- Add PUT and DELETE to `/app/api/bags/[code]/route.ts`
- Update should set `updated_at` timestamp
- Test: Update title, verify change persists
- Test: Delete bag, verify cascade deletes items
- If fails: Check RLS ownership policies

**Step 7: Create Items API**
- Build `/app/api/bags/[code]/items/route.ts` (POST)
- Accept: {name, category, notes, catalog_item_id (optional)}
- Auto-set `position` to max + 1
- Test: Add 3 items to test bag
- Verify: Items have sequential positions

**Step 8: Update & Delete Items**
- Build `/app/api/items/[id]/route.ts` (PUT, DELETE)
- Test: Update item name, verify change
- Test: Delete item, verify it's removed
- If fails: Check item belongs to user's bag (RLS)

**Step 9: Create Links API**
- Build `/app/api/items/[id]/links/route.ts` (POST)
- Accept: {url, link_type, title, metadata}
- Test: Add Amazon link to item
- Verify: Link associates with correct item_id
- If fails: Check foreign key constraint, verify item exists

**Step 10: Update & Delete Links**
- Build `/app/api/links/[id]/route.ts` (PUT, DELETE)
- Test: Update link URL, verify change
- Test: Delete link, verify removal
- Verify: Deleting item cascades to delete its links

**Step 11: Test Full CRUD Flow**
- Create bag → Add 2 items → Add 3 links to each → Update → Delete
- Check all operations work end-to-end
- If any step fails: Debug that specific API endpoint

---

## PHASE 2: BASIC UI - BAG LIST & EDITOR

**Step 12: Create Dashboard Page**
- Build `/app/dashboard/page.tsx`
- Fetch user's bags from Supabase
- Display grid of bag cards (title, item count, cover image)
- Add "Create New Bag" button
- Test: Create bag via UI, verify it appears in list
- If bags don't load: Check Supabase client auth, verify query

**Step 13: Create New Bag Modal/Form**
- Build form: title (required), description, privacy toggle
- On submit: POST to `/api/bags`
- On success: Redirect to `/bags/[code]/edit`
- Test: Create bag, verify redirect works
- If fails: Check form validation, API response handling

**Step 14: Build Bag Editor Shell**
- Create `/app/bags/[code]/edit/page.tsx`
- Fetch bag data with items and links
- Display: Bag title (editable), privacy toggle, share button
- Empty state: "Add your first item"
- Test: Navigate to editor, see bag title
- If 404: Verify code parameter, check bag exists

**Step 15: Build Item List Component**
- Display items in a list (image, title, category badge)
- Show link count per item
- Add delete button (with confirmation)
- Test: Delete item, verify it removes from UI and DB
- If UI doesn't update: Check state management, refetch data

**Step 16: Build Manual Item Add Form**
- Form fields: name, category dropdown, notes (optional)
- On submit: POST to `/api/bags/[code]/items`
- On success: Add item to list (optimistic UI)
- Test: Add "Sleeping Bag", verify it appears
- If fails: Check form data, verify API accepts payload

**Step 17: Implement Auto-Save**
- Debounce bag title edits (500ms)
- Auto-save on title blur
- Show "Saving..." indicator
- Test: Edit title, wait, verify DB updates
- If doesn't save: Check debounce timing, API call

---

## PHASE 3: LINK MANAGEMENT

**Step 18: Build Link Manager Modal**
- Trigger: Click "Add link" on item card
- Form: URL (required), link type dropdown, title, notes
- Display existing links with edit/delete
- Test: Add link, see it in modal and item card
- If modal doesn't open: Check state, verify click handler

**Step 19: Implement Basic Link Add**
- On paste URL: Validate format
- On submit: POST to `/api/items/[id]/links`
- Display link in item's link list
- Test: Add Amazon link, verify it saves
- If validation fails: Check URL regex, provide user feedback

**Step 20: Add Link Edit & Delete**
- Edit: Populate form with existing data
- Delete: Confirm, then DELETE request
- Update UI immediately (optimistic)
- Test: Edit link title, delete link
- If UI lags: Implement optimistic updates

---

## PHASE 4: PUBLIC SHARING

**Step 21: Build Public Bag View Page**
- Create `/app/[username]/[bag-code]/page.tsx`
- Fetch bag (must be public, no auth required)
- Display: Title, description, item grid with images
- Test: Set bag to public, visit URL logged out
- If 403: Check RLS policy allows anonymous reads for public bags

**Step 22: Build Item Detail Modal**
- Click item → Open modal with full details
- Show: Image, name, category, notes, all links
- Links open in new tab
- Test: Click item, see modal, click link
- If links don't work: Check href, verify target="_blank"

**Step 23: Generate Share Links**
- Build share modal (triggered by "Share" button)
- Display: Full URL, copy button, privacy warning
- Test: Copy link, paste in incognito, verify loads
- If doesn't load: Check public access, verify URL format

**Step 24: Generate QR Codes**
- Add QR code generator (use `qrcode` npm package)
- Display QR in share modal
- Download QR as PNG
- Test: Scan QR with phone, verify opens bag
- If QR doesn't work: Check URL encoding, verify QR data

---

## PHASE 5: AI - PHOTO IDENTIFICATION

**Step 25: Install & Test GPT-4 Vision**
- Verify OpenAI client supports vision (already in package.json)
- Test with sample image: POST to existing `/api/ai-test`
- Verify image processing works
- If fails: Check OpenAI API key, verify model access

**Step 26: Build Photo Upload Component**
- File input with camera support (mobile)
- Image preview before upload
- Convert to base64 for API
- Test: Select photo, see preview
- If camera doesn't work on mobile: Check input accept="image/*;capture=camera"

**Step 27: Create Product Identification Endpoint**
- Build `/app/api/ai/identify-products/route.ts`
- Accept: base64 image
- GPT-4 Vision prompt: "Identify all products in this image. Return as JSON: [{name, brand, category, confidence}]"
- Return structured product list
- Test: Upload camping gear photo, verify returns products
- If returns invalid JSON: Improve prompt, add JSON schema

**Step 28: Build Product Review UI**
- Display AI results as cards with checkboxes
- User can: Check to add, uncheck to skip, edit name/category
- "Add selected to bag" button
- Test: Select 2/3 products, verify only checked items added
- If state issues: Use controlled checkboxes, track selection

**Step 29: Implement Batch Item Creation**
- Take selected products from photo AI
- Create multiple items in one API call (loop or batch insert)
- Show loading state during creation
- Test: Add 5 products from photo, verify all saved
- If some fail: Implement error handling per item

---

## PHASE 6: AI - SMART QUESTIONS

**Step 30: Build Ambiguity Detection**
- Create `/app/api/ai/generate-questions/route.ts`
- Accept: partial input (e.g., "Callaway driver")
- GPT-4 prompt: "This is ambiguous. What 2-3 questions would clarify? Return JSON: [{question, options: []}]"
- Return structured questions
- Test: Input "driver", verify asks for brand/model/loft
- If no questions generated: Improve prompt with examples

**Step 31: Build Conversational Form UI**
- Display 1 question at a time (chat-like)
- Visual options as clickable cards (if applicable)
- Skip button always visible
- Next question based on previous answer
- Test: Answer 3 questions, verify final item has all details
- If questions repeat: Track answers, don't re-ask

**Step 32: Add Golf-Specific Logic**
- Detect golf equipment keywords (driver, putter, irons)
- Ask golf-specific questions: loft, shaft flex, grip type
- Build golf category dropdown
- Test: Add "Titleist driver", verify asks golf-specific questions
- If generic questions: Improve category detection

**Step 33: Progressive Disclosure**
- Start with basic question (what is it?)
- Only ask follow-up if needed (low confidence)
- Max 3 questions before adding item
- Test: Input clear item ("Patagonia Nano Puff Jacket"), verify minimal questions
- If too many questions: Adjust confidence threshold

---

## PHASE 7: AI - TRANSCRIPT PROCESSING

**Step 34: Create Transcript Parser Endpoint**
- Build `/app/api/ai/parse-transcript/route.ts`
- Accept: text transcript
- GPT-4 prompt: "Extract all product mentions. Return JSON: [{name, brand, category, price, timestamp}]"
- Test: Paste golf video transcript, verify extracts clubs
- If misses products: Improve prompt with examples

**Step 35: Build Transcript Paste UI**
- Textarea for transcript paste
- "Process" button
- Loading state with progress indicator
- Test: Paste transcript, see loading, then results
- If timeout: Increase API timeout, chunk long transcripts

**Step 36: Golf Equipment Extraction**
- Detect golf-specific terms (loft degrees, shaft type)
- Parse specs from transcript ("10.5 degree driver" → loft: 10.5)
- Test: Transcript mentions "Titleist TSR3 9° driver, Project X shaft" → Extracts all specs
- If misses specs: Add golf terminology to prompt

**Step 37: Batch Item Creation from Transcript**
- Display extracted products as editable list
- User can remove unwanted items
- "Add all to bag" button
- Test: Process transcript with 10 products, add all
- If duplicates: Implement duplicate detection

---

## PHASE 8: AI - LINK SCRAPING

**Step 38: Create Link Scraper Endpoint**
- Build `/app/api/ai/scrape-link/route.ts`
- Accept: URL
- Fetch URL, parse HTML (use cheerio or similar)
- Extract: title (og:title), image (og:image), price
- Test: Scrape Amazon product link, verify returns metadata
- If fails: Check CORS, use server-side fetch

**Step 39: Auto-Populate Link Form**
- When user pastes URL, auto-scrape
- Pre-fill title, show image preview
- User can override scraped data
- Test: Paste REI link, verify auto-fills
- If slow: Add loading indicator, consider caching

**Step 40: Handle Multiple Retailers**
- Support: Amazon, REI, Golf Galaxy, PGA Superstore, etc.
- Retailer-specific parsing (different HTML structures)
- Test: One link from each major retailer
- If parsing fails: Add retailer-specific selectors

---

## PHASE 9: DRAG-TO-REORDER

**Step 41: Install Drag Library**
- Add `@dnd-kit/core` and `@dnd-kit/sortable`
- Test: Import in editor component
- If build error: Check Next.js client component directive

**Step 42: Implement Drag-to-Reorder**
- Wrap items list in DndContext
- Add drag handle to item cards
- Update `position` field on drop
- Test: Drag item 3 to position 1, verify persists
- If position wrong: Debug position calculation

**Step 43: Add Keyboard Accessibility**
- Tab to item, Space to enter drag mode
- Arrow keys to move
- Space to drop
- Test: Reorder using only keyboard
- If doesn't work: Check @dnd-kit keyboard sensor

**Step 44: Visual Feedback**
- Active drag: Lift item (shadow, scale)
- Drop target: Highlight with border
- Smooth animation (100ms)
- Test: Drag item, verify visual states
- If no feedback: Check CSS classes, verify drag state

---

## PHASE 10: BROWSE & SEARCH

**Step 45: Create Browse API**
- Build `/app/api/browse/route.ts`
- Query public bags with filters (category, username)
- Support search term (match title, description, item names)
- Pagination (limit 20, offset)
- Test: GET `/api/browse?q=camping` → Returns camping bags
- If slow: Add database indexes on searchable fields

**Step 46: Build Browse Page**
- Create `/app/browse/page.tsx`
- Search bar, category filters
- Bag grid (same as dashboard but public bags)
- Test: Search "golf", verify only golf bags appear
- If no results: Check query, verify public bags exist

**Step 47: Implement Infinite Scroll**
- Use Intersection Observer for scroll detection
- Load next page on scroll to bottom
- Show loading skeleton
- Test: Scroll to bottom, verify loads more
- If doesn't trigger: Debug observer threshold

**Step 48: Add Filters & Sorting**
- Category dropdown (all, camping, golf, etc.)
- Sort by: Recent, Popular (view count), Most Items
- Apply filters without page reload
- Test: Filter to "golf", sort by popular
- If UI doesn't update: Check state, trigger refetch

---

## PHASE 11: ANALYTICS & TRACKING

**Step 49: Track Bag Views**
- On public bag load: INSERT into analytics_events
- Event type: "bag_view", metadata: {bag_id, user_agent}
- Only count unique views (IP or session-based)
- Test: View bag 3 times, verify 1-3 events logged
- If doesn't track: Check client-side API call

**Step 50: Track Link Clicks**
- Wrap link clicks with tracking handler
- INSERT analytics_event before redirect
- Event type: "link_click", metadata: {link_id, item_id}
- Test: Click affiliate link, verify event logged
- If link doesn't open: Check redirect logic

**Step 51: Build Basic Analytics Dashboard**
- Create `/app/bags/[code]/analytics/page.tsx`
- Show: Total views, link clicks, top items
- Chart: Views over time (simple bar chart)
- Test: View analytics for bag with activity
- If no data: Verify events exist, check query

---

## PHASE 12: USER ONBOARDING

**Step 52: Create Onboarding Flow**
- Build `/app/onboarding/page.tsx`
- Step 1: Name, username (unique check)
- Step 2: Bio, profile photo (optional)
- Step 3: Default privacy setting
- Test: Complete onboarding, verify redirects to dashboard
- If username taken: Show error, suggest alternatives

**Step 53: Profile Photo Upload**
- Supabase Storage bucket for avatars
- Resize/compress before upload
- Update profile.avatar_url
- Test: Upload photo, verify appears in header
- If upload fails: Check Storage bucket policies

**Step 54: Skip-Friendly Flow**
- All steps optional except username
- "Skip" button on each step
- Can complete later from settings
- Test: Skip all, verify still reaches dashboard
- If blocked: Remove required validations

---

## PHASE 13: POLISH & MOBILE

**Step 55: Mobile Optimization**
- Test all pages on mobile viewport (375px)
- Fix: Touch targets, spacing, text size
- Bottom nav instead of sidebar on mobile
- Test: Complete full flow on phone simulator
- If layout breaks: Check Tailwind responsive classes

**Step 56: Image Optimization**
- Use Next.js Image component everywhere
- Lazy load images below fold
- Blur placeholder for slow loads
- Test: Lighthouse score for public bag page
- If slow: Check image sizes, add compression

**Step 57: Loading States**
- Add skeletons for all async operations
- Loading spinners for buttons
- Disable buttons during submission
- Test: Slow 3G simulation, verify UX is clear
- If jarring: Add transition delays

**Step 58: Error Handling**
- Try/catch all API calls
- User-friendly error messages
- Retry buttons for failed operations
- Test: Disconnect internet, try action, verify error message
- If crashes: Add error boundaries

**Step 59: Performance Check**
- Run Lighthouse on all main pages
- Target: >90 performance score
- Fix: Bundle size, unused code, render blocking
- Test: Check Core Web Vitals
- If slow: Use React Profiler, optimize re-renders

**Step 60: Final End-to-End Test**
- Create new account
- Build bag with photo upload (5 items)
- Add links to each item
- Set public and share
- View as anonymous user
- Click affiliate link
- Check analytics
- If any step fails: Debug that specific feature

---

## VERIFICATION CHECKLIST

After completing all steps, verify:
- ✅ All 4 migrations executed successfully
- ✅ Can create/edit/delete bags, items, links
- ✅ Photo upload identifies products correctly
- ✅ Smart questions work for ambiguous input
- ✅ Transcript parsing extracts products
- ✅ Link scraping populates metadata
- ✅ Public bags viewable without login
- ✅ QR codes scan correctly
- ✅ Drag-to-reorder works (mouse & keyboard)
- ✅ Search/browse returns relevant results
- ✅ Analytics track views and clicks
- ✅ Mobile experience is smooth
- ✅ All pages load <2 seconds
- ✅ No console errors

---

## TROUBLESHOOTING GUIDE

**Database Issues:**
- Can't connect: Check .env.local, verify Supabase URL/key
- RLS blocking: Check policies, verify user auth context
- Cascade delete not working: Check foreign key ON DELETE CASCADE

**AI Issues:**
- OpenAI timeout: Reduce image size, chunk long text
- Invalid JSON response: Add JSON schema to prompt, parse carefully
- Low accuracy: Improve prompts with examples, adjust temperature

**UI Issues:**
- Component not rendering: Check client/server component directive
- State not updating: Verify setter called, check re-render triggers
- Styles not applying: Check Tailwind config, verify class names

**Performance Issues:**
- Slow page load: Check bundle size, use dynamic imports
- Slow queries: Add database indexes, optimize JOINs
- Memory leaks: Check useEffect cleanup, remove event listeners

---

**Total Steps: 60**
**Estimated Time: 60-80 hours** (with testing/debugging)
**Critical Path: Database → APIs → UI → AI → Sharing**
