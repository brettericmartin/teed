/**
 * Idea Agent Types
 *
 * Types for the AI-powered bag idea suggestion system.
 */

export type IdeaCategory =
  | 'gear'        // Traditional gear collections
  | 'lifestyle'   // Living room setups, desk setups
  | 'learning'    // Course materials, book collections
  | 'recipes'     // Ingredient lists, meal prep
  | 'travel'      // Packing lists, destination guides
  | 'gifts'       // Gift guides, wishlists
  | 'creative'    // Art supplies, craft materials
  | 'wellness'    // Self-care, fitness routines
  | 'entertainment' // Movie nights, game collections
  | 'seasonal';   // Holiday-specific, seasonal activities

export interface BagIdea {
  id: string;
  name: string;
  description: string;
  category: IdeaCategory;
  whyItFits: string;
  suggestedItems: SuggestedItem[];
  estimatedBudget?: string;
  complementsExisting?: string; // Title of existing bag it complements
  tags: string[];
  difficulty: 'easy' | 'medium' | 'advanced';
}

export interface SuggestedItem {
  name: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  estimatedPrice?: string;
}

export interface UserContext {
  userId: string;
  existingBags: ExistingBagSummary[];
  topCategories: string[];
  preferredBrands: string[];
  priceRange: 'budget' | 'mid-range' | 'premium' | 'mixed';
  totalItems: number;
}

export interface ExistingBagSummary {
  id: string;
  title: string;
  category: string;
  itemCount: number;
  tags: string[];
}

export interface IdeaGenerationInput {
  userId: string;
  limit?: number;
  focusCategory?: IdeaCategory;
  excludeCategories?: IdeaCategory[];
  creativityLevel?: 'conservative' | 'balanced' | 'adventurous';
}

export interface IdeaGenerationResult {
  ideas: BagIdea[];
  analysis: UserAnalysis;
  generatedAt: Date;
}

export interface UserAnalysis {
  identifiedNiches: string[];
  collectionPatterns: string[];
  gapOpportunities: string[];
  personalityTraits: string[];
}

export interface IdeaTemplate {
  id: string;
  category: IdeaCategory;
  name: string;
  description: string;
  promptHint: string;
  exampleItems: string[];
  tags: string[];
}
