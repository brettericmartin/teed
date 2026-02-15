import { extractHighResFrames } from '../lib/videoPipeline/youtubeStoryboard';
import { promises as fs } from 'fs';

async function main() {
  const videoId = 'ct832xePN74';

  // Dense hi-res frames every 2s from 15-55s to catch the keychains
  const timestamps: number[] = [];
  for (let s = 15; s <= 55; s += 2) {
    timestamps.push(s * 1000);
  }

  console.log('Extracting hi-res frames every 2s from 15-55s...');
  const frames = await extractHighResFrames(videoId, timestamps);

  console.log(`Extracted ${frames.length} frames`);
  await fs.mkdir('/tmp/keychain-frames', { recursive: true });
  for (const frame of frames) {
    const sec = Math.floor(frame.timestampMs / 1000);
    const data = frame.base64.replace(/^data:image\/jpeg;base64,/, '');
    await fs.writeFile(`/tmp/keychain-frames/frame_${String(sec).padStart(3, '0')}s.jpg`, data, 'base64');
    console.log(`  ${frame.timestampFormatted}`);
  }
}

main().catch(console.error);
