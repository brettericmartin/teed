import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import { fetchProductImage } from '@/lib/ai';
import type {
  EnrichProductsRequest,
  EnrichProductsResponse,
  EnrichedProduct,
  IdentifiedProduct,
  ProductLink
} from '@/lib/apis/types';

/**
 * APIS Stage 3: Year-Aware Enrichment
 *
 * Enriches identified products with links, specs, and images.
 * Searches are year-aware when model year is provided.
 */
export async function POST(request: NextRequest): Promise<NextResponse<EnrichProductsResponse>> {
  try {
    const body: EnrichProductsRequest = await request.json();
    const { products, yearAware } = body;

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products provided' },
        { status: 400 }
      );
    }

    // Enrich each product in parallel
    const enrichedProducts = await Promise.all(
      products.map(product => enrichProduct(product, yearAware))
    );

    console.log(`[APIS Stage 3] Enriched ${enrichedProducts.length} products`);

    return NextResponse.json({ success: true, products: enrichedProducts });

  } catch (error: any) {
    console.error('[APIS Stage 3] Enrichment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enrich products' },
      { status: 500 }
    );
  }
}

async function enrichProduct(product: IdentifiedProduct, yearAware: boolean): Promise<EnrichedProduct> {
  try {
    // Build search queries - year-aware if enabled
    const baseQuery = `${product.brand || ''} ${product.name}`.trim();
    const yearQuery = yearAware && product.modelYear
      ? `${baseQuery} ${product.modelYear}`
      : baseQuery;
    const generationQuery = yearAware && product.generation
      ? `${baseQuery} ${product.generation}`
      : baseQuery;

    // Fetch product image
    const productImage = await fetchProductImage(product.name, product.brand);

    // Get enrichment from AI
    const enrichmentResult = await getAIEnrichment(product, yearAware);

    // Build links with year warnings
    const links = buildProductLinks(product, enrichmentResult);

    return {
      ...product,
      description: enrichmentResult.description,
      specs: enrichmentResult.specs,
      estimatedPrice: enrichmentResult.estimatedPrice,
      links,
      productImage: productImage ? {
        imageUrl: productImage.imageUrl,
        thumbnailUrl: productImage.thumbnailUrl,
        source: productImage.source
      } : undefined,
      funFacts: enrichmentResult.funFacts
    };

  } catch (error) {
    console.error(`[Enrichment] Failed for ${product.name}:`, error);
    // Return product with minimal enrichment on error
    return {
      ...product,
      links: []
    };
  }
}

async function getAIEnrichment(product: IdentifiedProduct, yearAware: boolean): Promise<{
  description?: string;
  specs?: string;
  estimatedPrice?: string;
  funFacts?: string[];
  searchLinks?: Array<{ url: string; merchant: string; price?: string }>;
}> {
  const yearContext = yearAware && product.modelYear
    ? `IMPORTANT: This is the ${product.modelYear} model${product.generation ? ` (${product.generation})` : ''}. Provide information specific to this year/generation, not the current model.`
    : '';

  const systemPrompt = `You are a product information expert. Provide accurate, specific details about products.

${yearContext}

Return JSON with:
{
  "description": "Brief 1-2 sentence description",
  "specs": "Key specs separated by | (e.g., '10.5° | Fujikura Ventus | Stiff')",
  "estimatedPrice": "Price range (e.g., '$449-$549' for new, '$200-$300' for used if older model)",
  "funFacts": ["2-3 interesting facts about this product"],
  "searchLinks": [
    { "url": "https://...", "merchant": "Merchant Name", "price": "$XXX" }
  ]
}

IMPORTANT:
- If this is an older/discontinued model, note that in description
- Price should reflect current market value (used prices for older models)
- Fun facts should be genuinely interesting, not generic`;

  const userPrompt = `Provide enrichment data for:
Product: ${product.brand || ''} ${product.name}
Category: ${product.category}
${product.modelYear ? `Model Year: ${product.modelYear}` : ''}
${product.generation ? `Generation: ${product.generation}` : ''}
${product.specifications?.length ? `Known specs: ${product.specifications.join(', ')}` : ''}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for enrichment (faster, cheaper)
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return {};

    return JSON.parse(content);

  } catch (error) {
    console.error('[AI Enrichment] Failed:', error);
    return {};
  }
}

function buildProductLinks(
  product: IdentifiedProduct,
  enrichment: { searchLinks?: Array<{ url: string; merchant: string; price?: string }> }
): ProductLink[] {
  const links: ProductLink[] = [];

  // Add AI-suggested links
  if (enrichment.searchLinks) {
    for (const link of enrichment.searchLinks) {
      links.push({
        url: link.url,
        merchant: link.merchant,
        price: link.price,
        yearMatch: 'unknown', // AI doesn't know if link is year-specific
        isAffiliate: false,
        source: 'web'
      });
    }
  }

  // Add common retailer search links with year awareness
  const searchQuery = encodeURIComponent(
    `${product.brand || ''} ${product.name}${product.modelYear ? ` ${product.modelYear}` : ''}`.trim()
  );

  // Only add generic search links if we don't have AI links
  if (links.length === 0) {
    // Add some helpful search links
    if (product.category === 'golf') {
      links.push({
        url: `https://www.google.com/search?q=${searchQuery}`,
        merchant: 'Google Search',
        yearMatch: product.modelYear ? 'unknown' : 'unknown',
        yearWarning: product.modelYear && product.modelYear < 2023
          ? `Search results may show current models. Your item is from ${product.modelYear}.`
          : undefined,
        isAffiliate: false,
        source: 'web'
      });
    }
  }

  // Add year warnings to all links for older products
  if (product.modelYear && product.modelYear < new Date().getFullYear() - 1) {
    links.forEach(link => {
      if (link.yearMatch === 'unknown') {
        link.yearWarning = link.yearWarning ||
          `Note: Your item appears to be from ${product.modelYear}. Verify the listing matches your model year.`;
      }
    });
  }

  return links;
}
