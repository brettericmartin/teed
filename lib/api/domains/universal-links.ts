import { api } from '../client';
import type { UniversalLinkSaveRequest, UniversalLinkSaveResponse } from '@/lib/types/universalLink';

// The wrappers used to declare shapes the routes never accepted ({ url } for process,
// { url, destination } for save), so every caller 400'd or 403'd. They now mirror the routes.

/** Classify and enrich one or more pasted URLs (SSE stream on the route; `urls` is what it reads). */
export function process(urls: string[]) {
  return api.post<any>('/api/universal-links/process', { urls });
}

/** Save embeds, social links and products in one call. `profileId` must be the signed-in user's id. */
export function save(data: UniversalLinkSaveRequest) {
  return api.post<UniversalLinkSaveResponse>('/api/universal-links/save', data);
}
