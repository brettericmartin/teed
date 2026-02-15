// Types for SSE streaming in bulk text import

import type { ParsedTextResult } from '@/lib/textParsing';

// Structured input for the "From Text" workflow
export interface StructuredTextInput {
  brand?: string;
  productName: string;
  color?: string;
}

export type TextProcessingStage =
  | 'parsing'    // Text parsing (instant)
  | 'searching'  // Library search (~100ms)
  | 'enriching'  // AI enrichment (~2s)
  | 'linking'    // Finding purchase links (~2s)
  | 'imaging';   // Image discovery (~1s)

export const TEXT_STAGE_CONFIG: Record<TextProcessingStage, { label: string; icon: string; order: number }> = {
  parsing: { label: 'Parsing text', icon: '📝', order: 0 },
  searching: { label: 'Searching library', icon: '📚', order: 1 },
  enriching: { label: 'AI identifying', icon: '🧠', order: 2 },
  linking: { label: 'Finding links', icon: '🔗', order: 3 },
  imaging: { label: 'Finding photos', icon: '📷', order: 4 },
};

export function getTextStageOrder(stage: TextProcessingStage): number {
  return TEXT_STAGE_CONFIG[stage].order;
}

// Stream event types
export interface TextItemStartedEvent {
  type: 'item_started';
  index: number;
  rawText: string;
}

export interface TextItemStageUpdateEvent {
  type: 'item_stage_update';
  index: number;
  stage: TextProcessingStage;
}

export interface TextItemCompletedEvent {
  type: 'item_completed';
  index: number;
  result: ProcessedTextItem;
}

export interface TextBatchProgressEvent {
  type: 'batch_progress';
  completed: number;
  total: number;
}

export interface TextCompleteEvent {
  type: 'complete';
  summary: TextBatchSummary;
}

export interface TextErrorEvent {
  type: 'error';
  message: string;
}

export type BulkTextStreamEvent =
  | TextItemStartedEvent
  | TextItemStageUpdateEvent
  | TextItemCompletedEvent
  | TextBatchProgressEvent
  | TextCompleteEvent
  | TextErrorEvent;

// Result for a processed text item
export interface ProcessedTextItem {
  index: number;
  originalText: string;
  status: 'success' | 'partial' | 'failed';
  error?: string;

  // Parsed components
  parsed: ParsedTextResult;

  // Suggestions from AI/Library
  suggestions: Array<{
    brand: string;
    productName: string;
    description: string;
    category: string;
    confidence: number;
    imageUrl?: string;
    productUrl?: string;
    source: 'library' | 'ai' | 'web';
  }>;

  // Best match (first suggestion)
  suggestedItem: {
    custom_name: string;
    brand: string;
    custom_description: string;
  };

  // Photo options
  photoOptions: Array<{
    url: string;
    source: 'suggestion' | 'search';
    isPrimary: boolean;
  }>;

  // Purchase link (from SmartLinkFinder)
  linkUrl?: string;
  linkLabel?: string;
  linkSource?: string;

  // Metadata
  searchTier: string;
  confidence: number;
}

// Batch summary
export interface TextBatchSummary {
  total: number;
  successful: number;
  partial: number;
  failed: number;
  processingTimeMs: number;
}

// Confirmed item sent back for enhancement pass
export interface ValidatedItemInput {
  index: number;
  name: string;        // User-confirmed product name
  brand: string;       // User-confirmed brand
  description?: string;
  category?: string;
}

// Stage subsets for each SSE pass
export type IdentifyStage = 'parsing' | 'searching' | 'enriching';
export type EnhanceStage = 'linking' | 'imaging';

// Client-side streaming item state
export interface TextStreamingItem {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: TextProcessingStage;
  result?: ProcessedTextItem;
  rawText: string;
}
