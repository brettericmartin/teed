#!/usr/bin/env node
/**
 * Test Discovery System - Dry Run
 * Verifies the entire discovery flow without creating bags
 *
 * Run: node scripts/test-discovery-dry-run.mjs
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🧪 Discovery System - Dry Run Test\n');
console.log('═'.repeat(60));
console.log(`Base URL: ${baseUrl}\n`);

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'YOUTUBE_API_KEY',
];

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingEnvVars.forEach(v => console.log(`   - ${v}`));
  process.exit(1);
}

console.log('✅ All required environment variables present\n');

async function testEndpoint(name, url, options = {}) {
  console.log(`Testing ${name}...`);
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`  ✅ ${response.status} OK`);
      return { success: true, data };
    } else {
      console.log(`  ❌ ${response.status} - ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`  ❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];

  // Test 1: Check API availability
  console.log('\n📡 Testing API Endpoints:\n');

  // Test GET /api/discovery/run (should return usage info)
  const runInfo = await testEndpoint(
    'GET /api/discovery/run',
    `${baseUrl}/api/discovery/run`
  );
  results.push({ name: 'API Info', ...runInfo });

  // Test GET /api/discovery/results/all
  const resultsAll = await testEndpoint(
    'GET /api/discovery/results/all',
    `${baseUrl}/api/discovery/results/all?limit=5&includeGaps=true`
  );
  results.push({ name: 'Results All', ...resultsAll });

  if (resultsAll.success) {
    console.log(`     Found ${resultsAll.data.runs?.length || 0} previous runs`);
  }

  // Test GET /api/discovery/results/golf
  const resultsGolf = await testEndpoint(
    'GET /api/discovery/results/golf',
    `${baseUrl}/api/discovery/results/golf?limit=5&includeGaps=true`
  );
  results.push({ name: 'Results Golf', ...resultsGolf });

  // Test GET /api/discovery/gaps
  const gaps = await testEndpoint(
    'GET /api/discovery/gaps',
    `${baseUrl}/api/discovery/gaps?category=golf&limit=10`
  );
  results.push({ name: 'Gaps API', ...gaps });

  // Test 2: Dry Run Discovery (minimal config)
  console.log('\n🏃 Running Dry Discovery (Golf, 2 sources max):\n');

  const dryRun = await testEndpoint(
    'POST /api/discovery/run (dry run)',
    `${baseUrl}/api/discovery/run`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'golf',
        config: {
          maxSources: 2,
          maxProductsPerSource: 5,
          dryRun: true,
          skipExisting: false,
          youtubeEnabled: true,
          tiktokEnabled: false,
          rssEnabled: false,
        },
      }),
    }
  );
  results.push({ name: 'Dry Run', ...dryRun });

  if (dryRun.success) {
    console.log(`     Run ID: ${dryRun.data.runId}`);
    console.log(`     Sources found: ${dryRun.data.sourcesFound}`);
    console.log(`     Products found: ${dryRun.data.productsFound}`);
    console.log(`     Status: ${dryRun.data.status}`);

    // Test 3: Check run status
    if (dryRun.data.runId) {
      const status = await testEndpoint(
        `GET /api/discovery/status/${dryRun.data.runId}`,
        `${baseUrl}/api/discovery/status/${dryRun.data.runId}`
      );
      results.push({ name: 'Run Status', ...status });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Summary:\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}`);
  });

  console.log(`\n  Passed: ${passed}/${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Discovery system is working.\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
