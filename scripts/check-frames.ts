import { extractRealFrames, extractHighResFrames } from '../lib/videoPipeline/youtubeStoryboard';
import { promises as fs } from 'fs';

async function main() {
  const videoId = 'ct832xePN74';

  // Extract storyboard frames every 5s from 0-120s (bag & keychains likely shown early)
  const timestamps: number[] = [];
  for (let s = 0; s <= 120; s += 5) {
    timestamps.push(s * 1000);
  }

  const frames = await extractRealFrames(videoId, timestamps);
  console.log(`Extracted ${frames.length} storyboard frames`);

  await fs.mkdir('/tmp/bag-frames', { recursive: true });
  for (const frame of frames) {
    const sec = Math.floor(frame.timestampMs / 1000);
    const data = frame.base64.replace(/^data:image\/jpeg;base64,/, '');
    await fs.writeFile(`/tmp/bag-frames/frame_${String(sec).padStart(3, '0')}s.jpg`, data, 'base64');
    console.log(`  ${frame.timestampFormatted} (${frame.width}x${frame.height})`);
  }

  // Hi-res frames at the key timestamps
  console.log('\nDownloading hi-res frames...');
  const hiRes = await extractHighResFrames(videoId, [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000]);

  console.log(`Extracted ${hiRes.length} hi-res frames`);
  for (const frame of hiRes) {
    const sec = Math.floor(frame.timestampMs / 1000);
    const data = frame.base64.replace(/^data:image\/jpeg;base64,/, '');
    await fs.writeFile(`/tmp/bag-frames/hires_${String(sec).padStart(3, '0')}s.jpg`, data, 'base64');
    console.log(`  ${frame.timestampFormatted} (${frame.width}x${frame.height})`);
  }
}

main().catch(console.error);
