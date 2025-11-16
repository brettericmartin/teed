# Teed Supabase Database - Complete Schema Report

**Generated:** 2025-11-15
**Database:** jvljmfdroozexzodqupg.supabase.co
**Purpose:** Compare actual database schema against MVP specification in claude.md

---

## Executive Summary

The Teed Supabase database contains a **more complex schema** than documented in the MVP specification (claude.md). The database has evolved beyond the initial simple container/item/link model.

### Key Findings

#### CRITICAL Issues
- ❌ **Missing general-purpose 'links' table** - Core MVP feature missing
- ❌ **Missing 'code' field on bags** - Cannot easily share with simple codes like `/c/camping-kit`
- ❌ **Missing usage tracking on share_links** - No max_uses, uses count, or expires_at

#### Design Differences
- ⚠️ **bag_items tied to catalog system** - Different from free-form item model in MVP spec
- ⚠️ **Missing updated_at timestamp** on bags table

### Schema Statistics
- **Total tables:** 12
- **Total columns:** 88
- **Total foreign keys:** 21
- **Composite primary keys:** 2 (bag_tags, price_cache)

---

## Table Inventory

### MVP Core Tables (Expected)

| Table | Status | Description |
|-------|--------|-------------|
| `profiles` | ✓ Exists | User profiles (maps to expected "users") |
| `bags` | ⚠️ Modified | Containers/kits (maps to expected "containers" but missing 'code' field) |
| `bag_items` | ⚠️ Different | Items in bags (catalog-based vs free-form) |
| `share_links` | ⚠️ Simplified | Share codes (simpler than expected "invite_codes") |
| `links` | ❌ **MISSING** | General-purpose links table |

### Extended Tables (Not in MVP)

| Table | Purpose |
|-------|---------|
| `catalog_items` | Product catalog with verified items |
| `categories` | Product categories and subcategories |
| `affiliate_links` | Affiliate link tracking with earnings |
| `media_assets` | Centralized media storage |
| `analytics_events` | Event tracking and analytics |
| `follows` | Social following system |
| `price_cache` | Cached merchant pricing data |
| `bag_tags` | Tagging system for bags |

---

## Detailed Table Schemas

### 1. profiles

**Purpose:** User profiles (maps to expected "users" table)

**Missing from spec:** No explicit `auth_user_id` field visible (likely using `id` directly)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | uuid | NOT NULL, PK | - | Primary key |
| `handle` | text | NOT NULL | - | Username/handle |
| `display_name` | text | NOT NULL | - | Display name |
| `avatar_url` | text | nullable | - | Profile picture |
| `bio` | text | nullable | - | User bio |
| `created_at` | timestamptz | nullable | now() | Creation timestamp |

**Foreign Keys:** None

---

### 2. bags

**Purpose:** Containers/kits (maps to expected "containers" table)

**Differences from spec:**
- ❌ Missing `code` field (unique identifier for URLs)
- ❌ Missing `updated_at` timestamp
- ✓ Has `title` instead of `name` (similar)
- ➕ Extra fields: `background_image`, `parent_bag_id`, `derived_from_owner_id`, `derivation_visibility`

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | NOT NULL | - | → profiles.id | Bag owner |
| `title` | text | NOT NULL | - | - | Bag name |
| `description` | text | nullable | - | - | Bag description |
| `is_public` | boolean | nullable | true | - | Public visibility |
| `background_image` | text | nullable | - | - | Header image |
| `parent_bag_id` | uuid | nullable | - | → bags.id | For nested bags |
| `derived_from_owner_id` | uuid | nullable | - | → profiles.id | Derivation tracking |
| `derivation_visibility` | text | nullable | 'attributed' | - | Attribution settings |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `owner_id` → `profiles.id`
- `parent_bag_id` → `bags.id` (self-reference for hierarchy)
- `derived_from_owner_id` → `profiles.id`

---

### 3. bag_items

**Purpose:** Items within bags (maps to expected "items" table)

**Differences from spec:**
- ❌ No standalone `name`, `brand`, `category`, `image_url` fields
- ➕ Uses catalog system with `catalog_item_id`
- ➕ Has override fields: `custom_name`, `custom_description`, `custom_photo_id`
- ➕ Has `quantity` field
- ✓ Has `sort_index` (similar to spec's `sort_order`)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `bag_id` | uuid | NOT NULL | - | → bags.id | Parent bag |
| `catalog_item_id` | uuid | nullable | - | → catalog_items.id | Reference to catalog |
| `custom_name` | text | nullable | - | - | Override catalog name |
| `custom_description` | text | nullable | - | - | Override catalog desc |
| `custom_photo_id` | uuid | nullable | - | → media_assets.id | Custom photo |
| `quantity` | integer | nullable | 1 | - | Item quantity |
| `sort_index` | integer | nullable | 1000 | - | Display order |
| `notes` | text | nullable | - | - | User notes |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `bag_id` → `bags.id`
- `catalog_item_id` → `catalog_items.id`
- `custom_photo_id` → `media_assets.id`

---

### 4. share_links

**Purpose:** Share codes for bags (maps to expected "invite_codes" table)

**Differences from spec:**
- ✓ Has `slug` instead of `code` (similar purpose)
- ❌ Missing `max_uses`, `uses` count
- ❌ Missing `expires_at` field
- ➕ Has `owner_id`, `title`, `origin_creator_id`

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | NOT NULL | - | → profiles.id | Who created link |
| `bag_id` | uuid | nullable | - | → bags.id | Linked bag |
| `slug` | text | NOT NULL | - | - | URL slug/code |
| `title` | text | nullable | - | - | Share link title |
| `origin_creator_id` | uuid | nullable | - | → profiles.id | Original creator |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `owner_id` → `profiles.id`
- `bag_id` → `bags.id`
- `origin_creator_id` → `profiles.id`

---

### 5. catalog_items

**Purpose:** Product catalog (NOT in MVP spec)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `brand` | text | NOT NULL | - | - | Product brand |
| `model` | text | NOT NULL | - | - | Product model |
| `category_id` | uuid | nullable | - | → categories.id | Category |
| `specs` | jsonb | nullable | - | - | Product specs |
| `image_url` | text | nullable | - | - | Product image |
| `msrp` | numeric | nullable | - | - | Manufacturer price |
| `verified` | boolean | nullable | false | - | Verified product |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `category_id` → `categories.id`

---

### 6. categories

**Purpose:** Product categories (NOT in MVP spec)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `name` | text | NOT NULL | - | - | Category name |
| `subcategory` | text | nullable | - | - | Subcategory |
| `icon` | text | nullable | - | - | Category icon |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:** None

---

### 7. affiliate_links

**Purpose:** Affiliate link tracking (NOT in MVP spec)

⚠️ **Note:** This is NOT the general-purpose "links" table from the MVP spec. It's specifically for affiliate tracking.

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | NOT NULL | - | → profiles.id | Link owner |
| `catalog_item_id` | uuid | NOT NULL | - | → catalog_items.id | Product |
| `merchant` | text | NOT NULL | - | - | Merchant name |
| `url` | text | NOT NULL | - | - | Affiliate URL |
| `region` | text | nullable | 'US' | - | Geographic region |
| `clicks` | integer | nullable | 0 | - | Click count |
| `last_click_at` | timestamptz | nullable | - | - | Last click time |
| `earnings_usd` | numeric | nullable | - | - | Earnings tracked |
| `last_sync_at` | timestamptz | nullable | - | - | Last sync with API |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `owner_id` → `profiles.id`
- `catalog_item_id` → `catalog_items.id`

---

### 8. media_assets

**Purpose:** Media storage (NOT in MVP spec)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | nullable | - | → profiles.id | Asset owner |
| `url` | text | NOT NULL | - | - | Media URL |
| `source_type` | text | nullable | - | - | Source type |
| `alt` | text | nullable | - | - | Alt text |
| `width` | integer | nullable | - | - | Image width |
| `height` | integer | nullable | - | - | Image height |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `owner_id` → `profiles.id`

---

### 9. analytics_events

**Purpose:** Event tracking (NOT in MVP spec)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | bigint | NOT NULL, PK | - | - | Primary key |
| `event_type` | text | NOT NULL | - | - | Event type |
| `actor_id` | uuid | nullable | - | → profiles.id | Who performed |
| `bag_id` | uuid | nullable | - | → bags.id | Related bag |
| `bag_item_id` | uuid | nullable | - | → bag_items.id | Related item |
| `target_url` | text | nullable | - | - | Target URL |
| `merchant` | text | nullable | - | - | Merchant |
| `metadata` | jsonb | nullable | - | - | Extra data |
| `created_at` | timestamptz | nullable | now() | - | Event timestamp |

**Foreign Keys:**
- `actor_id` → `profiles.id`
- `bag_id` → `bags.id`
- `bag_item_id` → `bag_items.id`

---

### 10. follows

**Purpose:** Social following (NOT in MVP spec)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `id` | uuid | NOT NULL, PK | gen_random_uuid() | - | Primary key |
| `follower_id` | uuid | NOT NULL | - | → profiles.id | Who is following |
| `target_user_id` | uuid | nullable | - | → profiles.id | User being followed |
| `target_bag_id` | uuid | nullable | - | → bags.id | Bag being followed |
| `created_at` | timestamptz | nullable | now() | - | Follow timestamp |

**Foreign Keys:**
- `follower_id` → `profiles.id`
- `target_user_id` → `profiles.id`
- `target_bag_id` → `bags.id`

**Note:** Either `target_user_id` OR `target_bag_id` should be set, not both.

---

### 11. price_cache

**Purpose:** Cached pricing data (NOT in MVP spec)

**Composite Primary Key:** (`catalog_item_id`, `merchant`)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `catalog_item_id` | uuid | NOT NULL, PK | - | → catalog_items.id | Product |
| `merchant` | text | NOT NULL, PK | - | - | Merchant name |
| `price` | numeric | nullable | - | - | Cached price |
| `currency` | text | nullable | 'USD' | - | Currency code |
| `scraped_at` | timestamptz | nullable | now() | - | When scraped |

**Foreign Keys:**
- `catalog_item_id` → `catalog_items.id`

---

### 12. bag_tags

**Purpose:** Tagging system (NOT in MVP spec)

**Composite Primary Key:** (`bag_id`, `tag`)

| Column | Type | Constraints | Default | FK Reference | Notes |
|--------|------|-------------|---------|--------------|-------|
| `bag_id` | uuid | NOT NULL, PK | - | → bags.id | Tagged bag |
| `tag` | text | NOT NULL, PK | - | - | Tag text |
| `created_at` | timestamptz | nullable | now() | - | Creation timestamp |

**Foreign Keys:**
- `bag_id` → `bags.id`

---

## Data Model Architecture

### Entity Relationship Map

```
profiles (users)
  ├─> bags (owner_id)
  │    ├─> bag_items (bag_id)
  │    │    ├─> catalog_items (catalog_item_id)
  │    │    │    ├─> categories (category_id)
  │    │    │    ├─> affiliate_links (catalog_item_id)
  │    │    │    └─> price_cache (catalog_item_id)
  │    │    └─> media_assets (custom_photo_id)
  │    ├─> share_links (bag_id)
  │    └─> bag_tags (bag_id)
  ├─> bags (parent_bag_id) [self-reference]
  ├─> bags (derived_from_owner_id)
  ├─> affiliate_links (owner_id)
  ├─> media_assets (owner_id)
  └─> follows (follower_id, target_user_id)

follows
  ├─> profiles (follower_id, target_user_id)
  └─> bags (target_bag_id)

analytics_events
  ├─> profiles (actor_id)
  ├─> bags (bag_id)
  └─> bag_items (bag_item_id)
```

### Key Design Patterns

#### Catalog-First Approach
- `catalog_items` contains verified products
- `bag_items` reference catalog via `catalog_item_id`
- Users can override with `custom_name`, `custom_description`, `custom_photo_id`
- Differs from MVP spec's free-form item model

#### Social & Derivation Features
- `follows` enables user-to-user and user-to-bag following
- `bags` can be derived from other bags (`parent_bag_id`, `derived_from_owner_id`)
- `derivation_visibility` controls attribution privacy

#### Monetization Infrastructure
- `affiliate_links` tracks clicks and earnings per user
- `analytics_events` captures user interactions
- `price_cache` stores current merchant pricing

---

## Missing MVP Features

### 1. General-Purpose Links Table ⚠️ CRITICAL

**Status:** MISSING

**Expected from claude.md:**
```sql
CREATE TABLE links (
  id uuid PRIMARY KEY,
  container_id uuid REFERENCES containers(id),
  item_id uuid REFERENCES items(id),
  kind text, -- 'retail', 'affiliate', 'review', 'video'
  url text,
  label text,
  metadata jsonb,
  created_at timestamptz
);
```

**Current State:**
- Only `affiliate_links` table exists (specific use case)
- Tied to `catalog_items`, not `bag_items` or `bags`
- Cannot attach retail, review, or video links to user's bags or items

**Impact:** HIGH
- Core MVP feature missing
- Users cannot add shopping links to their gear
- AI agents cannot retrieve purchase links from containers

### 2. Container Codes ⚠️ HIGH

**Status:** MISSING

**Expected:** `code` field on `bags` table (text, unique, human-friendly)

**Example:** "camping-2024" for URL `/c/camping-2024`

**Current State:**
- No `code` field on `bags`
- `share_links` table has `slug` but is separate entity
- Unclear how to generate simple `/c/[code]` URLs

**Impact:** HIGH
- Cannot easily share containers with simple codes
- URL structure unclear

### 3. Share Link Usage Tracking ⚠️ MEDIUM

**Status:** MISSING

**Expected Fields:**
- `max_uses` (integer, nullable)
- `uses` (integer, default 0)
- `expires_at` (timestamptz, nullable)

**Current State:** None of these fields exist on `share_links`

**Impact:** MEDIUM
- Cannot create limited-use share links
- Cannot expire old share links

### 4. Updated Timestamp ⚠️ LOW

**Status:** MISSING

**Expected:** `updated_at` field on `bags` table

**Current State:** Only `created_at` exists

**Impact:** LOW
- Nice to have for tracking modifications
- Can be added easily with trigger

---

## Recommendations

### Critical Priority

1. **Create general-purpose `links` table**
   - Enable attaching arbitrary URLs to bags and bag_items
   - Support different link types (retail, affiliate, review, video)
   - Include metadata field for scraped content

2. **Add `code` field to `bags` table**
   - Make it unique and indexed
   - Generate human-friendly codes
   - Enable simple `/c/[code]` URLs

### High Priority

3. **Add usage tracking to `share_links`**
   - Add `max_uses`, `uses`, `expires_at` fields
   - Implement usage increment logic

4. **Support free-form items**
   - Make `catalog_item_id` nullable (if not already)
   - Document that items can be free-form via custom fields
   - OR add standalone fields: `name`, `brand`, `category`, `image_url`

### Medium Priority

5. **Add `updated_at` to `bags`**
   - Add column with trigger to auto-update

6. **Document RLS policies**
   - Query and document Row Level Security policies
   - Ensure proper access control

### Low Priority

7. **Schema migration from old design**
   - If this replaced an older schema, document migration path
   - Provide scripts to align with MVP spec if needed

---

## Questions for Clarification

1. **Is the catalog-first design intentional?**
   - Should items always come from a catalog?
   - Or should we support both catalog and free-form items?

2. **What is the relationship between `bags.code` and `share_links.slug`?**
   - Should bags have built-in codes?
   - Or only accessible via separate share links?

3. **Are the extra tables (follows, analytics, etc.) planned for later phases?**
   - Or should they be removed for MVP simplicity?

4. **How should the general `links` table relate to `affiliate_links`?**
   - Should affiliate links also be stored in general links table?
   - Or keep separate for tracking purposes?

5. **RLS Policies:**
   - What Row Level Security policies are in place?
   - Need to query pg_policies table to document

---

## Notes on MCP Tools

**Attempted Methods:**
- ✗ MCP tools (mcp__*) not available in this session
- ✗ Supabase CLI not installed
- ✗ psql not installed
- ✓ Used Supabase REST API (PostgREST) OpenAPI endpoint
- ✓ Extracted schema from `https://[project].supabase.co/rest/v1/`

**Limitations:**
- Cannot query RLS policies via REST API
- Cannot see views, functions, triggers via OpenAPI endpoint
- Would need database credentials and psql/pg_dump for complete schema

**To Get Complete Schema:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref jvljmfdroozexzodqupg

# Generate full schema dump
supabase db dump --schema public > schema.sql

# Or query RLS policies directly with psql
psql postgres://[connection-string] -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

---

**End of Report**
