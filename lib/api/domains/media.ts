import { api } from '../client';

export interface UploadResult {
  mediaAssetId: string;
  url: string;
  error?: string;
}

export function upload(formData: FormData) {
  return api.post<UploadResult>('/api/media/upload', formData);
}

export function uploadFromUrl(data: { imageUrl: string; itemId: string; filename?: string; existingMediaAssetId?: string }) {
  return api.post<UploadResult>('/api/media/upload-from-url', data);
}
