/**
 * Test script for the 4-stage vision pipeline.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/test-vision-pipeline.ts [image-path]
 *
 * If no image path provided, creates a small test image.
 */

import fs from 'fs';
import path from 'path';

async function main() {
  const { identifyItemsInPhoto } = await import('../lib/visionPipeline/index');

  const imagePath = process.argv[2];

  let imageBase64: string;

  if (imagePath) {
    // Read image from file
    const absPath = path.resolve(imagePath);
    if (!fs.existsSync(absPath)) {
      console.error(`File not found: ${absPath}`);
      process.exit(1);
    }
    const buffer = fs.readFileSync(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
    console.log(`Loaded image: ${absPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  } else {
    console.log('No image provided. Usage: npx tsx scripts/test-vision-pipeline.ts <image-path>');
    console.log('Example: npx tsx scripts/test-vision-pipeline.ts ~/Desktop/desk-setup.jpg');
    process.exit(0);
  }

  console.log('\n=== Starting Vision Pipeline ===\n');

  const startTime = Date.now();

  try {
    const result = await identifyItemsInPhoto(imageBase64, {
      bagType: 'tech',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n=== Pipeline Results ===\n');
    console.log(`Total time: ${elapsed}s`);
    console.log(`Stage timings:`);
    console.log(`  Enumerate: ${result.stats.stageTimings.enumerate}ms`);
    console.log(`  Crop:      ${result.stats.stageTimings.crop}ms`);
    console.log(`  Identify:  ${result.stats.stageTimings.identify}ms`);
    console.log(`  Validate:  ${result.stats.stageTimings.validate}ms`);
    console.log('');
    console.log(`Detected: ${result.stats.totalDetected} items`);
    console.log(`Identified: ${result.stats.totalIdentified} items`);
    console.log(`Verified: ${result.stats.totalVerified} items`);
    console.log(`Partial: ${result.stats.partial}`);
    console.log('');

    // Print each item
    result.items.forEach((item, i) => {
      const brand = item.corrected?.brand ?? item.brand ?? '?';
      const model = item.corrected?.model ?? item.model ?? '?';
      const confidence = item.corrected?.confidence ?? item.confidence;
      const verdict = item.validation.verdict;

      const verdictIcon =
        verdict === 'verified' ? '✓' :
        verdict === 'mismatch' ? '✗' :
        '?';

      console.log(`  ${i + 1}. [${verdictIcon}] ${brand} ${model} (${confidence}%) - ${item.label} [${item.category}]`);

      if (item.validation.discrepancies.length > 0) {
        console.log(`     Discrepancies: ${item.validation.discrepancies.join(', ')}`);
      }
    });

    // Save crops to disk for visual inspection
    const cropsDir = path.join(__dirname, '../.pipeline-crops');
    if (!fs.existsSync(cropsDir)) {
      fs.mkdirSync(cropsDir, { recursive: true });
    }

    result.items.forEach((item) => {
      if (item.cropBase64) {
        const base64Data = item.cropBase64.replace(/^data:image\/\w+;base64,/, '');
        const filename = `crop_${item.id}_${item.label.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)}.jpg`;
        fs.writeFileSync(path.join(cropsDir, filename), Buffer.from(base64Data, 'base64'));
      }
    });

    console.log(`\nCrop images saved to: ${cropsDir}`);

    // Estimate cost
    const geminiCost = 0.02;
    const gpt4oCostPerItem = 0.03;
    const validateCostPerItem = 0.02;
    const totalCost = geminiCost +
      result.stats.totalDetected * gpt4oCostPerItem +
      result.stats.totalIdentified * validateCostPerItem;
    console.log(`\nEstimated cost: $${totalCost.toFixed(2)}`);
  } catch (error) {
    console.error('\nPipeline failed:', error);
    process.exit(1);
  }
}

main();
