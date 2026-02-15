/**
 * YouTube Storyboard Frame Extraction
 *
 * Extracts real frames from YouTube videos at specific timestamps
 * by parsing the storyboard sprite sheets that YouTube generates
 * for every public video (the scrubber preview images).
 *
 * Storyboard levels:
 *   L0: 48x27   (very low res, many per sheet)
 *   L1: 80x45   (low res)
 *   L2: 160x90  (medium — usable for vision)
 *   L3: 320x180 (best — ideal for GPT-4o vision)
 */

import sharp from 'sharp';
import { execFile } from 'child_process';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface StoryboardLevel {
  baseUrl: string;      // URL template with $M placeholder for sheet index
  width: number;        // Single frame width (px)
  height: number;       // Single frame height (px)
  totalFrames: number;  // Total number of frames across all sheets
  cols: number;         // Columns per sprite sheet
  rows: number;         // Rows per sprite sheet
  intervalMs: number;   // Milliseconds between frames (0 for L0)
}

interface StoryboardSpec {
  levels: StoryboardLevel[];
  videoId: string;
}

export interface ExtractedFrame {
  base64: string;             // JPEG base64 data
  timestampMs: number;        // Actual timestamp of the frame
  timestampFormatted: string; // "2:34"
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════════════
// Storyboard Spec Fetching
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch the storyboard spec from a YouTube video page.
 * Returns null if storyboard data can't be extracted.
 */
export async function fetchStoryboardSpec(videoId: string): Promise<StoryboardSpec | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.error(`[Storyboard] Failed to fetch YouTube page: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Extract ytInitialPlayerResponse JSON
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*;/);
    if (!match) {
      console.error('[Storyboard] No ytInitialPlayerResponse found');
      return null;
    }

    let playerResp: Record<string, unknown>;
    try {
      playerResp = JSON.parse(match[1]);
    } catch {
      console.error('[Storyboard] Failed to parse player response JSON');
      return null;
    }

    const spec = (playerResp as any)?.storyboards?.playerStoryboardSpecRenderer?.spec as string | undefined;
    if (!spec) {
      console.error('[Storyboard] No storyboard spec in player response');
      return null;
    }

    return parseStoryboardSpec(spec, videoId);
  } catch (error) {
    console.error('[Storyboard] Error fetching storyboard spec:', error);
    return null;
  }
}

/**
 * Parse the storyboard spec string into structured data.
 *
 * Format: base_url|level0_data|level1_data|level2_data|level3_data
 * where base_url is the template URL with $L and $N/$M placeholders
 * and each level is: width#height#count#cols#rows#intervalMs#sheetPattern#sigh
 */
function parseStoryboardSpec(spec: string, videoId: string): StoryboardSpec | null {
  // Split by | to get base URL + level entries
  const parts = spec.split('|');
  if (parts.length < 2) return null;

  const baseUrlTemplate = parts[0]; // e.g., https://i.ytimg.com/sb/VIDEO_ID/storyboard3_L$L/$N.jpg?sqp=...
  const levels: StoryboardLevel[] = [];

  for (let levelIndex = 0; levelIndex < parts.length - 1; levelIndex++) {
    const levelData = parts[levelIndex + 1];
    const fields = levelData.split('#');

    if (fields.length < 6) continue;

    const width = parseInt(fields[0], 10);
    const height = parseInt(fields[1], 10);
    const totalFrames = parseInt(fields[2], 10);
    const cols = parseInt(fields[3], 10);
    const rows = parseInt(fields[4], 10);
    const intervalMs = parseInt(fields[5], 10);
    const sheetPattern = fields[6] || '$M'; // "$M" or "M$M" or "default"
    const sigh = fields[7] || '';

    if (isNaN(width) || isNaN(height) || isNaN(totalFrames)) continue;

    // Build the URL for this level
    let levelUrl = baseUrlTemplate
      .replace('$L', String(levelIndex));

    // If there's a sigh parameter, append it
    if (sigh) {
      levelUrl = levelUrl + '&sigh=' + sigh;
    }

    // Replace $N with $M pattern if needed
    if (sheetPattern === 'default' || sheetPattern === '$N') {
      // L0 uses $N in the base URL already
      levelUrl = levelUrl.replace('$N', '$M');
    } else if (sheetPattern.includes('$M')) {
      // L1-L3 use M$M pattern — replace $N with $M (sheet index)
      levelUrl = levelUrl.replace('$N', sheetPattern.replace('$M', '$M'));
    }

    levels.push({
      baseUrl: levelUrl,
      width,
      height,
      totalFrames,
      cols,
      rows,
      intervalMs,
    });
  }

  if (levels.length === 0) return null;

  return { levels, videoId };
}

// ═══════════════════════════════════════════════════════════════════
// Frame Extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the best (highest resolution) storyboard level that has
 * timed frames (intervalMs > 0). L0 is untimed, so skip it.
 */
function getBestLevel(spec: StoryboardSpec): StoryboardLevel | null {
  // Filter to levels with timed frames, sort by resolution (highest first)
  const timedLevels = spec.levels.filter(l => l.intervalMs > 0);
  if (timedLevels.length === 0) return null;

  timedLevels.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return timedLevels[0];
}

/**
 * Calculate which sprite sheet and position a timestamp maps to.
 */
function getFramePosition(level: StoryboardLevel, timestampMs: number): {
  sheetIndex: number;
  col: number;
  row: number;
  frameInSheet: number;
} {
  if (level.intervalMs <= 0) {
    return { sheetIndex: 0, col: 0, row: 0, frameInSheet: 0 };
  }

  const frameIndex = Math.floor(timestampMs / level.intervalMs);
  const clampedIndex = Math.max(0, Math.min(frameIndex, level.totalFrames - 1));

  const framesPerSheet = level.cols * level.rows;
  const sheetIndex = Math.floor(clampedIndex / framesPerSheet);
  const frameInSheet = clampedIndex % framesPerSheet;
  const row = Math.floor(frameInSheet / level.cols);
  const col = frameInSheet % level.cols;

  return { sheetIndex, col, row, frameInSheet };
}

/**
 * Download a sprite sheet and crop a single frame from it.
 */
async function cropFrameFromSheet(
  sheetUrl: string,
  col: number,
  row: number,
  frameWidth: number,
  frameHeight: number,
): Promise<Buffer | null> {
  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      console.warn(`[Storyboard] Failed to fetch sprite sheet: ${response.status} ${sheetUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Crop the individual frame from the sprite sheet
    const cropped = await sharp(buffer)
      .extract({
        left: col * frameWidth,
        top: row * frameHeight,
        width: frameWidth,
        height: frameHeight,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return cropped;
  } catch (error) {
    console.error('[Storyboard] Error cropping frame:', error);
    return null;
  }
}

/**
 * Format timestamp from milliseconds.
 */
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
 * Extract real video frames at specific timestamps.
 *
 * This downloads YouTube's storyboard sprite sheets and crops
 * individual frames at the requested timestamps.
 *
 * @param videoId YouTube video ID
 * @param timestamps Array of timestamps in milliseconds to extract
 * @returns Array of extracted frames with base64 data
 */
export async function extractRealFrames(
  videoId: string,
  timestamps: number[],
): Promise<ExtractedFrame[]> {
  if (timestamps.length === 0) return [];

  // 1. Fetch storyboard spec
  const spec = await fetchStoryboardSpec(videoId);
  if (!spec) {
    console.warn('[Storyboard] Could not fetch storyboard spec, falling back to thumbnails');
    return [];
  }

  // 2. Get the best resolution level
  const bestLevel = getBestLevel(spec);
  if (!bestLevel) {
    console.warn('[Storyboard] No timed storyboard levels available');
    return [];
  }
  const level: StoryboardLevel = bestLevel;

  console.log(`[Storyboard] Using L${spec.levels.indexOf(level)} (${level.width}x${level.height}, ${level.totalFrames} frames, ${level.intervalMs}ms interval)`);

  // 3. Deduplicate: group timestamps that map to the same frame
  const frameMap = new Map<string, { position: ReturnType<typeof getFramePosition>; timestamps: number[] }>();

  for (const ts of timestamps) {
    const pos = getFramePosition(level, ts);
    const key = `${pos.sheetIndex}-${pos.col}-${pos.row}`;

    if (frameMap.has(key)) {
      frameMap.get(key)!.timestamps.push(ts);
    } else {
      frameMap.set(key, { position: pos, timestamps: [ts] });
    }
  }

  // 4. Cache downloaded sprite sheets to avoid re-downloading
  const sheetCache = new Map<number, Buffer | null>();

  async function getSheet(sheetIndex: number): Promise<Buffer | null> {
    if (sheetCache.has(sheetIndex)) return sheetCache.get(sheetIndex) || null;

    const sheetUrl = level.baseUrl.replace('$M', String(sheetIndex));
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        console.warn(`[Storyboard] Sheet ${sheetIndex} fetch failed: ${response.status}`);
        sheetCache.set(sheetIndex, null);
        return null;
      }
      const buf = Buffer.from(await response.arrayBuffer());
      sheetCache.set(sheetIndex, buf);
      return buf;
    } catch (error) {
      console.warn(`[Storyboard] Sheet ${sheetIndex} fetch error:`, error);
      sheetCache.set(sheetIndex, null);
      return null;
    }
  }

  // 5. Extract each unique frame
  const results: ExtractedFrame[] = [];

  for (const [, { position, timestamps: frameTimes }] of frameMap) {
    const sheet = await getSheet(position.sheetIndex);
    if (!sheet) continue;

    try {
      // Crop the frame, then upscale 2x for better GPT-4o vision analysis
      const upscaleWidth = level.width * 2;
      const upscaleHeight = level.height * 2;

      const cropped = await sharp(sheet)
        .extract({
          left: position.col * level.width,
          top: position.row * level.height,
          width: level.width,
          height: level.height,
        })
        .resize(upscaleWidth, upscaleHeight, { kernel: 'lanczos3' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const base64 = cropped.toString('base64');

      // Create a result for the first timestamp (representative)
      const ts = frameTimes[0];
      results.push({
        base64: `data:image/jpeg;base64,${base64}`,
        timestampMs: ts,
        timestampFormatted: formatTimestamp(ts),
        width: upscaleWidth,
        height: upscaleHeight,
      });
    } catch (error) {
      console.warn(`[Storyboard] Failed to crop frame at sheet ${position.sheetIndex}:`, error);
    }
  }

  // Sort by timestamp
  results.sort((a, b) => a.timestampMs - b.timestampMs);

  console.log(`[Storyboard] Extracted ${results.length} frames from ${sheetCache.size} sprite sheets`);

  return results;
}

/**
 * Extract evenly-spaced frames from a video.
 * Useful when we don't have specific timestamps (e.g., no transcript).
 *
 * @param videoId YouTube video ID
 * @param videoDurationMs Total video duration in milliseconds
 * @param count Number of frames to extract (default: 8)
 */
export async function extractEvenlySpacedFrames(
  videoId: string,
  videoDurationMs: number,
  count: number = 8,
): Promise<ExtractedFrame[]> {
  if (videoDurationMs <= 0) return [];

  // Generate evenly-spaced timestamps (skip first and last 5%)
  const startMs = Math.floor(videoDurationMs * 0.05);
  const endMs = Math.floor(videoDurationMs * 0.95);
  const step = (endMs - startMs) / (count - 1);

  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    timestamps.push(Math.floor(startMs + step * i));
  }

  return extractRealFrames(videoId, timestamps);
}

// ═══════════════════════════════════════════════════════════════════
// High-Resolution Frame Extraction (yt-dlp + ffmpeg)
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract high-resolution frames at specific timestamps using yt-dlp + ffmpeg.
 * Unlike storyboard extraction (320x180), this gives us 720p frames from
 * the actual video stream — essential for reading text overlays like
 * "A.I. ONE MILLED 7T" that are invisible at storyboard resolution.
 *
 * Uses yt-dlp --get-url to get a streaming URL, then ffmpeg -ss to seek
 * directly to each timestamp without downloading the full video.
 *
 * @param videoId YouTube video ID
 * @param timestamps Array of timestamps in milliseconds
 * @returns High-res extracted frames (720p)
 */
export async function extractHighResFrames(
  videoId: string,
  timestamps: number[],
): Promise<ExtractedFrame[]> {
  if (timestamps.length === 0) return [];

  const tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'teed-yt-hires-'));
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Strategy: try section download first (fast), fall back to full download
    // YouTube's HLS/SSAP experiment often causes --download-sections to produce
    // empty files, so full download fallback is essential.

    const results: ExtractedFrame[] = [];

    // ── Attempt 1: Section-based download (fast, one clip per cluster) ──
    const clusters = clusterTimestamps(timestamps, 30_000);
    console.log(`[HiRes] ${timestamps.length} timestamps → ${clusters.length} clusters`);

    let sectionDownloadWorked = false;

    // Test with the first cluster
    const testCluster = clusters[0];
    const testMinSec = Math.max(0, Math.floor(Math.min(...testCluster) / 1000) - 5);
    const testMaxSec = Math.ceil(Math.max(...testCluster) / 1000) + 5;
    const testPath = path.join(tmpDir, 'test_clip.mp4');

    try {
      await execPromiseLocal('yt-dlp', [
        '-f', 'bestvideo[height<=720][ext=mp4]/bestvideo[height<=720]/best[height<=720]',
        '--download-sections', `*${testMinSec}-${testMaxSec}`,
        '--force-keyframes-at-cuts',
        '-o', testPath,
        '--no-playlist',
        '--quiet',
        videoUrl,
      ], 60_000);

      const stat = await fsPromises.stat(testPath);
      sectionDownloadWorked = stat.size > 1000;
    } catch {
      // Section download failed
    }

    try { await fsPromises.unlink(testPath); } catch { /* ignore */ }

    if (sectionDownloadWorked) {
      // Section downloads work — use cluster approach (faster)
      console.log('[HiRes] Section download works, using cluster approach');
      return await extractFramesViaClusters(videoId, timestamps, clusters, tmpDir);
    }

    // ── Attempt 2: Full video download (slower but reliable) ──
    // HLS/SSAP videos can't do section downloads. Download the full video
    // at 480p (smaller/faster than 720p) and extract all frames from it.
    console.log('[HiRes] Section download failed, downloading full video at 480p...');

    const fullVideoPath = path.join(tmpDir, 'full_video.mp4');

    try {
      await execPromiseLocal('yt-dlp', [
        '-f', 'bestvideo[height<=480][ext=mp4]/bestvideo[height<=480]/best[height<=480]',
        '-o', fullVideoPath,
        '--no-playlist',
        '--quiet',
        videoUrl,
      ], 300_000); // 5 min timeout for full download
    } catch (err) {
      console.error('[HiRes] Full video download failed:', err instanceof Error ? err.message.split('\n')[0] : err);
      return [];
    }

    // Verify download
    try {
      const stat = await fsPromises.stat(fullVideoPath);
      if (stat.size < 10_000) {
        console.error(`[HiRes] Downloaded file too small (${stat.size} bytes)`);
        return [];
      }
      console.log(`[HiRes] Downloaded full video (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
    } catch {
      console.error('[HiRes] Full video file not found');
      return [];
    }

    // Extract frames at each requested timestamp
    for (const tsMs of timestamps) {
      const tsSec = Math.floor(tsMs / 1000);
      const outPath = path.join(tmpDir, `frame_${tsSec}.jpg`);

      try {
        await execPromiseLocal('ffmpeg', [
          '-ss', String(tsSec),
          '-i', fullVideoPath,
          '-frames:v', '1',
          '-q:v', '2',
          '-vf', 'scale=1280:-1',
          '-y',
          outPath,
        ], 30_000);

        const stat = await fsPromises.stat(outPath);
        if (stat.size < 500) continue; // Skip empty frames

        const buffer = await fsPromises.readFile(outPath);
        const base64 = buffer.toString('base64');

        results.push({
          base64: `data:image/jpeg;base64,${base64}`,
          timestampMs: tsMs,
          timestampFormatted: formatTimestamp(tsMs),
          width: 1280,
          height: 720,
        });
      } catch (err) {
        console.warn(`[HiRes] Failed frame at ${tsSec}s:`, err instanceof Error ? err.message.split('\n')[0] : err);
      }
    }

    console.log(`[HiRes] Extracted ${results.length}/${timestamps.length} high-res frames from full video`);
    return results;
  } catch (error) {
    console.error('[HiRes] High-res frame extraction failed:', error instanceof Error ? error.message : error);
    return [];
  } finally {
    try {
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }
  }
}

/** Extract frames using the fast cluster/section-download approach */
async function extractFramesViaClusters(
  videoId: string,
  timestamps: number[],
  clusters: number[][],
  tmpDir: string,
): Promise<ExtractedFrame[]> {
  const results: ExtractedFrame[] = [];
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  for (let ci = 0; ci < clusters.length; ci++) {
    const cluster = clusters[ci];
    const clusterMinSec = Math.max(0, Math.floor(Math.min(...cluster) / 1000) - 5);
    const clusterMaxSec = Math.ceil(Math.max(...cluster) / 1000) + 5;
    const clipDuration = clusterMaxSec - clusterMinSec;
    const videoPath = path.join(tmpDir, `clip_${ci}.mp4`);

    console.log(`[HiRes] Cluster ${ci + 1}/${clusters.length}: downloading ${clusterMinSec}s-${clusterMaxSec}s (${clipDuration}s)`);

    try {
      await execPromiseLocal('yt-dlp', [
        '-f', 'bestvideo[height<=720][ext=mp4]/bestvideo[height<=720]/best[height<=720]',
        '--download-sections', `*${clusterMinSec}-${clusterMaxSec}`,
        '--force-keyframes-at-cuts',
        '-o', videoPath,
        '--no-playlist',
        '--quiet',
        videoUrl,
      ], 120_000);
    } catch (err) {
      console.warn(`[HiRes] Cluster ${ci + 1} download failed:`, err instanceof Error ? err.message.split('\n')[0] : err);
      continue;
    }

    try {
      const stat = await fsPromises.stat(videoPath);
      if (stat.size < 1000) {
        console.warn(`[HiRes] Cluster ${ci + 1} file too small (${stat.size} bytes), skipping`);
        continue;
      }
    } catch {
      console.warn(`[HiRes] Cluster ${ci + 1} file not found`);
      continue;
    }

    for (const tsMs of cluster) {
      const tsSec = Math.max(0, Math.floor(tsMs / 1000) - clusterMinSec);
      const outPath = path.join(tmpDir, `frame_${Math.floor(tsMs / 1000)}.jpg`);

      try {
        await execPromiseLocal('ffmpeg', [
          '-ss', String(tsSec),
          '-i', videoPath,
          '-frames:v', '1',
          '-q:v', '2',
          '-vf', 'scale=1280:-1',
          '-y',
          outPath,
        ], 30_000);

        const buffer = await fsPromises.readFile(outPath);
        const base64 = buffer.toString('base64');

        results.push({
          base64: `data:image/jpeg;base64,${base64}`,
          timestampMs: tsMs,
          timestampFormatted: formatTimestamp(tsMs),
          width: 1280,
          height: 720,
        });
      } catch (err) {
        console.warn(`[HiRes] Failed frame at ${Math.floor(tsMs / 1000)}s:`, err instanceof Error ? err.message.split('\n')[0] : err);
      }
    }

    try { await fsPromises.unlink(videoPath); } catch { /* ignore */ }
  }

  console.log(`[HiRes] Extracted ${results.length}/${timestamps.length} high-res frames`);
  return results;
}

/** Group timestamps into clusters where adjacent timestamps are within windowMs of each other. */
function clusterTimestamps(timestamps: number[], windowMs: number): number[][] {
  const sorted = [...timestamps].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let current: number[] = [];

  for (const ts of sorted) {
    if (current.length === 0 || ts - current[current.length - 1] <= windowMs) {
      current.push(ts);
    } else {
      clusters.push(current);
      current = [ts];
    }
  }
  if (current.length > 0) clusters.push(current);

  return clusters;
}

/** Promise wrapper for execFile (local to this module) */
function execPromiseLocal(command: string, args: string[], timeoutMs = 30_000): Promise<string> {
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
