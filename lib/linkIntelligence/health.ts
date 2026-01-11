/**
 * Link Health Monitoring
 *
 * Detects broken links, soft 404s, redirects, and availability status.
 * Critical for maintaining link quality in the creator economy.
 *
 * Features:
 * - HTTP status checking (HEAD with fallback to GET)
 * - Soft 404 detection (page exists but content gone)
 * - Redirect chain following
 * - Product availability detection
 * - Rate limiting and retry logic
 */

import type { LinkHealthResult, RedirectStep } from './types';

// =============================================================================
// SOFT 404 DETECTION PATTERNS
// =============================================================================

/**
 * Text patterns that indicate a soft 404 (page returns 200 but product/content is gone)
 */
const SOFT_404_PATTERNS: RegExp[] = [
  // Out of stock
  /out\s+of\s+stock/i,
  /sold\s+out/i,
  /currently\s+unavailable/i,
  /no\s+longer\s+available/i,
  /not\s+available/i,

  // Product not found
  /product\s+(not|no\s+longer)\s+found/i,
  /item\s+(not|no\s+longer)\s+found/i,
  /page\s+(not|could\s+not\s+be)\s+found/i,
  /this\s+item\s+is\s+(no\s+longer|not)\s+available/i,

  // Discontinued
  /has\s+been\s+(removed|discontinued)/i,
  /discontinued/i,
  /no\s+longer\s+(sold|carried|available)/i,

  // Generic not found
  /no\s+results\s+found/i,
  /we\s+couldn'?t\s+find/i,
  /doesn'?t\s+exist/i,
  /404/i,
  /error\s+404/i,

  // Removed content
  /video\s+(has\s+been\s+|is\s+)?(removed|deleted|unavailable)/i,
  /content\s+(is\s+)?unavailable/i,
  /this\s+(page|content)\s+isn'?t\s+available/i,
  /account\s+(has\s+been\s+)?(suspended|deleted|removed)/i,
];

/**
 * Patterns that indicate page is definitely valid (NOT a soft 404)
 * Used to override false positives
 */
const VALID_PAGE_PATTERNS: RegExp[] = [
  /add\s+to\s+cart/i,
  /add\s+to\s+bag/i,
  /buy\s+now/i,
  /in\s+stock/i,
  /currently\s+available/i,  // More specific than just "available"
  /is\s+available/i,         // "is available" but not "is no longer available"
  /\$\d+/,                   // Price with dollar sign
  /price:\s*\$?\d+/i,        // "Price: $X" format
];

/**
 * Check if content indicates a soft 404
 */
export function detectSoft404(html: string, url: string): { isSoft404: boolean; reason?: string } {
  // First check for valid page indicators
  const hasValidIndicators = VALID_PAGE_PATTERNS.some(pattern => pattern.test(html));
  if (hasValidIndicators) {
    return { isSoft404: false };
  }

  // Check soft 404 patterns
  for (const pattern of SOFT_404_PATTERNS) {
    if (pattern.test(html)) {
      return {
        isSoft404: true,
        reason: `Matched pattern: ${pattern.source}`,
      };
    }
  }

  // Check for suspiciously short content (possible redirect to homepage)
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (textContent.length < 500) {
    // Very short content - might be an error page
    return {
      isSoft404: true,
      reason: 'Suspiciously short page content',
    };
  }

  return { isSoft404: false };
}

// =============================================================================
// AVAILABILITY DETECTION
// =============================================================================

/**
 * Product availability patterns
 */
const AVAILABILITY_PATTERNS = {
  in_stock: [
    /in\s*stock/i,
    /available/i,
    /add\s+to\s+cart/i,
    /add\s+to\s+bag/i,
    /buy\s+now/i,
    /schema.*InStock/i,
    /availability.*InStock/i,
  ],
  out_of_stock: [
    /out\s+of\s+stock/i,
    /sold\s+out/i,
    /currently\s+unavailable/i,
    /not\s+available/i,
    /notify\s+me\s+when/i,
    /email\s+when\s+available/i,
    /back\s+in\s+stock/i,
    /schema.*OutOfStock/i,
    /availability.*OutOfStock/i,
  ],
  preorder: [
    /pre-?order/i,
    /coming\s+soon/i,
    /available\s+for\s+pre-?order/i,
    /schema.*PreOrder/i,
    /availability.*PreOrder/i,
  ],
  discontinued: [
    /discontinued/i,
    /no\s+longer\s+(sold|available|carried)/i,
    /has\s+been\s+discontinued/i,
    /schema.*Discontinued/i,
    /availability.*Discontinued/i,
  ],
};

/**
 * Detect product availability from page content
 */
export function detectAvailability(
  html: string
): 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' | 'unknown' {
  // Check patterns in priority order (most specific first)
  if (AVAILABILITY_PATTERNS.discontinued.some(p => p.test(html))) {
    return 'discontinued';
  }
  if (AVAILABILITY_PATTERNS.preorder.some(p => p.test(html))) {
    return 'preorder';
  }
  if (AVAILABILITY_PATTERNS.out_of_stock.some(p => p.test(html))) {
    return 'out_of_stock';
  }
  if (AVAILABILITY_PATTERNS.in_stock.some(p => p.test(html))) {
    return 'in_stock';
  }

  return 'unknown';
}

// =============================================================================
// URL HEALTH CHECKING
// =============================================================================

export interface HealthCheckOptions {
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  checkContent?: boolean;
  userAgent?: string;
}

const DEFAULT_OPTIONS: HealthCheckOptions = {
  timeout: 15000,
  followRedirects: true,
  maxRedirects: 5,
  checkContent: true,
  userAgent: 'TeedBot/1.0 (+https://teed.gg)',
};

/**
 * User agents for rotation (to avoid being blocked)
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Check the health of a URL
 *
 * @param url - URL to check
 * @param options - Check options
 * @returns Health check result
 */
export async function checkUrlHealth(
  url: string,
  options: HealthCheckOptions = {}
): Promise<LinkHealthResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  const redirectChain: RedirectStep[] = [];

  let currentUrl = url;
  let redirectCount = 0;
  let finalStatus: number | null = null;
  let finalHtml: string | undefined;
  let blocked = false;
  let errorMessage: string | undefined;

  try {
    // First try HEAD request (faster, less bandwidth)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    let response: Response;

    try {
      response = await fetch(currentUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': opts.userAgent || getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'manual', // Handle redirects manually to track chain
        signal: controller.signal,
      });
    } catch {
      // If HEAD fails, try GET
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': opts.userAgent || getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual',
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    // Handle redirects
    while (response.status >= 300 && response.status < 400 && opts.followRedirects) {
      const location = response.headers.get('location');
      if (!location) break;

      redirectChain.push({
        url: currentUrl,
        status: response.status,
        location,
      });

      redirectCount++;
      if (redirectCount > opts.maxRedirects!) {
        break;
      }

      // Resolve relative URLs
      currentUrl = new URL(location, currentUrl).toString();

      const redirectController = new AbortController();
      const redirectTimeout = setTimeout(() => redirectController.abort(), opts.timeout);

      response = await fetch(currentUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': opts.userAgent || getRandomUserAgent(),
        },
        redirect: 'manual',
        signal: redirectController.signal,
      });

      clearTimeout(redirectTimeout);
    }

    finalStatus = response.status;

    // If we need to check content for soft 404s or availability
    if (opts.checkContent && response.ok) {
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), opts.timeout);

      const getResponse = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': opts.userAgent || getRandomUserAgent(),
        },
        signal: getController.signal,
      });

      clearTimeout(getTimeout);

      if (getResponse.ok) {
        finalHtml = await getResponse.text();
      }
    }
  } catch (error) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      return {
        url,
        checked: true,
        checkedAt: new Date(),
        httpStatus: null,
        responseTimeMs: Date.now() - startTime,
        redirected: redirectCount > 0,
        finalUrl: currentUrl,
        redirectCount,
        redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
        health: 'timeout',
        isSoft404: false,
        error: 'Request timed out',
      };
    }

    return {
      url,
      checked: true,
      checkedAt: new Date(),
      httpStatus: null,
      responseTimeMs: Date.now() - startTime,
      redirected: redirectCount > 0,
      finalUrl: currentUrl,
      redirectCount,
      redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
      health: 'error',
      isSoft404: false,
      error: err.message,
    };
  }

  const responseTimeMs = Date.now() - startTime;

  // Determine health status
  let health: LinkHealthResult['health'];
  let isSoft404 = false;
  let soft404Reason: string | undefined;
  let availability: LinkHealthResult['availability'];

  if (finalStatus === null) {
    health = 'error';
  } else if (finalStatus >= 200 && finalStatus < 300) {
    // Success - but check for soft 404
    if (finalHtml) {
      const soft404Check = detectSoft404(finalHtml, currentUrl);
      isSoft404 = soft404Check.isSoft404;
      soft404Reason = soft404Check.reason;

      if (isSoft404) {
        health = 'soft_404';
      } else {
        health = 'healthy';
        availability = detectAvailability(finalHtml);
      }
    } else {
      health = 'healthy';
    }
  } else if (finalStatus === 403 || finalStatus === 429) {
    health = 'blocked';
    blocked = true;
  } else if (finalStatus === 404 || finalStatus === 410) {
    health = 'broken';
  } else if (finalStatus >= 500) {
    health = 'unavailable';
  } else {
    health = 'error';
  }

  return {
    url,
    checked: true,
    checkedAt: new Date(),
    httpStatus: finalStatus,
    responseTimeMs,
    redirected: redirectCount > 0,
    finalUrl: currentUrl !== url ? currentUrl : undefined,
    redirectCount: redirectCount > 0 ? redirectCount : undefined,
    redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
    health,
    isSoft404,
    soft404Reason,
    availability,
    error: errorMessage,
  };
}

// =============================================================================
// BATCH HEALTH CHECKING
// =============================================================================

export interface BatchHealthCheckOptions extends HealthCheckOptions {
  concurrency?: number;
  delayBetweenRequests?: number;
  onProgress?: (completed: number, total: number, result: LinkHealthResult) => void;
}

/**
 * Check health of multiple URLs with rate limiting
 */
export async function batchCheckUrlHealth(
  urls: string[],
  options: BatchHealthCheckOptions = {}
): Promise<Map<string, LinkHealthResult>> {
  const {
    concurrency = 3,
    delayBetweenRequests = 1000,
    onProgress,
    ...checkOptions
  } = options;

  const results = new Map<string, LinkHealthResult>();
  let completed = 0;

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await checkUrlHealth(url, checkOptions);
        return { url, result };
      })
    );

    for (const { url, result } of batchResults) {
      results.set(url, result);
      completed++;
      onProgress?.(completed, urls.length, result);
    }

    // Delay between batches to respect rate limits
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    }
  }

  return results;
}

// =============================================================================
// HEALTH STATISTICS
// =============================================================================

export interface HealthStats {
  total: number;
  healthy: number;
  broken: number;
  soft404: number;
  unavailable: number;
  blocked: number;
  timeout: number;
  error: number;
  averageResponseTime: number;
  redirectPercentage: number;
}

/**
 * Calculate health statistics from check results
 */
export function calculateHealthStats(
  results: Map<string, LinkHealthResult> | LinkHealthResult[]
): HealthStats {
  const resultList = Array.isArray(results) ? results : Array.from(results.values());

  const stats: HealthStats = {
    total: resultList.length,
    healthy: 0,
    broken: 0,
    soft404: 0,
    unavailable: 0,
    blocked: 0,
    timeout: 0,
    error: 0,
    averageResponseTime: 0,
    redirectPercentage: 0,
  };

  let totalResponseTime = 0;
  let redirectCount = 0;

  for (const result of resultList) {
    switch (result.health) {
      case 'healthy':
        stats.healthy++;
        break;
      case 'broken':
        stats.broken++;
        break;
      case 'soft_404':
        stats.soft404++;
        break;
      case 'unavailable':
        stats.unavailable++;
        break;
      case 'blocked':
        stats.blocked++;
        break;
      case 'timeout':
        stats.timeout++;
        break;
      case 'error':
        stats.error++;
        break;
    }

    if (result.responseTimeMs) {
      totalResponseTime += result.responseTimeMs;
    }
    if (result.redirected) {
      redirectCount++;
    }
  }

  stats.averageResponseTime = resultList.length > 0
    ? Math.round(totalResponseTime / resultList.length)
    : 0;
  stats.redirectPercentage = resultList.length > 0
    ? Math.round((redirectCount / resultList.length) * 100)
    : 0;

  return stats;
}
