import { api } from '../client';

type RequestOptions = { signal?: AbortSignal };

// -- Response types --

export interface BagSummary {
  id: string;
  code: string;
  title: string;
  item_count: number;
  updated_at?: string;
}

export interface Bag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_complete?: boolean;
  completed_at?: string | null;
  hero_item_id: string | null;
  cover_photo_id: string | null;
  cover_photo_url: string | null;
  cover_photo_aspect: string | null;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  category?: string;
  tags?: string[];
  items?: any[];
}

export interface Section {
  id: string;
  name: string;
  description: string | null;
  sort_index: number;
  collapsed_by_default: boolean;
  bag_id: string;
  created_at: string;
  updated_at: string;
}

// -- API calls --

export function listMine(opts?: RequestOptions) {
  return api.get<{ bags: BagSummary[] }>('/api/user/bags', opts);
}

export function listForUser(handle: string, opts?: RequestOptions) {
  return api.get<Bag[]>(`/api/users/${handle}/bags`, opts);
}

export function create(data: { title: string; description?: string; is_public?: boolean }) {
  return api.post<Bag>('/api/bags', data);
}

export function get(code: string, opts?: RequestOptions) {
  return api.get<Bag>(`/api/bags/${code}`, opts);
}

export function update(code: string, data: Partial<Pick<Bag, 'title' | 'description' | 'is_public' | 'category' | 'hero_item_id'>>) {
  return api.put<Bag>(`/api/bags/${code}`, data);
}

export function del(code: string) {
  return api.del<void>(`/api/bags/${code}`);
}

// -- Items within a bag --

export function getItems(code: string, opts?: RequestOptions) {
  return api.get<{ items: any[] }>(`/api/bags/${code}/items`, opts);
}

export function addItem(code: string, data: {
  custom_name: string;
  custom_description?: string | null;
  notes?: string | null;
  quantity?: number;
  brand?: string | null;
  photo_url?: string | null;
}) {
  return api.post<any>(`/api/bags/${code}/items`, data);
}

export function reorderItems(code: string, items: { id: string; sort_index: number }[]) {
  return api.patch<void>(`/api/bags/${code}/items`, { items });
}

// -- Sections --

export function createSection(code: string, name: string) {
  return api.post<Section>(`/api/bags/${code}/sections`, { name });
}

export function updateSection(code: string, sectionId: string, name: string) {
  return api.put<Section>(`/api/bags/${code}/sections/${sectionId}`, { name });
}

export function deleteSection(code: string, sectionId: string) {
  return api.del<void>(`/api/bags/${code}/sections/${sectionId}`);
}

export function getSections(code: string, opts?: RequestOptions) {
  return api.get<Section[]>(`/api/bags/${code}/sections`, opts);
}

export function updateSections(code: string, sections: Section[]) {
  return api.put<void>(`/api/bags/${code}/sections`, sections);
}

// -- Cover photo --

export function uploadCoverPhoto(code: string, formData: FormData) {
  return api.post<{ mediaAssetId: string; url: string; aspectRatio: string }>(`/api/bags/${code}/cover-photo`, formData);
}

export function deleteCoverPhoto(code: string) {
  return api.del<void>(`/api/bags/${code}/cover-photo`);
}

// -- Bulk links --

export function saveBulkLinks(code: string, selections: any) {
  return api.post<any>(`/api/bags/${code}/bulk-links/save`, selections);
}

// -- Analysis --

export function analyze(code: string) {
  return api.post<any>(`/api/bags/${code}/analyze`);
}

export function complete(code: string) {
  return api.post<any>(`/api/bags/${code}/complete`);
}
