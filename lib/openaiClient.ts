import OpenAI from 'openai';

// WARNING: This client must NOT be imported or used in client components.
// It uses process.env.OPENAI_API_KEY which should never be exposed to the browser.
// Only use this in server components, server actions, and API routes.

let cached: OpenAI | null = null;

/**
 * Lazily constructed OpenAI client.
 *
 * Built on first call rather than at module scope so Next's "collect page data"
 * build step (which evaluates route modules with no env present) cannot fail
 * on a missing OPENAI_API_KEY. A missing key only fails the request that uses it.
 */
export function getOpenAI(): OpenAI {
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  cached = new OpenAI({ apiKey });
  return cached;
}
