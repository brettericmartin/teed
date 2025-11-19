# Affiliate & Monetization Architecture Overview

**Last Updated:** 2025-11-17
**Status:** Design Phase
**Target:** Phased implementation (Phases 0-6)

---

## Executive Summary

This document outlines the architecture for adding affiliate monetization capabilities to Teed while maintaining the core product's value as a free utility for organizing and sharing gear/loadouts.

### Key Principles

1. **Optional by Design** - Core product works perfectly without affiliate features
2. **Backward Compatible** - Existing data and workflows remain unchanged
3. **Scalable** - Start simple (Amazon Associates), scale to aggregators (Skimlinks-style)
4. **Transparent** - Users paste normal URLs; affiliate wrapping happens server-side
5. **Future-Proof** - Architecture supports Pro/Creator features later

---

## Current State Analysis

### Existing Schema (What We Have)

Based on codebase review, Teed currently has:

**Core Tables:**
- `bags` - User containers/kits/loadouts
  - Has `code` field (from migration 002) ✅
  - Has `updated_at` (from migration 004) ✅
  - Has `category` field (from migration 005) ✅
  - Owner is `owner_id` (references `profiles`)

- `bag_items` - Items within bags
  - `bag_id` (FK → bags)
  - `name`, `brand`, `description`, `image_url`
  - `photo_url` (custom photo)
  - `promo_codes` (from migration 006)
  - `quantity`, `sort_index`, `notes`
  - `is_featured` (from migration 010)
  - **NO catalog_item_id** - fully free-form items ✅

- `links` - General purpose links (from migration 001) ✅
  - Can attach to `bag_id` OR `bag_item_id`
  - `kind` (retail, affiliate, review, video, article)
  - `url`, `label`, `metadata` (jsonb)
  - RLS policies already set up for public/private access

- `profiles` - User accounts (from migration 008)
  - Linked to Supabase Auth
  - Has `username` (from migration 009)
  - Username-scoped bag codes

- `share_links` - Shareable URLs with slugs
  - Has usage tracking fields (from migration 003) ✅
  - `max_uses`, `uses`, `expires_at`

**Key Observations:**
1. ✅ All required MVP tables exist
2. ✅ `links` table is flexible and can store affiliate URLs
3. ✅ Items are free-form (no required catalog) - simpler than spec
4. ⚠️ No `affiliate_links` table yet (needed for tracking)
5. ⚠️ No `creator_settings` table yet (needed for Pro features)

---

## Architecture Design

### Schema Additions Required

We need to add **2 new tables** to support affiliate features:

#### 1. `affiliate_links` Table

**Purpose:** Track affiliate-wrapped URLs separately from general links

**Why Separate from `links`?**
- Enables affiliate-specific tracking (clicks, earnings, provider info)
- Keeps monetization data isolated
- Allows joining/querying affiliate performance
- Supports multiple affiliate URLs per item (Amazon + aggregator)

**Schema:**
```sql
CREATE TABLE affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this link points to
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,

  -- URL details
  raw_url text NOT NULL,           -- Original user-supplied URL
  affiliate_url text NOT NULL,      -- Wrapped affiliate URL
  provider text NOT NULL,           -- 'amazon', 'aggregator', 'direct'
  merchant_domain text,             -- 'amazon.com', 'rei.com', etc.

  -- Tracking
  clicks integer DEFAULT 0,
  last_click_at timestamptz,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(bag_item_id, provider)     -- One affiliate URL per provider per item
);

CREATE INDEX idx_affiliate_links_item ON affiliate_links(bag_item_id);
CREATE INDEX idx_affiliate_links_provider ON affiliate_links(provider);
CREATE INDEX idx_affiliate_links_merchant ON affiliate_links(merchant_domain);
```

**RLS Policies:**
```sql
-- Public bags' affiliate links are viewable by everyone
CREATE POLICY "Public affiliate links viewable by all"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.is_public = true
    )
  );

-- Users can view their own affiliate links
CREATE POLICY "Users can view own affiliate links"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );

-- Users can manage affiliate links for their bags
CREATE POLICY "Users can manage own affiliate links"
  ON affiliate_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );
```

#### 2. `creator_settings` Table

**Purpose:** Store creator/pro feature settings (future-proofing)

**Schema:**
```sql
CREATE TABLE creator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Feature flags
  is_pro boolean DEFAULT false,
  affiliate_enabled boolean DEFAULT false,

  -- Affiliate configuration
  amazon_associate_tag text,        -- 'username-20'

  -- Limits
  max_bags integer DEFAULT 10,      -- Free users: 10, Pro: unlimited

  -- Customization
  custom_domain text,
  theme_preset text,                -- 'default', 'minimal', 'bold'

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_creator_settings_profile ON creator_settings(profile_id);
```

**RLS Policies:**
```sql
-- Users can read their own settings
CREATE POLICY "Users can view own creator settings"
  ON creator_settings FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can update their own settings
CREATE POLICY "Users can update own creator settings"
  ON creator_settings FOR UPDATE
  USING (auth.uid() = profile_id);

-- Auto-insert settings on profile creation (via trigger)
CREATE POLICY "Users can insert own creator settings"
  ON creator_settings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
```

---

## Service Layer Architecture

### TypeScript Type Definitions

**File:** `lib/types/affiliate.ts`

```typescript
// Affiliate provider types
export type AffiliateProviderType = 'none' | 'amazon' | 'aggregator' | 'direct';

// Input for affiliate URL generation
export interface AffiliateUrlRequest {
  rawUrl: string;
  itemId?: string;  // For tracking
}

// Output from affiliate URL generation
export interface AffiliateUrlResponse {
  affiliateUrl: string;
  provider: AffiliateProviderType;
  merchantDomain?: string;
  error?: string;
}

// Affiliate service interface
export interface AffiliateService {
  /**
   * Convert a raw URL into an affiliate URL
   * Returns original URL if affiliate processing fails or is disabled
   */
  getAffiliateUrl(request: AffiliateUrlRequest): Promise<AffiliateUrlResponse>;

  /**
   * Check if a URL is supported by this provider
   */
  supportsUrl(url: string): boolean;
}

// Database row type
export interface AffiliateLink {
  id: string;
  bag_item_id: string;
  raw_url: string;
  affiliate_url: string;
  provider: AffiliateProviderType;
  merchant_domain: string | null;
  clicks: number;
  last_click_at: string | null;
  created_at: string;
  updated_at: string;
}

// Creator settings type
export interface CreatorSettings {
  id: string;
  profile_id: string;
  is_pro: boolean;
  affiliate_enabled: boolean;
  amazon_associate_tag: string | null;
  max_bags: number;
  custom_domain: string | null;
  theme_preset: string | null;
  created_at: string;
  updated_at: string;
}
```

### Service Implementations

#### Base Service (Noop)

**File:** `lib/services/affiliate/NoopAffiliateService.ts`

```typescript
import { AffiliateService, AffiliateUrlRequest, AffiliateUrlResponse } from '@/lib/types/affiliate';

/**
 * No-op implementation - returns original URL unchanged
 * Used when affiliate features are disabled
 */
export class NoopAffiliateService implements AffiliateService {
  async getAffiliateUrl(request: AffiliateUrlRequest): Promise<AffiliateUrlResponse> {
    return {
      affiliateUrl: request.rawUrl,
      provider: 'none',
    };
  }

  supportsUrl(url: string): boolean {
    return true; // Accepts all URLs, does nothing
  }
}
```

#### Amazon Associates Service

**File:** `lib/services/affiliate/AmazonAffiliateService.ts`

```typescript
import { AffiliateService, AffiliateUrlRequest, AffiliateUrlResponse } from '@/lib/types/affiliate';

/**
 * Amazon Associates affiliate URL generator
 * Appends associate tag to Amazon URLs
 */
export class AmazonAffiliateService implements AffiliateService {
  private associateTag: string;

  constructor(associateTag: string) {
    this.associateTag = associateTag;
  }

  async getAffiliateUrl(request: AffiliateUrlRequest): Promise<AffiliateUrlResponse> {
    try {
      const url = new URL(request.rawUrl);

      if (!this.isAmazonDomain(url.hostname)) {
        // Not an Amazon URL, return as-is
        return {
          affiliateUrl: request.rawUrl,
          provider: 'none',
        };
      }

      // Add or replace the tag parameter
      url.searchParams.set('tag', this.associateTag);

      // Remove tracking parameters that might conflict
      url.searchParams.delete('psc');

      return {
        affiliateUrl: url.toString(),
        provider: 'amazon',
        merchantDomain: url.hostname,
      };
    } catch (error) {
      console.error('Failed to process Amazon URL:', error);
      return {
        affiliateUrl: request.rawUrl,
        provider: 'none',
        error: 'Invalid URL format',
      };
    }
  }

  supportsUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.isAmazonDomain(parsed.hostname);
    } catch {
      return false;
    }
  }

  private isAmazonDomain(hostname: string): boolean {
    const amazonDomains = [
      'amazon.com',
      'amazon.co.uk',
      'amazon.ca',
      'amazon.de',
      'amazon.fr',
      'amazon.co.jp',
      'amazon.in',
      'amazon.com.au',
      'amazon.es',
      'amazon.it',
    ];

    return amazonDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }
}
```

#### Aggregator Service (Stub)

**File:** `lib/services/affiliate/AggregatorAffiliateService.ts`

```typescript
import { AffiliateService, AffiliateUrlRequest, AffiliateUrlResponse } from '@/lib/types/affiliate';

/**
 * Aggregator affiliate service (Skimlinks-style)
 * Phase 5 implementation - currently stubbed
 */
export class AggregatorAffiliateService implements AffiliateService {
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async getAffiliateUrl(request: AffiliateUrlRequest): Promise<AffiliateUrlResponse> {
    // STUB: For now, return original URL
    // TODO Phase 5: Implement real aggregator API call

    try {
      // Future implementation:
      // const response = await fetch(`${this.apiEndpoint}/affiliate/resolve`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ url: request.rawUrl }),
      // });
      // const data = await response.json();
      // return data;

      return {
        affiliateUrl: request.rawUrl,
        provider: 'aggregator',
        merchantDomain: this.extractDomain(request.rawUrl),
      };
    } catch (error) {
      console.error('Aggregator service error:', error);
      return {
        affiliateUrl: request.rawUrl,
        provider: 'none',
        error: 'Aggregator service unavailable',
      };
    }
  }

  supportsUrl(url: string): boolean {
    // Accept all URLs that aren't Amazon (Amazon handled separately)
    try {
      const parsed = new URL(url);
      return !parsed.hostname.includes('amazon');
    } catch {
      return false;
    }
  }

  private extractDomain(url: string): string | undefined {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  }
}
```

#### Service Factory

**File:** `lib/services/affiliate/AffiliateServiceFactory.ts`

```typescript
import { AffiliateService } from '@/lib/types/affiliate';
import { NoopAffiliateService } from './NoopAffiliateService';
import { AmazonAffiliateService } from './AmazonAffiliateService';
import { AggregatorAffiliateService } from './AggregatorAffiliateService';

export type AffiliateMode = 'none' | 'amazon' | 'aggregator' | 'amazon+aggregator';

/**
 * Factory to create appropriate affiliate service based on configuration
 */
export class AffiliateServiceFactory {
  static create(config: {
    mode: AffiliateMode;
    amazonTag?: string;
    aggregatorEndpoint?: string;
    aggregatorKey?: string;
  }): AffiliateService[] {
    const services: AffiliateService[] = [];

    switch (config.mode) {
      case 'none':
        services.push(new NoopAffiliateService());
        break;

      case 'amazon':
        if (!config.amazonTag) {
          console.warn('Amazon mode enabled but no tag provided, using noop');
          services.push(new NoopAffiliateService());
        } else {
          services.push(new AmazonAffiliateService(config.amazonTag));
        }
        break;

      case 'aggregator':
        if (!config.aggregatorEndpoint || !config.aggregatorKey) {
          console.warn('Aggregator mode enabled but config missing, using noop');
          services.push(new NoopAffiliateService());
        } else {
          services.push(
            new AggregatorAffiliateService(
              config.aggregatorEndpoint,
              config.aggregatorKey
            )
          );
        }
        break;

      case 'amazon+aggregator':
        // Try Amazon first, then aggregator for non-Amazon URLs
        if (config.amazonTag) {
          services.push(new AmazonAffiliateService(config.amazonTag));
        }
        if (config.aggregatorEndpoint && config.aggregatorKey) {
          services.push(
            new AggregatorAffiliateService(
              config.aggregatorEndpoint,
              config.aggregatorKey
            )
          );
        }
        if (services.length === 0) {
          services.push(new NoopAffiliateService());
        }
        break;

      default:
        services.push(new NoopAffiliateService());
    }

    return services;
  }

  /**
   * Get affiliate service based on user settings
   */
  static async createForUser(
    profileId: string,
    supabase: any
  ): Promise<AffiliateService[]> {
    try {
      const { data: settings } = await supabase
        .from('creator_settings')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!settings || !settings.affiliate_enabled) {
        return [new NoopAffiliateService()];
      }

      const mode = process.env.AFFILIATE_MODE as AffiliateMode || 'none';

      return this.create({
        mode,
        amazonTag: settings.amazon_associate_tag || process.env.AMAZON_ASSOCIATE_TAG,
        aggregatorEndpoint: process.env.AFFILIATE_AGGREGATOR_BASE_URL,
        aggregatorKey: process.env.AFFILIATE_AGGREGATOR_API_KEY,
      });
    } catch (error) {
      console.error('Failed to create user affiliate service:', error);
      return [new NoopAffiliateService()];
    }
  }
}
```

---

## Environment Configuration

**Add to `.env.example` and `.env.local`:**

```bash
# Affiliate Configuration
# Options: 'none', 'amazon', 'aggregator', 'amazon+aggregator'
AFFILIATE_MODE=none

# Amazon Associates
AMAZON_ASSOCIATE_TAG=

# Affiliate Aggregator (Skimlinks-style)
AFFILIATE_AGGREGATOR_API_KEY=
AFFILIATE_AGGREGATOR_BASE_URL=
```

**Configuration Modes:**

| Mode | Description | Use Case |
|------|-------------|----------|
| `none` | No affiliate features | Dev, users who don't want monetization |
| `amazon` | Amazon Associates only | Simple monetization, Amazon-focused |
| `aggregator` | Third-party aggregator only | Multi-merchant support |
| `amazon+aggregator` | Both (Amazon prioritized) | Full monetization coverage |

---

## API Integration

### Server-Side API Route

**File:** `app/api/affiliate/resolve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AffiliateServiceFactory } from '@/lib/services/affiliate/AffiliateServiceFactory';

/**
 * POST /api/affiliate/resolve
 * Convert a raw URL to affiliate URL(s)
 *
 * Body: { rawUrl: string, itemId?: string }
 * Returns: { affiliateUrl: string, provider: string, merchantDomain?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { rawUrl, itemId } = await request.json();

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        { error: 'rawUrl is required' },
        { status: 400 }
      );
    }

    // Get affiliate mode from environment
    const mode = (process.env.AFFILIATE_MODE || 'none') as any;

    // Create affiliate services
    const services = AffiliateServiceFactory.create({
      mode,
      amazonTag: process.env.AMAZON_ASSOCIATE_TAG,
      aggregatorEndpoint: process.env.AFFILIATE_AGGREGATOR_BASE_URL,
      aggregatorKey: process.env.AFFILIATE_AGGREGATOR_API_KEY,
    });

    // Try each service until one supports this URL
    for (const service of services) {
      if (service.supportsUrl(rawUrl)) {
        const result = await service.getAffiliateUrl({ rawUrl, itemId });
        return NextResponse.json(result);
      }
    }

    // No service supported this URL, return as-is
    return NextResponse.json({
      affiliateUrl: rawUrl,
      provider: 'none',
    });

  } catch (error) {
    console.error('Affiliate resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve affiliate URL' },
      { status: 500 }
    );
  }
}
```

---

## Integration with Item Creation

### Modified Item Creation Flow

**Current Flow:**
1. User creates/edits item in `bag_items`
2. Optionally adds links to `links` table

**New Flow with Affiliate:**
1. User creates/edits item in `bag_items`
2. User adds product URL (in UI, just a normal URL field)
3. **Server-side:**
   a. Call `/api/affiliate/resolve` with URL
   b. Get back affiliate URL + metadata
   c. Insert into `affiliate_links` table
   d. Optionally insert into `links` table (for display)
4. When displaying item, join `affiliate_links` to get monetized URLs

### Example Integration

**File:** `app/api/items/[id]/links/route.ts` (new endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/items/[id]/links
 * Add a link to an item (with optional affiliate processing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, label, kind = 'retail' } = await request.json();
    const itemId = params.id;

    // Verify user owns this item's bag
    const { data: item } = await supabase
      .from('bag_items')
      .select('bag_id, bags(owner_id)')
      .eq('id', itemId)
      .single();

    if (!item || item.bags?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process affiliate URL if applicable
    let affiliateUrl = url;
    let provider = 'none';

    if (kind === 'retail' && process.env.AFFILIATE_MODE !== 'none') {
      try {
        const affiliateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/affiliate/resolve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawUrl: url, itemId }),
          }
        );
        const affiliateData = await affiliateResponse.json();
        affiliateUrl = affiliateData.affiliateUrl;
        provider = affiliateData.provider;

        // Store in affiliate_links table if not 'none'
        if (provider !== 'none') {
          await supabase.from('affiliate_links').upsert({
            bag_item_id: itemId,
            raw_url: url,
            affiliate_url: affiliateUrl,
            provider,
            merchant_domain: affiliateData.merchantDomain,
          }, {
            onConflict: 'bag_item_id,provider',
          });
        }
      } catch (error) {
        console.error('Affiliate processing failed:', error);
        // Continue with original URL
      }
    }

    // Always store in links table for UI display
    const { data: link, error } = await supabase
      .from('links')
      .insert({
        bag_item_id: itemId,
        kind,
        url: affiliateUrl, // Use affiliate URL if available
        label,
        metadata: {
          original_url: url !== affiliateUrl ? url : undefined,
          affiliate_provider: provider !== 'none' ? provider : undefined,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create link:', error);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    return NextResponse.json(link, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/items/[id]/links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Migration Files

### Migration 011: Create affiliate_links table

**File:** `scripts/migrations/011_create_affiliate_links.sql`

```sql
-- Migration 011: Create affiliate_links table
-- Enables affiliate monetization tracking

CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this link points to
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE NOT NULL,

  -- URL details
  raw_url text NOT NULL,
  affiliate_url text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('none', 'amazon', 'aggregator', 'direct')),
  merchant_domain text,

  -- Tracking
  clicks integer DEFAULT 0 NOT NULL,
  last_click_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- One affiliate URL per provider per item
  UNIQUE(bag_item_id, provider)
);

-- Indexes
CREATE INDEX idx_affiliate_links_item ON affiliate_links(bag_item_id);
CREATE INDEX idx_affiliate_links_provider ON affiliate_links(provider);
CREATE INDEX idx_affiliate_links_merchant ON affiliate_links(merchant_domain);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public affiliate links viewable by all"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.is_public = true
    )
  );

CREATE POLICY "Users can view own affiliate links"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own affiliate links"
  ON affiliate_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = affiliate_links.bag_item_id
        AND b.owner_id = auth.uid()
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_links_updated_at();
```

### Migration 012: Create creator_settings table

**File:** `scripts/migrations/012_create_creator_settings.sql`

```sql
-- Migration 012: Create creator_settings table
-- Enables Pro features and affiliate configuration per user

CREATE TABLE IF NOT EXISTS creator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Feature flags
  is_pro boolean DEFAULT false NOT NULL,
  affiliate_enabled boolean DEFAULT false NOT NULL,

  -- Affiliate configuration
  amazon_associate_tag text,

  -- Limits
  max_bags integer DEFAULT 10 NOT NULL,

  -- Customization
  custom_domain text,
  theme_preset text DEFAULT 'default',

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX idx_creator_settings_profile ON creator_settings(profile_id);

-- Enable RLS
ALTER TABLE creator_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own creator settings"
  ON creator_settings FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own creator settings"
  ON creator_settings FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own creator settings"
  ON creator_settings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creator_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_settings_updated_at
  BEFORE UPDATE ON creator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_settings_updated_at();

-- Auto-create default settings when profile is created
CREATE OR REPLACE FUNCTION auto_create_creator_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creator_settings (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_creator_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_creator_settings();
```

---

## Phased Implementation Plan

### Phase 0: Recon & Alignment ✅ COMPLETE

- [x] Scan existing codebase
- [x] Map current schema
- [x] Create architecture overview document

### Phase 1: Schema & Models

**Tasks:**
1. Run migration 011 (affiliate_links)
2. Run migration 012 (creator_settings)
3. Verify tables created in Supabase
4. Test RLS policies

**Deliverables:**
- Two new tables in database
- RLS policies active
- Auto-triggers working

### Phase 2: Affiliate Service Abstraction

**Tasks:**
1. Create `lib/types/affiliate.ts`
2. Create `lib/services/affiliate/NoopAffiliateService.ts`
3. Create `lib/services/affiliate/AmazonAffiliateService.ts`
4. Create `lib/services/affiliate/AggregatorAffiliateService.ts` (stub)
5. Create `lib/services/affiliate/AffiliateServiceFactory.ts`
6. Create `app/api/affiliate/resolve/route.ts`
7. Add environment variables

**Deliverables:**
- Working service layer
- API endpoint for URL resolution
- Configurable via env vars

**Testing:**
```bash
# Test with curl
curl -X POST http://localhost:3000/api/affiliate/resolve \
  -H "Content-Type: application/json" \
  -d '{"rawUrl":"https://www.amazon.com/dp/B08L5VFJ2T"}'

# Should return:
# { "affiliateUrl": "https://www.amazon.com/dp/B08L5VFJ2T?tag=YOURTAG-20", "provider": "amazon", ... }
```

### Phase 3: Integrate with Item Creation

**Tasks:**
1. Create `app/api/items/[id]/links/route.ts`
2. Update item creation UI to use new endpoint
3. Update bag display to show affiliate links
4. Test end-to-end flow

**Deliverables:**
- Items can have affiliate URLs
- Transparent to user (they just paste URLs)
- Links stored in both `links` and `affiliate_links`

### Phase 4: Amazon Associates Support

**Tasks:**
1. Test AmazonAffiliateService thoroughly
2. Handle edge cases (international domains, shortened URLs)
3. Add Amazon tag to creator_settings UI
4. Document setup process

**Deliverables:**
- Fully working Amazon affiliate capability
- Per-user Amazon tags supported
- Documentation for users

### Phase 5: Aggregator Integration

**Tasks:**
1. Select aggregator provider (Skimlinks, Impact, etc.)
2. Implement real API call in AggregatorAffiliateService
3. Add error handling and fallbacks
4. Test with multiple merchants

**Deliverables:**
- Working aggregator integration
- Multi-merchant support
- Graceful fallback to raw URLs

### Phase 6: Creator/Pro Features

**Tasks:**
1. Build creator settings UI
2. Add affiliate toggle to user settings
3. Show affiliate stats (clicks, etc.)
4. Add "(affiliate link)" indicators where required

**Deliverables:**
- User-facing settings page
- Opt-in/opt-out for affiliate
- Basic analytics display

---

## Testing Strategy

### Unit Tests
- Test each AffiliateService implementation
- Test URL parsing edge cases
- Test Amazon domain detection
- Test tag parameter handling

### Integration Tests
- Test full item creation → affiliate link flow
- Test public bag display with affiliate links
- Test RLS policies (public vs private)
- Test with AFFILIATE_MODE = none/amazon/aggregator

### Manual Testing Checklist
- [ ] Create item with Amazon URL → verify tag appended
- [ ] Create item with non-Amazon URL → verify noop or aggregator
- [ ] View public bag → verify affiliate links work
- [ ] Toggle AFFILIATE_MODE → verify behavior changes
- [ ] Test with missing env vars → verify graceful fallback
- [ ] Test link click tracking (future)

---

## Backward Compatibility

### Existing Data
- ✅ No migration of existing data needed
- ✅ Existing `links` continue to work as-is
- ✅ New `affiliate_links` table is additive

### Existing Code
- ✅ Item creation still works without affiliate
- ✅ Public bag display works without affiliate URLs
- ✅ Links table remains source of truth for UI

### Rollback Plan
If affiliate features need to be disabled:
1. Set `AFFILIATE_MODE=none`
2. Affiliate processing stops, but data remains
3. Can re-enable later without data loss

---

## Future Enhancements

### Analytics Dashboard
- Show clicks per item
- Show estimated earnings
- Show top-performing items
- Export data

### Advanced Features
- Multiple Amazon tags (A/B testing)
- Geo-targeting (different tags per region)
- Custom affiliate networks
- Automatic link refresh/update

### UI Improvements
- Visual indicator for monetized items
- Bulk URL processing
- Link health monitoring (broken links)

---

## Cost Analysis

### API Costs
- **Amazon Associates:** Free (commission-based)
- **Skimlinks:** Free tier available, then % of commission
- **OpenAI:** Already in use for other features
- **Hosting:** No additional Vercel/Supabase costs expected

### Development Time Estimate
- Phase 1 (Schema): 2 hours
- Phase 2 (Services): 4 hours
- Phase 3 (Integration): 4 hours
- Phase 4 (Amazon): 2 hours
- Phase 5 (Aggregator): 4-8 hours (depends on provider)
- Phase 6 (UI): 4 hours

**Total:** ~20-24 hours

---

## Decision Log

### Why separate `affiliate_links` from `links`?
- Enables tracking (clicks, earnings)
- Cleaner queries for monetization analytics
- Allows multiple affiliate URLs per item (Amazon + aggregator)
- Keeps monetization isolated from core product

### Why server-side URL processing?
- Never expose API keys to client
- Consistent URL generation
- Easier to add caching/rate limiting
- Better security

### Why support multiple providers?
- Amazon doesn't cover all merchants
- Aggregators fill the gaps
- User can maximize earnings

### Why make it optional?
- Core product valuable without monetization
- Not all users want affiliate links
- Simpler UX for non-creators

---

**END OF DOCUMENT**
