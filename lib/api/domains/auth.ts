import { api } from '../client';

export interface SessionResponse {
  user: any | null;
  profile: {
    handle: string;
    display_name: string;
  } | null;
  profileMissing?: boolean;
}

export function getSession() {
  return api.get<SessionResponse>('/api/auth/session');
}

export function signOut() {
  return api.post<void>('/api/auth/signout');
}
