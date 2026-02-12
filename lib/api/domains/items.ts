import { api } from '../client';

// -- Response types --

export interface MoveResult {
  success: boolean;
  item: any;
  sourceBagId: string;
  targetBagId: string;
  targetBagTitle: string;
  message?: string;
}

export interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
  is_auto_generated?: boolean;
  created_at?: string;
}

export interface EnrichmentResult {
  detailsEnriched: number;
  linksAdded: number;
}

// -- API calls --

export function get(id: string) {
  return api.get<any>(`/api/items/${id}`);
}

export function update(id: string, data: Record<string, any>) {
  return api.put<any>(`/api/items/${id}`, data);
}

export function del(id: string) {
  return api.del<void>(`/api/items/${id}`);
}

export function moveToBag(id: string, targetBagId: string) {
  return api.post<MoveResult>(`/api/items/${id}/move-to-bag`, { target_bag_id: targetBagId });
}

// -- Links --

export function getLinks(id: string) {
  return api.get<ItemLink[]>(`/api/items/${id}/links`);
}

export function addLink(id: string, data: { url: string; kind: string; label?: string; is_auto_generated?: boolean }) {
  return api.post<ItemLink>(`/api/items/${id}/links`, data);
}

export function updateLink(linkId: string, data: { url: string; kind: string }) {
  return api.put<ItemLink>(`/api/links/${linkId}`, data);
}

export function deleteLink(linkId: string) {
  return api.del<void>(`/api/links/${linkId}`);
}

export function findLink(id: string) {
  return api.post<{ recommendations: Array<{ url: string; source: string; reason: string; label: string; priority: number; affiliatable: boolean }> }>(`/api/items/${id}/find-link`);
}

// -- Batch operations --

export function fillInfo(itemIds: string[]) {
  return api.post<any>('/api/items/fill-info', { itemIds });
}

export function fillLinks(itemIds: string[]) {
  return api.post<any>('/api/items/fill-links', { itemIds });
}

export function previewEnrichment(bagId: string, itemIds: string[]) {
  return api.post<{ suggestions: any[] }>('/api/items/preview-enrichment', { bagId, itemIds });
}

export function applyEnrichment(data: { bagId: string; approvedSuggestions: any[] }) {
  return api.post<EnrichmentResult>('/api/items/apply-enrichment', data);
}

export function copyToBag(data: { target_bag_code: string; source_item: any }) {
  return api.post<void>('/api/items/copy-to-bag', data);
}
