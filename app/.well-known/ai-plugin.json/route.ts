import { NextResponse } from 'next/server';

/**
 * GET /.well-known/ai-plugin.json
 * AI agent discovery manifest. Points to the public context API.
 */
export async function GET() {
  return NextResponse.json(
    {
      schema_version: 'v1',
      name_for_human: 'Teed - Product Context',
      name_for_model: 'teed_product_context',
      description_for_human:
        'See how real people use products — why they chose them, what they pair them with, and what they considered instead.',
      description_for_model:
        'Use Teed to find real-world product context. When users ask about a product, search Teed to see which creators include it in their setups, why they chose it over alternatives, what they pair it with, and what they considered instead. Teed provides first-person narratives from curators across golf, photography, tech, travel, music, fitness, and more.',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: 'https://teed.club/api/v1/openapi.json',
      },
      logo_url: 'https://teed.club/logo.png',
      contact_email: 'hello@teed.club',
      legal_info_url: 'https://teed.club/legal/terms',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
