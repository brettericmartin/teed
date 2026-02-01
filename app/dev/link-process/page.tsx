import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Link2, Search, Brain, Database, Image, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Link Identification Process - Teed Developer Reference',
  description: 'Technical documentation for how Teed identifies products from URLs. Covers URL parsing, structured data extraction, scraping fallbacks, and AI analysis.',
  robots: 'noindex', // Developer page, not for search engines
};

const stages = [
  {
    id: 0,
    name: 'Product Library Lookup',
    icon: Database,
    color: 'purple',
    confidence: '100%',
    description: 'Check if we\'ve already identified this exact URL before.',
    details: [
      'Hash the URL and check our product_library table',
      'If found, return cached result immediately',
      'Saves API calls and ensures consistency',
      'Cache is populated by successful scrapes',
    ],
    exitCondition: 'URL found in library → return cached result',
  },
  {
    id: 1,
    name: 'URL Intelligence',
    icon: Link2,
    color: 'blue',
    confidence: '30-85%',
    description: 'Extract product info from URL structure without any network requests.',
    details: [
      'Parse domain to identify brand (800+ domains mapped)',
      'Extract product slug from URL path',
      'Score multiple slug candidates to find the best one',
      'Humanize slug: "license-to-train-jogger" → "License To Train Jogger"',
      'Extract SKU, color, size from URL patterns',
    ],
    exitCondition: 'Brand + humanized name with ≥85% confidence → optional AI polish, then return',
  },
  {
    id: 2,
    name: 'Lightweight Fetch',
    icon: Search,
    color: 'green',
    confidence: '95%',
    description: 'Fetch page and extract structured data (JSON-LD, Open Graph, meta tags).',
    details: [
      'HTTP GET with browser-like headers',
      'Parse JSON-LD Product schema if present',
      'Extract Open Graph tags (og:title, og:image, og:price)',
      'Parse meta description and standard HTML title',
      'Detect bot blocking (Cloudflare, access denied pages)',
    ],
    exitCondition: 'JSON-LD product data found → return with 95% confidence',
  },
  {
    id: 2.5,
    name: 'Amazon Lookup',
    icon: Zap,
    color: 'orange',
    confidence: '90%',
    description: 'For Amazon URLs, use specialized ASIN lookup.',
    details: [
      'Extract ASIN from URL (B0XXXXXXXX pattern)',
      'Query Amazon Product Advertising API',
      'Get official title, brand, price, images',
      'Skip widget/affiliate image URLs (unreliable)',
    ],
    exitCondition: 'Amazon API returns valid product → return with 90% confidence',
  },
  {
    id: 2.6,
    name: 'Firecrawl Scraping',
    icon: Zap,
    color: 'red',
    confidence: '90%',
    description: 'For blocked sites, use Firecrawl to render JavaScript and bypass protection.',
    details: [
      'Triggered when lightweight fetch is blocked or fails on retailers',
      'Firecrawl renders page with headless browser',
      'Extracts structured data from rendered DOM',
      'Falls back to Jina Reader if Firecrawl fails',
      'Results are cached to product_library',
    ],
    exitCondition: 'Firecrawl/Jina returns valid title → return with 75-90% confidence',
  },
  {
    id: 2.7,
    name: 'Google Images Fallback',
    icon: Image,
    color: 'pink',
    confidence: '75%',
    description: 'When scraping fails but URL parsing succeeded, search for product images.',
    details: [
      'Build search query: "[brand] [product name]"',
      'Search Google Images API for product photos',
      'Return first relevant image result',
      'Combines URL-parsed name with web images',
    ],
    exitCondition: 'URL has brand + name → return with image from Google',
  },
  {
    id: 3,
    name: 'AI Semantic Analysis',
    icon: Brain,
    color: 'violet',
    confidence: '70-90%',
    description: 'Use AI to analyze URL and page content for product identification.',
    details: [
      'Send URL + any extracted content to Claude',
      'AI identifies brand, product name, category',
      'Can recognize products from partial information',
      'Handles edge cases and unusual URL formats',
      'Updates unrecognized domain tracking with AI suggestions',
    ],
    exitCondition: 'AI returns identification → return with AI confidence score',
  },
];

const urlParsingDetails = {
  title: 'URL Parsing Deep Dive',
  description: 'How we extract product information from URL structure',
  sections: [
    {
      name: 'Domain Brand Mapping',
      content: 'We maintain a database of 800+ domains mapped to brands. For brand sites (nike.com → Nike), the domain tells us the brand. For retailers (amazon.com, target.com), brand comes from the product slug.',
    },
    {
      name: 'Product Path Detection',
      content: 'We look for product indicators in the URL path: /p/, /product/, /products/, /dp/, /item/, etc. The segment after these indicators typically contains the product slug.',
    },
    {
      name: 'Slug Scoring System',
      content: `When multiple URL segments could be the product slug, we score each candidate:

• +20 points: Contains hyphens (product-name-style)
• +5 per hyphen: More specific names (max +25)
• +length: Longer names are more specific (max +50)
• +10 points: Mixed case (Title-Case)
• -50 points: Pure category words (men, women, shoes)
• -30 points: Category patterns (joggers, running, sale)
• -30 points: SKU-style patterns (DW-TA127)
• -20 points: ID patterns (prod12345)`,
    },
    {
      name: 'Site-Specific URL Configs',
      content: `Some sites have unique URL structures. We configure these explicitly:

• Lululemon: /p/{category}/{slug}/_/{id} → take index 1
• Nike: /t/{category}/{slug}/{sku} → take index 1
• Target: /p/{slug}/-/A-{id} → take index 0
• REI: /product/{id}/{slug} → take index 1`,
    },
    {
      name: 'Slug Humanization',
      content: 'Convert URL slugs to readable names: "license-to-train-jogger-md" → "License To Train Jogger MD". We apply golf model corrections (qi10 → Qi10, tsr3 → TSR3) and remove brand prefixes to avoid duplication.',
    },
  ],
};

export default function LinkProcessPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <li>
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li className="text-[var(--text-primary)]">Link Identification Process</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[var(--teed-green-3)] rounded-lg">
            <Link2 className="w-6 h-6 text-[var(--teed-green-10)]" />
          </div>
          <span className="text-sm font-medium text-[var(--text-tertiary)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
            Developer Reference
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
          Link Identification Process
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          How Teed identifies products from URLs. This is the canonical reference for the identification
          pipeline used across the dashboard, bag editor, bulk import, and API.
        </p>
      </header>

      {/* Pipeline Overview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Pipeline Stages
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          The pipeline runs through multiple stages, exiting early when confidence is high enough.
          Each stage adds more information but also more latency and cost.
        </p>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${stage.color}-100 dark:bg-${stage.color}-900/20 flex-shrink-0`}
                    style={{ backgroundColor: `var(--${stage.color}-3, var(--surface-elevated))` }}>
                    <Icon className="w-6 h-6" style={{ color: `var(--${stage.color}-10, var(--text-primary))` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Stage {stage.id}: {stage.name}
                      </h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                        {stage.confidence} confidence
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-4">
                      {stage.description}
                    </p>
                    <ul className="space-y-2 mb-4">
                      {stage.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <span className="text-[var(--text-tertiary)] mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[var(--teed-green-8)]" />
                      <span className="text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Exit:</strong> {stage.exitCondition}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* URL Parsing Details */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          {urlParsingDetails.title}
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          {urlParsingDetails.description}
        </p>

        <div className="space-y-6">
          {urlParsingDetails.sections.map((section, index) => (
            <div
              key={index}
              className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                {section.name}
              </h3>
              <div className="text-[var(--text-secondary)] whitespace-pre-line text-sm font-mono bg-[var(--surface-elevated)] p-4 rounded-lg">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Files Reference */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Key Files
        </h2>
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-elevated)]">
              <tr>
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">File</th>
                <th className="text-left px-4 py-3 text-[var(--text-secondary)] font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {[
                { file: 'lib/linkIdentification/index.ts', purpose: 'Main pipeline orchestrator' },
                { file: 'lib/linkIdentification/urlParser.ts', purpose: 'URL parsing, slug scoring, humanization' },
                { file: 'lib/linkIdentification/domainBrands.ts', purpose: 'Domain → brand mapping (800+ entries)' },
                { file: 'lib/linkIdentification/lightweightFetch.ts', purpose: 'HTTP fetch with structured data extraction' },
                { file: 'lib/linkIdentification/firecrawl.ts', purpose: 'Firecrawl API integration for JS rendering' },
                { file: 'lib/linkIdentification/jinaReader.ts', purpose: 'Jina Reader fallback scraper' },
                { file: 'lib/linkIdentification/amazonLookup.ts', purpose: 'Amazon Product Advertising API' },
                { file: 'lib/linkIdentification/aiSemanticAnalysis.ts', purpose: 'Claude AI analysis' },
                { file: 'lib/linkIdentification/productLibrary.ts', purpose: 'Cache layer for scraped products' },
                { file: 'lib/linkIdentification/googleImageSearch.ts', purpose: 'Google Images API for fallback images' },
              ].map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{item.file}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{item.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          Usage
        </h2>
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
            Basic Usage
          </h3>
          <pre className="text-sm font-mono bg-[var(--surface-elevated)] p-4 rounded-lg overflow-x-auto text-[var(--text-secondary)]">
{`import { identifyProduct } from '@/lib/linkIdentification';

const result = await identifyProduct(url);

// result includes:
// - brand: string | null
// - productName: string
// - fullName: string (brand + product)
// - category: string | null
// - price: string | null
// - imageUrl: string | null
// - confidence: number (0-1)
// - primarySource: string (which stage succeeded)
// - processingTimeMs: number`}
          </pre>

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-3">
            Options
          </h3>
          <pre className="text-sm font-mono bg-[var(--surface-elevated)] p-4 rounded-lg overflow-x-auto text-[var(--text-secondary)]">
{`// URL parsing only (no network requests)
const result = await identifyProduct(url, { urlOnly: true });

// Skip AI analysis (faster, cheaper)
const result = await identifyProduct(url, { skipAI: true });

// Custom timeouts
const result = await identifyProduct(url, {
  fetchTimeout: 3000,
  earlyExitConfidence: 0.9
});`}
          </pre>
        </div>
      </section>
    </div>
  );
}
