/**
 * Text Parsing Types
 *
 * Type definitions for the smart text parsing pipeline.
 */

import type { Category } from '@/lib/productLibrary/schema';

/**
 * A single extracted component from the user's input
 */
export interface ParsedComponent {
  type: 'brand' | 'product' | 'color' | 'size' | 'specification' | 'quantity' | 'price' | 'category_hint';
  value: string;
  confidence: number;
  source: 'dictionary' | 'pattern' | 'inference' | 'position';
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Price constraint extracted from text
 */
export interface PriceConstraint {
  type: 'max' | 'min' | 'range' | 'approximate';
  min?: number;
  max?: number;
  value?: number;
  originalText: string;
}

/**
 * Size information extracted from text
 */
export interface ExtractedSize {
  value: string;
  type: 'clothing' | 'shoe' | 'numeric' | 'generic';
  normalized?: string;
}

/**
 * Specification extracted from text (e.g., golf club specs)
 */
export interface ExtractedSpec {
  type: 'loft' | 'flex' | 'shaft' | 'hand' | 'length' | 'weight' | 'material' | 'generic';
  value: string;
  unit?: string;
  originalText: string;
}

/**
 * The complete result of parsing user text input
 */
export interface ParsedTextResult {
  // Original input
  originalInput: string;
  normalizedInput: string;

  // All extracted components
  components: ParsedComponent[];

  // Primary extractions (best match for each type)
  brand: { value: string; confidence: number; source: string } | null;
  productName: { value: string; confidence: number } | null;
  color: string | null;
  size: ExtractedSize | null;
  specifications: ExtractedSpec[];

  // Quantity and price
  quantity: number;
  priceConstraint: PriceConstraint | null;

  // Category inference
  inferredCategory: Category | null;
  categoryConfidence: number;

  // Overall parse quality
  parseConfidence: number;

  // Remaining unparsed text (potential product name)
  remainingText: string;

  // Debug info
  parseTimeMs: number;
  stagesRun: string[];
}

/**
 * Options for the text parsing pipeline
 */
export interface ParseOptions {
  // Category hint to guide parsing (e.g., user is in a "golf" bag)
  categoryHint?: Category;

  // Skip certain stages
  skipBrandDetection?: boolean;
  skipSpecExtraction?: boolean;

  // Minimum confidence to accept a brand match
  minBrandConfidence?: number;
}

/**
 * Result of the normalize stage
 */
export interface NormalizeResult {
  normalizedText: string;
  quantity: number;
  priceConstraint: PriceConstraint | null;
  extractedComponents: ParsedComponent[];
}

/**
 * Result of the pattern extraction stage
 */
export interface PatternExtractResult {
  extractedSpecs: ExtractedSpec[];
  extractedSize: ExtractedSize | null;
  extractedColor: string | null;
  extractedComponents: ParsedComponent[];
  remainingText: string;
}

/**
 * Result of the dictionary match stage
 */
export interface DictionaryMatchResult {
  brand: { value: string; confidence: number; source: string } | null;
  inferredCategory: Category | null;
  categoryConfidence: number;
  extractedComponents: ParsedComponent[];
  remainingText: string;
}

/**
 * Result of the product inference stage
 */
export interface ProductInferenceResult {
  productName: { value: string; confidence: number } | null;
  refinedCategory: Category | null;
  extractedComponents: ParsedComponent[];
}

/**
 * Known brand entry with metadata
 */
export interface BrandEntry {
  name: string;
  normalizedName: string;
  aliases: string[];
  category: Category;
  tier?: 'luxury' | 'premium' | 'mid' | 'value';
}
