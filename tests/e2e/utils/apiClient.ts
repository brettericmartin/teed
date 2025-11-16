import { APIRequestContext, expect } from '@playwright/test';

/**
 * API Client for direct API testing
 * Faster and more reliable than UI testing for backend verification
 */

export class TeedAPIClient {
  constructor(
    private request: APIRequestContext,
    private baseURL: string = 'http://localhost:3000'
  ) {}

  private token: string | null = null;

  /**
   * Authenticate and get access token
   */
  async login(email: string, password: string): Promise<string> {
    // Use Supabase client directly for auth
    const response = await this.request.post(`${this.baseURL}/api/auth/session`, {
      data: { email, password },
    });

    // For now, we'll get the token from the scripts approach
    // In production, you'd extract it from cookies or response
    this.token = 'will-use-bearer-token';
    return this.token;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Get headers with authentication
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  // === BAG OPERATIONS ===

  async createBag(data: {
    title: string;
    description?: string;
    is_public?: boolean;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/bags`, {
      headers: this.getHeaders(),
      data,
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getBag(code: string) {
    const response = await this.request.get(`${this.baseURL}/api/bags/${code}`, {
      headers: this.getHeaders(),
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updateBag(
    code: string,
    data: {
      title?: string;
      description?: string;
      is_public?: boolean;
    }
  ) {
    const response = await this.request.put(`${this.baseURL}/api/bags/${code}`, {
      headers: this.getHeaders(),
      data,
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteBag(code: string) {
    const response = await this.request.delete(`${this.baseURL}/api/bags/${code}`, {
      headers: this.getHeaders(),
    });
    expect(response.ok()).toBeTruthy();
  }

  // === ITEM OPERATIONS ===

  async createItem(
    bagCode: string,
    data: {
      custom_name: string;
      custom_description?: string;
      notes?: string;
      quantity?: number;
    }
  ) {
    const response = await this.request.post(
      `${this.baseURL}/api/bags/${bagCode}/items`,
      {
        headers: this.getHeaders(),
        data,
      }
    );
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updateItem(
    itemId: string,
    data: {
      custom_name?: string;
      custom_description?: string;
      notes?: string;
      quantity?: number;
    }
  ) {
    const response = await this.request.put(`${this.baseURL}/api/items/${itemId}`, {
      headers: this.getHeaders(),
      data,
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteItem(itemId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/items/${itemId}`, {
      headers: this.getHeaders(),
    });
    expect(response.ok()).toBeTruthy();
  }

  // === LINK OPERATIONS ===

  async createLink(
    itemId: string,
    data: {
      url: string;
      kind: string;
      label?: string;
    }
  ) {
    const response = await this.request.post(
      `${this.baseURL}/api/items/${itemId}/links`,
      {
        headers: this.getHeaders(),
        data,
      }
    );
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async updateLink(
    linkId: string,
    data: {
      url?: string;
      kind?: string;
      label?: string;
    }
  ) {
    const response = await this.request.put(`${this.baseURL}/api/links/${linkId}`, {
      headers: this.getHeaders(),
      data,
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteLink(linkId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/links/${linkId}`, {
      headers: this.getHeaders(),
    });
    expect(response.ok()).toBeTruthy();
  }

  // === PUBLIC ACCESS ===

  async getPublicBag(code: string) {
    const response = await this.request.get(`${this.baseURL}/c/${code}`);
    return {
      status: response.status(),
      ok: response.ok(),
      html: await response.text(),
    };
  }

  // === HELPER METHODS ===

  /**
   * Create a complete bag with items and links for testing
   */
  async createCompleteBag(options: {
    title: string;
    itemCount?: number;
    linksPerItem?: number;
    isPublic?: boolean;
  }) {
    // Create bag
    const bag = await this.createBag({
      title: options.title,
      description: 'Test bag created by API',
      is_public: options.isPublic || false,
    });

    const items = [];
    const itemCount = options.itemCount || 2;
    const linksPerItem = options.linksPerItem || 1;

    // Create items
    for (let i = 0; i < itemCount; i++) {
      const item = await this.createItem(bag.code, {
        custom_name: `Test Item ${i + 1}`,
        custom_description: `Description for item ${i + 1}`,
        quantity: 1,
      });

      // Create links for each item
      const links = [];
      for (let j = 0; j < linksPerItem; j++) {
        const link = await this.createLink(item.id, {
          url: `https://example.com/product-${i}-${j}`,
          kind: 'product',
        });
        links.push(link);
      }

      items.push({ ...item, links });
    }

    return { bag, items };
  }

  /**
   * Cleanup - delete a bag and all its contents
   */
  async cleanup(bagCode: string) {
    try {
      await this.deleteBag(bagCode);
    } catch (e) {
      // Ignore errors during cleanup
      console.log(`Cleanup failed for bag ${bagCode}:`, e);
    }
  }
}

/**
 * Create API client instance
 */
export function createAPIClient(request: APIRequestContext, token?: string): TeedAPIClient {
  const client = new TeedAPIClient(request);
  if (token) {
    client.setToken(token);
  }
  return client;
}
