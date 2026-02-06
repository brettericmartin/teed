/**
 * Debug script to trace brand matching
 */

const text = 'lg ultragear gaming monitor';
const alias = 'on';

console.log(`Text: "${text}"`);
console.log(`Looking for alias: "${alias}"`);

// Find all occurrences
let pos = 0;
while (true) {
  const foundPos = text.indexOf(alias, pos);
  if (foundPos === -1) break;

  const before = foundPos > 0 ? text[foundPos - 1] : ' ';
  const after = foundPos + alias.length < text.length ? text[foundPos + alias.length] : ' ';

  console.log(`\nFound "${alias}" at position ${foundPos}`);
  console.log(`  Before char: "${before}" (code: ${before.charCodeAt(0)})`);
  console.log(`  After char: "${after}" (code: ${after.charCodeAt(0)})`);
  console.log(`  Word boundary before: /\\s|^/.test("${before}") = ${/\s|^/.test(before)}`);
  console.log(`  Word boundary after: /\\s|$|[^a-z]/.test("${after}") = ${/\s|$|[^a-z]/.test(after)}`);
  console.log(`  Would match: ${/\s|^/.test(before) && /\s|$|[^a-z]/.test(after)}`);

  pos = foundPos + 1;
}
