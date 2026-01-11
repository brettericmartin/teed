# Teed Link Intelligence Library

*The definitive reference for URL extraction, enrichment, and monitoring.*

This document makes Teed the canonical infrastructure layer for creator link management — the "picks and shovels" that powers the creator economy.

---

## Table of Contents

1. [Extraction Priority Matrix](#1-extraction-priority-matrix)
2. [Structured Data Reference](#2-structured-data-reference)
3. [oEmbed & Social Embedding](#3-oembed--social-embedding)
4. [Platform-Specific Guides](#4-platform-specific-guides)
5. [Affiliate Network Reference](#5-affiliate-network-reference)
6. [Link Health Monitoring](#6-link-health-monitoring)
7. [Infrastructure Patterns](#7-infrastructure-patterns)
8. [Decision Trees](#8-decision-trees)
9. [Code Patterns](#9-code-patterns)

---

## 1. Extraction Priority Matrix

### Data Source Priority (Highest to Lowest)

When extracting metadata from a URL, try these sources in order:

```
1. JSON-LD structured data     ← Most reliable, machine-readable
   └── <script type="application/ld+json">

2. Microdata attributes        ← Embedded in HTML elements
   └── itemtype, itemprop

3. Open Graph meta tags        ← Universal social preview
   └── <meta property="og:*">

4. Twitter Card meta tags      ← Twitter-specific, good fallback
   └── <meta name="twitter:*">

5. Standard HTML meta tags     ← Basic fallback
   └── <meta name="description">, <title>

6. CSS selector patterns       ← Platform-specific, fragile
   └── .product-title, .price, etc.

7. Text pattern matching       ← Last resort
   └── Regex for prices, availability text
```

### Essential Fields Priority Matrix

| Field | Primary Source | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|----------------|------------|------------|------------|
| **Name** | `schema:name` | `og:title` | `<title>` | `h1.product-title` |
| **Image** | `schema:image` | `og:image` | `twitter:image` | `.product-image img` |
| **Brand** | `schema:brand.name` | `og:product:brand` | `[itemprop="brand"]` | `.brand-name` |
| **Description** | `schema:description` | `og:description` | `meta[name="description"]` | `.product-description` |
| **Price** | `schema:offers.price` | `og:product:price:amount` | `[itemprop="price"]` | `.price` |
| **Currency** | `schema:offers.priceCurrency` | `og:product:price:currency` | `[itemprop="priceCurrency"]` | Parse from price string |
| **Availability** | `schema:offers.availability` | `og:product:availability` | `[itemprop="availability"]` | `.stock-status` |
| **SKU** | `schema:sku` | `og:product:retailer_item_id` | `[itemprop="sku"]` | `[data-sku]` |

### Confidence Scoring

| Source | Base Confidence |
|--------|-----------------|
| JSON-LD with complete data | 0.95 |
| Microdata match | 0.90 |
| Open Graph complete | 0.85 |
| Open Graph partial | 0.75 |
| CSS selectors | 0.60 |
| Text pattern matching | 0.40 |

---

## 2. Structured Data Reference

### Schema.org Product Vocabulary

The [Product](https://schema.org/Product) type is the standard for e-commerce structured data.

#### Essential Product Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `name` | Text | Product name | Yes |
| `image` | URL/ImageObject | Product image | Yes |
| `description` | Text | Product description | Recommended |
| `sku` | Text | Merchant-specific identifier | Recommended |
| `gtin` | Text | Global Trade Item Number (8-14 digits) | Recommended |
| `mpn` | Text | Manufacturer Part Number | Recommended |
| `brand` | Brand/Organization | Product brand | Recommended |
| `offers` | Offer/AggregateOffer | Purchase information | Yes (one of offers/review/aggregateRating) |

#### Offer Properties

| Property | Type | Description |
|----------|------|-------------|
| `price` | Number | Offer price (no currency symbols) |
| `priceCurrency` | Text | ISO 4217 currency code (e.g., "USD") |
| `availability` | ItemAvailability | Stock status URL |
| `itemCondition` | OfferItemCondition | New/Used/Refurbished |
| `url` | URL | Link to the offer |
| `seller` | Organization/Person | Who is selling |

#### Availability Values

```
https://schema.org/InStock
https://schema.org/OutOfStock
https://schema.org/PreOrder
https://schema.org/BackOrder
https://schema.org/Discontinued
```

#### Example JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "TaylorMade Qi10 Driver",
  "image": "https://example.com/qi10.jpg",
  "description": "The Qi10 Driver features...",
  "brand": {
    "@type": "Brand",
    "name": "TaylorMade"
  },
  "sku": "M7254309",
  "offers": {
    "@type": "Offer",
    "price": 599.99,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

### Open Graph Protocol

#### Core Tags (Required for all pages)

```html
<meta property="og:title" content="Product Name">
<meta property="og:type" content="product.item">
<meta property="og:url" content="https://example.com/product">
<meta property="og:image" content="https://example.com/product.jpg">
<meta property="og:description" content="Product description">
```

#### Product-Specific Tags

| Tag | Description | Example Value |
|-----|-------------|---------------|
| `product:price:amount` | Price without currency symbol | "49.99" |
| `product:price:currency` | ISO 4217 currency | "USD" |
| `product:availability` | Stock status | "in stock", "out of stock", "preorder" |
| `product:condition` | Item condition | "new", "refurbished", "used" |
| `product:retailer_item_id` | SKU/Product ID | "ABC123" |
| `product:brand` | Brand name | "Nike" |
| `product:category` | Product category | "Clothing > Shoes" |

### Twitter Cards

Twitter falls back to Open Graph when Twitter-specific tags are missing.

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Product Name">
<meta name="twitter:description" content="Description">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

### JSON-LD Best Practices

1. **Place in `<head>`** — Faster for crawlers
2. **Use `https://schema.org`** — Not custom or outdated context URLs
3. **Match visible content** — JSON-LD must reflect on-page content
4. **Sanitize for XSS** — Replace `<` with `\u003c` in dynamic data
5. **Handle multiple blocks** — Pages may have separate Product and BreadcrumbList
6. **Validate syntax** — No trailing commas, proper quotes

---

## 3. oEmbed & Social Embedding

### oEmbed Specification Overview

oEmbed is an open format for embedding content from one site into another. Returns structured data including embeddable HTML.

#### Response Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| **photo** | Static images | `url`, `width`, `height` |
| **video** | Playable videos | `html`, `width`, `height` |
| **link** | Generic embed | None (title, author_name, etc.) |
| **rich** | Rich HTML content | `html`, `width`, `height` |

#### Common Response Fields

```json
{
  "type": "video",
  "version": "1.0",
  "title": "Video Title",
  "author_name": "Creator Name",
  "author_url": "https://youtube.com/@creator",
  "provider_name": "YouTube",
  "provider_url": "https://youtube.com",
  "thumbnail_url": "https://img.youtube.com/...",
  "thumbnail_width": 480,
  "thumbnail_height": 360,
  "html": "<iframe src=\"...\"></iframe>",
  "width": 560,
  "height": 315,
  "cache_age": 86400
}
```

### Platform Endpoint Registry

#### Video Platforms

| Platform | Endpoint | URL Patterns | Auth |
|----------|----------|--------------|------|
| **YouTube** | `https://www.youtube.com/oembed` | `youtube.com/*`, `youtu.be/*` | None |
| **Vimeo** | `https://vimeo.com/api/oembed.json` | `vimeo.com/*` | None |
| **TikTok** | `https://www.tiktok.com/oembed` | `tiktok.com/*` | None |
| **Twitch** | N/A (use iframe) | `twitch.tv/*`, `clips.twitch.tv/*` | None |
| **Loom** | `https://www.loom.com/v1/oembed` | `loom.com/share/*` | None |
| **Wistia** | `https://fast.wistia.com/oembed` | `*.wistia.com/*` | None |

#### Audio Platforms

| Platform | Endpoint | URL Patterns | Auth |
|----------|----------|--------------|------|
| **Spotify** | `https://open.spotify.com/oembed` | `open.spotify.com/*` | None |
| **SoundCloud** | `https://soundcloud.com/oembed` | `soundcloud.com/*` | None |
| **Apple Music** | `https://embed.music.apple.com/oembed` | `music.apple.com/*` | None |
| **Bandcamp** | `https://bandcamp.com/oembed` | `*.bandcamp.com/*` | None |

#### Social Platforms

| Platform | Endpoint | URL Patterns | Auth |
|----------|----------|--------------|------|
| **Twitter/X** | `https://publish.twitter.com/oembed` | `twitter.com/*`, `x.com/*` | None |
| **Instagram** | Meta Graph API | `instagram.com/p/*` | Required |
| **Facebook** | Meta Graph API | `facebook.com/*` | Required |
| **Pinterest** | `https://www.pinterest.com/oembed.json` | `pinterest.com/pin/*` | None |
| **Reddit** | N/A (use blockquote) | `reddit.com/*` | N/A |
| **LinkedIn** | N/A | N/A | N/A |

#### Developer/Design Platforms

| Platform | Endpoint | URL Patterns | Auth |
|----------|----------|--------------|------|
| **CodePen** | `https://codepen.io/api/oembed` | `codepen.io/*` | None |
| **Figma** | `https://www.figma.com/api/oembed` | `figma.com/file/*` | None |
| **GitHub Gist** | `https://api.github.com/gists/*` | `gist.github.com/*` | None |
| **Notion** | N/A | N/A | N/A |

#### Other Platforms

| Platform | Endpoint | URL Patterns | Auth |
|----------|----------|--------------|------|
| **Giphy** | `https://giphy.com/services/oembed` | `giphy.com/gifs/*` | None |
| **Flickr** | `https://www.flickr.com/services/oembed` | `flickr.com/photos/*` | None |
| **SlideShare** | `https://www.slideshare.net/api/oembed/2` | `slideshare.net/*` | None |
| **Kickstarter** | `https://www.kickstarter.com/services/oembed` | `kickstarter.com/*` | None |

### oEmbed Discovery

Discover oEmbed endpoints via HTML `<link>` tags:

```html
<link rel="alternate"
      type="application/json+oembed"
      href="https://example.com/oembed?url=..."
      title="Page Title" />
```

**Discovery Process:**
1. Fetch URL as HTML
2. Parse `<head>` for `<link rel="alternate" type="application/json+oembed">`
3. Use `href` attribute as oEmbed endpoint

### Fallback Strategy

When oEmbed is unavailable:

```
1. oEmbed endpoint (if known or discovered)
   ↓ (fail)
2. Twitter Cards metadata
   ↓ (fail)
3. Open Graph metadata
   ↓ (fail)
4. HTML meta tags + first image
   ↓ (fail)
5. Domain + title only (minimal preview)
```

### Security Considerations

#### XSS Prevention

oEmbed returns HTML that may contain `<script>` tags. **Always sandbox embeds:**

```html
<!-- Option 1: Off-domain iframe (recommended) -->
<iframe
  src="https://embeds.yourdomain.com/render?id=123"
  sandbox="allow-scripts allow-same-origin allow-popups">
</iframe>

<!-- Option 2: srcdoc with sandbox -->
<iframe
  srcdoc="<!-- oEmbed HTML -->"
  sandbox="allow-scripts allow-popups">
</iframe>
```

#### Sandbox Flags

| Flag | Purpose | Risk |
|------|---------|------|
| `allow-scripts` | JavaScript execution | Medium |
| `allow-same-origin` | Access parent origin | High |
| `allow-popups` | Window.open, target="_blank" | Low |
| `allow-forms` | Form submission | Medium |
| `allow-top-navigation` | Navigate parent frame | High |

### Making Embeds Responsive

oEmbed returns fixed dimensions. Make responsive with CSS:

```css
/* Aspect ratio container */
.embed-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}

.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Modern alternative */
.embed-container iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
}
```

---

## 4. Platform-Specific Guides

### Retailers

#### Amazon

**URL Patterns:**
```
https://www.amazon.com/dp/B0XXXXXXXXX
https://www.amazon.com/gp/product/B0XXXXXXXXX
https://www.amazon.com/Product-Name/dp/B0XXXXXXXXX
https://amzn.to/XXXXXXX (shortened)
```

**ASIN Extraction:**
```javascript
const asinPatterns = [
  /\/dp\/([A-Z0-9]{10})/i,
  /\/gp\/product\/([A-Z0-9]{10})/i,
  /\/product\/([A-Z0-9]{10})/i,
  /asin=([A-Z0-9]{10})/i
];
```

**Challenges:**
- Aggressive bot detection (returns empty pages)
- Minimal Schema.org markup
- Frequent DOM structure changes
- Geographic redirects

**Best Approach:**
1. Extract ASIN from URL
2. Use Firecrawl for rendering
3. Fall back to Jina Reader
4. Use Product Advertising API if available

#### Shopify Stores

**Detection:**
```javascript
// Check for Shopify indicators
const isShopify =
  html.includes('cdn.shopify.com') ||
  html.includes('Shopify.theme') ||
  html.includes('shopify-section');
```

**URL Patterns:**
```
https://store.com/products/product-slug
https://store.com/collections/category/products/product-slug
```

**Extraction Strategy:**
1. JSON-LD is usually well-implemented (`structured_data` Liquid filter)
2. Products with variants use `ProductGroup`
3. Check for `product:*` Open Graph tags

#### WooCommerce

**Detection:**
```javascript
const isWooCommerce =
  html.includes('woocommerce') ||
  html.includes('wc-block') ||
  html.includes('wp-content/plugins/woocommerce');
```

**Extraction Strategy:**
1. JSON-LD output on single product pages
2. Variable products may have incomplete variant data
3. Plugins (Yoast, Rank Math) enhance structured data

#### eBay

**URL Patterns:**
```
https://www.ebay.com/itm/ITEM_ID
https://www.ebay.com/itm/Product-Name/ITEM_ID
```

**Item ID Extraction:**
```javascript
const ebayItemPattern = /\/itm\/(?:[^\/]+\/)?(\d+)/;
```

#### Walmart

**URL Patterns:**
```
https://www.walmart.com/ip/Product-Name/ITEM_ID
```

**Extraction:**
- Good structured data usually available
- Check `product:*` Open Graph tags

#### Etsy

**URL Patterns:**
```
https://www.etsy.com/listing/LISTING_ID/product-title
https://www.etsy.com/shop/SHOP_NAME
```

**Challenges:**
- Handmade/custom items with variable pricing
- Multi-variation products
- Shop-specific metadata

### Social/Content Platforms

#### YouTube

**URL Patterns:**
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/shorts/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://m.youtube.com/watch?v=VIDEO_ID
```

**Video ID Extraction:**
```javascript
const youtubePatterns = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
];
```

**oEmbed:** `https://www.youtube.com/oembed?url=URL&format=json`

#### TikTok

**URL Patterns:**
```
https://www.tiktok.com/@username/video/VIDEO_ID
https://vm.tiktok.com/SHORT_CODE
```

**oEmbed:** `https://www.tiktok.com/oembed?url=URL`

**Note:** Short URLs (vm.tiktok.com) redirect to full URLs

#### Instagram

**URL Patterns:**
```
https://www.instagram.com/p/POST_ID/
https://www.instagram.com/reel/REEL_ID/
https://www.instagram.com/stories/USERNAME/STORY_ID/
```

**Challenges:**
- oEmbed requires Meta Developer account + app approval
- Rate limits apply
- Profile data is restricted

**Alternative:** Use `?__a=1` JSON endpoint (may be blocked)

#### Twitter/X

**URL Patterns:**
```
https://twitter.com/USERNAME/status/TWEET_ID
https://x.com/USERNAME/status/TWEET_ID
```

**oEmbed:** `https://publish.twitter.com/oembed?url=URL`

**Note:** Requires widget.js for full rendering

#### Spotify

**URL Patterns:**
```
https://open.spotify.com/track/TRACK_ID
https://open.spotify.com/album/ALBUM_ID
https://open.spotify.com/playlist/PLAYLIST_ID
https://open.spotify.com/episode/EPISODE_ID
https://open.spotify.com/show/SHOW_ID
https://spotify.link/SHORT_CODE
```

**oEmbed:** `https://open.spotify.com/oembed?url=URL`

---

## 5. Affiliate Network Reference

### Amazon Associates

**Link Structure:**
```
https://www.amazon.com/dp/ASIN/?tag=ASSOCIATE_ID
https://www.amazon.com/dp/ASIN/?tag=mysite-20&linkCode=...
```

**Key Parameters:**
- `tag` — Associate ID (format: `mysite-20` for US)
- `ascsubtag` — Optional sub-tracking for analytics

**Attribution Window:**
- **24-hour cookie** — One of the shortest in industry
- **90-day cart extension** — Items added within 24 hours earn commission for 90 days
- Window closes if customer uses another affiliate's link

**API Access:**
- Product Advertising API (PA-API)
- Requires approval and has throttling limits

### ShareASale

**Link Structure:**
```
https://shareasale.com/r.cfm?b=BANNER_ID&u=AFFILIATE_ID&m=MERCHANT_ID&urllink=destination.com/page&afftrack=TRACKING
```

**Parameters:**
- `b` — Banner/link ID
- `u` — Affiliate ID
- `m` — Merchant ID
- `urllink` — Destination URL (without `http://`)
- `afftrack` — Custom tracking value

**Short Links:** `https://shrsl.com/[code]`

### CJ Affiliate (Commission Junction)

**Link Structure:**
```
https://www.anrdoezrs.net/click-[PID]-[AID]?url=[destination]
https://www.tkqlhce.com/click-[PID]-[AID]?url=[destination]
https://www.dpbolvw.net/click-[PID]-[AID]?url=[destination]
```

- `PID` — Publisher Website ID
- `AID` — Advertiser ID

### Impact

**Link Structure:** Network-specific, varies by advertiser

**Features:**
- SmartLinks 2.0 for dynamic link swapping
- Server-to-server postback tracking
- SubID parameter auto-placement

### Rakuten Advertising

**Features:**
- `u1` parameter for subid tracking
- Linkbuilder API for programmatic link creation

### Awin

**Link Structure:**
```
https://www.awin1.com/cread.php?...
```

**Short Links:** `https://tidd.ly/[code]`

**API:** REST API with OAuth2, 20 calls/minute limit

### Skimlinks

**Automatic Monetization:**
```html
<script src="//s.skimresources.com/js/SITE_ID.skimlinks.js"></script>
```

- Automatically converts organic links to affiliate links
- Works with 48,500+ merchants
- Link Wrapper API for server-side integration

### FTC Disclosure Requirements (2025)

**Who Must Disclose:**
- Anyone with a "material connection" (commissions, free products, financial benefits)

**The "Clear and Conspicuous" Standard (4 P's):**
1. **Prominence** — Large enough to notice
2. **Presentation** — Plain language
3. **Placement** — Where consumers are likely to look
4. **Proximity** — Close to the affiliate link

**What's NOT Acceptable:**
- Just labeling as "Affiliate Link"
- Vague hashtags like `#partner`
- Disclosures at bottom of page or in sidebars
- Hidden behind "read more" clicks

**Acceptable Disclosures:**
```
"I earn a commission if you purchase through this link"
"This is an affiliate link"
"#ad" or "#sponsored" (visible, not buried in hashtags)
```

---

## 6. Link Health Monitoring

### HTTP Status Code Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Record as healthy |
| 301/302 | Redirect | Follow, track chain |
| 307/308 | Redirect (preserve method) | Follow, track chain |
| 403 | Forbidden | Mark as blocked, stop crawling domain |
| 404 | Not Found | Mark as broken |
| 410 | Gone (permanent) | Mark as permanently broken |
| 429 | Too Many Requests | Pause, implement backoff |
| 500-503 | Server Error | Retry with exponential backoff |

### HEAD vs GET Requests

Use **HEAD requests** by default (saves bandwidth), with **GET fallback**:

```javascript
async function checkUrl(url: string): Promise<UrlCheckResult> {
  try {
    // Try HEAD first
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000)
    });

    if (headResponse.ok) {
      return { status: headResponse.status, healthy: true };
    }

    // Some servers don't implement HEAD properly, fall back to GET
    if (headResponse.status === 405) {
      const getResponse = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'Range': 'bytes=0-1024' }, // Minimal body
        signal: AbortSignal.timeout(10000)
      });
      return { status: getResponse.status, healthy: getResponse.ok };
    }

    return { status: headResponse.status, healthy: false };
  } catch (error) {
    return { status: 0, healthy: false, error: error.message };
  }
}
```

### Soft 404 Detection

A **soft 404** returns HTTP 200 but displays "not found" content.

**Detection Patterns:**

```javascript
const SOFT_404_INDICATORS = [
  // Out of stock
  /out of stock/i,
  /sold out/i,
  /currently unavailable/i,
  /no longer available/i,

  // Product not found
  /product\s+(not|no longer)\s+found/i,
  /this\s+item\s+is\s+(no longer|not)\s+available/i,
  /has\s+been\s+(removed|discontinued)/i,
  /we\s+couldn'?t\s+find/i,
  /page\s+(not|cannot be)\s+found/i,

  // Generic not found
  /no\s+results\s+found/i,
  /sorry,?\s+this\s+(page|product)/i,
  /the\s+page\s+you.*(looking|requested)/i
];

function detectSoft404(content: string, status: number): boolean {
  if (status !== 200) return false;

  for (const pattern of SOFT_404_INDICATORS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Additional heuristic: very short content
  if (content.length < 1000) {
    return true;
  }

  return false;
}
```

### Product Availability Detection

**In-Stock Indicators:**
```javascript
const IN_STOCK_PATTERNS = [
  /in\s*stock/i,
  /available/i,
  /add\s*to\s*cart/i,
  /buy\s*now/i,
  /ships?\s*(today|tomorrow|within)/i
];
```

**Out-of-Stock Indicators:**
```javascript
const OUT_OF_STOCK_PATTERNS = [
  /out\s*of\s*stock/i,
  /sold\s*out/i,
  /currently\s*unavailable/i,
  /not\s*available/i,
  /discontinued/i,
  /back\s*order/i,
  /pre-?order/i,
  /coming\s*soon/i,
  /notify\s*(me|when)/i
];
```

**Schema.org Availability:**
```javascript
function extractAvailability(jsonLd: any): string {
  const availability = jsonLd?.offers?.availability ||
                       jsonLd?.offers?.[0]?.availability;

  if (!availability) return 'unknown';

  const mapping = {
    'https://schema.org/InStock': 'in_stock',
    'https://schema.org/OutOfStock': 'out_of_stock',
    'https://schema.org/PreOrder': 'preorder',
    'https://schema.org/BackOrder': 'backorder',
    'https://schema.org/Discontinued': 'discontinued'
  };

  return mapping[availability] || 'unknown';
}
```

### Redirect Chain Following

```javascript
async function followRedirects(
  url: string,
  maxRedirects = 10
): Promise<RedirectChain> {
  const chain: RedirectStep[] = [];
  let currentUrl = url;

  for (let i = 0; i < maxRedirects; i++) {
    const response = await fetch(currentUrl, {
      method: 'HEAD',
      redirect: 'manual'
    });

    chain.push({
      url: currentUrl,
      status: response.status,
      headers: Object.fromEntries(response.headers)
    });

    // Not a redirect
    if (![301, 302, 307, 308].includes(response.status)) {
      break;
    }

    const location = response.headers.get('location');
    if (!location) break;

    // Handle relative URLs
    currentUrl = new URL(location, currentUrl).toString();
  }

  return {
    chain,
    finalUrl: chain[chain.length - 1]?.url,
    redirectCount: chain.length - 1,
    hasLoop: new Set(chain.map(s => s.url)).size !== chain.length
  };
}
```

### Rate Limiting Best Practices

| Site Type | Delay Between Requests |
|-----------|------------------------|
| Unknown sites | 10-15 seconds (start conservative) |
| Large sites (with permission) | 1-2 requests/second |
| APIs with documented limits | Respect headers |
| After 429 response | Exponential backoff |

**Exponential Backoff:**
```javascript
async function fetchWithBackoff(
  url: string,
  maxRetries = 5
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);

    if (response.status !== 429) {
      return response;
    }

    // Check Retry-After header
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter
      ? parseInt(retryAfter) * 1000
      : Math.pow(2, attempt) * 1000;

    await sleep(delay);
  }

  throw new Error('Max retries exceeded');
}
```

---

## 7. Infrastructure Patterns

### Caching Strategy

#### TTL Recommendations

| Content Type | Check Interval | Cache TTL |
|--------------|----------------|-----------|
| Affiliate product links | 24 hours | 23 hours |
| High-traffic items | 12 hours | 11 hours |
| New items (<7 days) | 6 hours | 5 hours |
| Known-problematic | 1 hour | 30 minutes |
| oEmbed responses | Per `cache_age` field | 1-24 hours |
| Open Graph metadata | 24 hours | 23 hours |

#### Stale-While-Revalidate Pattern

```javascript
async function getCachedMetadata(url: string): Promise<Metadata> {
  const cached = await cache.get(url);

  if (cached) {
    // Return stale data immediately
    if (cached.isStale) {
      // Trigger background refresh
      queueRefresh(url);
    }
    return cached.data;
  }

  // No cache, fetch fresh
  const fresh = await fetchMetadata(url);
  await cache.set(url, fresh);
  return fresh;
}
```

### Queue-Based Processing

**Architecture:**
```
[API Request]
     ↓
[Quick Classification] → Return immediately
     ↓
[Queue Job] → Background processing
     ↓
[Worker Pool] → Fetch, parse, enrich
     ↓
[Update Database] → Store results
     ↓
[Webhook/Notification] → Alert if broken
```

**Job Prioritization:**
- **High:** User-reported broken links
- **Medium:** Scheduled periodic checks
- **Low:** Bulk imports, full-site crawls

**BullMQ Example:**
```javascript
import { Queue, Worker } from 'bullmq';

const linkQueue = new Queue('link-checks');

// Add job with priority
await linkQueue.add('check-url',
  { url, itemId },
  {
    priority: 2,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
);

// Worker
const worker = new Worker('link-checks', async job => {
  const { url, itemId } = job.data;
  const result = await checkUrl(url);
  await saveResult(itemId, result);

  if (!result.healthy) {
    await notifyBrokenLink(itemId, url, result);
  }
}, { concurrency: 10 });
```

### Database Schema

```sql
-- URLs to monitor
CREATE TABLE monitored_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES bag_items(id),
  url TEXT NOT NULL,
  url_type VARCHAR(50) NOT NULL, -- 'affiliate', 'product', 'source'
  last_checked_at TIMESTAMPTZ,
  last_successful_at TIMESTAMPTZ,
  check_interval_hours INTEGER DEFAULT 24,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  consecutive_failures INTEGER DEFAULT 0,
  UNIQUE(item_id, url)
);

-- Check results history
CREATE TABLE url_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_url_id UUID NOT NULL REFERENCES monitored_urls(id),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  http_status INTEGER,
  response_time_ms INTEGER,
  final_url TEXT,
  redirect_count INTEGER DEFAULT 0,
  is_soft_404 BOOLEAN DEFAULT FALSE,
  availability_status VARCHAR(50),
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_monitored_urls_next_check
  ON monitored_urls (is_active, last_checked_at)
  WHERE is_active = TRUE;
```

### Link Unfurling (Slack-Style)

**Best Practices from Slack:**
1. Use HTTP Range headers — request only first **32KB**
2. Place OG meta tags **early in `<head>`** (before large scripts)
3. Character limit: Meta tags beyond 10,000 characters are ignored
4. Priority: oEmbed → Twitter Cards → Open Graph → HTML meta
5. Cache aggressively with stale-while-revalidate

```javascript
async function unfurlUrl(url: string): Promise<UnfurlResult> {
  // Fetch minimal content
  const response = await fetch(url, {
    headers: { 'Range': 'bytes=0-32768' }
  });

  const html = await response.text();

  // Try oEmbed first (if endpoint known)
  const oembedEndpoint = discoverOembedEndpoint(html);
  if (oembedEndpoint) {
    const oembed = await fetchOembed(oembedEndpoint, url);
    if (oembed) return { type: 'oembed', data: oembed };
  }

  // Fall back to Open Graph
  const og = parseOpenGraph(html);
  if (og.title && og.image) {
    return { type: 'opengraph', data: og };
  }

  // Minimal fallback
  return {
    type: 'minimal',
    data: {
      title: parseTitle(html),
      domain: new URL(url).hostname
    }
  };
}
```

---

## 8. Decision Trees

### URL Extraction Strategy

```
Given a URL, what extraction strategy?

                    ┌─────────────┐
                    │  Parse URL  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌──────────┐  ┌─────────┐
        │ Social? │  │  Video?  │  │ Product │
        └────┬────┘  └────┬─────┘  └────┬────┘
             │            │             │
             ▼            ▼             ▼
     parseSocialUrl  parseEmbedUrl  identifyProduct
             │            │             │
             │            ├──► oEmbed   ├──► Cache check
             │            │             │
             │            │             ├──► JSON-LD
             │            │             │
             │            │             ├──► Open Graph
             │            │             │
             │            │             ├──► Firecrawl
             │            │             │
             │            │             └──► AI analysis
             │            │
             └────────────┴──────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │  Result   │
                    └───────────┘
```

### Extraction Fallback Chain

```
Given extraction failure, what's the fallback?

JSON-LD failed?
  │
  ├──► Try Microdata
  │
  └──► Microdata failed?
        │
        ├──► Try Open Graph
        │
        └──► Open Graph failed?
              │
              ├──► Try Twitter Cards
              │
              └──► Twitter Cards failed?
                    │
                    ├──► Try CSS selectors (platform-specific)
                    │
                    └──► Selectors failed?
                          │
                          ├──► Try Firecrawl (JS rendering)
                          │
                          └──► Firecrawl failed?
                                │
                                ├──► Try Jina Reader
                                │
                                └──► Jina failed?
                                      │
                                      ├──► Try Google Images
                                      │
                                      └──► Return URL-parsed data only
```

### Is This URL Monetizable?

```
Can this URL be monetized?

                    ┌─────────────┐
                    │ Extract URL │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Is domain in affiliate │
              │ network mapping?       │
              └───────────┬────────────┘
                    │
           ┌────────┴────────┐
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │ Yes: Check  │   │ No: Query   │
    │ network API │   │ Skimlinks/  │
    │ for program │   │ aggregator  │
    └──────┬──────┘   └──────┬──────┘
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │ Program     │   │ Merchant    │
    │ active?     │   │ found?      │
    └──────┬──────┘   └──────┬──────┘
           │                 │
      ┌────┴────┐       ┌────┴────┐
      ▼         ▼       ▼         ▼
    [Yes]     [No]    [Yes]     [No]
      │         │       │         │
      ▼         ▼       ▼         ▼
  Generate   Return   Generate  Return
  affiliate  original affiliate original
  link       URL      link      URL
```

---

## 9. Code Patterns

### Complete Metadata Extraction

```typescript
interface ExtractedMetadata {
  title?: string;
  description?: string;
  image?: string;
  brand?: string;
  price?: number;
  currency?: string;
  availability?: string;
  sku?: string;
  url: string;
  source: 'json-ld' | 'microdata' | 'opengraph' | 'twitter' | 'html' | 'selector';
  confidence: number;
}

async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  const response = await fetch(url, {
    headers: {
      'Range': 'bytes=0-32768',
      'User-Agent': 'TeedBot/1.0 (+https://teed.app/bot)'
    }
  });

  const html = await response.text();

  // Try JSON-LD first (highest confidence)
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.name) {
    return {
      title: jsonLd.name,
      description: jsonLd.description,
      image: jsonLd.image?.url || jsonLd.image,
      brand: jsonLd.brand?.name,
      price: parseFloat(jsonLd.offers?.price),
      currency: jsonLd.offers?.priceCurrency,
      availability: mapAvailability(jsonLd.offers?.availability),
      sku: jsonLd.sku,
      url,
      source: 'json-ld',
      confidence: 0.95
    };
  }

  // Try Open Graph
  const og = extractOpenGraph(html);
  if (og.title) {
    return {
      title: og.title,
      description: og.description,
      image: og.image,
      brand: og.brand,
      price: parseFloat(og.price?.amount),
      currency: og.price?.currency,
      availability: og.availability,
      url,
      source: 'opengraph',
      confidence: 0.85
    };
  }

  // Fallback to HTML
  return {
    title: extractTitle(html),
    description: extractMetaDescription(html),
    image: extractFirstImage(html, url),
    url,
    source: 'html',
    confidence: 0.50
  };
}
```

### oEmbed Discovery and Fetch

```typescript
interface OEmbedEndpoint {
  url: string;
  format: 'json' | 'xml';
}

function discoverOembedEndpoint(html: string): OEmbedEndpoint | null {
  const jsonMatch = html.match(
    /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i
  );

  if (jsonMatch) {
    return { url: jsonMatch[1], format: 'json' };
  }

  const xmlMatch = html.match(
    /<link[^>]+rel=["']alternate["'][^>]+type=["']text\/xml\+oembed["'][^>]+href=["']([^"']+)["']/i
  );

  if (xmlMatch) {
    return { url: xmlMatch[1], format: 'xml' };
  }

  return null;
}

async function fetchOembed(
  endpoint: OEmbedEndpoint,
  contentUrl: string,
  options?: { maxwidth?: number; maxheight?: number }
): Promise<OEmbedResponse | null> {
  const url = new URL(endpoint.url);
  url.searchParams.set('url', contentUrl);
  url.searchParams.set('format', 'json');

  if (options?.maxwidth) {
    url.searchParams.set('maxwidth', String(options.maxwidth));
  }
  if (options?.maxheight) {
    url.searchParams.set('maxheight', String(options.maxheight));
  }

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}
```

### Affiliate Link Detection

```typescript
const AFFILIATE_PATTERNS = [
  // Amazon
  { network: 'amazon', pattern: /[?&]tag=([^&]+)/i },
  { network: 'amazon', pattern: /amzn\.to\//i },

  // ShareASale
  { network: 'shareasale', pattern: /shareasale\.com\/r\.cfm/i },
  { network: 'shareasale', pattern: /shrsl\.com\//i },

  // CJ Affiliate
  { network: 'cj', pattern: /anrdoezrs\.net\/click/i },
  { network: 'cj', pattern: /tkqlhce\.com\/click/i },
  { network: 'cj', pattern: /dpbolvw\.net\/click/i },

  // Awin
  { network: 'awin', pattern: /awin1\.com\/cread\.php/i },
  { network: 'awin', pattern: /tidd\.ly\//i },

  // Impact
  { network: 'impact', pattern: /impact\.com.*?subId/i },

  // Rakuten
  { network: 'rakuten', pattern: /click\.linksynergy\.com/i },

  // Skimlinks
  { network: 'skimlinks', pattern: /go\.skimresources\.com/i },
  { network: 'skimlinks', pattern: /go\.redirectingat\.com/i }
];

function detectAffiliateNetwork(url: string): string | null {
  for (const { network, pattern } of AFFILIATE_PATTERNS) {
    if (pattern.test(url)) {
      return network;
    }
  }
  return null;
}
```

---

## Appendix: Quick Reference Tables

### Image Size Requirements

| Platform | Recommended | Minimum | Max File Size |
|----------|-------------|---------|---------------|
| Universal | 1200 x 630 px | 600 x 315 px | 1 MB |
| Facebook | 1200 x 630 px | 600 x 315 px | 8 MB |
| Twitter/X | 1200 x 630 px | 120 x 120 px | 5 MB |
| LinkedIn | 1200 x 627 px | - | 5 MB |

### User Agent Strings

```javascript
const USER_AGENTS = [
  // Bot (transparent)
  'TeedBot/1.0 (+https://teed.app/bot)',

  // Chrome (desktop)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Safari (macOS)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',

  // Mobile (iPhone)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];
```

### Common Price Selectors

```javascript
const PRICE_SELECTORS = [
  // Microdata
  '[itemprop="price"]',
  '[itemprop="lowPrice"]',

  // Common classes
  '.price',
  '.product-price',
  '.current-price',
  '.sale-price',
  '[class*="price"]',
  '[data-price]',

  // Amazon-specific
  '.a-price-whole',
  '.a-offscreen',
  '#priceblock_ourprice',
  '#priceblock_dealprice',

  // Shopify
  '.price__regular',
  '.price__sale',
  '[data-product-price]'
];
```

---

*Link Intelligence Library v1.0 — January 2026*
*Teed: The canonical infrastructure for creator link management*
