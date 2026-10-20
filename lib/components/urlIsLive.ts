/**
 * "Curl-verified" in code: true only when the URL answers HTTP 200.
 * HEAD first; GET when the host refuses HEAD (405, 403) or the HEAD attempt
 * fails outright. Ten-second timeout per attempt. Used by the component seed
 * (bag_items.photo_url) and the library merge (referenceImages.primary).
 */
export async function urlIsLive(url: string, timeoutMs = 10_000): Promise<boolean> {
  const attempt = async (method: 'HEAD' | 'GET'): Promise<number> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: controller.signal });
      return res.status;
    } catch {
      return 0;
    } finally {
      clearTimeout(timer);
    }
  };
  let status = await attempt('HEAD');
  if (status === 405 || status === 403 || status === 0) status = await attempt('GET');
  return status === 200;
}

/** An https URL that answers 200, or null. Non-https candidates are never checked. */
export async function verifiedHttpsUrl(candidate: string | undefined | null): Promise<string | null> {
  if (!candidate || !/^https:\/\//i.test(candidate)) return null;
  return (await urlIsLive(candidate)) ? candidate : null;
}
