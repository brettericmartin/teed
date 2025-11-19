# Affiliate Monetization Setup Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-17

---

## Overview

Teed includes an optional affiliate monetization system that allows creators to earn commissions from product recommendations while keeping the core product free and useful for everyone.

### Key Features

- ✅ **Optional** - Works perfectly without affiliate features
- ✅ **Transparent** - Users paste normal URLs, affiliate wrapping happens server-side
- ✅ **FTC Compliant** - Automatic disclosure support built-in
- ✅ **Multi-Provider** - Supports Amazon Associates + aggregators (Skimlinks, Impact, etc.)
- ✅ **Cacheable** - Smart caching reduces API calls and respects Amazon's 24hr cookie
- ✅ **Analytics** - Click tracking and performance metrics
- ✅ **Privacy-Focused** - Respects Do Not Track (DNT) headers

---

## Quick Start

### 1. Run Database Migrations

```bash
# Navigate to Supabase dashboard SQL Editor
# Run migrations in order:

# Migration 011: affiliate_links table
cat scripts/migrations/011_create_affiliate_links.sql

# Migration 012: creator_settings table
cat scripts/migrations/012_create_creator_settings.sql

# Migration 013: affiliate_clicks table
cat scripts/migrations/013_create_affiliate_clicks.sql
```

### 2. Configure Environment Variables

Edit `.env.local`:

```bash
# Basic setup (Amazon only)
AFFILIATE_MODE=amazon
AMAZON_ASSOCIATE_TAG=yourusername-20

# Advanced setup (Amazon + Aggregator)
AFFILIATE_MODE=amazon+aggregator
AMAZON_ASSOCIATE_TAG=yourusername-20
AFFILIATE_AGGREGATOR_API_KEY=your_api_key
AFFILIATE_AGGREGATOR_BASE_URL=https://api.provider.com
AFFILIATE_AGGREGATOR_PUBLISHER_ID=your_publisher_id
```

### 3. Enable for Your User

```sql
-- In Supabase SQL Editor
UPDATE creator_settings
SET affiliate_enabled = true,
    amazon_associate_tag = 'yourusername-20'
WHERE profile_id = 'your-profile-uuid';
```

### 4. Test It

```bash
# Test affiliate URL generation
curl -X POST http://localhost:3000/api/affiliate/resolve \
  -H "Content-Type: application/json" \
  -d '{"rawUrl":"https://www.amazon.com/dp/B08L5VFJ2T"}'

# Expected response:
# {
#   "affiliateUrl": "https://www.amazon.com/dp/B08L5VFJ2T?tag=yourusername-20",
#   "provider": "amazon",
#   "merchantDomain": "amazon.com",
#   "cached": false,
#   "expiresAt": "2025-11-18T18:00:00.000Z",
#   "disclosure": {
#     "required": true,
#     "text": "As an Amazon Associate, I earn from qualifying purchases."
#   }
# }
```

---

## Configuration Modes

### Mode: `none` (Default)

**Use for:** Development, users who don't want monetization

**Behavior:**
- All URLs pass through unchanged
- No affiliate wrapping
- No tracking
- No API calls

**Setup:**
```bash
AFFILIATE_MODE=none
```

---

### Mode: `amazon`

**Use for:** Simple Amazon-focused monetization

**Behavior:**
- Amazon URLs get affiliate tag appended
- Non-Amazon URLs pass through unchanged
- 24-hour cookie expiration tracked
- FTC disclosure automatic

**Setup:**
```bash
AFFILIATE_MODE=amazon
AMAZON_ASSOCIATE_TAG=yourusername-20
```

**Requirements:**
- Amazon Associates account
- Associate tag (format: `username-20`)

**Get Amazon Associate Tag:**
1. Sign up at https://affiliate-program.amazon.com/
2. Complete application
3. Find your tag in Account Settings
4. Format should be: `yourusername-20` (must include `-20`)

---

### Mode: `aggregator`

**Use for:** Multi-merchant support without Amazon

**Behavior:**
- All URLs processed through aggregator
- Amazon URLs skipped
- Broader merchant coverage
- Centralized reporting

**Setup:**
```bash
AFFILIATE_MODE=aggregator
AFFILIATE_AGGREGATOR_API_KEY=your_api_key
AFFILIATE_AGGREGATOR_BASE_URL=https://api.provider.com
AFFILIATE_AGGREGATOR_PUBLISHER_ID=your_publisher_id
```

**Supported Providers:**
- Skimlinks (recommended)
- Impact
- Commission Junction
- ShareASale
- Custom implementations

**Note:** Currently stubbed. See Phase 5 implementation for production use.

---

### Mode: `amazon+aggregator` (Recommended for Creators)

**Use for:** Maximum monetization coverage

**Behavior:**
- Amazon URLs → Amazon Associates (higher commission rates)
- Other URLs → Aggregator (broader coverage)
- Best of both worlds
- Fallback chain ensures URLs always work

**Setup:**
```bash
AFFILIATE_MODE=amazon+aggregator
AMAZON_ASSOCIATE_TAG=yourusername-20
AFFILIATE_AGGREGATOR_API_KEY=your_api_key
AFFILIATE_AGGREGATOR_BASE_URL=https://api.provider.com
AFFILIATE_AGGREGATOR_PUBLISHER_ID=your_publisher_id
```

---

## Amazon Associates Compliance

### Critical Requirements

Amazon has strict policies. **Violating these can get your account banned.**

#### ✅ HTTPS Only
- All affiliate links MUST use HTTPS
- System automatically upgrades HTTP → HTTPS

#### ✅ No Link Shortening/Masking
- Cannot use bit.ly, TinyURL, etc. on Amazon links
- System uses full Amazon URLs (compliant)

#### ✅ Disclosure Required (FTC)
- Must display "As an Amazon Associate, I earn from qualifying purchases"
- System adds this automatically to public bag pages

#### ✅ 24-Hour Cookie Window
- Amazon cookie expires after 24 hours
- System tracks expiration and regenerates as needed

#### ❌ Restrictions
- **No unsolicited emails:** Do not send affiliate links in spam/marketing emails
- **No offline promotion:** No printed materials with affiliate links
- **No incentivized clicks:** Cannot offer rewards for clicking links

### Best Practices

1. **Use nofollow attribute** (system handles in UI)
2. **Open links in new tabs** (system handles in UI)
3. **Clear disclosure placement** (top of page, not buried)
4. **Genuine recommendations** (only recommend products you actually use)
5. **Keep disclosure visible** (users control this in creator_settings)

---

## FTC Disclosure Compliance

### Legal Requirements (2025)

The FTC requires **"clear and conspicuous" disclosure** of affiliate relationships.

#### What's Required

- ✅ Disclosure placed **where users will see it** (top of page, not footer)
- ✅ **Plain language** - "affiliate link" alone is NOT sufficient
- ✅ Explain **what it means** - "I earn a commission if you purchase"
- ✅ **Immediate visibility** - No click to expand, no footnotes

#### What's Not Allowed

- ❌ Hiding disclosure in footer or sidebar
- ❌ Using vague terms like "partner link"
- ❌ Requiring user action to see disclosure (e.g., click "Read More")

### Teed's Implementation

**Automatic Disclosure:**

```typescript
// Default disclosure text (customizable per user)
"This page contains affiliate links. If you purchase through these links,
 the creator may earn a commission at no extra cost to you."

// Amazon-specific disclosure (FTC + Amazon requirement)
"As an Amazon Associate, I earn from qualifying purchases."
```

**Placement:** Top of public bag page (banner style, clearly visible)

**User Control:**
- Creators can customize disclosure text
- Cannot disable disclosure if affiliate links present (compliance)
- Disclosure automatically shown on pages with affiliate items

---

## Privacy & Click Tracking

### What We Track

When a user clicks an affiliate link, we log:

- **Timestamp:** When clicked
- **IP Address:** Hashed for GDPR compliance
- **User Agent:** Browser/device info
- **Referrer:** Where they came from
- **Session ID:** Generated hash (not a cookie)
- **Device Type:** Mobile/tablet/desktop (parsed from user agent)

### What We DON'T Track

- ❌ Names, emails, or personally identifiable information
- ❌ Purchase data (that's handled by merchants)
- ❌ Cross-site tracking
- ❌ Third-party cookies

### Do Not Track (DNT) Support

System respects `DNT: 1` header:

```typescript
// If DNT header present, skip tracking entirely
if (request.headers.get('DNT') === '1') {
  // Still redirect to affiliate URL (user intent)
  // But don't log click event
}
```

### GDPR Compliance

- IP addresses are hashed before storage
- No PII (personally identifiable information) stored
- User can opt out via DNT header
- Data retention: 90 days (configurable)

---

## API Reference

### POST /api/affiliate/resolve

Convert a raw URL to affiliate URL.

**Request:**
```json
{
  "rawUrl": "https://www.amazon.com/dp/B08L5VFJ2T",
  "itemId": "uuid-of-bag-item",
  "userId": "uuid-of-profile",
  "forceRefresh": false
}
```

**Response:**
```json
{
  "affiliateUrl": "https://www.amazon.com/dp/B08L5VFJ2T?tag=yourusername-20",
  "provider": "amazon",
  "merchantDomain": "amazon.com",
  "cached": false,
  "expiresAt": "2025-11-18T18:00:00.000Z",
  "disclosure": {
    "required": true,
    "text": "As an Amazon Associate, I earn from qualifying purchases."
  }
}
```

---

### GET /api/affiliate/click/[linkId]

Track click and redirect to affiliate URL.

**Request:**
```
GET /api/affiliate/click/af7b3c8d-1234-5678-90ab-cdef12345678
```

**Response:**
```
302 Redirect → https://www.amazon.com/dp/B08L5VFJ2T?tag=yourusername-20
```

**Side Effects:**
- Logs click event to `affiliate_clicks` table
- Increments `clicks` counter on `affiliate_links` table (via trigger)
- Updates `last_click_at` timestamp

---

## Analytics & Reporting

### Database Queries

**Get click stats for a bag:**
```sql
SELECT * FROM get_bag_click_stats('bag-uuid-here');
```

**Returns:**
```
total_clicks          | 127
unique_sessions       | 89
clicks_last_7_days    | 23
clicks_last_30_days   | 104
top_item_name         | TaylorMade Stealth 2 Driver
top_item_clicks       | 47
```

**Get clicks per item:**
```sql
SELECT
  bi.name,
  al.clicks,
  al.last_click_at
FROM affiliate_links al
JOIN bag_items bi ON al.bag_item_id = bi.id
WHERE bi.bag_id = 'bag-uuid-here'
ORDER BY al.clicks DESC;
```

### Future Dashboard (Phase 6)

- Total clicks across all bags
- Estimated earnings (requires conversion tracking)
- Top-performing items
- Click trends over time
- Geographic distribution

---

## Troubleshooting

### Issue: Affiliate URLs not generating

**Check:**
1. `AFFILIATE_MODE` is not `none`
2. `AMAZON_ASSOCIATE_TAG` is set (for Amazon URLs)
3. User has `affiliate_enabled = true` in `creator_settings`
4. URL is valid and accessible

**Debug:**
```bash
# Test endpoint directly
curl -X POST http://localhost:3000/api/affiliate/resolve \
  -H "Content-Type: application/json" \
  -d '{"rawUrl":"https://www.amazon.com/dp/B08L5VFJ2T"}' | jq
```

---

### Issue: Links expire after 24 hours

**This is expected for Amazon Associates.**

Amazon's cookie policy: Commissions only tracked within 24 hours of click.

**Solution:**
- System automatically marks links as `is_active = false` after expiration
- Links should be regenerated daily (future: automatic refresh)

**Manual refresh:**
```sql
-- Mark expired links inactive
UPDATE affiliate_links
SET is_active = false
WHERE cookie_expires_at < now();
```

---

### Issue: Clicks not being tracked

**Check:**
1. Migration 013 (affiliate_clicks) has been run
2. RLS policies allow INSERT on affiliate_clicks
3. Trigger `trigger_increment_affiliate_link_clicks` exists
4. User doesn't have DNT header enabled

**Debug:**
```sql
-- Check recent clicks
SELECT * FROM affiliate_clicks
ORDER BY clicked_at DESC
LIMIT 10;

-- Check if trigger is working
SELECT * FROM affiliate_links WHERE clicks > 0;
```

---

## Scaling to Production

### Current Limitations (MVP)

- **Caching:** In-memory only (lost on deployment)
- **Aggregator:** Stubbed (not yet implemented)
- **Analytics:** Basic queries only (no dashboard)

### Recommended Upgrades

#### 1. Redis Caching

Replace `MemoryAffiliateCache` with `RedisAffiliateCache`:

```typescript
// Use Upstash Redis (serverless-friendly)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache affiliate URL for 23 hours
await redis.setex(`affiliate:${hash}`, 82800, affiliateUrl);
```

#### 2. Implement Real Aggregator

Phase 5 task - integrate Skimlinks or Impact:

```typescript
// Example Skimlinks implementation
const response = await fetch('https://go.redirectingat.com/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: rawUrl,
    pub_id: publisherId,
  }),
});

const { affiliate_url } = await response.json();
```

#### 3. Build Analytics Dashboard

Phase 6 task - create `/dashboard/analytics`:

- Chart clicks over time
- Show estimated earnings
- Export data to CSV
- Real-time updates

---

## Cost Estimates

### Amazon Associates
- **Free** - No upfront cost
- Commission-based: 1-10% per sale
- No API usage costs

### Aggregators (Skimlinks, Impact)
- **Free tier:** Usually free to start
- Commission split: They take ~25-35% of your commission
- Example: You earn $100 → They take $30 → You keep $70

### Infrastructure
- **Vercel:** Hobby tier likely sufficient ($0/mo)
- **Supabase:** Free tier works for MVP (<500MB DB)
- **Redis (Upstash):** Free tier: 10K requests/day

**Total MVP Cost:** $0/month

---

## Support & Resources

### Official Docs
- [Amazon Associates Operating Agreement](https://affiliate-program.amazon.com/help/operating/policies)
- [FTC Disclosure Guidelines](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers)
- [Skimlinks Developer Docs](https://developers.skimlinks.com/)

### Internal Docs
- [Architecture Overview](./architecture/affiliate-overview.md)
- [Type Definitions](../lib/types/affiliate.ts)
- [Service Implementations](../lib/services/affiliate/)

### Getting Help
- GitHub Issues: https://github.com/your-repo/issues
- Discord: [Your community link]

---

## Changelog

### v1.0.0 (2025-11-17)
- Initial affiliate system
- Amazon Associates support
- FTC-compliant disclosure
- Click tracking
- In-memory caching
- Aggregator stub (Phase 5 pending)

---

**END OF DOCUMENT**
