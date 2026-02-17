/**
 * Video Pipeline V2 Orchestrator
 *
 * 8-stage pipeline with dense 720p frame extraction and two-pass vision.
 * Yields PipelineEvent for SSE streaming (same interface as V1).
 *
 * Stages:
 * 1. Download + Metadata (yt-dlp at 720p)
 * 2. Dense Frame Extraction (ffmpeg every 2s + scene detection + perceptual dedup)
 * 3. Transcript + Fuzzy Match
 * 4. Text Detection (GPT-4o-mini on ALL frames)
 * 5. Product Identification (GPT-4o on representative frames)
 * 6. Cross-Validation + Gap Resolution
 * 7. Description Links (reused from V1)
 * 8. Fusion + Assembly
 */

import { promises as fs } from 'fs';
import * as path from 'path';

import { extractVideoId, getVideoDetails, extractUrlsFromDescription } from '../../contentIdeas/youtube';
import { fetchYouTubeTranscript, formatTimestamp } from '../../contentIdeas/transcript';
import type { TranscriptSegment } from '../../contentIdeas/transcript';
import { parseIsoDuration } from '../../contentIdeas/videoFrames';
import { identifyProduct } from '../../linkIdentification/index';
import { searchGoogleImages, buildProductSearchQuery } from '../../linkIdentification/googleImageSearch';
import { openai } from '../../openaiClient';
import { isTikTokUrl, fetchTikTokMetadata } from '../tiktokFrames';

import type {
  PipelineEvent,
  PipelineOptions,
  PipelineResult,
  VideoMetadata,
  DraftBag,
  DraftProduct,
  TranscriptProduct,
  DescriptionIdentifiedProduct,
  ProductSource,
} from '../types';

import { downloadVideo } from './videoDownloader';
import { extractFrames } from './frameExtractor';
import { FrameStore } from './frameStore';
import { detectTextInAllFrames } from './textDetector';
import { clusterTextDetections } from './textClusterer';
import { identifyProducts } from './productIdentifier';
import { crossValidate } from './crossValidator';
import { findUnmatchedMentions, resolveAllGaps } from './gapResolverV2';
import type { V2IdentifiedProduct } from './types';
import { fuseProducts } from './productFusion';
import { fixGarbledBrand } from './fuzzyBrandMatcher';

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Domains to skip when identifying description links */
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

/** Parse "M:SS" or "H:MM:SS" timestamp to milliseconds */
function parseTimestampToMs(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  return 0;
}

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
// V2 Pipeline Orchestrator
// ═══════════════════════════════════════════════════════════════════

export async function* runVideoPipelineV2(
  videoUrl: string,
  options: PipelineOptions = {},
): AsyncGenerator<PipelineEvent> {
  const {
    includeTranscript = true,
    maxDescriptionLinks = 15,
    imageConcurrency = 5,
  } = options;

  const pipelineStart = Date.now();
  let tempDir: string | null = null;

  try {
    // ─────────────────────────────────────────────────────────────────
    // Stage 1: Video Metadata
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'metadata', message: 'Fetching video metadata...' };
    const stageStart1 = Date.now();

    let metadata: VideoMetadata;
    const isTikTok = isTikTokUrl(videoUrl);

    if (isTikTok) {
      const tikTokMeta = await fetchTikTokMetadata(videoUrl);
      if (!tikTokMeta) {
        yield { type: 'pipeline_error', error: 'Failed to fetch TikTok video info.' };
        return;
      }
      metadata = {
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
    } else {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        yield { type: 'pipeline_error', error: 'Invalid YouTube URL.' };
        return;
      }

      const [videoDetails] = await getVideoDetails([videoId]);
      if (!videoDetails) {
        yield { type: 'pipeline_error', error: 'Video not found.' };
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
          || videoDetails.snippet.thumbnails.medium?.url || '',
        durationSeconds,
        tags: videoDetails.snippet.tags || [],
        publishedAt: videoDetails.snippet.publishedAt,
        viewCount: videoDetails.statistics?.viewCount
          ? parseInt(videoDetails.statistics.viewCount, 10) : undefined,
      };
    }

    yield { type: 'metadata_ready', metadata };
    yield {
      type: 'stage_completed', stage: 'metadata',
      message: `Got metadata for "${metadata.title}"`,
      durationMs: Date.now() - stageStart1,
    };

    // ─────────────────────────────────────────────────────────────────
    // Stage 2: Download Video + Dense Frame Extraction
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'vision', message: 'Downloading video at 720p...' };
    const stageStart2 = Date.now();

    const downloadResult = await downloadVideo(videoUrl);
    tempDir = downloadResult.tempDir;
    const frameDir = path.join(tempDir, 'frames');

    // Choose frame interval based on video duration
    const isShortVideo = metadata.durationSeconds < 120; // < 2 minutes
    const intervalSeconds = isShortVideo ? 1 : 2;

    yield { type: 'stage_started', stage: 'vision', message: `Extracting frames every ${intervalSeconds}s with scene detection...` };

    const frames = await extractFrames({
      videoPath: downloadResult.videoPath,
      outputDir: frameDir,
      durationSeconds: downloadResult.durationSeconds || metadata.durationSeconds,
      intervalSeconds,
      sceneDetection: true,
      dedupThreshold: 2,
    });

    // Initialize frame store
    const frameStore = new FrameStore({
      maxInMemory: 20,
      frameDir,
    });
    frameStore.addFrames(frames);

    yield {
      type: 'stage_completed', stage: 'vision',
      message: `Extracted ${frames.length} unique frames`,
      itemCount: frames.length,
      durationMs: Date.now() - stageStart2,
    };

    // ─────────────────────────────────────────────────────────────────
    // Stage 3 & 4: Transcript + Text Detection (run in parallel)
    // ─────────────────────────────────────────────────────────────────

    // Start both in parallel
    const transcriptPromise = (async () => {
      if (!includeTranscript || isTikTok) return { products: [] as TranscriptProduct[], text: '' };

      yield_stage_started: // label for clarity
      console.log('[V2] Starting transcript extraction...');

      try {
        const videoId = metadata.videoId;
        const transcriptResult = await fetchYouTubeTranscript(videoId);

        if (!transcriptResult.success || !transcriptResult.transcript) {
          return { products: [] as TranscriptProduct[], text: '' };
        }

        const timestampedLines = transcriptResult.segments
          .map((s: TranscriptSegment) => `[${formatTimestamp(s.offset)}] ${s.text}`)
          .join('\n');

        const products = await analyzeTranscriptWithAI(
          timestampedLines, metadata.title, metadata.channelName
        );

        // Second pass: find products the first pass missed
        const missedProducts = await findMissedProducts(
          timestampedLines, products, metadata.title, metadata.channelName
        );
        if (missedProducts.length > 0) {
          console.log(`[V2] Second transcript pass found ${missedProducts.length} more products`);
          products.push(...missedProducts);
        }

        // Post-process: fix garbled brands
        for (const p of products) {
          if (p.brand) {
            const corrected = fixGarbledBrand(p.brand);
            if (corrected) p.brand = corrected;
          }
        }

        return { products, text: transcriptResult.transcript };
      } catch (error) {
        console.error('[V2] Transcript extraction failed:', error);
        return { products: [] as TranscriptProduct[], text: '' };
      }
    })();

    // Text detection
    yield { type: 'stage_started', stage: 'transcript', message: 'Analyzing transcript + detecting text in all frames...' };
    const stageStart34 = Date.now();

    const textDetectionPromise = detectTextInAllFrames(
      frameStore,
      (processed, total) => {
        // Progress updates could be yielded but we can't from inside Promise.all
      }
    );

    // Wait for both to complete
    const [transcriptResult, textDetections] = await Promise.all([
      transcriptPromise,
      textDetectionPromise,
    ]);

    yield {
      type: 'stage_completed', stage: 'transcript',
      message: `Transcript: ${transcriptResult.products.length} products. Text: ${textDetections.filter(d => d.hasProductText).length} frames with product text.`,
      itemCount: transcriptResult.products.length,
      durationMs: Date.now() - stageStart34,
    };

    // ─────────────────────────────────────────────────────────────────
    // Stage 5: Cluster Text Detections + Product Identification
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'vision', message: 'Clustering text detections and identifying products...' };
    const stageStart5 = Date.now();

    // Cluster text detections into product groups
    const clusters = clusterTextDetections(
      textDetections,
      metadata.channelName,
    );

    // Enrich clusters with transcript context
    for (const cluster of clusters) {
      // Find transcript products mentioned within 30s of the cluster
      for (const tp of transcriptResult.products) {
        if (!tp.timestampMs) continue;
        if (Math.abs(tp.timestampMs - cluster.startMs) <= 30_000 ||
            Math.abs(tp.timestampMs - cluster.endMs) <= 30_000) {
          cluster.transcriptContext = tp.mentionContext || `${tp.brand || ''} ${tp.name}`;
          break;
        }
      }
    }

    // For short videos with few clusters, skip two-pass and send all frames to GPT-4o
    let visionProducts;

    if (isShortVideo && frames.length <= 30) {
      // Short video: direct GPT-4o on all frames (cheaper for <30 frames)
      console.log(`[V2] Short video (${frames.length} frames), using direct GPT-4o analysis`);
      // Create a cluster per frame for the identifier
      const directClusters = frames.map((f, i) => ({
        id: `direct_${String(i).padStart(3, '0')}`,
        representativeFrameId: f.id,
        frameIds: [f.id],
        startMs: f.timestampMs,
        endMs: f.timestampMs,
        texts: textDetections.find(d => d.frameId === f.id)?.texts || [],
        primaryText: textDetections.find(d => d.frameId === f.id)?.texts[0] || '',
      }));
      visionProducts = await identifyProducts(directClusters, frameStore, transcriptResult.text);
    } else if (clusters.length < 10 && frames.length > 50) {
      // Few clusters for a long video — might have minimal text overlays
      // Fall back to sampling frames evenly
      console.log(`[V2] Only ${clusters.length} clusters for ${frames.length} frames, adding sampled clusters`);
      const sampleInterval = Math.max(1, Math.floor(frames.length / 50));
      const sampledClusters = frames
        .filter((_, i) => i % sampleInterval === 0)
        .slice(0, 50)
        .map((f, i) => ({
          id: `sample_${String(i).padStart(3, '0')}`,
          representativeFrameId: f.id,
          frameIds: [f.id],
          startMs: f.timestampMs,
          endMs: f.timestampMs,
          texts: textDetections.find(d => d.frameId === f.id)?.texts || [],
          primaryText: textDetections.find(d => d.frameId === f.id)?.texts[0] || '',
        }));
      const allClusters = [...clusters, ...sampledClusters];
      visionProducts = await identifyProducts(allClusters, frameStore, transcriptResult.text);
    } else {
      // Normal path: identify products from text clusters
      visionProducts = await identifyProducts(clusters, frameStore, transcriptResult.text);
    }

    yield {
      type: 'stage_completed', stage: 'vision',
      message: `Identified ${visionProducts.length} products from ${clusters.length} clusters`,
      itemCount: visionProducts.length,
      durationMs: Date.now() - stageStart5,
    };

    // ─────────────────────────────────────────────────────────────────
    // Stage 6: Cross-Validation + Gap Resolution
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'fusion', message: 'Cross-validating across sources...' };
    const stageStart6 = Date.now();

    // Description links
    const descriptionProducts: DescriptionIdentifiedProduct[] = [];
    if (!isTikTok) {
      const extractedLinks = extractUrlsFromDescription(metadata.description);
      const productLinks = extractedLinks
        .filter(l => !isSocialUrl(l.url))
        .slice(0, maxDescriptionLinks);

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
              } catch { /* skip */ }
              return null;
            })
          );
          for (const r of results) {
            if (r !== null) descriptionProducts.push(r);
          }
        }
      }
    }

    // Cross-validate all sources
    const validated = crossValidate(
      visionProducts,
      transcriptResult.products,
      descriptionProducts,
    );

    // Resolve gaps: find unmatched transcript mentions
    const gaps = findUnmatchedMentions(transcriptResult.products, validated);
    let gapProducts: V2IdentifiedProduct[] = [];

    if (gaps.length > 0) {
      yield {
        type: 'stage_started', stage: 'fusion',
        message: `Resolving ${gaps.length} unmatched transcript mentions...`,
      };

      gapProducts = await resolveAllGaps(
        gaps,
        clusters,
        frameStore,
        downloadResult.videoPath,
        tempDir,
      );
    }

    // Combine validated + gap-resolved products
    const allProducts = [...validated, ...gapProducts.map(gp => ({
      ...gp,
      validatedConfidence: gp.confidence,
      transcriptMatch: gp.sources.includes('transcript'),
      descriptionMatch: false,
    }))];

    yield {
      type: 'stage_completed', stage: 'fusion',
      message: `${allProducts.length} products after cross-validation (${gaps.length} gaps resolved)`,
      itemCount: allProducts.length,
      durationMs: Date.now() - stageStart6,
    };

    // ─────────────────────────────────────────────────────────────────
    // Stage 7: Image Search
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'images', message: 'Fusing products and finding images...' };
    const stageStart7 = Date.now();

    // Fuse into DraftProducts
    const draftProducts = await fuseProducts(allProducts, frameStore, videoUrl);

    // Search for product images
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
          } catch { /* skip */ }
        })
      );
    }

    yield {
      type: 'stage_completed', stage: 'images',
      message: `Found images for ${imagesFound} products`,
      itemCount: imagesFound,
      durationMs: Date.now() - stageStart7,
    };

    // Emit product_found events
    for (const product of draftProducts) {
      yield { type: 'product_found', product, source: product.sources[0] };
    }

    // ─────────────────────────────────────────────────────────────────
    // Stage 8: Draft Bag Assembly
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'stage_started', stage: 'assembly', message: 'Assembling draft bag...' };
    const stageStart8 = Date.now();

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
      type: 'stage_completed', stage: 'assembly',
      message: `Draft bag ready with ${draftProducts.length} products`,
      itemCount: draftProducts.length,
      durationMs: Date.now() - stageStart8,
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

  } catch (error) {
    console.error('[V2] Pipeline error:', error);
    yield {
      type: 'pipeline_error',
      error: error instanceof Error ? error.message : 'V2 pipeline failed',
    };
  } finally {
    // Clean up temp directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Transcript AI Analysis (same as V1 but with fuzzy brand post-processing)
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
${timestampedTranscript.slice(0, 50000)}

For EACH distinct product mentioned:
1. Extract the exact brand and model/product name
2. Note the category (e.g., "shirt", "backpack", "laptop", "headphones", etc.)
3. Quote a brief snippet of what the creator said about it (mentionContext)
4. Note the timestamp where they FIRST mention it

BRAND RULES:
- Product line names are MODEL LINES, not brands. The BRAND is the parent company.
- ALWAYS set the brand to the parent company, NEVER to a product line name.
- Auto-transcripts often garble brand names. Common corrections:
  * "Erg Leon" / "Her Leon" = HercLeon (anti-odor clothing brand)
  * "Kettle" / "Cattle" = KETL Mtn (outdoor apparel brand)
  * "Onbound Marino" = Unbound Merino
  * "Sidon" / "Sea Don" = Seadon
  * "Cariuma" = Cariloha (bamboo products)
  * "Backbone" / "Packed" = Pakt (travel bags)
  * "Buffy" = BUFF (neckwear/headwear)
  * "10,000" = Ten Thousand (athletic brand)
  * "Ku Xiu" = KUXIU (tech accessories)
  * "Wandered" = WANDRD (camera gear brand)
  * "Basis" = Baseus (charging brand)

DEDUPLICATION:
- Return each distinct product ONCE with the timestamp of its FIRST mention.
- Different sizes/colors of the same model are NOT separate products.

IMPORTANT:
- Be thorough — extract EVERY distinct product, not just the main ones
- Include accessories, bags, apparel, tech, etc.
- If the creator mentions a brand+model, use the full name
- If they only say a model name, infer the brand from context

Return JSON:
{
  "products": [
    {
      "name": "Full Product Name (without brand prefix)",
      "brand": "Brand (parent company)",
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
      max_tokens: 8000,
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
    }) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      mentionContext: p.mentionContext,
      timestampMs: p.timestamp ? parseTimestampToMs(p.timestamp) : undefined,
      timestampFormatted: p.timestamp,
    } satisfies TranscriptProduct));
  } catch (error) {
    console.error('[V2] Transcript AI analysis failed:', error);
    return [];
  }
}

/**
 * Build dynamic hints about what categories might be missing.
 * Analyzes what was found and suggests gaps.
 */
function buildMissingCategoryHints(found: TranscriptProduct[]): string {
  const categories = new Map<string, number>();
  const brands = new Map<string, number>();
  for (const p of found) {
    if (p.category) {
      const cat = p.category.toLowerCase();
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }
    if (p.brand) {
      const brand = p.brand.toLowerCase();
      brands.set(brand, (brands.get(brand) || 0) + 1);
    }
  }

  const hints: string[] = [];

  // Multi-product brands likely have more items
  const multiBrands = [...brands.entries()]
    .filter(([, count]) => count >= 2)
    .map(([brand, count]) => `${brand} (${count} found so far)`);
  if (multiBrands.length > 0) {
    hints.push(`Brands with multiple products (likely have MORE items): ${multiBrands.join(', ')}`);
  }

  // Estimate total based on video title keywords
  hints.push(`You found ${found.length} products so far — there are probably more.`);

  return hints.length > 0 ? hints.join('\n') : '';
}

/**
 * Second-pass transcript analysis: find products that the first pass missed.
 * Shows the AI what was already found and asks for anything missed.
 */
async function findMissedProducts(
  timestampedTranscript: string,
  alreadyFound: TranscriptProduct[],
  videoTitle: string,
  channelName: string,
): Promise<TranscriptProduct[]> {
  if (alreadyFound.length < 10) return []; // First pass found very few — likely a different kind of video

  const foundList = alreadyFound
    .map(p => `- ${p.brand || '?'} ${p.name} (${p.category || '?'})`)
    .join('\n');

  const prompt = `This transcript was already analyzed and ${alreadyFound.length} products were found.

VIDEO TITLE: ${videoTitle}
CHANNEL: ${channelName}

ALREADY FOUND:
${foundList}

TRANSCRIPT:
${timestampedTranscript.slice(0, 50000)}

TASK: Carefully re-read the ENTIRE transcript word by word. Find products that are MISSING from the "Already Found" list above.

${buildMissingCategoryHints(alreadyFound)}

Look for ANY product category that seems underrepresented in the found list:
- Electronics & accessories (phones, tablets, earbuds, cases, adapters, cables, chargers, power banks, flash drives)
- Grooming & toiletries (razors, combs, tweezers, nail clippers, deodorant, toothbrush, toiletry bags/kits)
- Outerwear & layers (rain jackets, fleece, windbreakers, vests, hoodies)
- Travel accessories (sleep masks, earplugs, water bottles, first aid kits, travel adapters)
- Bags & organizers (dopp kits, pouches, packing cubes, stuff sacks)
- Products mentioned only once or in passing — these are easy to miss

CRITICAL: Even if the creator mentions a product for just 2-3 seconds, INCLUDE IT.
A brand with multiple products (e.g., Apple, Matador) may have items you only found one of — look for the rest.
Only return products that are GENUINELY NEW (not duplicates of what was already found).

Return JSON:
{
  "products": [
    {
      "name": "Product Name",
      "brand": "Brand",
      "category": "category",
      "mentionContext": "brief quote",
      "timestamp": "M:SS"
    }
  ]
}

If no additional products are found, return {"products": []}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
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
    }) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      mentionContext: p.mentionContext,
      timestampMs: p.timestamp ? parseTimestampToMs(p.timestamp) : undefined,
      timestampFormatted: p.timestamp,
    } satisfies TranscriptProduct));
  } catch (error) {
    console.error('[V2] Second transcript pass failed:', error);
    return [];
  }
}
