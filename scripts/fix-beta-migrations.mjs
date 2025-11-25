#!/usr/bin/env node
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  await client.connect();
  console.log('✅ Connected\n');

  // 1. Fix user_activity index
  console.log('📄 Fixing user_activity retention index...');
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_retention
      ON user_activity(user_id, (created_at::date));
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 2. Create beta_points table if not exists
  console.log('📄 Creating beta_points table...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS beta_points (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        total_points integer DEFAULT 0,
        bugs_reported integer DEFAULT 0,
        bugs_validated integer DEFAULT 0,
        features_suggested integer DEFAULT 0,
        features_shipped integer DEFAULT 0,
        surveys_completed integer DEFAULT 0,
        referrals_made integer DEFAULT 0,
        referrals_joined integer DEFAULT 0,
        bags_created integer DEFAULT 0,
        items_added integer DEFAULT 0,
        ai_uses integer DEFAULT 0,
        streak_days integer DEFAULT 0,
        max_streak integer DEFAULT 0,
        last_active_date date,
        badges text[] DEFAULT '{}',
        rewards_claimed jsonb DEFAULT '[]',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_beta_points_user ON beta_points(user_id);
      CREATE INDEX IF NOT EXISTS idx_beta_points_total ON beta_points(total_points DESC);
      ALTER TABLE beta_points ENABLE ROW LEVEL SECURITY;
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 3. Add beta fields to profiles
  console.log('📄 Adding beta fields to profiles...');
  try {
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_tier text;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_approved_at timestamptz;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by_id uuid REFERENCES profiles(id);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}';
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 4. Create indexes on profiles
  console.log('📄 Creating profile indexes...');
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profiles_beta_tier ON profiles(beta_tier) WHERE beta_tier IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON profiles(invited_by_id) WHERE invited_by_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC) WHERE beta_tier IS NOT NULL;
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 5. Create trigger for beta_points
  console.log('📄 Creating beta_points trigger...');
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION create_beta_points_for_profile()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.beta_tier IS NOT NULL THEN
          INSERT INTO beta_points (user_id, total_points, badges)
          VALUES (
            NEW.id,
            50,
            CASE
              WHEN NEW.beta_tier = 'founder' THEN ARRAY['founding_member']
              ELSE ARRAY[]::text[]
            END
          )
          ON CONFLICT (user_id) DO NOTHING;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS create_beta_points_on_profile ON profiles;
      CREATE TRIGGER create_beta_points_on_profile
        AFTER INSERT OR UPDATE OF beta_tier ON profiles
        FOR EACH ROW
        WHEN (NEW.beta_tier IS NOT NULL)
        EXECUTE FUNCTION create_beta_points_for_profile();
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 6. Create utility functions
  console.log('📄 Creating utility functions...');
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION award_beta_points(
        target_user_id uuid,
        points integer,
        reason text,
        counter_field text DEFAULT NULL
      )
      RETURNS integer AS $$
      DECLARE
        new_total integer;
      BEGIN
        IF counter_field IS NOT NULL THEN
          EXECUTE format(
            'UPDATE beta_points SET total_points = total_points + $1, %I = %I + 1, updated_at = now() WHERE user_id = $2 RETURNING total_points',
            counter_field, counter_field
          ) INTO new_total USING points, target_user_id;
        ELSE
          UPDATE beta_points
          SET total_points = total_points + points, updated_at = now()
          WHERE user_id = target_user_id
          RETURNING total_points INTO new_total;
        END IF;
        RETURN COALESCE(new_total, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION get_beta_leaderboard(limit_count integer DEFAULT 10)
      RETURNS TABLE (
        rank bigint,
        user_id uuid,
        handle text,
        display_name text,
        total_points integer,
        badges text[],
        streak_days integer
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          ROW_NUMBER() OVER (ORDER BY bp.total_points DESC) as rank,
          bp.user_id,
          p.handle,
          p.display_name,
          bp.total_points,
          bp.badges,
          bp.streak_days
        FROM beta_points bp
        JOIN profiles p ON p.id = bp.user_id
        ORDER BY bp.total_points DESC
        LIMIT limit_count;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  // 7. Add RLS policies
  console.log('📄 Adding RLS policies...');
  try {
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can view beta points" ON beta_points;
      CREATE POLICY "Anyone can view beta points"
        ON beta_points FOR SELECT TO authenticated USING (true);
    `);
    console.log('   ✅ Success\n');
  } catch (e) {
    console.log(`   ⚠️ ${e.message}\n`);
  }

  console.log('🎉 All fixes applied!');
  await client.end();
}

fix().catch(console.error);
