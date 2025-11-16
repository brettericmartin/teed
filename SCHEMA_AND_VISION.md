# Teed Database Schema & Product Vision
**Complete Technical Specification for UI & AI Integration Development**

---

## Executive Summary

**Teed** is an AI-first web application for organizing gear "bags" (containers) with items, links, and intelligent sharing. The system is designed to work seamlessly in both a browser UI and via AI agents (ChatGPT custom GPT, Claude, etc.).

**Current State:**
- Database: Supabase PostgreSQL with 12 tables
- Framework: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- AI: OpenAI integration active and tested
- Hosting: Vercel

**Primary Use Cases:**
1. Users create "bags" (camping kit, EDC loadout, travel gear, etc.)
2. Add items to bags with details, photos, notes
3. Attach links (retail, affiliate, reviews, videos) to items/bags
4. Generate shareable codes/slugs for easy distribution
5. AI agents fetch and reason over bags to help users compare gear, plan purchases, make recommendations

---

## Database Architecture Overview

### Tables Inventory (12 total)

**Core MVP Tables:**
1. `profiles` - User accounts
2. `bags` - Containers/kits/loadouts
3. `bag_items` - Items within bags
4. `share_links` - Shareable URLs with slugs
5. `links` - ❌ **MISSING** (general-purpose links for items/bags)

**Extended Feature Tables:**
6. `catalog_items` - Verified product catalog
7. `categories` - Product categorization
8. `affiliate_links` - Affiliate tracking (tied to catalog)
9. `media_assets` - Centralized media storage
10. `analytics_events` - User interaction tracking
11. `follows` - Social following (users/bags)
12. `price_cache` - Merchant price data
13. `bag_tags` - Tagging system

---

## Detailed Schema Breakdown

### 1. profiles (User Accounts)

**Purpose:** User profiles linked to Supabase Auth

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, NOT NULL | Primary key |
| `handle` | text | NOT NULL | Username (e.g., @johndoe) |
| `display_name` | text | NOT NULL | Display name |
| `avatar_url` | text | nullable | Profile picture URL |
| `bio` | text | nullable | User bio |
| `created_at` | timestamptz | default now() | Account creation |

**Relationships:**
- Links to `auth.users` (Supabase Auth)
- One-to-many: `bags`, `affiliate_links`, `media_assets`, `follows`

**Use Cases:**
- User authentication and profile management
- Social features (following, attribution)
- Ownership tracking for all user content

---

### 2. bags (Containers/Kits/Loadouts)

**Purpose:** Main containers for organizing items

| Column | Type | Constraints | Default | FK | Notes |
|--------|------|-------------|---------|-----|-------|
| `id` | uuid | PK, NOT NULL | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | NOT NULL | - | → profiles.id | Bag owner |
| `title` | text | NOT NULL | - | - | Bag name |
| `description` | text | nullable | - | - | Bag description |
| `is_public` | boolean | nullable | true | - | Visibility |
| `background_image` | text | nullable | - | - | Header/hero image |
| `parent_bag_id` | uuid | nullable | - | → bags.id | For nested bags |
| `derived_from_owner_id` | uuid | nullable | - | → profiles.id | Derivation tracking |
| `derivation_visibility` | text | nullable | 'attributed' | - | Attribution setting |
| `created_at` | timestamptz | nullable | now() | - | Creation time |

**Missing Fields (from MVP spec):**
- ⚠️ `code` (text, unique) - Short identifier for URLs like `/c/camping-kit`
- ⚠️ `updated_at` (timestamptz) - Last modification time

**Relationships:**
- Belongs to: `profiles` (owner)
- Has many: `bag_items`, `share_links`, `bag_tags`
- Can reference: `bags` (parent, for hierarchy)

**Use Cases:**
- Create "camping gear" bag, "EDC loadout", "travel kit"
- Derive/fork bags from other users
- Track public vs private bags
- Organize nested/hierarchical bags

**Critical Gap:** No built-in `code` field means URLs must go through `share_links` table rather than simple `/c/[code]` pattern.

---

### 3. bag_items (Items in Bags)

**Purpose:** Individual items within bags

| Column | Type | Constraints | Default | FK | Notes |
|--------|------|-------------|---------|-----|-------|
| `id` | uuid | PK, NOT NULL | gen_random_uuid() | - | Primary key |
| `bag_id` | uuid | NOT NULL | - | → bags.id | Parent bag |
| `catalog_item_id` | uuid | nullable | - | → catalog_items.id | Reference catalog |
| `custom_name` | text | nullable | - | - | Override name |
| `custom_description` | text | nullable | - | - | Override desc |
| `custom_photo_id` | uuid | nullable | - | → media_assets.id | Custom photo |
| `quantity` | integer | nullable | 1 | - | Item count |
| `sort_index` | integer | nullable | 1000 | - | Display order |
| `notes` | text | nullable | - | - | User notes |
| `created_at` | timestamptz | nullable | now() | - | Creation time |

**Design Pattern:** Catalog-first with overrides
- Items CAN reference verified `catalog_items` for brand/model/specs
- Users CAN override with custom fields for free-form entry
- Supports both curated catalog AND user-generated items

**Relationships:**
- Belongs to: `bags`
- Can reference: `catalog_items`, `media_assets`
- Should have: Links attached (via missing `links` table)

**Use Cases:**
- Add "Osprey Atmos 65L Backpack" from catalog
- Add custom item "My favorite water bottle" (no catalog)
- Override catalog photo with personal photo
- Add notes like "Need to replace soon"
- Sort items by drag-and-drop in UI

---

### 4. share_links (Shareable URLs)

**Purpose:** Generate shareable URLs with custom slugs

| Column | Type | Constraints | Default | FK | Notes |
|--------|------|-------------|---------|-----|-------|
| `id` | uuid | PK, NOT NULL | gen_random_uuid() | - | Primary key |
| `owner_id` | uuid | NOT NULL | - | → profiles.id | Creator |
| `bag_id` | uuid | nullable | - | → bags.id | Linked bag |
| `slug` | text | NOT NULL | - | - | URL slug |
| `title` | text | nullable | - | - | Share link title |
| `origin_creator_id` | uuid | nullable | - | → profiles.id | Original creator |
| `created_at` | timestamptz | nullable | now() | - | Creation time |

**Missing Fields (from MVP spec):**
- ⚠️ `max_uses` (integer, nullable) - Usage limit
- ⚠️ `uses` (integer, default 0) - Current usage count
- ⚠️ `expires_at` (timestamptz, nullable) - Expiration date

**Relationships:**
- Belongs to: `profiles` (owner), `bags`
- Tracks: `origin_creator_id` for attribution

**Use Cases:**
- Generate URL like `/s/camping-essentials-2024`
- Share bag via short slug with friends/AI
- Track who created vs who shared
- (Future) Limit uses to 100 or expire after 30 days

**Critical Gap:** Cannot create limited-use or expiring share links without usage tracking fields.

---

### 5. links ❌ COMPLETELY MISSING (Critical MVP Feature)

**Expected Schema:**

```sql
CREATE TABLE links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id uuid REFERENCES bags(id) ON DELETE CASCADE,
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,
  kind text NOT NULL, -- 'retail', 'affiliate', 'review', 'video', 'article'
  url text NOT NULL,
  label text, -- 'Amazon', 'REI', 'YouTube Review'
  metadata jsonb, -- { title, price, favicon, scrape_date, etc. }
  created_at timestamptz DEFAULT now(),
  CONSTRAINT links_target_check CHECK (
    (bag_id IS NOT NULL AND bag_item_id IS NULL) OR
    (bag_id IS NULL AND bag_item_id IS NOT NULL)
  )
);
```

**Purpose:**
- Attach retail purchase links to items
- Attach review URLs (YouTube, blogs, etc.)
- Attach affiliate links for monetization
- Attach documentation/manuals/articles
- Store scraped metadata (price, title, etc.)

**Why Critical:**
- Core value prop: Users share gear WITH purchase links
- AI agents need to fetch and reason over links
- Enables "where to buy" functionality
- Enables comparison shopping

**Current Workaround:**
- Only `affiliate_links` table exists
- Tied to `catalog_items`, NOT user's `bag_items`
- Cannot attach arbitrary links to user's actual gear

**Impact of Missing Table:**
- Users cannot add "Buy on Amazon" to their items
- AI cannot help with "where to buy this item"
- No review aggregation per item
- No video tutorial links per item

---

### 6. catalog_items (Product Catalog)

**Purpose:** Verified product database (beyond MVP scope)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `brand` | text | e.g., "Osprey" |
| `model` | text | e.g., "Atmos 65L" |
| `category_id` | uuid | → categories.id |
| `specs` | jsonb | Technical specs |
| `image_url` | text | Product photo |
| `msrp` | numeric | Manufacturer price |
| `verified` | boolean | Verified by admin |
| `created_at` | timestamptz | Creation time |

**Relationships:**
- Belongs to: `categories`
- Referenced by: `bag_items`, `affiliate_links`, `price_cache`

**Use Cases:**
- Curated database of outdoor gear, EDC items, etc.
- Autocomplete when adding items to bags
- Consistent brand/model naming
- Affiliate link tracking per product
- Price comparison across merchants

**Design Pattern:**
- Centralized catalog of verified products
- Users can reference OR create free-form items
- Enables data consistency and aggregation

---

### 7. categories (Product Categories)

**Purpose:** Organize catalog items

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `name` | text | e.g., "Backpacking" |
| `subcategory` | text | e.g., "Backpacks" |
| `icon` | text | Icon identifier |
| `created_at` | timestamptz | Creation time |

**Use Cases:**
- Browse catalog by category
- Filter items in UI
- Generate category-specific recommendations
- Organize affiliate links by type

---

### 8. affiliate_links (Affiliate Tracking)

**Purpose:** Track affiliate links with earnings (NOT general links table)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `owner_id` | uuid | → profiles.id |
| `catalog_item_id` | uuid | → catalog_items.id |
| `merchant` | text | "Amazon", "REI", "Backcountry" |
| `url` | text | Affiliate URL |
| `region` | text | "US", "EU", etc. (default: 'US') |
| `clicks` | integer | Click tracking |
| `last_click_at` | timestamptz | Last click time |
| `earnings_usd` | numeric | Earnings tracked |
| `last_sync_at` | timestamptz | Last API sync |
| `created_at` | timestamptz | Creation time |

**Relationships:**
- Belongs to: `profiles`, `catalog_items`

**Use Cases:**
- Users earn commissions on gear recommendations
- Track clicks and conversions per product
- Sync with affiliate networks
- Display earnings dashboard

**Important Distinction:**
- This is NOT the general `links` table from MVP spec
- Tied to `catalog_items`, not user's `bag_items`
- Focused on monetization tracking
- Does NOT replace need for general links table

---

### 9. media_assets (Media Storage)

**Purpose:** Centralized media management

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `owner_id` | uuid | → profiles.id |
| `url` | text | Supabase Storage URL |
| `source_type` | text | Upload source |
| `alt` | text | Alt text |
| `width` | integer | Image width |
| `height` | integer | Image height |
| `created_at` | timestamptz | Upload time |

**Relationships:**
- Belongs to: `profiles`
- Referenced by: `bag_items.custom_photo_id`

**Use Cases:**
- Upload custom item photos
- Upload bag header images
- Track photo metadata for optimization
- Reuse photos across multiple bags/items

---

### 10. analytics_events (Event Tracking)

**Purpose:** User interaction analytics

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | Primary key |
| `event_type` | text | "view", "click", "purchase", etc. |
| `actor_id` | uuid | → profiles.id |
| `bag_id` | uuid | → bags.id |
| `bag_item_id` | uuid | → bag_items.id |
| `target_url` | text | Link clicked |
| `merchant` | text | Merchant name |
| `metadata` | jsonb | Extra event data |
| `created_at` | timestamptz | Event time |

**Use Cases:**
- Track bag views
- Track link clicks
- Attribution for affiliate earnings
- User behavior analytics
- Popular items/bags tracking

---

### 11. follows (Social Following)

**Purpose:** Follow users or specific bags

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `follower_id` | uuid | → profiles.id (who follows) |
| `target_user_id` | uuid | → profiles.id (user followed) |
| `target_bag_id` | uuid | → bags.id (bag followed) |
| `created_at` | timestamptz | Follow time |

**Constraint:** Either `target_user_id` OR `target_bag_id`, not both

**Use Cases:**
- Follow expert gear reviewers
- Follow specific "ultimate camping setup" bag
- Get notified of updates
- Build social graph for recommendations

---

### 12. price_cache (Price Data)

**Purpose:** Cached merchant pricing

**Composite Primary Key:** (`catalog_item_id`, `merchant`)

| Column | Type | Notes |
|--------|------|-------|
| `catalog_item_id` | uuid | → catalog_items.id |
| `merchant` | text | "Amazon", "REI" |
| `price` | numeric | Current price |
| `currency` | text | "USD", "EUR" (default: 'USD') |
| `scraped_at` | timestamptz | Scrape time |

**Use Cases:**
- Show current prices without live API calls
- Price history tracking
- "Best price" recommendations
- Stale price detection (rescrape if old)

---

### 13. bag_tags (Tagging System)

**Purpose:** Tag bags for organization/discovery

**Composite Primary Key:** (`bag_id`, `tag`)

| Column | Type | Notes |
|--------|------|-------|
| `bag_id` | uuid | → bags.id |
| `tag` | text | "camping", "ultralight", "budget" |
| `created_at` | timestamptz | Tag time |

**Use Cases:**
- Tag bags with keywords
- Browse by tag
- AI-suggested tags
- Search/filter by tags

---

## Entity Relationship Map

```
profiles (users)
  ├─> bags (owner_id)
  │    ├─> bag_items (bag_id)
  │    │    ├─> catalog_items (catalog_item_id) [optional]
  │    │    │    ├─> categories (category_id)
  │    │    │    ├─> affiliate_links (catalog_item_id)
  │    │    │    └─> price_cache (catalog_item_id)
  │    │    ├─> media_assets (custom_photo_id)
  │    │    └─> links (bag_item_id) ❌ MISSING TABLE
  │    ├─> share_links (bag_id)
  │    ├─> bag_tags (bag_id)
  │    └─> links (bag_id) ❌ MISSING TABLE
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

---

## Key User Workflows

### 1. Create a New Bag
1. User creates bag: `INSERT INTO bags (owner_id, title, description, is_public)`
2. Add items: `INSERT INTO bag_items (bag_id, catalog_item_id OR custom_name)`
3. Attach links: `INSERT INTO links (bag_item_id, kind, url, label)` ❌ Table missing
4. Generate share link: `INSERT INTO share_links (bag_id, slug)`
5. Share URL: `/s/[slug]`

### 2. Browse Catalog & Add Item
1. User searches catalog: `SELECT * FROM catalog_items WHERE brand ILIKE '%osprey%'`
2. Filter by category: `JOIN categories ON catalog_items.category_id = categories.id`
3. View prices: `SELECT * FROM price_cache WHERE catalog_item_id = $1`
4. Add to bag: `INSERT INTO bag_items (bag_id, catalog_item_id)`
5. Customize: Update `custom_name`, `custom_description`, `custom_photo_id`

### 3. Share Bag with Friend
1. Create share link: `INSERT INTO share_links (owner_id, bag_id, slug, title)`
2. Copy URL: `https://teed.app/s/camping-essentials`
3. Friend visits link (public access)
4. System shows bag with items and links
5. (Future) Track view: `INSERT INTO analytics_events (event_type, bag_id)`

### 4. AI Agent Fetches Bag
1. Custom GPT receives request: "Show me camping bag ABC123"
2. Calls API: `GET /api/teed/bags/ABC123`
3. Returns JSON:
```json
{
  "id": "...",
  "title": "Summer Camping Essentials",
  "description": "...",
  "items": [
    {
      "id": "...",
      "name": "Osprey Atmos 65L",
      "notes": "Perfect size for 3-day trips",
      "links": [
        {
          "kind": "retail",
          "label": "Amazon",
          "url": "https://...",
          "metadata": { "price": "$299.99" }
        }
      ]
    }
  ]
}
```
4. AI reasons over data and helps user

### 5. Derive/Fork Another User's Bag
1. User finds public bag they like
2. Click "Fork this bag"
3. System creates: `INSERT INTO bags (owner_id, parent_bag_id, derived_from_owner_id, title, description)`
4. Copy items: `INSERT INTO bag_items (bag_id, ...) SELECT ... FROM bag_items WHERE bag_id = parent_bag_id`
5. User customizes their fork
6. Original owner gets attribution via `derived_from_owner_id`

---

## Critical Gaps vs. MVP Specification

### 1. Missing `links` Table (CRITICAL)
**Status:** ❌ Does not exist

**Impact:** Cannot attach purchase links, reviews, or videos to user's items

**Required Schema:**
```sql
CREATE TABLE links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id uuid REFERENCES bags(id) ON DELETE CASCADE,
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text NOT NULL,
  label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (bag_id IS NOT NULL AND bag_item_id IS NULL) OR
    (bag_id IS NULL AND bag_item_id IS NOT NULL)
  )
);

CREATE INDEX idx_links_bag_id ON links(bag_id);
CREATE INDEX idx_links_bag_item_id ON links(bag_item_id);
```

**Use Cases Blocked:**
- Users cannot add "Buy on REI" to items
- AI cannot fetch purchase URLs
- No review aggregation
- No video tutorials per item

**Priority:** **CRITICAL** - Core MVP feature

---

### 2. Missing `code` Field on `bags` (HIGH)
**Status:** ⚠️ Field does not exist on `bags` table

**Impact:** Cannot create simple URLs like `/c/camping-kit`

**Required Migration:**
```sql
ALTER TABLE bags
  ADD COLUMN code text UNIQUE;

CREATE UNIQUE INDEX idx_bags_code ON bags(code);

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_bag_code(title_text text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter int := 0;
BEGIN
  base_code := lower(regexp_replace(title_text, '[^a-zA-Z0-9]+', '-', 'g'));
  base_code := trim(both '-' from base_code);
  base_code := substring(base_code from 1 for 50);

  final_code := base_code;

  WHILE EXISTS (SELECT 1 FROM bags WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;
```

**Current Workaround:** Use `share_links.slug` (separate table, more complex)

**Desired Behavior:**
- `/c/camping-essentials` → directly loads bag
- `/s/custom-share-link` → loads via share_links (for tracking)

**Priority:** **HIGH** - Important for UX and AI integration

---

### 3. Missing Usage Tracking on `share_links` (MEDIUM)
**Status:** ⚠️ Fields do not exist

**Impact:** Cannot create limited-use or expiring share links

**Required Migration:**
```sql
ALTER TABLE share_links
  ADD COLUMN max_uses integer,
  ADD COLUMN uses integer DEFAULT 0,
  ADD COLUMN expires_at timestamptz;

-- Function to check if link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(link_id uuid)
RETURNS boolean AS $$
DECLARE
  link_record share_links;
BEGIN
  SELECT * INTO link_record FROM share_links WHERE id = link_id;

  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;

  IF link_record.max_uses IS NOT NULL AND link_record.uses >= link_record.max_uses THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
```

**Use Cases Blocked:**
- "Share this link 10 times max"
- "Link expires in 30 days"
- Temporary access for events/groups

**Priority:** **MEDIUM** - Nice to have, not blocking MVP

---

### 4. Missing `updated_at` on `bags` (LOW)
**Status:** ⚠️ Field does not exist

**Impact:** Cannot track when bags were last modified

**Required Migration:**
```sql
ALTER TABLE bags
  ADD COLUMN updated_at timestamptz DEFAULT now();

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bags_updated_at
  BEFORE UPDATE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Priority:** **LOW** - Easy to add later

---

## API Design for AI Agents

### Core Principles
1. **LLM-first:** Clear, predictable JSON responses
2. **Nested data:** Include related items/links in single response
3. **Public access:** Allow anonymous reads for public bags
4. **Error clarity:** Clear error messages in JSON

### Proposed API Endpoints

#### 1. GET /api/teed/bags/[code]
**Fetch bag by code with all items and links**

**Request:**
```
GET /api/teed/bags/camping-essentials
```

**Response:**
```json
{
  "id": "uuid",
  "code": "camping-essentials",
  "title": "Summer Camping Essentials",
  "description": "My go-to gear for warm weather camping",
  "is_public": true,
  "owner": {
    "id": "uuid",
    "handle": "@outdoorsman",
    "display_name": "John Doe"
  },
  "items": [
    {
      "id": "uuid",
      "name": "Osprey Atmos 65L Backpack",
      "brand": "Osprey",
      "notes": "Perfect for 3-day trips",
      "quantity": 1,
      "sort_index": 1,
      "links": [
        {
          "id": "uuid",
          "kind": "retail",
          "label": "Amazon",
          "url": "https://amazon.com/...",
          "metadata": {
            "price": "$299.99",
            "in_stock": true
          }
        },
        {
          "id": "uuid",
          "kind": "review",
          "label": "YouTube Review",
          "url": "https://youtube.com/..."
        }
      ]
    }
  ],
  "tags": ["camping", "summer", "backpacking"],
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-20T14:22:00Z"
}
```

**Error Cases:**
- 404: Bag not found
- 403: Bag is private and user not owner

---

#### 2. POST /api/teed/bags
**Create new bag**

**Auth:** Required

**Request:**
```json
{
  "title": "Winter Camping Kit",
  "description": "Cold weather essentials",
  "is_public": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "winter-camping-kit",
  "title": "Winter Camping Kit",
  "description": "Cold weather essentials",
  "is_public": false,
  "owner_id": "uuid",
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

#### 3. POST /api/teed/bags/[code]/items
**Add item to bag**

**Auth:** Required (must own bag)

**Request:**
```json
{
  "name": "MSR PocketRocket 2 Stove",
  "brand": "MSR",
  "notes": "Ultralight and reliable",
  "quantity": 1,
  "links": [
    {
      "kind": "retail",
      "label": "REI",
      "url": "https://rei.com/product/..."
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "bag_id": "uuid",
  "name": "MSR PocketRocket 2 Stove",
  "brand": "MSR",
  "notes": "Ultralight and reliable",
  "quantity": 1,
  "sort_index": 1000,
  "created_at": "2025-01-15T10:35:00Z"
}
```

---

#### 4. POST /api/teed/items/[id]/links
**Add link to item**

**Auth:** Required (must own bag)

**Request:**
```json
{
  "kind": "review",
  "label": "Expert Review",
  "url": "https://outdoorgearlab.com/...",
  "metadata": {
    "rating": 4.5,
    "reviewer": "OutdoorGearLab"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "bag_item_id": "uuid",
  "kind": "review",
  "label": "Expert Review",
  "url": "https://outdoorgearlab.com/...",
  "metadata": {
    "rating": 4.5,
    "reviewer": "OutdoorGearLab"
  },
  "created_at": "2025-01-15T10:40:00Z"
}
```

---

#### 5. GET /api/teed/catalog/search
**Search product catalog**

**Auth:** Optional

**Request:**
```
GET /api/teed/catalog/search?q=osprey+backpack&category=backpacking
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "brand": "Osprey",
      "model": "Atmos 65L",
      "category": {
        "name": "Backpacking",
        "subcategory": "Backpacks"
      },
      "msrp": 299.99,
      "image_url": "https://...",
      "specs": {
        "capacity_liters": 65,
        "weight_lbs": 4.56
      }
    }
  ],
  "total": 15,
  "page": 1
}
```

---

#### 6. POST /api/teed/ai/scrape-link
**AI-powered link scraping**

**Auth:** Required

**Request:**
```json
{
  "url": "https://amazon.com/product/..."
}
```

**Response:**
```json
{
  "url": "https://amazon.com/product/...",
  "metadata": {
    "title": "Osprey Atmos AG 65 Men's Backpack",
    "price": "$299.95",
    "currency": "USD",
    "in_stock": true,
    "image_url": "https://...",
    "merchant": "Amazon",
    "scraped_at": "2025-01-15T10:45:00Z"
  },
  "suggested_kind": "retail",
  "suggested_label": "Amazon"
}
```

**Use Case:**
- User pastes Amazon URL
- AI scrapes title, price, availability
- Suggests link type and label
- User confirms or edits

---

#### 7. POST /api/teed/ai/generate-description
**AI-generated item description**

**Auth:** Required

**Request:**
```json
{
  "item_name": "MSR PocketRocket 2",
  "context": "for ultralight backpacking"
}
```

**Response:**
```json
{
  "description": "The MSR PocketRocket 2 is a compact, ultralight canister stove perfect for minimalist backpackers. Weighing just 2.6 oz, it boils water quickly and packs down to fit in your cook pot. Ideal for solo trips or pairs where every ounce counts."
}
```

---

### Authentication Flow

**Supabase Auth Integration:**
1. User signs in via Supabase Auth (email, Google, etc.)
2. Frontend gets session token
3. API routes verify token via Supabase client
4. Row Level Security (RLS) enforces access control

**Public Access:**
- Public bags readable without auth
- Share links accessible to anyone (unless expired/maxed)
- Catalog searchable without auth

**Protected Actions:**
- Creating/editing bags requires auth
- Adding items/links requires bag ownership
- Forking bags requires auth

---

## Custom GPT Integration Plan

### GPT Actions (OpenAPI Spec)

The custom GPT will have access to these actions:

1. **SearchBags** - Find bags by keyword/tag
2. **GetBag** - Fetch full bag details with items/links
3. **CreateBag** - Create new bag for user
4. **AddItemToBag** - Add item with optional links
5. **ScrapeLink** - Parse URL for metadata
6. **SearchCatalog** - Find products in catalog
7. **GenerateDescription** - AI-generated item descriptions
8. **GetPriceComparison** - Compare prices across merchants

### Example GPT Conversation Flow

**User:** "Help me build a camping gear list for a 3-day trip in summer"

**GPT:**
1. Calls `CreateBag`: "3-Day Summer Camping Gear"
2. Suggests essential items (tent, sleeping bag, stove, etc.)
3. For each item:
   - Calls `SearchCatalog` to find popular options
   - Calls `GetPriceComparison` for best deals
   - Calls `AddItemToBag` with recommended option
4. Returns share link: "Your bag is ready: https://teed.app/c/summer-camping-123"

**User:** "Add a water filter to my bag"

**GPT:**
1. Calls `SearchCatalog` for water filters
2. Presents top 3 options with pros/cons
3. User picks one
4. Calls `AddItemToBag` with Sawyer Squeeze
5. Calls `ScrapeLink` for REI URL user provided
6. Attaches link to item
7. Confirms: "Added Sawyer Squeeze Mini with REI link ($24.95)"

**User:** "What's in my camping bag?"

**GPT:**
1. Calls `SearchBags` for user's bags with "camping" tag
2. Calls `GetBag` for most recent one
3. Lists all items with quantities, notes, and links
4. Summarizes total estimated cost
5. Suggests missing items based on trip context

---

## AI Intelligence & Automation Opportunities

### 1. Link Scraping & Enrichment
**Capability:** Parse URLs to extract metadata

**Flow:**
1. User pastes Amazon URL
2. System scrapes: title, price, image, availability
3. AI suggests link type ("retail") and label ("Amazon")
4. Auto-populates `metadata` jsonb field
5. User confirms or edits

**Tech:**
- Puppeteer/Playwright for JavaScript-heavy sites
- BeautifulSoup for simple HTML
- OpenAI Vision API for extracting product details from images
- Periodic re-scraping to update prices

---

### 2. Smart Item Suggestions
**Capability:** Suggest items based on bag context

**Flow:**
1. User creates "Winter Camping" bag
2. AI analyzes bag title/description
3. Queries catalog for cold-weather essentials
4. Suggests: insulated sleeping bag, 4-season tent, etc.
5. User adds with one click

**Tech:**
- Embedding-based similarity search
- GPT-4 reasoning over catalog
- Historical data (popular items in similar bags)

---

### 3. Price Tracking & Alerts
**Capability:** Notify when prices drop

**Flow:**
1. User adds item with retail links
2. System periodically scrapes prices
3. Updates `price_cache` table
4. Detects 15% price drop
5. Notifies user via email/push

**Tech:**
- Scheduled functions (daily price scraping)
- Price history tracking
- Threshold-based alerts

---

### 4. Duplicate Detection
**Capability:** Prevent adding same item twice

**Flow:**
1. User adds "Osprey Atmos 65"
2. System checks existing items in bag
3. Detects "Osprey Atmos 65L Backpack" already exists
4. Prompts: "Looks like you already have this. Update quantity?"

**Tech:**
- Fuzzy string matching (Levenshtein distance)
- Catalog ID matching
- GPT-4 semantic similarity

---

### 5. Automatic Categorization & Tagging
**Capability:** Auto-tag bags and categorize items

**Flow:**
1. User creates bag: "Ultimate Ultralight Backpacking Setup"
2. AI suggests tags: "ultralight", "backpacking", "minimalist"
3. User adds items
4. AI categorizes each item (shelter, cooking, clothing, etc.)
5. Generates organized sections in bag view

**Tech:**
- GPT-4 classification
- Catalog category mapping
- User feedback loop (correct wrong tags)

---

### 6. Comparison & Recommendations
**Capability:** Compare items and suggest alternatives

**Flow:**
1. User asks GPT: "Which tent is better for me?"
2. GPT analyzes user's bag context (ultralight focus)
3. Calls catalog API for 3-season vs 4-season tents
4. Compares: weight, price, reviews, specs
5. Recommends best fit with reasoning

**Tech:**
- Multi-dimensional scoring (weight, price, ratings)
- GPT-4 reasoning over structured data
- User preference learning

---

### 7. Community-Driven Insights
**Capability:** Learn from similar bags

**Flow:**
1. User creates "PCT Thru-Hike" bag
2. System finds other public PCT bags
3. Analyzes common items across bags
4. Suggests: "90% of PCT hikers include a sun umbrella"
5. User adds or ignores

**Tech:**
- Embedding similarity (find similar bags)
- Frequency analysis (common items)
- Collaborative filtering

---

### 8. Multi-Modal Input
**Capability:** Add items via photo or voice

**Flow:**
1. User uploads photo of gear laid out
2. Vision API identifies items
3. Matches to catalog or creates custom entries
4. Adds all to bag at once
5. User reviews and edits

**Tech:**
- GPT-4 Vision for object detection
- Image-to-catalog matching
- Whisper API for voice input

---

## UI/UX Design Recommendations

### Key Screens

#### 1. Dashboard (User's Bags)
- Grid/list of bags with cover images
- Quick actions: Edit, View, Share, Duplicate
- Filters: Public/Private, Tags, Date
- Search across all bags

#### 2. Bag Editor
- Inline title/description editing
- Drag-and-drop item reordering
- Quick add from catalog (autocomplete search)
- Quick add custom item (free-form)
- Item cards with photo, name, links, notes
- Click item to expand links/details

#### 3. Public Bag View (Read-Only)
- Hero image/title/description
- Organized item list
- Click item to see details/links
- "Fork this bag" button
- "Follow this bag" button
- Total estimated cost
- Share button (copy link)

#### 4. Catalog Browser
- Category filters
- Search bar with autocomplete
- Product cards: photo, brand/model, price range
- "Add to bag" dropdown (select which bag)
- Detail view: specs, prices, reviews

#### 5. Item Detail Modal
- Photo gallery
- Name, brand, description
- User notes (editable if owner)
- Links section:
  - Grouped by type (retail, reviews, videos)
  - Click link to track analytics
  - Add/edit/delete links (if owner)
- Catalog info (if linked)
- Price comparison table

#### 6. Share Link Manager
- List of share links for bag
- Create new share link
- Customize: slug, title, expiration, max uses
- Copy link button
- Analytics: views, clicks

---

### Design System

**Visual Style:**
- Clean, minimal, card-based
- Centered content, max-width containers
- Tailwind CSS with custom design tokens
- Focus on readability and clarity

**Color Palette:**
- Primary: Earthy greens/blues (outdoor vibe)
- Secondary: Warm oranges/yellows (accent)
- Neutrals: Grays for text/backgrounds
- Success/error states: Standard green/red

**Typography:**
- Headings: Bold, clear hierarchy
- Body: Readable sans-serif (Inter, Satoshi, etc.)
- Monospace for codes/slugs

**Interactions:**
- Drag-and-drop for reordering
- Inline editing (click to edit title)
- Optimistic UI updates
- Toast notifications for actions
- Skeleton loaders while fetching

---

## Technical Implementation Notes

### Next.js App Structure

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── bags/
│   │   ├── page.tsx                 # List of user's bags
│   │   ├── [id]/
│   │   │   ├── page.tsx             # Bag editor
│   │   │   └── settings/page.tsx   # Bag settings
│   │   └── new/page.tsx             # Create bag
│   ├── catalog/
│   │   ├── page.tsx                 # Browse catalog
│   │   └── [id]/page.tsx            # Product detail
│   └── profile/page.tsx             # User profile
├── c/[code]/page.tsx                # Public bag view (by code)
├── s/[slug]/page.tsx                # Public bag view (by share link)
├── api/
│   ├── teed/
│   │   ├── bags/
│   │   │   ├── [code]/route.ts     # GET bag by code
│   │   │   └── route.ts            # POST create bag
│   │   ├── items/
│   │   │   ├── [id]/
│   │   │   │   └── links/route.ts  # POST add link to item
│   │   │   └── route.ts            # POST create item
│   │   ├── catalog/
│   │   │   └── search/route.ts     # GET search catalog
│   │   └── ai/
│   │       ├── scrape-link/route.ts
│   │       └── generate/route.ts
│   └── ai-test/route.ts             # ✓ Already exists
└── layout.tsx
```

### Supabase Client Setup

```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client with service role (for RLS bypass in API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Row Level Security (RLS) Policies

**profiles:**
- Users can read all profiles
- Users can only update their own profile

**bags:**
- Anyone can read public bags
- Users can read/write their own bags
- Users can read bags they follow

**bag_items:**
- Inherit access from parent bag
- Users can write if they own the bag

**links:**
- Inherit access from parent bag/item
- Users can write if they own the bag

**share_links:**
- Anyone can read (for public sharing)
- Only owner can create/delete

**catalog_items, categories:**
- Public read access
- Admin-only write

**affiliate_links:**
- Users can read/write their own
- Public can read (for price comparison)

---

## Migration Scripts

### Script 1: Add Missing `links` Table

```sql
-- Create links table
CREATE TABLE links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id uuid REFERENCES bags(id) ON DELETE CASCADE,
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text NOT NULL,
  label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT links_target_check CHECK (
    (bag_id IS NOT NULL AND bag_item_id IS NULL) OR
    (bag_id IS NULL AND bag_item_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_links_bag_id ON links(bag_id) WHERE bag_id IS NOT NULL;
CREATE INDEX idx_links_bag_item_id ON links(bag_item_id) WHERE bag_item_id IS NOT NULL;
CREATE INDEX idx_links_kind ON links(kind);

-- RLS Policies
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Anyone can read links for public bags
CREATE POLICY "Public bags links are viewable by everyone"
  ON links FOR SELECT
  USING (
    CASE
      WHEN bag_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM bags WHERE id = links.bag_id AND is_public = true)
      WHEN bag_item_id IS NOT NULL THEN
        EXISTS (
          SELECT 1 FROM bag_items bi
          JOIN bags b ON bi.bag_id = b.id
          WHERE bi.id = links.bag_item_id AND b.is_public = true
        )
    END
  );

-- Users can read links for their own bags
CREATE POLICY "Users can view their own bag links"
  ON links FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );

-- Users can insert/update/delete links for their own bags
CREATE POLICY "Users can manage links for their bags"
  ON links FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );
```

---

### Script 2: Add `code` Field to `bags`

```sql
-- Add code column
ALTER TABLE bags
  ADD COLUMN code text UNIQUE;

-- Create unique index
CREATE UNIQUE INDEX idx_bags_code ON bags(code) WHERE code IS NOT NULL;

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_bag_code(title_text text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter int := 0;
BEGIN
  -- Convert to lowercase, replace non-alphanumeric with hyphens
  base_code := lower(regexp_replace(title_text, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Trim leading/trailing hyphens
  base_code := trim(both '-' from base_code);

  -- Limit length
  base_code := substring(base_code from 1 for 50);

  final_code := base_code;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM bags WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate code on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_bag_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_bag_code(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_bag_code
  BEFORE INSERT ON bags
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_bag_code();

-- Backfill existing bags with codes
UPDATE bags
SET code = generate_bag_code(title)
WHERE code IS NULL;
```

---

### Script 3: Add Usage Tracking to `share_links`

```sql
-- Add new columns
ALTER TABLE share_links
  ADD COLUMN max_uses integer,
  ADD COLUMN uses integer DEFAULT 0 NOT NULL,
  ADD COLUMN expires_at timestamptz;

-- Add check constraint
ALTER TABLE share_links
  ADD CONSTRAINT share_links_uses_check CHECK (uses >= 0);
ALTER TABLE share_links
  ADD CONSTRAINT share_links_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);

-- Function to validate share link
CREATE OR REPLACE FUNCTION is_share_link_valid(link_id uuid)
RETURNS boolean AS $$
DECLARE
  link_record share_links;
BEGIN
  SELECT * INTO link_record FROM share_links WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check expiration
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;

  -- Check usage limit
  IF link_record.max_uses IS NOT NULL AND link_record.uses >= link_record.max_uses THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_share_link_uses(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE share_links
  SET uses = uses + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Script 4: Add `updated_at` to `bags`

```sql
-- Add column
ALTER TABLE bags
  ADD COLUMN updated_at timestamptz DEFAULT now();

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bags_updated_at
  BEFORE UPDATE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing bags
UPDATE bags
SET updated_at = created_at
WHERE updated_at IS NULL;
```

---

## Summary & Next Steps

### Current State
✓ Database with 12 tables, mostly complete
✓ Next.js app scaffolded
✓ Supabase integration configured
✓ OpenAI integration tested and working
✓ Dev server running

### Critical Blockers (Must Fix)
1. ❌ Create `links` table (CRITICAL for MVP)
2. ⚠️ Add `code` field to `bags` (HIGH priority)
3. ⚠️ Add usage tracking to `share_links` (MEDIUM priority)

### Implementation Roadmap

**Phase 1: Schema Fixes (Week 1)**
- [ ] Run migration scripts 1-4
- [ ] Verify RLS policies
- [ ] Test data insertion/querying
- [ ] Document any changes

**Phase 2: Core API Routes (Week 2)**
- [ ] GET /api/teed/bags/[code]
- [ ] POST /api/teed/bags
- [ ] POST /api/teed/bags/[code]/items
- [ ] POST /api/teed/items/[id]/links
- [ ] GET /api/teed/catalog/search

**Phase 3: Basic UI (Week 3-4)**
- [ ] Dashboard (bags list)
- [ ] Bag editor (CRUD items)
- [ ] Public bag view
- [ ] Catalog browser
- [ ] Item detail modal

**Phase 4: AI Features (Week 5-6)**
- [ ] Link scraping endpoint
- [ ] AI description generation
- [ ] Smart suggestions
- [ ] Price tracking

**Phase 5: Custom GPT (Week 7)**
- [ ] OpenAPI spec for GPT Actions
- [ ] Custom GPT instructions
- [ ] Testing & refinement
- [ ] Public launch

**Phase 6: Polish & Launch (Week 8)**
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive
- [ ] Analytics integration
- [ ] Deploy to production

---

## Key Decisions Needed

1. **Catalog vs Free-Form Items**
   - Keep current catalog-first design?
   - Or allow fully free-form items without catalog?
   - Hybrid approach (current)?

2. **Bag Codes vs Share Links**
   - Add `code` to bags for simple `/c/[code]` URLs?
   - Keep only share_links for tracking?
   - Support both?

3. **Social Features Scope**
   - Keep `follows` table for MVP?
   - Remove to simplify?
   - Add later?

4. **Monetization Strategy**
   - Emphasize affiliate links?
   - Charge for premium features?
   - Keep free for MVP?

5. **AI Capabilities**
   - Which AI features are MVP?
   - Which are nice-to-have?
   - Budget for API costs?

---

**End of Document**

This specification provides complete context for building:
1. UI workflows in the Next.js app
2. Custom GPT integration via OpenAPI Actions
3. AI-powered features (scraping, generation, recommendations)
4. Database migrations to close critical gaps

All information is production-ready and can be handed off to OpenAI or other developers for implementation.
