/**
 * Identification Telemetry - Client-Safe Module
 *
 * Tracks identification outcomes to enable data-driven threshold optimization.
 *
 * This module is client-safe. Storage happens via API route.
 * See: /api/analytics/identification/route.ts
 */

// Types for telemetry events
export type IdentificationInputType = 'url' | 'text';
export type IdentificationStage =
  | 'library_cache'      // Stage 0
  | 'url_intelligence'   // Stage 1
  | 'lightweight_fetch'  // Stage 2
  | 'amazon_lookup'      // Stage 2.5
  | 'firecrawl'          // Stage 2.6
  | 'jina_reader'        // Stage 2.6 fallback
  | 'google_images'      // Stage 2.7
  | 'ai_semantic'        // Stage 3
  | 'text_parsing'       // Text pipeline
  | 'ai_enrichment'      // AI enrichment
  | 'fallback';          // Fallback tier

export type UserAction =
  | 'accepted'           // User selected the suggestion
  | 'corrected'          // User edited before accepting
  | 'rejected'           // User clicked "None of these"
  | 'manual_entry'       // User chose to add manually
  | 'abandoned';         // User left without action

export interface IdentificationEvent {
  sessionId: string;
  inputType: IdentificationInputType;
  inputValue: string;            // URL or text (truncated/hashed for privacy)
  stageReached: IdentificationStage;
  confidenceReturned: number;
  suggestionsCount: number;
  userAction: UserAction;
  correctedFields?: string[];    // ['brand', 'name', 'color', 'category']
  timeToDecisionMs: number;      // Time from results shown to user action
  metadata?: Record<string, unknown>;
}

export interface IdentificationSession {
  id: string;
  startedAt: number;
  inputType: IdentificationInputType;
  inputValue: string;
}

// In-memory session tracking (for client-side timing)
const activeSessions = new Map<string, IdentificationSession>();

/**
 * Truncate input for privacy (don't store full URLs or text)
 */
function truncateForPrivacy(input: string): string {
  if (input.length <= 100) return input;

  // For URLs, keep domain and first part of path
  if (input.startsWith('http')) {
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split('/').filter(Boolean);
      return `${url.hostname}/${pathParts.slice(0, 2).join('/')}...`;
    } catch {
      // Not a valid URL
    }
  }

  // For text, keep first 100 chars
  return input.slice(0, 100) + '...';
}

/**
 * Start tracking an identification session
 */
export function startIdentificationSession(
  inputType: IdentificationInputType,
  inputValue: string
): string {
  const sessionId = `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  activeSessions.set(sessionId, {
    id: sessionId,
    startedAt: Date.now(),
    inputType,
    inputValue: truncateForPrivacy(inputValue),
  });

  return sessionId;
}

/**
 * Record the outcome of an identification session
 * Sends to API route for storage
 */
export async function recordIdentificationOutcome(
  sessionId: string,
  stage: IdentificationStage,
  confidence: number,
  suggestionsCount: number,
  userAction: UserAction,
  correctedFields?: string[],
  metadata?: Record<string, unknown>
): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.warn('[Telemetry] Session not found:', sessionId);
    return;
  }

  const timeToDecisionMs = Date.now() - session.startedAt;

  const event: IdentificationEvent = {
    sessionId,
    inputType: session.inputType,
    inputValue: session.inputValue,
    stageReached: stage,
    confidenceReturned: confidence,
    suggestionsCount,
    userAction,
    correctedFields,
    timeToDecisionMs,
    metadata,
  };

  // Clean up session
  activeSessions.delete(sessionId);

  // Store via API (fire and forget)
  try {
    fetch('/api/analytics/identification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(err => {
      console.error('[Telemetry] Failed to store event:', err);
    });
  } catch (err) {
    console.error('[Telemetry] Failed to send event:', err);
  }
}

/**
 * Confidence level helper for UI
 * Pure function - safe for client-side use
 */
export function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low' | 'minimal';
  label: string;
  description: string;
  color: string;
} {
  if (confidence >= 0.90) {
    return {
      level: 'high',
      label: 'Identified',
      description: 'High confidence match',
      color: 'text-emerald-600 bg-emerald-50',
    };
  }
  if (confidence >= 0.75) {
    return {
      level: 'medium',
      label: 'Best match',
      description: 'Good match - verify details',
      color: 'text-blue-600 bg-blue-50',
    };
  }
  if (confidence >= 0.50) {
    return {
      level: 'low',
      label: 'Possible match',
      description: 'Verify details before adding',
      color: 'text-amber-600 bg-amber-50',
    };
  }
  return {
    level: 'minimal',
    label: 'Best guess',
    description: 'Manual entry recommended',
    color: 'text-gray-600 bg-gray-100',
  };
}
