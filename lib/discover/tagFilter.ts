/**
 * PostgREST `or` filter matching bags whose jsonb `tags` array contains ANY of
 * the given tags. `.overlaps()` doesn't work here: it sends `&&`, which Postgres
 * has no operator for on jsonb (error 42883), so every tag link failed.
 *
 * Each tag becomes `tags.cs."[\"tag\"]"`. Values are double-quoted (escaping
 * `\` and `"`) because tags can hold spaces, colons and commas.
 */
export function anyTagOrFilter(tags: string[]): string {
  const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return tags.map((t) => `tags.cs.${quote(JSON.stringify([t]))}`).join(',');
}
