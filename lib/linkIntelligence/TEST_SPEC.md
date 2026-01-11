# Link Intelligence Library - Test Specification

This document provides comprehensive test cases for the `lib/linkIntelligence/` module.

---

## Module Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `types.ts` | Type definitions | 15 interfaces, 12 type aliases |
| `platforms/embedPlatforms.ts` | Embed platform definitions | 13 platforms |
| `platforms/socialPlatforms.ts` | Social profile definitions | 27 platforms |
| `platforms/index.ts` | Unified registry | Lookup & matching functions |
| `classifier.ts` | URL classification | `classifyUrl`, `parseEmbedUrl`, `parseSocialProfileUrl` |
| `oembed.ts` | oEmbed protocol | Discovery, fetching, enrichment |
| `health.ts` | Link health monitoring | Health checks, soft 404, availability |

---

## 1. URL Classification Tests

### 1.1 Embed URL Detection

Each URL should be classified as `type: 'embed'` with the correct platform.

#### YouTube
```typescript
// Standard watch URLs
'https://www.youtube.com/watch?v=dQw4w9WgXcQ' → { type: 'embed', platform: 'youtube' }
'https://youtube.com/watch?v=dQw4w9WgXcQ' → { type: 'embed', platform: 'youtube' }

// Short URLs
'https://youtu.be/dQw4w9WgXcQ' → { type: 'embed', platform: 'youtube' }

// Shorts
'https://www.youtube.com/shorts/abc123def45' → { type: 'embed', platform: 'youtube' }

// Embed URLs
'https://www.youtube.com/embed/dQw4w9WgXcQ' → { type: 'embed', platform: 'youtube' }

// Live streams
'https://www.youtube.com/live/abc123def45' → { type: 'embed', platform: 'youtube' }
```

#### Spotify
```typescript
// Tracks
'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh' → { type: 'embed', platform: 'spotify' }

// Albums
'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3' → { type: 'embed', platform: 'spotify' }

// Playlists
'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' → { type: 'embed', platform: 'spotify' }

// Episodes
'https://open.spotify.com/episode/abc123' → { type: 'embed', platform: 'spotify' }

// Shows
'https://open.spotify.com/show/abc123' → { type: 'embed', platform: 'spotify' }
```

#### TikTok
```typescript
// Video URLs
'https://www.tiktok.com/@username/video/1234567890123456789' → { type: 'embed', platform: 'tiktok' }

// Short URLs
'https://vm.tiktok.com/abc123XYZ' → { type: 'embed', platform: 'tiktok' }
```

#### Twitter/X
```typescript
// Twitter domain
'https://twitter.com/elonmusk/status/1234567890123456789' → { type: 'embed', platform: 'twitter' }

// X domain
'https://x.com/elonmusk/status/1234567890123456789' → { type: 'embed', platform: 'twitter' }
```

#### Instagram
```typescript
// Posts
'https://www.instagram.com/p/ABC123xyz/' → { type: 'embed', platform: 'instagram' }

// Reels
'https://www.instagram.com/reel/ABC123xyz/' → { type: 'embed', platform: 'instagram' }

// IGTV
'https://www.instagram.com/tv/ABC123xyz/' → { type: 'embed', platform: 'instagram' }
```

#### Twitch
```typescript
// Videos
'https://www.twitch.tv/videos/1234567890' → { type: 'embed', platform: 'twitch' }

// Clips
'https://www.twitch.tv/username/clip/ClipName123' → { type: 'embed', platform: 'twitch' }
'https://clips.twitch.tv/ClipName123' → { type: 'embed', platform: 'twitch' }
```

#### Vimeo (NEW)
```typescript
'https://vimeo.com/123456789' → { type: 'embed', platform: 'vimeo' }
'https://player.vimeo.com/video/123456789' → { type: 'embed', platform: 'vimeo' }
```

#### SoundCloud (NEW)
```typescript
'https://soundcloud.com/artist-name/track-name' → { type: 'embed', platform: 'soundcloud' }
'https://soundcloud.com/artist-name/sets/playlist-name' → { type: 'embed', platform: 'soundcloud' }
```

#### Apple Music (NEW)
```typescript
'https://music.apple.com/us/album/album-name/123456789' → { type: 'embed', platform: 'apple-music' }
```

#### Loom (NEW)
```typescript
'https://www.loom.com/share/abc123def456' → { type: 'embed', platform: 'loom' }
```

#### Bluesky (NEW)
```typescript
'https://bsky.app/profile/user.bsky.social/post/abc123' → { type: 'embed', platform: 'bluesky' }
```

#### Reddit (NEW)
```typescript
'https://www.reddit.com/r/subreddit/comments/abc123/post_title' → { type: 'embed', platform: 'reddit' }
```

#### Threads (NEW)
```typescript
'https://www.threads.net/@username/post/ABC123xyz' → { type: 'embed', platform: 'threads' }
```

---

### 1.2 Social Profile Detection

Each URL should be classified as `type: 'social'` with correct username extraction.

```typescript
// Instagram
'https://instagram.com/natgeo' → { type: 'social', platform: 'instagram-profile', username: 'natgeo' }

// Twitter/X
'https://twitter.com/elonmusk' → { type: 'social', platform: 'twitter-profile', username: 'elonmusk' }
'https://x.com/elonmusk' → { type: 'social', platform: 'twitter-profile', username: 'elonmusk' }

// YouTube channels
'https://youtube.com/@MrBeast' → { type: 'social', platform: 'youtube-channel', username: 'MrBeast' }
'https://youtube.com/c/MrBeast' → { type: 'social', platform: 'youtube-channel', username: 'MrBeast' }
'https://youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA' → { type: 'social', platform: 'youtube-channel' }

// TikTok
'https://tiktok.com/@charlidamelio' → { type: 'social', platform: 'tiktok-profile', username: 'charlidamelio' }

// LinkedIn
'https://linkedin.com/in/satyanadella' → { type: 'social', platform: 'linkedin-profile', username: 'satyanadella' }
'https://linkedin.com/company/microsoft' → { type: 'social', platform: 'linkedin-profile', username: 'microsoft' }

// GitHub
'https://github.com/torvalds' → { type: 'social', platform: 'github-profile', username: 'torvalds' }

// Twitch
'https://twitch.tv/ninja' → { type: 'social', platform: 'twitch-channel', username: 'ninja' }

// Spotify profiles
'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4' → { type: 'social', platform: 'spotify-profile' }
'https://open.spotify.com/user/spotify' → { type: 'social', platform: 'spotify-profile' }

// Bluesky
'https://bsky.app/profile/jay.bsky.social' → { type: 'social', platform: 'bluesky-profile' }

// Patreon
'https://patreon.com/mkbhd' → { type: 'social', platform: 'patreon-profile', username: 'mkbhd' }

// Substack
'https://example.substack.com' → { type: 'social', platform: 'substack-profile', username: 'example' }

// Email
'mailto:hello@example.com' → { type: 'social', platform: 'email', username: 'hello@example.com' }
```

---

### 1.3 Product URL Detection (Fallback)

Any URL not matching embed or social patterns should be `type: 'product'`.

```typescript
// E-commerce
'https://www.amazon.com/dp/B08N5WRWNW' → { type: 'product' }
'https://www.nike.com/t/air-max-90' → { type: 'product' }
'https://www.apple.com/shop/buy-mac/macbook-pro' → { type: 'product' }

// Generic websites
'https://example.com/product/123' → { type: 'product' }
```

---

### 1.4 Edge Cases

```typescript
// Reserved usernames should NOT be detected as profiles
'https://instagram.com/about' → { type: 'product' }  // Reserved
'https://twitter.com/help' → { type: 'product' }     // Reserved
'https://github.com/explore' → { type: 'product' }   // Reserved

// Content URLs should be embeds, NOT profiles
'https://instagram.com/p/ABC123' → { type: 'embed' }  // Post, not profile
'https://twitter.com/user/status/123' → { type: 'embed' }  // Tweet, not profile
'https://tiktok.com/@user/video/123' → { type: 'embed' }  // Video, not profile

// URLs with tracking params should be normalized
'https://youtube.com/watch?v=abc123&utm_source=twitter'
  → normalizedUrl: 'https://youtube.com/watch?v=abc123'

// Missing protocol should be added
'youtube.com/watch?v=abc123' → normalizedUrl starts with 'https://'
```

---

## 2. Embed Parsing Tests

### 2.1 `parseEmbedUrl()` Function

```typescript
import { parseEmbedUrl } from '@/lib/linkIntelligence';

// YouTube video
parseEmbedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')
→ {
    type: 'embed',
    platform: 'youtube',
    platformName: 'YouTube',
    contentId: 'dQw4w9WgXcQ',
    contentType: 'video',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  }

// YouTube short
parseEmbedUrl('https://youtube.com/shorts/abc123def45')
→ { contentType: 'short', ... }

// Spotify track
parseEmbedUrl('https://open.spotify.com/track/abc123')
→ {
    platform: 'spotify',
    contentId: 'abc123',
    contentType: 'track',
    embedUrl: 'https://open.spotify.com/embed/track/abc123'
  }

// Instagram reel
parseEmbedUrl('https://instagram.com/reel/ABC123')
→ { contentType: 'reel', ... }

// Non-embed URL
parseEmbedUrl('https://amazon.com/dp/B123')
→ null
```

---

## 3. Social Profile Parsing Tests

### 3.1 `parseSocialProfileUrl()` Function

```typescript
import { parseSocialProfileUrl } from '@/lib/linkIntelligence';

// Instagram
parseSocialProfileUrl('https://instagram.com/natgeo')
→ {
    type: 'social',
    platform: 'instagram',
    platformName: 'Instagram',
    username: 'natgeo',
    profileUrl: 'https://instagram.com/natgeo'
  }

// YouTube channel
parseSocialProfileUrl('https://youtube.com/@MrBeast')
→ {
    platform: 'youtube',
    username: 'MrBeast',
    profileUrl: 'https://youtube.com/@MrBeast'
  }

// Substack (subdomain format)
parseSocialProfileUrl('https://example.substack.com')
→ {
    platform: 'substack',
    username: 'example'
  }

// Content URL (should return null)
parseSocialProfileUrl('https://instagram.com/p/ABC123')
→ null

// Reserved username (should return null)
parseSocialProfileUrl('https://instagram.com/about')
→ null
```

---

## 4. oEmbed Tests

### 4.1 Endpoint Discovery

```typescript
import { getOEmbedUrl, hasOEmbedSupport } from '@/lib/linkIntelligence';

// YouTube (has oEmbed)
hasOEmbedSupport('https://youtube.com/watch?v=abc123')
→ true

getOEmbedUrl('https://youtube.com/watch?v=abc123', { maxWidth: 800 })
→ 'https://www.youtube.com/oembed?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3Dabc123&maxwidth=800'

// Instagram (no public oEmbed)
hasOEmbedSupport('https://instagram.com/p/abc123')
→ false
```

### 4.2 oEmbed Fetching

```typescript
import { fetchOEmbed } from '@/lib/linkIntelligence';

// Fetch YouTube oEmbed
await fetchOEmbed('https://youtube.com/watch?v=dQw4w9WgXcQ')
→ {
    type: 'video',
    version: '1.0',
    title: 'Rick Astley - Never Gonna Give You Up',
    authorName: 'Rick Astley',
    thumbnailUrl: '...',
    html: '<iframe ...>'
  }
```

### 4.3 Platforms with oEmbed Support

| Platform | oEmbed Endpoint | Status |
|----------|-----------------|--------|
| YouTube | youtube.com/oembed | ✅ Full |
| Vimeo | vimeo.com/api/oembed.json | ✅ Full |
| Spotify | open.spotify.com/oembed | ✅ Full |
| Twitter/X | publish.twitter.com/oembed | ✅ Full |
| TikTok | tiktok.com/oembed | ✅ Full |
| SoundCloud | soundcloud.com/oembed | ✅ Full |
| Reddit | reddit.com/oembed | ✅ Full |
| Loom | loom.com/v1/oembed | ✅ Full |
| Instagram | Graph API | ❌ Requires auth |
| Twitch | N/A | ❌ No public oEmbed |

---

## 5. Link Health Tests

### 5.1 Health Check

```typescript
import { checkUrlHealth } from '@/lib/linkIntelligence';

// Healthy URL
await checkUrlHealth('https://www.google.com')
→ {
    url: 'https://www.google.com',
    health: 'healthy',
    httpStatus: 200,
    isSoft404: false
  }

// Broken URL (404)
await checkUrlHealth('https://example.com/nonexistent-page-xyz')
→ {
    health: 'broken',
    httpStatus: 404
  }

// Redirect
await checkUrlHealth('https://github.com')
→ {
    redirected: true,
    finalUrl: 'https://github.com/',
    redirectCount: 1
  }
```

### 5.2 Soft 404 Detection

```typescript
import { detectSoft404 } from '@/lib/linkIntelligence';

// Page with "out of stock" message
detectSoft404('<html>This product is currently out of stock</html>', 'https://...')
→ { isSoft404: true, reason: 'Matched pattern: out\\s+of\\s+stock' }

// Page with "product not found"
detectSoft404('<html>Product not found</html>', 'https://...')
→ { isSoft404: true }

// Valid product page
detectSoft404('<html>Add to Cart - $99.99</html>', 'https://...')
→ { isSoft404: false }
```

### 5.3 Availability Detection

```typescript
import { detectAvailability } from '@/lib/linkIntelligence';

detectAvailability('<html>In Stock - Add to Cart</html>')
→ 'in_stock'

detectAvailability('<html>Sorry, this item is sold out</html>')
→ 'out_of_stock'

detectAvailability('<html>Pre-order now!</html>')
→ 'preorder'

detectAvailability('<html>This product has been discontinued</html>')
→ 'discontinued'
```

---

## 6. Platform Registry Tests

### 6.1 Platform Lookup

```typescript
import { getPlatform, getPlatformByDomain, getPlatformStats } from '@/lib/linkIntelligence';

// Get by ID
getPlatform('youtube')
→ { id: 'youtube', name: 'YouTube', type: 'embed', ... }

// Get by domain
getPlatformByDomain('open.spotify.com')
→ { id: 'spotify', name: 'Spotify', ... }

// Get stats
getPlatformStats()
→ {
    totalPlatforms: 40,
    embedPlatforms: 13,
    socialPlatforms: 27,
    totalDomains: 50+,
    platformsWithOEmbed: 8
  }
```

### 6.2 URL Matching

```typescript
import { matchUrl, matchEmbedUrl, matchSocialUrl } from '@/lib/linkIntelligence';

// Match any URL
matchUrl('https://youtube.com/watch?v=abc')
→ { platform: {...}, match: [...], type: 'embed' }

matchUrl('https://instagram.com/natgeo')
→ { platform: {...}, match: [...], type: 'social' }

matchUrl('https://amazon.com/dp/B123')
→ null  // Not a known platform
```

---

## 7. URL Normalization Tests

```typescript
import { normalizeUrl, extractDomain } from '@/lib/linkIntelligence';

// Add protocol
normalizeUrl('youtube.com/watch?v=abc')
→ 'https://youtube.com/watch?v=abc'

// Remove tracking params
normalizeUrl('https://example.com?utm_source=twitter&utm_medium=social&id=123')
→ 'https://example.com?id=123'

// Full list of removed params:
// utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id,
// fbclid, gclid, msclkid, ref, ref_src, twclid, etc. (25+ total)

// Extract domain
extractDomain('https://www.example.com/path?query=1')
→ 'example.com'  // www. removed
```

---

## 8. Batch Operations Tests

```typescript
import { classifyUrls, batchCheckUrlHealth, batchFetchOEmbed } from '@/lib/linkIntelligence';

// Batch classification
classifyUrls([
  'https://youtube.com/watch?v=abc',
  'https://instagram.com/natgeo',
  'https://amazon.com/dp/B123'
])
→ {
    results: [...],
    summary: { embeds: 1, social: 1, products: 1, total: 3 }
  }

// Batch health check (with rate limiting)
await batchCheckUrlHealth(['https://...', 'https://...'], {
  concurrency: 3,
  delayBetweenRequests: 1000,
  onProgress: (completed, total, result) => console.log(`${completed}/${total}`)
})

// Batch oEmbed fetch
await batchFetchOEmbed(['https://youtube.com/...', 'https://vimeo.com/...'])
```

---

## 9. Error Handling Tests

```typescript
// Invalid URLs
classifyUrl('')
→ { type: 'product', confidence: 0 }

classifyUrl('not-a-url')
→ { type: 'product', ... }

// Timeout handling
await checkUrlHealth('https://httpstat.us/200?sleep=30000', { timeout: 5000 })
→ { health: 'timeout', error: 'Request timed out' }

// Network errors
await checkUrlHealth('https://definitely-not-a-real-domain-xyz123.com')
→ { health: 'error', error: '...' }
```

---

## 10. Integration Test Scenarios

### Scenario 1: Creator Link Processing

```typescript
// Process a batch of creator links
const urls = [
  'https://youtube.com/watch?v=abc123',
  'https://instagram.com/creator',
  'https://open.spotify.com/track/xyz',
  'https://amazon.com/dp/B123',
  'https://patreon.com/creator'
];

const { results, summary } = classifyUrls(urls);
// summary: { embeds: 2, social: 2, products: 1, total: 5 }

// Enrich embeds with oEmbed
for (const result of results.filter(r => r.type === 'embed')) {
  const embed = parseEmbedUrl(result.normalizedUrl);
  const enriched = await enrichEmbedWithOEmbed(embed);
  // enriched now has .oembed with title, thumbnail, etc.
}
```

### Scenario 2: Link Health Audit

```typescript
// Check all links in a bag for health issues
const urls = [...]; // From database

const healthResults = await batchCheckUrlHealth(urls, {
  concurrency: 5,
  checkContent: true
});

const stats = calculateHealthStats(healthResults);
// { healthy: 45, broken: 2, soft404: 1, ... }

// Filter problem links
const problemLinks = [...healthResults.entries()]
  .filter(([url, result]) => result.health !== 'healthy');
```

---

## 11. Extraction Pipeline Tests

### 11.1 Full Analysis

```typescript
import { analyzeUrl, analyzeUrls } from '@/lib/linkIntelligence';

// Analyze YouTube video (embed path)
await analyzeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')
→ {
    classification: { type: 'embed', platform: 'youtube' },
    result: {
      type: 'embed',
      platform: 'youtube',
      contentId: 'dQw4w9WgXcQ',
      embedUrl: '...',
      oembed: { title: '...', thumbnailUrl: '...' }
    },
    health: { health: 'healthy', httpStatus: 200 }
  }

// Analyze Instagram profile (social path)
await analyzeUrl('https://instagram.com/natgeo')
→ {
    classification: { type: 'social', platform: 'instagram-profile' },
    result: {
      type: 'social',
      platform: 'instagram',
      username: 'natgeo'
    },
    health: { health: 'healthy' }
  }

// Analyze Amazon product (product path)
await analyzeUrl('https://amazon.com/dp/B08N5WRWNW')
→ {
    classification: { type: 'product' },
    result: {
      type: 'product',
      brand: 'Apple',
      productName: 'AirPods Pro',
      confidence: 0.9,
      sources: ['amazon_lookup']
    },
    health: { health: 'healthy' }
  }
```

### 11.2 Product Extraction Stages

The extraction pipeline runs through multiple stages:

| Stage | Source | Description |
|-------|--------|-------------|
| 0 | `cache` | Check product library for cached result |
| 1 | `url_parsing` | Extract from URL (540+ domain mappings, slug parsing) |
| 2 | `json_ld` / `open_graph` | Lightweight fetch for structured data |
| 2.5 | `amazon_lookup` | Amazon-specific ASIN lookup |
| 2.6 | `firecrawl` | Fallback for blocked sites |
| 2.7 | `jina_reader` | Fallback when Firecrawl fails |
| 2.8 | `google_images` | Image search fallback |
| 3 | `ai_analysis` | AI semantic analysis |

```typescript
import { quickExtractProduct, fullExtractProduct } from '@/lib/linkIntelligence';

// Quick extraction (URL parsing + structured data, no AI)
await quickExtractProduct('https://nike.com/t/air-max-90')
→ {
    brand: 'Nike',
    productName: 'Air Max 90',
    confidence: 0.85,
    sources: ['url_parsing', 'json_ld'],
    processingTimeMs: 500
  }

// Full extraction (all stages including AI)
await fullExtractProduct('https://unknown-site.com/product-123')
→ {
    brand: '...',
    productName: '...',
    confidence: 0.95,
    sources: ['url_parsing', 'firecrawl', 'ai_analysis'],
    processingTimeMs: 8000
  }
```

### 11.3 Batch Analysis

```typescript
import { analyzeUrls } from '@/lib/linkIntelligence';

const result = await analyzeUrls([
  'https://youtube.com/watch?v=abc',
  'https://instagram.com/natgeo',
  'https://amazon.com/dp/B123',
  'https://broken-link.example.com/404'
], {
  concurrency: 3,
  skipHealth: false,
  onProgress: (completed, total, result) => {
    console.log(`${completed}/${total}: ${result.classification.type}`);
  }
});

// result.summary
→ {
    total: 4,
    embeds: 1,
    social: 1,
    products: 2,
    healthy: 3,
    broken: 1,
    processingTimeMs: 5000
  }
```

---

## Running Tests

```bash
# Type check
npx tsc --noEmit --skipLibCheck

# Type check linkIntelligence only
npx tsc --noEmit lib/linkIntelligence/*.ts lib/linkIntelligence/platforms/*.ts

# Unit tests (when implemented)
npx jest lib/linkIntelligence/__tests__/

# Integration tests
npx jest lib/linkIntelligence/__tests__/integration/
```

---

## Coverage Checklist

- [ ] All 13 embed platforms have test cases
- [ ] All 27 social platforms have test cases
- [ ] Edge cases for reserved usernames tested
- [ ] Content vs profile URL distinction tested
- [ ] URL normalization (protocol, tracking params) tested
- [ ] oEmbed discovery and fetching tested
- [ ] Link health states (healthy, broken, soft_404, etc.) tested
- [ ] Availability detection tested
- [ ] Batch operations tested
- [ ] Error handling tested
- [ ] Timeout handling tested
