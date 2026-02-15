/**
 * URL validation utilities to prevent SSRF attacks.
 * Blocks requests to private/internal IP ranges and non-HTTPS URLs.
 */

// Private and reserved IP ranges that should never be fetched
const BLOCKED_IP_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-grade NAT
  /^(fc|fd)/, // IPv6 private (rough check for hex hostnames)
  /^localhost$/i,
  /^\[::1\]$/, // IPv6 loopback
];

// Hostnames that should never be fetched
const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata',
  'kubernetes.default.svc',
];

/**
 * Validates that a URL is safe to fetch (not targeting internal/private resources).
 * Returns null if safe, or an error message if blocked.
 */
export function validateExternalUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL format';
  }

  // Must be HTTP or HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only HTTP/HTTPS URLs are allowed';
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return 'URL points to a blocked host';
  }

  // Block private IP ranges
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return 'URL points to a private/internal address';
    }
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    return 'URLs with credentials are not allowed';
  }

  return null; // Safe
}
