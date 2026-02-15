import { extractRealFrames, extractEvenlySpacedFrames } from '../lib/videoPipeline/youtubeStoryboard';
import * as fs from 'fs';

async function main() {
  const videoId = 'dQw4w9WgXcQ'; // 3:33 = 213 seconds

  console.log('Testing real frame extraction...');

  // Test 1: Extract at specific timestamps
  const timestamps = [
    10_000,   // 0:10
    60_000,   // 1:00
    120_000,  // 2:00
    180_000,  // 3:00
  ];

  const frames = await extractRealFrames(videoId, timestamps);
  console.log(`\nExtracted ${frames.length} frames from specific timestamps:`);

  for (const f of frames) {
    console.log(`  ${f.timestampFormatted} (${f.width}x${f.height}) - base64 length: ${f.base64.length}`);
  }

  // Test 2: Extract evenly spaced
  console.log('\nTesting evenly-spaced extraction...');
  const evenFrames = await extractEvenlySpacedFrames(videoId, 213_000, 6);
  console.log(`Extracted ${evenFrames.length} evenly-spaced frames:`);

  for (const f of evenFrames) {
    console.log(`  ${f.timestampFormatted} (${f.width}x${f.height})`);
  }

  // Save first frame to verify it's a real image
  if (frames.length > 0) {
    const firstFrame = frames[0];
    const b64Data = firstFrame.base64.replace(/^data:image\/jpeg;base64,/, '');
    fs.writeFileSync('/tmp/test-frame.jpg', Buffer.from(b64Data, 'base64'));
    console.log('\nSaved first frame to /tmp/test-frame.jpg for inspection');
  }
}

main().catch(console.error);
