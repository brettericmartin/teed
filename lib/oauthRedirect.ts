/**
 * Where an OAuth authorization code may be sent.
 *
 * The code carries a working Teed session, so it must only go to apps we
 * expect to connect (ChatGPT, Claude). Extra hosts can be added with the
 * OAUTH_ALLOWED_REDIRECT_HOSTS env var (comma separated).
 */
const DEFAULT_HOSTS = ['chatgpt.com', 'chat.openai.com', 'claude.ai', 'claude.com'];

function allowedHosts(): string[] {
  const extra = (process.env.OAUTH_ALLOWED_REDIRECT_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_HOSTS, ...extra];
}

export function isAllowedRedirectUri(redirectUri: string | null | undefined): boolean {
  if (!redirectUri) return false;
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return allowedHosts().some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
