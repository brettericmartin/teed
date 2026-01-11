# Link System Capability Matrix

**Purpose**: Any replacement or revision of the link analysis system MUST handle all of these scenarios at least as well as the current implementation.

---

## 1. URL Classification Capabilities

### Must Detect: Embed Content
| Platform | URL Patterns | Current Status |
|----------|--------------|----------------|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/` | ✅ Working |
| Spotify | `/track/`, `/album/`, `/playlist/`, `/episode/`, `/show/` | ✅ Working |
| TikTok | `@username/video/`, `vm.tiktok.com/` | ✅ Working |
| Twitter/X | `/status/` on twitter.com and x.com | ✅ Working |
| Instagram | `/p/`, `/reel/` | ✅ Working |
| Twitch | `/videos/`, `/clip/`, `clips.twitch.tv/` | ✅ Working |
| Vimeo | `vimeo.com/` | ❌ Missing |
| SoundCloud | `soundcloud.com/` (tracks) | ❌ Missing |
| Apple Music | `music.apple.com/` | ❌ Missing |
| Loom | `loom.com/share/` | ❌ Missing |

### Must Detect: Social Profiles
| Platform | URL Patterns | Current Status |
|----------|--------------|----------------|
| Instagram | `instagram.com/username` (not /p/, /reel/) | ✅ Working |
| Twitter/X | `twitter.com/username`, `x.com/username` | ✅ Working |
| YouTube | `/@username`, `/channel/`, `/c/`, `/user/` | ✅ Working |
| TikTok | `tiktok.com/@username` | ✅ Working |
| LinkedIn | `/in/`, `/company/` | ✅ Working |
| GitHub | `github.com/username` | ✅ Working |
| Twitch | `twitch.tv/username` | ✅ Working |
| Spotify | `/artist/`, `/user/` | ✅ Working |
| + 16 more platforms | Various | ✅ Working |

### Must Detect: Product URLs
Everything that's not embed or social → goes to product pipeline.

---

## 2. Product Identification Capabilities

### Stage 0: Cache Lookup
| Capability | Current Status |
|------------|----------------|
| Check product library for previously scraped URL | ✅ Working |
| Return cached result if confidence >= stored | ✅ Working |
| Skip network calls for cached URLs | ✅ Working |

### Stage 1: URL Intelligence (No Network)
| Capability | Current Status |
|------------|----------------|
| Extract brand from domain (540+ domains) | ✅ Working |
| Extract brand from URL slug (130+ patterns) | ✅ Working |
| Humanize product slugs (`best-nike-air-max` → `Best Nike Air Max`) | ✅ Working |
| Preserve golf model casing (`qi10` → `Qi10`) | ✅ Working |
| Extract ASIN from Amazon URLs | ✅ Working |
| Extract SKU/model numbers | ✅ Working |
| Extract color from URL params | ✅ Working |
| Extract size from URL params | ✅ Working |
| Calculate confidence score (0.30-0.85) | ✅ Working |

### Stage 2: Lightweight Fetch
| Capability | Current Status |
|------------|----------------|
| Fetch HTML with realistic headers | ✅ Working |
| Rotate user agents (4 variants) | ✅ Working |
| Extract JSON-LD structured data | ✅ Working |
| Extract Open Graph tags | ✅ Working |
| Extract meta tags | ✅ Working |
| Extract price and currency | ✅ Working |
| Extract product images | ✅ Working |
| Detect bot protection (19 patterns) | ✅ Working |
| Detect redirect traps | ✅ Working |
| Retry with exponential backoff | ✅ Working |
| Timeout handling (configurable) | ✅ Working |

### Stage 2.5: Amazon-Specific
| Capability | Current Status |
|------------|----------------|
| Direct ASIN lookup | ✅ Working |
| Extract title, brand, price from Amazon | ✅ Working |
| Filter Amazon widget URLs | ✅ Working |

### Stage 2.6: Firecrawl Fallback
| Capability | Current Status |
|------------|----------------|
| Use Firecrawl for blocked sites | ✅ Working |
| Handle JavaScript-rendered content | ✅ Working |
| Validate results aren't homepage | ✅ Working |
| Cache successful scrapes | ✅ Working |

### Stage 2.7: Jina Reader Fallback
| Capability | Current Status |
|------------|----------------|
| Fallback when Firecrawl fails | ✅ Working |
| Extract Amazon product from Jina | ✅ Working |

### Stage 2.8: Google Images Fallback
| Capability | Current Status |
|------------|----------------|
| Search for product images when scraping fails | ✅ Working |
| Return up to 5 image options | ✅ Working |

### Stage 3: AI Semantic Analysis
| Capability | Current Status |
|------------|----------------|
| Analyze URL + scraped content with GPT-4o | ✅ Working |
| Extract brand, product name, category | ✅ Working |
| Extract specifications | ✅ Working |
| Temperature 0.3 for consistency | ✅ Working |

---

## 3. Brand Knowledge Capabilities

| Capability | Current Status |
|------------|----------------|
| 303 brands across 11 categories | ✅ Working |
| Color vocabulary per category | ✅ Working |
| Design cues and identification tips | ✅ Working |
| Recent colorways (2019-2024) | ✅ Working |
| Aliases for brand name matching | ✅ Working |
| Verbosity levels for token optimization | ✅ Working |
| Category-specific part terminology | ✅ Working |

---

## 4. Domain Knowledge Capabilities

| Capability | Current Status |
|------------|----------------|
| 540+ domains mapped | ✅ Working |
| Brand, category, tier per domain | ✅ Working |
| Retailer vs brand distinction | ✅ Working |
| Subdomain handling (`store.apple.com` → `apple.com`) | ✅ Working |
| Aliases for alternate brand names | ✅ Working |

---

## 5. URL Normalization Capabilities

| Capability | Current Status |
|------------|----------------|
| Add https:// to protocol-less URLs | ✅ Working |
| Remove tracking params (utm_*, fbclid, gclid, ref) | ✅ Working |
| Handle mailto: links specially | ✅ Working |
| Trim whitespace | ✅ Working |
| Handle malformed URLs gracefully | ✅ Working |

---

## 6. Error Handling Capabilities

| Capability | Current Status |
|------------|----------------|
| Bot protection detection | ✅ Working |
| Redirect to homepage detection | ✅ Working |
| Timeout handling | ✅ Working |
| Retry with backoff | ✅ Working |
| Graceful fallback to URL parsing | ✅ Working |
| Never return empty (always has URL-parsed data) | ✅ Working |

---

## 7. Performance Characteristics

| Metric | Current Value |
|--------|---------------|
| Cache hit | <50ms |
| URL parsing only | <100ms |
| Lightweight fetch | 1-5s |
| Firecrawl fallback | 5-15s |
| AI analysis | 2-10s |
| Full pipeline worst case | ~30s |
| Parallel batch processing | 5 URLs at once |
| SSE streaming progress | ✅ Real-time |

---

## 8. Output Capabilities

### Product Identification Result
```typescript
{
  brand: string | null;
  productName: string;
  fullName: string;
  category: string | null;
  specifications: string[];
  price: string | null;
  currency: string | null;
  imageUrl: string | null;
  confidence: number;        // 0.0-1.0
  sources: string[];         // Audit trail
  primarySource: string;
  processingTimeMs: number;
  debugInfo?: {...};
}
```

### Embed Parse Result
```typescript
{
  platform: string;          // youtube, spotify, etc.
  id: string;               // Video/track ID
  type?: string;            // video, short, track, album, etc.
  url: string;              // Original URL
  embedUrl?: string;        // Iframe-ready URL
  thumbnailUrl?: string;    // Preview image
}
```

### Social Profile Result
```typescript
{
  platform: string;
  username: string;
  displayName?: string;
  url: string;
}
```

---

## 9. Edge Cases That Must Be Handled

### Amazon Edge Cases
- [ ] ASIN in various URL positions (`/dp/`, `/gp/product/`, query param)
- [ ] Amazon shortened URLs (`amzn.to/`)
- [ ] Amazon international domains (`.co.uk`, `.de`, `.fr`, etc.)
- [ ] Amazon widget URLs (filter out, unreliable)
- [ ] Amazon bot protection (frequent blocking)

### Retailer Edge Cases
- [ ] Product in URL slug vs. query params
- [ ] Multi-brand retailers (Amazon, Walmart, Target)
- [ ] Shopify stores (universal patterns)
- [ ] WooCommerce stores (detection)

### Social Platform Edge Cases
- [ ] Profile vs. content URL distinction (Instagram /p/ vs. username)
- [ ] Reserved usernames (about, help, login, etc.)
- [ ] Multiple URL formats per platform (YouTube 4 formats)
- [ ] Platform domain changes (twitter.com → x.com)

### Embed Edge Cases
- [ ] Shortened URLs (youtu.be, vm.tiktok.com)
- [ ] Embed URLs vs. watch URLs
- [ ] Private/unlisted content (still parse ID)
- [ ] Playlist vs. video vs. channel

### Content Edge Cases
- [ ] Soft 404s (page exists but "product not found")
- [ ] Out of stock vs. discontinued
- [ ] Price ranges vs. single price
- [ ] Multiple sellers with different prices
- [ ] JavaScript-only rendered content

### URL Edge Cases
- [ ] Missing protocol
- [ ] Tracking parameters
- [ ] URL fragments (#anchor)
- [ ] Encoded characters
- [ ] Malformed URLs

---

## 10. Gaps in Current System (Opportunities)

### Not Currently Handled
| Gap | Impact |
|-----|--------|
| Soft 404 detection | Links to discontinued products appear "working" |
| Availability/stock status | Can't tell in-stock vs out-of-stock |
| oEmbed data fetching | Missing thumbnail, author, duration for embeds |
| Link health monitoring | No way to detect broken links over time |
| Vimeo, SoundCloud, Apple Music embeds | Falls to "product" classification |
| Reddit, Bluesky social profiles | Falls to "product" classification |

### Partially Handled
| Gap | Current State |
|-----|---------------|
| Price extraction | Works but takes first offer, not lowest |
| Confidence thresholds | Hardcoded, not configurable |
| Error logging | Silent `.catch(() => {})` in many places |
| AI timeout | No explicit timeout wrapper |

---

## Minimum Viable Replacement Checklist

Any replacement system MUST:

- [ ] Handle all 6 current embed platforms + extract IDs correctly
- [ ] Handle all 24 current social platforms + filter reserved usernames
- [ ] Route everything else to product identification
- [ ] Support 540+ domain-to-brand mappings
- [ ] Parse product info from URL without network (130+ patterns)
- [ ] Extract JSON-LD, Open Graph, meta tags from HTML
- [ ] Detect 19+ bot protection patterns
- [ ] Handle Amazon ASINs with dedicated lookup
- [ ] Fallback to Firecrawl for blocked sites
- [ ] Fallback to Jina Reader when Firecrawl fails
- [ ] Fallback to Google Images for photos
- [ ] Use AI for semantic analysis when needed
- [ ] Cache successful scrapes in product library
- [ ] Return confidence scores (0.0-1.0)
- [ ] Return audit trail of sources used
- [ ] Handle all edge cases listed above
- [ ] Match or exceed current performance characteristics
- [ ] Support SSE streaming for batch operations

---

*This document serves as the acceptance criteria for any link system revision.*
