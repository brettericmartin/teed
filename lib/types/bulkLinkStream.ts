// Types for SSE streaming in bulk link import

export type ProcessingStage =
  | 'parsing'    // URL intelligence (instant)
  | 'fetching'   // Lightweight fetch (~1s)
  | 'detecting'  // Bot detection check
  | 'scraping'   // Firecrawl/Jina fallback (~2-3s)
  | 'analyzing'  // AI analysis (~2s)
  | 'imaging';   // Image discovery (~1s)

export const STAGE_CONFIG: Record<ProcessingStage, { label: string; icon: string; order: number }> = {
  parsing: { label: 'Reading URL', icon: '🔗', order: 0 },
  fetching: { label: 'Fetching page', icon: '📄', order: 1 },
  detecting: { label: 'Checking access', icon: '🔍', order: 2 },
  scraping: { label: 'Scraping content', icon: '🌐', order: 3 },
  analyzing: { label: 'AI analyzing', icon: '🧠', order: 4 },
  imaging: { label: 'Finding photos', icon: '📷', order: 5 },
};

export function getStageOrder(stage: ProcessingStage): number {
  return STAGE_CONFIG[stage].order;
}

// Stream event types
export interface UrlStartedEvent {
  type: 'url_started';
  index: number;
  url: string;
}

export interface UrlStageUpdateEvent {
  type: 'url_stage_update';
  index: number;
  stage: ProcessingStage;
}

export interface UrlCompletedEvent {
  type: 'url_completed';
  index: number;
  result: StreamedLinkResult;
}

export interface BatchProgressEvent {
  type: 'batch_progress';
  completed: number;
  total: number;
}

export interface CompleteEvent {
  type: 'complete';
  summary: {
    total: number;
    successful: number;
    partial: number;
    failed: number;
    processingTimeMs: number;
  };
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type BulkLinkStreamEvent =
  | UrlStartedEvent
  | UrlStageUpdateEvent
  | UrlCompletedEvent
  | BatchProgressEvent
  | CompleteEvent
  | ErrorEvent;

// Simplified result type for streaming (matches what the modal needs)
export interface StreamedLinkResult {
  index: number;
  originalUrl: string;
  resolvedUrl: string;
  status: 'success' | 'partial' | 'failed';
  error?: string;
  scraped: {
    title: string | null;
    description: string | null;
    brand: string | null;
    price: string | null;
    image: string | null;
    domain: string;
  } | null;
  analysis: {
    brand: string | null;
    productName: string | null;
    category: string | null;
    specs: string[];
    confidence: number;
  } | null;
  photoOptions: Array<{
    url: string;
    source: 'og' | 'meta' | 'json-ld' | 'google';
    isPrimary: boolean;
  }>;
  suggestedItem: {
    custom_name: string;
    brand: string;
    custom_description: string;
  };
}

// Client-side streaming item state
export interface StreamingItem {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: ProcessingStage;
  result?: StreamedLinkResult;
  url: string;
}
