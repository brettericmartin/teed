# Teed Pending Work - Consolidated Reference

**Last Updated:** January 2026
**Purpose:** Single source of truth for all potential future work

> This document consolidates all pending work from previous plan documents.
> Items are organized by theme and priority, not by when they were originally proposed.
> Use this document to evaluate what to build next.

---

## Document Status

This document supersedes the following plan documents for roadmap purposes:
- `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
- `COMPREHENSIVE_SITE_ENHANCEMENT_PLAN.md` (Phase 2-3)
- `BETA_SYSTEM_PLAN.md` (Phase 2)
- `MCP_SERVER_STRATEGY.md`
- `B2B_BRAND_PARTNERSHIPS_STRATEGY.md`
- `ENTERPRISE_TEAM_BAGS_STRATEGIC_PLAN.md`
- `INFRASTRUCTURE_API_STRATEGIC_PLAN.md`
- `BAG_POWERED_LEAD_MAGNETS.md`

Those documents remain as detailed references if you need implementation specifics.

---

## What's Already Built (Not Pending)

Before reviewing pending work, here's what V1.0 includes:

**Core Platform:**
- Bags with items, links, hero items, cover photos
- Profile panels/blocks system (11 panel types)
- Public bag views with sharing (links, QR codes)
- Item history tracking (version history)

**AI Features:**
- Photo product identification (`/api/ai/identify-products`)
- Link identification pipeline (`/lib/linkIdentification/`)
- AI enrichment for items (`/api/ai/enrich-item`)
- Bulk enrichment (`/api/items/fill-info`)
- Bag analyzer with quality scoring (`/lib/analyzer/`)
- Ideas agent for inspiration (`/lib/ideas/`)

**Monetization:**
- Affiliate link system (`/lib/affiliate/`)
- Multi-retailer link support

**User System:**
- Authentication with Supabase
- Beta application system (Phase 1 complete)
- Badge/achievement system (`/lib/badges/`)

---

## Pending Work by Priority

### Tier 1: Near-Term Enhancements

These items build directly on existing infrastructure and provide immediate user value.

#### 1.1 Beta System Completion
**Source:** `BETA_SYSTEM_PLAN.md` Phase 2
**Effort:** 1-2 weeks
**Dependencies:** None

- [ ] Admin dashboard for application review (approve/reject/batch)
- [ ] Admin API routes for beta management
- [ ] Email notification system (welcome, approval, rejection emails)
- [ ] Weekly position update emails for waitlist

**Why:** Beta system is partially built. Completing it enables proper launch.

---

#### 1.2 Discovery & Search Improvements
**Source:** `COMPREHENSIVE_SITE_ENHANCEMENT_PLAN.md` Phase 2
**Effort:** 2-3 weeks
**Dependencies:** None

- [ ] Enhanced search filters (by category, brand, price range)
- [ ] Search result ranking improvements
- [ ] "Discover" page with curated/featured bags
- [ ] Follow system (follow users, get updates)
- [ ] Fork/clone attribution ("Based on @user/bag")

**Why:** Discovery increases engagement and makes the platform more valuable for all users.

---

#### 1.3 Influencer/Creator Tools
**Source:** `COMPREHENSIVE_SITE_ENHANCEMENT_PLAN.md` Phase 2, `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
**Effort:** 2-4 weeks
**Dependencies:** None

- [ ] Bulk operations (edit multiple items at once)
- [ ] Link templates (saved retailer configurations)
- [ ] Basic analytics dashboard (views, clicks per bag)
- [ ] Transcript processing (extract products from video/podcast transcripts)
- [ ] Content generation (captions, hashtags, YouTube descriptions)

**Why:** Power users need efficiency tools. This differentiates from basic gear lists.

---

### Tier 2: Platform Intelligence

These add AI-powered value that compounds over time.

#### 2.1 Visual Similarity Search
**Source:** `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
**Effort:** 3-4 weeks
**Dependencies:** Vector database (pgvector or Pinecone)

- [ ] Extract visual features from item images
- [ ] "Find similar products" feature
- [ ] Style-based recommendations
- [ ] Integration with product search

**Why:** Unique differentiator. No competitor offers visual gear matching.

---

#### 2.2 Style Profile & Recommendations
**Source:** `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
**Effort:** 3-4 weeks
**Dependencies:** User has multiple bags

- [ ] Build style profiles from user's bags (brands, categories, price range)
- [ ] "For You" recommendations on discover page
- [ ] "Complete your setup" suggestions
- [ ] Style evolution tracking over time

**Why:** Personalization increases engagement and discovery.

---

#### 2.3 Price Intelligence
**Source:** `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
**Effort:** 2-3 weeks
**Dependencies:** None

- [ ] Track price history for items with links
- [ ] Price drop alerts (email notifications)
- [ ] "Best time to buy" recommendations
- [ ] Price comparison across retailers

**Why:** Direct monetization opportunity. Users want to save money.

---

#### 2.4 Intelligent Bag Organization
**Source:** `AI_SPECIALIST_IMPLEMENTATION_ROADMAP.md`
**Effort:** 1-2 weeks
**Dependencies:** None

- [ ] AI-suggested bag organization
- [ ] Duplicate detection across bags
- [ ] "Missing categories" identification
- [ ] Auto-suggest bag names/descriptions

**Why:** Reduces friction in bag creation. Quick win.

---

### Tier 3: Platform Expansion

These are significant new capabilities that expand Teed's reach.

#### 3.1 MCP Server (AI Integration)
**Source:** `MCP_SERVER_STRATEGY.md`
**Effort:** 6-8 weeks (phased)
**Dependencies:** OAuth infrastructure

**Phase 1: Core Foundation**
- [ ] MCP server scaffolding
- [ ] OAuth 2.1 resource server setup
- [ ] Core tools: bags, items, users
- [ ] Basic resources and authentication
- [ ] Documentation and Claude Desktop testing

**Phase 2-4:** Search, exports, creator tools, AI-native features

**Why:** Transforms Teed into infrastructure for AI assistants. High strategic value.

**Full spec:** See `MCP_SERVER_STRATEGY.md`

---

#### 3.2 Infrastructure API
**Source:** `INFRASTRUCTURE_API_STRATEGIC_PLAN.md`
**Effort:** 8-12 weeks (phased)
**Dependencies:** None

**Phase 1: Core API**
- [ ] API Gateway with rate limiting
- [ ] API key management system
- [ ] Core endpoints: bags, items, users
- [ ] OAuth 2.0 for user-delegated access
- [ ] Webhook support
- [ ] Developer documentation portal

**Phase 2-4:** Intelligence services, affiliate API, exports

**Why:** Enables newsletter platforms, YouTube tools, etc. to integrate with Teed.

**Full spec:** See `INFRASTRUCTURE_API_STRATEGIC_PLAN.md`

---

#### 3.3 Bag-Powered Lead Magnets
**Source:** `BAG_POWERED_LEAD_MAGNETS.md`
**Effort:** 6-9 weeks (phased)
**Dependencies:** Email infrastructure (Resend already integrated)

**Phase 1: Foundation**
- [ ] Subscription tables and API
- [ ] Double opt-in flow
- [ ] Basic email notifications on bag updates
- [ ] Unsubscribe handling

**Phase 2-3:** Creator dashboard, analytics, custom broadcasts

**Why:** Turns bags into lead generation assets. High value for creators.

**Full spec:** See `BAG_POWERED_LEAD_MAGNETS.md`

---

### Tier 4: B2B Expansion

These represent new business lines. Significant investment required.

#### 4.1 Brand Partnerships Program
**Source:** `B2B_BRAND_PARTNERSHIPS_STRATEGY.md`
**Effort:** 12+ weeks
**Dependencies:** Significant creator base

- [ ] Brand portal and verified catalogs
- [ ] Shopify integration for catalog sync
- [ ] Usage analytics dashboard for brands
- [ ] Creator discovery tools for brands
- [ ] Verified product badges

**Revenue Model:** SaaS subscriptions ($199-$1,499/month per brand)

**Why:** B2B revenue stream. Makes platform more valuable for creators too.

**Full spec:** See `B2B_BRAND_PARTNERSHIPS_STRATEGY.md`

---

#### 4.2 Enterprise Team Bags
**Source:** `ENTERPRISE_TEAM_BAGS_STRATEGIC_PLAN.md`
**Effort:** 12+ weeks
**Dependencies:** Multi-tenancy architecture

- [ ] Organizations and workspaces
- [ ] Role-based templates
- [ ] Shared bag permissions
- [ ] Approval workflows
- [ ] SSO/SAML integration
- [ ] Audit logging

**Revenue Model:** Per-seat SaaS ($12-$25/seat/month)

**Why:** Boring business revenue. Equipment documentation is underserved.

**Full spec:** See `ENTERPRISE_TEAM_BAGS_STRATEGIC_PLAN.md`

---

### Tier 5: Long-Term Vision

These are exploratory/future items mentioned across plans.

#### 5.1 Advanced AI Features
- [ ] Conversational shopping assistant (chat-based bag building)
- [ ] Trend detection and forecasting
- [ ] Quality/authenticity verification
- [ ] AR/VR try-on experiments

#### 5.2 Platform Features
- [ ] Native mobile app (iOS/Android)
- [ ] Voice interface for bag management
- [ ] Multi-language support / globalization
- [ ] Comments/discussions on bags (careful: doctrine risk)

#### 5.3 Monetization
- [ ] Freemium tiers for creators
- [ ] Affiliate revenue optimization
- [ ] Sponsored/featured placements

---

## Evaluation Framework

When deciding what to build next, consider:

### Doctrine Alignment
Every feature must pass the doctrine test from `claude.md`:

1. **Does it reduce explanation friction?**
2. **Does it increase trust?**
3. **Does it preserve the sacred hierarchy?** (Bags > Items > Links > Profile)
4. **Does it avoid obligation?** (No pressure, no guilt)
5. **Is it constructive dopamine only?** (Pride of creation, not anxiety)
6. **Does it pass the "stale" test?** (Old bags still feel valid)

### Advisory Board Questions

| Advisor | Key Question |
|---------|--------------|
| **Daniel Priestley** | "Does this create visible demand/supply tension?" |
| **Julie Zhuo** | "Does this feel discovered, not disrupted?" |
| **Li Jin** | "Does this increase creator control and leverage?" |
| **Emily Heyward** | "Would creators proudly show this branding?" |
| **Codie Sanchez** | "Is this picks-and-shovels that enables everyone?" |

### Implementation Considerations

- **Quick wins:** Tier 1 items build on existing code
- **Strategic bets:** MCP Server and Infrastructure API position Teed as infrastructure
- **Revenue diversification:** B2B items (Brand Partnerships, Team Bags) create recurring revenue
- **Risk:** Tier 5 items may drift from doctrine; evaluate carefully

---

## Items NOT to Build

From `claude.md` and doctrine, these are explicitly forbidden:

- **Feeds** - chronological or algorithmic content streams
- **Trending / Popular sections** - ranking systems that create FOMO
- **Engagement notifications** - "Someone viewed your bag"
- **Freshness pressure** - "Updated 3 days ago" as negative indicator
- **Streak counters** - gamification of posting cadence
- **Follower count emphasis** - followers exist but are not the point
- **Infinite scroll** - paginated or intentional navigation only
- **Auto-playing content** - user initiates all media
- **Urgency language** - "Don't miss out", "Hot", "Trending"
- **Activity dashboards** - engagement metrics for creators
- **Forced recency** - sorting that penalizes older content
- **Real-time activity feeds** - "X just saved this bag"
- **Comparison features** - "Your bag has fewer saves than average"
- **Growth prompts** - "Share to get more followers"

---

## How to Use This Document

1. **Choosing next work:** Start from Tier 1 unless there's strategic reason to prioritize lower tiers
2. **Scoping:** Each item links to detailed spec documents where available
3. **Updating:** Mark items complete by moving to "What's Already Built" section
4. **Adding new ideas:** Add to appropriate tier with source and effort estimate

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-26 | Initial consolidation from 8+ plan documents |

---

*This document is the single reference for pending work. Keep it updated.*
