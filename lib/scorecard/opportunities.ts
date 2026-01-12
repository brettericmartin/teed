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

/**
 * Generate top opportunities based on lowest scoring categories
 */
export function generateOpportunities(
  categoryScores: CategoryScores,
  mode: ScorecardMode
): ScorecardOpportunity[] {
  // Determine which third category to use based on mode
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

  // Return top 2 opportunities (lowest scoring categories)
  const opportunities: ScorecardOpportunity[] = [];

  for (let i = 0; i < Math.min(2, scoredCategories.length); i++) {
    const entry = scoredCategories[i];
    // Only include if there's meaningful room for improvement
    if (entry.score < 80) {
      opportunities.push({
        ...OPPORTUNITY_TEMPLATES[entry.key],
        // Adjust potential gain based on how much room there is
        potentialGain: Math.min(
          OPPORTUNITY_TEMPLATES[entry.key].potentialGain,
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
 * Generate a personalized action message based on top opportunity
 */
export function getTopActionMessage(opportunities: ScorecardOpportunity[]): string {
  if (opportunities.length === 0) {
    return "You're doing great! Keep building your gear ecosystem.";
  }

  const top = opportunities[0];
  const messages: Record<string, string> = {
    organization: 'Start by creating your first bag to organize your favorite gear.',
    sharing: 'Your gear knowledge deserves to be seen. Teed makes sharing effortless.',
    monetization: 'Turn your recommendations into revenue with centralized affiliate links.',
    impact: 'Help more people discover the gear that works for you.',
    documentation: 'Add context to your picks and become the trusted voice in your niche.',
  };

  return messages[top.category] || "Let's build your gear ecosystem together.";
}
