/**
 * Dense Frame Extraction
 *
 * Extracts frames from a downloaded video using ffmpeg:
 * - Every N seconds (2s for normal, 1s for short videos)
 * - Scene-change detection adds transition frames
 * - Perceptual hash dedup removes visually identical frames
 *
 * Frames are saved as JPEG files on disk to avoid memory pressure.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import type { ExtractedFrameV2 } from './types';

interface ExecResult { stdout: string; stderr: string }

function execPromise(command: string, args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: timeoutMs,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${error.message}\nstderr: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/** Like execPromise but returns both stdout and stderr */
function execWithStderr(command: string, args: string[], timeoutMs = 120_000): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: timeoutMs,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${error.message}\nstderr: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/** Format timestamp from milliseconds to "M:SS" or "H:MM:SS" */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Compute a perceptual hash for an image file.
 * Uses average hash: resize to 8x8 grayscale, threshold at mean.
 * Returns a 16-character hex string.
 */
async function computePerceptualHash(filePath: string): Promise<string> {
  const { data } = await sharp(filePath)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Compute mean pixel value
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;

  // Build hash: each bit is 1 if pixel >= mean
  // Use nibble-based approach to avoid BigInt
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4; j++) {
      if (i + j < 64 && data[i + j] >= mean) {
        nibble |= (1 << (3 - j));
      }
    }
    hex += nibble.toString(16);
  }

  return hex;
}

/** Hamming distance between two hex hash strings */
function hammingDistance(a: string, b: string): number {
  // Compare character by character to avoid BigInt for ES target compatibility
  let count = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = parseInt(a[i], 16);
    const vb = parseInt(b[i], 16);
    // Count differing bits in this 4-bit nibble
    let xor = va ^ vb;
    while (xor > 0) {
      count += xor & 1;
      xor >>= 1;
    }
  }
  return count;
}

export interface FrameExtractionOptions {
  /** Video file path */
  videoPath: string;
  /** Output directory for frame JPEGs */
  outputDir: string;
  /** Video duration in seconds */
  durationSeconds: number;
  /** Frame interval in seconds (default: 2) */
  intervalSeconds?: number;
  /** Enable scene-change detection (default: true) */
  sceneDetection?: boolean;
  /** Hamming distance threshold for dedup (default: 5) */
  dedupThreshold?: number;
}

/**
 * Extract frames from a video at regular intervals with scene-change detection.
 * Returns metadata for each extracted frame. Frames are saved as JPEGs on disk.
 */
export async function extractFrames(options: FrameExtractionOptions): Promise<ExtractedFrameV2[]> {
  const {
    videoPath,
    outputDir,
    durationSeconds,
    intervalSeconds = 2,
    sceneDetection = true,
    dedupThreshold = 2,
  } = options;

  await fs.mkdir(outputDir, { recursive: true });

  // Step 1: Extract interval frames
  const intervalFrames = await extractIntervalFrames(videoPath, outputDir, durationSeconds, intervalSeconds);
  console.log(`[V2 Frames] Extracted ${intervalFrames.length} interval frames (every ${intervalSeconds}s)`);

  // Step 2: Extract scene-change frames
  let sceneFrames: ExtractedFrameV2[] = [];
  if (sceneDetection) {
    sceneFrames = await extractSceneChangeFrames(videoPath, outputDir, intervalFrames.length);
    console.log(`[V2 Frames] Extracted ${sceneFrames.length} scene-change frames`);
  }

  // Step 3: Combine and sort by timestamp
  const allFrames = [...intervalFrames, ...sceneFrames].sort(
    (a, b) => a.timestampMs - b.timestampMs
  );

  // Step 4: Compute perceptual hashes
  for (const frame of allFrames) {
    try {
      frame.pHash = await computePerceptualHash(frame.filePath);
    } catch {
      frame.pHash = '0000000000000000'; // fallback
    }
  }

  // Step 5: Dedup by perceptual hash
  const deduped = deduplicateFrames(allFrames, dedupThreshold);
  const removed = allFrames.length - deduped.length;
  if (removed > 0) {
    console.log(`[V2 Frames] Dedup removed ${removed} frames (${deduped.length} remaining)`);
    // Clean up removed frame files
    const dedupedPaths = new Set(deduped.map(f => f.filePath));
    for (const frame of allFrames) {
      if (!dedupedPaths.has(frame.filePath)) {
        await fs.unlink(frame.filePath).catch(() => {});
      }
    }
  }

  return deduped;
}

/** Extract frames at regular intervals */
async function extractIntervalFrames(
  videoPath: string,
  outputDir: string,
  durationSeconds: number,
  intervalSeconds: number,
): Promise<ExtractedFrameV2[]> {
  const fps = 1 / intervalSeconds; // e.g., 0.5 for every 2s

  try {
    await execPromise('ffmpeg', [
      '-i', videoPath,
      '-vf', `fps=${fps}`,
      '-q:v', '3',         // JPEG quality (2=best, 31=worst)
      '-vsync', 'vfr',
      path.join(outputDir, 'interval_%05d.jpg'),
    ], 300_000); // 5 min timeout
  } catch (err) {
    console.error('[V2 Frames] Interval extraction failed:', err instanceof Error ? err.message.split('\n')[0] : err);
    return [];
  }

  // Read extracted files and build metadata
  const files = (await fs.readdir(outputDir))
    .filter(f => f.startsWith('interval_') && f.endsWith('.jpg'))
    .sort();

  const frames: ExtractedFrameV2[] = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(outputDir, files[i]);
    const timestampMs = Math.round(i * intervalSeconds * 1000);

    // Get actual dimensions
    let width = 1280;
    let height = 720;
    try {
      const meta = await sharp(filePath).metadata();
      width = meta.width || 1280;
      height = meta.height || 720;
    } catch { /* use defaults */ }

    frames.push({
      id: `frame_${String(i).padStart(4, '0')}`,
      filePath,
      timestampMs,
      timestampFormatted: formatTimestamp(timestampMs),
      width,
      height,
      pHash: '',
      isSceneChange: false,
    });
  }

  return frames;
}

/** Extract frames at scene changes using ffmpeg's scene detection filter */
async function extractSceneChangeFrames(
  videoPath: string,
  outputDir: string,
  existingCount: number,
): Promise<ExtractedFrameV2[]> {
  let result: ExecResult;
  try {
    // Use select filter with scene detection + showinfo to get timestamps from stderr
    result = await execWithStderr('ffmpeg', [
      '-i', videoPath,
      '-vf', 'select=gt(scene\\,0.3),showinfo',
      '-vsync', 'vfr',
      '-q:v', '3',
      path.join(outputDir, 'scene_%05d.jpg'),
    ], 300_000);
  } catch (err) {
    console.warn('[V2 Frames] Scene detection failed:', err instanceof Error ? err.message.split('\n')[0] : err);
    return [];
  }

  // Read scene change files
  const files = (await fs.readdir(outputDir))
    .filter(f => f.startsWith('scene_') && f.endsWith('.jpg'))
    .sort();

  if (files.length === 0) return [];

  // Parse timestamps from showinfo output in stderr
  // Format: [Parsed_showinfo_1 @ 0x...] n:  0 pts:123456 pts_time:7.71 ...
  const sceneTimestamps: number[] = [];
  const ptsTimeRegex = /pts_time:([\d.]+)/g;
  let match;
  while ((match = ptsTimeRegex.exec(result.stderr)) !== null) {
    sceneTimestamps.push(Math.round(parseFloat(match[1]) * 1000));
  }

  if (sceneTimestamps.length === 0) {
    console.warn('[V2 Frames] Could not parse timestamps from showinfo, skipping scene frames');
    for (const file of files) {
      await fs.unlink(path.join(outputDir, file)).catch(() => {});
    }
    return [];
  }

  const frames: ExtractedFrameV2[] = [];
  for (let i = 0; i < Math.min(files.length, sceneTimestamps.length); i++) {
    const filePath = path.join(outputDir, files[i]);
    const timestampMs = sceneTimestamps[i];

    let width = 1280;
    let height = 720;
    try {
      const meta = await sharp(filePath).metadata();
      width = meta.width || 1280;
      height = meta.height || 720;
    } catch { /* use defaults */ }

    frames.push({
      id: `scene_${String(existingCount + i).padStart(4, '0')}`,
      filePath,
      timestampMs,
      timestampFormatted: formatTimestamp(timestampMs),
      width,
      height,
      pHash: '',
      isSceneChange: true,
    });
  }

  return frames;
}

/** Remove perceptually similar frames (Hamming distance < threshold) */
function deduplicateFrames(frames: ExtractedFrameV2[], threshold: number): ExtractedFrameV2[] {
  if (frames.length === 0) return [];

  const result: ExtractedFrameV2[] = [frames[0]];

  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    let isDuplicate = false;

    // Only compare against recent frames (window of 5) for performance
    const windowStart = Math.max(0, result.length - 5);
    for (let j = windowStart; j < result.length; j++) {
      if (hammingDistance(frame.pHash, result[j].pHash) < threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(frame);
    }
  }

  return result;
}
