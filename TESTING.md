# Teed Testing Framework

Comprehensive autonomous testing framework using Playwright for end-to-end testing.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Commands](#test-commands)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Playwright** for autonomous end-to-end testing with the following features:

- ✅ **Cross-browser testing** (Chromium, Firefox, WebKit/Safari)
- ✅ **Mobile responsive testing** (iPhone, Pixel)
- ✅ **Headless mode** for CI/CD
- ✅ **Parallel execution** for speed
- ✅ **Auto-waiting** eliminates flaky tests
- ✅ **Screenshot/video capture** on failures
- ✅ **Visual regression testing** ready
- ✅ **API testing** capabilities

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Run Tests

```bash
# Run all tests (headless)
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests in headless mode |
| `npm run test:headed` | Run tests with visible browser |
| `npm run test:ui` | Open Playwright UI mode (interactive) |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:chromium` | Run tests in Chromium only |
| `npm run test:firefox` | Run tests in Firefox only |
| `npm run test:webkit` | Run tests in WebKit/Safari only |
| `npm run test:mobile` | Run mobile responsive tests |
| `npm run test:report` | View HTML test report |
| `npm run test:codegen` | Generate test code (record actions) |

## Test Structure

```
tests/
├── e2e/
│   ├── 01-auth.spec.ts              # Authentication tests
│   ├── 02-bag-management.spec.ts    # Bag CRUD tests
│   ├── 03-link-management.spec.ts   # Link management tests
│   ├── 04-public-sharing.spec.ts    # Public sharing & QR codes
│   ├── utils/
│   │   ├── auth.ts                  # Authentication utilities
│   │   ├── testData.ts              # Test data generators
│   │   └── apiClient.ts             # API testing client
│   └── fixtures/
│       └── (shared test fixtures)
├── playwright.config.ts              # Playwright configuration
└── test-results/                     # Test results & artifacts
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await expect(page.locator('text=Expected Text')).toBeVisible();
  });
});
```

### Using Test Utilities

```typescript
import { login, TEST_USER } from './utils/auth';
import { createBag, addItem, deleteBag } from './utils/testData';

test('should create bag with items', async ({ page }) => {
  await login(page);

  const { code } = await createBag(page, {
    title: 'My Test Bag',
    isPublic: true,
  });

  await addItem(page, code, {
    custom_name: 'Test Item',
    quantity: 1,
  });

  // Cleanup
  await deleteBag(page, code);
});
```

### API Testing

```typescript
import { test, expect } from '@playwright/test';
import { createAPIClient } from './utils/apiClient';

test('should create bag via API', async ({ request }) => {
  const api = createAPIClient(request, 'your-auth-token');

  const bag = await api.createBag({
    title: 'API Test Bag',
    is_public: true,
  });

  expect(bag.code).toBeTruthy();

  // Cleanup
  await api.cleanup(bag.code);
});
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup fresh state
  await page.context().clearCookies();
  await login(page);
});

test.afterEach(async ({ page }) => {
  // Cleanup test data
  await cleanupTestBags(page);
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
test('should display error when submitting empty form', async ({ page }) => {
  // ...
});

// ❌ Bad
test('form test', async ({ page }) => {
  // ...
});
```

### 3. Wait for Elements Properly

```typescript
// ✅ Good - Playwright auto-waits
await page.click('button:has-text("Submit")');
await expect(page.locator('text=Success')).toBeVisible();

// ❌ Bad - Manual waits
await page.waitForTimeout(5000);
```

### 4. Use Selectors Wisely

```typescript
// ✅ Good - User-facing selectors
await page.click('text=Sign In');
await page.fill('input[type="email"]', 'user@example.com');

// ⚠️ Okay - Test IDs
await page.click('[data-testid="submit-button"]');

// ❌ Bad - Implementation details
await page.click('.btn.btn-primary.mt-4');
```

### 5. Clean Up Test Data

Always clean up test data to avoid pollution:

```typescript
test('should create and delete bag', async ({ page }) => {
  const { code } = await createBag(page, randomBagData());

  try {
    // Test logic here
  } finally {
    // Always cleanup, even if test fails
    await deleteBag(page, code);
  }
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main`, `master`, or `develop`
- Pull requests to these branches

Matrix strategy tests across:
- Chromium, Firefox, WebKit
- Mobile (Chrome, Safari)

### Environment Variables

Set these secrets in GitHub repository settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
```

### Local CI Simulation

```bash
# Run tests as they would in CI
CI=true npm test
```

## Visual Regression Testing

### Take Screenshots

```typescript
test('should match visual snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

### Update Snapshots

```bash
npm test -- --update-snapshots
```

## Debugging Tests

### Method 1: Playwright UI Mode (Recommended)

```bash
npm run test:ui
```

Features:
- Time travel through test execution
- Pick selectors visually
- Edit locators
- See detailed logs

### Method 2: Debug Mode

```bash
npm run test:debug
```

### Method 3: Headed Mode

```bash
npm run test:headed
```

### Method 4: VS Code Debugging

Install Playwright Test VS Code extension for:
- Run tests from editor
- Set breakpoints
- Step through tests

### View Test Reports

```bash
npm run test:report
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

- **Issue**: Different environment
- **Solution**: Run `CI=true npm test`

### Flaky Tests

- **Issue**: Race conditions, timing issues
- **Solution**: Use Playwright's auto-waiting, avoid `waitForTimeout()`

```typescript
// ❌ Flaky
await page.click('button');
await page.waitForTimeout(1000);

// ✅ Stable
await page.click('button');
await expect(page.locator('text=Success')).toBeVisible();
```

### Tests Hang or Timeout

- **Issue**: Element never appears, wrong selector
- **Solution**: Use Playwright Inspector

```bash
PWDEBUG=1 npm test
```

### Parallel Execution Issues

- **Issue**: Tests interfere with each other
- **Solution**: Ensure test isolation

```typescript
test.describe.configure({ mode: 'serial' }); // Run tests sequentially
```

### Browser Not Found

```bash
npx playwright install chromium firefox webkit
```

## Performance Tips

### 1. Run Tests in Parallel

Already configured in `playwright.config.ts`:

```typescript
fullyParallel: true,
workers: process.env.CI ? 1 : undefined,
```

### 2. Use API for Setup

```typescript
// ✅ Fast - Use API
const api = createAPIClient(request, token);
const { bag } = await api.createCompleteBag({
  title: 'Test',
  itemCount: 5,
});

// ❌ Slow - Use UI
await createBag(page, { title: 'Test' });
for (let i = 0; i < 5; i++) {
  await addItem(page, code, itemData);
}
```

### 3. Reuse Authentication

```typescript
// Save auth state
const authFile = 'playwright/.auth/user.json';
await page.context().storageState({ path: authFile });

// Reuse in config
use: {
  storageState: authFile,
}
```

## Test Coverage

Current test suites cover:

- ✅ Authentication (login, logout, session management)
- ✅ Bag CRUD operations
- ✅ Item management
- ✅ Link management (add, edit, delete)
- ✅ Public sharing
- ✅ QR code generation
- ✅ Privacy controls
- ✅ Responsive design (mobile/desktop)

## Writing New Tests

1. **Identify the feature** to test
2. **Create test file** in `tests/e2e/`
3. **Use utilities** from `tests/e2e/utils/`
4. **Follow naming convention**: `##-feature-name.spec.ts`
5. **Add cleanup** in `afterEach`
6. **Run tests** locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Next.js Testing](https://nextjs.org/docs/app/guides/testing/playwright)

---

**Last Updated**: 2025
**Framework**: Playwright 1.56+
**Maintained By**: Claude (Autonomous Testing Framework)
