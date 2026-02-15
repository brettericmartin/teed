#!/usr/bin/env npx tsx
export {};
/**
 * Pre-deploy smoke test for Teed
 *
 * Fast, no-auth check that critical pages load and APIs respond correctly.
 * Run with: npm run smoke
 *
 * Requires: Dev server running on localhost:3000
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function pass(name: string, details?: string) {
  results.push({ name, passed: true, details });
  console.log(`  \x1b[32m✓\x1b[0m ${name}${details ? ` - ${details}` : ''}`);
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error });
  console.log(`  \x1b[31m✗\x1b[0m ${name} - ${error}`);
}

async function testEndpoint(
  name: string,
  url: string,
  options: {
    expectedStatus?: number;
    validateJson?: (data: any) => string | null;
    method?: string;
    body?: any;
  } = {}
): Promise<boolean> {
  const { expectedStatus = 200, validateJson, method = 'GET', body } = options;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, fetchOptions);

    if (response.status !== expectedStatus) {
      fail(name, `Expected ${expectedStatus}, got ${response.status}`);
      return false;
    }

    if (validateJson) {
      const data = await response.json();
      const error = validateJson(data);
      if (error) {
        fail(name, error);
        return false;
      }
    }

    pass(name);
    return true;
  } catch (err) {
    fail(name, `Request failed: ${err}`);
    return false;
  }
}

// ============================================================================
// Test Suites
// ============================================================================

async function testPageLoads() {
  console.log('\n\x1b[1mPage Loads\x1b[0m\n');

  const pages = [
    ['Homepage', '/'],
    ['For Golfers', '/for/golfers'],
    ['vs Linktree', '/vs/linktree'],
    ['Join', '/join'],
    ['Manifesto', '/manifesto'],
    ['Apply', '/apply'],
    ['Login', '/login'],
    ['Signup', '/signup'],
  ];

  for (const [name, path] of pages) {
    await testEndpoint(`${name} loads`, path);
  }
}

async function testSessionAPIShape() {
  console.log('\n\x1b[1mSession API Shape\x1b[0m\n');

  await testEndpoint('Session API returns expected keys', '/api/auth/session', {
    validateJson: (data) => {
      if (!('user' in data)) return 'Missing "user" key';
      if (!('profile' in data)) return 'Missing "profile" key';
      return null;
    },
  });
}

async function testAuthProtection() {
  console.log('\n\x1b[1mAuth Protection\x1b[0m\n');

  await testEndpoint('POST /api/bags requires auth', '/api/bags', {
    method: 'POST',
    body: { title: 'Test' },
    expectedStatus: 401,
  });

  await testEndpoint('GET /api/user/bags requires auth', '/api/user/bags', {
    expectedStatus: 401,
  });
}

async function test404Handling() {
  console.log('\n\x1b[1m404 Handling\x1b[0m\n');

  await testEndpoint('Non-existent user returns 404', '/u/nonexistent-user-xyz123', {
    expectedStatus: 404,
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m          TEED PRE-DEPLOY SMOKE TEST\x1b[0m');
  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Time:   ${new Date().toISOString()}\n`);

  // Check server is running
  try {
    const healthCheck = await fetch(BASE_URL);
    if (!healthCheck.ok) {
      console.error('\x1b[31mServer not responding correctly\x1b[0m');
      process.exit(1);
    }
  } catch {
    console.error('\x1b[31mCannot connect to server. Is it running?\x1b[0m');
    process.exit(1);
  }

  pass('Server is running');

  await testPageLoads();
  await testSessionAPIShape();
  await testAuthProtection();
  await test404Handling();

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('\n\x1b[1m══════════════════════════════════════════\x1b[0m');
  console.log(
    `  ${passed}/${total} passed` +
      (failed > 0 ? `  \x1b[31m${failed} failed\x1b[0m` : '  \x1b[32mall good\x1b[0m')
  );
  console.log('\x1b[1m══════════════════════════════════════════\x1b[0m\n');

  if (failed > 0) {
    console.log('Failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  \x1b[31m✗\x1b[0m ${r.name}: ${r.error}`));
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
