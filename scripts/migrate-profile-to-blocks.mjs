#!/usr/bin/env node

/**
 * Migrate a profile to the blocks system
 * Creates default blocks from existing profile data
 *
 * Usage: node scripts/migrate-profile-to-blocks.mjs [handle]
 * If no handle provided, migrates all profiles
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

async function migrateProfile(client, profile) {
  console.log(`\n📦 Migrating profile: @${profile.handle}`);

  // Check if already migrated
  const { rows: existingBlocks } = await client.query(
    'SELECT COUNT(*) as count FROM profile_blocks WHERE profile_id = $1',
    [profile.id]
  );

  if (parseInt(existingBlocks[0].count) > 0) {
    console.log(`   ⏭️  Already has blocks, skipping...`);
    return false;
  }

  const blocks = [];
  let sortOrder = 0;

  // 1. Header block (always add)
  blocks.push({
    id: randomUUID(),
    profile_id: profile.id,
    block_type: 'header',
    sort_order: sortOrder++,
    is_visible: true,
    config: JSON.stringify({
      show_avatar: true,
      show_banner: !!profile.banner_url,
      show_display_name: true,
      show_handle: true,
      alignment: 'center'
    })
  });
  console.log('   ✅ Added header block');

  // 2. Bio block (if bio exists)
  if (profile.bio) {
    blocks.push({
      id: randomUUID(),
      profile_id: profile.id,
      block_type: 'bio',
      sort_order: sortOrder++,
      is_visible: true,
      config: JSON.stringify({
        show_full: true
      })
    });
    console.log('   ✅ Added bio block');
  }

  // 3. Social links block (if any social links exist)
  const socialLinks = profile.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);
  if (hasSocialLinks) {
    blocks.push({
      id: randomUUID(),
      profile_id: profile.id,
      block_type: 'social_links',
      sort_order: sortOrder++,
      is_visible: true,
      config: JSON.stringify({
        style: 'icons'
      })
    });
    console.log('   ✅ Added social links block');
  }

  // 4. Spacer
  blocks.push({
    id: randomUUID(),
    profile_id: profile.id,
    block_type: 'spacer',
    sort_order: sortOrder++,
    is_visible: true,
    config: JSON.stringify({
      size: 'md'
    })
  });

  // 5. Featured bags block
  blocks.push({
    id: randomUUID(),
    profile_id: profile.id,
    block_type: 'featured_bags',
    sort_order: sortOrder++,
    is_visible: true,
    config: JSON.stringify({
      style: 'grid',
      max_display: 6
    })
  });
  console.log('   ✅ Added featured bags block');

  // Insert all blocks
  for (const block of blocks) {
    await client.query(
      `INSERT INTO profile_blocks (id, profile_id, block_type, sort_order, is_visible, config)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [block.id, block.profile_id, block.block_type, block.sort_order, block.is_visible, block.config]
    );
  }

  // Enable blocks for this profile
  await client.query(
    'UPDATE profiles SET blocks_enabled = true WHERE id = $1',
    [profile.id]
  );
  console.log('   ✅ Enabled blocks for profile');

  return true;
}

async function main() {
  const targetHandle = process.argv[2];

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('\n🚀 Profile Blocks Migration');
    console.log('═'.repeat(60));

    let profiles;
    if (targetHandle) {
      // Migrate specific profile
      const { rows } = await client.query(
        'SELECT id, handle, display_name, bio, avatar_url, banner_url, social_links FROM profiles WHERE handle = $1',
        [targetHandle]
      );
      profiles = rows;
      if (profiles.length === 0) {
        console.error(`❌ Profile not found: @${targetHandle}`);
        process.exit(1);
      }
    } else {
      // Migrate all profiles that haven't been migrated
      const { rows } = await client.query(
        'SELECT id, handle, display_name, bio, avatar_url, banner_url, social_links FROM profiles WHERE blocks_enabled = false OR blocks_enabled IS NULL'
      );
      profiles = rows;
    }

    console.log(`\n📋 Found ${profiles.length} profile(s) to migrate`);

    let migratedCount = 0;
    for (const profile of profiles) {
      const migrated = await migrateProfile(client, profile);
      if (migrated) migratedCount++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`🎉 Migration complete! Migrated ${migratedCount} profile(s)`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
