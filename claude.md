# Teed – Project Guide for Claude

You are the primary AI pair programmer for the **Teed** project.

Teed is an AI-first web app for organizing "containers" of items plus links and codes, optimized for use inside ChatGPT/Claude as much as the browser.

The old project **tee-club-grid** is *not* part of this repo. Ignore any past context about social feeds, posts, likes, forums, etc. This project is a fresh, minimal MVP.

---

## High-level Product Vision

Teed lets users:

- Create **containers** (bags, kits, loadouts).
- Add **items** inside each container.
- Attach **links** (retail, affiliate, review, etc.) to items or the container.
- Generate **codes/slugs** to easily share containers with people or AI agents.

Primary usage:

- The browser UI is intentionally simple, visually clean, and low-friction.
- The real power is from AI agents (ChatGPT, Claude) that can:
  - Fetch containers by code or slug.
  - Read and reason over items + links.
  - Help users compare gear, plan purchases, and share loadouts.

Design principles:

- **LLM-first data model** – endpoints and schemas must be easy for a model to understand.
- **Minimal but polished UI** – think 1–3 primary screens, card-based, Tailwind + sensible defaults.
- **Clarity over cleverness** – prefer explicit, readable code and types.

---

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript).
- **Styling**: Tailwind CSS.
- **Backend & DB**: Supabase (PostgreSQL, Auth, Row Level Security).
- **Hosting**: Vercel.
- **AI integration**:
  - Website exposes a small set of JSON APIs that are straightforward to call from a custom GPT via Actions/OpenAPI.
  - Later, an MCP server may be added to wrap Supabase for ChatGPT/Claude.

Assume we are on a recent Next.js version (13+ with app router).

---

## Current Database Schema vs. MVP Spec

**Last Updated:** 2025-11-16

### Current State

The Supabase database contains **12 tables** with a more complex design than the original MVP spec. It includes:

**Core Tables (with differences from MVP):**
- `profiles` (users) ✓
- `bags` (containers) ⚠️ Missing `code` field, missing `updated_at`
- `bag_items` (items) ⚠️ Catalog-based design vs free-form
- `share_links` (invite codes) ⚠️ Missing `max_uses`, `uses`, `expires_at`
- `links` ❌ **COMPLETELY MISSING** (general-purpose links table)

**Extended Tables (beyond MVP):**
- `catalog_items` - Product catalog with verified items
- `categories` - Product categories
- `affiliate_links` - Affiliate tracking (NOT the general links table)
- `media_assets` - Centralized media storage
- `analytics_events` - Event tracking
- `follows` - Social following system
- `price_cache` - Merchant pricing cache
- `bag_tags` - Tagging system

### Critical Gaps

1. **MISSING: General-purpose links table** ❌
   - Core MVP feature missing
   - Users cannot attach retail, review, or video links to bags/items
   - Only affiliate links tied to catalog items exist

2. **MISSING: `code` field on bags** ⚠️
   - Cannot create simple shareable URLs like `/c/camping-kit`
   - `share_links.slug` exists but is a separate entity

3. **MISSING: Usage tracking on share_links** ⚠️
   - No `max_uses`, `uses`, or `expires_at` fields
   - Cannot create limited-use or expiring share links

4. **Different: Items are catalog-first** ⚠️
   - Items reference `catalog_items` with override fields
   - Not the free-form model in MVP spec
   - May be intentional design choice

See `schema_analysis.md` for full details.

---

## MVP Data Model Specification

This is the target MVP schema. Compare with current state above.

- **users** (implemented as `profiles`)
  - Sourced from Supabase Auth (`auth.users`).
  - We'll mirror minimal profile data in `public.profiles`.

- **containers** (implemented as `bags`)
  - `id` (uuid, PK)
  - `owner_id` (uuid → users.id)
  - `name` (text) [currently `title`]
  - `description` (text, nullable)
  - `code` (text, unique, short human/LLM-friendly identifier) ⚠️ **MISSING**
  - `is_public` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz) ⚠️ **MISSING**

- **items** (implemented as `bag_items`)
  - `id` (uuid, PK)
  - `container_id` (uuid → containers.id)
  - `name` (text) ⚠️ Currently uses `catalog_item_id` + `custom_name`
  - `brand` (text, nullable) ⚠️ Currently in catalog
  - `category` (text, nullable) ⚠️ Currently in catalog
  - `notes` (text, nullable) ✓
  - `image_url` (text, nullable) ⚠️ Currently `custom_photo_id`
  - `sort_order` (integer, default 0) ✓ Currently `sort_index`
  - `created_at` (timestamptz) ✓

- **links** ❌ **COMPLETELY MISSING - CRITICAL**
  - `id` (uuid, PK)
  - `container_id` (uuid, nullable) – link tied to a container
  - `item_id` (uuid, nullable) – or to a specific item
  - `kind` (text) – e.g. 'retail', 'affiliate', 'review', 'video'
  - `url` (text)
  - `label` (text, nullable) – short human label like "Amazon", "Official site"
  - `metadata` (jsonb, nullable) – optional scraped title, price, favicon, etc.
  - `created_at` (timestamptz)

- **invite_codes** (implemented as `share_links`)
  - `id` (uuid, PK)
  - `code` (text, unique) ✓ Currently `slug`
  - `container_id` (uuid → containers.id) ✓ Currently `bag_id`
  - `max_uses` (integer, nullable) ⚠️ **MISSING**
  - `uses` (integer, default 0) ⚠️ **MISSING**
  - `expires_at` (timestamptz, nullable) ⚠️ **MISSING**
  - `created_at` (timestamptz) ✓

### Schema Guidelines

- Keep constraints simple and robust (foreign keys, `ON DELETE CASCADE` where appropriate).
- Use Supabase Row Level Security so users only see/edit their own containers/items.
- **Priority fixes needed:**
  1. Create the general-purpose `links` table
  2. Add `code` field to `bags` table
  3. Add usage tracking to `share_links`

---

## UI Scope (MVP)

Focus on 5 main flows:

1. **Dashboard / Containers list** (`/dashboard`)
   - Shows user's containers in a simple grid/list.
   - Each card: name, short description, code, "Edit", "View", "Copy link/code".
   - Clickable user handle links to public profile.
   - Theme toggle for dark/light mode.

2. **Container editor** (`/bags/[code]/edit`)
   - Edit container name/description/visibility.
   - Manage items:
     - Add/remove items.
     - Drag-and-drop or up/down buttons to adjust `sort_order`.
   - For each item, manage its links in a simple nested list.
   - Share modal with QR code generation for public bags.

3. **Public container view** (`/c/[code]`)
   - Read-only view accessible by URL like `/c/[code]`.
   - Show container, items, and links clearly.
   - This is what AI agents and shared users will often hit.
   - Clickable user attribution links to creator's profile.
   - Fully responsive with dark mode support.

4. **User profile page** (`/u/[handle]`) ✨ NEW
   - Public view of a user's profile and bags.
   - Displays user metadata: handle, display name, avatar, bio, join date.
   - Grid of all public bags with bag count stat.
   - Accessible without authentication.
   - Bags clickable to view at `/c/[code]`.
   - Empty state for users with no public bags.
   - Full dark mode support.

5. **Profile settings** (`/settings/profile`) - PLANNED
   - Edit profile information: display name, bio, avatar.
   - Authenticated users only.
   - Auto-save changes.

Visual style:

- Clean layout, centered content, max-width container.
- Use Tailwind CSS v4.
- Favor card components with clear hierarchy and spacing.
- Lucide React icons for consistency.
- Soft shadows and smooth transitions.
- Mobile-first responsive design.

### Teed Brand Design System

**Design System Showcase:** Full visual documentation available at `/design-system` (click color palette in navigation)

Teed uses a minimal, premium, soft athletic/lifestyle aesthetic. All designs should feel clean, modern, calm, rounded, and universal. Avoid neon, high contrast, or heavy shadows. Keep everything soft and balanced with plenty of white space.

#### Brand Colors (12-Step Scales)

Teed uses a systematic color approach with 12 steps per color family, following Radix Colors principles:

**Earthy Sage (Teed Green) - Primary Brand Color:**
- Step 8: `#8BAA7E` (Primary - more earthy than previous `#9BBF9E`)
- Used for AI/smart actions, intelligent features
- Tokens: `--teed-green-1` through `--teed-green-12`

**Deep Evergreen - Primary Text & Create Actions:**
- Step 12: `#1F3A2E` (Primary text, create buttons)
- Tokens: `--evergreen-1` through `--evergreen-12`

**Warm Sand - Accents:**
- Step 8: `#D9B47C`
- Tokens: `--sand-1` through `--sand-12`

**Stone Grey - Secondary Text:**
- Step 8: `#868996`
- Tokens: `--grey-1` through `--grey-12`

**Sky Tint - Backgrounds:**
- Step 8: `#CFE8E1`
- Tokens: `--sky-1` through `--sky-12`

**Copper - Destructive Actions:**
- Step 8: `#C2784A`
- Used for delete/remove actions
- Tokens: `--copper-1` through `--copper-12`

**Base Colors:**
- Background: `#F9F5EE` (soft off-white)
- Surface: `#FFFFFF` (cards, panels)
- Elevated: `#FEFDFB` (raised surfaces)

#### Semantic Button Variants

All button variants use CSS custom properties from the design token system:

**1. AI / Smart Actions** (`variant="ai"`)
- Background: `var(--button-ai-bg)` → Earthy Sage (#8BAA7E)
- Text: White
- Use for: AI-powered features, intelligent suggestions, automated actions
- Examples: "AI Enhance", "Auto-categorize", "Smart Suggestions"

**2. Create / Add Actions** (`variant="create"`) - PRIMARY
- Background: `var(--button-create-bg)` → Deep Evergreen (#1F3A2E)
- Text: White
- Use for: Creating new items, adding to collections, primary actions
- Examples: "Create Bag", "Add Item", "New Collection"

**3. Destructive / Remove Actions** (`variant="destructive"`)
- Background: `var(--button-destructive-bg)` → Copper (#C2784A)
- Text: White
- Use for: Delete, remove, potentially destructive actions (always require confirmation)
- Examples: "Delete Bag", "Remove Item", "Clear All"

**4. Secondary / Neutral Actions** (`variant="secondary"`)
- Background: `var(--button-secondary-bg)` → Soft Sage tint (#E3EFE4)
- Text: Deep Evergreen
- Use for: Less prominent actions, secondary options
- Examples: "Cancel", "Settings", "View Details"

**5. Ghost Buttons** (`variant="ghost"`)
- Background: Transparent
- Border: Subtle Evergreen
- Use for: Tertiary actions, minimal prominence

**6. Outline Buttons** (`variant="outline"`)
- Background: White
- Border: Strong Evergreen
- Use for: Outlined style when needed

#### Design Token System

All design values are available as CSS custom properties in `globals.css`:

**Color Tokens:**
```css
/* Reference Tokens - Raw values */
--teed-green-8: #8BAA7E;
--evergreen-12: #1F3A2E;

/* Semantic Tokens - Purpose-driven */
--text-primary: var(--evergreen-12);
--text-secondary: var(--grey-8);
--background: var(--base-background);

/* Component Tokens - Specific uses */
--button-ai-bg: var(--teed-green-8);
--button-create-bg: var(--evergreen-12);
```

**Spacing (8pt Grid):**
- `--space-1` through `--space-12` (4px to 96px)

**Shadows (6 Levels):**
- `--shadow-1` through `--shadow-6`

**Border Radius:**
- `--radius-sm` (8px) through `--radius-2xl` (24px)

**Typography:**
- Headings: System font stack (performance-optimized)
- Body/UI: Inter (400, 500, 600 weights)
- Sizes: `--font-size-1` (12px) through `--font-size-11` (60px)

#### Accessibility

- All color combinations meet WCAG AA standards (minimum 4.5:1 for text)
- Focus states always visible with `--focus-ring` (Earthy Sage)
- Interactive elements have clear affordances
- Use semantic HTML and ARIA attributes
- Minimum touch target: 44x44px

#### Component Usage

**Buttons:**
```tsx
<Button variant="ai">AI Enhance</Button>
<Button variant="create">Create Bag</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Cancel</Button>
```

**Spacing:**
Use design tokens for consistent spacing:
```tsx
<div className="p-[var(--space-6)]"> {/* 24px */}
<div className="gap-[var(--space-4)]"> {/* 16px */}
```

**Colors:**
Use token variables directly:
```tsx
<div className="bg-[var(--surface)] text-[var(--text-primary)]">
<div className="border-[var(--border-subtle)]">
```

#### Design Principles

1. **Minimal & Premium** - Intentional elements, white space, soft colors
2. **Earthy & Natural** - Nature-inspired palette, avoid harsh contrasts
3. **Rounded & Soft** - Generous radii (12-24px), soft shadows
4. **Accessible by Default** - WCAG AA compliance, visible focus states

#### Logo & Branding

**Primary Logo:**
- Icon only (ball and tee)
- Ball: Warm Sand (#D9B47C)
- Tee: Deep Evergreen (#1F3A2E)
- Round and organic shapes

**Tagline:**
- "Curations, Made Shareable"
- Font: System fonts (Söhne/Neue Haas Grotesk feel)
- Color: Deep Evergreen

#### Applying the Design System to New Pages/Features

**IMPORTANT:** All new pages, components, and features MUST use the Teed design system. Follow these guidelines:

**1. Use Design Tokens for All Styling**
```tsx
// ✅ CORRECT - Use CSS custom properties
<div className="bg-[var(--surface)] text-[var(--text-primary)]">
<div className="border-[var(--border-subtle)] shadow-[var(--shadow-2)]">
<div className="p-[var(--space-6)] rounded-[var(--radius-xl)]">

// ❌ INCORRECT - Never hardcode colors
<div className="bg-white text-gray-900">
<div className="border-gray-200 shadow-sm">
<div className="p-6 rounded-xl">
```

**2. Use Semantic Button Variants**
```tsx
// ✅ CORRECT - Use semantic variants
<Button variant="ai">AI Enhance</Button>
<Button variant="create">Create Bag</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Cancel</Button>

// ❌ INCORRECT - Never use old variants or inline styles
<Button variant="primary">Create</Button>
<button className="bg-blue-600">Create</button>
```

**3. Use Typography Scale**
```tsx
// ✅ CORRECT - Use design tokens for font sizes
<h1 className="text-[var(--font-size-9)]">Page Title</h1>
<p className="text-[var(--font-size-3)]">Body text</p>

// ❌ INCORRECT - Never hardcode font sizes
<h1 className="text-4xl">Page Title</h1>
<p className="text-base">Body text</p>
```

**4. Use Spacing Scale (8pt Grid)**
```tsx
// ✅ CORRECT - Use design tokens
<div className="p-[var(--space-6)] gap-[var(--space-4)]">
<div className="mt-[var(--space-8)] mb-[var(--space-3)]">

// ❌ INCORRECT - Never use arbitrary spacing
<div className="p-6 gap-4">
<div className="mt-8 mb-3">
```

**5. Consistent Component Patterns**

**Cards:**
```tsx
<div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-[var(--space-6)] shadow-[var(--shadow-2)]">
```

**Modals:**
```tsx
<div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-[var(--radius-2xl)] p-[var(--space-8)] shadow-[var(--shadow-6)]">
```

**Inputs:**
```tsx
<input className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[var(--radius-md)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:ring-2 focus:ring-[var(--input-border-focus)]" />
```

**6. Interactive States**

Always include proper interactive states:
```tsx
<button className="
  bg-[var(--button-create-bg)]
  hover:bg-[var(--button-create-bg-hover)]
  active:bg-[var(--button-create-bg-active)]
  focus:ring-2 focus:ring-[var(--focus-ring)]
  disabled:opacity-50
">
```

**7. Accessibility Requirements**

- Use semantic HTML (`<button>`, `<nav>`, `<header>`, etc.)
- Always include focus states (visible focus ring)
- Ensure 4.5:1 contrast ratio for text (use design tokens - they're pre-validated)
- Use proper ARIA attributes when needed
- Minimum touch target: 44x44px

**8. Before Committing New Features**

1. Verify all colors come from design tokens
2. Check button variants are semantic (`ai`, `create`, `destructive`, `secondary`, `ghost`)
3. Ensure spacing follows 8pt grid (`--space-*` tokens)
4. Test keyboard navigation and focus states
5. Verify responsive behavior on mobile
6. Check against `/design-system` showcase for consistency

**9. Reference the Design System**

When in doubt, visit `/design-system` (click color palette in nav) to see:
- All color scales with proper usage
- Button variants with all states
- Typography examples
- Spacing and shadow systems
- Component patterns

**Design System Enforcement:**

Every component, page, and feature should look and feel like it belongs to the same cohesive system. If it doesn't match the aesthetic in `/design-system`, it needs to be updated before merging.

---

## API Design for AI / GPT Integration

We expose REST JSON endpoints designed for AI agents and user management:

### Container/Bag APIs

- `GET /api/bags/[code]` - Get bag with items and links (public or owner)
- `POST /api/bags` - Create a new bag
- `PATCH /api/bags/[code]` - Update bag metadata
- `DELETE /api/bags/[code]` - Delete a bag
- `GET /api/bags/[code]/items` - Get all items in a bag
- `POST /api/bags/[code]/items` - Add item to bag

### Item APIs

- `GET /api/items/[id]` - Get single item with links
- `PATCH /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `GET /api/items/[id]/links` - Get all links for an item
- `POST /api/items/[id]/links` - Add link to item

### Link APIs

- `PATCH /api/links/[id]` - Update a link
- `DELETE /api/links/[id]` - Delete a link

### User/Profile APIs ✨ NEW

- `GET /api/users/[handle]/bags` - Get user profile and public bags
  - Returns: `{ profile: {...}, bags: [...], totalBags: number }`
  - Anonymous access allowed
  - Only returns public bags
  - 404 if user not found

### AI Enhancement APIs

- `POST /api/ai/enrich-item` - AI-powered item enrichment
- `POST /api/ai/find-product-image` - Find product images using GPT Vision
- `POST /api/ai/identify-products` - Identify products from text/images

Design priorities:

- Always return structured JSON with predictable shapes.
- Include enough context for an LLM to understand relationships:
  - e.g., container metadata + `items: [...]` each with `links: [...]`.
- Use clear error messages in JSON (e.g. `{ "error": "Container not found" }`).

Later we will define an OpenAPI spec to wrap these endpoints for a custom GPT.

---

## Coding Conventions

- Use **TypeScript** everywhere (components, API routes, helper functions).
- Prefer **server components** where possible, and **client components** for interactive bits only.
- Use the Next.js App Router (`app/` directory).
- Encapsulate Supabase logic in a dedicated module (`lib/supabaseClient.ts` and small helper functions).
- Avoid unnecessary abstractions or micro-optimizations; this is an MVP.
- Use async/await, not .then chains.
- Follow a consistent file organization, e.g.:

  - `app/(dashboard)/containers/page.tsx` – list view
  - `app/(dashboard)/containers/[id]/page.tsx` – editor
  - `app/c/[code]/page.tsx` – public container view
  - `app/api/teed/*` – API routes

- Handle errors gracefully, especially in API routes and data fetching hooks.

---

## How to Work with the Human

- The human is technical but often overwhelmed by setup details.
- They want **minimal terminal commands** and prefer Cursor/Claude to handle project wiring.
- When suggesting changes:
  - Group related edits in a single patch when reasonable.
  - Explain briefly what you're doing and why.
  - Favor step-by-step sequences they can follow.

If any ambiguity arises, prefer simple, explicit implementations that can be iterated on later.

---

## User Profile System

### Architecture

**Routes:**
- `/u/[handle]` - Public user profile page (Server Component)
- `/api/users/[handle]/bags` - Profile API endpoint

**Database:**
- User data stored in `profiles` table
- Each profile has: `id`, `handle`, `display_name`, `avatar_url`, `bio`, `created_at`
- Handles are unique and used for public URLs

**Key Features:**
1. Public profiles accessible without authentication
2. Shows only public bags (filtered by `is_public = true`)
3. Displays user stats (bag count, join date)
4. Avatar with gradient fallback for users without images
5. Clickable bag cards navigate to `/c/[code]`
6. SEO-friendly with dynamic metadata generation
7. 404 handling for non-existent users

**User Discovery Flow:**
1. User creates public bags with `is_public = true`
2. Public bags appear on their profile at `/u/[handle]`
3. Shared bags show "by @username" - clickable to profile
4. Dashboard shows clickable @username in header
5. Profile displays grid of all public bags
6. Anyone can view profiles and public bags without auth

**Implementation Notes:**
- Profile data fetched server-side in `page.tsx`
- Uses `createServerSupabase()` for auth-aware queries
- `UserProfileView.tsx` is client component for interactivity
- Full dark mode support matching rest of app
- Empty state when user has no public bags
- Matches dashboard visual styling for consistency

**Testing:**
- Comprehensive E2E tests in `tests/e2e/05-user-profile.spec.ts`
- Tests profile viewing, attribution links, API, SEO, dark mode
- Validates public/private bag filtering
- Tests user discovery from public bags and dashboard

---

## Testing Strategy

### E2E Tests (Playwright)

**Test Files:**
1. `01-auth.spec.ts` - Authentication flows
2. `02-bag-management.spec.ts` - CRUD for bags and items
3. `03-link-management.spec.ts` - Link operations
4. `04-public-sharing.spec.ts` - Public views, QR codes, sharing
5. `05-user-profile.spec.ts` - User profiles, discovery, attribution ✨ NEW

**Test Utilities:**
- `utils/auth.ts` - Login helpers
- `utils/testData.ts` - Bag/item creation and cleanup

**Coverage Focus:**
- User authentication and session management
- Bag/item CRUD operations with auto-save
- Link management and metadata
- Public sharing and privacy controls
- QR code generation and sharing UI
- User profile viewing and navigation ✨ NEW
- Attribution link flows ✨ NEW
- API endpoint validation ✨ NEW
- Dark mode rendering ✨ NEW
- Responsive design across viewports

**Running Tests:**
```bash
# All tests
npx playwright test

# Specific test file
npx playwright test tests/e2e/05-user-profile.spec.ts

# With UI
npx playwright test --ui

# Specific browser
npx playwright test --project=chromium
```
