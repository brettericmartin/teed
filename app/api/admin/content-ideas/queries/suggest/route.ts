import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import type {
  ContentVertical,
  TrendSuggestion,
  SuggestTrendsResponse,
} from '@/lib/types/contentIdeas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_VERTICALS: ContentVertical[] = ['golf', 'camera', 'desk', 'tech'];

/**
 * POST /api/admin/content-ideas/queries/suggest
 * Use AI to suggest trending search queries based on current events,
 * product launches, and popular creators
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    let body: { verticals?: ContentVertical[] } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const verticals = body.verticals || DEFAULT_VERTICALS;

    // Get existing queries to avoid duplicates
    const { data: existingQueries } = await supabaseAdmin
      .from('content_search_queries')
      .select('query, vertical')
      .in('vertical', verticals);

    const existingSet = new Set(
      existingQueries?.map(q => `${q.vertical}:${q.query.toLowerCase()}`) || []
    );

    // Get current date for context
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();

    // Build context per vertical
    const verticalContexts: Record<ContentVertical, string> = {
      golf: `Golf events: PGA Tour season, majors (Masters in April, PGA Championship in May, US Open in June, Open Championship in July), DP World Tour. Key equipment brands: Titleist, TaylorMade, Callaway, Ping, Cobra, Mizuno, Srixon, Cleveland. Popular equipment types: drivers, putters, irons, wedges, golf balls. Notable golfers who do equipment content: Scottie Scheffler, Rory McIlroy, Jon Rahm, Viktor Hovland.`,
      camera: `Camera industry: Sony Alpha lineup, Canon EOS R series, Nikon Z series, Fujifilm X and GFX, Panasonic Lumix. Events: CES (January), CP+ (February), Photokina. Popular creators: Peter McKinnon, Matti Haapoja, Gerald Undone, Tony Northrup. Content types: camera bags, lens collections, filmmaker rigs.`,
      desk: `Desk setup trends: Standing desks, ultrawide monitors, mechanical keyboards, ergonomic chairs. Events: CES for new tech. Popular creators: minimalist setups, gaming setups, WFH productivity. Brands: Apple, Dell, LG, Logitech, Keychron, Herman Miller.`,
      tech: `Tech trends: Apple ecosystem (iPhone, Mac, iPad, Apple Watch), Android flagships, smart home, wearables. Events: CES (January), MWC (February), Apple WWDC (June), iPhone launch (September). Creators: MKBHD, Linus Tech Tips, Unbox Therapy.`,
      edc: `EDC (Everyday Carry): Knives, multitools, flashlights, wallets, watches. Popular brands: Benchmade, Spyderco, Leatherman, Olight. Content: pocket dumps, EDC tours.`,
      makeup: `Beauty trends: Seasonal collections, celebrity collaborations, viral products. Major brands: Charlotte Tilbury, Rare Beauty, Fenty, MAC. Events: Fashion weeks.`,
      fitness: `Fitness: Home gym setups, workout gear, supplements. Trends: smart fitness equipment, recovery tools. Events: New Year fitness season (January).`,
      music: `Music production: Studio setups, synth collections, guitar rigs. Brands: Fender, Gibson, Roland, Moog, Universal Audio.`,
      art: `Art supplies: Drawing tools, painting supplies, digital art tablets. Brands: Wacom, Prismacolor, Copic. Creators: studio tours.`,
      gaming: `Gaming: PC builds, console setups, peripherals. Events: E3, Gamescom, new console/GPU launches. Brands: NVIDIA, AMD, Razer, Corsair.`,
      travel: `Travel: Packing lists, travel gear, carry-on essentials. Events: Summer travel season, holiday travel.`,
      food: `Kitchen: Chef knife collections, cookware, kitchen gadgets. Trends: home cooking, baking equipment.`,
      fashion: `Fashion: Capsule wardrobes, seasonal essentials. Events: Fashion weeks, seasonal transitions.`,
      other: `General gear content, setup tours, collection showcases.`,
    };

    const suggestions: TrendSuggestion[] = [];

    // Generate suggestions for each vertical
    for (const vertical of verticals) {
      const context = verticalContexts[vertical] || verticalContexts.other;

      const prompt = `You are helping identify trending YouTube search queries for "What's in the Bag" and gear/setup video content.

Current date: ${currentMonth} ${currentYear}

Vertical: ${vertical.toUpperCase()}
Context: ${context}

Generate 5 search queries that would find relevant, timely content. Focus on:
1. Recent events (tournaments, product launches, trade shows)
2. New products released in the last 3 months
3. Popular creators who recently posted gear content
4. Seasonal relevance (what gear is people talking about NOW)
5. Trending topics in this vertical

For each query, provide:
- query: The YouTube search string
- query_type: One of "event", "product_launch", "creator", or "trending"
- reason: Why this query is timely/relevant (one sentence)
- priority: 50-90 (higher = more timely/important)
- expires_at: ISO date when this query becomes stale (optional, for time-bound queries)

Respond with a JSON array of suggestions.`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert in gear/equipment content across various hobbies and industries. Respond only with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const items = parsed.suggestions || parsed.queries || parsed;

          if (Array.isArray(items)) {
            for (const item of items) {
              // Skip if already exists
              const key = `${vertical}:${item.query?.toLowerCase()}`;
              if (existingSet.has(key)) continue;

              suggestions.push({
                query: item.query,
                vertical,
                query_type: item.query_type || 'trending',
                reason: item.reason || 'AI suggested',
                priority: item.priority || 60,
                expires_at: item.expires_at,
              });
            }
          }
        }
      } catch (aiError) {
        console.error(`[Suggest] AI error for ${vertical}:`, aiError);
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await logAdminAction(admin, 'system.migration', 'search_query', null, {
      action: 'suggest_trends',
      verticals,
      suggestions_count: suggestions.length,
    });

    const result: SuggestTrendsResponse = {
      suggestions,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Suggest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
