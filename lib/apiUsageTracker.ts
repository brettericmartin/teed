import { createClient } from '@supabase/supabase-js';

/**
 * OpenAI pricing per 1M tokens (as of December 2024)
 */
const OPENAI_PRICING = {
  'gpt-4o': {
    input: 2.50, // $2.50 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
  'gpt-4o-mini': {
    input: 0.15, // $0.15 per 1M input tokens
    output: 0.60, // $0.60 per 1M output tokens
  },
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-4': {
    input: 30.00,
    output: 60.00,
  },
} as const;

/**
 * Google Custom Search pricing
 * $5 per 1000 queries = $0.005 per query = 0.5 cents
 */
const GOOGLE_SEARCH_COST_CENTS = 0.5;

export type OperationType =
  | 'identify' // Product identification from image
  | 'enrich' // Product enrichment
  | 'search' // Product search
  | 'analyze' // URL/content analysis
  | 'generate' // Fun facts, descriptions
  | 'categorize' // Category detection
  | 'transcript'; // Transcript processing

export type ApiStatus = 'success' | 'error' | 'rate_limited';

export interface ApiUsageParams {
  userId: string | null;
  endpoint: string;
  model: string;
  operationType: OperationType;
  inputTokens?: number;
  outputTokens?: number;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  durationMs: number;
  status: ApiStatus;
  errorCode?: string;
  errorMessage?: string;
  sessionId?: string;
  bagId?: string;
  rateLimitRemaining?: number;
  rateLimitResetAt?: Date;
}

/**
 * Calculate cost in cents for a given model and token usage
 */
export function calculateCostCents(
  model: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): number {
  // Handle Google Search separately
  if (model === 'google-search' || model === 'google-custom-search') {
    return Math.round(GOOGLE_SEARCH_COST_CENTS);
  }

  // Find matching OpenAI model
  const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING];
  if (!pricing) {
    console.warn(`Unknown model for pricing: ${model}`);
    return 0;
  }

  // Calculate cost: (tokens / 1M) * price per 1M * 100 (to convert to cents)
  const inputCost = (inputTokens / 1_000_000) * pricing.input * 100;
  const outputCost = (outputTokens / 1_000_000) * pricing.output * 100;

  return Math.round(inputCost + outputCost);
}

/**
 * Get estimated tokens from response (if usage info is available)
 */
export function extractTokensFromResponse(response: {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}): { inputTokens: number; outputTokens: number } {
  return {
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
  };
}

/**
 * Track API usage to database
 */
export async function trackApiUsage(params: ApiUsageParams): Promise<void> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const costCents = calculateCostCents(
      params.model,
      params.inputTokens,
      params.outputTokens
    );

    await supabaseAdmin.from('api_usage').insert({
      user_id: params.userId,
      endpoint: params.endpoint,
      model: params.model,
      operation_type: params.operationType,
      input_tokens: params.inputTokens || 0,
      output_tokens: params.outputTokens || 0,
      estimated_cost_cents: costCents,
      request_size_bytes: params.requestSizeBytes,
      response_size_bytes: params.responseSizeBytes,
      duration_ms: params.durationMs,
      status: params.status,
      error_code: params.errorCode,
      error_message: params.errorMessage,
      session_id: params.sessionId,
      bag_id: params.bagId,
      rate_limit_remaining: params.rateLimitRemaining,
      rate_limit_reset_at: params.rateLimitResetAt?.toISOString(),
    });
  } catch (error) {
    // Log but don't fail - tracking should not break the main operation
    console.error('[API Usage Tracker] Failed to track:', error);
  }
}

/**
 * Higher-order function to wrap API calls with tracking
 */
export function withApiTracking<T>(
  userId: string | null,
  endpoint: string,
  model: string,
  operationType: OperationType,
  bagId?: string
) {
  return async (
    apiCall: () => Promise<{
      result: T;
      inputTokens?: number;
      outputTokens?: number;
    }>
  ): Promise<T> => {
    const startTime = Date.now();
    let status: ApiStatus = 'success';
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const response = await apiCall();
      inputTokens = response.inputTokens || 0;
      outputTokens = response.outputTokens || 0;
      return response.result;
    } catch (error: unknown) {
      status = 'error';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for rate limiting
        if (
          error.message.includes('rate_limit') ||
          error.message.includes('429')
        ) {
          status = 'rate_limited';
          errorCode = 'rate_limit_exceeded';
        }
      }
      throw error;
    } finally {
      const durationMs = Date.now() - startTime;

      // Track asynchronously - don't await
      trackApiUsage({
        userId,
        endpoint,
        model,
        operationType,
        inputTokens,
        outputTokens,
        durationMs,
        status,
        errorCode,
        errorMessage,
        bagId,
      }).catch(console.error);
    }
  };
}

/**
 * Simple tracking helper for when you don't need the wrapper pattern
 */
export async function trackSimpleApiCall(
  userId: string | null,
  endpoint: string,
  model: string,
  operationType: OperationType,
  options: {
    inputTokens?: number;
    outputTokens?: number;
    durationMs: number;
    status: ApiStatus;
    errorMessage?: string;
    bagId?: string;
  }
): Promise<void> {
  await trackApiUsage({
    userId,
    endpoint,
    model,
    operationType,
    ...options,
  });
}

/**
 * Get a summary of API costs for display
 */
export function formatCostDisplay(costCents: number): string {
  if (costCents < 100) {
    return `${costCents}¢`;
  }
  return `$${(costCents / 100).toFixed(2)}`;
}

/**
 * Estimate cost before making an API call
 */
export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): { cents: number; display: string } {
  const cents = calculateCostCents(model, estimatedInputTokens, estimatedOutputTokens);
  return {
    cents,
    display: formatCostDisplay(cents),
  };
}
