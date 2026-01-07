export type CategoryType = 'feature' | 'improvement' | 'bugfix';

export interface PatchNoteChange {
  text: string;
  category: CategoryType;
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
    version: '1.6.0',
    releaseDate: '2026-01-06',
    title: 'Profile Blocks System',
    summary: 'Completely redesigned profile editing with modular blocks you can drag, resize, and customize.',
    isLatest: true,
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
    title: 'Speed & Polish',
    summary: 'Faster bulk imports, better caching, and visual refinements across the platform.',
    changes: [
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
    title: 'Bulk Link Import',
    summary: 'Import multiple product links at once with real-time progress tracking and enhanced Amazon support.',
    changes: [
      { text: 'Streaming progress UI shows each link as it processes in real-time', category: 'feature' },
      { text: 'Firecrawl integration for scraping Amazon and other blocked sites', category: 'feature' },
      { text: 'Automatic Amazon product title cleaning for cleaner results', category: 'improvement' },
      { text: 'AI-powered ASIN detection for accurate Amazon product identification', category: 'improvement' },
      { text: 'Warning indicators for unverified Amazon products', category: 'improvement' }
    ]
  },
  {
    version: '1.1.0',
    releaseDate: '2025-12-11',
    title: 'Advanced Product Identification',
    summary: 'Upload photos and let AI identify your products.',
    changes: [
      { text: 'APIS (Advanced Product ID System) for photo-based product identification', category: 'feature' },
      { text: 'Improved AI accuracy for recognizing products from images', category: 'improvement' },
      { text: 'Support for multiple photo uploads in a single session', category: 'feature' }
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
    title: 'Beta System & Analytics',
    summary: 'Beta gating and user engagement tracking.',
    changes: [
      { text: 'Beta gating system for controlled rollout', category: 'feature' },
      { text: 'User engagement analytics and tracking', category: 'feature' },
      { text: 'Feedback collection system', category: 'feature' },
      { text: 'Tag system with categorical selectors', category: 'feature' }
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
    summary: 'Custom AI-powered product image finder.',
    changes: [
      { text: 'AI-enhanced custom search for product images', category: 'feature' },
      { text: 'Batch photo finder with retry logic', category: 'feature' },
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
