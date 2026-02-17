import { NextResponse } from 'next/server';
import { v1Headers } from '@/lib/api/rateLimit';

/**
 * GET /api/v1/openapi.json
 *
 * OpenAPI 3.1.0 spec for the public context API.
 * This is referenced by /.well-known/ai-plugin.json.
 */
export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Teed Product Context API',
      description:
        'Public API for accessing real-world product context from curators on Teed. Find out why people chose products, what they pair them with, and what alternatives they considered.',
      version: '1.0.0',
      contact: {
        name: 'Teed',
        url: 'https://teed.club',
      },
    },
    servers: [{ url: 'https://teed.club/api/v1' }],
    paths: {
      '/products/search': {
        get: {
          operationId: 'searchProducts',
          summary: 'Search for products with curator context',
          description:
            'Search across all public bags to find products. Returns why curators chose them, what they compared against, alternatives considered, and which bags contain them.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Product name, brand, or keyword to search for',
              example: 'Sony A7IV',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 50 },
              description: 'Maximum results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Product search results with curator context',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      query: { type: 'string' },
                      total: { type: 'integer' },
                      stats: {
                        type: 'object',
                        properties: {
                          bags_containing: { type: 'integer' },
                          curators: { type: 'integer' },
                          with_why_chosen: { type: 'integer' },
                        },
                      },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                brand: { type: 'string' },
                                description: { type: 'string' },
                                price_paid: { type: 'number' },
                              },
                            },
                            context: {
                              type: 'object',
                              properties: {
                                why_chosen: {
                                  type: 'string',
                                  description: 'First-person explanation of why the curator chose this product',
                                },
                                compared_to: {
                                  type: 'string',
                                  description: 'What the curator compared this product against',
                                },
                                alternatives: {
                                  type: 'array',
                                  items: { type: 'string' },
                                  description: 'Other products the curator considered',
                                },
                              },
                            },
                            bag: {
                              type: 'object',
                              properties: {
                                title: { type: 'string' },
                                category: { type: 'string' },
                                url: { type: 'string', format: 'uri' },
                              },
                            },
                            curator: {
                              type: 'object',
                              properties: {
                                handle: { type: 'string' },
                                display_name: { type: 'string' },
                                profile_url: { type: 'string', format: 'uri' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/bags/popular': {
        get: {
          operationId: 'getPopularBags',
          summary: 'Get popular bags ranked by context richness',
          description:
            'Returns public bags ranked by item count and how many items have curator context (why_chosen). Optionally filter by category.',
          parameters: [
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category (golf, photography, tech, travel, etc.)',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, maximum: 50 },
              description: 'Maximum bags to return',
            },
          ],
          responses: {
            '200': {
              description: 'Popular bags with context stats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      total: { type: 'integer' },
                      bags: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                            url: { type: 'string', format: 'uri' },
                            curator: {
                              type: 'object',
                              properties: {
                                handle: { type: 'string' },
                                display_name: { type: 'string' },
                              },
                            },
                            stats: {
                              type: 'object',
                              properties: {
                                item_count: { type: 'integer' },
                                why_chosen_count: { type: 'integer' },
                                context_density: {
                                  type: 'integer',
                                  description: 'Percentage of items with why_chosen filled in',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/brands': {
        get: {
          operationId: 'listBrands',
          summary: 'List all brands with item counts',
          description:
            'Returns all brands that appear in public bags, with counts of total items and items with curator context.',
          responses: {
            '200': {
              description: 'Brand directory',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      brands: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            item_count: { type: 'integer' },
                            with_context: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      ...v1Headers(),
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
