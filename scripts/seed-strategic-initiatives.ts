/**
 * Seed Strategic Initiatives
 *
 * Run with: npx tsx scripts/seed-strategic-initiatives.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Initiative {
  title: string;
  slug: string;
  category: string;
  priority: number;
  status: string;
  tagline: string;
  executive_summary: string;
  problem_statement: string;
  solution_overview: string;
  estimated_effort: string;
  board_evaluation: {
    daniel_priestley?: { score: number; verdict: string; notes: string };
    julie_zhuo?: { score: number; verdict: string; notes: string };
    li_jin?: { score: number; verdict: string; notes: string };
    emily_heyward?: { score: number; verdict: string; notes: string };
    codie_sanchez?: { score: number; verdict: string; notes: string };
    overall_score?: number;
    board_decision?: string;
  };
  doctrine_compliance: { check: string; passed: boolean; notes?: string }[];
  feature_phases: { phase: number; title: string; description: string; features: string[] }[];
  success_metrics: { metric: string; target: string; rationale: string }[];
  risk_assessment: { risk: string; likelihood: string; impact: string; mitigation: string }[];
}

const INITIATIVES: Initiative[] = [
  {
    title: 'Teed MCP Server',
    slug: 'mcp-server',
    category: 'infrastructure',
    priority: 100,
    status: 'approved',
    tagline: 'Enable AI assistants to read, understand, and recommend gear from Teed bags',
    executive_summary: `The Teed MCP Server transforms bags from passive web pages into active data sources for the AI assistant ecosystem. By implementing Anthropic's Model Context Protocol, we enable Claude, ChatGPT, and other AI assistants to directly access and understand gear recommendations.

This positions Teed as the canonical source for gear information in the age of AI assistants, creating a new distribution channel that works 24/7 without requiring creators to be online.`,
    problem_statement: `AI assistants are increasingly becoming the primary interface for information retrieval. When users ask "What camera does MKBHD use?" or "What's the best beginner golf setup?", AI assistants struggle because they can't access structured gear data.

Creators' carefully curated knowledge is locked in web pages that AIs can't fully understand. This represents a missed opportunity for both discovery and monetization.`,
    solution_overview: `Build an MCP server that exposes Teed's bag data through standardized protocols:
- Bag retrieval by creator handle or category
- Item details with full metadata and context
- Link intelligence for affiliate and product information
- Creator discovery based on expertise and categories`,
    estimated_effort: 'medium',
    board_evaluation: {
      daniel_priestley: { score: 9, verdict: 'approved', notes: 'MCP is the ultimate 24/7 asset. Bags become working assets that generate discovery even when creators sleep. Each bag becomes a knowledge node in the AI ecosystem.' },
      julie_zhuo: { score: 8, verdict: 'approved', notes: 'The progressive disclosure model is excellent. AI assistants get simple data by default, with depth available on request. The experience feels natural and discovered.' },
      li_jin: { score: 10, verdict: 'approved', notes: 'This significantly increases creator independence. Their knowledge works across multiple AI platforms without being locked to any single one. True platform portability.' },
      emily_heyward: { score: 8, verdict: 'approved', notes: 'Positions Teed as the "source of truth" for gear. Premium positioning through being the infrastructure layer, not just another consumer app.' },
      codie_sanchez: { score: 9, verdict: 'approved', notes: 'Pure picks-and-shovels. We power the AI gold rush by providing the data layer. Works regardless of which AI assistant wins. Extremely durable.' },
      overall_score: 44,
      board_decision: '5/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'MCP exposes bags as primary entities' },
      { check: 'No obligation/pressure language', passed: true, notes: 'AI interactions are pull-based, not push' },
      { check: 'Constructive dopamine only', passed: true, notes: 'Discovery through AI is intentional, not addictive' },
      { check: 'Passes the "stale test"', passed: true, notes: 'Old bags are still valuable knowledge for AI' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Structured data responses, not feeds' },
      { check: 'Creator attribution comes first', passed: true, notes: 'All responses include creator attribution' },
    ],
    feature_phases: [
      { phase: 1, title: 'Core MCP Server', description: 'Basic bag and item retrieval', features: ['get_bag', 'get_creator_bags', 'get_item_details', 'search_bags'] },
      { phase: 2, title: 'Intelligence Layer', description: 'Link intelligence and recommendations', features: ['get_link_intelligence', 'get_affiliate_links', 'compare_items'] },
      { phase: 3, title: 'Discovery Features', description: 'Advanced search and recommendations', features: ['find_experts', 'get_category_overview', 'get_trending_in_category'] },
      { phase: 4, title: 'Analytics & Monetization', description: 'Track usage and enable monetization', features: ['usage_analytics', 'affiliate_tracking', 'creator_dashboards'] },
    ],
    success_metrics: [
      { metric: 'MCP Server Installations', target: '1,000 in 6 months', rationale: 'Establishes presence in AI assistant ecosystem' },
      { metric: 'Monthly API Calls', target: '100,000/month by end of year', rationale: 'Indicates real usage and value delivery' },
      { metric: 'Creator Discovery via AI', target: '500 new creator follows from AI referrals', rationale: 'Shows AI driving real platform engagement' },
    ],
    risk_assessment: [
      { risk: 'Low MCP adoption', likelihood: 'medium', impact: 'high', mitigation: 'Support multiple AI protocols, not just MCP' },
      { risk: 'AI hallucinations with our data', likelihood: 'medium', impact: 'medium', mitigation: 'Provide structured, validated responses only' },
      { risk: 'Affiliate attribution challenges', likelihood: 'low', impact: 'medium', mitigation: 'Clear attribution in all responses' },
    ],
  },
  {
    title: 'Infrastructure API',
    slug: 'infrastructure-api',
    category: 'infrastructure',
    priority: 95,
    status: 'approved',
    tagline: 'The Stripe of gear references - canonical infrastructure for the creator economy',
    executive_summary: `Transform Teed from a consumer destination into the infrastructure layer that powers gear references across the entire creator economy. Just as Stripe powers payments for the internet, Teed powers gear curation.

The Infrastructure API enables newsletter platforms, YouTube tools, podcast platforms, and brand partnership platforms to integrate Teed data natively, creating a network effect where Teed becomes the canonical source of truth for gear.`,
    problem_statement: `Integration partners face redundant engineering to build gear curation features. Data quality suffers from fragmented sources. Creators must maintain gear info across multiple platforms. There's no standardized way to access structured gear data.

The creator economy lacks infrastructure for gear - every platform rebuilds the same features independently.`,
    solution_overview: `Build a comprehensive API platform with:
- Bags & Items API for programmatic access to creator gear
- Link Intelligence for URL extraction and metadata
- Affiliate generation across multiple networks
- Webhooks for real-time updates
- Export formats for various platforms`,
    estimated_effort: 'large',
    board_evaluation: {
      daniel_priestley: { score: 9, verdict: 'approved', notes: 'The API is a force multiplier. One bag update propagates to 6+ touchpoints automatically. This is the 7/11/4 rule applied to B2B infrastructure.' },
      julie_zhuo: { score: 8, verdict: 'approved', notes: 'Developer simplicity is our competitive advantage. The bar is Stripe. We will invest disproportionately in documentation and SDK quality.' },
      li_jin: { score: 9, verdict: 'approved', notes: 'Creator data sovereignty is fundamental. Teed is the canonical source, API is read-optimized. Creators control their data at origin.' },
      emily_heyward: { score: 9, verdict: 'approved', notes: 'Premium API branding signals quality. developers.teed.club with Stripe-quality documentation builds trust.' },
      codie_sanchez: { score: 10, verdict: 'approved', notes: 'This is the definition of picks-and-shovels. We enable all platforms equally, works regardless of which creator or platform wins.' },
      overall_score: 45,
      board_decision: '5/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'API structure respects the hierarchy' },
      { check: 'No obligation/pressure language', passed: true, notes: 'Infrastructure is passive, not demanding' },
      { check: 'Constructive dopamine only', passed: true, notes: 'N/A for B2B API' },
      { check: 'Passes the "stale test"', passed: true, notes: 'API serves all bag ages equally' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Paginated API responses' },
      { check: 'Creator attribution comes first', passed: true, notes: 'All API responses include creator attribution' },
    ],
    feature_phases: [
      { phase: 1, title: 'Foundation', description: 'Core API infrastructure', features: ['API Gateway', 'Rate limiting', 'OAuth 2.0', 'Core endpoints', 'Sandbox environment'] },
      { phase: 2, title: 'Intelligence', description: 'Value-added services', features: ['Extract endpoint', 'Identify endpoint', 'Search endpoint', 'Batch processing'] },
      { phase: 3, title: 'Monetization', description: 'Affiliate and export', features: ['Affiliate generation', 'Multi-network support', 'Export formats', 'Analytics API'] },
      { phase: 4, title: 'Scale', description: 'Production hardening', features: ['Multi-region deployment', '99.9% SLA', 'GraphQL beta', 'Advanced caching'] },
    ],
    success_metrics: [
      { metric: 'Registered Developers', target: '1,000 in Year 1', rationale: 'Establishes developer ecosystem' },
      { metric: 'Active Integrations', target: '200 with >100 calls/month', rationale: 'Shows real production usage' },
      { metric: 'API Revenue', target: '$172K ARR in Year 1', rationale: 'Validates infrastructure business model' },
      { metric: 'Time to First Call', target: '<15 minutes', rationale: 'Developer experience benchmark' },
    ],
    risk_assessment: [
      { risk: 'Slow developer adoption', likelihood: 'medium', impact: 'high', mitigation: 'Strong DX investment, integration grants, co-marketing' },
      { risk: 'API latency under load', likelihood: 'medium', impact: 'high', mitigation: 'Aggressive caching, CDN edge deployment, load testing' },
      { risk: 'Security breach', likelihood: 'low', impact: 'critical', mitigation: 'Security audit, penetration testing, bug bounty' },
    ],
  },
  {
    title: 'Creator Scorecard Assessment',
    slug: 'creator-scorecard',
    category: 'growth',
    priority: 85,
    status: 'approved',
    tagline: 'Help creators understand and improve their Teed presence with a personalized assessment',
    executive_summary: `Create a viral, value-first onboarding experience through a personalized Creator Scorecard. Like HubSpot's Website Grader, this tool provides immediate value while capturing high-intent leads.

The scorecard evaluates a creator's gear curation maturity across 12 questions, provides a personalized score, and offers actionable recommendations - whether they're a Teed user or not.`,
    problem_statement: `Creators don't know how to evaluate their gear curation effectiveness. They have no benchmark for what "good" looks like. Onboarding to Teed lacks a compelling entry point. Cold outreach doesn't convert well without demonstrated value first.`,
    solution_overview: `Build a 12-question assessment that evaluates:
- Curation Depth (items per bag, context per item, link coverage)
- Distribution Power (sharing frequency, platform leverage)
- Monetization Readiness (affiliate setup, link optimization)
- Brand Positioning (consistency, expertise signals)

Deliver personalized results with specific recommendations and next steps.`,
    estimated_effort: 'small',
    board_evaluation: {
      daniel_priestley: { score: 10, verdict: 'approved', notes: 'This is a perfect "scorecard" strategy from Oversubscribed. It positions us as the authority, provides value first, and creates natural demand for our solution.' },
      julie_zhuo: { score: 9, verdict: 'approved', notes: 'The assessment should feel like self-discovery, not being sold to. Focus on genuine insights and "aha moments" rather than sales pressure.' },
      li_jin: { score: 8, verdict: 'approved', notes: 'Empowers creators with knowledge about their own positioning. The scorecard should work for all creators, not just those with large followings.' },
      emily_heyward: { score: 9, verdict: 'approved', notes: 'The scorecard IS the brand experience. Premium design and thoughtful results reinforce our positioning as the expert platform.' },
      codie_sanchez: { score: 8, verdict: 'approved', notes: 'Low-cost lead generation that works 24/7. Once built, it captures leads automatically with minimal ongoing investment.' },
      overall_score: 44,
      board_decision: '5/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'Scorecard evaluates based on bag quality first' },
      { check: 'No obligation/pressure language', passed: true, notes: 'Educational tone, not urgent sales' },
      { check: 'Constructive dopamine only', passed: true, notes: 'Pride from learning about self, not FOMO' },
      { check: 'Passes the "stale test"', passed: true, notes: 'Assessment evaluates timeless qualities' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Finite assessment with clear end' },
      { check: 'Creator attribution comes first', passed: true, notes: 'Assessment celebrates creator expertise' },
    ],
    feature_phases: [
      { phase: 1, title: 'Core Assessment', description: '12-question assessment with scoring', features: ['Question flow', 'Scoring algorithm', 'Results page', 'Email capture'] },
      { phase: 2, title: 'Personalization', description: 'Category and level-specific content', features: ['Category-specific questions', 'Benchmark comparisons', 'Personalized recommendations'] },
      { phase: 3, title: 'Nurture Sequence', description: 'Email follow-up and conversion', features: ['Drip campaign', 'Progress tracking', 'Upgrade prompts'] },
    ],
    success_metrics: [
      { metric: 'Assessment Completions', target: '5,000/month', rationale: 'Top of funnel volume' },
      { metric: 'Email Capture Rate', target: '40%', rationale: 'Lead generation efficiency' },
      { metric: 'Assessment to Signup', target: '15%', rationale: 'Conversion to platform' },
      { metric: 'Virality Coefficient', target: '0.3 (30% share)', rationale: 'Organic growth multiplier' },
    ],
    risk_assessment: [
      { risk: 'Low completion rate', likelihood: 'medium', impact: 'medium', mitigation: 'Progress indicators, save and resume, mobile optimization' },
      { risk: 'Irrelevant results', likelihood: 'low', impact: 'high', mitigation: 'Category-specific logic, continuous refinement' },
      { risk: 'Email deliverability', likelihood: 'low', impact: 'medium', mitigation: 'Double opt-in, quality infrastructure' },
    ],
  },
  {
    title: 'Bag-Powered Lead Magnets',
    slug: 'lead-magnets',
    category: 'growth',
    priority: 80,
    status: 'approved',
    tagline: 'Turn bags into 24/7 lead generation assets with smart email subscriptions',
    executive_summary: `Enable creators to capture subscriber emails directly from their bags. When someone visits a bag, they can subscribe to updates - new items, price changes, creator commentary. This transforms bags from static showcases into lead generation machines.

Unlike traditional lead magnets that require constant content creation, bags work 24/7. A 2-year-old bag is still capturing leads today.`,
    problem_statement: `Creators struggle with lead generation. Traditional lead magnets require constant content creation. Email lists are owned by platforms (Medium, Substack), not creators. There's no way to build an audience around gear expertise specifically.`,
    solution_overview: `Build a subscription system for bags:
- Subscribe to bag updates (new items, changes, commentary)
- Subscribe to creator (all their bags)
- Smart batching (don't spam, group updates)
- Full creator ownership (export anytime)
- Privacy-first (GDPR compliant, double opt-in)`,
    estimated_effort: 'medium',
    board_evaluation: {
      daniel_priestley: { score: 10, verdict: 'approved', notes: 'This is the ultimate 24/7 asset. Each bag becomes a lead gen machine. The creator with 500 subscribers from their golf bag has a more valuable asset than 50K Instagram followers.' },
      julie_zhuo: { score: 9, verdict: 'approved', notes: 'The subscription prompt appears after value is delivered. Non-intrusive, discovered not pushed. "Stay Updated" invites rather than demands.' },
      li_jin: { score: 10, verdict: 'approved', notes: 'Full data ownership is guaranteed. Creators can export their entire list tomorrow. No hostage-taking. This is how platforms should work.' },
      emily_heyward: { score: 10, verdict: 'approved', notes: 'Email design feels like a personal note, not a marketing blast. Smart batching ensures subscribers only hear when theres something worth saying.' },
      codie_sanchez: { score: 10, verdict: 'approved', notes: 'Leverage play. Creator spends 2 hours building a bag, it captures leads for years. Each subscriber is an asset that appreciates.' },
      overall_score: 49,
      board_decision: '5/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'Subscriptions are bag-first' },
      { check: 'No obligation/pressure language', passed: true, notes: '"Update when meaningful" messaging' },
      { check: 'Constructive dopamine only', passed: true, notes: 'Rewards building, not returning to check' },
      { check: 'Passes the "stale test"', passed: true, notes: 'Old bags still capture leads' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Email is notification, not feed' },
      { check: 'Creator attribution comes first', passed: true, notes: 'Creator branding prominent in emails' },
    ],
    feature_phases: [
      { phase: 1, title: 'Foundation', description: 'Core subscription infrastructure', features: ['Subscription tables', 'Double opt-in', 'Unsubscribe handling', 'Basic notifications'] },
      { phase: 2, title: 'Creator Experience', description: 'Dashboard and management', features: ['Subscriber analytics', 'Export functionality', 'Custom broadcasts', 'Preference center'] },
      { phase: 3, title: 'Enhancement', description: 'Advanced features', features: ['Creator-wide subscriptions', 'Smart batching', 'A/B testing', 'Scheduled sends'] },
    ],
    success_metrics: [
      { metric: 'Subscription Rate', target: '3-5% of bag views', rationale: 'Industry benchmark for email capture' },
      { metric: 'Confirmation Rate', target: '70%+', rationale: 'Quality subscriber validation' },
      { metric: 'Open Rate', target: '40%+', rationale: 'Engagement quality' },
      { metric: 'Creator Adoption', target: '30% of creators with 1+ subscriber', rationale: 'Feature penetration' },
    ],
    risk_assessment: [
      { risk: 'Email deliverability issues', likelihood: 'medium', impact: 'high', mitigation: 'Use Resend, proper authentication, warm-up' },
      { risk: 'Subscription fatigue', likelihood: 'medium', impact: 'medium', mitigation: 'Smart batching, frequency controls' },
      { risk: 'GDPR compliance', likelihood: 'low', impact: 'high', mitigation: 'Double opt-in, consent recording, easy unsubscribe' },
    ],
  },
  {
    title: 'B2B Brand Partnerships',
    slug: 'b2b-brand-partnerships',
    category: 'b2b',
    priority: 75,
    status: 'approved',
    tagline: 'Enable brands to participate in the organic creator ecosystem',
    executive_summary: `Create a B2B platform where brands can maintain verified product catalogs on Teed, giving them visibility into organic creator usage while providing creators with accurate product data and auto-affiliate links.

This is the "Shopify of product information" - infrastructure that enables both brands and creators to succeed.`,
    problem_statement: `Brands have no visibility into organic product usage by creators. They can't track who's authentically featuring their products. Product information is often inaccurate across creator content.

Creators waste hours hunting for specs, images, and affiliate links. Outdated product info hurts credibility.`,
    solution_overview: `Build a brand portal with:
- Verified product catalogs with official specs and images
- Usage analytics showing which creators feature products
- Organic advocate identification
- Auto-affiliate linking for creators
- Privacy-first creator controls`,
    estimated_effort: 'large',
    board_evaluation: {
      daniel_priestley: { score: 9, verdict: 'approved', notes: 'Creates demand signals. Brands can collect signals of interest (creator usage) before asking for commitment. Its the 7-11-4 rule for B2B.' },
      julie_zhuo: { score: 8, verdict: 'approved', notes: 'Creator experience is clean - they just see better products with a verified badge. Brand side has appropriate complexity for B2B.' },
      li_jin: { score: 7, verdict: 'needs_work', notes: 'Core concept increases creator capability, but we need strong privacy defaults. Brands should never see a creator without explicit opt-in.' },
      emily_heyward: { score: 9, verdict: 'approved', notes: 'Premium positioning. This isnt about brands buying creators - its about brands earning credibility by having great products that creators choose organically.' },
      codie_sanchez: { score: 10, verdict: 'approved', notes: 'Perfect picks-and-shovels. We become essential plumbing for creator commerce - boring, reliable, profitable.' },
      overall_score: 43,
      board_decision: '4/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'Products are surfaced through bags' },
      { check: 'No obligation/pressure language', passed: true, notes: 'Brands observe, dont push' },
      { check: 'Constructive dopamine only', passed: true, notes: 'N/A for B2B' },
      { check: 'Passes the "stale test"', passed: true, notes: 'Product catalogs are evergreen' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Structured dashboards' },
      { check: 'Creator attribution comes first', passed: true, notes: 'Creators control visibility' },
    ],
    feature_phases: [
      { phase: 1, title: 'Foundation', description: 'Brand portal MVP', features: ['Brand registration', 'Product catalogs', 'Manual entry', 'Basic analytics'] },
      { phase: 2, title: 'Integrations', description: 'Shopify sync and advanced analytics', features: ['Shopify integration', 'Auto-sync', 'Creator discovery', 'Usage tracking'] },
      { phase: 3, title: 'GTM', description: 'Sales and launch', features: ['Pilot program', 'Self-serve signup', 'Billing integration', 'Case studies'] },
      { phase: 4, title: 'Scale', description: 'Enterprise features', features: ['API access', 'CSV import', 'Advanced analytics', 'Multi-brand support'] },
    ],
    success_metrics: [
      { metric: 'Brand Partners', target: '25 in Year 1', rationale: 'Initial traction' },
      { metric: 'Products in Catalog', target: '10,000+', rationale: 'Catalog coverage' },
      { metric: 'Creator Adoption', target: '25% using verified products', rationale: 'Creator value' },
      { metric: 'ARR', target: '$150K Year 1', rationale: 'Revenue validation' },
    ],
    risk_assessment: [
      { risk: 'Brands dont see value', likelihood: 'medium', impact: 'high', mitigation: 'Focus on pilot success, iterate on analytics' },
      { risk: 'Creators reject brand presence', likelihood: 'low', impact: 'high', mitigation: 'Privacy-first, opt-in visibility' },
      { risk: 'Long sales cycle', likelihood: 'high', impact: 'medium', mitigation: 'Build pipeline early, nurture leads' },
    ],
  },
  {
    title: 'Enterprise Team Bags',
    slug: 'enterprise-team-bags',
    category: 'b2b',
    priority: 70,
    status: 'approved',
    tagline: 'Collaborative gear management for teams and organizations',
    executive_summary: `Extend Teed's core value proposition to teams and enterprises. Enable organizations to manage equipment, share setups, and maintain institutional knowledge about gear across departments.

Target markets: Creative agencies, production companies, outdoor organizations, educational institutions, corporate IT.`,
    problem_statement: `Organizations lack systems for managing shared equipment knowledge. Information about what gear to use, when, and how is scattered across wikis, spreadsheets, and tribal knowledge. Onboarding new team members to equipment is inefficient.`,
    solution_overview: `Build team features:
- Shared workspaces for organizations
- Role-based access control
- Approval workflows for equipment requests
- Template bags for standard setups
- Activity tracking and audit logs
- Integration with procurement systems`,
    estimated_effort: 'xlarge',
    board_evaluation: {
      daniel_priestley: { score: 8, verdict: 'approved', notes: 'Enterprise expands TAM significantly. Each enterprise deal is a 24/7 asset generating recurring revenue with low churn.' },
      julie_zhuo: { score: 7, verdict: 'approved', notes: 'Team features must not compromise the core consumer experience. Progressive disclosure is key - complexity only when needed.' },
      li_jin: { score: 6, verdict: 'needs_work', notes: 'Enterprise features are fine, but ensure individual creators remain first-class citizens. Dont let B2B needs drive consumer roadmap.' },
      emily_heyward: { score: 8, verdict: 'approved', notes: 'Enterprise positioning should emphasize "institutional knowledge" and "equipment intelligence" - premium B2B language.' },
      codie_sanchez: { score: 9, verdict: 'approved', notes: 'High-margin recurring revenue with low churn. Enterprise is the ultimate boring infrastructure play. Predictable, reliable, profitable.' },
      overall_score: 38,
      board_decision: '4/5 APPROVAL',
    },
    doctrine_compliance: [
      { check: 'Bags > Items > Links > Profile (hierarchy preserved)', passed: true, notes: 'Team bags are still bags' },
      { check: 'No obligation/pressure language', passed: true, notes: 'Enterprise tone is professional, not urgent' },
      { check: 'Constructive dopamine only', passed: true, notes: 'N/A for B2B' },
      { check: 'Passes the "stale test"', passed: true, notes: 'Equipment knowledge ages well' },
      { check: 'No feed or infinite scroll', passed: true, notes: 'Structured team dashboards' },
      { check: 'Creator attribution comes first', passed: true, notes: 'Team members get attribution' },
    ],
    feature_phases: [
      { phase: 1, title: 'Team Foundation', description: 'Basic team features', features: ['Team workspaces', 'Shared bags', 'Member management', 'Basic permissions'] },
      { phase: 2, title: 'Collaboration', description: 'Advanced team features', features: ['Comments and discussions', 'Approval workflows', 'Template bags', 'Activity logs'] },
      { phase: 3, title: 'Enterprise', description: 'Enterprise features', features: ['SSO/SAML', 'Advanced permissions', 'Audit logs', 'API access'] },
      { phase: 4, title: 'Integrations', description: 'External integrations', features: ['Procurement integration', 'Asset management sync', 'Slack/Teams integration'] },
    ],
    success_metrics: [
      { metric: 'Team Accounts', target: '50 in Year 1', rationale: 'Initial adoption' },
      { metric: 'Enterprise Deals', target: '10 in Year 1', rationale: 'High-value customers' },
      { metric: 'Net Revenue Retention', target: '120%+', rationale: 'Expansion within accounts' },
      { metric: 'ARR', target: '$250K Year 1', rationale: 'Revenue validation' },
    ],
    risk_assessment: [
      { risk: 'Long enterprise sales cycle', likelihood: 'high', impact: 'medium', mitigation: 'Start with SMB, work up' },
      { risk: 'Feature complexity', likelihood: 'medium', impact: 'medium', mitigation: 'Phase rollout, maintain simplicity' },
      { risk: 'Consumer-enterprise tension', likelihood: 'medium', impact: 'medium', mitigation: 'Separate code paths where needed' },
    ],
  },
];

async function seedInitiatives() {
  console.log('Seeding strategic initiatives...\n');

  for (const initiative of INITIATIVES) {
    console.log(`Creating: ${initiative.title}...`);

    // Check if already exists
    const { data: existing } = await supabase
      .from('strategic_initiatives')
      .select('id')
      .eq('slug', initiative.slug)
      .single();

    if (existing) {
      console.log(`  Already exists, updating...`);

      const { error } = await supabase
        .from('strategic_initiatives')
        .update({
          ...initiative,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', initiative.slug);

      if (error) {
        console.error(`  Error updating ${initiative.slug}:`, error);
      } else {
        console.log(`  Updated successfully!`);
      }
    } else {
      const { error } = await supabase
        .from('strategic_initiatives')
        .insert(initiative);

      if (error) {
        console.error(`  Error creating ${initiative.slug}:`, error);
      } else {
        console.log(`  Created successfully!`);
      }
    }
  }

  console.log('\nDone seeding strategic initiatives!');
}

seedInitiatives().catch(console.error);
