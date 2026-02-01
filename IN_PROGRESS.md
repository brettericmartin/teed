# AI & Search Discoverability Implementation - In Progress

## Problem
Teed needs to be discoverable when people ask AI assistants or search engines for "link sharing tools", "gear list apps", "collection sharing", etc. Currently missing technical SEO foundation, landing pages, and structured data.

## Root Cause / Analysis
- No robots.txt or sitemap.xml
- No llms.txt file for AI crawlers
- No use-case landing pages (/for/golfers, /for/photographers)
- No comparison pages (Teed vs Linktree)
- Limited structured data implementation

## Solution
Implement comprehensive SEO and AI discoverability strategy:
1. Technical SEO foundation (robots.txt, sitemap, llms.txt)
2. Use-case landing pages with data-driven content
3. Comparison pages
4. Enhanced structured data

## Status

### Phase 1: Technical SEO Foundation
- [x] Create /public/robots.txt
- [x] Create /app/sitemap.ts (dynamic sitemap)
- [x] Create /public/llms.txt
- [x] Enhance homepage metadata in /app/page.tsx

### Phase 2: Use-Case Landing Pages
- [x] Create /lib/data/useCases.ts (content data)
- [x] Create /app/for/[useCase]/page.tsx (dynamic template)
- [x] Generate pages: golfers, photographers, creators, travelers, outdoors, tech, musicians, fitness

### Phase 3: Comparison & Authority Pages
- [x] Create /lib/data/comparisons.ts
- [x] Create /app/vs/[competitor]/page.tsx
- [x] Create /app/about/page.tsx
- [x] Create /app/alternatives/page.tsx

### Phase 4: Enhanced Structured Data
- [x] Add Organization schema to homepage
- [x] Add WebApplication schema
- [x] Add FAQPage schema to landing pages
- [x] Add BreadcrumbList to all pages

## Files Created/Modified

### Created
- `/public/robots.txt` - Search engine directives
- `/public/llms.txt` - AI assistant documentation
- `/app/sitemap.ts` - Dynamic sitemap generation
- `/components/home/HomeClient.tsx` - Client component extracted from homepage
- `/lib/data/useCases.ts` - Use case content data (8 use cases)
- `/lib/data/comparisons.ts` - Comparison content data (4 comparisons)
- `/app/for/[useCase]/page.tsx` - Use case landing page template
- `/app/vs/[competitor]/page.tsx` - Comparison page template
- `/app/about/page.tsx` - About Teed page
- `/app/alternatives/page.tsx` - Alternatives hub page

### Modified
- `/app/page.tsx` - Refactored to server component with enhanced metadata and JSON-LD

## Verification

### Technical SEO
- [x] robots.txt accessible at /robots.txt
- [x] sitemap.xml generated at /sitemap.xml
- [x] llms.txt accessible at /llms.txt
- [x] Build passes successfully

### Pages Created
Use-case pages at /for/:
- /for/golfers
- /for/photographers
- /for/creators
- /for/travelers
- /for/outdoors
- /for/tech
- /for/musicians
- /for/fitness

Comparison pages at /vs/:
- /vs/linktree
- /vs/amazon-lists
- /vs/notion
- /vs/spreadsheets

Authority pages:
- /about
- /alternatives

### Structured Data Included
- Organization schema (homepage)
- WebApplication schema (homepage)
- FAQPage schema (use-case and comparison pages)
- BreadcrumbList schema (all new pages)

## Next Steps
1. Deploy to production
2. Submit sitemap to Google Search Console
3. Test AI discovery with ChatGPT and Perplexity
4. Monitor search rankings for target keywords
5. Phase 5 (External): List on Product Hunt, G2, Capterra

## External Tasks (Not Code)
- [ ] Submit to Product Hunt
- [ ] Create G2 listing
- [ ] Create Capterra listing
- [ ] Create Wikidata entry
- [ ] Reach out to "best link in bio tools" blogs
