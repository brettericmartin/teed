/**
 * Correction Tracking - Client-Safe Module
 *
 * Tracks when users correct identification results.
 * Used to improve future identifications of the same input.
 */

export interface IdentificationCorrection {
  inputType: 'url' | 'text';
  inputValue: string;

  // Original identification result
  originalBrand: string | null;
  originalName: string | null;
  originalCategory: string | null;
  originalConfidence: number;

  // User's correction
  correctedBrand: string | null;
  correctedName: string | null;
  correctedCategory: string | null;

  // Which fields were changed
  correctedFields: string[];
}

/**
 * Detect which fields were corrected
 */
export function detectCorrectedFields(
  original: { brand?: string | null; name?: string | null; category?: string | null },
  corrected: { brand?: string | null; name?: string | null; category?: string | null }
): string[] {
  const fields: string[] = [];

  if (normalize(original.brand) !== normalize(corrected.brand)) {
    fields.push('brand');
  }
  if (normalize(original.name) !== normalize(corrected.name)) {
    fields.push('name');
  }
  if (normalize(original.category) !== normalize(corrected.category)) {
    fields.push('category');
  }

  return fields;
}

function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

/**
 * Record a user correction
 * Sends to API route for storage
 */
export async function recordCorrection(correction: IdentificationCorrection): Promise<void> {
  try {
    await fetch('/api/analytics/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(correction),
    });
  } catch (err) {
    console.error('[CorrectionTracking] Failed to record correction:', err);
  }
}

/**
 * Check if there's a previous correction for this input
 * Returns the corrected values if found
 */
export async function getPreviousCorrection(
  inputType: 'url' | 'text',
  inputValue: string
): Promise<{
  brand: string | null;
  name: string | null;
  category: string | null;
} | null> {
  try {
    const response = await fetch(`/api/analytics/corrections?type=${inputType}&value=${encodeURIComponent(inputValue)}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.correction || null;
  } catch (err) {
    console.error('[CorrectionTracking] Failed to get previous correction:', err);
    return null;
  }
}
