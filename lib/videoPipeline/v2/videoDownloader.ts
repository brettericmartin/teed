/**
 * Unified Video Downloader
 *
 * Downloads video at 720p using yt-dlp.
 * Works for YouTube, TikTok, Instagram, X — any platform yt-dlp supports.
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { VideoDownloadResult } from './types';

function execPromise(command: string, args: string[], timeoutMs = 300_000): Promise<string> {
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

/**
 * Download a video at 720p using yt-dlp.
 * Returns the path to the downloaded file and metadata.
 *
 * Caller is responsible for cleaning up `tempDir` when done.
 */
export async function downloadVideo(videoUrl: string): Promise<VideoDownloadResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'teed-v2-'));
  const videoPath = path.join(tempDir, 'video.mp4');

  console.log(`[V2 Download] Downloading: ${videoUrl}`);

  try {
    // Download at 720p max — balances quality vs file size
    await execPromise('yt-dlp', [
      '-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
      '--merge-output-format', 'mp4',
      '-o', videoPath,
      '--no-playlist',
      '--quiet',
      '--no-warnings',
      videoUrl,
    ], 600_000); // 10 minute timeout for large videos
  } catch (err) {
    // Clean up on failure
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Video download failed: ${err instanceof Error ? err.message.split('\n')[0] : err}`);
  }

  // Verify download
  const stat = await fs.stat(videoPath);
  if (stat.size < 10_000) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Downloaded file too small (${stat.size} bytes)`);
  }

  console.log(`[V2 Download] Downloaded ${(stat.size / 1024 / 1024).toFixed(1)}MB`);

  // Get video metadata using ffprobe
  let durationSeconds = 0;
  let width = 1280;
  let height = 720;

  try {
    const probeOutput = await execPromise('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ], 30_000);

    const probe = JSON.parse(probeOutput);

    // Get duration
    durationSeconds = parseFloat(probe.format?.duration || '0');

    // Get video stream dimensions
    const videoStream = probe.streams?.find(
      (s: { codec_type?: string }) => s.codec_type === 'video'
    );
    if (videoStream) {
      width = videoStream.width || 1280;
      height = videoStream.height || 720;
    }
  } catch {
    console.warn('[V2 Download] ffprobe failed, using defaults');
  }

  console.log(`[V2 Download] Video: ${width}x${height}, ${durationSeconds.toFixed(1)}s`);

  return { videoPath, durationSeconds, width, height, tempDir };
}
