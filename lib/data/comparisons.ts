export interface ComparisonFeature {
  name: string;
  teed: string | boolean;
  competitor: string | boolean;
  winner: 'teed' | 'competitor' | 'tie';
}

export interface Comparison {
  slug: string;
  competitorName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Quick summary
  headline: string;
  verdict: string;

  // Feature comparison
  features: ComparisonFeature[];

  // When to use each
  teedBetterFor: string[];
  competitorBetterFor: string[];

  // Migration guide
  migrationSteps?: string[];

  // FAQs
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const comparisons: Record<string, Comparison> = {
  linktree: {
    slug: 'linktree',
    competitorName: 'Linktree',
    metaTitle: 'Teed vs Linktree: Which is Better for Gear Sharing?',
    metaDescription: 'Compare Teed vs Linktree for sharing your gear, equipment, and product recommendations. See features, pros, cons, and which is best for your needs.',
    keywords: [
      'teed vs linktree',
      'linktree alternative',
      'linktree for gear',
      'link in bio for products',
      'product showcase link in bio',
      'linktree alternative for creators',
    ],
    headline: 'Teed vs Linktree',
    verdict: 'Linktree is great for links. Teed is built for showcasing actual products and gear with rich details, images, and affiliate support.',
    features: [
      {
        name: 'Product cards with images',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'AI product identification',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Automatic affiliate links',
        teed: true,
        competitor: 'Paid feature',
        winner: 'teed',
      },
      {
        name: 'Product descriptions & specs',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'QR code generation',
        teed: true,
        competitor: true,
        winner: 'tie',
      },
      {
        name: 'Custom URLs',
        teed: true,
        competitor: true,
        winner: 'tie',
      },
      {
        name: 'Analytics',
        teed: true,
        competitor: true,
        winner: 'tie',
      },
      {
        name: 'Multiple collections/bags',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Simple link lists',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Music/podcast embeds',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
    ],
    teedBetterFor: [
      'Showcasing gear, equipment, or product collections',
      'Content creators who want to monetize gear recommendations',
      'Anyone tired of answering "what do you use?"',
      'Building visual, browseable product catalogs',
      'Organizing items with photos, specs, and details',
    ],
    competitorBetterFor: [
      'Simple link aggregation for social bios',
      'Embedding music, videos, and social content',
      'Quick setup with minimal configuration',
      'Links to various platforms without product focus',
    ],
    migrationSteps: [
      'Sign up for Teed at teed.so/join',
      'Create your first "bag" (collection)',
      'Add your products using photos, URLs, or manual entry',
      'Organize items into sections if needed',
      'Get your shareable Teed URL',
      'Update your bio link to your Teed URL',
      'Keep Linktree for non-product links if needed',
    ],
    faqs: [
      {
        question: 'Is Teed a Linktree alternative?',
        answer: 'Teed is specifically designed for product and gear sharing, while Linktree is a general link aggregator. If you\'re sharing equipment, gear, or product recommendations, Teed provides richer features like product cards, images, and affiliate links. For general link aggregation, Linktree might be simpler.',
      },
      {
        question: 'Can I use both Teed and Linktree?',
        answer: 'Yes! Many users link to their Teed gear page from their Linktree. Use Linktree for general links and Teed specifically for your product/gear showcase.',
      },
      {
        question: 'Does Teed have a free plan like Linktree?',
        answer: 'Yes, Teed is free to use with all core features. Create unlimited collections, add unlimited items, and share with anyone at no cost.',
      },
      {
        question: 'Which is better for content creators?',
        answer: 'For showcasing gear and equipment with affiliate links, Teed is better. For a simple bio link page with links to all your platforms, Linktree works well. Many creators use both.',
      },
    ],
  },

  'amazon-lists': {
    slug: 'amazon-lists',
    competitorName: 'Amazon Lists',
    metaTitle: 'Teed vs Amazon Lists: Better Way to Share Product Recommendations',
    metaDescription: 'Compare Teed vs Amazon Lists for sharing product recommendations. Teed works with any store, offers better presentation, and affiliate link support.',
    keywords: [
      'amazon list alternative',
      'amazon wishlist alternative',
      'amazon storefront alternative',
      'share products from any store',
      'product list sharing',
      'better than amazon lists',
    ],
    headline: 'Teed vs Amazon Lists',
    verdict: 'Amazon Lists only work with Amazon products. Teed lets you curate products from any store with better visual presentation and full control.',
    features: [
      {
        name: 'Products from any store',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Custom product photos',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Custom descriptions',
        teed: true,
        competitor: 'Limited',
        winner: 'teed',
      },
      {
        name: 'Beautiful shareable pages',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Affiliate link support',
        teed: true,
        competitor: 'Amazon only',
        winner: 'teed',
      },
      {
        name: 'Multiple collections',
        teed: true,
        competitor: true,
        winner: 'tie',
      },
      {
        name: 'QR code generation',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'One-click purchase',
        teed: 'Links to store',
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Prime delivery info',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
    ],
    teedBetterFor: [
      'Curating products from multiple stores',
      'Creating beautiful, branded gear pages',
      'Sharing gear that isn\'t sold on Amazon',
      'Adding your own photos and descriptions',
      'Building a professional product showcase',
    ],
    competitorBetterFor: [
      'Quick Amazon-only shopping lists',
      'Wedding/baby registries on Amazon',
      'Tracking Amazon deals and price changes',
      'Lists primarily for personal shopping',
    ],
    faqs: [
      {
        question: 'Why use Teed instead of Amazon Lists?',
        answer: 'Amazon Lists only work with Amazon products. Teed lets you curate products from any store - REI, Best Buy, B&H, specialized retailers, anywhere. Plus you get beautiful shareable pages, custom photos, and full affiliate link support.',
      },
      {
        question: 'Can I still include Amazon products on Teed?',
        answer: 'Absolutely! Add Amazon products alongside items from any other store. Teed can even automatically convert Amazon links to your affiliate links.',
      },
      {
        question: 'Is Teed good for affiliate marketing?',
        answer: 'Yes! Unlike Amazon Lists, Teed lets you include affiliate links for any affiliate program. Create product showcases that monetize recommendations across multiple retailers.',
      },
      {
        question: 'Can I migrate my Amazon lists to Teed?',
        answer: 'Yes, you can recreate your Amazon lists on Teed. Add products by URL and Teed will pull in product info. This lets you expand beyond Amazon-only items.',
      },
    ],
  },

  notion: {
    slug: 'notion',
    competitorName: 'Notion',
    metaTitle: 'Teed vs Notion for Gear Lists: Purpose-Built vs General Tool',
    metaDescription: 'Compare Teed vs Notion for managing gear lists and equipment inventories. Teed is purpose-built for gear sharing while Notion is a general workspace.',
    keywords: [
      'notion gear list',
      'notion equipment database',
      'notion alternative for gear',
      'gear database app',
      'equipment inventory app',
      'notion vs teed',
    ],
    headline: 'Teed vs Notion',
    verdict: 'Notion is a powerful general workspace. Teed is purpose-built for creating and sharing gear lists with features like AI identification and automatic affiliate links.',
    features: [
      {
        name: 'AI product identification',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Automatic affiliate links',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Beautiful shareable pages',
        teed: true,
        competitor: 'Requires setup',
        winner: 'teed',
      },
      {
        name: 'QR code generation',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Product cards with images',
        teed: true,
        competitor: 'Manual setup',
        winner: 'teed',
      },
      {
        name: 'Custom databases',
        teed: 'Gear-focused',
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'General note-taking',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Team collaboration',
        teed: 'Coming soon',
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Setup time',
        teed: 'Minutes',
        competitor: 'Hours',
        winner: 'teed',
      },
    ],
    teedBetterFor: [
      'Quickly creating shareable gear lists',
      'Adding products with minimal effort',
      'Monetizing gear recommendations',
      'Mobile-first gear management',
      'Users who want it to "just work"',
    ],
    competitorBetterFor: [
      'Complex, customized database views',
      'General workspace and note-taking',
      'Team wikis and documentation',
      'Users who want full control over structure',
    ],
    faqs: [
      {
        question: 'Should I use Notion or Teed for my gear list?',
        answer: 'If you want a simple, beautiful, shareable gear page with features like AI product identification and affiliate links, use Teed. If you need a complex, customized database that\'s part of a larger workspace, Notion might be better.',
      },
      {
        question: 'Is Teed easier than Notion for gear lists?',
        answer: 'Yes. Teed is purpose-built for gear sharing, so you get product cards, sharing features, and affiliate links without any setup. Notion requires building database templates from scratch.',
      },
      {
        question: 'Can I embed my Teed list in Notion?',
        answer: 'Yes! Teed supports oEmbed, so you can embed your gear list in Notion pages, blogs, or anywhere that supports embeds.',
      },
      {
        question: 'Is Teed free like Notion?',
        answer: 'Yes, Teed is free to use with all core features. No complicated pricing tiers or feature restrictions.',
      },
    ],
  },

  spreadsheets: {
    slug: 'spreadsheets',
    competitorName: 'Spreadsheets',
    metaTitle: 'Teed vs Spreadsheets for Gear Tracking: Visual vs Tabular',
    metaDescription: 'Compare Teed vs Google Sheets or Excel for tracking and sharing gear. Teed offers visual product cards, easy sharing, and affiliate links.',
    keywords: [
      'gear spreadsheet alternative',
      'equipment tracking spreadsheet',
      'gear list template',
      'equipment inventory spreadsheet',
      'better than spreadsheet for gear',
      'visual gear list',
    ],
    headline: 'Teed vs Spreadsheets',
    verdict: 'Spreadsheets are flexible but ugly for sharing. Teed creates beautiful, visual gear lists you\'re proud to share.',
    features: [
      {
        name: 'Beautiful visual display',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Product images',
        teed: true,
        competitor: 'Clunky',
        winner: 'teed',
      },
      {
        name: 'Mobile-friendly sharing',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Affiliate links',
        teed: true,
        competitor: 'Manual',
        winner: 'teed',
      },
      {
        name: 'QR codes',
        teed: true,
        competitor: false,
        winner: 'teed',
      },
      {
        name: 'Custom calculations',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Pivot tables',
        teed: false,
        competitor: true,
        winner: 'competitor',
      },
      {
        name: 'Setup time',
        teed: 'Minutes',
        competitor: 'Variable',
        winner: 'teed',
      },
      {
        name: 'Shareable link',
        teed: 'Beautiful page',
        competitor: 'Raw spreadsheet',
        winner: 'teed',
      },
    ],
    teedBetterFor: [
      'Creating shareable gear pages',
      'Visual product showcases',
      'Monetizing with affiliate links',
      'Mobile-friendly gear browsing',
      'Quick setup without template hunting',
    ],
    competitorBetterFor: [
      'Complex calculations and formulas',
      'Custom data analysis',
      'Large datasets with filtering',
      'Budget tracking with math',
    ],
    faqs: [
      {
        question: 'Why use Teed instead of a spreadsheet?',
        answer: 'Spreadsheets work for personal tracking but are terrible for sharing. Teed creates beautiful, visual gear pages with product images, descriptions, and easy sharing. When someone asks "what gear do you use?", share a Teed link, not a spreadsheet.',
      },
      {
        question: 'Can I import from a spreadsheet?',
        answer: 'You can add items to Teed one by one using URLs or photos. While there\'s no direct import, Teed makes adding items fast with AI product identification.',
      },
      {
        question: 'Should I still keep a spreadsheet?',
        answer: 'Some users maintain a spreadsheet for detailed tracking (purchase dates, depreciation, etc.) and use Teed as their public-facing gear page. They complement each other.',
      },
      {
        question: 'Is Teed good for gear inventory?',
        answer: 'Yes! Teed works great as a visual gear inventory. Add photos, serial numbers, purchase info, and notes. Much easier to browse than rows in a spreadsheet.',
      },
    ],
  },
};

export function getComparisonBySlug(slug: string): Comparison | undefined {
  return comparisons[slug];
}

export function getAllComparisonSlugs(): string[] {
  return Object.keys(comparisons);
}
