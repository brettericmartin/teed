/**
 * Link Intelligence - Comprehensive Smoke Tests
 *
 * Run with: npx ts-node --esm lib/linkIntelligence/__tests__/smoke.test.ts
 * Or: npx tsx lib/linkIntelligence/__tests__/smoke.test.ts
 */

import {
  // Classification
  classifyUrl,
  classifyUrls,
  normalizeUrl,
  extractDomain,
  parseEmbedUrl,
  parseSocialProfileUrl,
  isValidUrl,

  // Platform registry
  getPlatform,
  getPlatformByDomain,
  matchUrl,
  matchEmbedUrl,
  matchSocialUrl,
  getPlatformStats,
  isReservedUsername,
  EMBED_PLATFORMS,
  SOCIAL_PLATFORMS,

  // oEmbed
  getOEmbedUrl,
  hasOEmbedSupport,

  // Health
  detectSoft404,
  detectAvailability,
} from '../index';

// =============================================================================
// TEST UTILITIES
// =============================================================================

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function test(name: string, fn: () => boolean | void): void {
  try {
    const result = fn();
    if (result === false) {
      failCount++;
      failures.push(`FAIL: ${name}`);
      console.log(`  ❌ ${name}`);
    } else {
      passCount++;
      console.log(`  ✅ ${name}`);
    }
  } catch (error) {
    failCount++;
    const msg = error instanceof Error ? error.message : String(error);
    failures.push(`FAIL: ${name} - ${msg}`);
    console.log(`  ❌ ${name} - ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): boolean {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
  return true;
}

function assertIncludes(actual: string, substring: string, message?: string): boolean {
  if (!actual.includes(substring)) {
    throw new Error(`${message || 'Assertion failed'}: "${actual}" does not include "${substring}"`);
  }
  return true;
}

function assertNotNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected non-null value');
  }
}

function section(name: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log('='.repeat(60));
}

// =============================================================================
// URL NORMALIZATION TESTS
// =============================================================================

section('1. URL NORMALIZATION');

test('adds https:// to protocol-less URLs', () => {
  const result = normalizeUrl('youtube.com/watch?v=abc123');
  assertIncludes(result, 'https://');
});

test('preserves existing https://', () => {
  const result = normalizeUrl('https://youtube.com/watch?v=abc123');
  assertEqual(result.startsWith('https://'), true);
});

test('removes utm_source tracking param', () => {
  const result = normalizeUrl('https://example.com?id=123&utm_source=twitter');
  assertEqual(result.includes('utm_source'), false);
  assertIncludes(result, 'id=123');
});

test('removes fbclid tracking param', () => {
  const result = normalizeUrl('https://example.com?fbclid=abc123');
  assertEqual(result.includes('fbclid'), false);
});

test('removes gclid tracking param', () => {
  const result = normalizeUrl('https://example.com?gclid=abc123');
  assertEqual(result.includes('gclid'), false);
});

test('preserves mailto: links', () => {
  const result = normalizeUrl('mailto:hello@example.com');
  assertEqual(result, 'mailto:hello@example.com');
});

test('extracts domain correctly', () => {
  assertEqual(extractDomain('https://www.youtube.com/watch?v=abc'), 'youtube.com');
  assertEqual(extractDomain('https://open.spotify.com/track/123'), 'open.spotify.com');
});

// =============================================================================
// EMBED CLASSIFICATION TESTS
// =============================================================================

section('2. EMBED URL CLASSIFICATION');

// YouTube
test('classifies YouTube watch URL as embed', () => {
  const result = classifyUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'youtube');
});

test('classifies YouTube short URL (youtu.be) as embed', () => {
  const result = classifyUrl('https://youtu.be/dQw4w9WgXcQ');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'youtube');
});

test('classifies YouTube Shorts as embed', () => {
  const result = classifyUrl('https://www.youtube.com/shorts/abc123def45');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'youtube');
});

test('classifies YouTube embed URL as embed', () => {
  const result = classifyUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assertEqual(result.type, 'embed');
});

test('classifies YouTube live as embed', () => {
  const result = classifyUrl('https://www.youtube.com/live/abc123def45');
  assertEqual(result.type, 'embed');
});

// Spotify
test('classifies Spotify track as embed', () => {
  const result = classifyUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'spotify');
});

test('classifies Spotify album as embed', () => {
  const result = classifyUrl('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3');
  assertEqual(result.type, 'embed');
});

test('classifies Spotify playlist as embed', () => {
  const result = classifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  assertEqual(result.type, 'embed');
});

test('classifies Spotify episode as embed', () => {
  const result = classifyUrl('https://open.spotify.com/episode/abc123');
  assertEqual(result.type, 'embed');
});

// TikTok
test('classifies TikTok video as embed', () => {
  const result = classifyUrl('https://www.tiktok.com/@username/video/1234567890123456789');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'tiktok');
});

test('classifies TikTok short URL as embed', () => {
  const result = classifyUrl('https://vm.tiktok.com/abc123XYZ');
  assertEqual(result.type, 'embed');
});

// Twitter/X
test('classifies Twitter status as embed', () => {
  const result = classifyUrl('https://twitter.com/elonmusk/status/1234567890123456789');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'twitter');
});

test('classifies X.com status as embed', () => {
  const result = classifyUrl('https://x.com/elonmusk/status/1234567890123456789');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'twitter');
});

// Instagram
test('classifies Instagram post as embed', () => {
  const result = classifyUrl('https://www.instagram.com/p/ABC123xyz/');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'instagram');
});

test('classifies Instagram reel as embed', () => {
  const result = classifyUrl('https://www.instagram.com/reel/ABC123xyz/');
  assertEqual(result.type, 'embed');
});

// Twitch
test('classifies Twitch video as embed', () => {
  const result = classifyUrl('https://www.twitch.tv/videos/1234567890');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'twitch');
});

test('classifies Twitch clip as embed', () => {
  const result = classifyUrl('https://clips.twitch.tv/ClipName123');
  assertEqual(result.type, 'embed');
});

// Vimeo (NEW)
test('classifies Vimeo video as embed', () => {
  const result = classifyUrl('https://vimeo.com/123456789');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'vimeo');
});

// SoundCloud (NEW)
test('classifies SoundCloud track as embed', () => {
  const result = classifyUrl('https://soundcloud.com/artist-name/track-name');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'soundcloud');
});

// Loom (NEW)
test('classifies Loom share URL as embed', () => {
  const result = classifyUrl('https://www.loom.com/share/abc123def456');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'loom');
});

// Reddit (NEW)
test('classifies Reddit post as embed', () => {
  const result = classifyUrl('https://www.reddit.com/r/subreddit/comments/abc123/post_title');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'reddit');
});

// Bluesky (NEW)
test('classifies Bluesky post as embed', () => {
  const result = classifyUrl('https://bsky.app/profile/user.bsky.social/post/abc123');
  assertEqual(result.type, 'embed');
  assertEqual(result.platform, 'bluesky');
});

// =============================================================================
// SOCIAL PROFILE CLASSIFICATION TESTS
// =============================================================================

section('3. SOCIAL PROFILE CLASSIFICATION');

test('classifies Instagram profile as social', () => {
  const result = classifyUrl('https://instagram.com/natgeo');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'instagram-profile');
});

test('classifies Twitter profile as social', () => {
  const result = classifyUrl('https://twitter.com/elonmusk');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'twitter-profile');
});

test('classifies X.com profile as social', () => {
  const result = classifyUrl('https://x.com/elonmusk');
  assertEqual(result.type, 'social');
});

test('classifies YouTube channel (@) as social', () => {
  const result = classifyUrl('https://youtube.com/@MrBeast');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'youtube-channel');
});

test('classifies YouTube channel (/c/) as social', () => {
  const result = classifyUrl('https://youtube.com/c/MrBeast');
  assertEqual(result.type, 'social');
});

test('classifies YouTube channel (/channel/) as social', () => {
  const result = classifyUrl('https://youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA');
  assertEqual(result.type, 'social');
});

test('classifies TikTok profile as social', () => {
  const result = classifyUrl('https://tiktok.com/@charlidamelio');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'tiktok-profile');
});

test('classifies LinkedIn profile as social', () => {
  const result = classifyUrl('https://linkedin.com/in/satyanadella');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'linkedin-profile');
});

test('classifies LinkedIn company as social', () => {
  const result = classifyUrl('https://linkedin.com/company/microsoft');
  assertEqual(result.type, 'social');
});

test('classifies GitHub profile as social', () => {
  const result = classifyUrl('https://github.com/torvalds');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'github-profile');
});

test('classifies Twitch channel as social', () => {
  const result = classifyUrl('https://twitch.tv/ninja');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'twitch-channel');
});

test('classifies Spotify artist as social', () => {
  const result = classifyUrl('https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'spotify-profile');
});

test('classifies Patreon profile as social', () => {
  const result = classifyUrl('https://patreon.com/mkbhd');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'patreon-profile');
});

test('classifies Substack as social', () => {
  const result = classifyUrl('https://example.substack.com');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'substack-profile');
});

test('classifies Discord invite as social', () => {
  const result = classifyUrl('https://discord.gg/abc123');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'discord-server');
});

test('classifies Telegram as social', () => {
  const result = classifyUrl('https://t.me/username');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'telegram-profile');
});

test('classifies Bluesky profile as social', () => {
  const result = classifyUrl('https://bsky.app/profile/jay.bsky.social');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'bluesky-profile');
});

test('classifies mailto as social (email)', () => {
  const result = classifyUrl('mailto:hello@example.com');
  assertEqual(result.type, 'social');
  assertEqual(result.platform, 'email');
});

// =============================================================================
// PRODUCT CLASSIFICATION TESTS
// =============================================================================

section('4. PRODUCT URL CLASSIFICATION');

test('classifies Amazon product as product', () => {
  const result = classifyUrl('https://www.amazon.com/dp/B08N5WRWNW');
  assertEqual(result.type, 'product');
});

test('classifies Nike product as product', () => {
  const result = classifyUrl('https://www.nike.com/t/air-max-90-mens-shoes');
  assertEqual(result.type, 'product');
});

test('classifies Apple Store as product', () => {
  const result = classifyUrl('https://www.apple.com/shop/buy-mac/macbook-pro');
  assertEqual(result.type, 'product');
});

test('classifies unknown site as product', () => {
  const result = classifyUrl('https://unknown-shop.com/product/123');
  assertEqual(result.type, 'product');
});

// =============================================================================
// EDGE CASES: CONTENT VS PROFILE DISTINCTION
// =============================================================================

section('5. EDGE CASES: CONTENT VS PROFILE');

test('Instagram post (content) is embed, not social', () => {
  const result = classifyUrl('https://instagram.com/p/ABC123');
  assertEqual(result.type, 'embed');
});

test('Instagram profile is social, not embed', () => {
  const result = classifyUrl('https://instagram.com/natgeo');
  assertEqual(result.type, 'social');
});

test('Twitter status (content) is embed, not social', () => {
  const result = classifyUrl('https://twitter.com/user/status/123456');
  assertEqual(result.type, 'embed');
});

test('Twitter profile is social, not embed', () => {
  const result = classifyUrl('https://twitter.com/user');
  assertEqual(result.type, 'social');
});

test('TikTok video (content) is embed, not social', () => {
  const result = classifyUrl('https://tiktok.com/@user/video/123456');
  assertEqual(result.type, 'embed');
});

test('TikTok profile is social, not embed', () => {
  const result = classifyUrl('https://tiktok.com/@user');
  assertEqual(result.type, 'social');
});

test('YouTube video is embed, not social', () => {
  const result = classifyUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');  // Must be 11 chars
  assertEqual(result.type, 'embed');
});

test('YouTube channel is social, not embed', () => {
  const result = classifyUrl('https://youtube.com/@MrBeast');
  assertEqual(result.type, 'social');
});

// =============================================================================
// EDGE CASES: RESERVED USERNAMES
// =============================================================================

section('6. EDGE CASES: RESERVED USERNAMES');

test('instagram.com/about is NOT a social profile', () => {
  assertEqual(isReservedUsername('about'), true);
  const result = classifyUrl('https://instagram.com/about');
  assertEqual(result.type, 'product'); // Falls through to product
});

test('twitter.com/help is NOT a social profile', () => {
  assertEqual(isReservedUsername('help'), true);
  const result = classifyUrl('https://twitter.com/help');
  assertEqual(result.type, 'product');
});

test('github.com/explore is NOT a social profile', () => {
  assertEqual(isReservedUsername('explore'), true);
  const result = classifyUrl('https://github.com/explore');
  assertEqual(result.type, 'product');
});

test('instagram.com/login is NOT a social profile', () => {
  assertEqual(isReservedUsername('login'), true);
});

test('various reserved usernames are detected', () => {
  const reserved = ['settings', 'privacy', 'terms', 'api', 'developer', 'docs', 'blog'];
  reserved.forEach(username => {
    assertEqual(isReservedUsername(username), true, `${username} should be reserved`);
  });
});

// =============================================================================
// EMBED PARSING TESTS
// =============================================================================

section('7. EMBED PARSING');

test('parseEmbedUrl extracts YouTube video ID', () => {
  const result = parseEmbedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');
  assertNotNull(result);
  assertEqual(result.contentId, 'dQw4w9WgXcQ');
  assertEqual(result.platform, 'youtube');
  assertIncludes(result.embedUrl || '', 'youtube-nocookie.com/embed/dQw4w9WgXcQ');
});

test('parseEmbedUrl extracts YouTube short ID', () => {
  const result = parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
  assertNotNull(result);
  assertEqual(result.contentId, 'dQw4w9WgXcQ');
});

test('parseEmbedUrl detects YouTube Shorts type', () => {
  const result = parseEmbedUrl('https://youtube.com/shorts/abc123def45');
  assertNotNull(result);
  assertEqual(result.contentType, 'short');
});

test('parseEmbedUrl extracts Spotify track ID', () => {
  const result = parseEmbedUrl('https://open.spotify.com/track/abc123');
  assertNotNull(result);
  assertEqual(result.contentId, 'abc123');
  assertEqual(result.contentType, 'track');
  assertIncludes(result.embedUrl || '', 'embed/track/abc123');
});

test('parseEmbedUrl extracts Instagram reel type', () => {
  const result = parseEmbedUrl('https://instagram.com/reel/ABC123');
  assertNotNull(result);
  assertEqual(result.contentType, 'reel');
});

test('parseEmbedUrl returns null for non-embed URL', () => {
  const result = parseEmbedUrl('https://amazon.com/dp/B123');
  assertEqual(result, null);
});

// =============================================================================
// SOCIAL PROFILE PARSING TESTS
// =============================================================================

section('8. SOCIAL PROFILE PARSING');

test('parseSocialProfileUrl extracts Instagram username', () => {
  const result = parseSocialProfileUrl('https://instagram.com/natgeo');
  assertNotNull(result);
  assertEqual(result.username, 'natgeo');
  assertEqual(result.platform, 'instagram');
});

test('parseSocialProfileUrl extracts Twitter username', () => {
  const result = parseSocialProfileUrl('https://twitter.com/elonmusk');
  assertNotNull(result);
  assertEqual(result.username, 'elonmusk');
});

test('parseSocialProfileUrl extracts YouTube channel', () => {
  const result = parseSocialProfileUrl('https://youtube.com/@MrBeast');
  assertNotNull(result);
  assertEqual(result.username, 'MrBeast');
});

test('parseSocialProfileUrl extracts Substack from subdomain', () => {
  const result = parseSocialProfileUrl('https://example.substack.com');
  assertNotNull(result);
  assertEqual(result.username, 'example');
});

test('parseSocialProfileUrl returns null for content URL', () => {
  const result = parseSocialProfileUrl('https://instagram.com/p/ABC123');
  assertEqual(result, null);
});

test('parseSocialProfileUrl returns null for reserved username', () => {
  const result = parseSocialProfileUrl('https://instagram.com/about');
  assertEqual(result, null);
});

// =============================================================================
// PLATFORM REGISTRY TESTS
// =============================================================================

section('9. PLATFORM REGISTRY');

test('getPlatform finds YouTube', () => {
  const platform = getPlatform('youtube');
  assertNotNull(platform);
  assertEqual(platform.name, 'YouTube');
});

test('getPlatform finds instagram-profile', () => {
  const platform = getPlatform('instagram-profile');
  assertNotNull(platform);
  assertEqual(platform.name, 'Instagram');
});

test('getPlatformByDomain finds spotify', () => {
  const platform = getPlatformByDomain('open.spotify.com');
  assertNotNull(platform);
  assertEqual(platform.id, 'spotify');
});

test('matchUrl returns embed match for YouTube', () => {
  const match = matchUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');  // Must be 11 chars
  assertNotNull(match);
  assertEqual(match.type, 'embed');
  assertEqual(match.platform.id, 'youtube');
});

test('matchUrl returns social match for Instagram profile', () => {
  const match = matchUrl('https://instagram.com/natgeo');
  assertNotNull(match);
  assertEqual(match.type, 'social');
});

test('matchUrl returns null for product URL', () => {
  const match = matchUrl('https://amazon.com/dp/B123');
  assertEqual(match, null);
});

test('getPlatformStats returns correct counts', () => {
  const stats = getPlatformStats();
  assertEqual(stats.embedPlatforms, EMBED_PLATFORMS.length);
  assertEqual(stats.socialPlatforms, SOCIAL_PLATFORMS.length);
  assertEqual(stats.totalPlatforms, EMBED_PLATFORMS.length + SOCIAL_PLATFORMS.length);
});

// =============================================================================
// OEMBED SUPPORT TESTS
// =============================================================================

section('10. OEMBED SUPPORT');

test('hasOEmbedSupport returns true for YouTube', () => {
  assertEqual(hasOEmbedSupport('https://youtube.com/watch?v=dQw4w9WgXcQ'), true);  // Must be 11 chars
});

test('hasOEmbedSupport returns true for Spotify', () => {
  assertEqual(hasOEmbedSupport('https://open.spotify.com/track/abc123'), true);
});

test('hasOEmbedSupport returns true for Vimeo', () => {
  assertEqual(hasOEmbedSupport('https://vimeo.com/123456'), true);
});

test('hasOEmbedSupport returns false for Instagram (requires auth)', () => {
  assertEqual(hasOEmbedSupport('https://instagram.com/p/abc123'), false);
});

test('getOEmbedUrl generates correct YouTube URL', () => {
  const url = getOEmbedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ', { maxWidth: 800 });  // Must be 11 chars
  assertNotNull(url);
  assertIncludes(url, 'youtube.com/oembed');
  assertIncludes(url, 'maxwidth=800');
});

// =============================================================================
// SOFT 404 DETECTION TESTS
// =============================================================================

section('11. SOFT 404 DETECTION');

test('detects "out of stock" as soft 404', () => {
  const result = detectSoft404('<html>This item is currently out of stock</html>', 'https://example.com');
  assertEqual(result.isSoft404, true);
});

test('detects "sold out" as soft 404', () => {
  const result = detectSoft404('<html>Sorry, this product is sold out</html>', 'https://example.com');
  assertEqual(result.isSoft404, true);
});

test('detects "product not found" as soft 404', () => {
  const result = detectSoft404('<html>Product not found</html>', 'https://example.com');
  assertEqual(result.isSoft404, true);
});

test('detects "no longer available" as soft 404', () => {
  const result = detectSoft404('<html>This item is no longer available</html>', 'https://example.com');
  assertEqual(result.isSoft404, true);
});

test('detects "discontinued" as soft 404', () => {
  const result = detectSoft404('<html>This product has been discontinued</html>', 'https://example.com');
  assertEqual(result.isSoft404, true);
});

test('does NOT detect valid product page as soft 404', () => {
  const result = detectSoft404('<html>Add to Cart - $99.99 - In Stock - Free Shipping</html>', 'https://example.com');
  assertEqual(result.isSoft404, false);
});

// =============================================================================
// AVAILABILITY DETECTION TESTS
// =============================================================================

section('12. AVAILABILITY DETECTION');

test('detects "in stock" availability', () => {
  const result = detectAvailability('<html>In Stock - Ships Today</html>');
  assertEqual(result, 'in_stock');
});

test('detects "add to cart" as in stock', () => {
  const result = detectAvailability('<html><button>Add to Cart</button></html>');
  assertEqual(result, 'in_stock');
});

test('detects "out of stock" availability', () => {
  const result = detectAvailability('<html>Currently Out of Stock</html>');
  assertEqual(result, 'out_of_stock');
});

test('detects "sold out" as out of stock', () => {
  const result = detectAvailability('<html>Sold Out</html>');
  assertEqual(result, 'out_of_stock');
});

test('detects "pre-order" availability', () => {
  const result = detectAvailability('<html>Pre-order Now</html>');
  assertEqual(result, 'preorder');
});

test('detects "discontinued" availability', () => {
  const result = detectAvailability('<html>This product has been discontinued</html>');
  assertEqual(result, 'discontinued');
});

test('returns unknown for ambiguous content', () => {
  const result = detectAvailability('<html>Product details here</html>');
  assertEqual(result, 'unknown');
});

// =============================================================================
// BATCH CLASSIFICATION TESTS
// =============================================================================

section('13. BATCH CLASSIFICATION');

test('classifyUrls handles mixed URL types', () => {
  const result = classifyUrls([
    'https://youtube.com/watch?v=dQw4w9WgXcQ',  // Must be 11 chars
    'https://instagram.com/natgeo',
    'https://amazon.com/dp/B123',
    'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',  // Valid Spotify ID
    'https://twitter.com/elonmusk',
  ]);

  assertEqual(result.summary.total, 5);
  assertEqual(result.summary.embeds, 2); // YouTube, Spotify
  assertEqual(result.summary.social, 2); // Instagram, Twitter
  assertEqual(result.summary.products, 1); // Amazon
});

test('classifyUrls returns correct result types', () => {
  const result = classifyUrls([
    'https://youtube.com/watch?v=dQw4w9WgXcQ',  // Must be 11 chars
    'https://instagram.com/natgeo',
  ]);

  assertEqual(result.results[0].type, 'embed');
  assertEqual(result.results[1].type, 'social');
});

// =============================================================================
// URL VALIDATION TESTS
// =============================================================================

section('14. URL VALIDATION');

test('isValidUrl accepts valid URLs', () => {
  assertEqual(isValidUrl('https://example.com'), true);
  assertEqual(isValidUrl('http://example.com'), true);
  assertEqual(isValidUrl('example.com'), true);
});

test('isValidUrl accepts mailto links', () => {
  assertEqual(isValidUrl('mailto:hello@example.com'), true);
});

test('isValidUrl rejects invalid strings', () => {
  assertEqual(isValidUrl(''), false);
  assertEqual(isValidUrl('not a url'), false);
});

// =============================================================================
// SUMMARY
// =============================================================================

section('TEST SUMMARY');

console.log(`\nTotal: ${passCount + failCount} tests`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f}`));
}

console.log('\n' + '='.repeat(60));
if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED!');
} else {
  console.log(`⚠️  ${failCount} TEST(S) FAILED`);
  process.exit(1);
}
console.log('='.repeat(60) + '\n');
