# Teed Database Migrations

This directory contains SQL migrations to add critical features to the Teed database schema.

## Quick Start (Easiest Method)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/jvljmfdroozexzodqupg/sql

2. **Copy and paste `ALL_MIGRATIONS.sql`:**
   - Open `ALL_MIGRATIONS.sql` in this directory
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" button

3. **Verify success:**
   - You should see: "All migrations completed successfully! ✅"

## What These Migrations Do

### Migration 001: Create `links` Table (CRITICAL)
- **Priority:** CRITICAL MVP Feature
- **Impact:** Enables attaching purchase links, reviews, videos to items/bags
- **Why:** Core value prop - users need to share gear WITH links
- Creates table, indexes, and RLS policies

### Migration 002: Add `code` Field to `bags` (HIGH)
- **Priority:** HIGH
- **Impact:** Enables simple URLs like `/c/camping-kit`
- **Why:** Better UX and AI integration
- Adds code field with auto-generation function and trigger
- Backfills existing bags with codes based on titles

### Migration 003: Add Usage Tracking to `share_links` (MEDIUM)
- **Priority:** MEDIUM
- **Impact:** Enables limited-use and expiring share links
- **Why:** Better control over sharing
- Adds `max_uses`, `uses`, and `expires_at` fields
- Includes validation functions

### Migration 004: Add `updated_at` to `bags` (LOW)
- **Priority:** LOW
- **Impact:** Track when bags were last modified
- **Why:** Nice to have for sorting and display
- Adds updated_at field with auto-update trigger
- Backfills existing bags

## Individual Migration Files

If you prefer to run migrations one at a time:

```sql
001_create_links_table.sql
002_add_code_to_bags.sql
003_add_usage_tracking_to_share_links.sql
004_add_updated_at_to_bags.sql
```

Run them in order (001, 002, 003, 004) in the Supabase SQL Editor.

## Safety

All migrations are:
- ✅ Idempotent (safe to run multiple times)
- ✅ Non-destructive (won't delete existing data)
- ✅ Use `IF NOT EXISTS` checks
- ✅ Backfill existing data where needed

## After Running Migrations

Once migrations are complete, you'll have:

1. **New `links` table** - Attach URLs to items and bags
2. **Bag codes** - Access bags via `/c/your-bag-code`
3. **Share link tracking** - Limit uses and set expiration
4. **Updated timestamps** - Track bag modifications

## Verification

After running, verify the migrations worked:

```sql
-- Check if links table exists
SELECT COUNT(*) FROM links;

-- Check if bags have codes
SELECT id, title, code FROM bags LIMIT 5;

-- Check if share_links has new fields
SELECT id, slug, uses, max_uses, expires_at FROM share_links LIMIT 5;

-- Check if bags has updated_at
SELECT id, title, created_at, updated_at FROM bags LIMIT 5;
```

## Troubleshooting

If you encounter errors:

1. **Permission errors:** Make sure you're logged in as the project owner
2. **Already exists errors:** Safe to ignore - means that part was already migrated
3. **Foreign key errors:** Run migrations in order (001, 002, 003, 004)

## Need Help?

- Supabase SQL Editor: https://supabase.com/dashboard/project/jvljmfdroozexzodqupg/sql
- Supabase Docs: https://supabase.com/docs/guides/database
