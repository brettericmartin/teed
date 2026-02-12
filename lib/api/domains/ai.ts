import { api } from '../client';

type RequestOptions = { signal?: AbortSignal };

// -- Response types --

export interface EnrichItemResponse {
  suggestions: any;
  questions?: any;
  clarificationNeeded?: boolean;
  searchTier?: string;
}

export interface DetectObjectsResponse {
  success: boolean;
  result: any;
  error?: string;
}

export interface IdentifyProductsV2Response {
  success: boolean;
  products: any[];
  error?: string;
}

export interface EnrichProductsV2Response {
  success: boolean;
  products: any[];
  error?: string;
}

export interface FindProductImageResponse {
  images: any[];
}

// -- API calls --

export function enrichItem(data: {
  userInput: string;
  bagContext?: string;
  existingAnswers?: any;
  forceAI?: boolean;
  categoryHint?: string;
}, opts?: RequestOptions) {
  return api.post<EnrichItemResponse>('/api/ai/enrich-item', data, opts);
}

export function findProductImage(data: { query?: string; productName?: string; brandName?: string }) {
  return api.post<FindProductImageResponse>('/api/ai/find-product-image', data);
}

export function enhanceSearchQuery(data: { description: string; productName?: string; brand?: string }) {
  return api.post<{ query: string }>('/api/ai/enhance-search-query', data);
}

export function generateBagDescription(data: { bagCode: string; type: string }) {
  return api.post<{ description: string }>('/api/ai/generate-bag-description', data);
}

export function detectObjects(data: {
  imageBase64?: string;
  imageUrl?: string;
  textHint?: string;
}, opts?: RequestOptions) {
  return api.post<DetectObjectsResponse>('/api/ai/detect-objects', data, opts);
}

export function identifyProductsV2(data: {
  imageBase64?: string;
  imageUrl?: string;
  validatedObjects: any[];
  userContext?: string;
  productHints?: any;
}) {
  return api.post<IdentifyProductsV2Response>('/api/ai/identify-products-v2', data);
}

export function enrichProductsV2(data: { products: any[]; yearAware?: boolean }) {
  return api.post<EnrichProductsV2Response>('/api/ai/enrich-products-v2', data);
}

export function validateMatch(data: { sourceImage: any; enrichedProduct: any }) {
  return api.post<{ validation: any }>('/api/ai/validate-match', data);
}

export function storeCorrection(data: { correction: any; finalProduct: any; sourceImage: any }) {
  api.fire('/api/ai/store-correction', data);
}

export function identifyProducts(data: any) {
  return api.post<any>('/api/ai/identify-products', data);
}

export function identifyFromImage(formData: FormData) {
  return api.post<any>('/api/ai/identify-from-image', formData);
}

export function analyzeProductUrl(url: string) {
  return api.post<any>('/api/ai/analyze-product-url', { url });
}
