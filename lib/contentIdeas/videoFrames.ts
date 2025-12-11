/**
 * Video Frame Extraction Module
 * Extracts key frames from YouTube videos for visual product identification
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface VideoFrame {
  url: string;               // URL to the frame image
  base64?: string;           // Base64 encoded image (if fetched)
  timestamp: number;         // Timestamp in milliseconds
  timestampFormatted: string; // Human readable "2:34"
  type: 'thumbnail' | 'storyboard' | 'extracted';
  quality: 'high' | 'medium' | 'low';
}

export interface FrameExtractionResult {
  success: boolean;
  frames: VideoFrame[];
  error?: string;
  videoId: string;
  videoDurationMs?: number;
}

export interface FrameAnalysisRequest {
  frames: VideoFrame[];
  vertical: string;
  videoTitle: string;
}

// ═══════════════════════════════════════════════════════════════════
// YouTube Thumbnail URLs
// ═══════════════════════════════════════════════════════════════════

/**
 * Get available thumbnail URLs for a YouTube video
 * YouTube auto-generates these thumbnails at standard positions
 */
export function getYouTubeThumbnailUrls(videoId: string): VideoFrame[] {
  return [
    // Main thumbnail (creator-chosen or auto-generated)
    {
      url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      timestamp: 0,
      timestampFormatted: '0:00',
      type: 'thumbnail',
      quality: 'high',
    },
    // Alternative high quality
    {
      url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      timestamp: 0,
      timestampFormatted: '0:00',
      type: 'thumbnail',
      quality: 'medium',
    },
    // YouTube auto-generates thumbnails at these positions
    // These are typically at 25%, 50%, 75% of the video
    {
      url: `https://img.youtube.com/vi/${videoId}/1.jpg`,
      timestamp: -1, // Unknown exact timestamp
      timestampFormatted: '~25%',
      type: 'storyboard',
      quality: 'low',
    },
    {
      url: `https://img.youtube.com/vi/${videoId}/2.jpg`,
      timestamp: -1,
      timestampFormatted: '~50%',
      type: 'storyboard',
      quality: 'low',
    },
    {
      url: `https://img.youtube.com/vi/${videoId}/3.jpg`,
      timestamp: -1,
      timestampFormatted: '~75%',
      type: 'storyboard',
      quality: 'low',
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// Frame Extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract key frames from a YouTube video
 * Uses YouTube's thumbnail API for reliable frame extraction
 *
 * @param videoId - YouTube video ID
 * @param options - Extraction options
 */
export async function extractKeyFrames(
  videoId: string,
  options: {
    fetchAsBase64?: boolean;  // Whether to fetch and convert to base64
    includeStoryboard?: boolean; // Include the 1,2,3.jpg frames
    maxFrames?: number;
  } = {}
): Promise<FrameExtractionResult> {
  const { fetchAsBase64 = false, includeStoryboard = true, maxFrames = 5 } = options;

  try {
    // Get all available thumbnail URLs
    let frames = getYouTubeThumbnailUrls(videoId);

    // Filter to storyboard frames if requested
    if (!includeStoryboard) {
      frames = frames.filter(f => f.type === 'thumbnail');
    }

    // Limit number of frames
    frames = frames.slice(0, maxFrames);

    // Verify frames exist and optionally fetch as base64
    const verifiedFrames: VideoFrame[] = [];

    for (const frame of frames) {
      try {
        const response = await fetch(frame.url, { method: 'HEAD' });

        if (response.ok) {
          if (fetchAsBase64) {
            // Fetch the actual image and convert to base64
            const imageResponse = await fetch(frame.url);
            const arrayBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

            verifiedFrames.push({
              ...frame,
              base64: `data:${contentType};base64,${base64}`,
            });
          } else {
            verifiedFrames.push(frame);
          }
        } else if (frame.quality === 'high') {
          // Try fallback for high quality (maxresdefault might not exist)
          const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });

          if (fallbackResponse.ok) {
            verifiedFrames.push({
              ...frame,
              url: fallbackUrl,
              quality: 'medium',
            });
          }
        }
      } catch (error) {
        // Skip frames that fail to fetch
        console.warn(`[VideoFrames] Failed to verify frame ${frame.url}:`, error);
      }
    }

    if (verifiedFrames.length === 0) {
      return {
        success: false,
        frames: [],
        error: 'No frames could be extracted from this video',
        videoId,
      };
    }

    return {
      success: true,
      frames: verifiedFrames,
      videoId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VideoFrames] Frame extraction error:', errorMessage);

    return {
      success: false,
      frames: [],
      error: `Failed to extract frames: ${errorMessage}`,
      videoId,
    };
  }
}

/**
 * Extract frames at specific timestamps using video duration
 * Returns URLs for frames at percentage positions
 */
export function getFrameUrlsAtPercentages(
  videoId: string,
  videoDurationSeconds: number,
  percentages: number[] = [0, 25, 50, 75, 100]
): VideoFrame[] {
  return percentages.map(pct => {
    const timestampSeconds = Math.floor((pct / 100) * videoDurationSeconds);
    const timestampMs = timestampSeconds * 1000;

    // YouTube doesn't support arbitrary timestamp thumbnails via URL
    // But we can note what timestamp this SHOULD be at
    // For actual frame extraction, we'd need ffmpeg or a video processing service

    // Map percentages to the auto-generated thumbnails
    let url: string;
    let type: 'thumbnail' | 'storyboard' = 'storyboard';

    if (pct <= 10) {
      url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      type = 'thumbnail';
    } else if (pct <= 35) {
      url = `https://img.youtube.com/vi/${videoId}/1.jpg`;
    } else if (pct <= 60) {
      url = `https://img.youtube.com/vi/${videoId}/2.jpg`;
    } else {
      url = `https://img.youtube.com/vi/${videoId}/3.jpg`;
    }

    return {
      url,
      timestamp: timestampMs,
      timestampFormatted: formatTimestamp(timestampMs),
      type,
      quality: type === 'thumbnail' ? 'high' : 'low',
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// Frame Analysis with APIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze frames using the existing APIS object detection endpoint
 * This calls the /api/ai/detect-objects endpoint for each frame
 */
export async function analyzeFramesWithAPIS(
  frames: VideoFrame[],
  options: {
    vertical: string;
    baseUrl?: string;
  }
): Promise<{
  success: boolean;
  detectedObjects: Array<{
    frame: VideoFrame;
    objects: Array<{
      objectType: string;
      productCategory: string;
      visualCues: string[];
      certainty: 'definite' | 'likely' | 'uncertain';
      boundingDescription: string;
    }>;
  }>;
  error?: string;
}> {
  const { vertical, baseUrl = '' } = options;
  const results: Array<{
    frame: VideoFrame;
    objects: Array<{
      objectType: string;
      productCategory: string;
      visualCues: string[];
      certainty: 'definite' | 'likely' | 'uncertain';
      boundingDescription: string;
    }>;
  }> = [];

  for (const frame of frames) {
    try {
      // Prepare the image for the API
      const imageData = frame.base64 || frame.url;

      const response = await fetch(`${baseUrl}/api/ai/detect-objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          textHint: `${vertical} gear/equipment video`,
          returnQualityAssessment: true,
        }),
      });

      if (!response.ok) {
        console.warn(`[VideoFrames] APIS detection failed for frame at ${frame.timestampFormatted}`);
        continue;
      }

      const data = await response.json();

      if (data.objects && data.objects.length > 0) {
        results.push({
          frame,
          objects: data.objects,
        });
      }
    } catch (error) {
      console.warn(`[VideoFrames] Error analyzing frame:`, error);
    }
  }

  return {
    success: results.length > 0,
    detectedObjects: results,
    error: results.length === 0 ? 'No objects detected in any frames' : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Format timestamp from milliseconds to human-readable format
 */
function formatTimestamp(ms: number): string {
  if (ms < 0) return 'unknown';

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
 * Parse ISO 8601 duration (e.g., "PT10M30S") to seconds
 */
export function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Score frames for cover photo potential
 * Higher score = better for cover photo
 */
export function scoreFrameForCover(
  frame: VideoFrame,
  analysisResult?: {
    objects: Array<{
      objectType: string;
      certainty: 'definite' | 'likely' | 'uncertain';
    }>;
  }
): number {
  let score = 0;

  // Quality bonus
  if (frame.quality === 'high') score += 30;
  else if (frame.quality === 'medium') score += 20;
  else score += 10;

  // Type bonus (thumbnails are usually better composed)
  if (frame.type === 'thumbnail') score += 20;

  // If we have analysis results, score based on detected objects
  if (analysisResult?.objects) {
    const definiteObjects = analysisResult.objects.filter(o => o.certainty === 'definite').length;
    const likelyObjects = analysisResult.objects.filter(o => o.certainty === 'likely').length;

    // More definite objects = better frame
    score += definiteObjects * 15;
    score += likelyObjects * 5;

    // Ideal is 2-5 objects (not too sparse, not too cluttered)
    const totalObjects = analysisResult.objects.length;
    if (totalObjects >= 2 && totalObjects <= 5) {
      score += 20;
    }
  }

  return Math.min(score, 100);
}

/**
 * Select the best frame for a cover photo
 */
export function selectBestCoverFrame(
  frames: VideoFrame[],
  analysisResults?: Array<{
    frame: VideoFrame;
    objects: Array<{
      objectType: string;
      certainty: 'definite' | 'likely' | 'uncertain';
    }>;
  }>
): VideoFrame | null {
  if (frames.length === 0) return null;

  let bestFrame = frames[0];
  let bestScore = 0;

  for (const frame of frames) {
    const analysis = analysisResults?.find(r => r.frame.url === frame.url);
    const score = scoreFrameForCover(frame, analysis);

    if (score > bestScore) {
      bestScore = score;
      bestFrame = frame;
    }
  }

  return bestFrame;
}

// ═══════════════════════════════════════════════════════════════════
// Timestamp-Based Frame Extraction (for APIS flow)
// ═══════════════════════════════════════════════════════════════════

export interface TimestampFrameResult {
  success: boolean;
  frame: VideoFrame | null;
  error?: string;
  // Since YouTube doesn't support arbitrary timestamps via URL,
  // we return the closest available frame and note the target timestamp
  targetTimestamp: number;
  actualTimestamp: number;
}

/**
 * Get a frame at (or near) a specific timestamp for APIS processing.
 *
 * Note: YouTube doesn't support extracting frames at arbitrary timestamps via URL.
 * This function returns the closest available YouTube-generated thumbnail.
 * For exact timestamp extraction, a video processing service would be needed.
 *
 * @param videoId - YouTube video ID
 * @param timestampMs - Target timestamp in milliseconds
 * @param videoDurationMs - Optional video duration (helps select better frame)
 * @returns Frame closest to the requested timestamp
 */
export async function extractFrameAtTimestamp(
  videoId: string,
  timestampMs: number,
  videoDurationMs?: number
): Promise<TimestampFrameResult> {
  try {
    // YouTube auto-generates these thumbnails:
    // maxresdefault.jpg / hqdefault.jpg - Main thumbnail (usually at start or cover)
    // 1.jpg - Approximately at 25% of video
    // 2.jpg - Approximately at 50% of video
    // 3.jpg - Approximately at 75% of video

    // Calculate which auto-generated thumbnail is closest to our timestamp
    let selectedUrl: string;
    let actualTimestamp: number;
    let quality: 'high' | 'medium' | 'low' = 'low';

    // If we know the video duration, calculate percentage
    if (videoDurationMs && videoDurationMs > 0) {
      const percentageInVideo = (timestampMs / videoDurationMs) * 100;

      if (percentageInVideo <= 12.5) {
        // Close to start - use main thumbnail
        selectedUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        actualTimestamp = 0;
        quality = 'high';
      } else if (percentageInVideo <= 37.5) {
        // ~25% mark
        selectedUrl = `https://img.youtube.com/vi/${videoId}/1.jpg`;
        actualTimestamp = Math.floor(videoDurationMs * 0.25);
      } else if (percentageInVideo <= 62.5) {
        // ~50% mark
        selectedUrl = `https://img.youtube.com/vi/${videoId}/2.jpg`;
        actualTimestamp = Math.floor(videoDurationMs * 0.5);
      } else if (percentageInVideo <= 87.5) {
        // ~75% mark
        selectedUrl = `https://img.youtube.com/vi/${videoId}/3.jpg`;
        actualTimestamp = Math.floor(videoDurationMs * 0.75);
      } else {
        // Near end - use 3.jpg (closest we have to end)
        selectedUrl = `https://img.youtube.com/vi/${videoId}/3.jpg`;
        actualTimestamp = Math.floor(videoDurationMs * 0.75);
      }
    } else {
      // Without video duration, use a simple heuristic based on absolute time
      // Assume typical video is ~10 minutes (600 seconds)
      const assumedDurationMs = 600 * 1000;
      const roughPercentage = Math.min(100, (timestampMs / assumedDurationMs) * 100);

      if (roughPercentage <= 20) {
        selectedUrl = `https://img.youtube.com/vi/${videoId}/1.jpg`;
        actualTimestamp = -1; // Unknown
      } else if (roughPercentage <= 50) {
        selectedUrl = `https://img.youtube.com/vi/${videoId}/2.jpg`;
        actualTimestamp = -1;
      } else {
        selectedUrl = `https://img.youtube.com/vi/${videoId}/3.jpg`;
        actualTimestamp = -1;
      }
    }

    // Verify the frame exists
    try {
      const response = await fetch(selectedUrl, { method: 'HEAD' });

      if (!response.ok) {
        // Try fallback to lower quality
        if (quality === 'high') {
          selectedUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          quality = 'medium';
          const fallbackResponse = await fetch(selectedUrl, { method: 'HEAD' });
          if (!fallbackResponse.ok) {
            // Try storyboard
            selectedUrl = `https://img.youtube.com/vi/${videoId}/2.jpg`;
            quality = 'low';
          }
        }
      }
    } catch {
      // If verification fails, still return the URL (it might work when actually fetched)
      console.warn(`[VideoFrames] Could not verify frame URL: ${selectedUrl}`);
    }

    const frame: VideoFrame = {
      url: selectedUrl,
      timestamp: actualTimestamp,
      timestampFormatted: formatTimestamp(actualTimestamp >= 0 ? actualTimestamp : timestampMs),
      type: quality === 'high' ? 'thumbnail' : 'storyboard',
      quality,
    };

    return {
      success: true,
      frame,
      targetTimestamp: timestampMs,
      actualTimestamp: actualTimestamp >= 0 ? actualTimestamp : timestampMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VideoFrames] extractFrameAtTimestamp error:', errorMessage);

    return {
      success: false,
      frame: null,
      error: `Failed to extract frame: ${errorMessage}`,
      targetTimestamp: timestampMs,
      actualTimestamp: -1,
    };
  }
}

/**
 * Extract frames for multiple timestamps (batch operation)
 * Useful for processing multiple uncovered products at once
 */
export async function extractFramesAtTimestamps(
  videoId: string,
  timestamps: Array<{ timestampMs: number; hint?: string }>,
  videoDurationMs?: number
): Promise<Array<TimestampFrameResult & { hint?: string }>> {
  const results: Array<TimestampFrameResult & { hint?: string }> = [];

  // Deduplicate timestamps that would map to the same YouTube frame
  // (since YouTube only has 4-5 fixed frames per video)
  const processedFrameUrls = new Set<string>();

  for (const { timestampMs, hint } of timestamps) {
    const result = await extractFrameAtTimestamp(videoId, timestampMs, videoDurationMs);

    // Check if we've already processed this frame URL
    if (result.frame && processedFrameUrls.has(result.frame.url)) {
      // Skip duplicate frame but note it in the results
      results.push({
        ...result,
        hint,
      });
      continue;
    }

    if (result.frame) {
      processedFrameUrls.add(result.frame.url);
    }

    results.push({
      ...result,
      hint,
    });
  }

  return results;
}
