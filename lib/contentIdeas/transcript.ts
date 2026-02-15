/**
 * YouTube Transcript Fetching Module
 * Fetches auto-generated captions from YouTube videos
 */

import { YoutubeTranscript } from 'youtube-transcript';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TranscriptSegment {
  text: string;
  offset: number;      // Start time in milliseconds
  duration: number;    // Duration in milliseconds
}

export interface TranscriptResult {
  success: boolean;
  transcript: string;           // Full transcript text
  segments: TranscriptSegment[];  // Timestamped segments
  language: string | null;
  error?: string;
}

export interface ProductMention {
  productHint: string;         // The product name/description mentioned
  timestamp: number;           // When it was mentioned (ms)
  timestampFormatted: string;  // Human readable "2:34"
  context: string;             // Surrounding text for context
  confidence: 'high' | 'medium' | 'low';
}

// ═══════════════════════════════════════════════════════════════════
// Transcript Fetching
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch YouTube transcript for a video.
 * Tries the npm package first, then falls back to Innertube API.
 *
 * @param videoId - YouTube video ID (e.g., "dQw4w9WgXcQ")
 * @returns TranscriptResult with transcript text and segments
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  // ── Attempt 1: npm youtube-transcript package ──
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    });

    if (transcriptItems && transcriptItems.length > 0) {
      const segments: TranscriptSegment[] = transcriptItems.map(item => ({
        text: item.text,
        offset: Math.round(item.offset * 1000),
        duration: Math.round(item.duration * 1000),
      }));
      const transcript = segments.map(s => s.text).join(' ');

      console.log(`[Transcript] npm package returned ${segments.length} segments`);
      return { success: true, transcript, segments, language: 'en' };
    }

    console.log('[Transcript] npm package returned 0 segments, trying Innertube fallback...');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Hard failures — don't bother with fallback
    if (msg.includes('Transcript is disabled') || msg.includes('No transcript')) {
      return {
        success: false, transcript: '', segments: [], language: null,
        error: 'Transcripts are disabled for this video',
      };
    }
    console.log(`[Transcript] npm package failed (${msg}), trying Innertube fallback...`);
  }

  // ── Attempt 2: yt-dlp with iOS client (bypasses timedtext API issues) ──
  try {
    const segments = await fetchTranscriptWithYtDlp(videoId);

    if (segments.length > 0) {
      const transcript = segments.map(s => s.text).join(' ');
      console.log(`[Transcript] yt-dlp fallback returned ${segments.length} segments`);
      return { success: true, transcript, segments, language: 'en' };
    }

    return {
      success: false, transcript: '', segments: [], language: null,
      error: 'No transcript available for this video (both methods failed)',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Transcript] yt-dlp fallback also failed:', msg);
    return {
      success: false, transcript: '', segments: [], language: null,
      error: `Failed to fetch transcript: ${msg}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// yt-dlp Transcript Fallback
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch transcript using yt-dlp with iOS player client.
 * YouTube's web timedtext API often returns empty responses for
 * auto-generated captions, but the iOS client endpoint works reliably.
 */
async function fetchTranscriptWithYtDlp(videoId: string): Promise<TranscriptSegment[]> {
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `yt-transcript-${videoId}`);
  const subtitleFile = `${outputPath}.en.json3`;

  try {
    // Download auto-generated English subtitles in json3 format
    await execFileAsync('yt-dlp', [
      '--write-auto-sub',
      '--sub-lang', 'en',
      '--sub-format', 'json3',
      '--skip-download',
      '--extractor-args', 'youtube:player_client=ios',
      '-o', outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 20000 });

    // Read the json3 subtitle file
    if (!fs.existsSync(subtitleFile)) {
      return [];
    }

    const raw = fs.readFileSync(subtitleFile, 'utf8');
    const data = JSON.parse(raw);

    // json3 format: { events: [{ tStartMs, dDurationMs, segs: [{ utf8 }] }] }
    const events = (data.events || []).filter(
      (e: { segs?: unknown[] }) => Array.isArray(e.segs) && e.segs.length > 0
    );

    const segments: TranscriptSegment[] = events.map(
      (e: { tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }) => ({
        text: (e.segs || []).map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim(),
        offset: e.tStartMs || 0,
        duration: e.dDurationMs || 0,
      })
    ).filter((s: TranscriptSegment) => s.text.length > 0);

    return segments;
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(subtitleFile); } catch { /* ignore */ }
  }
}

/**
 * Format timestamp from milliseconds to human-readable "M:SS" or "H:MM:SS"
 */
export function formatTimestamp(ms: number): string {
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
 * Get transcript text around a specific timestamp
 */
export function getContextAroundTimestamp(
  segments: TranscriptSegment[],
  timestampMs: number,
  windowMs: number = 30000 // 30 seconds
): string {
  const startTime = timestampMs - windowMs / 2;
  const endTime = timestampMs + windowMs / 2;

  const relevantSegments = segments.filter(
    s => s.offset >= startTime && s.offset <= endTime
  );

  return relevantSegments.map(s => s.text).join(' ');
}

// ═══════════════════════════════════════════════════════════════════
// Product Mention Extraction from Transcript
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract potential product mentions from transcript
 * This is a lightweight extraction - actual identification happens via LLM
 */
export function extractProductMentionsFromTranscript(
  segments: TranscriptSegment[],
  vertical: string
): ProductMention[] {
  const mentions: ProductMention[] = [];

  // Vertical-specific brand patterns
  const brandPatterns: Record<string, RegExp[]> = {
    golf: [
      /\b(titleist|taylormade|callaway|ping|cobra|srixon|mizuno|cleveland|vokey|scotty cameron|odyssey|bridgestone|tour edge)\b/gi,
      /\b(pro v1|tp5|chrome soft|z-star|avx)\b/gi, // Ball brands
      /\b(driver|putter|iron|wedge|hybrid|fairway|wood|3w|5w|7w)\b/gi,
    ],
    camera: [
      /\b(sony|canon|nikon|fuji|fujifilm|panasonic|lumix|blackmagic|red|arri|leica|hasselblad|dji|zhiyun|gopro)\b/gi,
      /\b(a7|a7s|a7r|a7c|a9|r5|r6|r7|r8|z8|z9|z6|z7|xt|xh|xs|gh5|gh6|s5|bmpcc)\b/gi,
      /\b(lens|camera|body|gimbal|tripod|filter|nd|cage|monitor)\b/gi,
    ],
    tech: [
      /\b(apple|samsung|google|microsoft|sony|lg|dell|hp|lenovo|asus|razer|logitech)\b/gi,
      /\b(iphone|ipad|macbook|airpods|pixel|galaxy|surface|thinkpad)\b/gi,
      /\b(phone|laptop|tablet|headphones|earbuds|keyboard|mouse|monitor)\b/gi,
    ],
    desk: [
      /\b(herman miller|steelcase|secretlab|ikea|autonomous|uplift|jarvis|branch|fully)\b/gi,
      /\b(aeron|embody|leap|gesture|titan|markus)\b/gi,
      /\b(desk|chair|monitor arm|webcam|mic|microphone|light|lamp)\b/gi,
    ],
    edc: [
      /\b(benchmade|spyderco|kershaw|civivi|crkt|microtech|chris reeve|hitch & timber|trayvax|ridge|secrid)\b/gi,
      /\b(knife|wallet|flashlight|pen|watch|multitool|keychain)\b/gi,
    ],
    gaming: [
      /\b(nvidia|amd|intel|corsair|razer|logitech|steelseries|hyperx|asus rog|msi)\b/gi,
      /\b(rtx|rx|core|ryzen|geforce|radeon)\b/gi,
      /\b(gpu|cpu|keyboard|mouse|headset|monitor|pc|console|controller)\b/gi,
    ],
    music: [
      /\b(fender|gibson|taylor|martin|yamaha|roland|korg|moog|universal audio|focusrite|shure|sennheiser|audio-technica)\b/gi,
      /\b(guitar|synth|keyboard|bass|amp|pedal|interface|mic|headphones|monitors)\b/gi,
    ],
    fitness: [
      /\b(rogue|eleiko|rep fitness|titan|concept2|peloton|bowflex|nordictrack|garmin|whoop|oura)\b/gi,
      /\b(barbell|dumbbell|kettlebell|rack|bench|treadmill|bike|rower|watch|band)\b/gi,
    ],
  };

  // Get patterns for this vertical (fall back to generic if not found)
  const patterns = brandPatterns[vertical.toLowerCase()] || [];

  // Also include generic gear patterns
  const genericPatterns = [
    /\b(this|my|the|using|use|got|bought|switched to|upgraded to)\s+([A-Z][a-zA-Z0-9\s-]{2,30})\b/g,
    /\b([A-Z][a-zA-Z]+)\s+(pro|max|plus|mini|lite|ultra|elite|mark|mk|ii|iii|iv|v|x|s|r|z)\b/gi,
  ];

  // Process each segment
  segments.forEach((segment, index) => {
    const text = segment.text;
    const contextSegments = segments.slice(
      Math.max(0, index - 2),
      Math.min(segments.length, index + 3)
    );
    const context = contextSegments.map(s => s.text).join(' ');

    // Check vertical-specific patterns
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        mentions.push({
          productHint: match[0],
          timestamp: segment.offset,
          timestampFormatted: formatTimestamp(segment.offset),
          context,
          confidence: 'high',
        });
      }
    }

    // Check generic patterns with lower confidence
    for (const pattern of genericPatterns) {
      // Reset pattern lastIndex for each segment
      pattern.lastIndex = 0;
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        // Avoid duplicates from brand patterns
        const productHint = match[2] || match[0];
        const alreadyFound = mentions.some(
          m => m.timestamp === segment.offset &&
               m.productHint.toLowerCase().includes(productHint.toLowerCase())
        );

        if (!alreadyFound && productHint.length > 3) {
          mentions.push({
            productHint,
            timestamp: segment.offset,
            timestampFormatted: formatTimestamp(segment.offset),
            context,
            confidence: 'medium',
          });
        }
      }
    }
  });

  // Deduplicate by productHint (keep first occurrence)
  const seen = new Set<string>();
  const deduplicated = mentions.filter(m => {
    const key = m.productHint.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduplicated;
}

// ═══════════════════════════════════════════════════════════════════
// Content Type Detection from Transcript
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze transcript to help detect content type
 * Returns signals that indicate whether this is a collection/roundup video
 */
export function analyzeTranscriptForContentType(transcript: string): {
  isLikelyCollection: boolean;
  signals: string[];
  estimatedProductCount: number;
} {
  const signals: string[] = [];
  const transcriptLower = transcript.toLowerCase();

  // Patterns that indicate collection/roundup content
  const collectionPatterns = [
    { pattern: /let me show you each/i, signal: 'Shows items sequentially' },
    { pattern: /starting with|first up|number one/i, signal: 'Uses enumeration' },
    { pattern: /moving on to|next we have|next up/i, signal: 'Sequential transitions' },
    { pattern: /let's go through|going through/i, signal: 'Walkthrough language' },
    { pattern: /in my bag|what's in my|full setup/i, signal: 'Bag/setup context' },
    { pattern: /all (\d+|fourteen|thirteen|twelve|eleven|ten)/i, signal: 'Mentions total count' },
    { pattern: /every (club|item|piece|thing)/i, signal: 'Emphasizes completeness' },
  ];

  for (const { pattern, signal } of collectionPatterns) {
    if (pattern.test(transcriptLower)) {
      signals.push(signal);
    }
  }

  // Count product-like mentions (rough estimate)
  // Look for brand + product patterns
  const productMentionPattern = /\b(this|my|the|using)\s+[A-Z][a-zA-Z0-9\s-]{3,20}\b/g;
  const matches = transcript.match(productMentionPattern) || [];
  const estimatedProductCount = Math.min(matches.length, 30); // Cap at reasonable number

  const isLikelyCollection = signals.length >= 2 || estimatedProductCount >= 8;

  return {
    isLikelyCollection,
    signals,
    estimatedProductCount,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Raw video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Build a YouTube URL with timestamp
 */
export function buildYouTubeUrlWithTimestamp(videoId: string, timestampMs: number): string {
  const seconds = Math.floor(timestampMs / 1000);
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
}

// ═══════════════════════════════════════════════════════════════════
// Uncovered Product Detection (for APIS flow)
// ═══════════════════════════════════════════════════════════════════

export interface UncoveredProductMention {
  productHint: string;      // What was mentioned (e.g., "rangefinder", "my putter")
  mentionContext: string;   // Full sentence context
  timestamp: number;        // Milliseconds into video
  timestampFormatted: string; // "3:42"
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Find products mentioned in transcript that are NOT covered by existing items.
 * Used to identify which frames to extract for APIS processing.
 *
 * @param mentions - Product mentions extracted from transcript
 * @param existingItemNames - Names of items already created from description links
 * @returns Product mentions not covered by existing items
 */
export function findUncoveredProductsInTranscript(
  mentions: ProductMention[],
  existingItemNames: string[]
): UncoveredProductMention[] {
  // Normalize existing item names for matching
  const normalizedExisting = existingItemNames.map(name =>
    normalizeProductName(name)
  );

  // Filter out products already covered by links
  const uncovered = mentions.filter(mention => {
    const normalizedHint = normalizeProductName(mention.productHint);

    // Check if this product hint matches any existing item
    const isCovered = normalizedExisting.some(existingName => {
      // Check for substring matches in both directions
      if (existingName.includes(normalizedHint) || normalizedHint.includes(existingName)) {
        return true;
      }

      // Check for word overlap (at least 50% of words match)
      const hintWords = normalizedHint.split(/\s+/).filter(w => w.length > 2);
      const existingWords = existingName.split(/\s+/).filter(w => w.length > 2);

      if (hintWords.length === 0 || existingWords.length === 0) {
        return false;
      }

      const matchingWords = hintWords.filter(hw =>
        existingWords.some(ew => hw === ew || hw.includes(ew) || ew.includes(hw))
      );

      return matchingWords.length >= Math.min(hintWords.length, existingWords.length) * 0.5;
    });

    return !isCovered;
  });

  // Deduplicate by similar product hints
  const deduped = deduplicateByProductSimilarity(uncovered);

  // Convert to UncoveredProductMention format
  return deduped.map(m => ({
    productHint: m.productHint,
    mentionContext: m.context,
    timestamp: m.timestamp,
    timestampFormatted: m.timestampFormatted,
    confidence: m.confidence,
  }));
}

/**
 * Normalize product name for comparison
 * Removes common words and standardizes case
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['"]/g, '') // Remove quotes
    .replace(/\b(the|a|an|my|this|their|his|her|our)\b/g, '') // Remove articles/possessives
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Deduplicate product mentions by similarity
 * Keeps the earliest mention of similar products
 */
function deduplicateByProductSimilarity(mentions: ProductMention[]): ProductMention[] {
  const seen = new Map<string, ProductMention>();

  for (const mention of mentions) {
    const normalized = normalizeProductName(mention.productHint);

    // Check if we've seen a similar product
    let isDuplicate = false;
    for (const [key, existing] of seen) {
      if (key.includes(normalized) || normalized.includes(key)) {
        // Keep the one with higher confidence or earlier timestamp
        if (mention.confidence === 'high' && existing.confidence !== 'high') {
          seen.delete(key);
          seen.set(normalized, mention);
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalized, mention);
    }
  }

  return Array.from(seen.values());
}
