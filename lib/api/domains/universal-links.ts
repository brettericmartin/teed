import { api } from '../client';

export function process(url: string) {
  return api.post<any>('/api/universal-links/process', { url });
}

export function save(data: {
  url?: string;
  destination?: { type: string; bagId?: string };
  [key: string]: any;
}) {
  return api.post<{
    success: boolean;
    embedsAdded?: number;
    socialLinksAdded?: number;
    productsAdded?: number;
    newBagCode?: string;
    errors?: string[];
  }>('/api/universal-links/save', data);
}
