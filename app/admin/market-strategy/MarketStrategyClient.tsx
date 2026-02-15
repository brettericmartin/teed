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

type NicheId = 'golf' | 'edc' | 'grwm' | 'hauls';
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
    id: 'golf',
    label: 'Golf WITB',
    emoji: '\u26f3',
    color: 'var(--evergreen-4)',
    colorAccent: 'var(--evergreen-11)',
    bagCreationMethod: 'Manual curation from WITB articles (exact specs available)',
    cadence: 'Every PGA/LIV Tour winner = new bag within 24hrs',
    hook: 'Every club. Every spec. One link.',
    message: "I put together [Player]'s full WITB from [Tournament] \u2014 every club, shaft, and spec in one place",
    cta: 'Save the bag to compare with your own setup',
    shareTargets: [
      'GolfWRX article comments (primary \u2014 gear obsessives live here)',
      'r/golf and r/GolfEquipment Reddit threads',
      'YouTube WITB videos (Rick Shiels, TXG, GolfWRX)',
      'X/Twitter replies to PGA Tour and LIV Golf winner posts',
    ],
    bags: [
      {
        id: 'golf-1',
        title: "Anthony Kim's LIV Adelaide WITB \u2014 Feb 2026",
        source: 'GolfWRX, Golf.com, GolfDigest, Sky Sports',
        whyHot: 'First win in 16 YEARS. Comeback story of the decade. No equipment sponsor \u2014 mixed Callaway/TaylorMade/Bridgestone bag. Social media went wild.',
        priority: 'urgent',
        links: [
          { label: 'GolfWRX WITB', url: 'https://www.golfwrx.com/773326/anthony-kim-witb-2026-february/' },
          { label: 'Golf.com', url: 'https://golf.com/gear/anthony-kims-liv-golf-adelaide-witb/' },
          { label: 'GolfDigest', url: 'https://www.golfdigest.com/story/the-clubs-anthony-kim-used-for-comeback-victory-at-2026-liv-golf-adelaide' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "Put together Anthony Kim's full LIV Adelaide WITB with every club and shaft spec \u2192 [LINK]. The comeback bag \u2014 no sponsor, mixed Callaway/TaylorMade/Bridgestone." },
          { platform: 'youtube', template: "Full WITB with every club linked in one place \u2192 [LINK]. No scrolling through timestamps." },
          { platform: 'x', template: "Anthony Kim just won his first event in 16 years. Here's every club in his bag \u2192 [LINK]" },
        ],
      },
      {
        id: 'golf-2',
        title: "Chris Gotterup's Phoenix Open WITB \u2014 Feb 2026",
        source: 'GolfWRX, Golf.com, GolfDigest',
        whyHot: 'Back-to-back wins (Sony Open + Phoenix Open). Bridgestone 220 MB irons \u2014 first Bridgestone clubs since 2019. Hot storyline.',
        priority: 'high',
        links: [
          { label: 'GolfWRX WITB', url: 'https://www.golfwrx.com/773054/chris-gotterups-winning-witb-2026-wm-phoenix-open/' },
          { label: 'Golf.com', url: 'https://golf.com/gear/chris-gotterups-wm-phoenix-open-witb/' },
          { label: 'GolfDigest', url: 'https://www.golfdigest.com/story/chris-gotterup-clubs-used-to-win-2026-wm-phoenix-open' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "Put together Gotterup's full Phoenix Open WITB with every club and shaft spec \u2192 [LINK]. Easier than screenshotting the article." },
          { platform: 'youtube', template: "Every club from Gotterup's back-to-back wins in one place \u2192 [LINK]." },
          { platform: 'x', template: "Chris Gotterup goes back-to-back at the Phoenix Open. Full WITB \u2192 [LINK]" },
        ],
      },
      {
        id: 'golf-3',
        title: "Rory McIlroy's 2026 Equipment Overhaul",
        source: 'GolfWRX, TaylorMade, Golf Monthly',
        whyHot: 'Changed 7 of 14 clubs. Switched to Qi4D driver, tried P7CB irons then abandoned them ("that experiment\'s over"). Drama + gear changes = engagement.',
        priority: 'high',
        links: [
          { label: 'GolfWRX', url: 'https://www.golfwrx.com/771145/rory-mcilroy-teases-major-equipment-change-for-2026/' },
          { label: 'Golf Monthly', url: 'https://www.golfmonthly.com/tour/rory-mcilroy-whats-in-the-bag-2026' },
          { label: 'GolfWRX (iron drama)', url: 'https://www.golfwrx.com/773191/that-experiments-over-rory-mcilroy-explains-why-the-cavity-back-irons-didnt-work-for-him/' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "Rory changed 7 of 14 clubs for 2026. Put together his full current WITB \u2192 [LINK]. Including the iron experiment that didn't last." },
          { platform: 'youtube', template: "Rory's full 2026 WITB \u2014 every change tracked in one place \u2192 [LINK]." },
          { platform: 'x', template: '"That experiment\'s over" \u2014 Rory ditched the cavity backs. Full 2026 WITB \u2192 [LINK]' },
        ],
      },
    ],
  },
  {
    id: 'edc',
    label: 'EDC',
    emoji: '\ud83d\udee0\ufe0f',
    color: 'var(--copper-4)',
    colorAccent: 'var(--copper-11)',
    bagCreationMethod: 'Manual curation from Reddit posts + community sites',
    cadence: '3-4x/week from top Reddit posts',
    hook: 'Your entire carry. One link. Every product.',
    message: "Made a Teed bag from your pocket dump \u2014 every item linked",
    cta: 'Save it or build your own carry',
    shareTargets: [
      'r/EDC \u2014 comment on flatlay posts when people ask "where\'d you get X?"',
      'r/BuyItForLife \u2014 quality-focused carries',
      'everydaycarry.com community submissions',
      'YouTube EDC channels (Everyday Carry, Best Damn EDC)',
    ],
    bags: [
      {
        id: 'edc-1',
        title: 'Blue Collar Winter EDC \u2014 19yo Worker',
        source: 'r/EDC (47 upvotes)',
        whyHot: "Relatable blue-collar carry, not a $2K titanium flex. Winter edition adds seasonal angle. High comment count.",
        links: [
          { label: 'Reddit post', url: 'https://www.reddit.com/r/EDC/comments/1qlxm17/everything_in_my_edc_work_and_hiking_backpack_as/' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: 'Great carry. Put all the items in a bag with links if anyone wants the full list \u2192 [LINK]' },
        ],
      },
      {
        id: 'edc-2',
        title: '2026 Minimalist EDC \u2014 Titanium & Carbon Fiber',
        source: 'everydaycarry.com, Artisan Cutlery',
        whyHot: '2026\'s big trend: "minimalist preparedness." Lightweight materials, multi-function tools. Curate from top community pocket dumps.',
        links: [
          { label: 'Artisan Cutlery guide', url: 'https://artisancutlery.net/blogs/knife-knowledge/the-ultimate-guide-to-everyday-carry-edc-in-2026/' },
          { label: 'everydaycarry.com', url: 'https://everydaycarry.com/' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: 'Curated the best minimalist titanium carry for 2026 \u2014 every item linked \u2192 [LINK]' },
          { platform: 'youtube', template: 'Full minimalist EDC with every item linked \u2192 [LINK]. Titanium everything.' },
        ],
      },
      {
        id: 'edc-3',
        title: "Gentleman's Gazette Team EDC 2026",
        source: "Gentleman's Gazette",
        whyHot: "Full team pocket dump \u2014 multiple people's carries in one feature. High production value.",
        links: [
          { label: "GG EDC 2026", url: 'https://www.gentlemansgazette.com/gentlemans-gazette-edc-2026/' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "The Gentleman's Gazette team shared their 2026 EDCs. Put them all in one bag \u2192 [LINK]" },
          { platform: 'youtube', template: "Full team EDC with every item linked \u2192 [LINK]." },
        ],
      },
    ],
  },
  {
    id: 'grwm',
    label: 'GRWM / Beauty',
    emoji: '\u2728',
    color: 'var(--sky-4)',
    colorAccent: 'var(--sky-11)',
    bagCreationMethod: 'Manual curation from viral product lists + TikTok',
    cadence: '3-4x/week, spike around events (Valentine\'s, etc.)',
    hook: 'Stop screenshotting. Every product. One link.',
    message: "Found every product from this GRWM \u2014 saved you the scrolling",
    cta: 'Save the routine or build your own shelfie',
    shareTargets: [
      'TikTok \u2014 stitch/duet viral GRWM videos with "I found every product"',
      'r/Sephora, r/SkincareAddiction, r/MakeupAddiction comments',
      'YouTube GRWM video comments (Hyram, James Welsh)',
      'Instagram Reels comments on beauty creator posts',
    ],
    bags: [
      {
        id: 'grwm-1',
        title: "Valentine's GRWM Viral Products \u2014 Feb 2026",
        source: 'TikTok #grwm (157B+ views), Latination',
        whyHot: "Valentine's/Galentine's party content. Brands: Rhode Skin, Charlotte Tilbury, Tower 28, Kosas, Too Faced. Peak seasonal moment.",
        priority: 'high',
        links: [
          { label: 'TikTok #grwm', url: 'https://www.tiktok.com/discover/grwm' },
          { label: 'Latination trends', url: 'https://latination.com/the-viral-tiktok-trends-taking-over-february-2026/' },
        ],
        commentTemplates: [
          { platform: 'tiktok', template: '[Stitch first 3s of viral GRWM]\n"She used 8 products. I found all of them."\n[Show Teed bag on phone, scroll through items]\n"Every product. Every link. One page. Bio."' },
          { platform: 'reddit', template: "Put together all the viral Valentine's GRWM products in one bag \u2192 [LINK]. Every brand linked." },
        ],
      },
      {
        id: 'grwm-2',
        title: "TikTok's Top Shelf \u2014 12 Products Actually Selling",
        source: 'Who What Wear, TikTok Head of Beauty',
        whyHot: "Not just viral \u2014 actually selling. Biodance collagen mask, Beauty of Joseon rice sunscreen, Laneige lip mask, Gisou hair oil.",
        links: [
          { label: 'Who What Wear', url: 'https://www.whowhatwear.com/beauty/best-beauty-products-selling-tiktok-shop' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "TikTok's Head of Beauty shared the 12 products actually selling on TikTok Shop. Full bag \u2192 [LINK]" },
          { platform: 'tiktok', template: '"TikTok\'s own beauty team said these 12 products are actually selling. I put them all in one place." [show bag] "Link in bio."' },
        ],
      },
      {
        id: 'grwm-3',
        title: 'Skinimalism Routine \u2014 The "Less Is More" Shelfie',
        source: 'Cosmetify, MadameNoire, CORQ',
        whyHot: 'Jelly textures, multi-use products, dewy "glass skin." The anti-12-step routine. Trending hard in Q1 2026.',
        links: [
          { label: 'Cosmetify', url: 'https://www.cosmetify.com/blog/tik-tok-approved-beauty-products-you-need/' },
          { label: 'MadameNoire', url: 'https://madamenoire.com/1613925/best-beauty-products-2026/' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: "The skinimalism routine \u2014 fewer products, better results. Full bag \u2192 [LINK]" },
          { platform: 'tiktok', template: '"The anti-12-step routine. Three products. Glass skin." [show bag] "Link in bio."' },
        ],
      },
    ],
  },
  {
    id: 'hauls',
    label: 'Hauls / Tech / Desk',
    emoji: '\ud83d\udda5\ufe0f',
    color: 'var(--amber-4)',
    colorAccent: 'var(--amber-11)',
    bagCreationMethod: 'Curate from trending product lists + r/battlestations posts',
    cadence: '2-3x/week',
    hook: 'The full setup. Every product. One link.',
    message: "Built a bag with every item from this setup",
    cta: 'Save the setup or build your own',
    shareTargets: [
      'r/battlestations \u2014 comment on setup posts with "made a bag with all the gear"',
      'TikTok \u2014 original content showing the bag as a product list',
      'YouTube desk tour comments (MKBHD, Justin Tse, Setup Wars)',
      'r/TikTokMadeMeBuyIt or similar product discovery subs',
    ],
    bags: [
      {
        id: 'hauls-1',
        title: '$15 LED Galaxy Projector + Bedroom Glow-Up Kit',
        source: 'CJ Dropshipping, TikTok Shop data',
        whyHot: '10,000+ orders in 2 weeks from one viral clip. The breakout Q1 2026 TikTok product. Build a "bedroom glow-up" bag around it.',
        links: [
          { label: 'CJ Dropshipping', url: 'https://cjdropshipping.com/blogs/winning-products/TikTok-Viral-products-2026' },
        ],
        commentTemplates: [
          { platform: 'tiktok', template: '"That $15 galaxy projector that sold 10,000 in two weeks? I built the full bedroom glow-up bag." [show bag] "Link in bio."' },
          { platform: 'reddit', template: 'Built a bedroom glow-up bag around the viral $15 galaxy projector + the rest of the TikTok essentials \u2192 [LINK]' },
        ],
      },
      {
        id: 'hauls-2',
        title: '2026 Minimalist Desk Setup \u2014 Creator Edition',
        source: 'Hexcal, r/battlestations (5.2M members), Creative Bloq',
        whyHot: 'Standing desk + multi-device charger + ring light + ultra-wide monitor. The 2026 "flexible hub" desk that does Zoom/gaming/streaming.',
        links: [
          { label: 'Hexcal trends', url: 'https://www.hexcal.com/blogs/articles/desk-setups-2025-2026-trends-and-predictions' },
          { label: 'Creative Bloq', url: 'https://www.creativebloq.com/tech/the-ultimate-budget-work-from-home-setup-everything-a-creative-needs-in-2026' },
        ],
        commentTemplates: [
          { platform: 'reddit', template: 'Made a bag with every item from the 2026 minimalist creator desk setup \u2192 [LINK]. Standing desk, ultra-wide, the works.' },
          { platform: 'youtube', template: 'Full setup with every product linked in one place \u2192 [LINK]. No hunting through the description.' },
        ],
      },
      {
        id: 'hauls-3',
        title: 'TikTok Made Me Buy It \u2014 Feb 2026 Edition',
        source: 'Shopify TikTok trends, Top Down Trading, Eprolo',
        whyHot: 'Curate the actual top-selling TikTok Shop items for February: wax melting lamp, wireless chargers, jelly lip tints, oversized hoodies, tote bags.',
        links: [
          { label: 'Shopify trends', url: 'https://www.shopify.com/blog/tiktok-trends' },
          { label: 'Top Down Trading', url: 'https://www.topdowntrading.co.uk/blog/tiktok-made-me-buy-it-the-power-of-viral-shopping-in-2026.html' },
        ],
        commentTemplates: [
          { platform: 'tiktok', template: '"Everything TikTok made you buy this month \u2014 in one bag." [scroll through items] "Link in bio."' },
          { platform: 'reddit', template: 'Put together all the viral TikTok Shop products from February 2026 in one bag \u2192 [LINK]' },
        ],
      },
    ],
  },
];

const TIKTOK_SCRIPTS: TikTokScript[] = [
  {
    nicheId: 'golf',
    title: 'Best 3 Golf WITBs of February 2026',
    segments: [
      { timing: 'HOOK \u2014 0-3s', text: '"Three bags that broke the internet this month."' },
      { timing: 'BAG 1 \u2014 3-8s', text: '"Anthony Kim. First win in SIXTEEN years. No equipment deal.\nCallaway driver, TaylorMade irons, Bridgestone ball.\nThe comeback bag." [show flatlay/product images]' },
      { timing: 'BAG 2 \u2014 8-13s', text: '"Chris Gotterup. Back-to-back wins at the Phoenix Open.\nGaming Bridgestone 220 MBs \u2014 first new Bridgestone irons since 2019.\nThe breakout bag." [show products]' },
      { timing: 'BAG 3 \u2014 13-18s', text: '"Rory McIlroy changed SEVEN clubs for 2026.\nNew Qi4D driver, tried cavity backs, went back to blades.\nThe experiment bag." [show products]' },
      { timing: 'CTA \u2014 18-22s', text: '"All three bags \u2014 every club, every spec \u2014 linked in my bio.\nWhich setup would you game?" [text overlay: link in bio]' },
    ],
  },
  {
    nicheId: 'edc',
    title: 'Best 3 EDCs of February 2026',
    segments: [
      { timing: 'HOOK \u2014 0-3s', text: '"Three everyday carries that go way too hard."' },
      { timing: 'EDC 1 \u2014 3-8s', text: '"The blue collar winter carry. 19 years old.\nWork knife, hiking flashlight, leather wallet.\nNo flex, just function." [show flatlay]' },
      { timing: 'EDC 2 \u2014 8-13s', text: '"The minimalist titanium carry.\nEverything weighs less than your phone.\nButton-lock knife, carbon fiber wallet, mini flashlight." [show items]' },
      { timing: 'EDC 3 \u2014 13-18s', text: '"The gentleman\'s carry. Team pocket dump.\nField notebook, pen, watch, pocket square.\nClass in every pocket." [show items]' },
      { timing: 'CTA \u2014 18-22s', text: '"All three carries linked in my bio.\nWhat\'s in YOUR pockets?" [text overlay: link in bio]' },
    ],
  },
  {
    nicheId: 'grwm',
    title: 'Best 3 Beauty Routines of February 2026',
    segments: [
      { timing: 'HOOK \u2014 0-3s', text: '"Three routines TikTok can\'t stop buying from."' },
      { timing: 'ROUTINE 1 \u2014 3-8s', text: '"The Valentine\'s GRWM. Rhode lip case, Charlotte Tilbury flawless filter,\nTower 28 blush. The date night bag." [show products]' },
      { timing: 'ROUTINE 2 \u2014 8-13s', text: '"The Glass Skin routine. Biodance collagen mask,\nBeauty of Joseon sunscreen, Laneige lip mask.\nThree products. Insane results." [show products]' },
      { timing: 'ROUTINE 3 \u2014 13-18s', text: '"The \'Less Is More\' shelfie. Jelly tints that double as blush.\nOne serum. One moisturizer. Done.\nSkinimalism is winning." [show products]' },
      { timing: 'CTA \u2014 18-22s', text: '"All three routines \u2014 every product linked \u2014 in my bio.\nWhich one\'s your vibe?" [text overlay: link in bio]' },
    ],
  },
  {
    nicheId: 'hauls',
    title: 'Best 3 Setups of February 2026',
    segments: [
      { timing: 'HOOK \u2014 0-3s', text: '"Three setups that made me rethink my whole desk."' },
      { timing: 'SETUP 1 \u2014 3-8s', text: '"The bedroom glow-up. $15 galaxy projector \u2014\n10,000 orders in two weeks on TikTok Shop.\nLED strips, wax lamp, smart bulbs." [show setup]' },
      { timing: 'SETUP 2 \u2014 8-13s', text: '"The minimalist creator desk. Standing desk, ultra-wide,\nwireless charging pad, one cable tray.\nClean enough to film on." [show setup]' },
      { timing: 'SETUP 3 \u2014 13-18s', text: '"TikTok Made Me Buy It \u2014 February edition.\nWax melting lamp, wireless charger dock,\noversized hoodie, tote bag." [show products]' },
      { timing: 'CTA \u2014 18-22s', text: '"Every product from all three \u2014 linked in my bio.\nWhat\'s your February pickup?" [text overlay: link in bio]' },
    ],
  },
];

const CALENDAR: CalendarWeek[] = [
  {
    week: 1,
    title: 'Seed & Prep',
    phase: 'Build the foundation',
    tasks: [
      { day: 'Mon', category: 'golf', action: 'Create Anthony Kim WITB bag', platform: 'Teed', priority: 'urgent' },
      { day: 'Mon', category: 'golf', action: 'Create Gotterup Phoenix Open WITB bag', platform: 'Teed', priority: 'high' },
      { day: 'Tue', category: 'golf', action: 'Create Rory McIlroy 2026 WITB bag', platform: 'Teed', priority: 'high' },
      { day: 'Tue', category: 'grwm', action: "Create Valentine's GRWM bag", platform: 'Teed', priority: 'high' },
      { day: 'Wed', category: 'edc', action: 'Create Blue Collar Winter EDC bag', platform: 'Teed' },
      { day: 'Wed', category: 'edc', action: 'Create Minimalist Titanium EDC bag', platform: 'Teed' },
      { day: 'Thu', category: 'grwm', action: "Create TikTok's Top Shelf bag", platform: 'Teed' },
      { day: 'Thu', category: 'grwm', action: 'Create Skinimalism Routine bag', platform: 'Teed' },
      { day: 'Fri', category: 'hauls', action: 'Create Galaxy Projector Glow-Up bag', platform: 'Teed' },
      { day: 'Fri', category: 'hauls', action: 'Create Minimalist Desk Setup bag', platform: 'Teed' },
      { day: 'Fri', category: 'edc', action: "Create Gentleman's Gazette EDC bag", platform: 'Teed' },
      { day: 'Fri', category: 'hauls', action: 'Create TikTok Made Me Buy It bag', platform: 'Teed' },
    ],
  },
  {
    week: 2,
    title: 'Reddit Launch',
    phase: 'Start commenting where product lists are requested',
    tasks: [
      { day: 'Mon', category: 'golf', action: 'Comment on GolfWRX Anthony Kim WITB article', platform: 'GolfWRX', priority: 'urgent' },
      { day: 'Mon', category: 'golf', action: 'Comment on r/golf Anthony Kim threads', platform: 'Reddit' },
      { day: 'Tue', category: 'edc', action: 'Comment on 3 r/EDC flatlay posts', platform: 'Reddit' },
      { day: 'Tue', category: 'golf', action: 'Comment on GolfWRX Gotterup & Rory articles', platform: 'GolfWRX' },
      { day: 'Wed', category: 'grwm', action: 'Comment on r/Sephora product threads', platform: 'Reddit' },
      { day: 'Wed', category: 'hauls', action: 'Comment on r/battlestations setup posts', platform: 'Reddit' },
      { day: 'Thu', category: 'edc', action: 'Post original EDC bag as r/EDC content', platform: 'Reddit' },
      { day: 'Fri', category: 'all', action: 'Review engagement metrics, adjust tone', platform: 'All' },
    ],
  },
  {
    week: 3,
    title: 'YouTube + TikTok',
    phase: 'Expand to video platforms',
    tasks: [
      { day: 'Mon', category: 'golf', action: 'Comment on 3-5 fresh WITB YouTube videos', platform: 'YouTube' },
      { day: 'Mon', category: 'hauls', action: 'Comment on 3-5 desk tour YouTube videos', platform: 'YouTube' },
      { day: 'Tue', category: 'grwm', action: 'Publish first TikTok (stitch format)', platform: 'TikTok' },
      { day: 'Wed', category: 'golf', action: 'Publish Golf WITB TikTok script', platform: 'TikTok' },
      { day: 'Thu', category: 'edc', action: 'Publish EDC TikTok script', platform: 'TikTok' },
      { day: 'Thu', category: 'all', action: 'Create bags for any new Tour/event winners', platform: 'Teed' },
      { day: 'Fri', category: 'hauls', action: 'Publish Desk/Hauls TikTok script', platform: 'TikTok' },
    ],
  },
  {
    week: 4,
    title: 'Measure & Double Down',
    phase: 'Analyze and optimize',
    tasks: [
      { day: 'Mon', category: 'all', action: 'Analyze which niche drove most bag views/saves', platform: 'Analytics' },
      { day: 'Mon', category: 'all', action: 'Analyze which channel had best click-through', platform: 'Analytics' },
      { day: 'Tue', category: 'all', action: 'Double investment in top niche x channel combo', platform: 'All' },
      { day: 'Wed', category: 'all', action: 'Invite community power users to create bags', platform: 'Reddit/X' },
      { day: 'Thu', category: 'all', action: 'Plan March strategy based on learnings', platform: 'Internal' },
      { day: 'Fri', category: 'all', action: 'Create next month seed bag list', platform: 'Teed' },
    ],
  },
];

const METRICS_TARGETS = [
  { metric: 'Bags created (by team)', target: '50+', why: 'Platform density' },
  { metric: 'Bag views', target: '5,000+', why: 'Top of funnel' },
  { metric: 'Bag saves', target: '500+', why: 'Intent signal' },
  { metric: 'New signups', target: '100+', why: 'Conversion' },
  { metric: 'User-created bags', target: '20+', why: 'Flywheel starting' },
  { metric: 'Best channel CTR', target: 'Identify winner', why: 'Where to invest' },
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
  golf: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  edc: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  grwm: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
  hauls: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
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
