#!/usr/bin/env node
/**
 * Run the AI Visual Corrections migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running AI Visual Corrections migration...\n');

  const sqlPath = join(__dirname, 'migrations', 'ai_visual_corrections.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  // Split by semicolons but handle the GENERATED ALWAYS clause properly
  const statements = sql
    .split(/;(?=\s*(?:CREATE|COMMENT|ALTER|DROP|INSERT|UPDATE|DELETE))/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: statement + ';' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }

      console.log('✓ Executed:', statement.substring(0, 60) + '...');
      successCount++;
    } catch (err) {
      // Check if it's a "already exists" error (which is fine)
      if (err.message?.includes('already exists') || err.message?.includes('42P07')) {
        console.log('○ Already exists:', statement.substring(0, 50) + '...');
        successCount++;
      } else {
        console.error('✗ Failed:', statement.substring(0, 50) + '...');
        console.error('  Error:', err.message);
        errorCount++;
      }
    }
  }

  console.log(`\nMigration complete: ${successCount} succeeded, ${errorCount} failed`);
}

runMigration().catch(console.error);
