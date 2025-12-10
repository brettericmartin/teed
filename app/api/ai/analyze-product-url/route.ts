import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openaiClient';
import * as cheerio from 'cheerio';
import { trackApiUsage } from '@/lib/apiUsageTracker';

export const maxDuration = 30;

/**
 * POST /api/ai/analyze-product-url
 * Uses GPT-4 to analyze a product URL and extract accurate details
 *
 * Fetches the page, extracts text/metadata, then uses AI to understand the product
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log(`[AI URL Analyze] Fetching ${parsedUrl.hostname}...`);

    // Fetch the product page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract key content for AI analysis
    const pageData = {
      url,
      domain: parsedUrl.hostname.replace('www.', ''),
      title: $('title').text().trim(),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      description: $('meta[name="description"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      h1: $('h1').first().text().trim(),
      // Get main product info - limit to first 3000 chars
      productText: $('.product-info, .product-details, [class*="product"], [id*="product"]')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000),
      // Extract JSON-LD structured data if present
      jsonLd: $('script[type="application/ld+json"]')
        .map((_, el) => {
          try {
            return JSON.parse($(el).html() || '{}');
          } catch {
            return null;
          }
        })
        .get()
        .filter(Boolean),
    };

    console.log(`[AI URL Analyze] Analyzing with GPT-4...`);

    // Use GPT-4 to understand the product
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a product information extraction specialist. Analyze product page data and extract accurate details.

Return ONLY valid JSON in this format:
{
  "brand": "Brand Name",
  "productName": "Product Model/Name (without brand)",
  "category": "Product Category",
  "specs": ["spec1", "spec2", "spec3"],
  "price": "123.45" or null,
  "color": "Color/Variant" or null,
  "confidence": 0.85,
  "reasoning": "Why this confidence level"
}

CRITICAL RULES:
- Be VERY accurate - only extract what you can clearly identify
- If uncertain about brand/model, lower confidence to 0.5-0.7
- Extract specs that matter (size, material, weight, technical specs)
- Don't guess or infer - only use information present on the page
- Confidence scoring:
  * 0.9-1.0: Product clearly identified, all details match
  * 0.7-0.89: Product identified but some details uncertain
  * 0.5-0.69: Can identify general product but details unclear
  * <0.5: Very uncertain, minimal information available`,
        },
        {
          role: 'user',
          content: `Analyze this product page:

URL: ${pageData.url}
Domain: ${pageData.domain}

Title: ${pageData.title}
OG Title: ${pageData.ogTitle || 'N/A'}
H1: ${pageData.h1}

Description: ${pageData.description || 'N/A'}

Product Info:
${pageData.productText || 'No product text extracted'}

${pageData.jsonLd.length > 0 ? `Structured Data: ${JSON.stringify(pageData.jsonLd[0]).substring(0, 500)}` : ''}

Extract accurate product information. Be conservative with confidence if anything is unclear.`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    console.log(`[AI URL Analyze] Result for ${parsedUrl.hostname}:`, {
      brand: result.brand,
      confidence: result.confidence,
    });

    // Track API usage
    const durationMs = Date.now() - startTime;
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/analyze-product-url',
      model: 'gpt-4o',
      operationType: 'analyze',
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      durationMs,
      status: 'success',
    }).catch(console.error);

    // Add metadata
    const enrichedResult = {
      ...result,
      url,
      domain: pageData.domain,
      extracted_at: new Date().toISOString(),
    };

    return NextResponse.json(enrichedResult, { status: 200 });
  } catch (error: any) {
    console.error('[AI URL Analyze] Error:', error);

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/analyze-product-url',
      model: 'gpt-4o',
      operationType: 'analyze',
      durationMs: Date.now() - startTime,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);

    return NextResponse.json(
      {
        error: 'Failed to analyze product URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
