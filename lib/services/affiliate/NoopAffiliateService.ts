/**
 * No-Op Affiliate Service
 *
 * Returns original URLs unchanged
 * Used when affiliate features are disabled
 */

import {
  AffiliateService,
  AffiliateUrlRequest,
  AffiliateUrlResponse,
} from '@/lib/types/affiliate';

export class NoopAffiliateService implements AffiliateService {
  async getAffiliateUrl(
    request: AffiliateUrlRequest
  ): Promise<AffiliateUrlResponse> {
    return {
      affiliateUrl: request.rawUrl,
      provider: 'none',
      cached: false,
    };
  }

  supportsUrl(_url: string): boolean {
    // Accepts all URLs but does nothing with them
    return true;
  }

  getName(): string {
    return 'NoopAffiliateService';
  }
}
