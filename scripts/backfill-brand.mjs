#!/usr/bin/env node

/**
 * Backfill brand field for existing items
 * Extracts brand from custom_name using AI
 * Run: node scripts/backfill-brand.mjs
 */

import 'dotenv/config';
import pg from 'pg';
import OpenAI from 'openai';

const { Client } = pg;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function extractBrand(productName) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for simple extraction
      messages: [
        {
          role: 'system',
          content: `You are a brand extraction assistant. Extract the brand name from product names.
Return ONLY valid JSON in this format: {"brand": "BrandName"} or {"brand": null} if no brand is identifiable.

Examples:
- "TaylorMade Stealth 2 Plus Driver" → {"brand": "TaylorMade"}
- "MAC Ruby Woo Lipstick" → {"brand": "MAC"}
- "Patagonia Nano Puff Jacket" → {"brand": "Patagonia"}
- "Blue T-Shirt" → {"brand": null}`,
        },
        {
          role: 'user',
          content: `Extract the brand from this product name: "${productName}"`,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.brand || null;
  } catch (error) {
    console.error(`Failed to extract brand from "${productName}":`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n🔄 Starting brand backfill process...\n');
  console.log('═'.repeat(80));

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all items where brand IS NULL and custom_name is NOT NULL
    const { rows: items } = await client.query(`
      SELECT id, custom_name
      FROM bag_items
      WHERE brand IS NULL
        AND custom_name IS NOT NULL
        AND custom_name != ''
      ORDER BY created_at DESC
    `);

    console.log(`📋 Found ${items.length} items to process\n`);

    if (items.length === 0) {
      console.log('✅ No items need backfilling!\n');
      await client.end();
      return;
    }

    let processed = 0;
    let brandsFound = 0;
    let failed = 0;

    for (const item of items) {
      processed++;
      console.log(`[${processed}/${items.length}] Processing: "${item.custom_name}"`);

      try {
        const brand = await extractBrand(item.custom_name);

        if (brand) {
          // Update the item with extracted brand
          await client.query(
            'UPDATE bag_items SET brand = $1 WHERE id = $2',
            [brand, item.id]
          );
          brandsFound++;
          console.log(`   ✅ Brand found: "${brand}"\n`);
        } else {
          console.log(`   ⚠️  No brand detected\n`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failed++;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Summary
    console.log('═'.repeat(80));
    console.log('\n📊 Backfill Summary:');
    console.log(`   Total items processed: ${processed}`);
    console.log(`   Brands extracted: ${brandsFound}`);
    console.log(`   No brand found: ${processed - brandsFound - failed}`);
    console.log(`   Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('✅ Backfill completed successfully!\n');
    } else {
      console.log(`⚠️  Completed with ${failed} errors\n`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
