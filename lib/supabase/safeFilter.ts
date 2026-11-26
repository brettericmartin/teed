/**
 * Makes user text safe to put inside a PostgREST `.or()` filter string.
 *
 * `.or()` takes a raw filter expression, so commas, parentheses, quotes and
 * wildcards in the text can end the condition early or add new ones. This
 * strips those characters (they are not useful in a search anyway) and caps
 * the length.
 */
export function safeFilterTerm(raw: string | null | undefined, maxLength = 100): string {
  return (raw ?? '')
    .replace(/[,()"'\\%*:{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** A referral code or id: letters, digits, dash and underscore only. */
export function isSafeCode(raw: string | null | undefined): raw is string {
  return typeof raw === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(raw);
}
