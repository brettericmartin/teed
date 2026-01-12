/**
 * YouTube Transcript Extraction
 *
 * Fetches transcripts from YouTube videos for product extraction.
 */

import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  text: string;
  offset: number; // Start time in ms
  duration: number; // Duration in ms
}

export interface TranscriptResult {
  videoId: string;
  transcript: string; // Full text
  segments: TranscriptSegment[];
  language: string;
  success: boolean;
  error?: string;
}

/**
 * Extract transcript from a YouTube video
 */
export async function getYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptData || transcriptData.length === 0) {
      return {
        videoId,
        transcript: '',
        segments: [],
        language: 'en',
        success: false,
        error: 'No transcript available',
      };
    }

    const segments: TranscriptSegment[] = transcriptData.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }));

    const fullTranscript = segments.map((s) => s.text).join(' ');

    return {
      videoId,
      transcript: fullTranscript,
      segments,
      language: 'en', // Default, could be detected
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Common errors:
    // - Transcript disabled
    // - Video unavailable
    // - No captions available
    return {
      videoId,
      transcript: '',
      segments: [],
      language: 'en',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
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
 * Get transcript from YouTube URL
 */
export async function getTranscriptFromUrl(url: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return {
      videoId: '',
      transcript: '',
      segments: [],
      language: 'en',
      success: false,
      error: 'Invalid YouTube URL',
    };
  }

  return getYouTubeTranscript(videoId);
}

/**
 * Extract product mentions from transcript using AI
 * This is a helper that prepares the transcript for AI analysis
 */
export function prepareTranscriptForAnalysis(
  transcript: string,
  brandKeywords: string[]
): {
  transcript: string;
  potentialMentions: string[];
} {
  // Find brand keyword mentions
  const potentialMentions: string[] = [];
  const lowerTranscript = transcript.toLowerCase();

  for (const brand of brandKeywords) {
    if (lowerTranscript.includes(brand.toLowerCase())) {
      potentialMentions.push(brand);
    }
  }

  return {
    transcript: transcript.slice(0, 15000), // Limit for AI context
    potentialMentions,
  };
}

/**
 * Find timestamps where specific products are mentioned
 */
export function findProductTimestamps(
  segments: TranscriptSegment[],
  productName: string
): { offset: number; text: string }[] {
  const mentions: { offset: number; text: string }[] = [];
  const lowerProduct = productName.toLowerCase();

  for (const segment of segments) {
    if (segment.text.toLowerCase().includes(lowerProduct)) {
      mentions.push({
        offset: segment.offset,
        text: segment.text,
      });
    }
  }

  return mentions;
}

/**
 * Format milliseconds to readable timestamp
 */
export function formatTimestamp(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
