#!/usr/bin/env npx ts-node
/**
 * Domain Sync Script
 *
 * Automates the workflow between unrecognized domains in the database
 * and the domainBrands.ts library file.
 *
 * Commands:
 *   generate    - Generate code snippets from pending domains
 *   mark-added  - Mark domains in DB that exist in domainBrands.ts
 *   status      - Show counts of pending/added/ignored domains
 *
 * Usage:
 *   npx ts-node scripts/sync-domains.ts generate
 *   npx ts-node scripts/sync-domains.ts mark-added
 *   npx ts-node scripts/sync-domains.ts status
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import the domain brands map
import { DOMAIN_BRAND_MAP } from '../lib/linkIdentification/domainBrands';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure to run with environment variables loaded.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface UnrecognizedDomain {
  id: string;
  domain: string;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  suggested_brand: string | null;
  suggested_category: string | null;
  suggested_tier: string | null;
  status: string;
  sample_urls: string[];
}

/**
 * Generate code snippets from pending domains
 */
async function generateCodeSnippets() {
  console.log('\n📥 Fetching pending domains from database...\n');

  const { data: domains, error } = await supabase
    .from('unrecognized_domains')
    .select('*')
    .eq('status', 'pending')
    .order('occurrence_count', { ascending: false });

  if (error) {
    console.error('Error fetching domains:', error.message);
    process.exit(1);
  }

  if (!domains || domains.length === 0) {
    console.log('✅ No pending domains found!');
    return;
  }

  console.log(`Found ${domains.length} pending domains\n`);

  // Group by suggested category
  const byCategory: Record<string, UnrecognizedDomain[]> = {};
  for (const domain of domains) {
    const category = domain.suggested_category || 'uncategorized';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(domain);
  }

  // Generate code output
  let output = `/**
 * Generated Domain Additions
 * Generated at: ${new Date().toISOString()}
 * Total domains: ${domains.length}
 *
 * Copy the relevant entries into lib/linkIdentification/domainBrands.ts
 * under the appropriate category section.
 */

`;

  for (const [category, categoryDomains] of Object.entries(byCategory)) {
    output += `// ============================================\n`;
    output += `// ${category.toUpperCase()} (${categoryDomains.length} domains)\n`;
    output += `// ============================================\n\n`;

    for (const d of categoryDomains) {
      const brand = d.suggested_brand || 'Unknown';
      const tier = d.suggested_tier || 'mid';
      const isRetailer = brand.toLowerCase().includes('store') ||
                         brand.toLowerCase().includes('shop') ||
                         brand.toLowerCase().includes('retailer');

      output += `  // ${d.occurrence_count} occurrences, last seen: ${new Date(d.last_seen_at).toLocaleDateString()}\n`;
      if (d.sample_urls && d.sample_urls.length > 0) {
        output += `  // Sample: ${d.sample_urls[0]}\n`;
      }
      output += `  '${d.domain}': { brand: ${isRetailer ? 'null' : `'${brand}'`}, category: '${category}', tier: '${tier}', aliases: [], isRetailer: ${isRetailer} },\n\n`;
    }
  }

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  const outputPath = path.join(outputDir, 'domains-to-add.ts');
  fs.writeFileSync(outputPath, output);

  console.log(`✅ Generated code snippets for ${domains.length} domains`);
  console.log(`📄 Output written to: ${outputPath}\n`);

  // Print summary by category
  console.log('Summary by category:');
  for (const [category, categoryDomains] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${categoryDomains.length} domains`);
  }
  console.log('');

  // Print top 10 by occurrence count
  console.log('Top 10 by occurrence count:');
  const top10 = domains.slice(0, 10);
  for (const d of top10) {
    console.log(`  ${d.occurrence_count}x - ${d.domain} (${d.suggested_brand || 'Unknown'})`);
  }
}

/**
 * Mark domains as added if they exist in domainBrands.ts
 */
async function markAddedDomains() {
  console.log('\n🔍 Checking for domains that exist in domainBrands.ts...\n');

  // Get all domains from the library
  const libraryDomains = new Set(Object.keys(DOMAIN_BRAND_MAP));
  console.log(`Found ${libraryDomains.size} domains in domainBrands.ts`);

  // Fetch pending domains from DB
  const { data: pendingDomains, error } = await supabase
    .from('unrecognized_domains')
    .select('id, domain, status')
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching domains:', error.message);
    process.exit(1);
  }

  if (!pendingDomains || pendingDomains.length === 0) {
    console.log('✅ No pending domains to check!');
    return;
  }

  console.log(`Found ${pendingDomains.length} pending domains in database\n`);

  // Find matches
  const toMark: { id: string; domain: string }[] = [];
  for (const d of pendingDomains) {
    if (libraryDomains.has(d.domain)) {
      toMark.push({ id: d.id, domain: d.domain });
    }
  }

  if (toMark.length === 0) {
    console.log('✅ No pending domains match entries in domainBrands.ts');
    return;
  }

  console.log(`Found ${toMark.length} domains to mark as added:`);
  for (const d of toMark) {
    console.log(`  - ${d.domain}`);
  }
  console.log('');

  // Update in database
  const ids = toMark.map(d => d.id);
  const { error: updateError } = await supabase
    .from('unrecognized_domains')
    .update({
      status: 'added',
      added_to_database_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) {
    console.error('Error updating domains:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Marked ${toMark.length} domains as added!`);
}

/**
 * Show status summary
 */
async function showStatus() {
  console.log('\n📊 Domain Status Summary\n');

  // Get counts by status
  const { data: statusCounts, error } = await supabase
    .from('unrecognized_domains')
    .select('status');

  if (error) {
    console.error('Error fetching status:', error.message);
    process.exit(1);
  }

  const counts: Record<string, number> = {
    pending: 0,
    added: 0,
    ignored: 0,
    blocked: 0,
  };

  for (const row of statusCounts || []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  console.log('Database status:');
  console.log(`  Pending:  ${counts.pending}`);
  console.log(`  Added:    ${counts.added}`);
  console.log(`  Ignored:  ${counts.ignored}`);
  console.log(`  Blocked:  ${counts.blocked}`);
  console.log(`  Total:    ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  console.log('');

  // Library stats
  const libraryCount = Object.keys(DOMAIN_BRAND_MAP).length;
  console.log(`domainBrands.ts: ${libraryCount} domains`);
}

// Main entry point
const command = process.argv[2];

switch (command) {
  case 'generate':
    generateCodeSnippets();
    break;
  case 'mark-added':
    markAddedDomains();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log(`
Domain Sync Script

Usage:
  npx ts-node scripts/sync-domains.ts <command>

Commands:
  generate    - Generate code snippets from pending domains
  mark-added  - Mark domains in DB that exist in domainBrands.ts
  status      - Show counts of pending/added/ignored domains

Examples:
  npx ts-node scripts/sync-domains.ts generate
  npx ts-node scripts/sync-domains.ts mark-added
  npx ts-node scripts/sync-domains.ts status
`);
    process.exit(command ? 1 : 0);
}
