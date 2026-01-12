#!/usr/bin/env node
/**
 * Test YouTube API directly
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  console.error('❌ Missing YOUTUBE_API_KEY');
  process.exit(1);
}

console.log('🎬 Testing YouTube API\n');
console.log('API Key:', apiKey.slice(0, 10) + '...' + apiKey.slice(-5));

async function searchYouTube(query) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: '5',
    order: 'viewCount',
    key: apiKey,
  });

  console.log(`\nSearching: "${query}"`);

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API Error:', data.error?.message || response.status);
      console.log('   Error details:', JSON.stringify(data.error, null, 2));
      return null;
    }

    console.log(`✅ Found ${data.items?.length || 0} videos`);

    if (data.items && data.items.length > 0) {
      data.items.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.snippet.title}`);
        console.log(`      Channel: ${item.snippet.channelTitle}`);
        console.log(`      ID: ${item.id.videoId}`);
      });
    }

    return data;
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function getVideoDetails(videoIds) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
    key: apiKey,
  });

  console.log(`\nGetting details for ${videoIds.length} videos...`);

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API Error:', data.error?.message || response.status);
      return null;
    }

    console.log(`✅ Got details for ${data.items?.length || 0} videos`);

    if (data.items && data.items.length > 0) {
      data.items.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.snippet.title}`);
        console.log(`      Views: ${item.statistics.viewCount}`);
        console.log(`      Duration: ${item.contentDetails.duration}`);
      });
    }

    return data;
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return null;
  }
}

async function runTests() {
  // Test search
  const searchResult = await searchYouTube("what's in my golf bag 2025");

  if (searchResult && searchResult.items && searchResult.items.length > 0) {
    // Test video details
    const videoIds = searchResult.items.map(item => item.id.videoId);
    await getVideoDetails(videoIds);
  }

  // Test another query
  await searchYouTube('golf club review 2025');

  console.log('\n' + '═'.repeat(60));
  console.log('YouTube API test complete\n');
}

runTests();
