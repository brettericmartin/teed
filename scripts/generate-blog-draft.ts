#!/usr/bin/env npx tsx
/**
 * Blog draft generation script.
 *
 * Usage:
 *   npx tsx scripts/generate-blog-draft.ts --title "Why Bags Not Lists" --category philosophy
 *   npx tsx scripts/generate-blog-draft.ts --title "Complete Guide to Golf Bags" --category guide --tags golf,gear
 *
 * Outputs an .mdx file in content/blog/ with frontmatter pre-filled and draft: true.
 * Human reviews and edits before publishing (remove draft: true).
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const title = getArg('title');
const category = getArg('category') || 'guide';
const tagsRaw = getArg('tags') || '';
const author = getArg('author') || 'Teed';

if (!title) {
  console.error('Usage: npx tsx scripts/generate-blog-draft.ts --title "Post Title" --category philosophy');
  console.error('');
  console.error('Options:');
  console.error('  --title       Post title (required)');
  console.error('  --category    philosophy | guide | showcase | comparison | build-log | roundup');
  console.error('  --tags        Comma-separated tags');
  console.error('  --author      Author name (default: Teed)');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim();

const tags = tagsRaw
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

const today = new Date().toISOString().split('T')[0];

const frontmatter = `---
title: "${title}"
description: ""
publishedAt: "${today}"
author: "${author}"
category: "${category}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
keywords: []
draft: true
---`;

const categoryTemplates: Record<string, string> = {
  philosophy: `
## The idea

<!-- What's the core concept? -->

## Why it matters

<!-- Why should people care? -->

## How it shows up in Teed

<!-- How does this philosophy manifest in the product? -->

## The takeaway

<!-- One-line summary -->
`,
  guide: `
## Who this is for

<!-- Target audience -->

## Getting started

<!-- Step 1 -->

## Building your bag

<!-- The main how-to section -->

## Tips from the community

<!-- Social proof / examples -->

## What's next

<!-- CTA -->
`,
  showcase: `
## The bag

<!-- BagEmbed component goes here -->
<!-- <BagEmbed handle="username" code="bag-code" /> -->

## What stands out

<!-- What makes this collection interesting? -->

## The story

<!-- Creator's perspective -->

## Key items

<!-- Highlight 2-3 standout items -->
`,
  comparison: `
## The quick answer

<!-- TL;DR for people who just want the answer -->

## Feature comparison

<!-- Side-by-side breakdown -->

## When to use each

<!-- Use case matrix -->

## The bottom line

<!-- Final recommendation -->
`,
  'build-log': `
## The problem

<!-- What we were trying to solve -->

## How we approached it

<!-- Technical approach -->

## What we built

<!-- The solution -->

## What we learned

<!-- Lessons and takeaways -->
`,
  roundup: `
## Overview

<!-- Category introduction -->

## Top picks

<!-- Curated selection -->

## How we chose these

<!-- Selection criteria -->
`,
};

const body = categoryTemplates[category] || categoryTemplates['guide'];
const content = `${frontmatter}\n${body}\n`;

const outDir = path.join(process.cwd(), 'content', 'blog');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, `${slug}.mdx`);

if (fs.existsSync(outPath)) {
  console.error(`File already exists: ${outPath}`);
  console.error('Choose a different title or delete the existing file.');
  process.exit(1);
}

fs.writeFileSync(outPath, content, 'utf-8');
console.log(`Created draft: ${outPath}`);
console.log(`\nNext steps:`);
console.log(`  1. Edit the file and fill in the content`);
console.log(`  2. Remove "draft: true" from frontmatter when ready to publish`);
console.log(`  3. Run "npm run build" to verify it renders correctly`);
