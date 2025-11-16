# Testing Quick Reference

## 🚀 Common Commands

```bash
# Run all tests
npm test

# Interactive UI mode (best for development)
npm run test:ui

# See browser while testing
npm run test:headed

# Debug specific test
npm run test:debug

# Generate test code
npm run test:codegen

# View test report
npm run test:report
```

## 📁 Test Files

- `tests/e2e/01-auth.spec.ts` - Login/logout
- `tests/e2e/02-bag-management.spec.ts` - Bags & items
- `tests/e2e/03-link-management.spec.ts` - Links
- `tests/e2e/04-public-sharing.spec.ts` - Public view & QR

## 🛠️ Writing Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Teed')).toBeVisible();
});
```

### With Login

```typescript
import { login } from './utils/auth';

test('authenticated test', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  // ... test logic
});
```

### With Test Data

```typescript
import { createBag, deleteBag } from './utils/testData';

test('create bag', async ({ page }) => {
  await login(page);
  const { code } = await createBag(page, {
    title: 'Test Bag',
    isPublic: true,
  });

  // ... test logic

  await deleteBag(page, code); // cleanup
});
```

## 🔍 Debugging

| Method | Command | Use Case |
|--------|---------|----------|
| UI Mode | `npm run test:ui` | Interactive debugging |
| Debug Mode | `npm run test:debug` | Step-by-step debugging |
| Inspector | `PWDEBUG=1 npm test` | Element inspection |
| Headed | `npm run test:headed` | Watch browser |

## 📊 Best Practices

✅ **DO**
- Use descriptive test names
- Clean up test data in `afterEach`
- Use auto-waiting (no `waitForTimeout`)
- Test user-facing behavior
- Run tests before committing

❌ **DON'T**
- Depend on other tests
- Use manual waits
- Test implementation details
- Leave test data in database
- Commit failing tests

## 🎯 Selectors Priority

1. Text: `text=Sign In`
2. Test ID: `[data-testid="submit"]`
3. Semantic: `button:has-text("Submit")`
4. CSS: `.submit-button` (last resort)

## 🌐 Cross-Browser

```bash
# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Mobile
npm run test:mobile
```

## 📸 Screenshots

```typescript
// Visual regression
await expect(page).toHaveScreenshot('page.png');

// Update baseline
npm test -- --update-snapshots
```

## 🔥 Common Issues

### Test Hangs
- Wrong selector
- Element never appears
- Use: `npm run test:ui` to inspect

### Flaky Tests
- Race conditions
- Use proper waits: `await expect(locator).toBeVisible()`

### Database State
- Not cleaning up
- Add cleanup in `afterEach`

## 📚 Resources

- Full docs: `TESTING.md`
- Playwright docs: https://playwright.dev
- Config: `playwright.config.ts`

---

**TIP**: Start with `npm run test:ui` - it's the fastest way to debug!
