/**
 * Brand Knowledge Base Types
 *
 * These types define the structure of category-specific brand knowledge
 * used to enhance AI product identification with visual cues.
 */

/**
 * A single brand's visual signature and identification tips
 */
export interface BrandData {
  name: string;
  aliases: string[];
  signatureColors: string[];
  designCues: string[];
  identificationTips: string[];
  recentColorways?: Array<{
    line: string;
    year: string;
    colors: string[];
  }>;
}

/**
 * Category-specific color vocabulary
 */
export interface ColorVocabulary {
  [genericColor: string]: string[];  // e.g., "black": ["stealth black", "carbon black"]
}

/**
 * Complete category knowledge file structure
 */
export interface CategoryKnowledge {
  category: string;
  colorVocabulary: ColorVocabulary;
  patternTypes?: string[];
  partTerminology?: {
    [productType: string]: string[];  // e.g., "driver": ["crown", "sole", "face"]
  };
  brands: BrandData[];
}

/**
 * Verbosity levels for context generation
 */
export type ContextVerbosity = 'minimal' | 'standard' | 'detailed';
