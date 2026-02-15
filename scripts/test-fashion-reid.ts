/**
 * Test the fashion re-ID step directly with the keychain frames we already have
 */
import { identifyFashionItems } from '../lib/videoPipeline/combinedAnalysis';
import type { VisionProduct } from '../lib/videoPipeline/types';
import { promises as fs } from 'fs';

async function main() {
  // Load hi-res frames of the keychains
  const frame23 = await fs.readFile('/tmp/keychain-frames/frame_023s.jpg');
  const frame29 = await fs.readFile('/tmp/keychain-frames/frame_029s.jpg');
  const frame33 = await fs.readFile('/tmp/keychain-frames/frame_033s.jpg');
  const frame47 = await fs.readFile('/tmp/keychain-frames/frame_047s.jpg');
  const frame51 = await fs.readFile('/tmp/keychain-frames/frame_051s.jpg');

  const toBase64 = (buf: Buffer) => `data:image/jpeg;base64,${buf.toString('base64')}`;

  // Simulate the unbranded fashion items from the pipeline
  const keychainProduct: VisionProduct = {
    name: 'Character Keychain',
    brand: undefined,
    category: 'Keychains',
    confidence: 60,
    frameIndex: 3,
    frameUrl: toBase64(frame47),
    frameTimestamp: '0:50',
  };

  const charmProduct: VisionProduct = {
    name: 'Butterfly Charm',
    brand: undefined,
    category: 'Keychains',
    confidence: 70,
    frameIndex: 3,
    frameUrl: toBase64(frame51),
    frameTimestamp: '0:50',
  };

  const bagProduct: VisionProduct = {
    name: 'Black Leather Bag',
    brand: undefined,
    category: 'Fashion/Accessories',
    confidence: 70,
    frameIndex: 3,
    frameUrl: toBase64(frame23),
    frameTimestamp: '0:20',
  };

  console.log('Testing fashion re-ID with keychain-first ordering...\n');

  const results = await identifyFashionItems([
    {
      product: keychainProduct,
      hiResFrame: toBase64(frame29),
      additionalFrames: [toBase64(frame33), toBase64(frame47), toBase64(frame23)],
    },
    {
      product: charmProduct,
      hiResFrame: toBase64(frame51),
      additionalFrames: [toBase64(frame29), toBase64(frame23)],
    },
    {
      product: bagProduct,
      hiResFrame: toBase64(frame23),
    },
  ]);

  console.log('\nResults:');
  for (const [idx, result] of results) {
    const items = [keychainProduct, charmProduct, bagProduct];
    console.log(`  Item ${idx} (${items[idx].name}): ${result.brand} ${result.name} (${result.confidence}%)`);
  }
}

main().catch(console.error);
