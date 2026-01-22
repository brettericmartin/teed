/**
 * Scorecard Opportunities
 *
 * Generates personalized improvement recommendations based on category scores.
 * Recommendations are always framed positively as opportunities, not deficiencies.
 */

import type { CategoryScores, ScorecardOpportunity, ScorecardMode } from '@/lib/types/beta';

type CategoryKey = 'organization' | 'sharing' | 'monetization' | 'impact' | 'documentation';

const OPPORTUNITY_TEMPLATES: Record<CategoryKey, ScorecardOpportunity> = {
  organization: {
    category: 'organization',
    title: 'Build Your System',
    description: 'Create bags to organize your gear by category, project, or use case. One canonical source that updates everywhere.',
    icon: 'folder',
    potentialGain: 20,
  },
  sharing: {
    category: 'sharing',
    title: 'Expand Your Reach',
    description: 'Share your curated bags across all your platforms with embeds, exports, and QR codes.',
    icon: 'share',
    potentialGain: 15,
  },
  monetization: {
    category: 'monetization',
    title: 'Monetize Your Expertise',
    description: 'Add affiliate links to earn from your recommendations. Centralized links mean fewer broken opportunities.',
    icon: 'dollar-sign',
    potentialGain: 25,
  },
  impact: {
    category: 'impact',
    title: 'Amplify Your Impact',
    description: 'Help more people with your gear knowledge. Organized recommendations serve your audience better.',
    icon: 'users',
    potentialGain: 15,
  },
  documentation: {
    category: 'documentation',
    title: 'Tell Your Story',
    description: 'Add "Why I chose this" notes to help your audience understand your decisions. Context builds trust.',
    icon: 'edit',
    potentialGain: 15,
  },
};

// Personal mode opportunities - focused on self-organization rather than audience
const PERSONAL_OPPORTUNITY_TEMPLATES: Record<CategoryKey, ScorecardOpportunity> = {
  organization: {
    category: 'organization',
    title: 'Your Personal Gear System',
    description: 'Keep track of what you own, what you love, and what you want next. Finally know where everything is.',
    icon: 'home',
    potentialGain: 25,
  },
  sharing: {
    category: 'sharing',
    title: 'Share With Friends',
    description: 'When friends ask for recommendations, send them a link instead of typing it all out again.',
    icon: 'send',
    potentialGain: 10,
  },
  monetization: {
    category: 'monetization',
    title: 'Know What You Have',
    description: "Track your gear collection's value. Know what you own and when you bought it.",
    icon: 'archive',
    potentialGain: 15,
  },
  impact: {
    category: 'impact',
    title: 'Remember Why You Chose It',
    description: "Note why you picked each item. Future you will thank present you when it's time to replace something.",
    icon: 'bookmark',
    potentialGain: 15,
  },
  documentation: {
    category: 'documentation',
    title: 'Your Gear Memory',
    description: "Never forget why you bought something or what you thought of it. Build your personal gear history.",
    icon: 'book',
    potentialGain: 20,
  },
};

/**
 * Generate top opportunities based on lowest scoring categories
 */
export function generateOpportunities(
  categoryScores: CategoryScores,
  mode: ScorecardMode
): ScorecardOpportunity[] {
  // Select template based on mode
  const templates = mode === 'personal' ? PERSONAL_OPPORTUNITY_TEMPLATES : OPPORTUNITY_TEMPLATES;

  // For personal mode, use 'impact' slot but treat it as 'personal' opportunity
  // For monetization mode, use 'monetization', for impact mode, use 'impact'
  const thirdCategoryKey = mode === 'monetization' ? 'monetization' : 'impact';
  const thirdCategoryScore = mode === 'monetization'
    ? categoryScores.monetization ?? 50
    : categoryScores.impact ?? 50;

  // Build scored entries
  const scoredCategories: Array<{ key: CategoryKey; score: number }> = [
    { key: 'organization', score: categoryScores.organization },
    { key: 'sharing', score: categoryScores.sharing },
    { key: thirdCategoryKey, score: thirdCategoryScore },
    { key: 'documentation', score: categoryScores.documentation },
  ];

  // Sort by score ascending (lowest first = biggest opportunities)
  scoredCategories.sort((a, b) => a.score - b.score);

  // For personal mode, always prioritize organization first
  // Personal users benefit most from getting organized
  if (mode === 'personal') {
    const orgIndex = scoredCategories.findIndex(c => c.key === 'organization');
    if (orgIndex > 0) {
      const [org] = scoredCategories.splice(orgIndex, 1);
      scoredCategories.unshift(org);
    }
  }

  // Return top 2 opportunities (lowest scoring categories, or org-first for personal)
  const opportunities: ScorecardOpportunity[] = [];

  for (let i = 0; i < Math.min(2, scoredCategories.length); i++) {
    const entry = scoredCategories[i];
    // Only include if there's meaningful room for improvement
    if (entry.score < 80) {
      opportunities.push({
        ...templates[entry.key],
        // Adjust potential gain based on how much room there is
        potentialGain: Math.min(
          templates[entry.key].potentialGain,
          Math.round((100 - entry.score) * 0.3)
        ),
      });
    }
  }

  return opportunities;
}

/**
 * Get opportunity template by category
 */
export function getOpportunityForCategory(category: CategoryKey): ScorecardOpportunity {
  return OPPORTUNITY_TEMPLATES[category];
}

/**
 * Generate a personalized action message based on top opportunity and mode
 */
export function getTopActionMessage(opportunities: ScorecardOpportunity[], mode?: ScorecardMode): string {
  if (opportunities.length === 0) {
    if (mode === 'personal') {
      return "You're all set! Teed is ready to help you organize your gear.";
    }
    return "You're doing great! Keep building your gear ecosystem.";
  }

  const top = opportunities[0];

  // Personal mode messages - focused on self rather than audience
  if (mode === 'personal') {
    const personalMessages: Record<string, string> = {
      organization: 'Start by creating a bag for your favorite gear. Finally, everything in one place.',
      sharing: "Save time next time a friend asks 'what do you use?' - just send them a link.",
      monetization: "Track what you own and when you bought it. You'll thank yourself later.",
      impact: "Note why you chose each item. Future you will appreciate the context.",
      documentation: "Build your personal gear history. Never forget why you bought something.",
    };
    return personalMessages[top.category] || "Let's get your gear organized.";
  }

  // Standard messages for creators
  const messages: Record<string, string> = {
    organization: 'Start by creating your first bag to organize your favorite gear.',
    sharing: 'Your gear knowledge deserves to be seen. Teed makes sharing effortless.',
    monetization: 'Turn your recommendations into revenue with centralized affiliate links.',
    impact: 'Help more people discover the gear that works for you.',
    documentation: 'Add context to your picks and become the trusted voice in your niche.',
  };

  return messages[top.category] || "Let's build your gear ecosystem together.";
}
