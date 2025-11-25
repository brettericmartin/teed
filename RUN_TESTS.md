# How to Run the Comprehensive Test Suite

## Prerequisites

1. **Clean Environment**
```bash
# Kill all Node processes
pkill -9 node

# Clear build cache
rm -rf .next

# Clear port locks
lsof -ti:3000 | xargs kill -9 2>/dev/null
```

2. **Start Dev Server**
```bash
npm run dev
```

Wait for server to show "Ready in XXXms"

3. **Verify Server**
```bash
curl http://localhost:3000
```

Should return HTML, not "Internal Server Error"

## Run Tests

### Option 1: Using Custom Config (Recommended)
```bash
npx playwright test tests/full-system-test.spec.ts \
  --config=playwright-full-test.config.ts \
  --reporter=line
```

### Option 2: Using Default Config
```bash
npx playwright test tests/full-system-test.spec.ts \
  --project=chromium \
  --reporter=line
```

### Option 3: Watch Mode (see browser)
```bash
npx playwright test tests/full-system-test.spec.ts \
  --config=playwright-full-test.config.ts \
  --headed
```

## What Gets Tested

### 26 Comprehensive Tests Across 3 User Types:

**OWNER (6 tests)**
- ✅ Authentication
- ✅ View/edit public bags
- ✅ View/edit private bags
- ✅ Delete items
- ✅ Toggle privacy
- ✅ Dashboard access

**AUTHENTICATED NON-OWNER (7 tests)**
- ✅ Authentication
- ✅ RLS: Can view public bags
- ✅ RLS: Cannot view private bags
- ✅ RLS: Cannot edit any bags
- ✅ Discovery page access
- ✅ Category filtering
- ✅ Tag filtering

**ANONYMOUS (7 tests)**
- ✅ RLS: Can view public bags
- ✅ RLS: Cannot view private bags
- ✅ RLS: Redirected from edit pages
- ✅ Discovery page access
- ✅ Category filtering
- ✅ Search functionality
- ✅ Redirected from dashboard

**SUPABASE MCP (3 tests)**
- ✅ Database connection
- ✅ RLS enforcement
- ✅ JSONB tag queries

**SETUP & CLEANUP (3 tests)**
- ✅ Create test data
- ✅ Cleanup test data

## Test Results

Results are saved to:
- `playwright-full-test-report/` - HTML report
- `test-results/` - Screenshots & videos
- Console output - Real-time progress

## View HTML Report

```bash
npx playwright show-report playwright-full-test-report
```

## Troubleshooting

### Server Won't Start
```bash
# Find what's using port 3000
lsof -i:3000

# Kill it
lsof -ti:3000 | xargs kill -9

# Remove lock files
rm -rf .next/dev/lock

# Restart
npm run dev
```

### Tests Timeout
- Increase timeout in `playwright-full-test.config.ts`:
```typescript
timeout: 120 * 1000  // 2 minutes per test
```

### Tests Fail on Signup
- Check if test users already exist
- Modify email addresses in test file if needed

## Manual Testing

Instead of automated tests, you can manually test:

1. **Create a Bag**
   - Go to `/dashboard`
   - Click "Create New Bag"
   - Add title, description

2. **Add Category & Tags**
   - In bag editor, select category from dropdown
   - Type tags and press Enter
   - Should auto-save

3. **Make Public**
   - Toggle privacy switch to Public
   - Should show "🌐 Public"

4. **Test Discovery**
   - Go to `/discover`
   - Click category filters
   - Click tag badges
   - Use search bar

5. **Test RLS**
   - Open private window (anonymous)
   - Try to access private bag URL
   - Should see 404 or "not found"

## Expected Results

All 26 tests should pass:
```
✓ [1/26] Setup: Create Owner User and Test Bags
✓ [2/26] Setup: Create Other User
✓ [3/26] Owner: Can sign in
...
✓ [26/26] Cleanup: Delete test data

26 passed (2m)
```

## Success Indicators

- ✅ No routing conflicts
- ✅ RLS properly blocks unauthorized access
- ✅ Tags appear in discovery filters
- ✅ Category filtering works
- ✅ Search returns correct results
- ✅ Supabase MCP connection stable

---

**Created:** November 24, 2025
**Test File:** `tests/full-system-test.spec.ts`
**Coverage:** Complete RLS validation + Feature testing
