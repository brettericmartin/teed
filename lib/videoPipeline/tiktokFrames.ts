/**
 * TikTok Frame Extraction
 *
 * Downloads TikTok videos via yt-dlp and extracts frames with ffmpeg.
 * Returns high-quality 720p portrait frames as base64 JPEG.
 *
 * Requirements: yt-dlp, ffmpeg must be installed on the system.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TikTokMetadata {
  videoId: string;
  title: string;
  description: string;
  creator: string;
  creatorUrl: string;
  duration: number;          // seconds
  thumbnailUrl: string;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string;       // YYYYMMDD
}

export interface ExtractedTikTokFrame {
  base64: string;            // data:image/jpeg;base64,...
  timestampMs: number;
  timestampFormatted: string;
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════════════
// URL Detection
// ═══════════════════════════════════════════════════════════════════

/** Check if a URL is a TikTok video URL */
export function isTikTokUrl(url: string): boolean {
  return /tiktok\.com/i.test(url);
}

// ═══════════════════════════════════════════════════════════════════
// Metadata Extraction (via yt-dlp --dump-json)
// ═══════════════════════════════════════════════════════════════════

/** Extract video metadata from TikTok without downloading */
export async function fetchTikTokMetadata(url: string): Promise<TikTokMetadata | null> {
  try {
    const json = await execPromise('yt-dlp', ['--dump-json', '--no-download', url]);
    const data = JSON.parse(json);

    return {
      videoId: data.id || data.display_id || '',
      title: data.title || data.fulltitle || '',
      description: data.description || '',
      creator: data.uploader || data.channel || '',
      creatorUrl: data.uploader_url || data.channel_url || '',
      duration: data.duration || 0,
      thumbnailUrl: data.thumbnail || '',
      viewCount: data.view_count,
      likeCount: data.like_count,
      uploadDate: data.upload_date,
    };
  } catch (error) {
    console.error('[TikTok] Failed to fetch metadata:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Video Download + Frame Extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Download a TikTok video and extract frames at regular intervals.
 *
 * @param url TikTok video URL
 * @param intervalSeconds Seconds between frames (default: 3)
 * @param maxFrames Maximum frames to extract (default: 30)
 * @returns Array of extracted frames as base64 JPEG
 */
export async function downloadAndExtractFrames(
  url: string,
  intervalSeconds: number = 3,
  maxFrames: number = 30,
): Promise<ExtractedTikTokFrame[]> {
  // Create temp directory for this extraction
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'teed-tiktok-'));

  try {
    const videoPath = path.join(tmpDir, 'video.mp4');

    // 1. Download video via yt-dlp (prefer h264 720p for compatibility)
    console.log('[TikTok] Downloading video...');
    await execPromise('yt-dlp', [
      '-f', 'h264_720p_1851715-0/h264_720p_1851715-1/h264_540p_571263-0/best[ext=mp4]',
      '-o', videoPath,
      '--no-playlist',
      '--quiet',
      url,
    ]);

    // Verify download
    try {
      await fs.access(videoPath);
    } catch {
      console.error('[TikTok] Video download failed - file not found');
      return [];
    }

    // 2. Extract frames with ffmpeg
    console.log(`[TikTok] Extracting frames every ${intervalSeconds}s...`);
    const framePattern = path.join(tmpDir, 'frame_%04d.jpg');

    await execPromise('ffmpeg', [
      '-i', videoPath,
      '-vf', `fps=1/${intervalSeconds},scale=720:-1`,
      '-q:v', '3',
      '-y',
      framePattern,
    ]);

    // 3. Read extracted frames
    const files = (await fs.readdir(tmpDir))
      .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort();

    const framesToRead = files.slice(0, maxFrames);
    const results: ExtractedTikTokFrame[] = [];

    for (let i = 0; i < framesToRead.length; i++) {
      const filePath = path.join(tmpDir, framesToRead[i]);
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');

      const timestampMs = i * intervalSeconds * 1000;

      results.push({
        base64: `data:image/jpeg;base64,${base64}`,
        timestampMs,
        timestampFormatted: formatTimestamp(timestampMs),
        width: 720,
        height: 1280,
      });
    }

    console.log(`[TikTok] Extracted ${results.length} frames`);
    return results;

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Format milliseconds to M:SS or H:MM:SS */
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

/** Promise wrapper for execFile */
function execPromise(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      maxBuffer: 50 * 1024 * 1024, // 50MB for yt-dlp JSON
      timeout: 120_000,             // 2 minute timeout
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${error.message}\nstderr: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
