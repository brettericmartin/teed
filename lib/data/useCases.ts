export interface UseCase {
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  heroEmoji: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Problem/Solution section
  painPoints: string[];
  solutions: string[];

  // Features most relevant to this audience
  features: {
    title: string;
    description: string;
    icon: 'camera' | 'share' | 'sparkles' | 'trending' | 'users' | 'zap' | 'list' | 'qrcode' | 'image' | 'folder';
  }[];

  // FAQ section
  faqs: {
    question: string;
    answer: string;
  }[];

  // Category filter for discover page
  discoverCategory?: string;
}

export const useCases: Record<string, UseCase> = {
  golfers: {
    slug: 'golfers',
    title: 'Golfers',
    headline: 'Teed for Golfers',
    subheadline: 'The best way to share your bag setup and discover what other golfers are playing',
    ctaText: 'Create Your Golf Bag',
    heroEmoji: '⛳',
    metaTitle: 'Teed for Golfers - Share Your Golf Bag Setup',
    metaDescription: 'Create and share your golf bag setup with Teed. Document your clubs, track equipment changes, and discover what other golfers are playing. The best golf bag organizer app.',
    keywords: [
      'golf bag tracker',
      'golf bag organizer',
      'golf club inventory',
      'whats in my golf bag',
      'golf equipment list',
      'golf gear sharing',
      'golf club setup',
      'WITB golf',
    ],
    painPoints: [
      'Friends always asking "what clubs do you use?"',
      'No good way to share your complete bag setup',
      'Hard to track equipment changes over time',
      'Difficult to research what clubs to buy next',
    ],
    solutions: [
      'Create a shareable link with your complete bag setup',
      'Include club specs, shaft details, and purchase info',
      'Track your bag changes and see evolution over time',
      'Discover and compare bags from other golfers',
    ],
    features: [
      {
        title: 'Photo Recognition',
        description: 'Snap a photo of your clubs and Teed identifies them automatically',
        icon: 'camera',
      },
      {
        title: 'Shareable Links',
        description: 'Get a clean URL to share your bag on social media or with friends',
        icon: 'share',
      },
      {
        title: 'Club Details',
        description: 'Add specs, shafts, grips, and custom notes to each club',
        icon: 'list',
      },
      {
        title: 'QR Codes',
        description: 'Generate QR codes to share your bag at the course',
        icon: 'qrcode',
      },
    ],
    faqs: [
      {
        question: 'What is a golf bag organizer app?',
        answer: 'A golf bag organizer app helps you catalog, organize, and share your golf equipment. Teed lets you create a visual inventory of your clubs with photos, specs, and details, then share it with a simple link.',
      },
      {
        question: 'Can I include club specifications?',
        answer: 'Yes! You can add shaft type, flex, length, grip details, and any custom notes for each club in your bag. This helps when sharing setups or tracking what works for your game.',
      },
      {
        question: 'How do I share my bag setup?',
        answer: 'Once you create your bag on Teed, you get a unique URL like teed.so/u/yourname/mybag. Share this link anywhere - social media, forums, or directly with friends. You can also generate a QR code.',
      },
      {
        question: 'Is Teed free for golfers?',
        answer: 'Yes, Teed is free to use. Create unlimited bags, add unlimited clubs, and share with anyone. We offer optional premium features for serious enthusiasts.',
      },
      {
        question: 'Can I track changes to my bag over time?',
        answer: 'Teed preserves your bag history. When you make changes, you can see how your setup has evolved. Great for tracking what equipment works best for your game.',
      },
    ],
    discoverCategory: 'golf',
  },

  photographers: {
    slug: 'photographers',
    title: 'Photographers',
    headline: 'Teed for Photographers',
    subheadline: 'Document your camera gear, track your kit, and share your setup with the photography community',
    ctaText: 'Catalog Your Gear',
    heroEmoji: '📷',
    metaTitle: 'Teed for Photographers - Camera Gear Inventory & Sharing',
    metaDescription: 'Create a visual inventory of your camera gear with Teed. Document bodies, lenses, and accessories. Perfect for insurance, sharing your setup, and tracking your kit.',
    keywords: [
      'camera gear inventory',
      'photography equipment list',
      'camera bag contents',
      'photo gear organizer',
      'lens collection tracker',
      'whats in my camera bag',
      'photography gear sharing',
      'camera equipment catalog',
    ],
    painPoints: [
      'No organized record of gear for insurance purposes',
      'Constantly asked "what camera/lens is that?"',
      'Hard to share complete kit details with clients or community',
      'Tracking gear across multiple bags and locations',
    ],
    solutions: [
      'Create detailed visual inventory with serial numbers and values',
      'Share your kit with a single link - bodies, lenses, accessories',
      'Export gear list for insurance documentation',
      'Organize by camera bag, location, or shoot type',
    ],
    features: [
      {
        title: 'AI Gear Recognition',
        description: 'Photo your gear and Teed identifies cameras, lenses, and accessories',
        icon: 'camera',
      },
      {
        title: 'Insurance Ready',
        description: 'Include serial numbers, purchase dates, and values for documentation',
        icon: 'list',
      },
      {
        title: 'Kit Sharing',
        description: 'Share your complete setup with clients or the photography community',
        icon: 'share',
      },
      {
        title: 'Affiliate Links',
        description: 'Add affiliate links to monetize your gear recommendations',
        icon: 'trending',
      },
    ],
    faqs: [
      {
        question: 'How can photographers use Teed?',
        answer: 'Photographers use Teed to catalog their gear, create shareable kit lists, document equipment for insurance, and share setups on social media or with clients curious about their equipment.',
      },
      {
        question: 'Can I add serial numbers and purchase info?',
        answer: 'Yes! Add serial numbers, purchase dates, prices, and notes to each item. This creates a valuable record for insurance purposes and tracking your investment.',
      },
      {
        question: 'Is this useful for insurance documentation?',
        answer: 'Absolutely. Teed creates a visual, detailed inventory of your gear that\'s perfect for insurance claims. Include photos, serial numbers, purchase info, and current values.',
      },
      {
        question: 'Can I organize gear by camera bag?',
        answer: 'Yes, create multiple "bags" on Teed to organize gear by physical bag, shoot type, or any grouping that makes sense for your workflow.',
      },
      {
        question: 'Can I share my gear setup on YouTube or blogs?',
        answer: 'Yes! Many photographers embed their Teed gear lists in YouTube descriptions, blog posts, and Instagram bios. Add affiliate links to monetize your recommendations.',
      },
    ],
    discoverCategory: 'photography',
  },

  creators: {
    slug: 'creators',
    title: 'Content Creators',
    headline: 'Teed for Creators',
    subheadline: 'Showcase your equipment, monetize your recommendations, and give your audience the gear lists they want',
    ctaText: 'Build Your Gear Kit',
    heroEmoji: '🎬',
    metaTitle: 'Teed for Creators - Share Your YouTube & Streaming Gear Setup',
    metaDescription: 'Create beautiful gear list pages for your YouTube, Twitch, or podcast audience. Showcase equipment, add affiliate links, and answer "what gear do you use?" once and for all.',
    keywords: [
      'creator gear kit',
      'youtube equipment list',
      'streaming setup sharing',
      'podcast equipment list',
      'creator gear page',
      'influencer equipment',
      'content creator tools',
      'gear recommendations',
    ],
    painPoints: [
      'Constantly answering "what gear do you use?" in comments',
      'Affiliate link management across multiple platforms',
      'No central place to showcase your complete setup',
      'Updating gear lists across multiple places when you upgrade',
    ],
    solutions: [
      'One link to share in bio, descriptions, and comments',
      'Automatic affiliate link management and tracking',
      'Beautiful, always-updated gear page your audience will love',
      'Update once, share everywhere - no more outdated lists',
    ],
    features: [
      {
        title: 'Affiliate Integration',
        description: 'Automatic affiliate link conversion for Amazon and other retailers',
        icon: 'trending',
      },
      {
        title: 'Link in Bio Ready',
        description: 'Clean, mobile-optimized pages perfect for your bio link',
        icon: 'share',
      },
      {
        title: 'Smart Organization',
        description: 'Group gear by category - cameras, lighting, audio, etc.',
        icon: 'folder',
      },
      {
        title: 'Easy Updates',
        description: 'Update your kit instantly when you upgrade equipment',
        icon: 'zap',
      },
    ],
    faqs: [
      {
        question: 'How do content creators use Teed?',
        answer: 'Creators use Teed to build a single, shareable gear page they can link in YouTube descriptions, Twitch panels, Instagram bios, and anywhere their audience asks about equipment.',
      },
      {
        question: 'Does Teed support affiliate links?',
        answer: 'Yes! Teed can automatically convert product links to your affiliate links. We support Amazon Associates and other affiliate programs to help you monetize your recommendations.',
      },
      {
        question: 'Can I organize gear by category?',
        answer: 'Absolutely. Create sections for Camera Gear, Lighting, Audio, Desk Setup, or any categories that make sense for your content type.',
      },
      {
        question: 'Is Teed better than a Notion page or spreadsheet?',
        answer: 'Teed is purpose-built for gear sharing. Unlike Notion or spreadsheets, you get beautiful product cards with images, automatic affiliate links, QR codes, and mobile-optimized pages.',
      },
      {
        question: 'How do I share my gear list?',
        answer: 'Add your Teed link to your YouTube description, Twitch panels, Instagram bio, or anywhere you connect with your audience. One link, always current.',
      },
    ],
    discoverCategory: 'creator',
  },

  travelers: {
    slug: 'travelers',
    title: 'Travelers',
    headline: 'Teed for Travelers',
    subheadline: 'Create the perfect packing list, share travel essentials, and never forget an item again',
    ctaText: 'Create Your Packing List',
    heroEmoji: '✈️',
    metaTitle: 'Teed for Travelers - Packing List App & Travel Gear Organizer',
    metaDescription: 'Create and share perfect packing lists with Teed. Organize travel gear, save templates for different trip types, and share recommendations with fellow travelers.',
    keywords: [
      'packing list app',
      'travel gear organizer',
      'travel packing list',
      'what to pack',
      'travel essentials list',
      'carry on packing list',
      'travel gear recommendations',
      'trip packing template',
    ],
    painPoints: [
      'Always forgetting something important on trips',
      'Recreating packing lists from scratch each time',
      'Hard to share travel recommendations with friends',
      'No good way to remember what worked on past trips',
    ],
    solutions: [
      'Create master lists you can reuse for any trip',
      'Template lists for different trip types - weekend, international, etc.',
      'Share recommendations with friends planning similar trips',
      'Document what you actually used vs. what you packed',
    ],
    features: [
      {
        title: 'Reusable Templates',
        description: 'Create templates for weekend trips, international travel, etc.',
        icon: 'folder',
      },
      {
        title: 'Easy Sharing',
        description: 'Share your packing list with travel companions or friends',
        icon: 'share',
      },
      {
        title: 'Product Links',
        description: 'Link to exact products so friends can buy the same gear',
        icon: 'list',
      },
      {
        title: 'Photo Documentation',
        description: 'Add photos of your packed bags for reference',
        icon: 'image',
      },
    ],
    faqs: [
      {
        question: 'What is the best packing list app?',
        answer: 'Teed is a visual packing list app that lets you create beautiful, shareable lists of your travel gear. Unlike basic checklist apps, see photos of each item and share your lists with others.',
      },
      {
        question: 'Can I reuse packing lists?',
        answer: 'Yes! Create template lists for different trip types - weekend getaway, business trip, international adventure. Copy and customize for each trip.',
      },
      {
        question: 'Can I share my packing list?',
        answer: 'Absolutely. Share your Teed packing list with travel companions so everyone knows what to bring. Or share your tried-and-tested list with friends planning similar trips.',
      },
      {
        question: 'Can I add links to where I bought items?',
        answer: 'Yes! Add product links so friends can buy the exact items you recommend. Great for that favorite packing cube or travel adapter everyone asks about.',
      },
      {
        question: 'Is Teed good for digital nomads?',
        answer: 'Digital nomads love Teed for documenting their complete setup - tech gear, travel essentials, work equipment. Create different lists for different destinations or work scenarios.',
      },
    ],
    discoverCategory: 'travel',
  },

  outdoors: {
    slug: 'outdoors',
    title: 'Outdoor Enthusiasts',
    headline: 'Teed for Outdoor Adventurers',
    subheadline: 'Document your hiking gear, camping equipment, and share your adventure setups',
    ctaText: 'Organize Your Gear',
    heroEmoji: '🏔️',
    metaTitle: 'Teed for Outdoor Gear - Hiking & Camping Equipment Organizer',
    metaDescription: 'Create and share your hiking, camping, and outdoor gear lists with Teed. Document equipment weights, organize by activity, and share setups with fellow adventurers.',
    keywords: [
      'hiking gear list',
      'camping equipment organizer',
      'backpacking gear list',
      'outdoor gear tracker',
      'trail gear setup',
      'camping checklist',
      'hiking equipment',
      'ultralight gear list',
    ],
    painPoints: [
      'Gear scattered across bins and closets with no inventory',
      'Forgetting essential items on trips',
      'Hard to plan gear for different conditions/seasons',
      'No good way to share trip-tested gear recommendations',
    ],
    solutions: [
      'Visual inventory of all your outdoor gear',
      'Create checklists for different activities and seasons',
      'Track weights for backpacking and ultralight setups',
      'Share your proven gear with the outdoor community',
    ],
    features: [
      {
        title: 'Gear Inventory',
        description: 'Catalog all your outdoor equipment in one visual place',
        icon: 'list',
      },
      {
        title: 'Activity Templates',
        description: 'Create lists for hiking, camping, climbing, etc.',
        icon: 'folder',
      },
      {
        title: 'Weight Tracking',
        description: 'Track gear weights for ultralight backpacking',
        icon: 'sparkles',
      },
      {
        title: 'Community Sharing',
        description: 'Share your setups and discover what others use',
        icon: 'users',
      },
    ],
    faqs: [
      {
        question: 'What is a hiking gear list app?',
        answer: 'A hiking gear list app helps you catalog, organize, and share your outdoor equipment. Teed creates visual gear lists you can use for trip planning and sharing with other hikers.',
      },
      {
        question: 'Can I track gear weights?',
        answer: 'Yes! Add weights to each item and see total pack weight. Perfect for ultralight backpackers and anyone trying to optimize their load.',
      },
      {
        question: 'Can I create different lists for different activities?',
        answer: 'Absolutely. Create separate lists for day hikes, backpacking trips, car camping, climbing, etc. Use templates to quickly build lists for each adventure.',
      },
      {
        question: 'Is this useful for camping?',
        answer: 'Yes! Document your complete camping setup - tent, sleeping system, cook kit, etc. Great for keeping track of group gear and sharing what to bring.',
      },
      {
        question: 'Can I share my gear setup with friends?',
        answer: 'Share your Teed gear list with hiking partners, trip groups, or the outdoor community. Show exactly what you use and recommend.',
      },
    ],
    discoverCategory: 'outdoors',
  },

  tech: {
    slug: 'tech',
    title: 'Tech Enthusiasts',
    headline: 'Teed for Tech',
    subheadline: 'Share your desk setup, EDC, and tech stack with the community',
    ctaText: 'Document Your Setup',
    heroEmoji: '💻',
    metaTitle: 'Teed for Tech - Desk Setup & EDC Sharing',
    metaDescription: 'Create and share your desk setup, EDC (everyday carry), and tech gear with Teed. Perfect for r/battlestations, r/EDC, and tech enthusiasts.',
    keywords: [
      'desk setup sharing',
      'EDC everyday carry',
      'tech gear list',
      'battlestation setup',
      'work from home setup',
      'developer tools',
      'tech stack sharing',
      'gadget collection',
    ],
    painPoints: [
      'Constantly typing out gear lists in Reddit comments',
      'No permanent home for your setup details',
      'Hard to share complete setup info with good photos',
      'Updating gear lists across multiple platforms',
    ],
    solutions: [
      'One link for all your setup questions',
      'Beautiful presentation with photos and details',
      'Easy to update when you upgrade gear',
      'Share across Reddit, Twitter, Discord, etc.',
    ],
    features: [
      {
        title: 'Visual Showcase',
        description: 'Present your setup with beautiful product cards and photos',
        icon: 'image',
      },
      {
        title: 'Easy Sharing',
        description: 'Drop one link in Reddit comments or social bios',
        icon: 'share',
      },
      {
        title: 'Category Organization',
        description: 'Group by desk, EDC, travel tech, etc.',
        icon: 'folder',
      },
      {
        title: 'Affiliate Support',
        description: 'Monetize your setup recommendations',
        icon: 'trending',
      },
    ],
    faqs: [
      {
        question: 'What is Teed used for by tech enthusiasts?',
        answer: 'Tech enthusiasts use Teed to document and share their desk setups, EDC (everyday carry), and gadget collections. Perfect for r/battlestations, r/EDC, and tech communities.',
      },
      {
        question: 'Is this good for sharing on Reddit?',
        answer: 'Yes! Instead of typing gear lists in comments, share your Teed link. Works great for r/battlestations, r/MechanicalKeyboards, r/EDC, and similar communities.',
      },
      {
        question: 'Can I organize by category?',
        answer: 'Absolutely. Create sections for Monitor Setup, Peripherals, Audio Gear, EDC items, or any categories that fit your setup.',
      },
      {
        question: 'Does it work for EDC (everyday carry)?',
        answer: 'Perfect for EDC. Document your wallet, knife, flashlight, watch, and all your daily carry items. Update easily when you rotate gear.',
      },
      {
        question: 'Can I add links to where I bought items?',
        answer: 'Yes! Add purchase links for each item. Support affiliate links to earn from your recommendations.',
      },
    ],
    discoverCategory: 'tech',
  },

  musicians: {
    slug: 'musicians',
    title: 'Musicians',
    headline: 'Teed for Musicians',
    subheadline: 'Document your instruments, pedalboards, and studio gear',
    ctaText: 'Catalog Your Gear',
    heroEmoji: '🎸',
    metaTitle: 'Teed for Musicians - Instrument & Gear Inventory',
    metaDescription: 'Create and share your instrument collection, pedalboard setup, and studio gear with Teed. Perfect for session musicians, gear enthusiasts, and anyone who wants to document their sound.',
    keywords: [
      'music gear inventory',
      'pedalboard setup',
      'guitar collection',
      'studio gear list',
      'instrument inventory',
      'music equipment',
      'guitar rig sharing',
      'recording gear',
    ],
    painPoints: [
      'No organized inventory of instruments and gear',
      'Hard to share rig details with other musicians',
      'Tracking gear across practice space, studio, gig bags',
      'Insurance documentation for valuable equipment',
    ],
    solutions: [
      'Visual catalog of all instruments and gear',
      'Share your signal chain and rig details',
      'Organize by location, genre, or project',
      'Document for insurance with serial numbers and values',
    ],
    features: [
      {
        title: 'Instrument Catalog',
        description: 'Document guitars, amps, synths, drums - any instrument',
        icon: 'list',
      },
      {
        title: 'Pedalboard Documentation',
        description: 'Map out your signal chain and effects setup',
        icon: 'sparkles',
      },
      {
        title: 'Rig Sharing',
        description: 'Share your complete setup with other musicians',
        icon: 'share',
      },
      {
        title: 'Insurance Ready',
        description: 'Include serial numbers and values for documentation',
        icon: 'folder',
      },
    ],
    faqs: [
      {
        question: 'How do musicians use Teed?',
        answer: 'Musicians use Teed to catalog instruments, document pedalboards and signal chains, share studio setups, and maintain insurance-ready gear inventories.',
      },
      {
        question: 'Can I document my pedalboard?',
        answer: 'Yes! Document each pedal with photos, settings notes, and position in your signal chain. Perfect for recreating your sound or sharing your setup.',
      },
      {
        question: 'Is this useful for session musicians?',
        answer: 'Absolutely. Keep a visual portfolio of your available gear to share with producers and studios. Show exactly what you can bring to a session.',
      },
      {
        question: 'Can I track gear across multiple locations?',
        answer: 'Yes! Create separate collections for home studio, practice space, gig bag, etc. Always know where your gear is.',
      },
      {
        question: 'Does it work for insurance documentation?',
        answer: 'Perfect for insurance. Add photos, serial numbers, purchase dates, and values. Having this documentation can be crucial for claims.',
      },
    ],
    discoverCategory: 'music',
  },

  fitness: {
    slug: 'fitness',
    title: 'Fitness Enthusiasts',
    headline: 'Teed for Fitness',
    subheadline: 'Share your gym bag essentials, home gym setup, and workout gear',
    ctaText: 'Build Your Gym Bag',
    heroEmoji: '💪',
    metaTitle: 'Teed for Fitness - Gym Bag & Home Gym Equipment Lists',
    metaDescription: 'Create and share your gym bag essentials, home gym setup, and workout gear with Teed. Organize your fitness equipment and share recommendations with the fitness community.',
    keywords: [
      'gym bag essentials',
      'home gym equipment list',
      'workout gear',
      'fitness equipment',
      'gym essentials list',
      'home gym setup',
      'fitness gear recommendations',
      'crossfit equipment',
    ],
    painPoints: [
      'Friends always asking what supplements/gear you use',
      'No good way to share home gym setup recommendations',
      'Tracking what equipment to bring to different workouts',
      'Organizing fitness gear purchases and wishlist',
    ],
    solutions: [
      'One link to share all your fitness recommendations',
      'Document your complete home gym setup',
      'Create lists for different workout types',
      'Track gear and supplements with purchase links',
    ],
    features: [
      {
        title: 'Gym Bag Lists',
        description: 'Document your essential gym bag items',
        icon: 'list',
      },
      {
        title: 'Home Gym Setup',
        description: 'Showcase your home gym equipment',
        icon: 'image',
      },
      {
        title: 'Easy Sharing',
        description: 'Share recommendations with gym buddies',
        icon: 'share',
      },
      {
        title: 'Affiliate Links',
        description: 'Monetize your fitness gear recommendations',
        icon: 'trending',
      },
    ],
    faqs: [
      {
        question: 'How do fitness enthusiasts use Teed?',
        answer: 'Fitness enthusiasts use Teed to document gym bag essentials, home gym equipment, supplements, and workout gear. Share your recommendations with one link.',
      },
      {
        question: 'Can I share my home gym setup?',
        answer: 'Yes! Document your complete home gym - equipment, flooring, storage, everything. Great for inspiring others building their own setup.',
      },
      {
        question: 'Is this good for fitness influencers?',
        answer: 'Perfect for influencers. Create your gear list with affiliate links and share it in your bio. Answer "what do you use?" once and for all.',
      },
      {
        question: 'Can I create different lists?',
        answer: 'Yes! Make lists for gym bag, home gym, running gear, yoga equipment, or any fitness category that fits your lifestyle.',
      },
      {
        question: 'Does it support supplements?',
        answer: 'Absolutely. Add supplements, protein powders, pre-workouts - anything fitness-related. Include photos, notes, and purchase links.',
      },
    ],
    discoverCategory: 'fitness',
  },
};

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return useCases[slug];
}

export function getAllUseCaseSlugs(): string[] {
  return Object.keys(useCases);
}
