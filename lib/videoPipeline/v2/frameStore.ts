/**
 * Frame Store — LRU Cache for Lazy Base64 Loading
 *
 * Frames are stored as JPEG files on disk. This store lazily loads
 * them as base64 data URLs when needed, keeping at most `maxInMemory`
 * frames in memory to avoid holding 500 frames (~150MB) in RAM.
 */

import { promises as fs } from 'fs';
import type { ExtractedFrameV2, FrameStoreConfig } from './types';

interface CacheEntry {
  base64DataUrl: string;
  lastAccess: number;
}

export class FrameStore {
  private frames = new Map<string, ExtractedFrameV2>();
  private cache = new Map<string, CacheEntry>();
  private maxInMemory: number;

  constructor(config: FrameStoreConfig) {
    this.maxInMemory = config.maxInMemory;
  }

  /** Register extracted frames with the store */
  addFrames(frames: ExtractedFrameV2[]): void {
    for (const frame of frames) {
      this.frames.set(frame.id, frame);
    }
  }

  /** Get frame metadata (no base64 loading) */
  getFrameMeta(frameId: string): ExtractedFrameV2 | undefined {
    return this.frames.get(frameId);
  }

  /** Get all registered frame IDs */
  getAllFrameIds(): string[] {
    return Array.from(this.frames.keys());
  }

  /** Get all frame metadata, sorted by timestamp */
  getAllFrames(): ExtractedFrameV2[] {
    return Array.from(this.frames.values())
      .sort((a, b) => a.timestampMs - b.timestampMs);
  }

  /** Get the total number of registered frames */
  get size(): number {
    return this.frames.size;
  }

  /**
   * Load a frame as a base64 data URL.
   * Uses LRU cache to keep memory usage bounded.
   */
  async getBase64(frameId: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(frameId);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.base64DataUrl;
    }

    // Load from disk
    const frame = this.frames.get(frameId);
    if (!frame) return null;

    try {
      const buffer = await fs.readFile(frame.filePath);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Evict if at capacity
      this.evictIfNeeded();

      // Add to cache
      this.cache.set(frameId, {
        base64DataUrl: dataUrl,
        lastAccess: Date.now(),
      });

      return dataUrl;
    } catch {
      return null;
    }
  }

  /**
   * Load multiple frames as base64 data URLs.
   * More efficient than calling getBase64() in a loop.
   */
  async getBase64Batch(frameIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    for (const id of frameIds) {
      const base64 = await this.getBase64(id);
      if (base64) {
        result.set(id, base64);
      }
    }

    return result;
  }

  /** Evict least-recently-used entries if cache is full */
  private evictIfNeeded(): void {
    while (this.cache.size >= this.maxInMemory) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache) {
        if (entry.lastAccess < oldestTime) {
          oldestTime = entry.lastAccess;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /** Clean up all frame files from disk */
  async cleanup(): Promise<void> {
    for (const frame of this.frames.values()) {
      await fs.unlink(frame.filePath).catch(() => {});
    }
    this.frames.clear();
    this.cache.clear();
  }
}
