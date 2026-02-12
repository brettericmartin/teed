import { api } from '../client';

export function track(event: string, data?: Record<string, any>) {
  api.fire('/api/analytics/track', { event, ...data });
}

export function getBagAnalytics(bagId: string) {
  return api.get<any>(`/api/analytics/bags/${bagId}`);
}
