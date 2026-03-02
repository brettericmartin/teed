import { enumerateItems } from './enumerate';
import { cropItems } from './crop';
import { visualSearchItems } from './visualSearch';
import { identifyItems } from './identify';
import { validateItems } from './validate';
import type {
  PipelineResult,
  PipelineOptions,
  StageTimings,
  ValidatedItem,
  IdentifiedProductCompat,
} from './types';
import { toIdentifiedProductCompat } from './types';

export type { PipelineResult, PipelineOptions, IdentifiedProductCompat };
export { toIdentifiedProductCompat };

/**
 * Main orchestrator: 5-stage vision pipeline.
 *
 * 1. Enumerate: Detect all items + bounding boxes (Gemini 2.5 Flash)
 * 2. Crop: Extract each item region (sharp)
 * 3. Visual Search: Reverse image search via Cloud Vision webDetection
 * 4. Identify: Identify each crop (GPT-4o + web hints, parallel)
 * 5. Validate: Compare against reference images (GPT-4o, parallel)
 *
 * Returns partial results if pipeline exceeds 60s timeout.
 */
export async function identifyItemsInPhoto(
  imageBase64: string,
  options?: PipelineOptions
): Promise<PipelineResult> {
  const startTime = Date.now();
  const timings: StageTimings = {
    enumerate: 0,
    crop: 0,
    visualSearch: 0,
    identify: 0,
    validate: 0,
    total: 0,
  };

  let partial = false;

  // === Stage 1: Enumerate ===
  const t1 = Date.now();
  console.log('[pipeline] Stage 1: Enumerating items...');
  let enumerated = await enumerateItems(imageBase64);
  timings.enumerate = Date.now() - t1;
  console.log(`[pipeline] Found ${enumerated.length} items in ${timings.enumerate}ms`);

  // Apply maxItems limit
  if (options?.maxItems && enumerated.length > options.maxItems) {
    enumerated = enumerated.slice(0, options.maxItems);
  }

  const totalDetected = enumerated.length;

  // === Stage 2: Crop ===
  const t2 = Date.now();
  console.log('[pipeline] Stage 2: Cropping items...');
  const cropped = await cropItems(imageBase64, enumerated);
  timings.crop = Date.now() - t2;
  console.log(`[pipeline] Cropped ${cropped.length}/${totalDetected} items in ${timings.crop}ms`);

  // === Stage 3: Visual Search ===
  const t3 = Date.now();
  console.log('[pipeline] Stage 3: Visual search (web detection)...');
  const searched = await visualSearchItems(cropped);
  timings.visualSearch = Date.now() - t3;
  const withResults = searched.filter((s) => s.webDetection !== null).length;
  console.log(`[pipeline] Web detection returned results for ${withResults}/${cropped.length} items in ${timings.visualSearch}ms`);

  // === Stage 4: Identify ===
  const t4 = Date.now();
  console.log('[pipeline] Stage 4: Identifying items...');
  const identified = await identifyItems(searched, options?.bagType);
  timings.identify = Date.now() - t4;
  const identifiedCount = identified.filter((i) => i.confidence > 0).length;
  console.log(`[pipeline] Identified ${identifiedCount}/${cropped.length} items in ${timings.identify}ms`);

  // Check timeout before validation
  const elapsed = Date.now() - startTime;
  if (!options?.noTimeout && elapsed > 55000) {
    console.warn('[pipeline] Approaching timeout, skipping validation');
    partial = true;
  }

  // === Stage 5: Validate ===
  let validated: ValidatedItem[];
  if (options?.skipValidation || partial) {
    // Skip validation — wrap identified items with unverified status
    validated = identified.map((item) => ({
      ...item,
      validation: {
        verdict: 'unverified' as const,
        confidence: 0,
        discrepancies: [],
        suggestedCorrection: null,
        referenceImageUrl: null,
      },
    }));
    timings.validate = 0;
  } else {
    const t5 = Date.now();
    console.log('[pipeline] Stage 5: Validating identifications...');
    validated = await validateItems(identified, options?.bagType);
    timings.validate = Date.now() - t5;
    console.log(`[pipeline] Validated in ${timings.validate}ms`);
  }

  timings.total = Date.now() - startTime;
  const totalVerified = validated.filter((v) => v.validation.verdict === 'verified').length;

  console.log(`[pipeline] Complete: ${totalDetected} detected, ${identifiedCount} identified, ${totalVerified} verified in ${timings.total}ms`);

  return {
    items: validated,
    stats: {
      totalDetected,
      totalIdentified: identifiedCount,
      totalVerified,
      stageTimings: timings,
      partial,
    },
  };
}
