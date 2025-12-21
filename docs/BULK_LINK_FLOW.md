# Bulk Link Processing Flow

> **IMPORTANT**: This flow has been optimized for speed and efficiency. Any changes should maintain these performance characteristics.

## Overview

The bulk link import processes multiple URLs to identify products, find images, and create bag items. Target performance: **6 URLs in ~30-40 seconds**.

## Flow Diagram

```
User submits URLs
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 0: Product Library Check (FIRST!)                        │
│  - Check if URL exists in product_library table                 │
│  - If found with confidence ≥ 0.7 → Return cached data (FREE)   │
│  - Saves Firecrawl credits on repeated URLs                     │
└──────────────────────────────────────────────────────────────────┘
       ↓ (not found)
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 1: URL Intelligence (No Network)                         │
│  - Parse URL for brand, product name, category                  │
│  - Known domains have brand mappings (domainBrands.ts)          │
│  - If confidence ≥ 0.85 + brand + name → Quick AI polish        │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2: Lightweight Fetch                                     │
│  - Timeout: 5 seconds                                           │
│  - Extract JSON-LD structured data                              │
│  - If good structured data → Return (95% confidence)            │
└──────────────────────────────────────────────────────────────────┘
       ↓ (blocked or no data)
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2.5: Amazon Lookup (if Amazon URL)                       │
│  - Use ASIN to lookup product details                           │
└──────────────────────────────────────────────────────────────────┘
       ↓ (blocked or retailer)
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2.6: Firecrawl (costs 1 credit)                          │
│  - Timeout: 15 seconds                                          │
│  - For blocked sites (Amazon, REI, etc.)                        │
│  - Auto-saves result to product_library for future              │
└──────────────────────────────────────────────────────────────────┘
       ↓ (Firecrawl failed)
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2.7: Jina Reader (free fallback)                         │
│  - Last resort for scraping                                     │
│  - Also saves to product_library                                │
└──────────────────────────────────────────────────────────────────┘
       ↓ (all scraping failed)
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2.8: URL Parsing + Google Images Fallback                │
│  - Use URL-parsed brand + product name                          │
│  - Search Google Images for product photo                       │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 3: AI Semantic Analysis (if needed)                      │
│  - Full AI analysis for low-confidence results                  │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│  IMAGE COLLECTION (ALWAYS)                                       │
│  1. Add scraped image from identification (if valid)            │
│  2. ALWAYS search Google Images for options                     │
│  3. Return up to 5 image options                                │
└──────────────────────────────────────────────────────────────────┘
```

## Performance Requirements

### Timeouts (DO NOT INCREASE)
| Operation | Timeout | Reason |
|-----------|---------|--------|
| resolveRedirects | 3s | Just following redirects |
| lightweightFetch | 5s | Fail fast, try Firecrawl |
| Firecrawl | 15s | Main scraping, needs time |
| Jina Reader | 10s | Free fallback |

### Parallel Processing
- **Batch size: 5 URLs** processed concurrently
- 25 URLs = 5 batches = ~100s max (not 500s sequential)
- Each batch waits for slowest URL, then next batch starts

### Caching Layers
1. **In-memory cache** (Firecrawl): 10 minute TTL, prevents duplicate API calls on retries
2. **Product Library** (Database): Permanent cache, saves Firecrawl credits forever

## Key Files

| File | Purpose |
|------|---------|
| `app/api/bags/[code]/bulk-links/route.ts` | Main bulk processing endpoint |
| `app/api/bags/[code]/bulk-links/save/route.ts` | Save confirmed items |
| `lib/linkIdentification/index.ts` | Product identification pipeline |
| `lib/linkIdentification/firecrawl.ts` | Firecrawl API with caching |
| `lib/linkIdentification/productLibrary.ts` | Database cache for scraped products |

## Product Library Schema

```sql
product_library (
  url_hash TEXT UNIQUE,  -- SHA256 of normalized URL
  brand TEXT,
  product_name TEXT,
  full_name TEXT,
  image_url TEXT,
  confidence REAL,       -- Must be ≥ 0.7 to be used
  source TEXT,           -- 'firecrawl', 'jina', etc.
  hit_count INTEGER,     -- Track usage
  ...
)
```

## When Library is Populated

1. **Automatically** after successful Firecrawl/Jina scrape (confidence ≥ 0.7)
2. **On user confirmation** (planned: when user saves item to bag)

## Common Issues & Solutions

### "Timeout after 60 seconds"
- Check `maxDuration` in route.ts (should be 300 for Vercel Pro)
- Ensure parallel batching is working (batch size 5)

### "Failed to download image"
- Images use browser-like headers
- Amazon/REI need Referer header
- Some images are blocked (tiny response check)

### "High Firecrawl usage"
- Check product_library is being consulted first
- Library lookup happens in STAGE 0
- Verify caching is working (check logs for "Cache hit")

## Monitoring

Look for these log messages:
```
[ProductLibrary] Cache hit for domain.com: Product Name  ← Good, saving credits
[bulk-links] Identified: Product Name (90% via firecrawl) ← Firecrawl was used
[ProductLibrary] Saved: Product Name (firecrawl, 90%)     ← Cached for future
```

---

*Last updated: December 2024*
*Performance target: 6 URLs in 30-40 seconds*
