import { api } from '../client';

export function getStatus(profileId: string) {
  return api.get<{ isFollowing: boolean }>(`/api/follows/${profileId}`);
}

export function getCounts(profileId: string) {
  return api.get<{ followers: number; following: number }>(`/api/follows/counts/${profileId}`);
}

export function follow(followingId: string) {
  return api.post<void>('/api/follows', { following_id: followingId });
}

export function unfollow(profileId: string) {
  return api.del<void>(`/api/follows/${profileId}`);
}
