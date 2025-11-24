# Generic User Specialist Analysis
## How Regular Users (Non-Influencers) Engage with Teed

**Document Purpose:** Comprehensive analysis of how generic users (non-influencers) would explore and use Teed to share their kits, bags, and gear collections. This analysis considers the platform from the perspective of casual users who want to document and share their personal gear without monetization as the primary goal.

**Last Updated:** 2025-01-15

---

## Executive Summary

Generic users on Teed are **personal hobbyists and enthusiasts** who want to:
- Document their gear collections (golf bags, camera gear, office setups, travel kits, etc.)
- Share setups with friends, family, or online communities
- Benefit from AI assistance without needing professional content creation tools
- Explore different sharing methods to find what works best for their needs
- Optionally add purchase links but primarily focus on sharing and documentation

**Key Differentiator from Influencers:**
- **Primary Goal:** Sharing and documentation, not monetization
- **Effort Level:** Minimal - wants quick, easy workflows
- **Entry Method:** Photo-first preferred, with AI doing heavy lifting
- **Sharing Audience:** Friends, family, hobby communities (not public audience)

---

## Current Platform Capabilities for Generic Users

### 1. Bag Creation & Management

**Available Features:**
- ✅ Create bags with custom codes (e.g., `/u/@username/my-golf-bag`)
- ✅ Add items via multiple methods:
  - Manual entry (custom name, description, photos)
  - Catalog item selection (if product exists in catalog)
  - Photo upload with AI enrichment (planned/partial)
- ✅ Organize items with drag-and-drop sorting
- ✅ Add custom photos to items
- ✅ Add notes to items
- ✅ Set privacy (public, private)
- ✅ Background images for bags

**Current Implementation:**
- Bags are created via `/api/bags` POST endpoint
- Items added via `/api/bags/[code]/items` POST endpoint
- Editor available at `/u/[handle]/[code]/edit`
- Public view at `/u/[handle]/[code]`

**User Journey:**
1. User creates account → Dashboard
2. Click "Create New Bag" → Enter title/description
3. Add items via editor interface
4. Customize items (photos, notes, links)
5. Set privacy and share

---

### 2. Sharing Capabilities

**Available Sharing Methods:**

#### A. Direct Link Sharing
- **URL Format:** `/u/[handle]/[code]` (username-scoped)
- **Legacy Format:** `/c/[code]` (redirects to username-scoped)
- **Features:**
  - ✅ Shareable public links
  - ✅ QR code generation (via ShareModal)
  - ✅ Native mobile sharing
  - ✅ Copy to clipboard
  - ✅ Preview public view

**Implementation:**
- `ShareModal` component provides:
  - Link copying
  - QR code generation and download
  - Native share API integration
  - Privacy warnings for private bags

#### B. Public Discovery
- **Discover Page:** `/discover`
- **Features:**
  - ✅ Browse all public bags
  - ✅ See bag owner information
  - ✅ View featured items
  - ✅ See bag photos
  - ✅ Click through to full bag view

**Current Limitations:**
- No search/filter functionality visible
- No tagging system visible in UI
- No category browsing
- No following system UI visible

#### C. Profile-Based Sharing
- **User Profiles:** `/u/[handle]`
- **Features:**
  - ✅ View all public bags by a user
  - ✅ See user profile (handle, display name, avatar)
  - ✅ Navigate to individual bags

**Social Features Available (Schema):**
- `follows` table exists for:
  - Following users (`target_user_id`)
  - Following specific bags (`target_bag_id`)
- **Status:** Schema exists but UI implementation not visible in current codebase

---

### 3. Item Enrichment & AI Features

**Available AI Capabilities:**

#### A. Link Management
- ✅ Add links to items (retail, review, video, article, other)
- ✅ Link scraping/enrichment (metadata extraction)
- ✅ Multiple links per item
- ✅ Link type categorization

**Implementation:**
- `links` table exists (created via migration)
- `LinkManagerModal` component for managing links
- API endpoint: `/api/items/[id]/links`

#### B. Photo Upload & Management
- ✅ Upload custom photos to items
- ✅ Image cropping
- ✅ Batch photo selection
- ✅ Media asset storage

**Implementation:**
- `media_assets` table for centralized storage
- `PhotoUploadModal` and `ImageCropModal` components
- Supabase Storage integration

#### C. AI Enrichment (Planned/Partial)
- ✅ Enrichment preview system
- ✅ AI suggestions component (`AISuggestions`)
- ⚠️ Photo-based product identification (documented but implementation unclear)
- ⚠️ Smart question generation (documented in `user-casual-case.md` but not visible in code)

**Current State:**
- AI enrichment infrastructure exists
- OpenAI integration present (`lib/ai.ts`, `lib/openaiClient.ts`)
- Enrichment preview modal exists
- Full photo identification workflow not fully implemented

---

### 4. Privacy & Access Control

**Available Privacy Options:**
- ✅ Public bags (`is_public: true`)
  - Visible on discover page
  - Shareable via link
  - Viewable by anyone
- ✅ Private bags (`is_public: false`)
  - Only owner can view
  - Share link shows privacy warning
  - Can toggle to public

**Privacy Controls:**
- Set during bag creation
- Can toggle in bag editor
- ShareModal warns if bag is private

---

## Exploration Paths for Generic Users

### Path 1: Quick Photo-Based Sharing
**Best For:** Users who want minimal effort, maximum AI assistance

**Workflow:**
1. Take photos of gear
2. Upload to bag (photo upload exists)
3. AI identifies products (planned/partial)
4. Review and confirm items
5. Generate share link/QR code
6. Share with friends

**Current Status:**
- ✅ Photo upload infrastructure exists
- ⚠️ AI product identification not fully implemented
- ✅ Share link/QR code generation works
- ✅ Review interface exists (`ProductReviewModal`)

**Gap:** Full photo-to-product identification pipeline needs completion

---

### Path 2: Manual Entry with AI Assistance
**Best For:** Users who know what they have but want help enriching details

**Workflow:**
1. Create bag
2. Manually add items (name, description)
3. AI suggests product matches from catalog
4. AI enriches with images, specs, links
5. User reviews and accepts/rejects
6. Share bag

**Current Status:**
- ✅ Manual item entry works
- ✅ AI enrichment preview exists
- ✅ Catalog matching possible (if catalog populated)
- ✅ Link management available

**Gap:** Smart question generation for incomplete items (documented but not implemented)

---

### Path 3: Discovery & Inspiration
**Best For:** Users who want to see what others have and get ideas

**Workflow:**
1. Browse `/discover` page
2. View public bags from other users
3. See featured items and photos
4. Click through to full bag views
5. Get inspired for own bag creation
6. Optionally fork/derive bags (schema supports this)

**Current Status:**
- ✅ Discover page exists
- ✅ Public bag browsing works
- ✅ User profiles accessible
- ⚠️ Fork/derive functionality not visible in UI (schema supports it)

**Gaps:**
- No search/filter on discover page
- No following system UI
- No fork button visible
- No tags/categories for discovery

---

### Path 4: Profile-Based Sharing
**Best For:** Users building a personal brand or sharing multiple collections

**Workflow:**
1. Create multiple bags
2. All public bags visible on profile (`/u/[handle]`)
3. Share profile link or individual bag links
4. Followers can see all bags (if following implemented)
5. Build collection of shared setups

**Current Status:**
- ✅ User profiles exist
- ✅ All public bags shown on profile
- ✅ Profile URLs are shareable
- ⚠️ Following system exists in schema but UI not visible

**Gaps:**
- Following UI not implemented
- No notifications for new bags from followed users
- No feed of followed users' bags

---

### Path 5: Community Engagement
**Best For:** Users who want to participate in hobby communities

**Workflow:**
1. Browse discover page
2. Find users with similar interests
3. Follow users or specific bags
4. Get notified of updates (if implemented)
5. Comment or interact (if implemented)
6. Share own bags to community

**Current Status:**
- ✅ Discover page for browsing
- ✅ Public bag viewing
- ⚠️ Following schema exists but UI missing
- ❌ Comments/interactions not implemented
- ❌ Notifications not implemented

**Gaps:**
- Social features need UI implementation
- No community interaction features
- No tagging system for finding similar bags

---

## Comparison: Generic User vs. Influencer Features

| Feature | Generic User | Influencer | Status |
|---------|-------------|------------|--------|
| **Bag Creation** | ✅ | ✅ | Both have full access |
| **Manual Item Entry** | ✅ | ✅ | Both have full access |
| **Photo Upload** | ✅ | ✅ | Both have full access |
| **Link Management** | ✅ | ✅ | Both have full access |
| **Share Links/QR Codes** | ✅ | ✅ | Both have full access |
| **Public Discovery** | ✅ | ✅ | Both can be discovered |
| **User Profiles** | ✅ | ✅ | Both have profiles |
| **AI Enrichment** | ✅ | ✅ | Both have access |
| **Affiliate Links** | Optional | Required | Both can use |
| **Analytics** | Basic (views) | Detailed | Generic users don't need detailed analytics |
| **Photo Product ID** | Primary method | Secondary | Not fully implemented |
| **Smart Questions** | Critical | Less important | Not implemented |
| **Following System** | Nice to have | Important | Schema exists, UI missing |
| **Fork/Derive Bags** | Useful | Less common | Schema exists, UI missing |
| **Tags/Categories** | Helpful | Important | Schema exists, UI missing |

**Key Insight:** Generic users and influencers share most core features, but generic users prioritize:
- Photo-based entry (minimal typing)
- Quick sharing (less setup)
- Discovery of similar setups
- Community engagement

---

## Current Gaps & Opportunities

### Critical Gaps for Generic Users

#### 1. Photo-Based Product Identification
**Status:** Documented but not fully implemented
**Impact:** High - This is the primary differentiator for casual users
**What's Needed:**
- Complete AI vision pipeline for product identification
- Product review/confirmation interface (partially exists)
- Confidence scoring and user correction flow

#### 2. Smart Question Generation
**Status:** Documented in `user-casual-case.md` but not implemented
**Impact:** High - Addresses "I don't know exact model" problem
**What's Needed:**
- Ambiguity detection in user input
- Visual product selection interface
- Progressive question wizard
- Context-aware questions (golf vs. camera vs. tech)

#### 3. Discovery & Search
**Status:** Basic discover page exists, but limited functionality
**Impact:** Medium - Users want to find similar setups
**What's Needed:**
- Search functionality
- Tag/category filtering
- Sort options (newest, most items, etc.)
- Related bags suggestions

#### 4. Social Features UI
**Status:** Schema exists, UI missing
**Impact:** Medium - Community engagement important
**What's Needed:**
- Follow/unfollow buttons
- Following feed
- Notifications for followed users' new bags
- Fork/derive bag button

#### 5. Fork/Derive Functionality
**Status:** Schema supports it (`parent_bag_id`, `derived_from_owner_id`), UI missing
**Impact:** Medium - Users want to start from others' bags
**What's Needed:**
- "Fork this bag" button on public bags
- Attribution display
- Copy items workflow

---

### Opportunities for Better Generic User Experience

#### 1. Onboarding Flow
**Current:** Basic account creation
**Opportunity:** 
- Tutorial highlighting photo upload as primary method
- Example bags to inspire
- Quick start templates

#### 2. Sharing Analytics (Simple)
**Current:** No analytics visible
**Opportunity:**
- Simple view counter (not detailed like influencers need)
- "Who viewed" not needed, just "how many"
- Privacy-friendly analytics

#### 3. Collection Templates
**Current:** Start from scratch
**Opportunity:**
- Pre-made bag templates (golf bag, camera bag, etc.)
- Common items pre-populated
- User can customize

#### 4. Export Options
**Current:** Share via link only
**Opportunity:**
- Export to PDF
- Export to spreadsheet
- Print-friendly view
- JSON export for personal records

#### 5. Mobile App Experience
**Current:** Web app (mobile-responsive)
**Opportunity:**
- Native mobile app for easier photo upload
- Camera integration
- Offline mode for creating bags
- Push notifications for sharing

---

## Recommended User Flows for Generic Users

### Flow 1: "Quick Share My Golf Bag"
**User Goal:** Share golf bag setup with buddies quickly

**Ideal Flow:**
1. Sign up/login (minimal info)
2. Click "Create Bag" → "Golf Bag"
3. Upload photo of golf bag
4. AI identifies clubs automatically
5. Review and confirm (1-2 minutes)
6. Generate QR code
7. Share QR code or link via text/email

**Current Reality:**
- Steps 1-2: ✅ Works
- Step 3: ✅ Photo upload works
- Step 4: ⚠️ AI identification not fully implemented
- Step 5: ✅ Review interface exists
- Step 6: ✅ QR code generation works
- Step 7: ✅ Sharing works

**Gap:** Step 4 needs completion

---

### Flow 2: "Document My Camera Gear for Insurance"
**User Goal:** Create detailed inventory for insurance purposes

**Ideal Flow:**
1. Create bag "Camera Gear Inventory"
2. Upload multiple photos of equipment
3. AI identifies each item
4. User adds purchase dates, serial numbers, values
5. Export to PDF/spreadsheet
6. Keep private or share with insurance agent

**Current Reality:**
- Steps 1-2: ✅ Works
- Step 3: ⚠️ AI identification partial
- Step 4: ✅ Notes field exists, but no structured fields for dates/serial numbers
- Step 5: ❌ Export not implemented
- Step 6: ✅ Privacy controls work

**Gaps:** AI identification, structured metadata fields, export functionality

---

### Flow 3: "Find Inspiration for My Setup"
**User Goal:** See what others have and get ideas

**Ideal Flow:**
1. Browse discover page
2. Search/filter by category (e.g., "golf", "photography")
3. View interesting bags
4. Follow users with similar interests
5. Get notified when they create new bags
6. Fork a bag I like as starting point
7. Customize for my needs

**Current Reality:**
- Step 1: ✅ Discover page exists
- Step 2: ❌ Search/filter not implemented
- Step 3: ✅ Viewing works
- Step 4: ⚠️ Following schema exists, UI missing
- Step 5: ❌ Notifications not implemented
- Step 6: ⚠️ Fork schema exists, UI missing
- Step 7: ✅ Customization works

**Gaps:** Search, following UI, notifications, fork UI

---

### Flow 4: "Share My Office Setup on Reddit"
**User Goal:** Share tech setup with Reddit community

**Ideal Flow:**
1. Create bag "My Home Office Setup"
2. Upload wide photo of desk
3. AI identifies monitors, keyboard, mouse, etc.
4. Add purchase links (optional)
5. Make public
6. Share link on Reddit
7. Track views (simple counter)

**Current Reality:**
- Steps 1-2: ✅ Works
- Step 3: ⚠️ AI identification partial
- Step 4: ✅ Link management works
- Step 5: ✅ Privacy toggle works
- Step 6: ✅ Sharing works
- Step 7: ⚠️ Analytics not visible in UI

**Gaps:** AI identification, simple analytics display

---

## Integration Points with Other Specialists

### With Influencer Specialist
**Shared Infrastructure:**
- Same bag/item data model
- Same sharing mechanisms
- Same link management
- Same AI enrichment

**Different Priorities:**
- Generic users: Photo-first, minimal effort
- Influencers: Transcript-first, comprehensive details, monetization

**Collaboration Opportunities:**
- Generic users can discover influencer bags for inspiration
- Influencers can see what casual users are interested in
- Both benefit from improved AI capabilities

---

### With Minimal Specialist
**Shared Goals:**
- Minimal friction
- Quick workflows
- Simple interfaces

**Different Approaches:**
- Generic users: Want AI to do work (photo identification)
- Minimal specialist: Want fewer features, simpler UI

**Collaboration:**
- Both want streamlined onboarding
- Both want quick sharing
- Both want mobile-first experience

---

### With AI Specialist
**Critical Dependency:**
- Generic users rely heavily on AI features:
  - Photo product identification
  - Smart question generation
  - Catalog matching
  - Item enrichment

**Priority Features for Generic Users:**
1. **Photo Product ID** (Highest priority)
   - Vision API integration
   - Product catalog matching
   - Confidence scoring
   - User correction flow

2. **Smart Questions** (High priority)
   - Ambiguity detection
   - Visual product selection
   - Context-aware questions
   - Progressive disclosure

3. **Catalog Matching** (Medium priority)
   - Product search
   - Automatic enrichment
   - Image fetching
   - Spec extraction

4. **Item Suggestions** (Low priority)
   - "You might also need..."
   - Based on similar bags
   - Category-based suggestions

---

## Recommendations for Generic User Experience

### Short-Term (1-2 months)
1. **Complete Photo Product Identification**
   - Implement vision API pipeline
   - Build review/confirmation interface
   - Add confidence indicators
   - Enable user corrections

2. **Add Basic Search to Discover**
   - Search by bag title/description
   - Filter by item count
   - Sort by date

3. **Implement Fork Functionality**
   - "Fork this bag" button on public bags
   - Copy items workflow
   - Attribution display

### Medium-Term (3-6 months)
1. **Smart Question Generation**
   - Ambiguity detection
   - Visual product selection UI
   - Question wizard
   - Context-aware questions

2. **Social Features UI**
   - Follow/unfollow buttons
   - Following feed
   - Basic notifications

3. **Enhanced Discovery**
   - Tag system UI
   - Category filtering
   - Related bags suggestions

### Long-Term (6+ months)
1. **Export Functionality**
   - PDF export
   - Spreadsheet export
   - Print-friendly views

2. **Mobile App**
   - Native camera integration
   - Offline mode
   - Push notifications

3. **Community Features**
   - Comments on bags
   - Collections/curation
   - User recommendations

---

## Success Metrics for Generic Users

### Engagement Metrics
- Number of bags created per user
- Photo uploads vs. manual entry ratio
- Share link generation rate
- Public vs. private bag ratio

### AI Performance Metrics
- Photo identification accuracy
- User acceptance rate of AI suggestions
- Average confidence scores
- Correction frequency

### Sharing Metrics
- Share link clicks
- QR code scans
- Public bag views
- Profile visits

### Discovery Metrics
- Discover page visits
- Bags viewed per session
- Fork/derive actions
- Follow actions (when implemented)

---

## Conclusion

Generic users on Teed have access to a solid foundation of features for creating and sharing bags. The core infrastructure supports their needs, but several key features need completion to fully realize the vision outlined in `user-casual-case.md`.

**Key Strengths:**
- ✅ Flexible bag creation and management
- ✅ Multiple sharing methods (links, QR codes, profiles)
- ✅ Privacy controls
- ✅ Link management
- ✅ Photo upload infrastructure

**Key Gaps:**
- ⚠️ Photo-based product identification (critical)
- ⚠️ Smart question generation (high priority)
- ⚠️ Discovery/search functionality (medium priority)
- ⚠️ Social features UI (medium priority)
- ⚠️ Fork/derive UI (medium priority)

**Priority Focus:**
1. Complete AI vision pipeline for photo identification
2. Implement smart question generation
3. Add search/filter to discover page
4. Build social features UI

With these improvements, Teed will fully serve generic users who want to quickly document and share their gear collections with minimal effort and maximum AI assistance.

---

**End of Document**


