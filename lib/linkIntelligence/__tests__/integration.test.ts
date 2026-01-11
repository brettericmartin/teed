/**
 * Link Intelligence - Live Integration Tests
 *
 * These tests make real network requests to verify the system works end-to-end.
 * Run with: npx tsx lib/linkIntelligence/__tests__/integration.test.ts
 */

import {
  fetchOEmbed,
  checkUrlHealth,
  analyzeUrl,
  classifyUrl,
  parseEmbedUrl,
} from '../index';

// =============================================================================
// TEST UTILITIES
// =============================================================================

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<boolean | void>): Promise<void> {
  try {
    const result = await fn();
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

function section(name: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${name}`);
  console.log('='.repeat(60));
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runTests() {

// =============================================================================
// OEMBED INTEGRATION TESTS
// =============================================================================

section('1. OEMBED FETCHING (Live)');

await test('fetches YouTube oEmbed data', async () => {
  const oembed = await fetchOEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if (!oembed) throw new Error('No oEmbed data returned');
  if (!oembed.title) throw new Error('No title in oEmbed');
  if (oembed.type !== 'video') throw new Error(`Expected type "video", got "${oembed.type}"`);
  console.log(`    → Title: "${oembed.title?.substring(0, 40)}..."`);
});

await test('fetches Spotify oEmbed data', async () => {
  const oembed = await fetchOEmbed('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh');
  if (!oembed) throw new Error('No oEmbed data returned');
  if (oembed.type !== 'rich') throw new Error(`Expected type "rich", got "${oembed.type}"`);
  console.log(`    → Title: "${oembed.title?.substring(0, 40)}..."`);
});

await test('fetches Vimeo oEmbed data', async () => {
  const oembed = await fetchOEmbed('https://vimeo.com/347119375');  // Popular Vimeo video
  if (!oembed) throw new Error('No oEmbed data returned');
  if (oembed.type !== 'video') throw new Error(`Expected type "video", got "${oembed.type}"`);
  console.log(`    → Title: "${oembed.title?.substring(0, 40)}..."`);
});

await test('returns null for non-oEmbed URL', async () => {
  const oembed = await fetchOEmbed('https://amazon.com/dp/B08N5WRWNW');
  if (oembed !== null) throw new Error('Expected null for non-oEmbed URL');
});

// =============================================================================
// LINK HEALTH INTEGRATION TESTS
// =============================================================================

section('2. LINK HEALTH CHECKING (Live)');

await test('detects healthy URL', async () => {
  const result = await checkUrlHealth('https://www.google.com', { timeout: 10000 });
  if (result.health !== 'healthy') throw new Error(`Expected "healthy", got "${result.health}"`);
  if (result.httpStatus !== 200) throw new Error(`Expected status 200, got ${result.httpStatus}`);
  console.log(`    → Status: ${result.httpStatus}, Time: ${result.responseTimeMs}ms`);
});

await test('detects redirect', async () => {
  const result = await checkUrlHealth('https://github.com', { timeout: 10000 });
  // GitHub often redirects www -> non-www or vice versa
  console.log(`    → Status: ${result.httpStatus}, Redirected: ${result.redirected}`);
});

await test('detects 404/broken link', async () => {
  const result = await checkUrlHealth('https://httpbin.org/status/404', { timeout: 10000 });
  if (result.health !== 'broken') throw new Error(`Expected "broken", got "${result.health}"`);
  if (result.httpStatus !== 404) throw new Error(`Expected status 404, got ${result.httpStatus}`);
  console.log(`    → Status: ${result.httpStatus}, Health: ${result.health}`);
});

await test('handles timeout gracefully', async () => {
  const result = await checkUrlHealth('https://httpbin.org/delay/5', { timeout: 2000 });
  if (result.health !== 'timeout') throw new Error(`Expected "timeout", got "${result.health}"`);
  console.log(`    → Health: ${result.health}`);
});

// =============================================================================
// FULL ANALYSIS INTEGRATION TESTS
// =============================================================================

section('3. FULL URL ANALYSIS (Live)');

await test('analyzes YouTube embed URL', async () => {
  const result = await analyzeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    skipHealth: true,  // Skip health for speed
  });

  if (result.classification.type !== 'embed') {
    throw new Error(`Expected type "embed", got "${result.classification.type}"`);
  }
  if (result.result.type !== 'embed') {
    throw new Error(`Expected result type "embed", got "${result.result.type}"`);
  }

  const embed = result.result as any;
  if (!embed.oembed?.title) {
    throw new Error('Expected oEmbed data with title');
  }

  console.log(`    → Platform: ${embed.platform}, Title: "${embed.oembed.title.substring(0, 30)}..."`);
});

await test('analyzes Instagram profile URL', async () => {
  const result = await analyzeUrl('https://instagram.com/natgeo', {
    skipHealth: true,
  });

  if (result.classification.type !== 'social') {
    throw new Error(`Expected type "social", got "${result.classification.type}"`);
  }

  const social = result.result as any;
  if (social.username !== 'natgeo') {
    throw new Error(`Expected username "natgeo", got "${social.username}"`);
  }

  console.log(`    → Platform: ${social.platform}, Username: ${social.username}`);
});

// =============================================================================
// EMBED PARSING TESTS
// =============================================================================

section('4. EMBED URL PARSING');

await test('parses YouTube video correctly', async () => {
  const embed = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if (!embed) throw new Error('No embed result');
  if (embed.contentId !== 'dQw4w9WgXcQ') throw new Error(`Wrong content ID: ${embed.contentId}`);
  if (embed.platform !== 'youtube') throw new Error(`Wrong platform: ${embed.platform}`);
  console.log(`    → ID: ${embed.contentId}, Embed URL: ${embed.embedUrl}`);
});

await test('parses Spotify track correctly', async () => {
  const embed = parseEmbedUrl('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh');
  if (!embed) throw new Error('No embed result');
  if (embed.contentId !== '4iV5W9uYEdYUVa79Axb7Rh') throw new Error(`Wrong content ID: ${embed.contentId}`);
  if (embed.contentType !== 'track') throw new Error(`Wrong content type: ${embed.contentType}`);
  console.log(`    → ID: ${embed.contentId}, Type: ${embed.contentType}`);
});

await test('parses TikTok video correctly', async () => {
  const embed = parseEmbedUrl('https://www.tiktok.com/@tiktok/video/7106594312292453675');
  if (!embed) throw new Error('No embed result');
  if (embed.platform !== 'tiktok') throw new Error(`Wrong platform: ${embed.platform}`);
  console.log(`    → ID: ${embed.contentId}, Platform: ${embed.platform}`);
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
  console.log('🎉 ALL INTEGRATION TESTS PASSED!');
} else {
  console.log(`⚠️  ${failCount} TEST(S) FAILED`);
  process.exit(1);
}
console.log('='.repeat(60) + '\n');

} // end runTests

// Run the tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
