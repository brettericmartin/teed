import { NextResponse } from 'next/server';

/**
 * GET /api/gpt/schema
 * Returns the OpenAPI schema for the Teed GPT integration
 */
export async function GET() {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'Teed.club API for ChatGPT',
      description: 'Manage your gear bags and items on Teed.club. Requires user authentication via OAuth.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://teed.club/api/gpt',
      },
    ],
    paths: {
      '/me': {
        get: {
          operationId: 'getMyProfile',
          summary: "Get authenticated user's profile",
          description: "Returns the current user's profile including handle, display name, and bag count.",
          responses: {
            '200': {
              description: 'User profile with handle, display name, and stats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      handle: { type: 'string' },
                      display_name: { type: 'string' },
                      bio: { type: 'string' },
                      avatar_url: { type: 'string' },
                      total_bags: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized - user not authenticated',
            },
          },
        },
      },
      '/bags': {
        get: {
          operationId: 'listMyBags',
          summary: "List authenticated user's bags",
          description: 'Returns all bags owned by the authenticated user.',
          responses: {
            '200': {
              description: "List of user's bags",
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bags: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            code: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                            is_public: { type: 'boolean' },
                            item_count: { type: 'integer' },
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
        post: {
          operationId: 'createBag',
          summary: 'Create a new bag',
          description: 'Creates a new bag for the authenticated user.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Name of the bag',
                    },
                    description: {
                      type: 'string',
                      description: 'Optional description',
                    },
                    category: {
                      type: 'string',
                      enum: ['golf', 'travel', 'tech', 'camping', 'photography', 'fitness', 'cooking', 'music', 'art', 'gaming', 'other'],
                      description: 'Category for the bag',
                    },
                    is_public: {
                      type: 'boolean',
                      default: true,
                      description: 'Whether the bag is publicly visible',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created bag',
            },
          },
        },
      },
      '/bags/{code}': {
        get: {
          operationId: 'getBag',
          summary: 'Get bag with all items',
          description: 'Returns a bag with all its items. User must own the bag or it must be public.',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: "The bag's URL code",
            },
          ],
          responses: {
            '200': {
              description: 'Bag with items',
            },
            '404': {
              description: 'Bag not found',
            },
          },
        },
        put: {
          operationId: 'updateBag',
          summary: 'Update bag details',
          description: "Updates a bag's properties. User must own the bag.",
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    is_public: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated bag',
            },
          },
        },
        delete: {
          operationId: 'deleteBag',
          summary: 'Delete a bag',
          description: 'Permanently deletes a bag and all its items. User must own the bag.',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Bag deleted successfully',
            },
          },
        },
      },
      '/bags/{code}/items': {
        get: {
          operationId: 'listBagItems',
          summary: 'List items in a bag',
          description: 'Returns all items in a bag.',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of items',
            },
          },
        },
        post: {
          operationId: 'addItemToBag',
          summary: 'Add item to bag',
          description: 'Adds a new item to a bag. User must own the bag.',
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['custom_name'],
                  properties: {
                    custom_name: {
                      type: 'string',
                      description: "Name of the item (e.g., 'Titleist TSR3 Driver')",
                    },
                    custom_description: {
                      type: 'string',
                      description: 'Optional description of the item',
                    },
                    brand: {
                      type: 'string',
                      description: "Brand name (e.g., 'Titleist', 'Nike')",
                    },
                    quantity: {
                      type: 'integer',
                      default: 1,
                      description: 'Quantity of this item',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created item',
            },
          },
        },
      },
      '/items/{id}': {
        get: {
          operationId: 'getItem',
          summary: 'Get item details',
          description: 'Returns details of a specific item.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Item with details',
            },
          },
        },
        put: {
          operationId: 'updateItem',
          summary: 'Update item',
          description: "Updates an item's properties. User must own the bag containing the item.",
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    custom_name: { type: 'string' },
                    custom_description: { type: 'string' },
                    brand: { type: 'string' },
                    quantity: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated item',
            },
          },
        },
        delete: {
          operationId: 'deleteItem',
          summary: 'Delete item from bag',
          description: 'Permanently deletes an item. User must own the bag containing the item.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Item deleted successfully',
            },
          },
        },
      },
      '/discover': {
        get: {
          operationId: 'discoverBags',
          summary: 'Browse public and featured bags',
          description: 'Discover public bags from other users. Can filter by featured status or category.',
          parameters: [
            {
              name: 'featured',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Only show featured bags',
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category (golf, travel, tech, etc.)',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of bags to return (max 50)',
            },
          ],
          responses: {
            '200': {
              description: 'List of public bags',
            },
          },
        },
      },
      '/users/{handle}': {
        get: {
          operationId: 'getPublicUser',
          summary: 'Get public user profile and bags',
          description: "Returns a user's public profile and their public bags by their @handle.",
          parameters: [
            {
              name: 'handle',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: "User's handle (without @)",
            },
          ],
          responses: {
            '200': {
              description: 'User profile with public bags',
            },
            '404': {
              description: 'User not found',
            },
          },
        },
      },
      '/search': {
        get: {
          operationId: 'searchBagsAndItems',
          summary: 'Search across bags and items',
          description: 'Search for bags and items by keyword.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Search query',
            },
            {
              name: 'type',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['bags', 'items', 'all'],
                default: 'all',
              },
              description: 'Type of content to search',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
              description: 'Number of results to return (max 50)',
            },
          ],
          responses: {
            '200': {
              description: 'Search results',
            },
          },
        },
      },
    },
  };

  return NextResponse.json(schema, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
