/**
 * Video-to-Bag Pipeline Orchestrator
 * Supports both YouTube and TikTok videos.
 *
 * YouTube flow: transcript-primary, vision confirms, description links identified
 * TikTok flow:  vision-primary (reads text overlays), no transcript, yt-dlp+ffmpeg
 *
 * Usage:
 *   for await (const event of runVideoPipeline(url, options)) {
 *     send(event);  // Forward to SSE stream
 *   }
 */

import { extractVideoId, getVideoDetails, extractUrlsFromDescription } from '../contentIdeas/youtube';
import { fetchYouTubeTranscript, formatTimestamp } from '../contentIdeas/transcript';
import type { TranscriptSegment } from '../contentIdeas/transcript';
import { parseIsoDuration } from '../contentIdeas/videoFrames';
import { identifyProduct } from '../linkIdentification/index';
import { searchGoogleImages, buildProductSearchQuery } from '../linkIdentification/googleImageSearch';
import { openai } from '../openaiClient';
import { analyzeFramesWithTranscript, analyzeYouTubeFramesBatched, analyzeTikTokFrames, identifyFashionItems, isUnbrandedFashionItem } from './combinedAnalysis';
import { extractRealFrames, extractEvenlySpacedFrames, extractHighResFrames, type ExtractedFrame } from './youtubeStoryboard';
import { findTranscriptGaps, resolveGap, fixProductBrand } from './gapResolver';
import { isTikTokUrl, fetchTikTokMetadata, downloadAndExtractFrames } from './tiktokFrames';
import type {
  PipelineEvent,
  PipelineOptions,
  PipelineResult,
  VideoMetadata,
  DraftBag,
  DraftLink,
  DraftProduct,
  TranscriptProduct,
  DescriptionIdentifiedProduct,
  VisionProduct,
  ProductSource,
} from './types';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let nextProductId = 1;
function genProductId(): string {
  return `draft-${nextProductId++}`;
}

/** Domains to skip when identifying description links (social, streaming, non-product) */
const SOCIAL_DOMAINS = [
  'instagram.com', 'twitter.com', 'tiktok.com', 'facebook.com',
  'x.com', 'threads.net', 'snapchat.com', 'linkedin.com',
  'discord.gg', 'discord.com', 'twitch.tv', 'patreon.com',
  'youtube.com', 'youtu.be', 'spotify.com', 'open.spotify.com',
  'music.apple.com', 'podcasts.apple.com', 'soundcloud.com',
  'linktr.ee', 'beacons.ai', 'bio.link', 'allmylinks.com',
  'ko-fi.com', 'buymeacoffee.com', 'venmo.com', 'paypal.com',
  'gofundme.com', 'bit.ly', 'tinyurl.com',
];

function isSocialUrl(url: string): boolean {
  return SOCIAL_DOMAINS.some(d => url.includes(d));
}

/** Deduplicate timestamps that are within windowMs of each other, keeping the first. */
function deduplicateTimestamps(timestamps: number[], windowMs: number): number[] {
  const sorted = [...timestamps].sort((a, b) => a - b);
  const result: number[] = [];
  for (const ts of sorted) {
    if (result.length === 0 || ts - result[result.length - 1] > windowMs) {
      result.push(ts);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline Orchestrator
// ═══════════════════════════════════════════════════════════════════

export async function* runVideoPipeline(
  videoUrl: string,
  options: PipelineOptions = {},
): AsyncGenerator<PipelineEvent> {
  // Route TikTok URLs to the TikTok-specific pipeline
  if (isTikTokUrl(videoUrl)) {
    yield* runTikTokPipeline(videoUrl, options);
    return;
  }

  const {
    includeTranscript = true,
    includeVision = true,
    maxFrames = 5,
    maxDescriptionLinks = 15,
    imageConcurrency = 5,
  } = options;

  const pipelineStart = Date.now();
  nextProductId = 1;

  // ─────────────────────────────────────────────────────────────────
  // Stage 1: URL Validation & Metadata
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'metadata', message: 'Fetching video metadata...' };
  const stageStart1 = Date.now();

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    yield { type: 'pipeline_error', error: 'Invalid YouTube URL. Could not extract video ID.' };
    return;
  }

  let metadata: VideoMetadata;
  try {
    const [videoDetails] = await getVideoDetails([videoId]);
    if (!videoDetails) {
      yield { type: 'pipeline_error', error: 'Video not found. It may be private or deleted.' };
      return;
    }

    const durationSeconds = videoDetails.contentDetails?.duration
      ? parseIsoDuration(videoDetails.contentDetails.duration)
      : 0;

    metadata = {
      videoId,
      platform: 'youtube',
      title: videoDetails.snippet.title,
      channelName: videoDetails.snippet.channelTitle,
      description: videoDetails.snippet.description,
      thumbnailUrl: videoDetails.snippet.thumbnails.maxres?.url
        || videoDetails.snippet.thumbnails.high?.url
        || videoDetails.snippet.thumbnails.medium?.url
        || '',
      durationSeconds,
      tags: videoDetails.snippet.tags || [],
      publishedAt: videoDetails.snippet.publishedAt,
      viewCount: videoDetails.statistics?.viewCount
        ? parseInt(videoDetails.statistics.viewCount, 10)
        : undefined,
    };
  } catch (error) {
    yield { type: 'pipeline_error', error: `Failed to fetch video metadata: ${error instanceof Error ? error.message : 'Unknown error'}` };
    return;
  }

  yield { type: 'metadata_ready', metadata };
  yield {
    type: 'stage_completed',
    stage: 'metadata',
    message: `Got metadata for "${metadata.title}"`,
    durationMs: Date.now() - stageStart1,
  };

  // ─────────────────────────────────────────────────────────────────
  // Stage 2: Transcript → GPT-4o Product Extraction
  // ─────────────────────────────────────────────────────────────────
  let transcriptProducts: TranscriptProduct[] = [];
  let transcriptText = '';
  let transcriptSegments: TranscriptSegment[] = [];

  if (includeTranscript) {
    yield { type: 'stage_started', stage: 'transcript', message: 'Analyzing transcript with AI...' };
    const stageStart2 = Date.now();

    try {
      const transcriptResult = await fetchYouTubeTranscript(videoId);

      if (transcriptResult.success && transcriptResult.transcript) {
        transcriptText = transcriptResult.transcript;
        transcriptSegments = transcriptResult.segments;

        // Build timestamped transcript for GPT-4o
        const timestampedLines = transcriptResult.segments
          .map(s => `[${formatTimestamp(s.offset)}] ${s.text}`)
          .join('\n');

        transcriptProducts = await analyzeTranscriptWithAI(
          timestampedLines,
          metadata.title,
          metadata.channelName,
        );

        yield {
          type: 'stage_completed',
          stage: 'transcript',
          message: `Found ${transcriptProducts.length} products from transcript`,
          itemCount: transcriptProducts.length,
          durationMs: Date.now() - stageStart2,
        };
      } else {
        yield {
          type: 'stage_completed',
          stage: 'transcript',
          message: 'Transcript not available for this video',
          itemCount: 0,
          durationMs: Date.now() - stageStart2,
        };
      }
    } catch (error) {
      yield {
        type: 'stage_failed',
        stage: 'transcript',
        error: error instanceof Error ? error.message : 'Transcript extraction failed',
      };
    }
  } else {
    yield { type: 'stage_skipped', stage: 'transcript', reason: 'Transcript analysis disabled' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Stage 3: Description Links → Full identifyProduct() (no skipAI)
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'description', message: 'Identifying products from description links...' };
  const stageStart3 = Date.now();

  const extractedLinks = extractUrlsFromDescription(metadata.description);
  const productLinks = extractedLinks
    .filter(l => !isSocialUrl(l.url))
    .slice(0, maxDescriptionLinks);

  const descriptionProducts: DescriptionIdentifiedProduct[] = [];

  if (productLinks.length > 0) {
    const linkBatchSize = 5;
    for (let i = 0; i < productLinks.length; i += linkBatchSize) {
      const batch = productLinks.slice(i, i + linkBatchSize);
      const results = await Promise.all(
        batch.map(async (link) => {
          try {
            const result = await identifyProduct(link.url);
            if (result.confidence > 0.3) {
              return {
                name: result.fullName,
                brand: result.brand || undefined,
                category: result.category || undefined,
                imageUrl: result.imageUrl || undefined,
                purchaseUrl: link.url,
                domain: link.domain,
                isAffiliate: link.isAffiliate,
                confidence: result.confidence,
                label: link.productHint || undefined,
              } satisfies DescriptionIdentifiedProduct;
            }
          } catch {
            // Skip failed link identification
          }
          return null;
        })
      );
      for (const r of results) {
        if (r !== null) descriptionProducts.push(r);
      }
    }
  }

  yield {
    type: 'stage_completed',
    stage: 'description',
    message: `Identified ${descriptionProducts.length} products from ${productLinks.length} links`,
    itemCount: descriptionProducts.length,
    durationMs: Date.now() - stageStart3,
  };

  // ─────────────────────────────────────────────────────────────────
  // Stage 4: Real Frame Extraction & Vision Analysis
  // Uses YouTube storyboard sprite sheets to get actual video frames
  // at the timestamps identified by transcript analysis.
  // ─────────────────────────────────────────────────────────────────
  let visionProducts: VisionProduct[] = [];
  // Store extracted frames so fusion can assign them to unmatched transcript products
  let extractedFrames: Array<{ base64: string; timestampMs: number }> = [];

  if (includeVision) {
    yield { type: 'stage_started', stage: 'vision', message: 'Extracting real video frames from storyboard...' };
    const stageStart4 = Date.now();

    try {
      // Extract frames for broad coverage:
      // When transcript is available: ~1 frame per 20s (vision confirms AND fills gaps)
      // When NO transcript: ~1 frame per 12s (vision is the ONLY source, be thorough)
      let frames: ExtractedFrame[];

      const videoDurationMs = metadata.durationSeconds * 1000;
      const noTranscript = transcriptProducts.length === 0 && transcriptText.length === 0;

      // Scale frame count by video duration and whether we have transcript
      // Even with a transcript, we need enough frames to catch items the transcript misses
      // (bags, accessories, keychains are often shown but not mentioned by exact brand)
      // Target: ~1 frame per 15s with transcript, ~1 per 10s without
      const evenFrameCount = noTranscript
        ? Math.max(25, Math.min(60, Math.ceil(metadata.durationSeconds / 10)))
        : Math.max(20, Math.min(50, Math.ceil(metadata.durationSeconds / 15)));

      // Get evenly spaced frames as the baseline
      const evenFrames = videoDurationMs > 0
        ? await extractEvenlySpacedFrames(videoId, videoDurationMs, evenFrameCount)
        : [];

      // Also extract targeted frames at transcript product timestamps
      const productTimestamps = transcriptProducts
        .filter(tp => tp.timestampMs != null && tp.timestampMs > 0)
        .map(tp => tp.timestampMs!);

      let targetedFrames: ExtractedFrame[] = [];
      if (productTimestamps.length > 0) {
        const evenTimestamps = evenFrames.map(f => f.timestampMs);
        const newTimestamps = productTimestamps.filter(ts =>
          !evenTimestamps.some(et => Math.abs(et - ts) < 5000)
        );
        if (newTimestamps.length > 0) {
          const dedupedNew = deduplicateTimestamps(newTimestamps, 3000);
          targetedFrames = await extractRealFrames(videoId, dedupedNew.slice(0, 10));
        }
      }

      // Combine and sort by timestamp
      frames = [...evenFrames, ...targetedFrames]
        .sort((a, b) => a.timestampMs - b.timestampMs);

      console.log(`[VideoPipeline] Extracted ${frames.length} frames (${evenFrames.length} even + ${targetedFrames.length} targeted)`);

      if (frames.length > 0) {
        // Store frames for fusion stage
        extractedFrames = frames.map(f => ({ base64: f.base64, timestampMs: f.timestampMs }));

        const frameInputs = frames.map(f => ({
          url: '',
          base64: f.base64,
          timestampFormatted: f.timestampFormatted,
        }));

        // Always use batched analysis with text-overlay-aware prompt.
        // Text overlays often show specific model names/specs that the
        // transcript misses (speaker says "putter", overlay says "AI ONE 7T").
        yield { type: 'stage_started', stage: 'vision', message: `Analyzing ${frames.length} frames with text overlay detection...` };
        const analysisResult = await analyzeYouTubeFramesBatched(
          frameInputs,
          metadata.title,
          transcriptText.slice(0, 2000),
          10,
        );

        // Map frame URLs back: vision products get a data: URL
        visionProducts = analysisResult.products.map(vp => ({
          ...vp,
          frameUrl: frames[vp.frameIndex]?.base64 || vp.frameUrl,
        }));

        // Fix brand misparses on batch vision results (e.g., brand="Opus" → "Callaway")
        for (const vp of visionProducts) {
          fixProductBrand(vp, metadata.channelName);
        }

        // ── High-Res Refinement: re-analyze low-confidence products at 720p ──
        // Storyboard frames are only 320x180 — too low to read small text, brand
        // labels, or product details. Download 720p frames at timestamps where we
        // found products but couldn't identify brands, or where confidence is low.
        // ALWAYS runs regardless of transcript availability — storyboard resolution
        // is never enough for reliable brand identification.
        {
          // Collect timestamps that need better resolution:
          // 1. Products without a brand (or brand = "Unknown")
          // 2. Products with confidence < 80
          const needsHiRes = visionProducts.filter(vp => {
            const noBrand = !vp.brand || vp.brand === 'Unknown' || vp.brand === 'unknown';
            return noBrand || vp.confidence < 80;
          });

          if (needsHiRes.length > 0) {
            const hiResTimestamps = needsHiRes
              .map(vp => vp.frameTimestamp ? parseTimestampToMs(vp.frameTimestamp) : 0)
              .filter(ts => ts > 0);

            // Also add timestamps BETWEEN existing products to find missed items
            // In "what's in my bag" videos, items are shown sequentially — gaps
            // between detected items likely contain undetected items
            const productTimestampsMs = visionProducts
              .map(vp => vp.frameTimestamp ? parseTimestampToMs(vp.frameTimestamp) : 0)
              .filter(ts => ts > 0)
              .sort((a, b) => a - b);

            const gapTimestamps: number[] = [];
            for (let i = 0; i < productTimestampsMs.length - 1; i++) {
              const gap = productTimestampsMs[i + 1] - productTimestampsMs[i];
              // If there's a gap > 60s between products, sample the middle
              if (gap > 60_000) {
                const midpoint = productTimestampsMs[i] + Math.floor(gap / 2);
                gapTimestamps.push(midpoint);
                // For very large gaps (>120s), add quarter points too
                if (gap > 120_000) {
                  gapTimestamps.push(productTimestampsMs[i] + Math.floor(gap / 4));
                  gapTimestamps.push(productTimestampsMs[i] + Math.floor(gap * 3 / 4));
                }
              }
            }

            const allHiResTimestamps = deduplicateTimestamps(
              [...hiResTimestamps, ...gapTimestamps],
              10_000,
            ).slice(0, 20); // Cap at 20 high-res frames

            if (allHiResTimestamps.length > 0) {
              yield {
                type: 'stage_started',
                stage: 'vision',
                message: `Extracting ${allHiResTimestamps.length} high-res (720p) frames for detail...`,
              };

              const hiResFrames = await extractHighResFrames(videoId, allHiResTimestamps);

              if (hiResFrames.length > 0) {
                yield {
                  type: 'stage_started',
                  stage: 'vision',
                  message: `Analyzing ${hiResFrames.length} high-res frames for brands and details...`,
                };

                const hiResInputs = hiResFrames.map(f => ({
                  url: '',
                  base64: f.base64,
                  timestampFormatted: f.timestampFormatted,
                }));

                const hiResResult = await analyzeYouTubeFramesBatched(
                  hiResInputs,
                  metadata.title,
                  '',
                  10,
                );

                // Merge high-res results: upgrade existing products or add new ones
                for (const hiResProduct of hiResResult.products) {
                  const hiResFrame = hiResFrames[hiResProduct.frameIndex];
                  if (hiResFrame) {
                    hiResProduct.frameUrl = hiResFrame.base64;
                    hiResProduct.frameTimestamp = hiResFrame.timestampFormatted;
                  }
                  fixProductBrand(hiResProduct, metadata.channelName);

                  // Check if this matches an existing product
                  const existingIdx = visionProducts.findIndex(vp => {
                    const vpName = `${vp.brand || ''} ${vp.name}`.toLowerCase().trim();
                    const hrName = `${hiResProduct.brand || ''} ${hiResProduct.name}`.toLowerCase().trim();
                    if (vpName === hrName) return true;
                    if (vpName.includes(hrName) || hrName.includes(vpName)) return true;
                    const vpWords = new Set(vpName.split(/\s+/).filter(w => w.length > 2));
                    const hrWords = new Set(hrName.split(/\s+/).filter(w => w.length > 2));
                    const overlap = [...vpWords].filter(w => hrWords.has(w)).length;
                    return overlap >= 2;
                  });

                  if (existingIdx >= 0) {
                    const existing = visionProducts[existingIdx];
                    // Upgrade if high-res has better brand or confidence
                    const existingHasBrand = existing.brand && existing.brand !== 'Unknown' && existing.brand !== 'unknown';
                    const hiResHasBrand = hiResProduct.brand && hiResProduct.brand !== 'Unknown' && hiResProduct.brand !== 'unknown';

                    if ((!existingHasBrand && hiResHasBrand) || hiResProduct.confidence > existing.confidence) {
                      console.log(
                        `[VideoPipeline] HiRes upgrade: "${existing.brand || '?'} ${existing.name}" (${existing.confidence}%) → "${hiResProduct.brand || '?'} ${hiResProduct.name}" (${hiResProduct.confidence}%)`,
                      );
                      visionProducts[existingIdx] = {
                        ...existing,
                        brand: hiResHasBrand ? hiResProduct.brand : existing.brand,
                        name: hiResProduct.confidence > existing.confidence ? hiResProduct.name : existing.name,
                        confidence: Math.max(existing.confidence, hiResProduct.confidence),
                        frameUrl: hiResProduct.frameUrl || existing.frameUrl,
                        visualDescription: hiResProduct.visualDescription || existing.visualDescription,
                      };
                    }
                  } else {
                    // New product found in high-res that storyboard missed
                    console.log(`[VideoPipeline] HiRes new: "${hiResProduct.brand || '?'} ${hiResProduct.name}" (${hiResProduct.confidence}%)`);
                    visionProducts.push(hiResProduct);
                    if (hiResFrame) {
                      extractedFrames.push({
                        base64: hiResFrame.base64,
                        timestampMs: hiResFrame.timestampMs,
                      });
                    }
                  }
                }

                console.log(`[VideoPipeline] After high-res pass: ${visionProducts.length} total products`);
              }
            }
          }
        }

        // ── Fashion Item Re-ID: targeted prompts for unbranded bags, wallets, keychains ──
        // The batch vision prompt is too generic to reliably identify luxury fashion brands.
        // A targeted fashion-specialist prompt (asking specifically "what brand is this bag?")
        // dramatically improves accuracy for bags (e.g., Balenciaga City) and accessories.
        // IMPORTANT: We extract dedicated hi-res frames for fashion items because storyboard
        // frames (320x180) are too small to identify brand-specific hardware/design details,
        // and the creator's worn accessories (necklaces, rings) can mislead the model.
        {
          const unbrandedFashion = visionProducts
            .map((vp, idx) => ({ vp, idx }))
            .filter(({ vp }) => isUnbrandedFashionItem(vp));

          if (unbrandedFashion.length > 0) {
            const maxItems = Math.min(unbrandedFashion.length, 8);
            const fashionNames = unbrandedFashion.slice(0, maxItems).map(f => f.vp.name).join(', ');
            console.log(`[VideoPipeline] ${unbrandedFashion.length} unbranded fashion items: ${fashionNames}`);

            yield {
              type: 'stage_started',
              stage: 'vision',
              message: `Extracting hi-res frames for ${Math.min(unbrandedFashion.length, maxItems)} fashion items...`,
            };

            // Extract hi-res frames at each fashion item's timestamp
            // For keychains/charms: also extract frames at ±5s offsets since keychains
            // share timestamps with the bag but the creator shows them separately
            const fashionTimestampsSet = new Set<number>();
            for (const { vp } of unbrandedFashion.slice(0, maxItems)) {
              const ts = vp.frameTimestamp ? parseTimestampToMs(vp.frameTimestamp) : 0;
              if (ts <= 0) continue;
              fashionTimestampsSet.add(ts);
              // For keychains, add offset frames to catch when creator shows them specifically
              const isKeychainItem = vp.name.toLowerCase().includes('keychain') ||
                vp.name.toLowerCase().includes('charm') ||
                vp.name.toLowerCase().includes('plush') ||
                (vp.category || '').toLowerCase().includes('keychain');
              if (isKeychainItem) {
                if (ts > 5000) fashionTimestampsSet.add(ts - 5000);
                fashionTimestampsSet.add(ts + 5000);
                fashionTimestampsSet.add(ts + 10000);
              }
            }
            const fashionTimestamps = deduplicateTimestamps(
              [...fashionTimestampsSet],
              3000,
            );

            const fashionHiResFrames = fashionTimestamps.length > 0
              ? await extractHighResFrames(videoId, fashionTimestamps)
              : [];

            // Map hi-res frames to fashion items by closest timestamp
            // For keychains: collect multiple nearby frames for better identification
            const fashionInputs = unbrandedFashion.slice(0, maxItems).map(({ vp }) => {
              const vpTs = vp.frameTimestamp ? parseTimestampToMs(vp.frameTimestamp) : 0;
              const hiResFrame = fashionHiResFrames.find(f =>
                Math.abs(f.timestampMs - vpTs) < 5000,
              );

              const isKeychainItem = vp.name.toLowerCase().includes('keychain') ||
                vp.name.toLowerCase().includes('charm') ||
                vp.name.toLowerCase().includes('plush') ||
                (vp.category || '').toLowerCase().includes('keychain');

              // For keychains, gather additional nearby frames (±5-10s offset)
              let additionalFrames: string[] | undefined;
              if (isKeychainItem) {
                additionalFrames = fashionHiResFrames
                  .filter(f => {
                    const delta = Math.abs(f.timestampMs - vpTs);
                    return delta > 2000 && delta < 15000; // 2-15s away from primary
                  })
                  .sort((a, b) => Math.abs(a.timestampMs - vpTs) - Math.abs(b.timestampMs - vpTs))
                  .slice(0, 3)
                  .map(f => f.base64);
              }

              return {
                product: vp,
                hiResFrame: hiResFrame?.base64 || vp.frameUrl,
                additionalFrames,
              };
            });

            yield {
              type: 'stage_started',
              stage: 'vision',
              message: `Identifying ${fashionInputs.length} fashion items with specialist analysis...`,
            };

            const fashionResults = await identifyFashionItems(fashionInputs);

            for (const [itemIdx, result] of fashionResults) {
              const { vp, idx: vpIdx } = unbrandedFashion[itemIdx];
              console.log(
                `[VideoPipeline] Fashion ID: "${vp.name}" → "${result.brand} ${result.name}" (${result.confidence}%)`,
              );
              visionProducts[vpIdx] = {
                ...vp,
                brand: result.brand,
                name: result.name,
                confidence: Math.max(vp.confidence, result.confidence),
              };
            }
          }
        }

        // ── Gap Resolution: iterative targeted search for unidentified categories ──
        // If transcript mentions "putter" but AI didn't extract a specific model,
        // search frames around those mentions until we find and identify it.
        if (transcriptSegments.length > 0) {
          const gaps = findTranscriptGaps(transcriptSegments, transcriptProducts);

          // Filter to gaps not already resolved by the batch vision analysis.
          // A vision product only "resolves" a gap if it has a real brand
          // and reasonable confidence — generic "Golf Ball" (Unknown, 50%)
          // should NOT block the gap resolver from searching for the specific model.
          const unresolvedGaps = gaps.filter(gap => {
            const cat = gap.category.toLowerCase();
            return !visionProducts.some(vp => {
              if (vp.confidence < 70) return false;
              if (!vp.brand || vp.brand === 'Unknown' || vp.brand === 'unknown') return false;
              const vpCat = (vp.category || '').toLowerCase();
              const vpName = `${vp.brand} ${vp.name}`.toLowerCase();
              return vpCat === cat || vpCat.includes(cat) || vpName.includes(cat);
            });
          });

          if (unresolvedGaps.length > 0) {
            const maxGaps = Math.min(unresolvedGaps.length, 5);
            const gapsToResolve = unresolvedGaps.slice(0, maxGaps);
            const gapNames = gapsToResolve.map(g => g.category).join(', ');

            console.log(`[VideoPipeline] ${gapsToResolve.length} unresolved gaps: ${gapNames}`);

            for (let gi = 0; gi < gapsToResolve.length; gi++) {
              const gap = gapsToResolve[gi];
              yield {
                type: 'stage_started',
                stage: 'vision',
                message: `Searching for ${gap.category} (${gi + 1}/${gapsToResolve.length})...`,
              };

              const result = await resolveGap(videoId, gap, videoDurationMs, metadata.channelName);
              if (result.product) {
                visionProducts.push(result.product);
                extractedFrames.push({
                  base64: result.product.frameUrl,
                  timestampMs: result.product.frameTimestamp
                    ? parseTimestampToMs(result.product.frameTimestamp)
                    : 0,
                });
              }
            }
          }
        }

        // ── Weak Vision Re-ID: targeted search for generic/low-confidence vision products ──
        // When batch vision returns something like "Golf Bag (Unknown, 50%)", take
        // targeted screenshots around that frame timestamp to try to identify the
        // specific brand/model. Replace the weak product if successful, keep it if not.
        const weakProducts = visionProducts.filter(vp => {
          const hasRealBrand = vp.brand && vp.brand !== 'Unknown' && vp.brand !== 'unknown';
          return !hasRealBrand && vp.confidence < 65;
        });

        if (weakProducts.length > 0) {
          const maxWeak = Math.min(weakProducts.length, 5);
          const weakNames = weakProducts.slice(0, maxWeak).map(w => `${w.name} (${w.confidence}%)`).join(', ');
          console.log(`[VideoPipeline] ${weakProducts.length} weak vision products to re-identify: ${weakNames}`);

          for (let wi = 0; wi < Math.min(weakProducts.length, maxWeak); wi++) {
            const weak = weakProducts[wi];
            const category = weak.category || weak.name.toLowerCase().replace(/^golf\s+/i, '');

            // Build a synthetic gap from the weak vision product's frame timestamp
            const frameMs = weak.frameTimestamp
              ? parseTimestampToMs(weak.frameTimestamp)
              : 0;

            const syntheticGap = {
              category,
              mentionTimestamps: frameMs > 0 ? [frameMs] : [0],
              transcriptContext: `Vision identified a generic "${weak.name}" — searching for specific brand/model`,
            };

            yield {
              type: 'stage_started',
              stage: 'vision',
              message: `Re-identifying ${weak.name} (${wi + 1}/${Math.min(weakProducts.length, maxWeak)})...`,
            };

            const result = await resolveGap(videoId, syntheticGap, videoDurationMs, metadata.channelName);
            if (result.product && result.product.confidence > weak.confidence) {
              // Replace the weak product with the better identification
              const idx = visionProducts.indexOf(weak);
              if (idx >= 0) {
                console.log(
                  `[VideoPipeline] Re-ID: "${weak.name}" (${weak.confidence}%) → "${result.product.brand} ${result.product.name}" (${result.product.confidence}%)`,
                );
                visionProducts[idx] = result.product;
                extractedFrames.push({
                  base64: result.product.frameUrl,
                  timestampMs: result.product.frameTimestamp
                    ? parseTimestampToMs(result.product.frameTimestamp)
                    : 0,
                });
              }
            } else {
              console.log(`[VideoPipeline] Re-ID: "${weak.name}" — no better match found, keeping as-is`);
            }
          }
        }

        yield {
          type: 'stage_completed',
          stage: 'vision',
          message: `Identified ${visionProducts.length} products from video frames`,
          itemCount: visionProducts.length,
          durationMs: Date.now() - stageStart4,
        };
      } else {
        yield {
          type: 'stage_completed',
          stage: 'vision',
          message: 'Could not extract video frames (storyboard unavailable)',
          itemCount: 0,
          durationMs: Date.now() - stageStart4,
        };
      }
    } catch (error) {
      yield {
        type: 'stage_failed',
        stage: 'vision',
        error: error instanceof Error ? error.message : 'Vision analysis failed',
      };
    }
  } else {
    yield { type: 'stage_skipped', stage: 'vision', reason: 'Vision analysis disabled' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Stage 5: Product Fusion & Deduplication
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'fusion', message: 'Merging and deduplicating products...' };
  const stageStart5 = Date.now();

  const visionHeavyMode = transcriptProducts.length === 0 && visionProducts.length > 0;
  const draftProducts = fuseProducts(
    transcriptProducts,
    descriptionProducts,
    visionProducts,
    videoUrl,
    videoId,
    metadata.durationSeconds,
    extractedFrames,
    visionHeavyMode,
  );

  yield {
    type: 'stage_completed',
    stage: 'fusion',
    message: `${draftProducts.length} unique products after merging`,
    itemCount: draftProducts.length,
    durationMs: Date.now() - stageStart5,
  };

  // Emit product_found events
  for (const product of draftProducts) {
    yield {
      type: 'product_found',
      product,
      source: product.sources[0],
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Stage 6: Image Resolution (Google Images for products without productImageUrl)
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'images', message: 'Finding product images...' };
  const stageStart6 = Date.now();

  const productsNeedingImages = draftProducts.filter(p => !p.productImageUrl);
  let imagesFound = 0;

  for (let i = 0; i < productsNeedingImages.length; i += imageConcurrency) {
    const batch = productsNeedingImages.slice(i, i + imageConcurrency);
    await Promise.all(
      batch.map(async (product) => {
        try {
          const query = buildProductSearchQuery(product.brand || null, product.name);
          const images = await searchGoogleImages(query, 1);
          if (images.length > 0) {
            product.productImageUrl = images[0];
            imagesFound++;
          }
        } catch {
          // Skip failed image search
        }
      })
    );
  }

  yield {
    type: 'stage_completed',
    stage: 'images',
    message: `Found images for ${imagesFound} products`,
    itemCount: imagesFound,
    durationMs: Date.now() - stageStart6,
  };

  // ─────────────────────────────────────────────────────────────────
  // Stage 7: Draft Bag Assembly
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'assembly', message: 'Assembling draft bag...' };
  const stageStart7 = Date.now();

  const bagTitle = generateBagTitle(metadata.title, metadata.channelName);

  const draftBag: DraftBag = {
    title: bagTitle,
    description: `Products from "${metadata.title}" by ${metadata.channelName}`,
    tags: metadata.tags.slice(0, 10),
    coverPhotoUrl: metadata.thumbnailUrl,
    sourceVideoUrl: videoUrl,
    videoMetadata: metadata,
    products: draftProducts,
  };

  yield {
    type: 'stage_completed',
    stage: 'assembly',
    message: `Draft bag ready with ${draftProducts.length} products`,
    itemCount: draftProducts.length,
    durationMs: Date.now() - stageStart7,
  };

  // Build stats
  const stats = {
    totalProducts: draftProducts.length,
    fromDescription: draftProducts.filter(p => p.sources.includes('description')).length,
    fromTranscript: draftProducts.filter(p => p.sources.includes('transcript')).length,
    fromVision: draftProducts.filter(p => p.sources.includes('vision')).length,
    multiSource: draftProducts.filter(p => p.sources.length > 1).length,
    withImages: draftProducts.filter(p => p.productImageUrl || p.videoFrameUrl).length,
    withLinks: draftProducts.filter(p => p.purchaseLinks.length > 0).length,
    totalDurationMs: Date.now() - pipelineStart,
  };

  const result: PipelineResult = { draftBag, stats };
  yield { type: 'pipeline_complete', result };
}

// ═══════════════════════════════════════════════════════════════════
// Transcript AI Analysis (GPT-4o with timestamps)
// ═══════════════════════════════════════════════════════════════════

async function analyzeTranscriptWithAI(
  timestampedTranscript: string,
  videoTitle: string,
  channelName: string,
): Promise<TranscriptProduct[]> {
  const prompt = `Analyze this timestamped video transcript to extract ALL products the creator mentions, discusses, reviews, or recommends.

VIDEO TITLE: ${videoTitle}
CHANNEL: ${channelName}

TIMESTAMPED TRANSCRIPT:
${timestampedTranscript.slice(0, 8000)}

For EACH distinct product mentioned:
1. Extract the exact brand and model/product name
2. Note the category (e.g., "driver", "headphones", "lipstick", "wallet", "sneakers", etc.)
3. Quote a brief snippet of what the creator said about it (mentionContext)
4. Note the timestamp where they FIRST mention it

BRAND RULES:
- The channel name often indicates the primary brand. For example, if the channel is "Callaway Golf" or "TaylorMade Golf", all products discussed are likely that brand unless stated otherwise.
- Product line names like "Opus", "Apex", "Elyte", "TCB", "AI ONE", "Chrome Tour", "Qi", "Stealth", "Spider" are MODEL LINES, not brands. The BRAND is the parent company (Callaway, TaylorMade, Titleist, etc.).
- ALWAYS set the brand to the parent company, NEVER to a product line name.

DEDUPLICATION:
- Return each distinct product ONCE with the timestamp of its FIRST mention.
- If the speaker discusses "Opus SP wedges" multiple times (e.g., 46-degree, 50-degree, 56-degree), that is ONE product entry: "Opus SP" with category "wedge".
- Iron sets (e.g., "TCB irons, 4 through pitching wedge") are ONE product.
- Different lofts/numbers of the same model are NOT separate products.

IMPORTANT:
- Be thorough — extract EVERY distinct product, not just the main ones
- Include accessories, balls, bags, apparel, etc.
- If the creator mentions a brand+model (e.g., "TaylorMade Qi10 Max"), use the full name
- If they only say a model name (e.g., "the Opus SP"), infer the brand from the channel name or video context
- If they only say a generic category (e.g., "my putter"), still extract it with the category — use the channel brand if appropriate

Return JSON:
{
  "products": [
    {
      "name": "Full Product Name (without brand prefix)",
      "brand": "Brand (parent company, NOT product line)",
      "category": "category",
      "mentionContext": "brief quote of what creator said",
      "timestamp": "2:34"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return (parsed.products || []).map((p: {
      name: string;
      brand?: string;
      category?: string;
      mentionContext?: string;
      timestamp?: string;
    }) => {
      const timestampMs = p.timestamp ? parseTimestampToMs(p.timestamp) : undefined;
      return {
        name: p.name,
        brand: p.brand,
        category: p.category,
        mentionContext: p.mentionContext,
        timestampMs,
        timestampFormatted: p.timestamp,
      } satisfies TranscriptProduct;
    });
  } catch (error) {
    console.error('[VideoPipeline] Transcript AI analysis failed:', error);
    return [];
  }
}

/** Parse "M:SS" or "H:MM:SS" timestamp to milliseconds */
function parseTimestampToMs(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  }
  if (parts.length === 2) {
    return (parts[0] * 60 + parts[1]) * 1000;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// Product Fusion
// ═══════════════════════════════════════════════════════════════════

/**
 * Self-contained product fusion:
 *
 * Normal mode (transcript available):
 *   1. Seed from transcript products (primary source)
 *   2. Match description products by name similarity → merge images + links + boost confidence
 *   3. Match vision products → merge frame URLs + boost confidence
 *   4. Unmatched products from any source added as standalone
 *   5. Transcript products without a vision match get nearest YouTube auto-frame by timestamp
 *
 * Vision-heavy mode (no transcript):
 *   1. Seed from vision products (with base confidence 60)
 *   2. Match description products to boost confidence + add links
 *   3. Unmatched description products added as standalone
 */
function fuseProducts(
  transcriptProducts: TranscriptProduct[],
  descriptionProducts: DescriptionIdentifiedProduct[],
  visionProducts: VisionProduct[],
  videoUrl: string,
  videoId: string,
  videoDurationSeconds: number,
  extractedFrames: Array<{ base64: string; timestampMs: number }>,
  visionHeavyMode: boolean = false,
): DraftProduct[] {
  // ── Vision-heavy mode: vision is the seed ──
  if (visionHeavyMode) {
    return fuseVisionHeavy(visionProducts, descriptionProducts, videoUrl);
  }

  // ── Normal mode: transcript is the seed ──
  const results: DraftProduct[] = [];
  const usedDescIdx = new Set<number>();
  const usedVisionIdx = new Set<number>();

  // 1. Seed from transcript products
  for (const tp of transcriptProducts) {
    const fullName = tp.brand ? `${tp.brand} ${tp.name}` : tp.name;
    const sources: ProductSource[] = ['transcript'];
    let confidence = 65;
    const links: DraftLink[] = [];
    let productImageUrl: string | undefined;
    let videoFrameUrl: string | undefined;

    // 2. Try to match a description product
    const descIdx = findBestMatch(fullName, descriptionProducts.map(d => d.name), usedDescIdx);
    if (descIdx >= 0) {
      const dp = descriptionProducts[descIdx];
      usedDescIdx.add(descIdx);
      sources.push('description');
      confidence += 20;
      productImageUrl = dp.imageUrl;
      links.push({
        url: dp.purchaseUrl,
        domain: dp.domain,
        label: dp.label,
        isAffiliate: dp.isAffiliate,
      });
    }

    // 3. Try to match a vision product
    const visionIdx = findBestMatch(fullName, visionProducts.map(v => v.brand ? `${v.brand} ${v.name}` : v.name), usedVisionIdx);
    if (visionIdx >= 0) {
      const vp = visionProducts[visionIdx];
      usedVisionIdx.add(visionIdx);
      sources.push('vision');
      confidence += 15;
      videoFrameUrl = vp.frameUrl;
    }

    // 5. If no vision match, assign nearest extracted frame by timestamp
    if (!videoFrameUrl && tp.timestampMs != null && extractedFrames.length > 0) {
      videoFrameUrl = getNearestExtractedFrame(extractedFrames, tp.timestampMs);
    }

    confidence = Math.min(100, confidence);

    results.push({
      id: genProductId(),
      name: tp.name,
      brand: tp.brand || '',
      category: tp.category,
      description: tp.mentionContext,
      confidence,
      sources,
      videoFrameUrl,
      productImageUrl,
      purchaseUrl: links[0]?.url,
      purchaseLinks: links,
      timestamp: tp.timestampFormatted,
      timestampMs: tp.timestampMs,
      pipelineMetadata: {
        videoUrl,
        timestamp: tp.timestampFormatted,
        sources,
        confidence,
      },
    });
  }

  // 4. Add unmatched description products as standalone
  for (let i = 0; i < descriptionProducts.length; i++) {
    if (usedDescIdx.has(i)) continue;
    const dp = descriptionProducts[i];

    // Extract brand from fullName if not separate
    let brand = dp.brand || '';
    let name = dp.name;
    if (!brand && name.includes(' ')) {
      const words = name.split(' ');
      brand = words[0];
      name = words.slice(1).join(' ');
    }

    results.push({
      id: genProductId(),
      name,
      brand,
      category: dp.category,
      confidence: Math.round(dp.confidence * 100),
      sources: ['description'],
      productImageUrl: dp.imageUrl,
      purchaseUrl: dp.purchaseUrl,
      purchaseLinks: [{
        url: dp.purchaseUrl,
        domain: dp.domain,
        label: dp.label,
        isAffiliate: dp.isAffiliate,
      }],
      pipelineMetadata: {
        videoUrl,
        sources: ['description'],
        confidence: Math.round(dp.confidence * 100),
      },
    });
  }

  // 4. Add unmatched vision products as standalone
  for (let i = 0; i < visionProducts.length; i++) {
    if (usedVisionIdx.has(i)) continue;
    const vp = visionProducts[i];

    results.push({
      id: genProductId(),
      name: vp.name,
      brand: vp.brand || '',
      category: vp.category,
      color: vp.color,
      description: vp.visualDescription,
      confidence: vp.confidence,
      sources: ['vision'],
      videoFrameUrl: vp.frameUrl,
      purchaseLinks: [],
      timestamp: vp.frameTimestamp,
      pipelineMetadata: {
        videoUrl,
        timestamp: vp.frameTimestamp,
        sources: ['vision'],
        confidence: vp.confidence,
      },
    });
  }

  return results;
}

/**
 * Vision-heavy fusion: vision products are the seed.
 * Used when no transcript is available and vision is the primary source.
 */
function fuseVisionHeavy(
  visionProducts: VisionProduct[],
  descriptionProducts: DescriptionIdentifiedProduct[],
  videoUrl: string,
): DraftProduct[] {
  const results: DraftProduct[] = [];
  const usedDescIdx = new Set<number>();

  // 1. Seed from vision products with base confidence 60
  for (const vp of visionProducts) {
    const fullName = vp.brand ? `${vp.brand} ${vp.name}` : vp.name;
    const sources: ProductSource[] = ['vision'];
    let confidence = Math.max(vp.confidence, 60); // Base confidence 60 in vision-heavy mode
    const links: DraftLink[] = [];
    let productImageUrl: string | undefined;

    // 2. Try to match a description product to boost confidence + add links
    const descIdx = findBestMatch(
      fullName,
      descriptionProducts.map(d => d.name),
      usedDescIdx,
    );
    if (descIdx >= 0) {
      const dp = descriptionProducts[descIdx];
      usedDescIdx.add(descIdx);
      sources.push('description');
      confidence = Math.min(100, confidence + 20);
      productImageUrl = dp.imageUrl;
      links.push({
        url: dp.purchaseUrl,
        domain: dp.domain,
        label: dp.label,
        isAffiliate: dp.isAffiliate,
      });
    }

    results.push({
      id: genProductId(),
      name: vp.name,
      brand: vp.brand || '',
      category: vp.category,
      color: vp.color,
      description: vp.visualDescription,
      confidence,
      sources,
      videoFrameUrl: vp.frameUrl,
      productImageUrl,
      purchaseUrl: links[0]?.url,
      purchaseLinks: links,
      timestamp: vp.frameTimestamp,
      pipelineMetadata: {
        videoUrl,
        timestamp: vp.frameTimestamp,
        sources,
        confidence,
      },
    });
  }

  // 3. Add unmatched description products as standalone
  for (let i = 0; i < descriptionProducts.length; i++) {
    if (usedDescIdx.has(i)) continue;
    const dp = descriptionProducts[i];

    let brand = dp.brand || '';
    let name = dp.name;
    if (!brand && name.includes(' ')) {
      const words = name.split(' ');
      brand = words[0];
      name = words.slice(1).join(' ');
    }

    results.push({
      id: genProductId(),
      name,
      brand,
      category: dp.category,
      confidence: Math.round(dp.confidence * 100),
      sources: ['description'],
      productImageUrl: dp.imageUrl,
      purchaseUrl: dp.purchaseUrl,
      purchaseLinks: [{
        url: dp.purchaseUrl,
        domain: dp.domain,
        label: dp.label,
        isAffiliate: dp.isAffiliate,
      }],
      pipelineMetadata: {
        videoUrl,
        sources: ['description'],
        confidence: Math.round(dp.confidence * 100),
      },
    });
  }

  return results;
}

/**
 * Find the best name-similarity match from candidates.
 * Returns the index of the best match, or -1 if none is close enough.
 */
function findBestMatch(target: string, candidates: string[], usedIndices: Set<number>): number {
  const targetLower = target.toLowerCase();
  const targetWords = new Set(targetLower.split(/\s+/).filter(w => w.length > 2));

  let bestIdx = -1;
  let bestScore = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (usedIndices.has(i)) continue;

    const candLower = candidates[i].toLowerCase();

    // Exact substring match
    if (targetLower.includes(candLower) || candLower.includes(targetLower)) {
      const score = 0.9;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
      continue;
    }

    // Word overlap score
    const candWords = new Set(candLower.split(/\s+/).filter(w => w.length > 2));
    const intersection = [...candWords].filter(w => targetWords.has(w)).length;
    const union = new Set([...targetWords, ...candWords]).size;

    if (union > 0) {
      const score = intersection / union;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
  }

  // Require at least 40% similarity
  return bestScore >= 0.4 ? bestIdx : -1;
}

/**
 * Get the nearest extracted storyboard frame for a given timestamp.
 * Returns the base64 data URL of the closest frame.
 */
function getNearestExtractedFrame(
  frames: Array<{ base64: string; timestampMs: number }>,
  timestampMs: number,
): string | undefined {
  if (frames.length === 0) return undefined;

  let bestFrame = frames[0];
  let bestDelta = Math.abs(frames[0].timestampMs - timestampMs);

  for (const frame of frames) {
    const delta = Math.abs(frame.timestampMs - timestampMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestFrame = frame;
    }
  }

  return bestFrame.base64;
}

// ═══════════════════════════════════════════════════════════════════
// TikTok Brand Enrichment
// Single GPT-4o call to infer brands from visual descriptions
// ═══════════════════════════════════════════════════════════════════

async function enrichTikTokBrands(
  products: VisionProduct[],
  creatorHandle: string,
): Promise<VisionProduct[]> {
  // If all products already have brands, skip
  const unbranded = products.filter(p => !p.brand || p.brand === 'Unknown');
  if (unbranded.length === 0) return products;

  const productList = products.map((p, i) => {
    return `${i + 1}. "${p.name}" [confidence: ${p.confidence}%]\n   Brand from vision: ${p.brand || 'not identified'}\n   Visual details: ${p.visualDescription || 'no details'}\n   Frame time: ${p.frameTimestamp || '?'}`;
  }).join('\n\n');

  const prompt = `A TikTok creator (@${creatorHandle}) is showing products. Vision AI identified these products from the video frames. Your job: identify brands and clean up product names.

PRODUCTS FOUND:
${productList}

RULES:
1. ONLY set a brand if you have STRONG evidence from the visual description (logo text, distinctive branding, packaging text).
2. If the visual description mentions a skull/crossbones logo on black neoprene gym gear (knee sleeves, lifting straps, wrist wraps, elbow wraps), that's almost certainly "Gymreapers" — they're the most popular brand with that exact skull logo.
3. If the product already has a brand from vision (like "Klout", "Gasp", "Apple", "Gatorade"), keep it.
4. If you CANNOT confidently determine the brand, return "" — do NOT guess. An empty brand is better than a wrong one.
5. Clean up product names to be search-friendly: "Lifting Straps" not "Wrist Straps" if context suggests pulling exercises; "Shaker Bottle" not "Water Bottle" if it's clearly a protein shaker.
6. If the video shows wrist wraps AND elbow wraps as separate items, list them separately.

Return JSON:
{
  "products": [
    { "index": 1, "brand": "BrandName or empty string", "name": "Clean Product Name" }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return products;

    const parsed = JSON.parse(content);
    const enrichments = parsed.products as Array<{ index: number; brand?: string; name?: string }> || [];

    // Apply enrichments
    const enriched = products.map((p, i) => {
      const enrichment = enrichments.find(e => e.index === i + 1);
      if (!enrichment) return p;

      const origBrand = p.brand || '';
      const newBrand = enrichment.brand || origBrand;
      const brandWasAdded = newBrand && (!origBrand || origBrand === 'Unknown');

      return {
        ...p,
        brand: newBrand === 'Unknown' ? '' : newBrand,
        name: enrichment.name || p.name,
        confidence: brandWasAdded ? Math.min(100, p.confidence + 15) : p.confidence,
      };
    });

    const brandsAdded = enriched.filter((e, i) => {
      const orig = products[i].brand || '';
      const isNew = e.brand && e.brand !== 'Unknown' && (!orig || orig === 'Unknown');
      return isNew;
    }).length;
    const namesChanged = enriched.filter((e, i) => e.name !== products[i].name).length;
    console.log(`[TikTok] Brand enrichment: ${brandsAdded} brands added, ${namesChanged} names cleaned`);

    return enriched;
  } catch (error) {
    console.error('[TikTok] Brand enrichment failed:', error);
    return products;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Bag Title Generation
// ═══════════════════════════════════════════════════════════════════

function generateBagTitle(videoTitle: string, channelName: string): string {
  let title = videoTitle
    .replace(/\s*[|\-–—]\s*(?:Full|Complete)?\s*(?:Gear|Setup|Tour|Breakdown|Review|Check)\s*$/i, '')
    .replace(/\s*\(?\d{4}\)?\s*$/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  if (title.length > 60 || title.length < 5) {
    title = `${channelName}'s Bag`;
  }

  return title;
}

// ═══════════════════════════════════════════════════════════════════
// TikTok Pipeline
// Vision-primary: download video → extract frames → GPT-4o vision
// No transcript, no YouTube API, no storyboards
// ═══════════════════════════════════════════════════════════════════

async function* runTikTokPipeline(
  videoUrl: string,
  options: PipelineOptions = {},
): AsyncGenerator<PipelineEvent> {
  const {
    includeVision = true,
    imageConcurrency = 5,
  } = options;

  const pipelineStart = Date.now();
  nextProductId = 1;

  // ─────────────────────────────────────────────────────────────────
  // Stage 1: TikTok Metadata (via yt-dlp)
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'metadata', message: 'Fetching TikTok video info...' };
  const stageStart1 = Date.now();

  const tikTokMeta = await fetchTikTokMetadata(videoUrl);
  if (!tikTokMeta) {
    yield { type: 'pipeline_error', error: 'Failed to fetch TikTok video info. The video may be private or deleted.' };
    return;
  }

  const metadata: VideoMetadata = {
    videoId: tikTokMeta.videoId,
    platform: 'tiktok',
    title: tikTokMeta.title,
    channelName: tikTokMeta.creator,
    description: tikTokMeta.description,
    thumbnailUrl: tikTokMeta.thumbnailUrl,
    durationSeconds: tikTokMeta.duration,
    tags: [],
    publishedAt: tikTokMeta.uploadDate || '',
    viewCount: tikTokMeta.viewCount,
  };

  yield { type: 'metadata_ready', metadata };
  yield {
    type: 'stage_completed',
    stage: 'metadata',
    message: `TikTok by @${tikTokMeta.creator} (${tikTokMeta.duration}s)`,
    durationMs: Date.now() - stageStart1,
  };

  // ─────────────────────────────────────────────────────────────────
  // Stage 2: Transcript — skip for TikTok
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_skipped', stage: 'transcript', reason: 'TikTok — no transcript available, using vision analysis' };

  // ─────────────────────────────────────────────────────────────────
  // Stage 3: Description — skip for TikTok (descriptions are just hashtags)
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_skipped', stage: 'description', reason: 'TikTok — no product links in description' };

  // ─────────────────────────────────────────────────────────────────
  // Stage 4: Download Video + Extract Frames + Vision Analysis
  // This is the PRIMARY product identification for TikTok
  // ─────────────────────────────────────────────────────────────────
  let visionProducts: VisionProduct[] = [];
  const frameStore: Array<{ base64: string; timestampMs: number }> = [];

  if (includeVision) {
    yield { type: 'stage_started', stage: 'vision', message: 'Downloading TikTok video and extracting frames...' };
    const stageStart4 = Date.now();

    try {
      // Extract frames every 3 seconds for short videos, 4s for longer
      const interval = tikTokMeta.duration <= 60 ? 3 : 4;
      const maxFrames = 40; // Cap to control API costs

      const frames = await downloadAndExtractFrames(videoUrl, interval, maxFrames);

      if (frames.length > 0) {
        // Store for later use
        for (const f of frames) {
          frameStore.push({ base64: f.base64, timestampMs: f.timestampMs });
        }

        yield { type: 'stage_started', stage: 'vision', message: `Analyzing ${frames.length} frames with GPT-4o vision...` };

        // Send all frames to GPT-4o vision in batches
        const analysisResult = await analyzeTikTokFrames(
          frames.map(f => ({
            url: '',
            base64: f.base64,
            timestampFormatted: f.timestampFormatted,
          })),
          metadata.title,
          metadata.description,
          12, // batch size
        );

        // Map frame URLs: vision products get the actual frame base64
        visionProducts = analysisResult.products.map(vp => ({
          ...vp,
          frameUrl: frames[vp.frameIndex]?.base64 || vp.frameUrl,
        }));

        yield {
          type: 'stage_completed',
          stage: 'vision',
          message: `Identified ${visionProducts.length} products from ${frames.length} video frames`,
          itemCount: visionProducts.length,
          durationMs: Date.now() - stageStart4,
        };
      } else {
        yield {
          type: 'stage_completed',
          stage: 'vision',
          message: 'Could not extract frames from TikTok video',
          itemCount: 0,
          durationMs: Date.now() - stageStart4,
        };
      }
    } catch (error) {
      yield {
        type: 'stage_failed',
        stage: 'vision',
        error: error instanceof Error ? error.message : 'TikTok vision analysis failed',
      };
    }
  } else {
    yield { type: 'stage_skipped', stage: 'vision', reason: 'Vision analysis disabled' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Stage 5: Enrich with brands + clean names, then build draft
  // GPT-4o text call to infer brands from visual descriptions
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'fusion', message: 'Enriching product brands and names...' };
  const stageStart5 = Date.now();

  // Enrich unbranded products with a single GPT-4o call
  const enrichedProducts = await enrichTikTokBrands(visionProducts, metadata.channelName);

  const draftProducts: DraftProduct[] = enrichedProducts.map(ep => ({
    id: genProductId(),
    name: ep.name,
    brand: ep.brand || '',
    category: ep.category,
    color: ep.color,
    description: ep.visualDescription,
    confidence: ep.confidence,
    sources: ['vision'] as ProductSource[],
    videoFrameUrl: ep.frameUrl,
    purchaseLinks: [],
    timestamp: ep.frameTimestamp,
    pipelineMetadata: {
      videoUrl,
      timestamp: ep.frameTimestamp,
      sources: ['vision'] as ProductSource[],
      confidence: ep.confidence,
    },
  }));

  yield {
    type: 'stage_completed',
    stage: 'fusion',
    message: `${draftProducts.length} products enriched with brands`,
    itemCount: draftProducts.length,
    durationMs: Date.now() - stageStart5,
  };

  for (const product of draftProducts) {
    yield { type: 'product_found', product, source: 'vision' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Stage 6: Image Resolution (Google Images for clean product photos)
  // Uses enriched brand+name for better search queries
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'images', message: 'Finding product images...' };
  const stageStart6 = Date.now();
  let imagesFound = 0;

  for (let i = 0; i < draftProducts.length; i += imageConcurrency) {
    const batch = draftProducts.slice(i, i + imageConcurrency);
    await Promise.all(
      batch.map(async (product) => {
        try {
          // Build a search query: "Brand Name product" for best results
          const parts = [product.brand, product.name].filter(Boolean).join(' ');
          const searchQuery = `${parts} product`;
          const images = await searchGoogleImages(searchQuery, 3);
          if (images.length > 0) {
            product.productImageUrl = images[0];
            imagesFound++;
          }
        } catch {
          // Skip failed image search
        }
      })
    );
  }

  yield {
    type: 'stage_completed',
    stage: 'images',
    message: `Found images for ${imagesFound} products`,
    itemCount: imagesFound,
    durationMs: Date.now() - stageStart6,
  };

  // ─────────────────────────────────────────────────────────────────
  // Stage 7: Draft Bag Assembly
  // ─────────────────────────────────────────────────────────────────
  yield { type: 'stage_started', stage: 'assembly', message: 'Assembling draft bag...' };
  const stageStart7 = Date.now();

  const bagTitle = generateBagTitle(metadata.title, metadata.channelName);

  const draftBag: DraftBag = {
    title: bagTitle,
    description: `Products from @${metadata.channelName}'s TikTok`,
    tags: [],
    coverPhotoUrl: metadata.thumbnailUrl,
    sourceVideoUrl: videoUrl,
    videoMetadata: metadata,
    products: draftProducts,
  };

  yield {
    type: 'stage_completed',
    stage: 'assembly',
    message: `Draft bag ready with ${draftProducts.length} products`,
    itemCount: draftProducts.length,
    durationMs: Date.now() - stageStart7,
  };

  const stats = {
    totalProducts: draftProducts.length,
    fromDescription: 0,
    fromTranscript: 0,
    fromVision: draftProducts.length,
    multiSource: 0,
    withImages: draftProducts.filter(p => p.productImageUrl || p.videoFrameUrl).length,
    withLinks: 0,
    totalDurationMs: Date.now() - pipelineStart,
  };

  const result: PipelineResult = { draftBag, stats };
  yield { type: 'pipeline_complete', result };
}
