'use client';

import { useState } from 'react';
import {
  User,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Palette,
  Quote,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface PanelMember {
  id: string;
  name: string;
  role: string;
  background: string;
  coreQuestion: string;
  frameworks: string[];
  color: string;
  icon: React.ReactNode;
  deliberation: {
    topic: string;
    quote: string;
  }[];
  books?: string[];
  keyInsight: string;
}

const panelMembers: PanelMember[] = [
  {
    id: 'priestley',
    name: 'Daniel Priestley',
    role: 'Business Growth & Positioning',
    background:
      'Serial entrepreneur, founder of Dent Global (top business accelerator), co-founder of ScoreApp (150,000+ users). Author of seven best-selling books including Key Person of Influence and Oversubscribed.',
    coreQuestion: 'What unique value does Teed create that no one else can?',
    frameworks: [
      'Key Person of Influence (5 Ps)',
      'Oversubscribed Method',
      '24 Assets Framework',
      'Scorecard Marketing',
      '7/11/4 Rule',
    ],
    color: 'amber',
    icon: <TrendingUp className="w-5 h-5" />,
    books: [
      'Key Person of Influence',
      'Oversubscribed',
      '24 Assets',
      'Scorecard Marketing',
    ],
    keyInsight:
      'Each bag is a digital asset working 24/7. Position monetization as "your expertise earning while you sleep."',
    deliberation: [
      {
        topic: 'On Positioning',
        quote:
          'Teed should position itself as the "Key Person of Influence" enabler. Most platforms fight for attention breadth. Teed should fight for trust depth.',
      },
      {
        topic: 'On the 7/11/4 Rule',
        quote:
          'Help creators build 7 hours of meaningful content, 11 touchpoints, across 4 locations. Bags ARE that framework—each bag is a trust-building asset that works 24/7.',
      },
      {
        topic: 'On Discovery',
        quote:
          'Don\'t build a feed. Build a "Scorecard" system. Let users share curations with context: "Based on your answers, here\'s my recommended setup."',
      },
      {
        topic: 'On Monetization',
        quote:
          'Create 24 Assets for creators. Each bag is a digital asset working 24/7. Position monetization as "your expertise earning while you sleep."',
      },
      {
        topic: 'On Content Strategy',
        quote:
          'The Oversubscribed principle applies: scarcity of quality > abundance of content. A few perfect curations > constant updates.',
      },
      {
        topic: 'On Creator Types',
        quote:
          'Five creator archetypes: The Expert (professional loadouts), The Enthusiast (hobby collections), The Gift-Giver (wishlists), The Tastemaker (lifestyle), The Brand (product launches).',
      },
    ],
  },
  {
    id: 'zhuo',
    name: 'Julie Zhuo',
    role: 'Product Design & User Experience',
    background:
      'Former VP of Product Design at Facebook (14 years, from first intern to leadership), now founder of Sundial. Author of bestselling "The Making of a Manager."',
    coreQuestion: 'How should creators FEEL when they use Teed?',
    frameworks: [
      'Hierarchy of Product Differentiation',
      'Levels of Design (1-5)',
      'Product Thinking',
      'Team Alignment',
    ],
    color: 'sky',
    icon: <Palette className="w-5 h-5" />,
    books: ['The Making of a Manager'],
    keyInsight:
      'When products are feature-equivalent, the winner creates emotional resonance. Design for "Pride of the Archive."',
    deliberation: [
      {
        topic: 'On Emotional Design',
        quote:
          'The emotional hierarchy matters. Linktree makes creators feel anxious—"Is my page performing?" Teed should make creators feel PROUD—"Look at what I\'ve built."',
      },
      {
        topic: 'On Completion Satisfaction',
        quote:
          'The product should optimize for completion satisfaction, not engagement metrics. When users finish a bag, they should feel the same satisfaction as completing a beautiful photo album.',
      },
      {
        topic: 'On Sharing',
        quote:
          'Sharing should feel like gifting, not broadcasting. When someone shares a bag, they\'re saying "I made this for you." The UI should reflect that intentionality.',
      },
      {
        topic: 'On Monetization UI',
        quote:
          'Monetization UI should feel earned, not extractive. "Your curations helped 47 people find what they needed" > "You earned $124 in clicks."',
      },
      {
        topic: 'On Permanence',
        quote:
          'Design for "Pride of the Archive." When someone visits a 2-year-old bag, it should feel like discovering a well-organized library, not finding stale content.',
      },
      {
        topic: 'On Archetype Emotions',
        quote:
          'Each archetype needs a different emotional payoff: Expert = Recognition, Enthusiast = Pride, Gift-Giver = Joy, Tastemaker = Validation, Brand = Professional showcase.',
      },
    ],
  },
  {
    id: 'jin',
    name: 'Li Jin',
    role: 'Creator Economy & Community',
    background:
      'Founder and GP at Atelier Ventures, focused exclusively on passion economy platforms. Coined the term "Passion Economy." Previously partner at Andreessen Horowitz.',
    coreQuestion: 'How can we build economic fairness competitors can\'t copy?',
    frameworks: [
      '100 True Fans Model',
      'Passion Economy Thesis',
      'Creator Middle Class',
      'Alignment Principle',
    ],
    color: 'teed-green',
    icon: <Lightbulb className="w-5 h-5" />,
    keyInsight:
      'Build for creators in the 100-1000 fan range. This is where platforms create durable value—not servicing mega-creators.',
    deliberation: [
      {
        topic: 'On the 100 True Fans Model',
        quote:
          'If a curator has 100 people who trust their taste enough to click through and buy, that\'s a viable business. Current platforms obscure this economics. Teed should be radically transparent.',
      },
      {
        topic: 'On the Creator Middle Class',
        quote:
          'Build for the creator middle class—people earning $50K-$200K from their expertise, not just mega-influencers.',
      },
      {
        topic: 'On Distribution',
        quote:
          'Let creators own their distribution. Email-first sharing. Direct links. QR codes that go to THEIR audience, not Teed\'s algorithmic surface.',
      },
      {
        topic: 'On Transparency',
        quote:
          'Radical transparency. Show exactly how affiliate economics work. No hidden platform cuts. If Teed takes 10%, say so clearly. Trust is the moat.',
      },
      {
        topic: 'On Archetype Priority',
        quote:
          'Build for Experts and Enthusiasts first. They\'re underserved and loyal. Tastemakers go where audiences are. Experts go where they can demonstrate expertise.',
      },
      {
        topic: 'On Alignment',
        quote:
          'The business model needs to fit what your content is, who the audience is, who the creator is, what the platform is. All need to be aligned.',
      },
    ],
  },
  {
    id: 'heyward',
    name: 'Emily Heyward',
    role: 'Brand & Premium Positioning',
    background:
      'Co-founder and Chief Brand Officer at Red Antler, the branding firm behind Casper, Allbirds, and dozens of breakout DTC brands. Author of "Obsessed: Building a Brand People Love from Day One."',
    coreQuestion: 'What does Teed stand for that no other platform does?',
    frameworks: [
      'Deliberate Differentiation',
      'Emotional-First Strategy',
      'Embracing Tension',
      'Obsession Through Focus',
    ],
    color: 'copper',
    icon: <BookOpen className="w-5 h-5" />,
    books: ['Obsessed: Building a Brand People Love from Day One'],
    keyInsight:
      'The most differentiated brands stand for something beyond the product itself. Teed is a movement, not just another app.',
    deliberation: [
      {
        topic: 'On Values Over Features',
        quote:
          'Teed isn\'t competing on features—it\'s competing on values. The positioning: "The platform that respects your work." Where others extract, Teed preserves.',
      },
      {
        topic: 'On Brand Manifestation',
        quote:
          'This isn\'t just marketing—it should manifest in every design decision. The premium feeling comes from intentionality, not decoration.',
      },
      {
        topic: 'On Share Language',
        quote:
          'The share action should feel premium. Not "copy link" but "share your curation." Language matters.',
      },
      {
        topic: 'On Affiliate Language',
        quote:
          'Avoid the word "affiliate." It\'s been corrupted. Call it "recommendation revenue" or "curation rewards." Reframe the economics.',
      },
      {
        topic: 'On Permanence',
        quote:
          'This is Teed\'s biggest differentiation. Every other platform penalizes old content. Teed should CELEBRATE it. "3 years strong" badges.',
      },
      {
        topic: 'On Community as Moat',
        quote:
          'An authentic sense of community is Teed\'s most defensible moat. Focus on building a tribe of creators who feel they belong, not just a platform of users.',
      },
    ],
  },
];

export default function AdvisoryPanel() {
  const [expandedMember, setExpandedMember] = useState<string | null>('priestley');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Panel Introduction */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
          Virtual Advisory Panel
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          Four world-class thought leaders whose expertise creates a powerful strategic framework
          for Teed. Each brings distinct but complementary perspectives on business growth,
          product design, creator economics, and brand positioning.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {panelMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setExpandedMember(member.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                expandedMember === member.id
                  ? `bg-[var(--${member.color}-4)] border-[var(--${member.color}-6)]`
                  : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-[var(--${member.color}-4)] flex items-center justify-center mb-3`}
              >
                <span className={`text-[var(--${member.color}-11)]`}>{member.icon}</span>
              </div>
              <div className="font-medium text-[var(--text-primary)] text-sm">
                {member.name}
              </div>
              <div className="text-xs text-[var(--text-secondary)] line-clamp-1">
                {member.role}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Selected Panel Member Detail */}
      {expandedMember && (
        <PanelMemberDetail
          member={panelMembers.find((m) => m.id === expandedMember)!}
          expandedTopic={expandedTopic}
          setExpandedTopic={setExpandedTopic}
        />
      )}

      {/* Panel Deliberation Summary */}
      <section className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Key Decisions from Panel Deliberation
        </h3>
        <div className="space-y-4">
          <DecisionItem
            topic="Discovery"
            decision="Item-centric, not feed-based"
            rationale="Discovery starts from an item the user is interested in. 'Who else uses this?' serves understanding, not engagement farming."
          />
          <DecisionItem
            topic="Monetization"
            decision="Radical transparency"
            rationale="Show exactly how economics work. 'Your curations helped X people' > 'You earned $X.' Reframe as 'recommendation revenue.'"
          />
          <DecisionItem
            topic="Sharing"
            decision="Feels like gifting"
            rationale="Not 'copy link' but 'share your curation.' Premium language and intentional UI."
          />
          <DecisionItem
            topic="Permanence"
            decision="Celebrate, don't penalize"
            rationale="'3 years strong' badges. A 2-year-old bag should feel like a well-organized library."
          />
          <DecisionItem
            topic="Target Creators"
            decision="Middle class first"
            rationale="Experts and Enthusiasts are underserved and loyal. Build for $50K-$200K earners, not mega-influencers."
          />
        </div>
      </section>
    </div>
  );
}

function PanelMemberDetail({
  member,
  expandedTopic,
  setExpandedTopic,
}: {
  member: PanelMember;
  expandedTopic: string | null;
  setExpandedTopic: (topic: string | null) => void;
}) {
  return (
    <section
      className={`bg-[var(--surface)] rounded-xl border border-[var(--${member.color}-6)] overflow-hidden`}
    >
      {/* Header */}
      <div className={`bg-[var(--${member.color}-4)] px-6 py-4`}>
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-white flex items-center justify-center`}
          >
            <span className={`text-[var(--${member.color}-11)]`}>{member.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-[var(--${member.color}-12)]`}>
              {member.name}
            </h3>
            <p className={`text-sm text-[var(--${member.color}-11)]`}>{member.role}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Background */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Background
          </h4>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {member.background}
          </p>
        </div>

        {/* Core Question */}
        <div className={`bg-[var(--${member.color}-4)] rounded-lg p-4`}>
          <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Core Question for Teed
          </h4>
          <p className={`text-lg font-medium text-[var(--${member.color}-12)]`}>
            &quot;{member.coreQuestion}&quot;
          </p>
        </div>

        {/* Frameworks */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Key Frameworks
          </h4>
          <div className="flex flex-wrap gap-2">
            {member.frameworks.map((framework) => (
              <span
                key={framework}
                className={`px-3 py-1 bg-[var(--${member.color}-4)] text-[var(--${member.color}-11)] text-sm rounded-full`}
              >
                {framework}
              </span>
            ))}
          </div>
        </div>

        {/* Books */}
        {member.books && (
          <div>
            <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              Notable Books
            </h4>
            <div className="flex flex-wrap gap-2">
              {member.books.map((book) => (
                <span
                  key={book}
                  className="px-3 py-1 bg-[var(--grey-4)] text-[var(--text-secondary)] text-sm rounded-full"
                >
                  {book}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Insight */}
        <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border-subtle)]">
          <div className="flex items-start gap-3">
            <Quote className={`w-5 h-5 text-[var(--${member.color}-11)] flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm text-[var(--text-primary)] italic leading-relaxed">
                &quot;{member.keyInsight}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Deliberation */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
            Full Deliberation
          </h4>
          <div className="space-y-2">
            {member.deliberation.map((item) => (
              <div
                key={item.topic}
                className="border border-[var(--border-subtle)] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedTopic(
                      expandedTopic === `${member.id}-${item.topic}`
                        ? null
                        : `${member.id}-${item.topic}`
                    )
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--grey-3)] transition-colors"
                >
                  <span className="font-medium text-sm text-[var(--text-primary)]">
                    {item.topic}
                  </span>
                  {expandedTopic === `${member.id}-${item.topic}` ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                </button>
                {expandedTopic === `${member.id}-${item.topic}` && (
                  <div className="px-3 pb-3">
                    <div className="bg-[var(--surface-elevated)] rounded p-3">
                      <p className="text-sm text-[var(--text-secondary)] italic">
                        &quot;{item.quote}&quot;
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionItem({
  topic,
  decision,
  rationale,
}: {
  topic: string;
  decision: string;
  rationale: string;
}) {
  return (
    <div className="flex gap-4 p-3 bg-[var(--surface-elevated)] rounded-lg">
      <div className="w-24 flex-shrink-0">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">
          {topic}
        </span>
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm text-[var(--text-primary)] mb-1">{decision}</div>
        <div className="text-xs text-[var(--text-secondary)]">{rationale}</div>
      </div>
    </div>
  );
}
