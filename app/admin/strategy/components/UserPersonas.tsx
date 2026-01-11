'use client';

import { useState } from 'react';
import {
  User,
  Briefcase,
  Gift,
  Building2,
  Video,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
} from 'lucide-react';

interface Persona {
  id: string;
  archetype: string;
  icon: React.ReactNode;
  color: string;
  name: string;
  age: number;
  occupation: string;
  situation: string;
  emotionalPayoff: string;
  journey: string[];
  requiredFeatures: {
    existing: string[];
    new: string[];
  };
  keyInsight: string;
}

const personas: Persona[] = [
  {
    id: 'expert',
    archetype: 'The Expert',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'amber',
    name: 'Marcus',
    age: 45,
    occupation: 'PGA Teaching Professional',
    situation:
      '15 years experience, 8,000 Instagram followers constantly asking "what\'s in your bag?"',
    emotionalPayoff: 'Recognition of knowledge',
    journey: [
      'Creates profile @marcusgolfpro',
      'Creates "My Tournament Setup 2026" bag with 14 clubs',
      'Adds specs, notes, and "why I chose this" for each',
      'Attaches Amazon Associates affiliate links',
      'Creates companion bags: "Teaching Bag" and "Budget Alternatives"',
      'Links all three on profile with clear explanations',
      'Shares QR code at lessons and in Instagram bio',
      'Two years later: Still the "definitive resource" in his community',
    ],
    requiredFeatures: {
      existing: [
        'Multi-bag profiles',
        'Affiliate integration',
        'QR code generation',
        'Profile blocks',
      ],
      new: [
        'Item comparison across bags',
        '"Why I chose this" narratives',
        'Version history with changelog',
        'Equipment specs database',
      ],
    },
    keyInsight:
      'Experts want their knowledge recognized and monetized. A bag that stays relevant for years is more valuable than daily posts.',
  },
  {
    id: 'gift-giver',
    archetype: 'The Gift-Giver',
    icon: <Gift className="w-5 h-5" />,
    color: 'sky',
    name: 'Sarah',
    age: 32,
    occupation: 'Marketing Manager',
    situation:
      'Tired of family asking "what do you want for your birthday?" then buying random things anyway.',
    emotionalPayoff: 'Joy of sharing',
    journey: [
      'Creates semi-private profile (link-only access)',
      'Creates "Sarah\'s 33rd Birthday Wishlist" bag',
      'Organizes by price range: $25-50, $50-100, $100+',
      'Adds photos, links, size/color notes per item',
      'Shares unique link with family group chat',
      'Family can see views (not purchases) for coordination',
      'Adds note about loving experiences',
      'After birthday: Converts to "Things I Love" evergreen bag',
    ],
    requiredFeatures: {
      existing: ['Privacy controls', 'Item notes', 'Multi-retailer links'],
      new: [
        'Wishlist-optimized layout',
        '"Claimed" tracking (privacy-respecting)',
        'Gift amount categories',
        'Occasion templates',
        'Post-occasion conversion',
      ],
    },
    keyInsight:
      'Gift-givers want to make it easy for others. The bag is a gift in itself—thoughtfully organized to help loved ones.',
  },
  {
    id: 'brand',
    archetype: 'The Brand',
    icon: <Building2 className="w-5 h-5" />,
    color: 'evergreen',
    name: 'Summit Trail',
    age: 0,
    occupation: 'Outdoor Gear Brand',
    situation: '50K Instagram followers, selling via Shopify, launching new backpack line.',
    emotionalPayoff: 'Professional showcase',
    journey: [
      'Creates verified profile @summittrail',
      'Creates "Apex Collection Launch - Spring 2026" bag',
      'Each item is a product variant with full specs',
      'Links go to Shopify (tracked via UTM)',
      'Profile includes brand story and "Why We Made This" video',
      'Creates "Designer\'s Picks" companion bag',
      'Influencer partners create their own bags featuring Apex',
      'Post-launch: Bag becomes permanent product catalog',
    ],
    requiredFeatures: {
      existing: [
        'High-quality images',
        'Video embeds',
        'UTM tracking',
        'Multi-product organization',
      ],
      new: [
        'Brand verification badges',
        'Product variant support',
        'Launch scheduling',
        'Influencer collaboration',
        'Collection hierarchy',
      ],
    },
    keyInsight:
      'Brands want a permanent, beautiful showcase that doesn\'t disappear in a feed. Each launch bag becomes part of brand archive.',
  },
  {
    id: 'youtuber',
    archetype: 'The YouTuber',
    icon: <Video className="w-5 h-5" />,
    color: 'copper',
    name: 'Alex',
    age: 28,
    occupation: 'Tech YouTuber (250K subscribers)',
    situation: 'Every video gets comments asking "What camera/mic/lights do you use?"',
    emotionalPayoff: 'Pride in collection',
    journey: [
      'Creates @alextech profile with YouTube link',
      'Creates "My Complete YouTube Studio Setup 2026" bag',
      'Items organized: Camera, Audio, Lighting, Desk, Accessories',
      'Each item has affiliate link, "why I chose it", video review link',
      'Creates "Budget Alternative" bag for aspiring YouTubers',
      'Creates "Gear I\'m Testing" bag for current reviews',
      'Pins studio tour video embed',
      'Links Teed in every video description',
      'Updates bags with changelog when upgrading',
    ],
    requiredFeatures: {
      existing: [
        'Category organization',
        'Video embeds',
        'Affiliate tracking',
        'Cross-linking bags',
      ],
      new: [
        '"Gear timeline" showing upgrades',
        'Video-to-bag linking',
        'Alternative recommendations per item',
        'Creator earnings transparency',
      ],
    },
    keyInsight:
      'Content creators answer the same questions repeatedly. One definitive bag eliminates that friction and monetizes the answer.',
  },
  {
    id: 'newsletter',
    archetype: 'The Newsletter Curator',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'teed-green',
    name: 'Maya',
    age: 35,
    occupation: 'Substack Writer (15K subscribers)',
    situation:
      'Writes "Thoughtful Living" newsletter, frequently recommends books, apps, products.',
    emotionalPayoff: 'Validation of taste',
    journey: [
      'Creates @thoughtfulliving profile',
      'Creates thematic bags: Books, Desk Setup, Apps, Wellness',
      'Each bag includes narrative context, not just links',
      'Profile includes newsletter signup destination',
      'Embeds recent Substack posts using RSS',
      'References specific bags in each newsletter',
      'Creates "Best of Month" temporary bags',
      'Creates "2026 Favorites" annual compilation',
    ],
    requiredFeatures: {
      existing: ['Narrative blocks', 'Multiple bags', 'Email capture destination'],
      new: [
        'Substack/Beehiiv integration',
        '"Bag of the month" archiving',
        'Annual compilation generation',
        'Reader engagement metrics (views, not clicks)',
        'Export to newsletter format',
      ],
    },
    keyInsight:
      'Newsletter writers curate as a service. Their bags save readers hours of research and build trust that drives subscriptions.',
  },
];

export default function UserPersonas() {
  const [expandedPersona, setExpandedPersona] = useState<string>('expert');

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">
          Five Creator Archetypes
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Based on research into how people share curations, we&apos;ve identified five core
          archetypes. Each has distinct needs, emotional payoffs, and feature requirements.
          Building for all equally ensures Teed serves the full spectrum of curation use cases.
        </p>
      </section>

      {/* Archetype Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setExpandedPersona(persona.id)}
            className={`p-4 rounded-xl border transition-all text-center ${
              expandedPersona === persona.id
                ? `bg-[var(--${persona.color}-4)] border-[var(--${persona.color}-6)]`
                : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
            }`}
          >
            <div
              className={`w-12 h-12 mx-auto rounded-full bg-[var(--${persona.color}-4)] flex items-center justify-center mb-2`}
            >
              <span className={`text-[var(--${persona.color}-11)]`}>{persona.icon}</span>
            </div>
            <div className="font-medium text-sm text-[var(--text-primary)]">
              {persona.archetype}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">
              {persona.emotionalPayoff}
            </div>
          </button>
        ))}
      </section>

      {/* Expanded Persona Detail */}
      {expandedPersona && (
        <PersonaDetail persona={personas.find((p) => p.id === expandedPersona)!} />
      )}

      {/* Emotional Payoff Summary */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">
          Emotional Payoffs by Archetype
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4 italic">
          &quot;Each archetype needs a different emotional payoff.&quot; — Julie Zhuo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`p-4 rounded-lg bg-[var(--${persona.color}-4)]`}
            >
              <div className={`text-[var(--${persona.color}-11)] mb-2`}>{persona.icon}</div>
              <div className={`font-medium text-sm text-[var(--${persona.color}-12)]`}>
                {persona.archetype}
              </div>
              <div className={`text-xs text-[var(--${persona.color}-11)] mt-1`}>
                {persona.emotionalPayoff}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Priority Note */}
      <section className="bg-[var(--amber-4)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--amber-12)] mb-2">
          Build Priority (from Li Jin)
        </h3>
        <blockquote className="text-sm text-[var(--amber-11)] italic">
          &quot;Build for Experts and Enthusiasts first. They&apos;re underserved and loyal.
          Tastemakers go where audiences are. Experts go where they can demonstrate
          expertise.&quot;
        </blockquote>
        <p className="text-sm text-[var(--amber-12)] mt-3">
          However, building foundation features that serve all archetypes equally ensures
          product-market fit across segments.
        </p>
      </section>
    </div>
  );
}

function PersonaDetail({ persona }: { persona: Persona }) {
  const [showFullJourney, setShowFullJourney] = useState(false);

  return (
    <section
      className={`bg-[var(--surface)] rounded-xl border border-[var(--${persona.color}-6)] overflow-hidden`}
    >
      {/* Header */}
      <div className={`bg-[var(--${persona.color}-4)] px-6 py-4`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
            <span className={`text-[var(--${persona.color}-11)]`}>{persona.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold text-[var(--${persona.color}-12)]`}>
                {persona.archetype}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-white/50 text-[var(--${persona.color}-11)]`}
              >
                {persona.emotionalPayoff}
              </span>
            </div>
            <p className={`text-sm text-[var(--${persona.color}-11)]`}>
              {persona.name}
              {persona.age > 0 && `, ${persona.age}`} • {persona.occupation}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Situation */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Situation
          </h4>
          <p className="text-sm text-[var(--text-primary)]">{persona.situation}</p>
        </div>

        {/* Key Insight */}
        <div className={`bg-[var(--${persona.color}-4)] rounded-lg p-4`}>
          <div className="flex items-start gap-3">
            <Sparkles className={`w-5 h-5 text-[var(--${persona.color}-11)] flex-shrink-0`} />
            <p className={`text-sm text-[var(--${persona.color}-12)]`}>{persona.keyInsight}</p>
          </div>
        </div>

        {/* User Journey */}
        <div>
          <button
            onClick={() => setShowFullJourney(!showFullJourney)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3"
          >
            User Journey
            {showFullJourney ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <div className="space-y-2">
            {(showFullJourney ? persona.journey : persona.journey.slice(0, 4)).map(
              (step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-[var(--${persona.color}-4)] flex items-center justify-center flex-shrink-0`}
                  >
                    <span className={`text-xs font-medium text-[var(--${persona.color}-11)]`}>
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] pt-0.5">{step}</p>
                </div>
              )
            )}
            {!showFullJourney && persona.journey.length > 4 && (
              <button
                onClick={() => setShowFullJourney(true)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] ml-9"
              >
                +{persona.journey.length - 4} more steps...
              </button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-[var(--teed-green-11)] mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Existing Features
            </h4>
            <ul className="space-y-1">
              {persona.requiredFeatures.existing.map((feature) => (
                <li key={feature} className="text-xs text-[var(--text-secondary)]">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--amber-11)] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              New Features Needed
            </h4>
            <ul className="space-y-1">
              {persona.requiredFeatures.new.map((feature) => (
                <li key={feature} className="text-xs text-[var(--text-secondary)]">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
