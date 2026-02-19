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
  Mail,
  MessageCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type NicheId = 'edc' | 'running' | 'beauty' | 'reviews' | 'productivity';
type TabId = 'playbook' | 'outreach' | 'calendar' | 'metrics' | 'workflow';
type BagStatus = 'pending' | 'created' | 'distributed';
type OutreachChannel = 'email' | 'instagram' | 'x' | 'youtube';

interface SeedBag {
  id: string;
  title: string;
  source: string;
  whyHot: string;
  links: { label: string; url: string }[];
  outreachTemplates: { channel: OutreachChannel; template: string }[];
  reachHow: string;
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

interface OutreachScript {
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
  distributionChecks: Record<string, Record<OutreachChannel, boolean>>;
  calendarChecks: Record<string, boolean>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NICHES: Niche[] = [
  {
    id: 'edc',
    label: 'EDC & Gear Dumps',
    emoji: '\ud83d\udd26',
    color: 'var(--grey-4)',
    colorAccent: 'var(--grey-11)',
    bagCreationMethod: 'Watch their pocket dump / EDC video, extract every item with brand + model',
    cadence: 'Weekly \u2014 EDC creators post pocket dumps constantly, r/EDC has daily posts',
    hook: 'Your entire carry, one shareable page',
    message: "Hey! I built a Teed page from your latest carry \u2014 every item linked with buy pages. Way cleaner than a description dump.",
    cta: 'Share it with your audience or build your own on Teed',
    shareTargets: [
      'Email (check YouTube About page \u2192 "Business inquiries" \u2192 View Email)',
      'Instagram DM (most EDC creators are responsive)',
      'X/Twitter DM (if DMs are open)',
      'YouTube comment on the video with the finished bag link',
    ],
    bags: [
      {
        id: 'edc-1',
        title: 'EXCESSORIZE ME \u2014 Tech & EDC Accessories',
        source: '1.6M subs \u00b7 Toronto, Canada \u00b7 Vincent Tse \u00b7 excessorize.me',
        whyHot: 'Largest non-firearm EDC channel on YouTube. Reviews tech accessories, bags, cases, and gear. Every video is a curated product showcase. Has his own storefront. Perfect Teed power user.',
        priority: 'urgent',
        reachHow: 'Email: hello@excessorize.me (verified). Also on Instagram @excessorize.me and X @excessorizeme.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@EXCESSORIZEME' },
          { label: 'Website', url: 'https://excessorize.me/' },
          { label: 'Instagram', url: 'https://instagram.com/excessorize.me' },
          { label: 'X/Twitter', url: 'https://x.com/excessorizeme' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your latest carry as a shareable product page\n\nHey Vincent \u2014 I\u2019m Brett, building Teed. I turned your latest EDC video into a single page where every item is linked with buy pages. Your audience always asks for links in the comments \u2014 this answers it in one click.\n\nHere\u2019s the page: [LINK]\n\nYou can claim it and customize it, or I can show you how to make your own in 2 minutes. No strings attached.\n\nEither way, love the channel. Just thought this might save your audience some time.\n\n\u2014 Brett" },
          { channel: 'instagram', template: "Hey Vincent! Built a Teed page from your latest carry \u2014 every item linked in one clean page. Thought your audience would dig it instead of hunting through descriptions \u2192 [LINK]" },
        ],
      },
      {
        id: 'edc-2',
        title: 'Best Damn EDC \u2014 EDC Weekly & Pocket Dumps',
        source: '419K subs \u00b7 Taylor Martin \u00b7 bestdamnedc.com',
        whyHot: 'Home of EDC Weekly \u2014 viewers submit pocket dumps to be featured. Community-driven format is perfect for Teed. Taylor is approachable and engages with the community.',
        priority: 'high',
        reachHow: 'Website contact form at bestdamnedc.com. Also active on Instagram @bestdamnedc.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@BestDamnEDC' },
          { label: 'Website', url: 'https://bestdamnedc.com/' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: EDC Weekly as shareable product pages\n\nHey Taylor \u2014 I\u2019m Brett, building Teed. Love EDC Weekly. I turned a recent episode into a shareable page where every item from the carry is linked.\n\nInstead of your viewers asking \"what\u2019s that knife?\" in the comments, they get one link with everything: [LINK]\n\nImagine if every EDC Weekly submission came with a Teed page \u2014 viewer submits carry + a Teed link, you feature both. Happy to show you how it works.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Every item from this carry in one page with buy links \u2192 [LINK]. No pausing to read descriptions." },
        ],
      },
      {
        id: 'edc-3',
        title: 'Maurice Moves \u2014 Cinematic EDC',
        source: '359K subs \u00b7 Cinematic pocket dump videos \u00b7 Growing fast',
        whyHot: 'Rapidly growing EDC channel with cinematic production. Known for finding the most efficient EDC possible. His audience is gear-obsessed and wants every link.',
        reachHow: 'Check YouTube About page for business email. Active on Instagram.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@MauriceMoves' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your EDC as a shareable product page\n\nHey \u2014 I\u2019m Brett, building Teed. I turned your latest pocket dump into a single page where every item is linked. Your videos are gorgeous but the product info is locked in timestamps \u2014 this gives your audience a reference they can save.\n\nHere\u2019s the page: [LINK]\n\nHappy to hand it over. No catch.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Full pocket dump with every item linked \u2192 [LINK]. One page your audience can bookmark." },
        ],
      },
      {
        id: 'edc-4',
        title: 'Maxlvledc \u2014 Compact & Modular EDC',
        source: '251K subs \u00b7 "No compromises" mantra \u00b7 DIY mods',
        whyHot: 'Niche within the niche \u2014 focuses on compact, modular setups with custom modifications. Highly engaged audience that wants exact product details. The modular philosophy aligns perfectly with Teed bags.',
        reachHow: 'Check YouTube About page for business email. Active on Instagram.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@Maxlvledc' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your modular carry as a shareable page\n\nHey \u2014 I\u2019m Brett. I turned your latest modular EDC video into a Teed page \u2014 every item linked, clean layout. Your audience is always asking for specs and links. This gives them one URL.\n\n[LINK]\n\nFree tool, no catch. Let me know what you think.\n\n\u2014 Brett" },
        ],
      },
      {
        id: 'edc-5',
        title: 'r/EDC Community \u2014 Pocket Dump Posts',
        source: '230K+ members \u00b7 Daily pocket dump posts \u00b7 Reddit',
        whyHot: 'The largest EDC community. Users already post photo + item lists. A Teed bag is literally the interactive version of every r/EDC post. Post example bags as a helpful tool, not promotion.',
        reachHow: 'Post directly to r/EDC with a Teed bag of your own carry. Contribute value first, explain the tool second.',
        links: [
          { label: 'r/EDC', url: 'https://reddit.com/r/EDC' },
          { label: 'r/knifeclub', url: 'https://reddit.com/r/knifeclub' },
          { label: 'EverydayCarry.com', url: 'https://everydaycarry.com/' },
        ],
        outreachTemplates: [
          { channel: 'youtube', template: "Just put my full EDC in a shareable page with buy links for everything \u2192 [LINK]. Made it with Teed \u2014 free tool for creating gear lists. Figured r/EDC would appreciate it." },
        ],
      },
    ],
  },
  {
    id: 'running',
    label: 'Running Shoes',
    emoji: '\ud83c\udfc3',
    color: 'var(--evergreen-4)',
    colorAccent: 'var(--evergreen-11)',
    bagCreationMethod: 'Watch their shoe roundup, extract every shoe with model name and use case',
    cadence: 'Bi-weekly \u2014 new shoe releases drive content, seasonal best-of lists',
    hook: 'Every shoe from the roundup, linked and organized, one page',
    message: "Hey! I built a Teed page from your latest shoe roundup \u2014 every shoe linked. Cleaner than a timestamp hunt.",
    cta: 'Share it with your audience or build your own on Teed',
    shareTargets: [
      'Email (running journalists often list business emails)',
      'Website contact form (theruntesters.com, believeintherun.com, doctorsofrunning.com)',
      'Instagram DM',
      'r/RunningShoeGeeks \u2014 share bags in relevant threads',
    ],
    bags: [
      {
        id: 'run-1',
        title: 'The Run Testers \u2014 Best Running Shoes Guides',
        source: 'Nick Harris-Fry & team \u00b7 theruntesters.com \u00b7 Running journalists',
        whyHot: 'THE running shoe review destination. Active Feb 2026 with guides for best overall, marathon, cushioned, carbon plate, beginner, Nike, Adidas, and Asics shoes. Each guide is literally a ranked product list. Nike Vomero Plus, Hoka Arahi 8, Asics Novablast 5 featured.',
        priority: 'urgent',
        reachHow: 'Contact page at theruntesters.com. Nick Harris-Fry also on Muck Rack (journalist profile). Team members write for Tom\'s Guide, Coach, Fit&Well, Expert Reviews.',
        links: [
          { label: 'Website', url: 'https://theruntesters.com/' },
          { label: 'Best Shoes Guide', url: 'https://theruntesters.com/running-shoes/the-best-running-shoes-to-buy/' },
          { label: 'Best Marathon Shoes', url: 'https://theruntesters.com/the-best-marathon-running-shoes/' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your shoe guides as interactive product pages\n\nHey Nick \u2014 I\u2019m Brett, building Teed. I turned your Best Running Shoes 2026 guide into a shareable page where every shoe is linked with buy pages. Your readers and viewers can save it and come back when they\u2019re ready to buy.\n\nHere\u2019s the page: [LINK]\n\nYou could embed these on theruntesters.com alongside your written guides. Each shoe gets its own card. Happy to show you how \u2014 takes 2 minutes per guide.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Every shoe from this roundup in one page with buy links \u2192 [LINK]. Save it for when you\u2019re ready to buy." },
        ],
      },
      {
        id: 'run-2',
        title: 'Believe in the Run \u2014 Road Running Shoes',
        source: '200K+ subs \u00b7 believeintherun.com \u00b7 No sponsorships',
        whyHot: 'Trusted running shoe reviews. Published ~40 preview videos from The Running Event covering 2026 releases. No sponsorships means the audience trusts every recommendation. Their best-of videos are product list goldmines.',
        priority: 'high',
        reachHow: 'Website contact form at believeintherun.com. Also host a podcast (good for warm intro).',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@BelieveintheRun' },
          { label: 'Website', url: 'https://believeintherun.com/' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your shoe previews as shareable product pages\n\nHey \u2014 I\u2019m Brett, building Teed. You published 40+ shoe previews from The Running Event \u2014 that\u2019s incredible coverage. I turned a selection into Teed pages where each shoe is linked with buy pages.\n\nHere\u2019s one: [LINK]\n\nImagine one Teed page per video \u2014 your audience saves the page, comes back when shoes drop. Happy to set them up for you.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Every shoe from this video in one clean page \u2192 [LINK]. No hunting through descriptions." },
        ],
      },
      {
        id: 'run-3',
        title: 'Doctors of Running \u2014 Scientific Shoe Reviews',
        source: 'Dr. Klein (DPT) \u00b7 doctorsofrunning.com \u00b7 Science-backed reviews',
        whyHot: 'Most scientific running shoe reviews on YouTube. Active Feb 2026 with Salomon Aero Glide 4 review. Also previewing Mizuno Hyperwarp Pure/Pro/Elite, Brooks 2026 lineup, and Topo Athletics redesigns. Their podcast interviews shoe scientists directly.',
        priority: 'high',
        reachHow: 'Website: doctorsofrunning.com. Blog has contact info. Professional background (DPT) means they respond to well-crafted emails.',
        links: [
          { label: 'Website', url: 'https://www.doctorsofrunning.com/' },
          { label: 'Feb 2026 Review', url: 'https://www.doctorsofrunning.com/2026/02/salomon-aero-glide-4-review-2026.html' },
          { label: 'Reviews Page', url: 'https://www.doctorsofrunning.com/p/reviews.html' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your shoe reviews as saveable product pages\n\nDr. Klein \u2014 I\u2019m Brett, building Teed. Your reviews are the most thorough in the running space. I turned your latest roundup into a page where each shoe links to your review AND the buy page.\n\nHere\u2019s the page: [LINK]\n\nYour audience could save these pages and reference them when shopping. Works great alongside your blog content. Happy to help set it up.\n\n\u2014 Brett" },
        ],
      },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty & GRWM',
    emoji: '\u2728',
    color: 'var(--copper-4)',
    colorAccent: 'var(--copper-11)',
    bagCreationMethod: 'Watch GRWM / routine / haul video, extract every product with brand + shade/variant',
    cadence: 'Weekly \u2014 beauty content is high-velocity, seasonal, product-heavy',
    hook: 'Every product from the routine, one page, every link',
    message: "Hey! I made a Teed page from your routine \u2014 every product linked. Your audience won\u2019t have to screenshot anymore.",
    cta: 'Share the link or build your own on Teed',
    shareTargets: [
      'Instagram DM (primary for beauty creators \u2014 they live on Instagram)',
      'Email via YouTube About page or website',
      'TikTok comment or DM',
      'r/Sephora, r/SkincareAddiction, r/MakeupAddiction threads',
    ],
    bags: [
      {
        id: 'beauty-1',
        title: 'Shea Whitney \u2014 Amazon Hauls & Favorites',
        source: '1.7M subs \u00b7 Amazon Influencer Program \u00b7 amazon.com/shop/sheawhitney',
        whyHot: 'Her videos ARE product lists \u2014 Amazon hauls, favorites, daily deals. Already has an Amazon Storefront with Fashion, Beauty, Organization, and Daily Deals lists. Teed would be a much cleaner, shareable presentation layer. Her Fashion list was updated in the last week.',
        priority: 'urgent',
        reachHow: 'Instagram @shea.whitney (verified from search results). Also check YouTube About page for business email.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@SheaWhitney' },
          { label: 'Amazon Storefront', url: 'https://www.amazon.com/shop/sheawhitney' },
          { label: 'Instagram', url: 'https://instagram.com/shea.whitney' },
        ],
        outreachTemplates: [
          { channel: 'instagram', template: "Hey Shea! I turned your latest Amazon haul into a Teed page \u2014 every product linked in one clean, shareable page. Way more polished than an Amazon list. Thought you\u2019d love it \u2192 [LINK]" },
          { channel: 'email', template: "Subject: Your Amazon hauls as beautiful shareable pages\n\nHey Shea \u2014 I\u2019m Brett, building Teed. Your Amazon hauls are essentially curated product lists, and I think Teed could be the perfect presentation layer for them.\n\nI turned your latest haul into a Teed page: [LINK]\n\nEvery product gets its own card with image and buy link. Your audience can save it and share it \u2014 way cleaner than scrolling an Amazon list or description links. And you can update it anytime.\n\nHappy to show you how to make your own. Takes about 2 minutes per haul.\n\n\u2014 Brett" },
        ],
      },
      {
        id: 'beauty-2',
        title: 'Alix Earle \u2014 GRWM & Drugstore Routine',
        source: 'Multi-platform \u00b7 TikTok @alixearle \u00b7 YouTube \u00b7 Gen Z icon',
        whyHot: 'The "Alix Earle effect" drives instant sellouts. Active 2026: Updated drugstore routine (L\u2019Or\u00e9al Lumi Glotion, NYX Mechanical Eyeliner, NYX liners), Pantene partnership, and entering her "founder era." Her GRWM videos list 8-15 products each. Massive viral potential.',
        priority: 'high',
        reachHow: 'This is a reach play \u2014 she has management. Best approach: Instagram DM @alix_earle or through her management team. Don\u2019t expect a reply, but the bag itself generates value as shareable content.',
        links: [
          { label: 'TikTok', url: 'https://www.tiktok.com/@alixearle' },
          { label: 'YouTube', url: 'https://youtube.com/@AlixEarle' },
          { label: 'Instagram', url: 'https://instagram.com/alix_earle' },
        ],
        outreachTemplates: [
          { channel: 'instagram', template: "Turned your GRWM routine into a Teed page \u2014 every product linked in one place. Your audience always asks for the full list \u2192 [LINK]" },
          { channel: 'youtube', template: "Every product from this GRWM in one shareable page \u2192 [LINK]. Save it instead of screenshotting." },
        ],
      },
      {
        id: 'beauty-3',
        title: 'NikkieTutorials \u2014 Makeup Tutorials & Routines',
        source: '14.1M subs \u00b7 4th largest beauty channel \u00b7 Nimya brand founder',
        whyHot: 'Massive reach. Her routine videos feature 10-15+ products. Launched Nimya (own beauty brand) and has OFRA collab. Her Coachella GRWM and routine content is product-list gold. Even a YouTube comment with a Teed bag link gets visibility from her audience size.',
        reachHow: 'Management team via nikkietutorials.com. This is a reach play \u2014 focus on making the bag perfect and sharing it via YouTube comments and X. The bag itself becomes content.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@NikkieTutorials' },
          { label: 'Website', url: 'https://www.nikkietutorials.com/' },
          { label: 'Instagram', url: 'https://instagram.com/nikkietutorials' },
        ],
        outreachTemplates: [
          { channel: 'youtube', template: "Every product from this tutorial in one shareable page \u2192 [LINK]. No pausing to write them down." },
          { channel: 'instagram', template: "Made a Teed page with every product from your latest routine \u2014 one clean page your audience can save \u2192 [LINK]" },
        ],
      },
      {
        id: 'beauty-4',
        title: 'Kaeli Mae \u2014 Aesthetic Routines & Amazon Finds',
        source: '2.3M subs \u00b7 Lifestyle creator \u00b7 Aesthetic routines + Amazon finds',
        whyHot: 'Her content is visually perfect and product-heavy \u2014 aesthetic routines, organizing content, Amazon finds. The audience demographic buys everything she features. More accessible than Alix Earle for outreach.',
        priority: 'high',
        reachHow: 'Check YouTube About page for business email. Active on Instagram.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@KaeliMae' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your aesthetic routines as shareable product pages\n\nHey Kaeli \u2014 I\u2019m Brett, building Teed. Your routines and Amazon finds videos are essentially curated product lists, and they\u2019re beautiful. I turned one into a Teed page: [LINK]\n\nYour audience can save it and share it instead of screenshotting. And the aesthetic matches your brand perfectly.\n\nHappy to show you how. Takes 2 minutes per video.\n\n\u2014 Brett" },
          { channel: 'instagram', template: "Hey! Built a Teed page from your latest routine \u2014 every product linked in one clean page. Thought it\u2019d match your aesthetic perfectly \u2192 [LINK]" },
        ],
      },
    ],
  },
  {
    id: 'reviews',
    label: 'Product Reviews & Roundups',
    emoji: '\ud83c\udfc6',
    color: 'var(--amber-4)',
    colorAccent: 'var(--amber-11)',
    bagCreationMethod: 'Watch their comparison / roundup, extract every product tested with verdict',
    cadence: 'Bi-weekly \u2014 roundup creators have regular posting schedules and seasonal best-of lists',
    hook: 'Every product tested in the video, ranked, one page',
    message: "Hey! Built a Teed page from your roundup \u2014 every product ranked with buy links. Your viewers can save and share it.",
    cta: 'Share it or build your own curations on Teed',
    shareTargets: [
      'Email (product review channels often list business emails)',
      'Website contact form (project-farm.com, vacuumwars.com, hardwarecanucks.com)',
      'X/Twitter DM (tech reviewers are active on X)',
      'YouTube comment on the video with the finished bag link',
    ],
    bags: [
      {
        id: 'rev-1',
        title: 'Project Farm \u2014 Head-to-Head Product Testing',
        source: '3.75M subs \u00b7 project-farm.com \u00b7 No sponsorships, purchases all products',
        whyHot: 'Tests 5-12 products head-to-head with measurable data. Zero sponsorships \u2014 buys everything at retail. His audience WANTS the ranked product list. "Favorites Tested" page on his website already lists top picks. A Teed bag is the interactive version of every video.',
        priority: 'urgent',
        reachHow: 'Website: project-farm.com (has contact form and merchandise store). Very community-focused \u2014 funded by viewer donations. A value-first pitch will resonate.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@ProjectFarm' },
          { label: 'Website', url: 'https://project-farm.com/' },
          { label: 'Favorites Tested', url: 'https://project-farm.com/pages/project-farm-favorites' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your product rankings as shareable pages\n\nHey Todd \u2014 I\u2019m Brett, building Teed. Your head-to-head tests are gold \u2014 but the rankings are locked in a video. I turned one of your tests into a Teed page where every product is ranked and linked.\n\nHere\u2019s the page: [LINK]\n\nYour audience can save it and come back when they\u2019re ready to buy. Think of it as an interactive version of your Favorites Tested page. Free tool, no catch.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Every product tested in this video, ranked with buy links \u2192 [LINK]. Your audience can save the list." },
        ],
      },
      {
        id: 'rev-2',
        title: 'Vacuum Wars \u2014 Robot Vacuum Rankings',
        source: 'vacuumwars.com \u00b7 8+ years testing \u00b7 No sponsorships \u00b7 150+ models benchmarked',
        whyHot: 'THE robot vacuum authority. Active Feb 2026 with tiered guides: under $300, $300-600, $600-1K, $1K-1.3K, $1.3K-1.6K, and $1.6K+. Each guide IS a ranked product list. No free samples, no sponsorships. Roborock Qrevo CurvX and Eufy E25 Omni featured in latest rankings.',
        priority: 'high',
        reachHow: 'Website: vacuumwars.com (has contact info). Christopher White is responsive to community. Email via website or YouTube About page.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@VacuumWars' },
          { label: 'Website', url: 'https://vacuumwars.com/' },
          { label: 'Top 20 Robots', url: 'https://vacuumwars.com/vacuum-wars-best-robot-vacuums/' },
          { label: 'Under $300', url: 'https://vacuumwars.com/best-budget-robot-vacuum/' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your vacuum rankings as interactive product pages\n\nHey Christopher \u2014 I\u2019m Brett, building Teed. Your tiered robot vacuum rankings are the most trusted resource online. I turned your Top 20 into a Teed page where each vacuum links to its buy page.\n\nHere\u2019s the page: [LINK]\n\nYou could embed one per price tier on vacuumwars.com. Your readers save the page and come back when ready to buy. Free tool \u2014 thought it\u2019d be a natural fit.\n\n\u2014 Brett" },
          { channel: 'youtube', template: "Every vacuum from this ranking in one page with buy links \u2192 [LINK]. Save it for when you\u2019re ready to buy." },
        ],
      },
      {
        id: 'rev-3',
        title: 'Hardware Canucks \u2014 Tech Reviews & Desk Setups',
        source: 'hardwarecanucks.com \u00b7 Dmitry Novoselov \u00b7 PC hardware + desk setups',
        whyHot: 'Canadian tech channel known for ultra-clean desk setups and hardware reviews. Every setup tour is a product list. Gaming mice, keyboards, monitors, cases. Website has its own content platform. Active on X and Instagram.',
        reachHow: 'Website: hardwarecanucks.com. X: @hardwarecanucks. Instagram: @hardwarecanucks. Check YouTube About page for business email.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@HardwareCanucks' },
          { label: 'Website', url: 'https://hardwarecanucks.com/' },
          { label: 'X/Twitter', url: 'https://x.com/hardwarecanucks' },
          { label: 'Instagram', url: 'https://instagram.com/hardwarecanucks' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your desk setups as shareable product pages\n\nHey Dmitry \u2014 I\u2019m Brett, building Teed. Your setup tours are the cleanest on YouTube \u2014 and every one is a product list. I turned your latest into a page where every item is linked.\n\nHere\u2019s the page: [LINK]\n\nYour audience can save it instead of pausing the video. Works great embedded on hardwarecanucks.com too. Free tool, happy to show you.\n\n\u2014 Brett" },
          { channel: 'x', template: "Hey @hardwarecanucks \u2014 turned your latest setup into a Teed page. Every product linked in one clean page. Thought your audience would save this \u2192 [LINK]" },
        ],
      },
      {
        id: 'rev-4',
        title: 'Justice Buys \u2014 Amazon Product Reviews',
        source: '1.9M subs \u00b7 Amazon Finds & Product Reviews',
        whyHot: 'One of the biggest Amazon product review channels. His content is literally "here are products, here are links." The Teed bag format is the clean, shareable version of his video descriptions.',
        reachHow: 'Check YouTube About page for business email. Large channel = likely has management.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@JusticeBuys' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your Amazon finds as shareable product pages\n\nHey \u2014 I\u2019m Brett, building Teed. Your Amazon review videos are product lists that people want to save. I turned one into a Teed page where every item is linked.\n\n[LINK]\n\nCleaner than affiliate dumps in descriptions. Your audience can share the whole list with one link. Happy to set more up.\n\n\u2014 Brett" },
        ],
      },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity & Tools',
    emoji: '\ud83d\udcdd',
    color: 'var(--sky-4)',
    colorAccent: 'var(--sky-11)',
    bagCreationMethod: 'Watch their "tools I use" or "best tools" video, extract every tool/app with use case',
    cadence: 'Monthly \u2014 these creators post tool lists less frequently but with very high engagement',
    hook: 'Every tool from the video, one shareable page',
    message: "Hey! Built a Teed page from your tool recommendations. Every tool linked. Your audience can save it instead of rewatching.",
    cta: 'Share it or build curations for your own recommendations',
    shareTargets: [
      'Email (productivity creators are business-minded and responsive to tools)',
      'X/Twitter DM (productivity creators are very active on X)',
      'Website contact form (aliabdaal.com, thomasjfrank.com, keepproductive.com)',
      'r/productivity, r/Notion, r/SideProject threads',
    ],
    bags: [
      {
        id: 'prod-1',
        title: 'Keep Productive \u2014 Tool Finder & App Reviews',
        source: 'Francesco D\u2019Alessio \u00b7 330K+ subs \u00b7 keepproductive.com \u00b7 Tool Finder co-founder',
        whyHot: 'His ENTIRE channel is dedicated to finding productivity tools. Co-founded Tool Finder (750+ reviewed apps). Publishes on Substack at keepproductive.substack.com. His audience exists to find tools \u2014 Teed bags are the shareable version of his recommendations.',
        priority: 'urgent',
        reachHow: 'Website: keepproductive.com. Substack: keepproductive.substack.com. Also co-founder of Tool Finder and Bento. Business-minded \u2014 will understand the value prop immediately.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@keepproductive' },
          { label: 'Website', url: 'https://keepproductive.com/' },
          { label: 'Substack', url: 'https://keepproductive.substack.com/' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Tool Finder as Teed pages \u2014 shareable tool lists\n\nHey Francesco \u2014 I\u2019m Brett, building Teed. I think there\u2019s a natural overlap between what you\u2019re doing with Tool Finder/Keep Productive and what Teed does. We help people create shareable product/tool pages.\n\nI turned one of your tool roundup videos into a Teed page: [LINK]\n\nEvery tool gets a card with your description and link. Your audience can save and share the whole list. Imagine one per video, or embedded on keepproductive.com.\n\nWould love to chat about this. I think it could be a great fit.\n\n\u2014 Brett" },
          { channel: 'x', template: "Hey Francesco \u2014 made a Teed page from your latest tool roundup. Every app linked in one page. Like Tool Finder but shareable and public \u2192 [LINK]" },
        ],
      },
      {
        id: 'prod-2',
        title: 'Ali Abdaal \u2014 Productivity Tools & Systems',
        source: '5M+ subs \u00b7 aliabdaal.com \u00b7 Spark 2026 summit \u00b7 Todoist + Notion user',
        whyHot: 'His "tools I use" and "I tried X productivity tools" videos get millions of views. Hosted Spark 2026 (productivity summit). Uses Todoist, Notion, Loom. Already monetizes through affiliates and Skillshare \u2014 Teed is a better presentation layer than his current link pages.',
        priority: 'high',
        reachHow: 'Website: aliabdaal.com (has Tools & Tech page and contact info). X: @aliabdaal. Large team \u2014 email the business address from YouTube About page.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@aliabdaal' },
          { label: 'Website', url: 'https://aliabdaal.com/' },
          { label: 'Tools & Tech', url: 'https://aliabdaal.com/tech/' },
          { label: 'X/Twitter', url: 'https://x.com/aliabdaal' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Your tool recommendations as shareable pages\n\nHey Ali \u2014 I\u2019m Brett, building Teed. I turned your productivity tools recommendations into a shareable page where every tool is linked. Way cleaner than a Notion doc or affiliate page for sharing with your audience.\n\n[LINK]\n\nYou could use Teed pages alongside your videos \u2014 one page per video, every tool linked. Your audience saves the page instead of rewatching.\n\nWould love to show you. Takes 2 minutes per video.\n\n\u2014 Brett" },
          { channel: 'x', template: "Hey @aliabdaal \u2014 turned your productivity tools into a Teed page. Every tool linked in one shareable page. Cleaner than a Notion doc for your audience \u2192 [LINK]" },
        ],
      },
      {
        id: 'prod-3',
        title: 'Thomas Frank \u2014 Notion Templates & Productivity',
        source: '2.9M subs \u00b7 thomasjfrank.com \u00b7 Notion expert \u00b7 $100K/mo templates',
        whyHot: 'His audience buys tools and templates. World\u2019s largest Notion education channel (Thomas Frank Explains, 230K+ subs). Makes $100K/month selling Notion templates. Would immediately understand the value of Teed bags for tool recommendations.',
        reachHow: 'Website: thomasjfrank.com. X: @TomFrankly. Business-minded \u2014 approach as a tool partnership, not a favor.',
        links: [
          { label: 'YouTube', url: 'https://youtube.com/@ThomasFrankExplains' },
          { label: 'Website', url: 'https://thomasjfrank.com/' },
          { label: 'X/Twitter', url: 'https://x.com/TomFrankly' },
        ],
        outreachTemplates: [
          { channel: 'email', template: "Subject: Notion meets shareable product pages\n\nHey Thomas \u2014 I\u2019m Brett, building Teed. You know Notion better than anyone. Teed is like a public, shareable Notion database purpose-built for product/tool lists. Each item gets a card with your notes, a link, and an image.\n\nI turned your tool recommendations into a Teed page: [LINK]\n\nYou could embed these on thomasjfrank.com or link from video descriptions. One page per video, always up to date.\n\nWould love your take on it.\n\n\u2014 Brett" },
          { channel: 'x', template: "Hey @TomFrankly \u2014 made a Teed page of your recommended tools. Like a public Notion database but purpose-built for product lists \u2192 [LINK]" },
        ],
      },
    ],
  },
];

const OUTREACH_SCRIPTS: OutreachScript[] = [
  {
    nicheId: 'edc',
    title: 'Email: EDC / Gear Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your [latest carry / pocket dump] as a shareable product page' },
      { timing: 'OPEN', text: "Hey [name]! I'm Brett, building Teed \u2014 a free tool that turns product lists into clean, shareable pages. I watched your [video title] and put every item into a single page your audience can save and share." },
      { timing: 'VALUE', text: "Instead of your viewers hunting through timestamps or the description, they get one link with every item. You can embed it anywhere, and update it when you swap gear." },
      { timing: 'ASK', text: "Here's the page I made: [LINK]\n\nIf you dig it, you can claim it and customize it. Or I can show you how to make your own in 2 minutes. No strings attached." },
      { timing: 'CLOSE', text: "Either way, keep making great content. Just thought this might save your audience (and your DMs) some time.\n\n\u2014 Brett" },
    ],
  },
  {
    nicheId: 'running',
    title: 'Email: Running Shoe Reviewer',
    segments: [
      { timing: 'SUBJECT', text: 'Your shoe roundup as a saveable product page' },
      { timing: 'OPEN', text: "Hey [name]! I'm Brett, building Teed. I turned your [video/article title] into a single page where every shoe is linked with buy pages. Your viewers always ask \"which ones?\" in the comments \u2014 this answers it." },
      { timing: 'VALUE', text: "Each shoe gets its own card with the image, your verdict, and a buy link. Way cleaner than a description full of affiliate links. And when new shoes drop, you update one place." },
      { timing: 'ASK', text: "Here's what I made: [LINK]\n\nHappy to hand it over to you to own. Or show you how to make your own for every video. Free tool, no catch." },
      { timing: 'CLOSE', text: "Love your reviews \u2014 just thought this could save your audience some time.\n\n\u2014 Brett" },
    ],
  },
  {
    nicheId: 'beauty',
    title: 'Email: Beauty / GRWM Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Every product from your GRWM \u2014 one page, zero screenshots' },
      { timing: 'OPEN', text: "Hey [name]! I'm Brett. I watch your content and noticed your audience always asks for the full product list. So I built one \u2014 every product from your [video title] in one shareable page." },
      { timing: 'VALUE', text: "Your followers can save it instead of screenshotting. Each product has the brand, shade, and buy link. You can add notes like \"my holy grail\" or \"only for oily skin.\" It's like a permanent version of your video description." },
      { timing: 'ASK', text: "Here it is: [LINK]\n\nYou can claim it and make it yours, or I can walk you through making your own. Takes about 2 minutes per routine." },
      { timing: 'CLOSE', text: "No pressure at all. Just thought it'd help your audience find everything without DMing you.\n\n\u2014 Brett" },
    ],
  },
  {
    nicheId: 'reviews',
    title: 'Email: Product Reviewer / Roundup Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your product rankings as a shareable page' },
      { timing: 'OPEN', text: "Hey [name]! I'm Brett, building Teed. I turned your [video title] into a ranked product page where every item is linked. Your viewers can save and share it." },
      { timing: 'VALUE', text: "Your rankings are gold \u2014 but they're locked in a video. This gives your audience a reference they can bookmark, share, and come back to. You can update it when you retest products." },
      { timing: 'ASK', text: "Here's the page: [LINK]\n\nHappy to hand it over. Or show you how to make one for every video. Free tool, built for exactly this use case." },
      { timing: 'CLOSE', text: "Appreciate the thorough testing you do. Just thought this could extend the shelf life of your reviews.\n\n\u2014 Brett" },
    ],
  },
  {
    nicheId: 'productivity',
    title: 'Email: Productivity / Tools Creator',
    segments: [
      { timing: 'SUBJECT', text: 'Your tool recommendations as a shareable page' },
      { timing: 'OPEN', text: "Hey [name]! I'm Brett. Watched your [video title] and turned every tool you recommended into a single shareable page. Your audience can save it instead of rewatching the video." },
      { timing: 'VALUE', text: "Think of it like a public Notion page but purpose-built for product/tool lists. Each item gets a card with your notes, a link, and an image. You update one place and it's current everywhere." },
      { timing: 'ASK', text: "Here's what I made: [LINK]\n\nYou can claim it, customize it, embed it on your site. Or I can show you how to make your own in a few minutes." },
      { timing: 'CLOSE', text: "Big fan of your work. Just thought this tool would click with how you share recommendations.\n\n\u2014 Brett" },
    ],
  },
];

const CALENDAR: CalendarWeek[] = [
  {
    week: 1,
    title: 'Build Bags',
    phase: 'Create Teed bags from creator videos before reaching out',
    tasks: [
      { day: 'Mon', category: 'edc', action: 'Build bag from EXCESSORIZE ME latest EDC video', platform: 'Teed', priority: 'urgent' },
      { day: 'Mon', category: 'edc', action: 'Build bag from Best Damn EDC latest EDC Weekly', platform: 'Teed', priority: 'high' },
      { day: 'Tue', category: 'running', action: 'Build bag from The Run Testers "Best Running Shoes 2026" guide', platform: 'Teed', priority: 'urgent' },
      { day: 'Tue', category: 'running', action: 'Build bag from Doctors of Running latest review', platform: 'Teed', priority: 'high' },
      { day: 'Wed', category: 'beauty', action: 'Build bag from Shea Whitney latest Amazon haul', platform: 'Teed', priority: 'urgent' },
      { day: 'Wed', category: 'beauty', action: 'Build bag from Kaeli Mae latest routine video', platform: 'Teed', priority: 'high' },
      { day: 'Thu', category: 'reviews', action: 'Build bag from Project Farm latest head-to-head test', platform: 'Teed', priority: 'urgent' },
      { day: 'Thu', category: 'reviews', action: 'Build bag from Vacuum Wars Feb 2026 Top 20 rankings', platform: 'Teed', priority: 'high' },
      { day: 'Fri', category: 'productivity', action: 'Build bag from Keep Productive latest tool roundup', platform: 'Teed', priority: 'urgent' },
      { day: 'Fri', category: 'all', action: 'QA all bags \u2014 every link works, images load, descriptions clean', platform: 'Teed' },
    ],
  },
  {
    week: 2,
    title: 'Outreach Wave 1 \u2014 High Priority',
    phase: 'Email/DM top-priority creators with finished bags',
    tasks: [
      { day: 'Mon', category: 'edc', action: 'Email EXCESSORIZE ME (hello@excessorize.me) with bag link', platform: 'Email', priority: 'urgent' },
      { day: 'Mon', category: 'productivity', action: 'Email Keep Productive (via keepproductive.com) with bag link', platform: 'Email', priority: 'urgent' },
      { day: 'Tue', category: 'running', action: 'Email The Run Testers (via theruntesters.com) with bag link', platform: 'Email', priority: 'urgent' },
      { day: 'Tue', category: 'beauty', action: 'Instagram DM Shea Whitney (@shea.whitney) with bag link', platform: 'Instagram', priority: 'urgent' },
      { day: 'Wed', category: 'reviews', action: 'Email Project Farm (via project-farm.com) with bag link', platform: 'Email', priority: 'urgent' },
      { day: 'Wed', category: 'reviews', action: 'Email Vacuum Wars (via vacuumwars.com) with bag link', platform: 'Email', priority: 'high' },
      { day: 'Thu', category: 'edc', action: 'Post own EDC bag to r/EDC as value-first content', platform: 'Reddit' },
      { day: 'Thu', category: 'all', action: 'Comment on target creator videos with bag links (YouTube)', platform: 'YouTube' },
      { day: 'Fri', category: 'all', action: 'Track responses \u2014 who opened, replied, viewed the bag', platform: 'Analytics' },
    ],
  },
  {
    week: 3,
    title: 'Outreach Wave 2 + Follow-ups',
    phase: 'Follow up on Wave 1, DM remaining creators',
    tasks: [
      { day: 'Mon', category: 'all', action: 'Follow up with Wave 1 non-responders (gentle nudge, once only)', platform: 'Email' },
      { day: 'Mon', category: 'productivity', action: 'Email Ali Abdaal (via aliabdaal.com) with bag link', platform: 'Email', priority: 'high' },
      { day: 'Tue', category: 'running', action: 'Email Believe in the Run and Doctors of Running with bags', platform: 'Email', priority: 'high' },
      { day: 'Tue', category: 'reviews', action: 'DM Hardware Canucks on X (@hardwarecanucks) with bag link', platform: 'X' },
      { day: 'Wed', category: 'beauty', action: 'Instagram DM Kaeli Mae with bag link', platform: 'Instagram', priority: 'high' },
      { day: 'Wed', category: 'productivity', action: 'DM Thomas Frank on X (@TomFrankly) with bag link', platform: 'X' },
      { day: 'Thu', category: 'edc', action: 'Email Maurice Moves and Maxlvledc with bags', platform: 'Email' },
      { day: 'Thu', category: 'beauty', action: 'Comment on Alix Earle + NikkieTutorials videos with bag links', platform: 'YouTube' },
      { day: 'Fri', category: 'all', action: 'Research next batch of creators using web search', platform: 'Research' },
    ],
  },
  {
    week: 4,
    title: 'Analyze + Refresh Pipeline',
    phase: 'Measure results, find new creators, plan Month 2',
    tasks: [
      { day: 'Mon', category: 'all', action: 'Tally results: replies, bag views, signups, creator adoptions', platform: 'Analytics' },
      { day: 'Mon', category: 'all', action: 'Identify which vertical had best response rate', platform: 'Analytics' },
      { day: 'Tue', category: 'all', action: 'Search for new creators in best-performing vertical', platform: 'Research' },
      { day: 'Wed', category: 'all', action: 'Build bags from new creator videos', platform: 'Teed' },
      { day: 'Thu', category: 'all', action: 'Update this strategy page with new targets', platform: 'Admin' },
      { day: 'Fri', category: 'all', action: 'Plan Month 2 \u2014 double down on best vertical, drop worst', platform: 'Internal' },
    ],
  },
];

const METRICS_TARGETS = [
  { metric: 'Creator bags built', target: '18', why: 'One per creator target in the list' },
  { metric: 'Outreach emails/DMs sent', target: '18', why: 'Every creator gets a personalized message' },
  { metric: 'Response rate', target: '25%+', why: '~5 replies from 18 messages is strong for cold outreach' },
  { metric: 'Creators who view their bag', target: '10+', why: 'Proves the value prop resonates' },
  { metric: 'Creator signups', target: '2-3', why: 'Even one adoption is a massive win for credibility' },
  { metric: 'Best-performing vertical', target: 'Identify winner', why: 'Double down next month on what works' },
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

const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: 'Email',
  instagram: 'Instagram',
  x: 'X / Twitter',
  youtube: 'YT Comment',
};

const NICHE_COLORS: Record<NicheId, { bg: string; text: string; border: string }> = {
  edc: { bg: 'bg-slate-50 dark:bg-slate-950/30', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800' },
  running: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  beauty: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  reviews: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  productivity: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
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

  const toggleDistribution = (bagId: string, channel: OutreachChannel) => {
    const bagChecks = state.distributionChecks[bagId] || { email: false, instagram: false, x: false, youtube: false };
    persistState({
      ...state,
      distributionChecks: {
        ...state.distributionChecks,
        [bagId]: { ...bagChecks, [channel]: !bagChecks[channel] },
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
    { id: 'outreach', label: 'Outreach', icon: <Mail className="w-4 h-4" /> },
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

          {/* How to reach creators */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">How to reach creators</p>
            <ul className="space-y-1">
              {niche.shareTargets.map((t, i) => (
                <li key={i} className="text-sm text-[var(--text-primary)]">&bull; {t}</li>
              ))}
            </ul>
          </div>

          {/* Creator bags */}
          <div className="space-y-3">
            {niche.bags.map((bag) => {
              const isExpanded = expandedBags.has(bag.id);
              const bagDistro = state.distributionChecks[bag.id] || { email: false, instagram: false, x: false, youtube: false };

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
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Why they&apos;re a great target</p>
                        <p className="text-sm text-[var(--text-primary)]">{bag.whyHot}</p>
                      </div>

                      {/* How to reach them */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">
                          <MessageCircle className="w-3 h-3 inline mr-1" />
                          How to reach them
                        </p>
                        <p className="text-sm text-[var(--text-primary)]">{bag.reachHow}</p>
                      </div>

                      {/* Links */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Creator links</p>
                        <div className="flex flex-wrap gap-2">
                          {bag.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] transition-colors">
                              <ExternalLink className="w-3 h-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Outreach checklist */}
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Outreach status</p>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(CHANNEL_LABELS) as OutreachChannel[]).map((ch) => (
                            <button
                              key={ch}
                              onClick={() => toggleDistribution(bag.id, ch)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                bagDistro[ch]
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                  : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                              }`}
                            >
                              {bagDistro[ch] ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                              {CHANNEL_LABELS[ch]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Outreach templates */}
                      {bag.outreachTemplates.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Outreach templates</p>
                          <div className="space-y-2">
                            {bag.outreachTemplates.map((ct, i) => (
                              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--grey-4)] text-[var(--grey-11)] uppercase">{ct.channel}</span>
                                <p className="text-sm text-[var(--text-primary)] flex-1 whitespace-pre-wrap">{ct.template}</p>
                                <CopyButton text={ct.template} id={`${bag.id}-${ct.channel}-${i}`} />
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

  // ─── Tab: Outreach ──────────────────────────────────────────────────────────

  const renderOutreach = () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Email and DM templates per vertical. Customize with the creator&apos;s name, video title, and your Teed bag link. Always build the bag FIRST, then reach out.
      </p>
      {OUTREACH_SCRIPTS.map((script) => {
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
                  <p className="text-xs text-[var(--text-secondary)]">{niche.label}</p>
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
                    <span className="shrink-0 w-20 text-xs font-mono font-medium text-[var(--text-secondary)] pt-0.5">{seg.timing}</span>
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{seg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* General outreach tips */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 bg-[var(--surface)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Outreach Rules</h3>
          <ul className="space-y-2 text-sm text-[var(--text-primary)]">
            <li>&bull; <strong>Always build the bag FIRST.</strong> You&apos;re giving, not asking. Lead with the finished product.</li>
            <li>&bull; <strong>YouTube has no DMs.</strong> Use email (YouTube About &rarr; Business Inquiries &rarr; View Email), Instagram DM, or X DM.</li>
            <li>&bull; <strong>Keep it short.</strong> Creators get hundreds of messages. 4-5 sentences max for DMs, 6-8 for email.</li>
            <li>&bull; <strong>One follow-up max.</strong> If they don&apos;t reply after one gentle nudge, move on. The bag still has value as content.</li>
            <li>&bull; <strong>Personalize every message.</strong> Reference their specific video/content. Generic outreach gets ignored.</li>
            <li>&bull; <strong>The bag IS the pitch.</strong> Don&apos;t explain Teed in abstract. Show them their content as a Teed page.</li>
          </ul>
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
            <p className="text-xs text-sky-600 dark:text-sky-400 mb-1">Outreach Sent</p>
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
          <h3 className="font-bold text-[var(--text-primary)] mb-3">The Strategy</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Every product video, every Reddit pocket dump, every GRWM, every desk tour has the same problem:
            <strong className="text-[var(--text-primary)]"> the audience wants the product list, and it&apos;s scattered across timestamps, comments, and affiliate link dumps.</strong>
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">
            The play: <strong className="text-[var(--text-primary)]">build the bag first, then show it to the creator.</strong> You&apos;re not asking for anything &mdash;
            you&apos;re giving them a finished product their audience already wants. The bag is the pitch.
            If even one creator with 100K+ subs adopts Teed, their audience discovers the tool organically.
          </p>
        </div>
      </div>
    );
  };

  // ─── Tab: Workflow ─────────────────────────────────────────────────────────

  const WORKFLOW_STEPS = [
    {
      step: 1,
      title: 'Find the Video',
      icon: <Globe className="w-5 h-5" />,
      description: 'Identify a recent video from the target creator that IS a product list.',
      details: [
        'Look for: setup tours, shoe roundups, GRWM, haul videos, "tools I use," pocket dumps, product rankings',
        'Prioritize videos from the last 2-4 weeks (fresh content = more engagement)',
        'Check the comments for "what is that?" and "link?" \u2014 those confirm demand',
        'The more items in the video, the better the Teed bag will be (aim for 5-15 products)',
      ],
    },
    {
      step: 2,
      title: 'Build the Bag',
      icon: <Package className="w-5 h-5" />,
      description: 'Create the Teed bag with every product from the video.',
      details: [
        'Watch the video and list every product: brand, model, variant/color',
        'Use the bag creation workflow: scripts/create-[topic]-bags.ts',
        'Each item needs: custom_name (descriptive), brand, why_chosen (optional)',
        'Add buy links for each product (Amazon, manufacturer site, retailer)',
        'QA: every link works, images load, descriptions are accurate',
      ],
    },
    {
      step: 3,
      title: 'Find the Creator\'s Contact',
      icon: <Mail className="w-5 h-5" />,
      description: 'YouTube doesn\'t have DMs. Use these channels instead.',
      details: [
        'EMAIL (best): YouTube \u2192 channel page \u2192 About tab \u2192 "For business inquiries" \u2192 View Email',
        'EMAIL alt: Check their website \u2014 most have a contact page or form',
        'INSTAGRAM DM: Best for beauty/lifestyle creators. Send a short DM with the bag link.',
        'X/TWITTER DM: Best for tech/productivity creators. Only works if their DMs are open.',
        'YOUTUBE COMMENT: Last resort. Comment on the video with the bag link. Low signal but visible.',
        'TIP: Check video descriptions for business emails and social links',
      ],
    },
    {
      step: 4,
      title: 'Send the Outreach',
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'Lead with the bag, not with an explanation of Teed.',
      details: [
        'Copy the template from the Outreach tab and personalize it',
        'Replace [LINK] with the actual Teed bag URL',
        'Replace [name] and [video title] with real values',
        'Keep DMs to 3-4 sentences max. Emails can be 5-7 sentences.',
        'Always include the bag link in the first 2 sentences \u2014 don\'t bury it',
        'Send during weekday mornings (creator prime time for reading messages)',
      ],
    },
    {
      step: 5,
      title: 'Follow Up (Once)',
      icon: <Clock className="w-5 h-5" />,
      description: 'If no reply after 5-7 days, send ONE gentle follow-up. Then move on.',
      details: [
        'Follow-up template: "Hey [name] \u2014 just bumping this in case it got buried. Here\'s the page I made from your [video]: [LINK]. No pressure!"',
        'If still no reply, move on. The bag itself has value as shareable content.',
        'Post the bag on relevant subreddits (r/EDC, r/RunningShoeGeeks, etc.) for organic discovery.',
        'Comment on the creator\'s next video with the bag link \u2014 the audience finds it even if the creator doesn\'t reply.',
      ],
    },
  ];

  const OUTREACH_GOTCHAS = [
    { title: 'YouTube Has No DMs', description: 'You cannot message creators on YouTube. Use email (from their About page), Instagram DM, X/Twitter DM, or their website contact form. YouTube comments are a last resort \u2014 visible but easily buried.', severity: 'critical' as const },
    { title: 'Build the Bag FIRST', description: 'Never reach out empty-handed. The finished Teed bag IS the pitch. The creator should be able to click one link and see exactly what you made for them.', severity: 'critical' as const },
    { title: 'Lead with Value, Not an Ask', description: 'Don\'t explain what Teed is. Show them their content as a Teed page. "I made this for you" beats "We\'re a startup that..." every time.', severity: 'important' as const },
    { title: 'One Follow-Up Maximum', description: 'Creators get hundreds of messages. If they don\'t reply after one gentle nudge, respect their time and move on. The bag still generates value as shareable content.', severity: 'important' as const },
    { title: 'Finding Business Emails', description: 'YouTube: Go to the creator\'s channel \u2192 About tab \u2192 look for "For business inquiries" \u2192 View Email. Many also list emails on their website or in video descriptions.', severity: 'info' as const },
    { title: 'Instagram DM Tips', description: 'Keep it to 3-4 sentences. Include the bag link immediately. Don\'t use a generic pitch. Beauty and lifestyle creators are most responsive on Instagram.', severity: 'info' as const },
    { title: 'X/Twitter DM Tips', description: 'Only works if their DMs are open. Keep it short \u2014 2-3 sentences max. Tag them in a quote tweet of the bag link as an alternative if DMs are closed.', severity: 'info' as const },
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
          <p className="text-sm text-[var(--text-secondary)] mb-3">Copy this prompt template and fill in the brackets to trigger the full bag creation workflow in Claude Code.</p>
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

      {/* Outreach gotchas */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Outreach Playbook</h2>
        <div className="space-y-3">
          {OUTREACH_GOTCHAS.map((g, i) => {
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
              <p className="text-sm text-[var(--text-secondary)]">Creator outreach playbook &mdash; Build bags, reach out, measure results</p>
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
        {activeTab === 'outreach' && renderOutreach()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'workflow' && renderWorkflow()}
      </main>
    </div>
  );
}
