import type { CroppedItem, VisualSearchItem, WebDetectionResult } from './types';

/** Max concurrent Cloud Vision API calls */
const CONCURRENCY_LIMIT = 5;

/**
 * Image domains that OpenAI/downstream cannot access (CDN auth, hotlink protection).
 * Filter these out at collection time so downstream stages get cleaner data.
 */
const BLOCKED_IMAGE_DOMAINS = [
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'fbcdn.net',
  'fbsbx.com',
  'cdninstagram.com',
  'pinimg.com',
  'twimg.com',
  'pbs.twimg.com',
  'redd.it',
  'i.redd.it',
  'preview.redd.it',
  'media.tumblr.com',
];

function isAccessibleImageUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return !BLOCKED_IMAGE_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Stage 3: Visual Search — run Google Cloud Vision webDetection on each crop.
 *
 * Returns web entities, best guess labels, matching pages, and similar images
 * that can be fed as hints to the GPT-4o identification stage.
 *
 * Graceful degradation: missing API key or API errors → webDetection: null.
 */
export async function visualSearchItems(
  croppedItems: CroppedItem[]
): Promise<VisualSearchItem[]> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn('[visualSearch] No GOOGLE_CLOUD_VISION_API_KEY or GOOGLE_SEARCH_API_KEY found, skipping web detection');
    return croppedItems.map((item) => ({ ...item, webDetection: null }));
  }

  const results: VisualSearchItem[] = [];

  for (let i = 0; i < croppedItems.length; i += CONCURRENCY_LIMIT) {
    const batch = croppedItems.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((item) => searchSingleItem(item, apiKey))
    );
    results.push(...batchResults);
  }

  return results;
}

async function searchSingleItem(
  item: CroppedItem,
  apiKey: string
): Promise<VisualSearchItem> {
  try {
    // Strip the data:image/...;base64, prefix for the API
    const base64Content = item.cropBase64.replace(/^data:image\/\w+;base64,/, '');

    const body = {
      requests: [
        {
          image: { content: base64Content },
          features: [{ type: 'WEB_DETECTION', maxResults: 10 }],
        },
      ],
    };

    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[visualSearch] API error for item ${item.id}: ${response.status} ${errorText.substring(0, 200)}`);
      return { ...item, webDetection: null };
    }

    const data = await response.json();
    const webDetection = data.responses?.[0]?.webDetection;

    if (!webDetection) {
      return { ...item, webDetection: null };
    }

    const result: WebDetectionResult = {
      bestGuessLabels: (webDetection.bestGuessLabels ?? []).map(
        (l: { label: string }) => l.label
      ),
      webEntities: (webDetection.webEntities ?? [])
        .filter((e: { description?: string }) => e.description)
        .map((e: { entityId?: string; description: string; score: number }) => ({
          entityId: e.entityId,
          description: e.description,
          score: e.score ?? 0,
        })),
      fullMatchingImageUrls: (webDetection.fullMatchingImages ?? [])
        .map((img: { url: string }) => img.url)
        .filter(isAccessibleImageUrl),
      partialMatchingImageUrls: (webDetection.partialMatchingImages ?? [])
        .map((img: { url: string }) => img.url)
        .filter(isAccessibleImageUrl),
      visuallySimilarImageUrls: (webDetection.visuallySimilarImages ?? [])
        .map((img: { url: string }) => img.url)
        .filter(isAccessibleImageUrl),
      matchingPages: (webDetection.pagesWithMatchingImages ?? []).map(
        (p: { url: string; pageTitle?: string }) => ({
          url: p.url,
          pageTitle: p.pageTitle,
        })
      ),
    };

    const labelStr = result.bestGuessLabels.join(', ') || 'none';
    console.log(`[visualSearch] Item ${item.id} (${item.label}): guess="${labelStr}", ${result.webEntities.length} entities, ${result.matchingPages.length} pages`);

    return { ...item, webDetection: result };
  } catch (error) {
    console.warn(`[visualSearch] Failed for item ${item.id} (${item.label}):`, error);
    return { ...item, webDetection: null };
  }
}
