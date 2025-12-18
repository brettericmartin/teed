'use client';

import { useState, useCallback } from 'react';
import type {
  SingleItemIdentificationResult,
  IdentifySingleItemRequest,
  IdentifySingleItemResponse
} from './types';

/**
 * Hook for quick single-item identification
 *
 * Usage:
 * ```tsx
 * const { identify, isLoading, result, error, reset } = useQuickIdentify();
 *
 * // Identify an item
 * await identify({ imageBase64: croppedImage, categoryHint: 'golf' });
 *
 * // Access results
 * if (result) {
 *   console.log(result.guesses[0].name);
 * }
 * ```
 */

interface UseQuickIdentifyState {
  isLoading: boolean;
  result: SingleItemIdentificationResult | null;
  error: string | null;
}

interface UseQuickIdentifyReturn extends UseQuickIdentifyState {
  identify: (request: IdentifySingleItemRequest) => Promise<SingleItemIdentificationResult>;
  reset: () => void;
}

export function useQuickIdentify(): UseQuickIdentifyReturn {
  const [state, setState] = useState<UseQuickIdentifyState>({
    isLoading: false,
    result: null,
    error: null
  });

  const identify = useCallback(async (request: IdentifySingleItemRequest): Promise<SingleItemIdentificationResult> => {
    setState({ isLoading: true, result: null, error: null });

    try {
      const response = await fetch('/api/ai/identify-single-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data: IdentifySingleItemResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to identify item';
        setState({ isLoading: false, result: null, error: errorMessage });
        throw new Error(errorMessage);
      }

      if (!data.result) {
        const errorMessage = 'No result returned from identification';
        setState({ isLoading: false, result: null, error: errorMessage });
        throw new Error(errorMessage);
      }

      setState({ isLoading: false, result: data.result, error: null });
      return data.result;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to identify item';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: prev.error || errorMessage
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, result: null, error: null });
  }, []);

  return {
    ...state,
    identify,
    reset
  };
}
