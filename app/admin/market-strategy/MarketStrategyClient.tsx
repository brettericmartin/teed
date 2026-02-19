'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  BarChart3,
  FileText,
  BookOpen,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  Wrench,
  AlertTriangle,
  Terminal,
  Globe,
  Package,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type NicheId = 'tech' | 'running' | 'beauty' | 'home' | 'lifestyle';
type TabId = 'playbook' | 'scripts' | 'calendar' | 'metrics' | 'workflow';
type BagStatus = 'pending' | 'created' | 'distributed';
type Platform = 'reddit' | 'youtube' | 'tiktok' | 'x';

interface SeedBag {
  id: string;
  title: string;
  source: string;
  whyHot: string;
  links: { label: string; url: string }[];
  commentTemplates: { platform: Platform; template: string }[];
  priority?: 'urgent' | 'high' | 'normal';
}

interface Niche {
  id: NicheId;
  label: string;
  emoji: string;
  color: string;
  colorAccent: string;
  bagCreationMethod: string;
  cadence: string;
  hook: string;
  message: string;
  cta: string;
  bags: SeedBag[];
  shareTargets: string[];
}

interface TikTokScript {
  nicheId: NicheId;
  title: string;
  segments: { timing: string; text: string }[];
}

interface CalendarWeek {
  week: number;
  title: string;
  phase: string;
  tasks: { day: string; category: NicheId | 'all'; action: string; platform: string; priority?: 'urgent' | 'high' | 'normal' }[];
}

interface StrategyState {
  bagStatuses: Record<string, BagStatus>;
  distributionChecks: Record<string, Record<Platform, boolean>>;
  calendarChecks: Record<string, boolean>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NICHES: Niche[] = [
  {
    id: 'tech',
    label: 'Tech & Desk Setups',
    emoji: '\ud83d\udda5\ufe0f',
    color: 'var(--sky-4)',
    colorAccent: 'var(--sky-11)',
    bagCreationMethod: 'Watch their latest roundup/setup video, extract every product mentioned',
    cadence: 'Refresh weekly \u2014 these creators post 2-4x/week with product-heavy content',
    hook: 'I turned your video into a Teed curation \u2014 every product, one link',
    message: "Hey! I made a Teed bag from your [VIDEO TITLE] \u2014 every product linked in one clean page. Your audience would love this instead of hunting through descriptions.",
    cta: 'Check it out and share it \u2014 or build your own on Teed',
    shareTargets: [
      'DM the creator on X/Twitter or Instagram with the finished bag link',
      'Comment on their video: "Put every product from this video in one page \u2192 [LINK]"',
      'Tag them on X with the bag: "@creator I turned your setup into a Teed curation"',
      'Email if available (many tech creators list business emails)',
    ],
    bags: [
      {
        id: 'tech-1',
        title: 'Linus Tech Tips \u2014 "I Tried All the Best Webcams"',
        source: '16.5M subs \u00b7 715.8K views \u00b7 Published Feb 12, 2026',
        whyHot: 'Direct product comparison with 5-10 webcams tested. Perfect for a Teed bag \u2014 each webcam is a listable item with buy links. Massive engaged audience.',
        priority: 'urgent',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@LinusTechTips' },
          { label: 'X/Twitter', url: 'https://twitter.com/LinusTech' },
          { label: 'LTT Forum Thread', url: 'https://linustechtips.com/topic/1632050-i-tried-all-the-best-webcams/' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @LinusTech \u2014 I turned your webcam roundup into a Teed curation. Every webcam from the video, linked in one clean page. Your audience keeps asking \"which one?\" in the comments \u2014 this answers it \u2192 [LINK]" },
          { platform: 'youtube', template: "Put every webcam from this video in one page with buy links \u2192 [LINK]. Easier than scrolling the description." },
        ],
      },
      {
        id: 'tech-2',
        title: 'MKBHD \u2014 "What\'s on my Phone 2026"',
        source: '19M+ subs \u00b7 App curation video \u00b7 Evergreen format',
        whyHot: 'The biggest tech creator on YouTube. His "What\'s on my Phone" series gets millions of views. App list = perfect Teed curation. Uses TickTick, Spotify, Pocketcast, Arc Search, Notion, raindrop.io, Gemini.',
        priority: 'high',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@mkbhd' },
          { label: 'X/Twitter', url: 'https://twitter.com/MKBHD' },
          { label: 'Website', url: 'https://mkbhd.com/' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @MKBHD \u2014 turned your phone setup into a Teed curation. Every app linked in one page. Your comments are always full of people asking for the app list \u2192 [LINK]" },
          { platform: 'youtube', template: "Every app from MKBHD's phone in one place \u2192 [LINK]. No pausing the video." },
        ],
      },
      {
        id: 'tech-3',
        title: 'Sara Dietschy \u2014 Desk Setup / Studio Tours',
        source: '1M+ subs \u00b7 Tech + creative focus \u00b7 NYC-based',
        whyHot: 'Known for cinematic desk/studio setup tours. Partnered with Moment on magnetic stands. Her audience is creative professionals who buy gear. Perfect Teed match.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@saradietschy' },
          { label: 'Instagram', url: 'https://instagram.com/saradietschy' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @saradietschy \u2014 made a Teed curation from your studio tour. Every item linked in one place so your audience doesn't have to hunt through timestamps \u2192 [LINK]" },
          { platform: 'youtube', template: "Full studio setup with every item linked \u2192 [LINK]. Clean page instead of a 50-line description." },
        ],
      },
      {
        id: 'tech-4',
        title: 'Austin Evans \u2014 Tech Reviews & Comparisons',
        source: '5.4M subs \u00b7 Broad tech coverage',
        whyHot: 'Does "Best [category] of 2026" roundup videos constantly. His audience actively searches for product lists. High purchase intent viewers.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@austinevans' },
          { label: 'X/Twitter', url: 'https://twitter.com/austinnotduncan' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @austinnotduncan \u2014 turned your latest roundup into a Teed curation. Every product, one link. Beats the affiliate dump in your description \u2192 [LINK]" },
          { platform: 'youtube', template: "Every product from this video in one clean page \u2192 [LINK]." },
        ],
      },
      {
        id: 'tech-5',
        title: 'Justin Tse \u2014 Desk Setup King',
        source: '500K+ subs \u00b7 Setup tours since 2013',
        whyHot: 'THE desk setup creator on YouTube. "Ultimate Office & Desk Setup Tour" (Jan 2, 2026). Every video is literally a product list. His audience asks for links on every item.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@JustinTse' },
          { label: 'Website', url: 'https://justintse.com' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @justintse \u2014 made a Teed curation from your latest setup tour. Every product linked in one page. Way cleaner than a link tree \u2192 [LINK]" },
          { platform: 'youtube', template: "Full setup with every item from this video linked in one page \u2192 [LINK]." },
        ],
      },
    ],
  },
  {
    id: 'running',
    label: 'Running & Fitness',
    emoji: '\ud83c\udfc3',
    color: 'var(--evergreen-4)',
    colorAccent: 'var(--evergreen-11)',
    bagCreationMethod: 'Watch their shoe roundup, extract every shoe with model name, price, and use case',
    cadence: 'Refresh bi-weekly \u2014 new shoe releases drive content calendar',
    hook: 'Every shoe from the video, linked and rated, one page',
    message: "Hey! I built a Teed curation from your [VIDEO TITLE] \u2014 every shoe linked with buy pages. Cleaner than a description dump.",
    cta: 'Share it with your audience or build your own on Teed',
    shareTargets: [
      'DM on Instagram or email (running creators are responsive)',
      'Comment on their YouTube video with the bag link',
      'Tag on X: "@creator turned your shoe roundup into a clean product page"',
      'r/RunningShoeGeeks \u2014 share the bag in relevant threads',
    ],
    bags: [
      {
        id: 'run-1',
        title: 'The Run Testers \u2014 "Best Running Shoes 2026"',
        source: '300K+ subs \u00b7 Running shoe specialists \u00b7 Feb 2026 updated',
        whyHot: 'Dedicated running shoe review channel. Their "Best Running Shoes" series is THE reference for runners. 8-12 shoes per video. Brooks Glycerin Flex, Structure Plus, Skechers Aero Razor featured.',
        priority: 'urgent',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@TheRunTesters' },
          { label: 'Website', url: 'https://theruntesters.com/' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Put every shoe from this roundup in one page with buy links \u2192 [LINK]. Easier than pausing at each timestamp." },
          { platform: 'x', template: "Hey @TheRunTesters \u2014 turned your best shoes roundup into a Teed curation. One page, every shoe linked. Your viewers keep asking for links in comments \u2192 [LINK]" },
        ],
      },
      {
        id: 'run-2',
        title: 'Believe in the Run \u2014 Road Running Shoe Previews 2026',
        source: '200K+ subs \u00b7 40+ preview videos from The Running Event',
        whyHot: 'Published ~40 preview videos from The Running Event 2025 covering 2026 releases. Comprehensive, trusted, no sponsorships. Their "Best Running Shoes" video is a product list goldmine.',
        priority: 'high',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@BelieveintheRun' },
          { label: 'Website', url: 'https://believeintherun.com/' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Every shoe from this video in one clean page \u2192 [LINK]. No hunting through timestamps or description links." },
          { platform: 'x', template: "Hey @believeintherun \u2014 made a Teed curation of your 2026 shoe previews. Every shoe linked, one page. Thought your audience would dig it \u2192 [LINK]" },
        ],
      },
      {
        id: 'run-3',
        title: 'Best Damn EDC \u2014 Gear Reviews & EDC Content',
        source: 'Growing channel \u00b7 EDC + fitness crossover',
        whyHot: 'Bridges the EDC and fitness gear worlds. Pocket dumps, gym bag dumps, gear reviews. Highly engaged niche audience that loves product lists.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@BestDamnEDC' },
          { label: 'Website', url: 'https://bestdamnedc.com/' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Full gear list from this dump in one page \u2192 [LINK]. Every item linked." },
          { platform: 'x', template: "Built a Teed curation from your latest carry. Every item linked \u2014 no description hunting \u2192 [LINK]" },
        ],
      },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty & Lifestyle',
    emoji: '\u2728',
    color: 'var(--copper-4)',
    colorAccent: 'var(--copper-11)',
    bagCreationMethod: 'Watch GRWM/routine video, extract every product with brand + shade/variant',
    cadence: 'Refresh weekly \u2014 beauty content is high-velocity, seasonal',
    hook: 'Every product from the routine, one page, every link',
    message: "Hey! I made a Teed page with every product from your [VIDEO TITLE]. Your audience won't have to screenshot anymore.",
    cta: 'Share the link or build your own on Teed',
    shareTargets: [
      'DM on Instagram (primary for beauty creators)',
      'Comment on TikTok/YouTube with the bag link',
      'Tag on X or Threads',
      'r/Sephora, r/SkincareAddiction, r/MakeupAddiction threads',
    ],
    bags: [
      {
        id: 'beauty-1',
        title: 'Shea Whitney \u2014 Amazon Hauls & Favorites',
        source: '1.7M subs \u00b7 Amazon Influencer Program \u00b7 Frequent haul videos',
        whyHot: 'THE Amazon haul queen. Her videos ARE product lists. She already has an Amazon storefront \u2014 Teed would be a much cleaner presentation layer. Polished, accessible fashion + beauty content.',
        priority: 'urgent',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@SheaWhitney' },
          { label: 'Amazon Storefront', url: 'https://www.amazon.com/shop/sheawhitney' },
          { label: 'Instagram', url: 'https://instagram.com/shea.whitney' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @sheaborawhitney \u2014 I turned your latest Amazon haul into a Teed curation. Every product, one clean page. Way more polished than a link tree or Amazon list \u2192 [LINK]" },
          { platform: 'youtube', template: "Every product from this haul in one page \u2192 [LINK]. Easier than scrolling through description links." },
        ],
      },
      {
        id: 'beauty-2',
        title: 'NikkieTutorials \u2014 Beauty Routines & Favorites',
        source: '24M+ subs \u00b7 Top beauty creator globally',
        whyHot: 'Massive reach. Uses YouTube Shorts to stay visible, long-form for product launches. Her routine videos feature 10-15+ products. Getting a Teed bag in her hands = instant credibility for the platform.',
        priority: 'high',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@NikkieTutorials' },
          { label: 'Instagram', url: 'https://instagram.com/nikkietutorials' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @NikkieTutorials \u2014 made a Teed curation of every product from your latest routine. One clean page your audience can save \u2192 [LINK]" },
          { platform: 'youtube', template: "Every product from this video in one shareable page \u2192 [LINK]. No pausing to write them down." },
        ],
      },
      {
        id: 'beauty-3',
        title: 'Hyram \u2014 Skincare Routines & Product Reviews',
        source: '4.5M+ subs \u00b7 Skincare specialist',
        whyHot: 'Skincare routines are perfect curations \u2014 ordered step-by-step, specific products, highly researched audience. His followers want exact product lists.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@Hyram' },
          { label: 'Instagram', url: 'https://instagram.com/hyram' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @skinaboratory \u2014 turned your routine into a Teed curation. Every product in order, all linked. Your audience is always asking for the full list \u2192 [LINK]" },
          { platform: 'youtube', template: "Full routine with every product linked in one page \u2192 [LINK]. No more comment section Q&A about which products." },
        ],
      },
      {
        id: 'beauty-4',
        title: 'Alix Earle \u2014 GRWM & "That Girl" Lifestyle',
        source: 'Multi-platform \u00b7 TikTok + YouTube crossover \u00b7 Gen Z icon',
        whyHot: 'The "Alix Earle effect" drives instant sellouts. Her GRWM videos are product lists that move inventory. The "Alix Earle light" (clip-on phone light) became a meme product. Huge viral potential.',
        links: [
          { label: 'TikTok', url: 'https://www.tiktok.com/@alixearle' },
          { label: 'YouTube Channel', url: 'https://youtube.com/@AlixEarle' },
          { label: 'Instagram', url: 'https://instagram.com/alix_earle' },
        ],
        commentTemplates: [
          { platform: 'tiktok', template: '[Stitch first 3s of GRWM]\n"She used 8 products. I found all of them."\n[Show Teed bag on phone, scroll through items]\n"Every product. Every link. One page. Bio."' },
          { platform: 'x', template: "Turned @aaborneale's latest GRWM into a Teed curation. Every product, one page. No screenshotting needed \u2192 [LINK]" },
        ],
      },
    ],
  },
  {
    id: 'home',
    label: 'Product Reviews & Roundups',
    emoji: '\ud83c\udfc6',
    color: 'var(--amber-4)',
    colorAccent: 'var(--amber-11)',
    bagCreationMethod: 'Watch their comparison/roundup, extract every product tested with verdict',
    cadence: 'Refresh bi-weekly \u2014 roundup creators have regular posting schedules',
    hook: 'Every product tested in the video, ranked, one page',
    message: "Hey! Built a Teed curation from your [VIDEO TITLE] \u2014 every product ranked with buy links. Your viewers can save it.",
    cta: 'Share it or build your own curations on Teed',
    shareTargets: [
      'Email (product review channels often list business emails)',
      'Comment on their video with the finished bag link',
      'DM on X with the bag',
      'r/BuyItForLife, r/battlestations, r/homeautomation threads',
    ],
    bags: [
      {
        id: 'home-1',
        title: 'Vacuum Wars \u2014 Robot Vacuum Rankings Feb 2026',
        source: 'Growing channel \u00b7 8+ years testing \u00b7 Strict no-sponsorship policy',
        whyHot: 'Multiple tier videos (under $600, $600-$1K, $1K-$1.6K, $1.6K+). Each video IS a ranked product list. No sponsorships = trusted. Christopher White is highly responsive to community.',
        priority: 'high',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@VacuumWars' },
          { label: 'Website', url: 'https://vacuumwars.com/' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Put every vacuum from this ranking in one page with buy links \u2192 [LINK]. Easier than screenshotting the tier list." },
          { platform: 'x', template: "Hey @VacuumWars \u2014 turned your latest rankings into a Teed curation. Every vacuum linked, sorted by tier. Your viewers would love this \u2192 [LINK]" },
        ],
      },
      {
        id: 'home-2',
        title: 'Cool Story Bru! \u2014 "SA Products Popular Worldwide"',
        source: '@coolstorybru_ \u00b7 166K views, 13K likes \u00b7 Published Feb 14, 2026',
        whyHot: 'Viral YouTube Short curating South African products the world loves: Biltong, Ceres juice, Rooibos tea, Nando\'s sauces, Amarula, SA wines. Clean product list format = instant Teed bag.',
        priority: 'high',
        links: [
          { label: 'TikTok', url: 'https://www.tiktok.com/@coolstorybru_' },
          { label: 'Instagram', url: 'https://instagram.com/coolstorybru_za' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @coolstorybru_ \u2014 turned your SA products video into a Teed curation. Every product linked with buy pages. Your 166K viewers would love a save-able version \u2192 [LINK]" },
          { platform: 'tiktok', template: "Put every SA product from this video in one page \u2192 [LINK]. Biltong to Amarula, all linked." },
        ],
      },
      {
        id: 'home-3',
        title: 'Project Farm \u2014 Product Testing Comparisons',
        source: '5M+ subs \u00b7 Rigorous head-to-head product testing',
        whyHot: 'Tests 5-12 products head-to-head with measurable results. His audience WANTS the ranked product list. Videos like "Which WD-40 is Best?" or "Best Flashlight?" = perfect curation format.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@ProjectFarm' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Every product tested in this video, ranked with buy links \u2192 [LINK]. Your audience can save the list." },
          { platform: 'x', template: "Hey @ProjectFarm \u2014 built a Teed curation from your latest comparison. Every product ranked and linked. Thought your audience would find this useful \u2192 [LINK]" },
        ],
      },
      {
        id: 'home-4',
        title: 'Guitar World \u2014 Weekly New Gear Roundups',
        source: 'Major publication \u00b7 Weekly gear drops \u00b7 Feb 14, 2026 roundup',
        whyHot: 'Publishes weekly gear roundups covering new releases from Gibson, Kiesel, Martin, Taylor, Behringer, D\'Addario. Each roundup is 8-15 products. Guitar gear community is intensely product-focused.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@GuitarWorld' },
          { label: 'Gear Roundup', url: 'https://www.guitarworld.com/gear/guitar-gear-round-up-2026-wc-feb-9' },
        ],
        commentTemplates: [
          { platform: 'youtube', template: "Every new piece of gear from this week's roundup in one page \u2192 [LINK]. All linked with buy pages." },
          { platform: 'x', template: "Turned @GuitarWorld's latest gear roundup into a Teed curation. Every product linked \u2192 [LINK]" },
        ],
      },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Productivity',
    emoji: '\ud83d\udcdd',
    color: 'var(--sky-4)',
    colorAccent: 'var(--sky-11)',
    bagCreationMethod: 'Watch their "favorites" or "tools I use" video, extract every product/tool',
    cadence: 'Refresh monthly \u2014 these creators post tool lists less frequently but with high engagement',
    hook: 'Every tool and product from the video, one shareable page',
    message: "Hey! Built a Teed curation from your [VIDEO TITLE]. Every tool linked in one clean page your audience can save.",
    cta: 'Share it or build curations for your own recommendations',
    shareTargets: [
      'Email (productivity creators are business-minded, responsive to tools)',
      'DM on X/Twitter',
      'Comment on their YouTube video',
      'r/productivity, r/Notion, r/minimalism threads',
    ],
    bags: [
      {
        id: 'life-1',
        title: 'Ali Abdaal \u2014 Productivity Tools & Favorites',
        source: '5M+ subs \u00b7 Doctor-turned-creator \u00b7 "I Tried 137 Productivity Tools"',
        whyHot: 'His "tools I use" and "137 productivity tools" videos are LISTS. Massive audience of tool-buyers. Already monetizes through affiliate links \u2014 Teed is a better presentation layer than Notion pages.',
        priority: 'urgent',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@aliabdaal' },
          { label: 'X/Twitter', url: 'https://twitter.com/aliabdaal' },
          { label: 'Website', url: 'https://aliabdaal.com/' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @aliabdaal \u2014 turned your productivity tools video into a Teed curation. Every tool linked in one page. Way cleaner than a Notion doc for sharing with your audience \u2192 [LINK]" },
          { platform: 'youtube', template: "Every tool from this video in one shareable page \u2192 [LINK]. Save it instead of bookmarking the video." },
        ],
      },
      {
        id: 'life-2',
        title: 'Matt D\'Avella \u2014 Minimalism & Intentional Living',
        source: '3.5M+ subs \u00b7 Filmmaker + minimalist',
        whyHot: 'His minimalism content naturally leads to curated "essentials" lists. When Matt recommends something, his audience buys it. Clean aesthetic aligns perfectly with Teed\'s design.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@MattDAvella' },
          { label: 'X/Twitter', url: 'https://twitter.com/mattdavella' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @mattdavella \u2014 built a Teed curation from your essentials. Minimalist tool for a minimalist creator \u2014 every item, one clean page \u2192 [LINK]" },
          { platform: 'youtube', template: "Every item from this video in one minimalist page \u2192 [LINK]." },
        ],
      },
      {
        id: 'life-3',
        title: 'Thomas Frank \u2014 Notion Templates & Productivity',
        source: '3M+ subs \u00b7 Notion expert \u00b7 Tool recommendations',
        whyHot: 'His audience literally buys tools and templates he recommends. His Notion coverage means he understands product curation. Would immediately see the value of Teed bags for his tool recommendations.',
        links: [
          { label: 'YouTube Channel', url: 'https://youtube.com/@ThomasFrankExplains' },
          { label: 'X/Twitter', url: 'https://twitter.com/TomFrankly' },
        ],
        commentTemplates: [
          { platform: 'x', template: "Hey @TomFrankly \u2014 made a Teed curation of your recommended tools. One page, every tool linked. Like a Notion database but shareable and public \u2192 [LINK]" },
          { platform: 'youtube', template: "Full tool list from this video in one page \u2192 [LINK]. Shareable link instead of a Notion doc." },
        ],
      },
    ],
  },
];

const TIKTOK_SCRIPTS: TikTokScript[] = [
  {
    nicheId: 'tech',
    title: 'Outreach DM: Tech Creator',
    segments: [
      { timing: 'SUBJECT', text: 'I turned your [video title] into a shareable product page' },
      { timing: 'OPEN', text: 'Hey [name]! I\'m building Teed \u2014 a tool that turns product lists into clean, shareable pages. I watched your [video title] and put every product into a single page your audience can save and share.' },
      { timing: 'VALUE', text: 'Instead of your viewers hunting through timestamps or the description, they get one link with every product. You can embed it anywhere, and update it when you swap gear.' },
      { timing: 'ASK', text: 'Here\'s the page I made: [LINK]\n\nIf you dig it, you can claim it and customize it. Or I can show you how to make your own in 2 minutes. No strings attached.' },
      { timing: 'CLOSE', text: 'Either way, keep making great content. Just thought this might save your audience (and your DMs) some time.\n\n\u2014 Brett' },
    ],
  },
  {
    nicheId: 'running',
    title: 'Outreach DM: Running / Fitness Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your shoe roundup as a saveable product page' },
      { timing: 'OPEN', text: 'Hey [name]! I\'m Brett, building Teed. I turned your [video title] into a single page where every shoe is linked with buy pages. Your viewers always ask "which ones?" in the comments \u2014 this answers it.' },
      { timing: 'VALUE', text: 'Each shoe gets its own card with the image, your verdict, and a buy link. Way cleaner than a description full of affiliate links. And when new shoes drop, you update one place.' },
      { timing: 'ASK', text: 'Here\'s what I made: [LINK]\n\nHappy to hand it over to you to own. Or show you how to make your own for every video. Free tool, no catch.' },
      { timing: 'CLOSE', text: 'Love your content \u2014 just thought this could save your audience some time.\n\n\u2014 Brett' },
    ],
  },
  {
    nicheId: 'beauty',
    title: 'Outreach DM: Beauty / GRWM Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Every product from your GRWM \u2014 one page, zero screenshots' },
      { timing: 'OPEN', text: 'Hey [name]! I\'m Brett. I watch your content and noticed your audience always asks for the full product list. So I built one \u2014 every product from your [video title] in one shareable page.' },
      { timing: 'VALUE', text: 'Your followers can save it instead of screenshotting. Each product has the brand, shade, and buy link. You can add notes like "my holy grail" or "only for oily skin." It\'s like a permanent version of your video description.' },
      { timing: 'ASK', text: 'Here it is: [LINK]\n\nYou can claim it and make it yours, or I can walk you through making your own. Takes about 2 minutes per routine.' },
      { timing: 'CLOSE', text: 'No pressure at all. Just thought it\'d help your audience find everything without DMing you.\n\n\u2014 Brett' },
    ],
  },
  {
    nicheId: 'home',
    title: 'Outreach DM: Product Review / Roundup Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your product rankings as a shareable page' },
      { timing: 'OPEN', text: 'Hey [name]! I\'m Brett, building a tool called Teed. I turned your [video title] into a ranked product page where every item is linked. Your viewers can save and share it.' },
      { timing: 'VALUE', text: 'Your rankings are gold \u2014 but they\'re locked in a video. This gives your audience a reference they can bookmark, share, and come back to. You can update it when you retest products.' },
      { timing: 'ASK', text: 'Here\'s the page: [LINK]\n\nHappy to hand it over. Or show you how to make one for every video. Free tool, built for exactly this use case.' },
      { timing: 'CLOSE', text: 'Appreciate the thorough testing you do. Just thought this could extend the shelf life of your reviews.\n\n\u2014 Brett' },
    ],
  },
  {
    nicheId: 'lifestyle',
    title: 'Outreach DM: Productivity / Lifestyle Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your tool recommendations as a shareable page' },
      { timing: 'OPEN', text: 'Hey [name]! I\'m Brett. Watched your [video title] and turned every tool you recommended into a single shareable page. Your audience can save it instead of rewatching the video.' },
      { timing: 'VALUE', text: 'Think of it like a public Notion page but purpose-built for product/tool lists. Each item gets a card with your notes, a link, and an image. You update one place and it\'s current everywhere.' },
      { timing: 'ASK', text: 'Here\'s what I made: [LINK]\n\nYou can claim it, customize it, embed it on your site. Or I can show you how to make your own in a few minutes.' },
      { timing: 'CLOSE', text: 'Big fan of your work. Just thought this tool would click with how you share recommendations.\n\n\u2014 Brett' },
    ],
  },
];

const CALENDAR: CalendarWeek[] = [
  {
    week: 1,
    title: 'Build Curations',
    phase: 'Create Teed bags from creator videos before reaching out',
    tasks: [
      { day: 'Mon', category: 'tech', action: 'Create Teed bag from LTT webcam roundup', platform: 'Teed', priority: 'urgent' },
      { day: 'Mon', category: 'tech', action: 'Create Teed bag from MKBHD phone setup', platform: 'Teed', priority: 'high' },
      { day: 'Tue', category: 'running', action: 'Create Teed bag from The Run Testers shoe roundup', platform: 'Teed', priority: 'urgent' },
      { day: 'Tue', category: 'beauty', action: 'Create Teed bag from Shea Whitney Amazon haul', platform: 'Teed', priority: 'high' },
      { day: 'Wed', category: 'home', action: 'Create Teed bag from Vacuum Wars rankings', platform: 'Teed', priority: 'high' },
      { day: 'Wed', category: 'home', action: 'Create Teed bag from Cool Story Bru SA products', platform: 'Teed' },
      { day: 'Thu', category: 'lifestyle', action: 'Create Teed bag from Ali Abdaal productivity tools', platform: 'Teed', priority: 'urgent' },
      { day: 'Thu', category: 'tech', action: 'Create Teed bag from Sara Dietschy studio tour', platform: 'Teed' },
      { day: 'Fri', category: 'all', action: 'QA all bags \u2014 every link works, images load, descriptions are clean', platform: 'Teed' },
    ],
  },
  {
    week: 2,
    title: 'Outreach Wave 1',
    phase: 'DM top-priority creators with finished bags',
    tasks: [
      { day: 'Mon', category: 'tech', action: 'DM Linus Tech Tips with webcam bag (X or email)', platform: 'X/Email', priority: 'urgent' },
      { day: 'Mon', category: 'lifestyle', action: 'DM Ali Abdaal with tools bag (X or email)', platform: 'X/Email', priority: 'urgent' },
      { day: 'Tue', category: 'running', action: 'DM The Run Testers with shoe bag', platform: 'X/Email', priority: 'high' },
      { day: 'Tue', category: 'beauty', action: 'DM Shea Whitney with haul bag (Instagram)', platform: 'Instagram', priority: 'high' },
      { day: 'Wed', category: 'home', action: 'DM Vacuum Wars with rankings bag', platform: 'X/Email' },
      { day: 'Wed', category: 'home', action: 'DM Cool Story Bru with SA products bag', platform: 'Instagram' },
      { day: 'Thu', category: 'tech', action: 'DM MKBHD with phone setup bag', platform: 'X/Email' },
      { day: 'Thu', category: 'tech', action: 'Comment on target creator videos with bag links', platform: 'YouTube' },
      { day: 'Fri', category: 'all', action: 'Track responses \u2014 note who opened, replied, ignored', platform: 'All' },
    ],
  },
  {
    week: 3,
    title: 'Outreach Wave 2 + Follow-ups',
    phase: 'Follow up on Wave 1, DM remaining creators',
    tasks: [
      { day: 'Mon', category: 'all', action: 'Follow up with Wave 1 non-responders (gentle nudge)', platform: 'X/Email' },
      { day: 'Mon', category: 'beauty', action: 'DM NikkieTutorials and Hyram with routine bags', platform: 'Instagram' },
      { day: 'Tue', category: 'tech', action: 'DM Justin Tse and Austin Evans with setup bags', platform: 'X/Email' },
      { day: 'Tue', category: 'running', action: 'DM Believe in the Run with shoe bag', platform: 'X/Email' },
      { day: 'Wed', category: 'lifestyle', action: 'DM Matt D\'Avella and Thomas Frank with tools bags', platform: 'X/Email' },
      { day: 'Wed', category: 'home', action: 'DM Project Farm and Guitar World with roundup bags', platform: 'X/Email' },
      { day: 'Thu', category: 'beauty', action: 'DM Alix Earle with GRWM bag (TikTok or Instagram)', platform: 'TikTok' },
      { day: 'Fri', category: 'all', action: 'Run /last30days refresh to find new creators (see Workflow tab)', platform: 'Claude Code' },
    ],
  },
  {
    week: 4,
    title: 'Analyze + Refresh Pipeline',
    phase: 'Measure results, replenish creator pipeline with /last30days',
    tasks: [
      { day: 'Mon', category: 'all', action: 'Tally results: replies, bag views, signups, any creator adoptions', platform: 'Analytics' },
      { day: 'Mon', category: 'all', action: 'Identify which vertical had best response rate', platform: 'Analytics' },
      { day: 'Tue', category: 'all', action: 'Run /last30days for each vertical to find fresh creators', platform: 'Claude Code' },
      { day: 'Wed', category: 'all', action: 'Update this strategy page with new creator targets from research', platform: 'Teed' },
      { day: 'Thu', category: 'all', action: 'Build next batch of bags from new creator videos', platform: 'Teed' },
      { day: 'Fri', category: 'all', action: 'Plan next month \u2014 double down on best-performing vertical', platform: 'Internal' },
    ],
  },
];

const METRICS_TARGETS = [
  { metric: 'Creator bags built', target: '19', why: 'One per creator target in the list' },
  { metric: 'DMs sent', target: '19', why: 'Every creator gets a personalized outreach' },
  { metric: 'Response rate', target: '25%+', why: '~5 replies from 19 DMs is strong for cold outreach' },
  { metric: 'Creators who view their bag', target: '10+', why: 'Proves the value prop resonates' },
  { metric: 'Creator signups', target: '3-5', why: 'Even one adoption is a massive win for credibility' },
  { metric: 'Best-performing vertical', target: 'Identify winner', why: 'Focus next month on what works' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'teed-market-strategy-state';

function loadState(): StrategyState {
  if (typeof window === 'undefined') return { bagStatuses: {}, distributionChecks: {}, calendarChecks: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { bagStatuses: {}, distributionChecks: {}, calendarChecks: {} };
}

function saveState(state: StrategyState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const PLATFORM_LABELS: Record<Platform, string> = {
  reddit: 'Reddit',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X / Twitter',
};

const NICHE_COLORS: Record<NicheId, { bg: string; text: string; border: string }> = {
  tech: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
  running: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  beauty: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  home: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  lifestyle: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketStrategyClient() {
  const [activeTab, setActiveTab] = useState<TabId>('playbook');
  const [state, setState] = useState<StrategyState>({ bagStatuses: {}, distributionChecks: {}, calendarChecks: {} });
  const [expandedBags, setExpandedBags] = useState<Set<string>>(new Set());
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const persistState = useCallback((next: StrategyState) => {
    setState(next);
    saveState(next);
  }, []);

  const toggleBagStatus = (bagId: string) => {
    const current = state.bagStatuses[bagId] || 'pending';
    const nextMap: Record<BagStatus, BagStatus> = { pending: 'created', created: 'distributed', distributed: 'pending' };
    persistState({ ...state, bagStatuses: { ...state.bagStatuses, [bagId]: nextMap[current] } });
  };

  const toggleDistribution = (bagId: string, platform: Platform) => {
    const bagChecks = state.distributionChecks[bagId] || { reddit: false, youtube: false, tiktok: false, x: false };
    persistState({
      ...state,
      distributionChecks: {
        ...state.distributionChecks,
        [bagId]: { ...bagChecks, [platform]: !bagChecks[platform] },
      },
    });
  };

  const toggleCalendar = (taskKey: string) => {
    persistState({
      ...state,
      calendarChecks: { ...state.calendarChecks, [taskKey]: !state.calendarChecks[taskKey] },
    });
  };

  const toggleExpanded = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'playbook', label: 'Playbook', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'scripts', label: 'Scripts', icon: <FileText className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'workflow', label: 'Workflow', icon: <Wrench className="w-4 h-4" /> },
  ];

  const statusBadge = (bagId: string) => {
    const s = state.bagStatuses[bagId] || 'pending';
    const styles: Record<BagStatus, string> = {
      pending: 'bg-[var(--grey-4)] text-[var(--grey-11)]',
      created: 'bg-[var(--amber-4)] text-[var(--amber-11)]',
      distributed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    };
    const icons: Record<BagStatus, React.ReactNode> = {
      pending: <Circle className="w-3 h-3" />,
      created: <Clock className="w-3 h-3" />,
      distributed: <CheckCircle2 className="w-3 h-3" />,
    };
    return (
      <button onClick={() => toggleBagStatus(bagId)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[s]} cursor-pointer hover:opacity-80 transition-opacity`}>
        {icons[s]}
        {s}
      </button>
    );
  };

  const priorityBadge = (priority?: 'urgent' | 'high' | 'normal') => {
    if (!priority || priority === 'normal') return null;
    if (priority === 'urgent') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
        <Flame className="w-3 h-3" /> URGENT
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
        <AlertCircle className="w-3 h-3" /> HIGH
      </span>
    );
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--grey-4)] transition-colors"
    >
      {copiedId === id ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );

  // ─── Tab: Playbook ─────────────────────────────────────────────────────────

  const renderPlaybook = () => (
    <div className="space-y-10">
      {NICHES.map((niche) => (
        <section key={niche.id}>
          {/* Niche header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{niche.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{niche.label}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{niche.bagCreationMethod} &middot; {niche.cadence}</p>
            </div>
          </div>

          {/* Hook / Message / CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Hook</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{niche.hook}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Message</p>
              <p className="text-sm text-[var(--text-primary)]">{niche.message}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">CTA</p>
              <p className="text-sm text-[var(--text-primary)]">{niche.cta}</p>
            </div>
          </div>

          {/* Where to share */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Where to share</p>
            <ul className="space-y-1">
              {niche.shareTargets.map((t, i) => (
                <li key={i} className="text-sm text-[var(--text-primary)]">&bull; {t}</li>
              ))}
            </ul>
          </div>

          {/* Seed bags */}
          <div className="space-y-3">
            {niche.bags.map((bag) => {
              const isExpanded = expandedBags.has(bag.id);
              const bagDistro = state.distributionChecks[bag.id] || { reddit: false, youtube: false, tiktok: false, x: false };

              return (
                <div key={bag.id} className={`rounded-[var(--radius-xl)] border ${NICHE_COLORS[niche.id].border} overflow-hidden`}>
                  {/* Bag header */}
                  <button
                    onClick={() => toggleExpanded(bag.id, expandedBags, setExpandedBags)}
                    className={`w-full flex items-center justify-between p-4 ${NICHE_COLORS[niche.id].bg} hover:opacity-90 transition-opacity text-left`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${NICHE_COLORS[niche.id].text}`}>{bag.title}</h3>
                          {priorityBadge(bag.priority)}
                          {statusBadge(bag.id)}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{bag.source}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-secondary)] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-[var(--surface)] space-y-4">
                      {/* Why it's hot */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Why it&apos;s hot</p>
                        <p className="text-sm text-[var(--text-primary)]">{bag.whyHot}</p>
                      </div>

                      {/* Links to comment on */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Links to comment on</p>
                        <div className="flex flex-wrap gap-2">
                          {bag.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] transition-colors">
                              <ExternalLink className="w-3 h-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Distribution checklist */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Distribution</p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                            <button
                              key={p}
                              onClick={() => toggleDistribution(bag.id, p)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                bagDistro[p]
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                  : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                              }`}
                            >
                              {bagDistro[p] ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                              {PLATFORM_LABELS[p]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment templates */}
                      {bag.commentTemplates.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Comment templates</p>
                          <div className="space-y-2">
                            {bag.commentTemplates.map((ct, i) => (
                              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--grey-4)] text-[var(--grey-11)] uppercase">{ct.platform}</span>
                                <p className="text-sm text-[var(--text-primary)] flex-1 whitespace-pre-wrap">{ct.template}</p>
                                <CopyButton text={ct.template} id={`${bag.id}-${ct.platform}-${i}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Create bag link */}
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <Link
                          href="/admin/tools"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--teed-green-4)] text-[var(--teed-green-11)] hover:bg-[var(--teed-green-6)] transition-colors"
                        >
                          <Target className="w-4 h-4" />
                          Create This Bag
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  // ─── Tab: Scripts ──────────────────────────────────────────────────────────

  const renderScripts = () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        TikTok scripts for &quot;Best 3 curations in [category] for February 2026&quot; format. ~20 seconds each.
      </p>
      {TIKTOK_SCRIPTS.map((script) => {
        const niche = NICHES.find((n) => n.id === script.nicheId)!;
        const isExpanded = expandedScripts.has(script.nicheId);
        const fullScript = script.segments.map((s) => `[${s.timing}]\n${s.text}`).join('\n\n');

        return (
          <div key={script.nicheId} className={`rounded-[var(--radius-xl)] border ${NICHE_COLORS[script.nicheId].border} overflow-hidden`}>
            <button
              onClick={() => toggleExpanded(script.nicheId, expandedScripts, setExpandedScripts)}
              className={`w-full flex items-center justify-between p-4 ${NICHE_COLORS[script.nicheId].bg} hover:opacity-90 transition-opacity text-left`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{niche.emoji}</span>
                <div>
                  <h3 className={`font-semibold ${NICHE_COLORS[script.nicheId].text}`}>{script.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{niche.label} &middot; ~22s</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={fullScript} id={`script-${script.nicheId}`} />
                {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 bg-[var(--surface)] space-y-3">
                {script.segments.map((seg, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 w-28 text-xs font-mono font-medium text-[var(--text-secondary)] pt-0.5">{seg.timing}</span>
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{seg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Stitch template */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Generic Stitch Template (any GRWM/haul)</h3>
            <CopyButton
              text={`[Stitch first 3s of viral video]\n"She used [X] products. I found all of them."\n[Show Teed bag on phone, scroll through items]\n"Every product. Every link. One page. Bio."`}
              id="stitch-template"
            />
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono">
              {`[Stitch first 3s of viral video]\n"She used [X] products. I found all of them."\n[Show Teed bag on phone, scroll through items]\n"Every product. Every link. One page. Bio."`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tab: Calendar ─────────────────────────────────────────────────────────

  const renderCalendar = () => (
    <div className="space-y-6">
      {CALENDAR.map((week) => (
        <div key={week.week} className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Week {week.week}: {week.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{week.phase}</p>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {week.tasks.filter((t) => state.calendarChecks[`w${week.week}-${t.day}-${t.action}`]).length}/{week.tasks.length} done
              </span>
            </div>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {week.tasks.map((task, i) => {
              const taskKey = `w${week.week}-${task.day}-${task.action}`;
              const isDone = state.calendarChecks[taskKey] || false;
              const colors = task.category === 'all' ? { bg: 'bg-[var(--grey-4)]', text: 'text-[var(--grey-11)]' } : NICHE_COLORS[task.category];

              return (
                <button
                  key={i}
                  onClick={() => toggleCalendar(taskKey)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--surface-elevated)] transition-colors text-left ${isDone ? 'opacity-60' : ''}`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Circle className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />}
                  <span className="shrink-0 w-10 text-xs font-mono text-[var(--text-secondary)]">{task.day}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {task.category === 'all' ? 'ALL' : task.category.toUpperCase()}
                  </span>
                  <span className={`text-sm flex-1 ${isDone ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                    {task.action}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-secondary)]">{task.platform}</span>
                  {priorityBadge(task.priority)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Tab: Metrics ──────────────────────────────────────────────────────────

  const renderMetrics = () => {
    const totalBags = NICHES.reduce((sum, n) => sum + n.bags.length, 0);
    const created = Object.values(state.bagStatuses).filter((s) => s === 'created' || s === 'distributed').length;
    const distributed = Object.values(state.bagStatuses).filter((s) => s === 'distributed').length;
    const totalCalTasks = CALENDAR.reduce((sum, w) => sum + w.tasks.length, 0);
    const calDone = Object.values(state.calendarChecks).filter(Boolean).length;

    return (
      <div className="space-y-6">
        {/* Progress overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Bags Planned</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{totalBags}</p>
          </div>
          <div className="p-4 rounded-[var(--radius-xl)] border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Bags Created</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{created}</p>
          </div>
          <div className="p-4 rounded-[var(--radius-xl)] border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
            <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">Distributed</p>
            <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">{distributed}</p>
          </div>
          <div className="p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Calendar Tasks</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{calDone}/{totalCalTasks}</p>
          </div>
        </div>

        {/* Target metrics table */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
            <h3 className="font-bold text-[var(--text-primary)]">Month 1 Targets</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">Metric</th>
                <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">Target</th>
                <th className="text-left p-3 text-xs font-medium text-[var(--text-secondary)]">Why It Matters</th>
              </tr>
            </thead>
            <tbody>
              {METRICS_TARGETS.map((m, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="p-3 text-sm font-medium text-[var(--text-primary)]">{m.metric}</td>
                  <td className="p-3 text-sm font-semibold text-[var(--text-primary)]">{m.target}</td>
                  <td className="p-3 text-sm text-[var(--text-secondary)]">{m.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The big idea */}
        <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
          <h3 className="font-bold text-[var(--text-primary)] mb-3">The Big Idea</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every viral product video, every Reddit flatlay, every GRWM, every desk tour has the same problem:
            <strong className="text-[var(--text-primary)]"> the audience wants the product list, and it&apos;s scattered across timestamps, comments, and affiliate link dumps.</strong>
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">
            Teed bags are the clean, shareable, forkable answer to &quot;what are all those products?&quot; The strategy isn&apos;t to create demand &mdash;
            the demand already exists in every comment section asking &quot;link?&quot; The strategy is to <strong className="text-[var(--text-primary)]">be there with the answer</strong>,
            consistently, across every product-focused community, until Teed becomes the default way people share and discover curated product collections.
          </p>
        </div>
      </div>
    );
  };

  // ─── Tab: Workflow ─────────────────────────────────────────────────────────

  const WORKFLOW_STEPS = [
    {
      step: 1,
      title: 'Research the Topic',
      icon: <Globe className="w-5 h-5" />,
      description: 'Find source material with exact product details.',
      details: [
        'Use /last30days or web search to find source articles, Reddit posts, TikTok product lists',
        'Identify every product: brand, model name, key specs (loft, shaft flex, weight, etc.)',
        'Golf WITBs: GolfWRX is the best source — they list exact specs',
        'EDC: r/EDC flatlay posts list items in comments',
        'GRWM: TikTok creator bios and "products used" in captions',
        'Desk setups: r/battlestations posts and YouTube descriptions',
      ],
    },
    {
      step: 2,
      title: 'Create the Bag Script',
      icon: <Terminal className="w-5 h-5" />,
      description: 'Write a TypeScript script to insert the bag and items into Supabase.',
      details: [
        'Script location: scripts/create-[topic]-bags.ts',
        'Uses Supabase service role client (bypasses RLS)',
        '@teed user ID: 2c3e503a-78ce-4a8d-ae37-60b4a16d916e',
        'Shafts/accessories as SEPARATE items — enables independent links and images',
        'Naming pattern: "Driver Shaft — Fujikura Ventus Black 60g X-Stiff"',
        'custom_name drives image search — make it descriptive for good Google results',
        'Bag code is the URL slug: kebab-case like "anthony-kim-s-liv-adelaide-witb-feb-2026"',
        'Include bag-level source links (article URLs)',
      ],
    },
    {
      step: 3,
      title: 'List Items to Get UUIDs',
      icon: <Package className="w-5 h-5" />,
      description: 'Run a list script to get all item IDs for linking.',
      details: [
        'Script location: scripts/list-[topic]-items.ts',
        'Output format: sort_index | uuid | brand | custom_name',
        'Copy UUIDs for the next step',
      ],
    },
    {
      step: 4,
      title: 'Find VERIFIED Product URLs',
      icon: <Globe className="w-5 h-5" />,
      description: 'Web search each product to find the real manufacturer page URL.',
      details: [
        'NEVER fabricate/guess manufacturer URLs — they WILL be wrong',
        'Always search: "[product name] site:[manufacturer].com"',
        'TaylorMade product codes are unpredictable (DW-TC###, DW-AL###) — always verify',
        'Callaway URL paths change by year (drivers-2026-quantum-triple-diamond.html)',
        'Group items sharing the same product URL (e.g., all MG5 wedges → one URL)',
        'Test every unique URL before inserting',
      ],
    },
    {
      step: 5,
      title: 'Add Links Script',
      icon: <Terminal className="w-5 h-5" />,
      description: 'Insert verified product links for all items.',
      details: [
        'Script location: scripts/add-[topic]-links.ts',
        'Maps item UUIDs → verified product URLs',
        'Link kinds: "product" (buy/view page), "source" (article, player profile)',
        'If fixing bad links: delete old first with .delete().in("bag_item_id", allItemIds)',
        'Validate by checking items on localhost after insertion',
      ],
    },
  ];

  const URL_PATTERNS = [
    { brand: 'TaylorMade', domain: 'taylormadegolf.com', pattern: '/[Product-Name]/[ProductCode].html', example: '/MG5-Wedge/DW-TC647.html', warning: 'Product codes are NOT guessable' },
    { brand: 'Callaway', domain: 'callawaygolf.com', pattern: '/golf-clubs/[cat]/[slug].html', example: '/golf-clubs/drivers/drivers-2026-quantum-triple-diamond.html', warning: 'URLs change by model year' },
    { brand: 'Ping', domain: 'ping.com', pattern: '/en-us/clubs/[cat]/[model]', example: '/en-us/clubs/drivers/g440-lst', warning: null },
    { brand: 'Titleist', domain: 'titleist.com', pattern: '/golf-clubs/[category]', example: '/golf-clubs/putters', warning: null },
    { brand: 'Scotty Cameron', domain: 'scottycameron.com', pattern: '/putters/', example: '/putters/', warning: null },
    { brand: 'Bridgestone (clubs)', domain: 'bridgestonegolf.com', pattern: '/en-us/clubs/[cat]/[model]', example: '/en-us/clubs/irons/220-mb', warning: null },
    { brand: 'Bridgestone (balls)', domain: 'bridgestonegolf.com', pattern: '/en-us/balls/tour-series/[model]', example: '/en-us/balls/tour-series/tour-bx', warning: 'Not /balls/tour-b-x' },
    { brand: 'Fujikura', domain: 'fujikuragolf.com', pattern: '/woods/[line]/', example: '/woods/ventus/', warning: 'Old /product/ paths are dead' },
    { brand: 'Mitsubishi', domain: 'mitsubishigolf.com', pattern: '/products/[slug]', example: '/products/diamana-d-limited-1', warning: 'Not /shafts/' },
    { brand: 'True Temper', domain: 'truetemper.com', pattern: '/products/[slug]/', example: '/products/iron-shafts-dynamic-gold/', warning: '/products/ not /product/' },
  ];

  const GOTCHAS = [
    { title: 'Never Fabricate URLs', description: 'Manufacturer URLs use internal product codes that cannot be guessed. Always web search "[product name] site:[domain]" to find the real page. Wrong codes redirect to random products (e.g., wedge page → ball page).', severity: 'critical' as const },
    { title: 'Shafts as Separate Items', description: 'Always create shaft/accessory items independently. This gives each one its own image search result and product link. Name them: "Driver Shaft — [Brand] [Model] [Spec]".', severity: 'important' as const },
    { title: 'Image Search Quality', description: 'Google Custom Search uses "brand + custom_name" as the query. Newer or niche products may return wrong images. Making custom_name more descriptive helps. Known issue: very new products (e.g., Qi4D at launch) have poor Google index coverage.', severity: 'info' as const },
    { title: 'Validate After Inserting', description: 'Always check the bag on localhost after adding links. Click every link. Wedge links going to ball pages, 404s, and redirects are common when URLs are guessed.', severity: 'important' as const },
    { title: 'Run Script Command', description: 'Scripts need env vars loaded first. Always use: set -a && source .env.local && set +a && npx tsx scripts/[name].ts', severity: 'info' as const },
    { title: 'Bag-Level Source Links', description: 'Add source links (WITB article URLs, Reddit posts) at the bag level too, not just item-level product links. These help users find the original content.', severity: 'info' as const },
  ];

  const renderWorkflow = () => (
    <div className="space-y-8">
      {/* Claude prompt */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--teed-green-6)] bg-[var(--teed-green-4)]/30 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[var(--text-primary)]">Claude Code Prompt</h3>
            <CopyButton
              text={`Create a [TOPIC] bag under @teed using the bag creation workflow. The topic is: [DESCRIPTION]. Source material: [URLS]. Use the bag-creation-workflow memory file for the full process.`}
              id="workflow-prompt"
            />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">Copy this prompt template and fill in the brackets to trigger the full workflow in Claude Code.</p>
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] font-mono text-sm text-[var(--text-primary)]">
            Create a [TOPIC] bag under @teed using the bag creation workflow. The topic is: [DESCRIPTION]. Source material: [URLS]. Use the bag-creation-workflow memory file for the full process.
          </div>
        </div>
      </div>

      {/* 5-step process */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">The 5-Step Process</h2>
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((ws) => (
            <div key={ws.step} className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
              <div className="flex items-start gap-4 p-4 bg-[var(--surface)]">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--teed-green-4)] text-[var(--teed-green-11)] shrink-0">
                  {ws.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[var(--text-secondary)]">Step {ws.step}</span>
                    <h3 className="font-semibold text-[var(--text-primary)]">{ws.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{ws.description}</p>
                  <ul className="space-y-1.5">
                    {ws.details.map((d, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                        <span className="text-[var(--text-secondary)] mt-1 shrink-0">&bull;</span>
                        <span className="font-mono text-xs leading-5">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gotchas / Lessons Learned */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Lessons Learned</h2>
        <div className="space-y-3">
          {GOTCHAS.map((g, i) => {
            const severityStyles = {
              critical: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
              important: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
              info: 'border-[var(--border-subtle)] bg-[var(--surface)]',
            };
            const severityIcon = {
              critical: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />,
              important: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
              info: <Circle className="w-4 h-4 text-[var(--text-secondary)]" />,
            };
            return (
              <div key={i} className={`p-4 rounded-lg border ${severityStyles[g.severity]}`}>
                <div className="flex items-center gap-2 mb-1">
                  {severityIcon[g.severity]}
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">{g.title}</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] ml-6">{g.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manufacturer URL patterns */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Manufacturer URL Patterns</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-3">Verified February 2026. Always re-verify via web search before using.</p>
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Brand</th>
                <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Domain</th>
                <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Pattern</th>
                <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Example</th>
                <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Warning</th>
              </tr>
            </thead>
            <tbody>
              {URL_PATTERNS.map((p, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="p-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{p.brand}</td>
                  <td className="p-3 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">{p.domain}</td>
                  <td className="p-3 font-mono text-xs text-[var(--text-primary)]">{p.pattern}</td>
                  <td className="p-3 font-mono text-xs text-[var(--text-secondary)]">{p.example}</td>
                  <td className="p-3 text-xs">
                    {p.warning ? (
                      <span className="text-amber-600 dark:text-amber-400">{p.warning}</span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data model quick reference */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Data Model Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2 font-mono text-sm">bags</h4>
            <ul className="space-y-1 text-xs font-mono text-[var(--text-secondary)]">
              <li>owner_id (uuid)</li>
              <li>code (slug for URL)</li>
              <li>title, description</li>
              <li>category, tags[]</li>
              <li>cover_style</li>
            </ul>
          </div>
          <div className="p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2 font-mono text-sm">bag_items</h4>
            <ul className="space-y-1 text-xs font-mono text-[var(--text-secondary)]">
              <li>bag_id (uuid)</li>
              <li>custom_name, brand</li>
              <li>custom_description</li>
              <li>why_chosen</li>
              <li>sort_index, item_type</li>
            </ul>
          </div>
          <div className="p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)]">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2 font-mono text-sm">links</h4>
            <ul className="space-y-1 text-xs font-mono text-[var(--text-secondary)]">
              <li>bag_item_id (uuid)</li>
              <li>url</li>
              <li>kind: product | source</li>
              <li>label</li>
              <li>metadata (jsonb)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">30-Day Market Strategy</h1>
              <p className="text-sm text-[var(--text-secondary)]">February 2026 &mdash; Seed bags, distribution playbook, scripts, and calendar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)] sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'playbook' && renderPlaybook()}
        {activeTab === 'scripts' && renderScripts()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'workflow' && renderWorkflow()}
      </main>
    </div>
  );
}
