export type CategoryType = 'feature' | 'improvement' | 'bugfix';

export interface PatchNoteChange {
  text: string;
  category: CategoryType;
  isAdminOnly?: boolean;
}

export interface PatchNote {
  version: string;
  releaseDate: string;
  title: string;
  summary?: string;
  changes: PatchNoteChange[];
  isLatest?: boolean;
}

export const CATEGORY_META: Record<CategoryType, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  feature: {
    label: 'New Feature',
    bgClass: 'bg-[var(--teed-green-3)]',
    textClass: 'text-[var(--teed-green-11)]',
    borderClass: 'border-[var(--teed-green-6)]'
  },
  improvement: {
    label: 'Improvement',
    bgClass: 'bg-[var(--sky-3)]',
    textClass: 'text-[var(--sky-11)]',
    borderClass: 'border-[var(--sky-6)]'
  },
  bugfix: {
    label: 'Bug Fix',
    bgClass: 'bg-[var(--sand-3)]',
    textClass: 'text-[var(--sand-11)]',
    borderClass: 'border-[var(--sand-6)]'
  }
};

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '2.9.0',
    releaseDate: '2026-02-12',
    title: 'New Logo & Visual Identity',
    summary: 'Teed has a brand new logo and visual identity, born from a Freelancer contest that attracted 2,635 entries in just 3 days. The rebrand also updates the display name to Teed.club across the entire platform.',
    isLatest: true,
    changes: [
      { text: 'New logo designed through a Freelancer contest with 2,635 entries from designers worldwide', category: 'feature' },
      { text: 'Two logo variants — circular icon for compact contexts (favicon, nav) and full horizontal lockup with wordmark', category: 'feature' },
      { text: 'Brand identity updated from "Teed" to "Teed.club" across all pages, metadata, emails, RSS feeds, structured data, and social previews', category: 'improvement' },
      { text: 'New SVG favicon and navigation icon with the updated circular logo mark', category: 'improvement' },
      { text: 'SEO metadata, Open Graph tags, and JSON-LD structured data updated with new brand name', category: 'improvement' },
      { text: 'Fixed avatar upload showing an error despite succeeding — profile PATCH endpoint now accepts avatar_url', category: 'bugfix' },
    ]
  },
  {
    version: '2.8.0',
    releaseDate: '2026-02-11',
    title: 'Massive Brand Dictionary Expansion & Smarter AI Search',
    summary: 'Brand dictionary expanded from 680 to 1,467 brands across 48 categories. Fuzzy matching is tighter, AI search no longer hallucinates products from known brands, and video URLs are now handled natively.',
    isLatest: false,
    changes: [
      { text: 'Brand dictionary expanded from 680 to 1,467 brands across 48 categories — golf, tech, audio, photography, automotive, motorcycle, coffee, EDC, fitness, baby, pet, kitchen, and dozens more', category: 'feature' },
      { text: 'Fuzzy matching tightened to prevent false positives — short brand names now require first-character match (e.g. "golf" no longer matches "Wolf")', category: 'improvement' },
      { text: 'AI product search rewritten to try multiple brand interpretations instead of substituting known brands — searching "Ripper Golf Club Headcover" now treats Ripper as the brand instead of guessing TaylorMade', category: 'improvement' },
      { text: 'AI enrichment now uses the shared 1,467-brand dictionary instead of a separate 70-brand list, eliminating drift between search and AI', category: 'improvement' },
      { text: 'AI temperature lowered and learning threshold raised to reduce hallucinated product suggestions polluting the product library', category: 'bugfix' },
      { text: 'Video URLs (YouTube, TikTok, etc.) now use oEmbed for metadata instead of AI analysis — faster and more accurate titles, thumbnails, and creator names', category: 'feature' },
      { text: 'Video links automatically tagged as "video" kind instead of "purchase"', category: 'improvement' },
      { text: 'Beta access gating added to bag creation, bag copying, and follow endpoints', category: 'feature' },
    ]
  },
  {
    version: '2.7.0',
    releaseDate: '2026-02-11',
    title: 'Full Analytics Dashboard & Creator Stats Expansion',
    summary: 'Complete analytics system for admin and creators. Your stats page now shows profile views, social link clicks, follower counts, and bag shares. Per-bag analytics include saves, clones, and shares.',
    isLatest: false,
    changes: [
      { text: 'Creator stats page now shows profile views, social link clicks by platform, follower counts, and total bag shares', category: 'feature' },
      { text: 'Per-bag analytics now include saves, clones, and shares alongside views and clicks', category: 'feature' },
      { text: 'Admin Analytics Dashboard — 6-tab dashboard with Overview, Growth, Retention, Content, Features, and Live tabs', category: 'feature', isAdminOnly: true },
      { text: 'Retention tracking fixed — user last_active_at now auto-updates via database trigger, powering DAU/WAU/MAU and health segments', category: 'improvement', isAdminOnly: true },
      { text: 'Feature adoption now tracks all 20 event types (up from 9) with human-readable labels', category: 'improvement', isAdminOnly: true },
      { text: 'Event tracking added to login, signup, and homepage CTA for complete funnel coverage', category: 'improvement' },
    ]
  },
  {
    version: '2.6.0',
    releaseDate: '2026-02-08',
    title: 'Sharper Images, Discover Revamp & Cleanup',
    summary: 'Product photos are now noticeably sharper across the app. Redesigned Discover page with hot ranking, new admin Beta Manager, and several bug fixes.',
    isLatest: false,
    changes: [
      { text: 'Sharper product images — upgraded Google Image Search to return high-resolution photos and sort results by dimension quality', category: 'improvement' },
      { text: 'Image dimension tracking — uploaded photos now record width and height, with warnings for low-resolution sources', category: 'improvement' },
      { text: 'Raised compression quality floor to prevent visible JPEG artifacts on uploaded photos', category: 'improvement' },
      { text: 'Discover page redesigned — removed Spotlight section, added hot ranking algorithm and category border accents', category: 'feature' },
      { text: 'Beta Manager — admin beta dashboard now has Applications, Controls, and Survey tabs', category: 'feature', isAdminOnly: true },
      { text: 'Beta Controls tab — manage capacity, founding deadline, auto-approval, beta phase, and waitlist message', category: 'feature', isAdminOnly: true },
      { text: 'Survey Notes tab — view all survey questions with admin annotation support', category: 'feature', isAdminOnly: true },
      { text: 'Removed unused tags system from bag editor and API; category validation now uses shared CATEGORIES constant', category: 'improvement' },
      { text: 'Fixed timeline edit/visibility buttons not appearing on mobile (touch devices)', category: 'bugfix' },
      { text: 'Fixed iOS auto-zoom when tapping bag title input', category: 'bugfix' },
    ]
  },
  {
    version: '2.5.0',
    releaseDate: '2026-02-07',
    title: 'Bag Tools Menu & Smart Link Finder',
    summary: 'Compressed the bag editor top section into a compact tools menu, reclaiming 500-800px of vertical space on mobile. Plus a new Smart Link Finder for discovering product links.',
    isLatest: false,
    changes: [
      { text: 'Bag Tools menu — all editor tools (Quick Add, Curator AI, Cover Photo, Analytics) collapsed into a centered pill that opens as bottom sheets', category: 'feature' },
      { text: 'Smart Link Finder — brand-site search with multi-result UI and per-item enrichment', category: 'feature' },
      { text: 'Cover photo only displays inline when set; empty state moved to tools menu', category: 'improvement' },
      { text: 'Curator AI actions (Tap to Identify, Bulk Import) properly layer over the tools bottom sheet', category: 'improvement' },
      { text: 'Fixed iOS Safari auto-zoom on input fields in link paste modals', category: 'bugfix' },
      { text: 'Fixed redirect after adding links via UniversalLinkAdder', category: 'bugfix' },
      { text: 'Fixed critical bug with bag creation using wrong column name', category: 'bugfix' },
      { text: 'Improved mobile responsiveness for add links modals', category: 'bugfix' },
    ]
  },
  {
    version: '2.4.0',
    releaseDate: '2026-02-06',
    title: 'Smarter Search',
    summary: 'Fuzzy matching, color synonyms, and a more intentional search experience. Type what you mean and find what you need.',
    isLatest: false,
    changes: [
      { text: 'Fuzzy matching — misspelled brand names are auto-corrected using Levenshtein distance (e.g., "taylormaid" finds TaylorMade)', category: 'feature' },
      { text: 'Color synonyms — searching "grey" also matches "gray", "silver", and "charcoal"', category: 'feature' },
      { text: 'Parsed preview chips — see how the system interprets your search (brand, model, color) before results load', category: 'feature' },
      { text: 'Explicit search UX — search triggers on button tap or Enter instead of auto-debounce for more intentional results', category: 'improvement' },
    ]
  },
  {
    version: '2.3.0',
    releaseDate: '2026-02-05',
    title: 'UX Polish & Smarter Identification',
    summary: 'Faster, smoother experience with optimistic UI, streamlined signup, smart text parsing for bulk imports, and mobile-friendly bottom sheets.',
    isLatest: false,
    changes: [
      { text: 'Optimistic UI for adding items - items appear instantly while saving in the background', category: 'feature' },
      { text: '2-step signup flow - simpler onboarding with email/password first, then profile details', category: 'feature' },
      { text: 'Getting Started checklist - dismissible progress tracker guides new users through first steps', category: 'feature' },
      { text: 'Smart text parsing - paste product names or descriptions and AI extracts brand, model, and specs', category: 'feature' },
      { text: 'Mobile bottom sheets - modals now swipe-to-dismiss on mobile for native feel', category: 'feature' },
      { text: 'ProfileActionBar starts collapsed for cleaner profile viewing', category: 'feature' },
      { text: 'Unified item type system with smart inference from URLs and text', category: 'feature' },
      { text: 'Strategic proposals admin panel for tracking business opportunities', category: 'feature', isAdminOnly: true },
      { text: 'Faster text feedback - reduced debounce from 500ms to 300ms with instant "looking" indicator', category: 'improvement' },
      { text: 'Enhanced empty states - animated CTAs draw attention to first actions', category: 'improvement' },
      { text: 'Link identification improved with slug scoring and site-specific configs', category: 'improvement' },
      { text: 'SEO pages added for alternatives and use cases with dynamic sitemap', category: 'improvement' },
      { text: 'Updated CLAUDE.md with architecture patterns, commands, and gotchas', category: 'improvement', isAdminOnly: true },
      { text: 'Fixed existing bags not appearing in "Choose Destination" step when adding links', category: 'bugfix' },
    ]
  },
  {
    version: '2.2.0',
    releaseDate: '2026-01-28',
    title: 'Mobile-First & Collections Overhaul',
    summary: 'Major mobile experience improvements with dedicated layouts, a rebuilt collections panel that actually works, and smoother editing everywhere.',
    isLatest: false,
    changes: [
      { text: 'Rebuilt Collections panel with full-screen modal that escapes grid constraints', category: 'feature' },
      { text: 'Shared BagCard component with 4 photo layouts and 3 size options', category: 'feature' },
      { text: 'Separate mobile and desktop layout editing - changes on one don\'t affect the other', category: 'feature' },
      { text: 'Edit your avatar directly from the profile header panel', category: 'feature' },
      { text: 'Enhanced add-item flow with integrated photo search', category: 'feature' },
      { text: 'Mobile edit mode: tap hint replaces floating button, cleaner toolbar at top', category: 'improvement' },
      { text: 'Renamed "blocks" to "panels" throughout the UI for clarity', category: 'improvement' },
      { text: 'Sign-in link now visible on mobile navigation', category: 'improvement' },
      { text: 'Collections modal properly centered and responsive on all screen sizes', category: 'improvement' },
      { text: 'Fixed admin bag delete modal - button was invisible due to CSS issue', category: 'bugfix' },
      { text: 'Fixed bag deletion using proper authentication', category: 'bugfix' },
      { text: 'Fixed panel edit controls being clipped at top of screen', category: 'bugfix' },
      { text: 'Fixed Done button overlap with delete controls', category: 'bugfix' },
      { text: 'Fixed concatenated URL detection when pasting multiple links', category: 'bugfix' }
    ]
  },
  {
    version: '2.1.0',
    releaseDate: '2026-01-25',
    title: 'The Story: Badges, Analytics & Curator Notes',
    summary: 'Your timeline now tells a richer story. Earn achievement badges, see enhanced impact analytics, click entries to jump to items, and add curator notes.',
    isLatest: false,
    changes: [
      { text: 'Achievement badges — earn badges displayed on your profile as you hit milestones', category: 'feature' },
      { text: 'Enhanced impact analytics — richer stats about your reach and engagement', category: 'feature' },
      { text: 'Profile Story — a visual narrative of your curation journey', category: 'feature' },
      { text: 'Click timeline entries to open item modal or scroll to item in editor', category: 'feature' },
      { text: 'Add curator notes (140 char captions) to any timeline entry', category: 'feature' },
      { text: 'Inline note editor with auto-save for bag owners', category: 'feature' },
      { text: 'Retired items display preserved name, photo (grayscale), and description', category: 'feature' },
      { text: 'Show/hide individual timeline entries from public view', category: 'feature' },
      { text: 'Visual indicators distinguish clickable vs retired items (chevron, badge)', category: 'improvement' },
      { text: 'History preserved when items deleted (FK cascade fix)', category: 'bugfix' }
    ]
  },
  {
    version: '2.0.0',
    releaseDate: '2026-01-12',
    title: 'Discovery Curation Team',
    summary: 'Introducing automated content discovery that finds trending gear across YouTube, TikTok, and RSS feeds, then curates them into polished collections under @teed.',
    isLatest: false,
    changes: [
      { text: 'Discovery System: AI agents research trending gear content across YouTube, TikTok, and RSS feeds', category: 'feature', isAdminOnly: true },
      { text: 'Multi-phase YouTube search finds trending videos, new releases, and content from known reliable channels', category: 'feature', isAdminOnly: true },
      { text: 'Product enrichment extracts specs, prices, and "why it\'s notable" from source content', category: 'feature', isAdminOnly: true },
      { text: 'Two-link system: every product gets a source link (where discovered) and purchase links (where to buy)', category: 'feature', isAdminOnly: true },
      { text: 'Review workflow lets admins approve, reject, or archive discovered products before publishing', category: 'feature', isAdminOnly: true },
      { text: 'Smart deduplication avoids over-repeating products while allowing trending items to resurface', category: 'feature', isAdminOnly: true },
      { text: 'Gap analysis tracks products not in our library for future catalog expansion', category: 'feature', isAdminOnly: true },
      { text: 'Beta Scorecard: applicants receive personalized scorecards showing their creator potential', category: 'feature' },
      { text: 'Opportunity recommendations match applicants to platform features based on their niche', category: 'feature' },
      { text: 'MCP Server package enables Claude Code and other AI tools to interact with teed', category: 'feature', isAdminOnly: true },
      { text: 'Strategic initiatives dashboard for tracking platform development priorities', category: 'improvement', isAdminOnly: true },
      { text: 'Enhanced YouTube API integration with channel search and configurable time windows', category: 'improvement', isAdminOnly: true }
    ]
  },
  {
    version: '1.9.0',
    releaseDate: '2026-01-11',
    title: 'Showcase Mode & Quick Creation',
    summary: 'Your profile now feels like a gallery, not a construction site. Paste links anywhere, use keyboard shortcuts, and enjoy a smoother creation flow.',
    changes: [
      { text: 'Showcase Mode: see your profile as visitors see it by default', category: 'feature' },
      { text: 'Press E to enter/exit edit mode, with floating Edit/Done button', category: 'feature' },
      { text: 'Paste any link anywhere and choose where it goes (profile, bag, or social)', category: 'feature' },
      { text: 'Command Palette (Cmd+K) for power users with instant link classification', category: 'feature' },
      { text: 'Floating + button for quick access to Link, Photo, Bag, and Block creation', category: 'feature' },
      { text: 'New /bags/new page with quick-start URL field', category: 'feature' },
      { text: 'First-time editor tips help new users get started', category: 'feature' },
      { text: 'Celebration animation when exiting edit mode after making changes', category: 'improvement' },
      { text: 'Mobile-optimized button placement in thumb-friendly zones', category: 'improvement' }
    ]
  },
  {
    version: '1.8.0',
    releaseDate: '2026-01-10',
    title: 'Rich Context & Organization',
    summary: 'Tell the story behind your picks with rich context fields, organize items into sections, and track how your collections evolve.',
    changes: [
      { text: 'Rich item context: explain why you chose something, add specs, compare alternatives', category: 'feature' },
      { text: 'Bag sections for organizing items into logical groups', category: 'feature' },
      { text: 'Version history tracks every change to your bags over time', category: 'feature' },
      { text: 'Multi-bag collections to group related curations together', category: 'feature' },
      { text: 'Creator stats page showing your impact and reach', category: 'feature' },
      { text: 'Mark bags as complete with celebratory confetti animation', category: 'feature' },
      { text: 'Track purchase dates and prices paid for items', category: 'improvement' }
    ]
  },
  {
    version: '1.7.0',
    releaseDate: '2026-01-10',
    title: 'Collections Without Borders',
    summary: 'Your collections now work everywhere. Embed them in blogs, export for YouTube descriptions, or subscribe via RSS.',
    changes: [
      { text: 'Embed your collection on any website with one line of code', category: 'feature' },
      { text: 'Export ready-to-paste formats for YouTube, newsletters, and blogs', category: 'feature' },
      { text: 'RSS feeds for profiles and bags so followers can subscribe', category: 'feature' },
      { text: 'oEmbed support for automatic previews in Notion, WordPress, and Medium', category: 'feature' },
      { text: 'Beautiful social previews when you share links on Twitter, Discord, or Slack', category: 'improvement' },
      { text: 'Schema.org structured data helps Google and AI understand your collections', category: 'improvement' },
      { text: 'Value-focused share modal with contextual tips for each option', category: 'improvement' }
    ]
  },
  {
    version: '1.6.0',
    releaseDate: '2026-01-06',
    title: 'Profile Blocks System',
    summary: 'Completely redesigned profile editing with modular blocks you can drag, resize, and customize.',
    changes: [
      { text: 'Modular profile blocks with 12-column responsive grid layout', category: 'feature' },
      { text: 'Drag & Edit pill controls on every block for easy rearranging', category: 'feature' },
      { text: 'Settings panel auto-opens and follows whichever block you click', category: 'feature' },
      { text: 'Font weight controls (normal to bold) for bio and text blocks', category: 'feature' },
      { text: 'Font size selector (S/M/L/XL) for bio blocks', category: 'feature' },
      { text: 'Button size controls for social links (small to extra large)', category: 'feature' },
      { text: 'Auto-enter edit mode when viewing your own profile', category: 'improvement' },
      { text: 'Radial menu accessible from any block via Edit button', category: 'improvement' }
    ]
  },
  {
    version: '1.5.0',
    releaseDate: '2025-12-21',
    title: 'Mobile Slideshow Experience',
    summary: 'TikTok-style fullscreen slideshow for sharing your curations on social media.',
    changes: [
      { text: 'Fullscreen carousel slideshow view optimized for mobile', category: 'feature' },
      { text: 'Tap navigation - tap left/right sides to move between items', category: 'feature' },
      { text: 'Viral-ready format with subtle teed watermark for social sharing', category: 'feature' },
      { text: 'Improved image cropping using natural aspect ratios', category: 'improvement' },
      { text: 'Portal-based fullscreen to escape stacking context issues', category: 'bugfix' }
    ]
  },
  {
    version: '1.4.0',
    releaseDate: '2025-12-17',
    title: 'ChatGPT Integration & Speed',
    summary: 'Ask ChatGPT about your bags with a custom GPT integration. Plus faster bulk imports, better caching, and visual refinements.',
    changes: [
      { text: 'ChatGPT custom GPT — interact with your teed bags and discover gear through ChatGPT', category: 'feature' },
      { text: 'Product library caches Firecrawl results for instant reuse', category: 'feature' },
      { text: 'Parallel batch processing makes bulk imports 5x faster', category: 'improvement' },
      { text: 'Curated view system with visual design overhaul', category: 'improvement' },
      { text: 'Open Graph metadata for bag pages (better link previews)', category: 'improvement' },
      { text: 'Fixed cover photo aspect ratio display in editor', category: 'bugfix' },
      { text: 'Fixed tiny image display in item detail modal', category: 'bugfix' }
    ]
  },
  {
    version: '1.3.0',
    releaseDate: '2025-12-13',
    title: 'Bulk Link Import & Updates Page',
    summary: 'Import multiple product links at once with real-time progress tracking, enhanced Amazon support, and a new Updates page to track what\'s new.',
    changes: [
      { text: 'Streaming progress UI shows each link as it processes in real-time', category: 'feature' },
      { text: 'Firecrawl integration for scraping Amazon and other blocked sites', category: 'feature' },
      { text: 'Updates page — see what\'s new at /updates with categorized patch notes', category: 'feature' },
      { text: 'Automatic Amazon product title cleaning for cleaner results', category: 'improvement' },
      { text: 'AI-powered ASIN detection for accurate Amazon product identification', category: 'improvement' },
      { text: 'Warning indicators for unverified Amazon products', category: 'improvement' }
    ]
  },
  {
    version: '1.2.0',
    releaseDate: '2025-12-11',
    title: 'Open Signup & Engagement',
    summary: 'Teed is now open to everyone. Save bags, follow creators from any bag page, and enjoy context-aware link buttons.',
    changes: [
      { text: 'Open signup — beta gate removed, anyone can create an account and start curating', category: 'feature' },
      { text: 'Save and bookmark bags directly from the bag view page', category: 'feature' },
      { text: 'Follow creators from any bag view without navigating to their profile', category: 'feature' },
      { text: 'Context-aware link CTAs — buttons show "Watch on YouTube", "Shop on Amazon", etc. instead of generic "Visit"', category: 'improvement' },
      { text: 'Video thumbnail auto-extraction — YouTube and video links automatically use the video thumbnail as the item photo', category: 'improvement' },
      { text: 'QR codes are now tappable with a download modal for easy sharing', category: 'improvement' },
      { text: '"View" button in bag editor header for quick preview of the public view', category: 'improvement' },
    ]
  },
  {
    version: '1.1.0',
    releaseDate: '2025-12-09',
    title: 'Advanced Product Identification',
    summary: 'Upload photos and let AI identify your products with the new Advanced Product ID System.',
    changes: [
      { text: 'APIS (Advanced Product ID System) for photo-based product identification', category: 'feature' },
      { text: 'Support for multiple photo uploads in a single session', category: 'feature' },
      { text: 'Improved AI accuracy for recognizing products from images', category: 'improvement' },
    ]
  },
  {
    version: '1.0.0',
    releaseDate: '2025-12-09',
    title: 'Content Ideas System',
    summary: 'AI-powered content suggestions and video analysis.',
    changes: [
      { text: 'Content ideas system with AI-generated suggestions for your bags', category: 'feature' },
      { text: 'Video analysis for extracting product information', category: 'feature' },
      { text: 'Save items for AI review workflow', category: 'feature' },
      { text: 'Detailed error messages in URL analysis', category: 'improvement' }
    ]
  },
  {
    version: '0.9.0',
    releaseDate: '2025-12-09',
    title: 'Admin Panel',
    summary: 'Complete admin dashboard for platform management.',
    changes: [
      { text: 'Full admin dashboard with user management', category: 'feature' },
      { text: 'Analytics and engagement tracking', category: 'feature' },
      { text: 'Audit logs for platform activity', category: 'feature' }
    ]
  },
  {
    version: '0.8.0',
    releaseDate: '2025-11-25',
    title: 'Beta System, Polish & Social',
    summary: 'Beta gating for controlled rollout, plus cover photo cropping, follower counts, enhanced discovery search, and cleaner UI throughout.',
    changes: [
      { text: 'Beta gating system for controlled rollout', category: 'feature' },
      { text: 'Cover photo cropping with 16:9 aspect ratio and crop button for existing photos', category: 'feature' },
      { text: 'Follower and following counts displayed on user profiles', category: 'feature' },
      { text: 'Discovery page enhanced with autocomplete search and sort options', category: 'feature' },
      { text: 'User engagement analytics and tracking', category: 'feature' },
      { text: 'Feedback collection system', category: 'feature' },
      { text: 'Avatar cropper — crop your profile photo when uploading', category: 'improvement' },
      { text: 'Styled confirmation dialogs replace browser-native confirm() popups', category: 'improvement' },
      { text: 'Themed toast notifications for success and error feedback', category: 'improvement' },
      { text: 'iPhone photo support — client-side compression and 10MB upload limit', category: 'improvement' },
    ]
  },
  {
    version: '0.7.0',
    releaseDate: '2025-11-23',
    title: 'CurAItor Rebrand',
    summary: 'Refreshed AI assistant experience.',
    changes: [
      { text: 'AI Assistant Hub with unified CurAItor branding', category: 'feature' },
      { text: 'Sky color system for AI-related features', category: 'improvement' },
      { text: 'Improved logo visibility on mobile devices', category: 'bugfix' }
    ]
  },
  {
    version: '0.6.0',
    releaseDate: '2025-11-19',
    title: 'Visual Redesign',
    summary: 'Hero images and grid layouts for bag cards.',
    changes: [
      { text: 'Hero + Grid layout for bag cards', category: 'feature' },
      { text: 'Bag photo as hero display option', category: 'feature' },
      { text: 'Featured items prioritized in card display', category: 'improvement' }
    ]
  },
  {
    version: '0.5.0',
    releaseDate: '2025-11-19',
    title: 'AI Image Search',
    summary: 'Custom AI-powered product image finder with interactive preview.',
    changes: [
      { text: 'AI-enhanced custom search for product images', category: 'feature' },
      { text: 'Batch photo finder with retry logic', category: 'feature' },
      { text: 'Interactive AI enrichment preview — see what AI found before accepting changes', category: 'feature' },
      { text: 'Item selection workflow for bulk identification', category: 'improvement' }
    ]
  },
  {
    version: '0.4.0',
    releaseDate: '2025-11-17',
    title: 'Core Features Launch',
    summary: 'Foundation features for organizing your collections.',
    changes: [
      { text: 'Drag-and-drop item reordering', category: 'feature' },
      { text: 'Featured/hero items designation', category: 'feature' },
      { text: 'Follow system with user feed', category: 'feature' },
      { text: 'Discovery page for exploring bags', category: 'feature' },
      { text: 'Custom user handles and profiles', category: 'feature' }
    ]
  }
];
