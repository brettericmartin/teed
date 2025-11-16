#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSQL(name: string, sql: string) {
  console.log(`\n🔄 Running migration: ${name}`);
  console.log('─'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Migration failed: ${name}`);
      console.error('Error:', error);
      return false;
    }

    console.log(`✅ Migration completed: ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ Migration failed: ${name}`);
    console.error('Error:', err);
    return false;
  }
}

// Migration 1: Create links table
const migration1 = `
-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id uuid REFERENCES bags(id) ON DELETE CASCADE,
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text NOT NULL,
  label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT links_target_check CHECK (
    (bag_id IS NOT NULL AND bag_item_id IS NULL) OR
    (bag_id IS NULL AND bag_item_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_bag_id ON links(bag_id) WHERE bag_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_bag_item_id ON links(bag_item_id) WHERE bag_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_kind ON links(kind);

-- Enable RLS
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public bags links are viewable by everyone" ON links;
DROP POLICY IF EXISTS "Users can view their own bag links" ON links;
DROP POLICY IF EXISTS "Users can manage links for their bags" ON links;

-- RLS Policy: Public bags links are viewable by everyone
CREATE POLICY "Public bags links are viewable by everyone"
  ON links FOR SELECT
  USING (
    CASE
      WHEN bag_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM bags WHERE id = links.bag_id AND is_public = true)
      WHEN bag_item_id IS NOT NULL THEN
        EXISTS (
          SELECT 1 FROM bag_items bi
          JOIN bags b ON bi.bag_id = b.id
          WHERE bi.id = links.bag_item_id AND b.is_public = true
        )
    END
  );

-- RLS Policy: Users can view their own bag links
CREATE POLICY "Users can view their own bag links"
  ON links FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );

-- RLS Policy: Users can manage links for their bags
CREATE POLICY "Users can manage links for their bags"
  ON links FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );
`;

// Migration 2: Add code field to bags
const migration2 = `
-- Add code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'code') THEN
    ALTER TABLE bags ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_bags_code ON bags(code) WHERE code IS NOT NULL;

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_bag_code(title_text text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter int := 0;
BEGIN
  -- Convert to lowercase, replace non-alphanumeric with hyphens
  base_code := lower(regexp_replace(title_text, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Trim leading/trailing hyphens
  base_code := trim(both '-' from base_code);

  -- Limit length
  base_code := substring(base_code from 1 for 50);

  final_code := base_code;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM bags WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;

  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate code on insert
CREATE OR REPLACE FUNCTION auto_generate_bag_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_bag_code(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_bag_code ON bags;
CREATE TRIGGER trigger_auto_generate_bag_code
  BEFORE INSERT ON bags
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_bag_code();

-- Backfill existing bags with codes
UPDATE bags
SET code = generate_bag_code(title)
WHERE code IS NULL;
`;

// Migration 3: Add usage tracking to share_links
const migration3 = `
-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'max_uses') THEN
    ALTER TABLE share_links ADD COLUMN max_uses integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'uses') THEN
    ALTER TABLE share_links ADD COLUMN uses integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'share_links' AND column_name = 'expires_at') THEN
    ALTER TABLE share_links ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_uses_check') THEN
    ALTER TABLE share_links ADD CONSTRAINT share_links_uses_check CHECK (uses >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'share_links_max_uses_check') THEN
    ALTER TABLE share_links ADD CONSTRAINT share_links_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
  END IF;
END $$;

-- Function to validate share link
CREATE OR REPLACE FUNCTION is_share_link_valid(link_id uuid)
RETURNS boolean AS $$
DECLARE
  link_record share_links;
BEGIN
  SELECT * INTO link_record FROM share_links WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check expiration
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < now() THEN
    RETURN false;
  END IF;

  -- Check usage limit
  IF link_record.max_uses IS NOT NULL AND link_record.uses >= link_record.max_uses THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_share_link_uses(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE share_links
  SET uses = uses + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
`;

// Migration 4: Add updated_at to bags
const migration4 = `
-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bags' AND column_name = 'updated_at') THEN
    ALTER TABLE bags ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_bags_updated_at ON bags;
CREATE TRIGGER update_bags_updated_at
  BEFORE UPDATE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing bags
UPDATE bags
SET updated_at = created_at
WHERE updated_at IS NULL;
`;

async function main() {
  console.log('🚀 Starting Teed Schema Migrations');
  console.log('═'.repeat(60));

  const migrations = [
    { name: 'Create links table', sql: migration1 },
    { name: 'Add code field to bags', sql: migration2 },
    { name: 'Add usage tracking to share_links', sql: migration3 },
    { name: 'Add updated_at to bags', sql: migration4 },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runSQL(migration.name, migration.sql);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Migration Summary');
  console.log('═'.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total: ${migrations.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

main();
