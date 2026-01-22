/**
 * Scorecard Personas
 *
 * Personas are assigned based on overall scorecard score and mode.
 * All personas are framed positively - they represent stages of a journey, not judgments.
 */

import type { ScorecardPersona, ScorecardPersonaId, ScorecardMode } from '@/lib/types/beta';

export const PERSONAS: Record<ScorecardPersonaId, ScorecardPersona> = {
  gear_architect: {
    id: 'gear_architect',
    name: 'The Gear Architect',
    description:
      'You have exceptional systems for organizing and sharing your gear knowledge. Your audience benefits from your meticulous curation.',
    emoji: '🏛️',
    color: 'emerald',
    frame: 'Master of systems',
  },
  organized_creator: {
    id: 'organized_creator',
    name: 'The Organized Creator',
    description:
      'You maintain solid organization and share your recommendations effectively. A few optimizations will take you to the next level.',
    emoji: '📋',
    color: 'blue',
    frame: 'Strong foundation',
  },
  aspiring_organizer: {
    id: 'aspiring_organizer',
    name: 'The Aspiring Organizer',
    description:
      'You have good instincts for gear curation. Building better systems will unlock your full potential as a trusted resource.',
    emoji: '🌱',
    color: 'amber',
    frame: 'On the right path',
  },
  emerging_curator: {
    id: 'emerging_curator',
    name: 'The Emerging Curator',
    description:
      'Your gear knowledge is valuable but scattered. The right tools will help you organize and share it with your audience.',
    emoji: '🌟',
    color: 'orange',
    frame: 'Ready to level up',
  },
  fresh_start: {
    id: 'fresh_start',
    name: 'The Fresh Start',
    description:
      'You are at the perfect moment to build your gear curation system the right way from the beginning. No bad habits to unlearn!',
    emoji: '✨',
    color: 'slate',
    frame: 'Perfect timing to build right',
  },
  personal_organizer: {
    id: 'personal_organizer',
    name: 'The Personal Organizer',
    description:
      "You're here for yourself, not an audience - and that's perfect! Teed will help you organize, track, and enjoy the gear you love.",
    emoji: '🏡',
    color: 'slate',
    frame: 'Organizing for yourself',
  },
};

/**
 * Get persona based on overall score and mode
 * Personal mode users get a special persona that celebrates their self-organization journey
 */
export function getPersona(score: number, mode?: ScorecardMode): ScorecardPersona {
  // Personal mode: Always return personal_organizer with encouraging framing
  // They're here for themselves, not an audience - and that's great!
  if (mode === 'personal') {
    return PERSONAS.personal_organizer;
  }

  // Standard scoring for monetization/impact modes
  if (score >= 85) return PERSONAS.gear_architect;
  if (score >= 70) return PERSONAS.organized_creator;
  if (score >= 50) return PERSONAS.aspiring_organizer;
  if (score >= 30) return PERSONAS.emerging_curator;
  return PERSONAS.fresh_start;
}

/**
 * Get persona by ID
 */
export function getPersonaById(id: ScorecardPersonaId): ScorecardPersona {
  return PERSONAS[id];
}

/**
 * Get positive feedback for a category score
 */
export function getCategoryFeedback(category: string, score: number): string {
  if (score >= 80) {
    const excellent: Record<string, string> = {
      organization: 'Excellent systems',
      sharing: 'Great reach',
      monetization: 'Strong monetization',
      impact: 'High impact',
      documentation: 'Well documented',
    };
    return excellent[category] || 'Excellent';
  }
  if (score >= 60) {
    const good: Record<string, string> = {
      organization: 'Solid foundation',
      sharing: 'Good reach',
      monetization: 'Earning potential',
      impact: 'Making impact',
      documentation: 'Good context',
    };
    return good[category] || 'Good progress';
  }
  if (score >= 40) {
    const building: Record<string, string> = {
      organization: 'Building systems',
      sharing: 'Growing reach',
      monetization: 'Opportunity ahead',
      impact: 'Building value',
      documentation: 'Room to grow',
    };
    return building[category] || 'Building';
  }
  const opportunity: Record<string, string> = {
    organization: 'Big opportunity',
    sharing: 'Untapped reach',
    monetization: 'Revenue potential',
    impact: 'Impact awaits',
    documentation: 'Story to tell',
  };
  return opportunity[category] || 'Opportunity';
}
