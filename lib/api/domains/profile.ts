import { api } from '../client';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function get() {
  return api.get<Profile>('/api/profile');
}

export function update(data: { display_name?: string; handle?: string; bio?: string; social_links?: Record<string, string> }) {
  return api.patch<Profile>('/api/profile', data);
}

export function updateTheme(data: Record<string, any>) {
  return api.put<void>('/api/profile/theme', data);
}

export function checkHandle(handle: string) {
  return api.get<{ available: boolean; error?: string }>(`/api/profile/handle-available/${handle}`);
}

export function uploadAvatar(formData: FormData) {
  return api.post<{ profile: Profile; avatar_url: string; error?: string }>('/api/profile/avatar', formData);
}

export function removeAvatar() {
  return api.del<{ profile: Profile; error?: string }>('/api/profile/avatar');
}
