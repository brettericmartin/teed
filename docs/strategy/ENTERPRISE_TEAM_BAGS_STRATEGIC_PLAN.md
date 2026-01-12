# Enterprise Team Bags: Strategic Plan

## The Boring Business B2B Vertical for Teed

**Document Type:** Strategic Business Plan
**Version:** 1.0
**Date:** January 2026
**Status:** Strategic Proposal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Use Cases](#4-use-cases)
5. [Feature Set](#5-feature-set)
6. [Pricing Model](#6-pricing-model)
7. [Technical Architecture](#7-technical-architecture)
8. [Go-to-Market Strategy](#8-go-to-market-strategy)
9. [Success Metrics](#9-success-metrics)
10. [Risk Assessment](#10-risk-assessment)
11. [Competitive Analysis](#11-competitive-analysis)
12. [Advisory Board Evaluation](#12-advisory-board-evaluation)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Financial Projections](#14-financial-projections)

---

## 1. Executive Summary

### The Opportunity

Every company, regardless of size, faces a persistent problem: **equipment chaos**. New hires ask "What laptop should I get?" Remote teams struggle with "What's the standard setup?" Event organizers scramble with "What do we need to bring?" Today, this information lives scattered across Notion pages, Google Docs, Slack threads, and tribal knowledge.

**Enterprise Team Bags** transforms Teed into the canonical reference system for company equipment documentation. By extending Teed's core "bags as containers of gear with context" model to B2B teams, we create a new revenue vertical with consistent, predictable cash flow.

### Why This Fits Teed

Teed's core value proposition—**bags as canonical references with links that work 24/7**—translates perfectly to enterprise needs:

| Consumer Teed | Enterprise Team Bags |
|---------------|----------------------|
| Creator's golf bag setup | Engineering team's standard laptop loadout |
| Photographer's gear kit | Marketing department's conference kit |
| Remote worker's desk setup | New hire equipment checklist |
| Gift list for friends | Procurement list for office managers |

The infrastructure exists. The mental model is proven. The B2B extension creates a "boring business" revenue stream.

### Financial Case

- **Target:** $500K ARR within 24 months
- **Model:** Per-seat SaaS + team tiers
- **Margins:** 85%+ (software, no physical goods)
- **Churn Risk:** Low (equipment lists become institutional knowledge)

---

## 2. Problem Statement

### 2.1 Onboarding Chaos

**The Pain:** New employees joining any company face the same questions:
- "What laptop should I order?"
- "What software do I need?"
- "Where do I get a monitor?"
- "What's the approved peripherals list?"

**Current "Solutions":**
- Notion pages that are perpetually outdated
- Slack channels with conflicting advice
- Asking colleagues who give different answers
- IT tickets that take days to resolve

**The Cost:**
- Average new hire loses 3-5 hours finding equipment answers
- IT teams spend 15% of time answering repetitive questions
- Inconsistent equipment creates support burden
- Wrong purchases waste budget and require returns

**Statistics:**
- 82% of IT professionals struggle with procuring IT equipment for remote employees ([GroWrk](https://growrk.com/blog/it-onboarding-software-tools))
- Gartner estimates 30% of fixed IT assets are "ghosts"—missing, untracked, or left in a former employee's closet ([Workwize](https://www.goworkwize.com/blog/best-equipment-tracking-software))

### 2.2 Equipment Standardization Breakdown

**The Pain:** Without clear standards, companies experience:
- Engineering using 5 different laptop models (support nightmare)
- Design team with inconsistent monitor calibration
- Sales team with varying webcam quality (looks unprofessional)
- Finance team ordering whatever seems cheapest

**Why It Matters:**
- Support costs increase with hardware diversity
- Collaboration suffers when tools don't match
- Security risks from non-approved devices
- Budget unpredictability from ad-hoc purchases

### 2.3 Remote Team Coordination Gap

**The Pain:** With 63% of the IT asset management market now cloud-based ([Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/it-asset-management-market)), remote work is permanent. But coordination is broken:
- Remote employees in 15 countries, 15 different equipment setups
- No visibility into what remote workers actually have
- Shipping equipment internationally is complex
- No clear "this is what you need to work remotely" answer

**The Irony:** Companies spend thousands on IT Asset Management (ITAM) software tracking *what exists* but have no good system for documenting *what should exist*.

### 2.4 The Documentation Problem

**Current State:** Companies use:
- **Notion/Confluence:** Flexible but becomes stale, poor permissions for external sharing
- **Google Docs:** Scattered, no structure, version chaos
- **ITAM Systems:** Track inventory, not recommendations; complex and expensive
- **Slack/Email:** Information gets buried instantly

**What's Missing:**
- A **canonical source** for "here's what you need"
- **Template-based** role standardization
- **Permission controls** for sensitive equipment lists
- **Update propagation** without version nightmares
- **Embeddable** references that stay current

---

## 3. Solution Overview

### 3.1 Core Concept: Team Workspaces

**Team Workspaces** extend Teed's individual bags model to organizational contexts:

```
Organization (Acme Corp)
├── Workspaces
│   ├── Engineering
│   │   ├── Standard Dev Setup (bag)
│   │   ├── Senior Engineer Additions (bag)
│   │   └── Data Science Kit (bag)
│   ├── Design
│   │   ├── Designer Standard (bag)
│   │   └── Video Production Kit (bag)
│   └── Company-Wide
│       ├── Remote Work Essentials (bag)
│       └── Conference Travel Kit (bag)
├── Team Members (seats)
└── Templates
```

### 3.2 Shared Bag Permissions

Granular control over who can do what:

| Role | View | Clone | Edit | Admin |
|------|------|-------|------|-------|
| Guest | Read only | No | No | No |
| Member | Yes | To personal | No | No |
| Editor | Yes | Yes | Yes | No |
| Admin | Yes | Yes | Yes | Yes |

**Permission Inheritance:**
- Organization admins see everything
- Workspace admins see their workspace
- Individual bags can have custom permissions
- External sharing with link-level access control

### 3.3 Template Bags for Roles

**Role Templates** solve the "every new hire asks the same questions" problem:

```
Template: "Backend Engineer Standard Setup"
├── Items
│   ├── MacBook Pro 14" M4 Pro
│   │   └── Links: Apple Store, CDW, procurement portal
│   ├── 27" 4K Monitor
│   │   └── Links: Dell Business, approved alternatives
│   ├── Mechanical Keyboard
│   │   └── Links: Multiple options with price ranges
│   └── [10 more items...]
├── Context
│   ├── Why these choices (curator notes)
│   ├── Procurement process
│   └── IT setup instructions
└── Metadata
    ├── Budget range: $3,000-$4,500
    ├── Approval required: Yes, for >$500 items
    └── Last reviewed: January 2026
```

**How Templates Work:**
1. Admin creates template for role
2. New hire clones template to personal list
3. Manager approves their customizations
4. Procurement orders from approved links
5. Template updates propagate to future hires

### 3.4 The Canonical Reference Advantage

Unlike Notion pages that drift or Confluence spaces that bloat, Team Bags remain:

- **Canonical:** One source of truth, not 15 versions
- **Current:** Links update in place (Teed's embed/export system)
- **Shareable:** Give vendors a link, not a PDF that's outdated tomorrow
- **Auditable:** Change logs track who modified what
- **Embeddable:** Embed in company wiki, onboarding docs, or email

---

## 4. Use Cases

### 4.1 New Hire Equipment Kit

**Scenario:** Startup with 50 employees hires 5 engineers/month

**Before Team Bags:**
- HR sends email with outdated equipment list
- New hire messages 3 colleagues for real recommendations
- Spends 4 hours researching laptops
- Orders wrong monitor (not compatible with dock)
- IT ticket to fix the issue takes 2 days

**With Team Bags:**
1. HR shares link to "Engineering Starter Kit" bag
2. New hire sees exactly what they need with procurement links
3. Clones to personal list, makes any approved customizations
4. Manager approves in one click
5. Orders placed within 30 minutes
6. Everything is compatible because template is curated

**Value Created:**
- 4 hours saved per new hire
- Zero wrong orders
- Consistent equipment = easier support
- Audit trail for compliance

### 4.2 Remote Work Setup Standard

**Scenario:** Company goes remote-first, needs to standardize home offices

**The Bag:** "Remote Work Essentials"
```
├── Ergonomic Chair (3 options, $300-$800)
├── Standing Desk (approved vendors)
├── Monitor Arm (specific model for consistency)
├── Webcam (same model = same video quality)
├── Ring Light (optional but recommended)
├── Noise-Canceling Headphones (2 approved)
├── USB-C Hub (specific compatible model)
└── Cable Management Kit
```

**Why Bags Beat Documents:**
- Links go directly to corporate purchasing portals
- Stipend guidance embedded ("$1,500 home office budget")
- Notes explain *why* specific items (ergonomic certification, warranty terms)
- Updates when better options become available
- Can share externally with candidates ("here's our setup")

### 4.3 Team-Specific Tool Stacks

**Scenario:** Design team needs specialized software and hardware

**The Bag:** "Design Team Creative Stack"
```
Hardware:
├── MacBook Pro 16" M4 Max (why: Adobe performance)
├── 32" 4K Display (calibration profile included)
├── Wacom Tablet (specific model for driver consistency)
└── Color Calibrator (shared across team)

Software:
├── Adobe Creative Cloud (license process link)
├── Figma (team workspace invite)
├── Principle (prototyping)
└── Loom (video communication)
```

**Cross-Team Sharing:**
- Engineering can view Design's stack to understand dependencies
- Finance can see costs for budget planning
- New designers know exactly what to expect

### 4.4 Event/Project Equipment Lists

**Scenario:** Marketing team manages trade show gear

**The Bag:** "Trade Show Kit - Tier 1 Booth"
```
├── Popup Display (specific model, stored in HQ)
├── Branded Tablecloth (vendor link for replacements)
├── iPad Pros x4 (asset numbers, locked to lead capture app)
├── Portable Battery Packs x6
├── HDMI Adapters x10 (we always forget these)
├── Extension Cords (venue-approved type)
└── Emergency Supplies
    ├── Gaffer Tape
    ├── Zip Ties
    └── First Aid Kit
```

**Bag Notes Include:**
- Checklist of what's in storage vs. what to ship
- Vendor contacts for rush orders
- Lessons learned from previous events

### 4.5 Department Procurement Lists

**Scenario:** Finance needs visibility into standard costs

**Department Bags Provide:**
- Clear budget expectations by role
- Approved vendor relationships
- Audit-ready procurement documentation
- Year-over-year equipment cost tracking

---

## 5. Feature Set

### 5.1 Team Management

**Organization Structure:**
```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'team' | 'enterprise';
  seats: number;
  seatUsage: number;
  workspaces: Workspace[];
  settings: OrgSettings;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  bags: Bag[];
  templates: BagTemplate[];
}
```

**Admin Features:**
- Add/remove team members (SSO or email invite)
- Create workspaces for departments
- Set default permissions
- View organization-wide activity
- Manage billing and seats

### 5.2 Role-Based Templates

**Template System:**
```typescript
interface BagTemplate {
  id: string;
  name: string;
  role: string; // "Backend Engineer", "Designer", etc.
  category: 'onboarding' | 'project' | 'event' | 'standard';
  items: TemplateItem[];
  approvalRequired: boolean;
  budgetRange: { min: number; max: number };
  lastReviewedAt: Date;
  reviewedBy: string;
}
```

**Template Features:**
- Clone templates to create individual bags
- Track which bags derived from which template
- Bulk-update template pushes suggestions to derived bags
- Version history with diff comparison
- Expiration/review reminders

### 5.3 Approval Workflows

**Simple Approval Flow:**
1. Employee clones template or creates bag
2. Marks items as "requesting approval"
3. Manager receives notification
4. Manager approves/rejects/suggests alternatives
5. Approval logged for compliance

**Approval States:**
- `draft` - Being edited
- `pending_approval` - Awaiting manager review
- `approved` - Ready for procurement
- `ordered` - Items have been purchased
- `complete` - All items received

**Enterprise Workflow Option:**
- Multi-level approval for high-cost items
- Auto-approve under threshold
- Integration with procurement systems via webhook

### 5.4 Budget Tracking

**Per-Bag Budget Features:**
- Estimated total (sum of item prices)
- Budget limit with warning when exceeded
- Actual vs. estimated tracking
- Department rollup reports

**Integration Points:**
- Link to corporate purchasing portals
- Price tracking over time
- Bulk discount suggestions when multiple people need same item

### 5.5 Procurement Integration

**Phase 1: Link-Based (MVP)**
- Items link to purchasing portal pages
- Standard affiliate links for approved vendors
- CDW, Amazon Business, vendor-specific portals

**Phase 2: API Integration (Future)**
- Direct integration with procurement systems
- One-click "Request Purchase" button
- Auto-populate PO with bag contents
- Status sync (ordered, shipped, delivered)

**Supported Patterns:**
- Public purchasing links (Amazon, vendor stores)
- Corporate portal deep links (CDW, Dell Business)
- Internal requisition system links
- Vendor contact information

---

## 6. Pricing Model

### 6.1 Tier Structure

**Based on B2B SaaS best practices, using a hybrid per-seat model with feature tiers:**

| Plan | Price | Seats | Key Features |
|------|-------|-------|--------------|
| **Starter** | $0 | 1 | Personal bags, basic sharing |
| **Team** | $12/seat/month | 3-50 | Workspace, templates, shared bags |
| **Business** | $25/seat/month | 10-500 | SSO, approval workflows, analytics |
| **Enterprise** | Custom | Unlimited | Custom integrations, dedicated support |

### 6.2 Pricing Rationale

**Why Per-Seat:**
- Simple to understand and budget (explained in 30 seconds) ([SaaStock](https://www.saastock.com/blog/saas-pricing-models-insights-from-industry-leaders/))
- Aligns with value (more users = more value)
- Predictable revenue for forecasting
- Industry standard for collaboration tools

**Why These Price Points:**
- **$12/seat (Team):** Below Notion ($15/seat for Team AI) but above pure docs tools
- **$25/seat (Business):** Comparable to Confluence Premium ($11) + add-ons
- Positions Teed as premium but accessible

**Annual Discount:**
- 20% off for annual commitment
- Team: $10/seat/month (annual)
- Business: $20/seat/month (annual)

### 6.3 Feature Breakdown by Tier

| Feature | Starter | Team | Business | Enterprise |
|---------|---------|------|----------|------------|
| Personal bags | Unlimited | Unlimited | Unlimited | Unlimited |
| Team workspaces | - | 3 | Unlimited | Unlimited |
| Shared bags | 5 | Unlimited | Unlimited | Unlimited |
| Templates | - | 10 | Unlimited | Unlimited |
| Approval workflows | - | Basic | Advanced | Custom |
| SSO/SAML | - | - | Yes | Yes |
| Audit logs | - | - | 90 days | Unlimited |
| Analytics | - | Basic | Advanced | Custom |
| API access | - | - | Read | Full |
| Support | Community | Email | Priority | Dedicated |
| Custom domain | - | - | - | Yes |

### 6.4 Enterprise Custom Pricing

For organizations with 500+ seats:
- Volume discounts starting at 20%
- Custom contract terms
- Dedicated success manager
- Custom integrations
- SLA guarantees
- Data residency options

---

## 7. Technical Architecture

### 7.1 Multi-Tenancy Model

**Database Schema Extension:**

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  seat_limit INTEGER DEFAULT 1,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization membership
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- Workspaces within organizations
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Workspace membership
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'member', -- 'admin', 'editor', 'member'
  UNIQUE(workspace_id, user_id)
);

-- Extend bags for team context
ALTER TABLE bags ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE bags ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE bags ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE bags ADD COLUMN template_id UUID REFERENCES bags(id);
ALTER TABLE bags ADD COLUMN approval_status TEXT;
ALTER TABLE bags ADD COLUMN budget_limit INTEGER;

-- Bag permissions for team sharing
CREATE TABLE bag_permissions (
  id UUID PRIMARY KEY,
  bag_id UUID REFERENCES bags(id),
  grantee_type TEXT, -- 'user', 'workspace', 'organization'
  grantee_id UUID,
  permission_level TEXT, -- 'view', 'clone', 'edit', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bag_id, grantee_type, grantee_id)
);
```

### 7.2 Row Level Security (RLS) Extension

```sql
-- Organizations: members can view their org
CREATE POLICY "org_member_read" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Bags: complex permission check
CREATE POLICY "bag_team_access" ON bags
  FOR SELECT USING (
    -- Personal bag (existing)
    owner_id = auth.uid()
    OR
    -- Public bag (existing)
    is_public = TRUE
    OR
    -- Same organization
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR
    -- Explicit permission
    id IN (
      SELECT bag_id FROM bag_permissions
      WHERE (grantee_type = 'user' AND grantee_id = auth.uid())
         OR (grantee_type = 'workspace' AND grantee_id IN (
              SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            ))
    )
  );
```

### 7.3 SSO Integration

**Supported Providers:**
- SAML 2.0 (enterprise standard)
- OAuth 2.0 (Google Workspace, Microsoft 365)
- OIDC (Okta, Auth0, OneLogin)

**Implementation:**
```typescript
// Using Supabase Auth with SAML
const { data, error } = await supabase.auth.signInWithSSO({
  domain: 'acmecorp.com', // Maps to their IdP
});
```

**Auto-provisioning:**
- JIT (Just-In-Time) user creation from SSO
- SCIM 2.0 for enterprise directory sync
- Group-to-workspace mapping

### 7.4 Admin Controls

**Organization Settings:**
```typescript
interface OrgSettings {
  // Branding
  logoUrl?: string;
  primaryColor?: string;

  // Security
  requireSSO: boolean;
  allowedEmailDomains: string[];
  sessionTimeoutMinutes: number;

  // Permissions
  membersCanCreateWorkspaces: boolean;
  membersCanInviteMembers: boolean;
  requireApprovalForPurchases: boolean;
  purchaseApprovalThreshold: number;

  // Data
  dataRetentionDays: number;
  exportEnabled: boolean;
}
```

**Audit Logging:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'bag.created', 'member.invited', etc.
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
```

---

## 8. Go-to-Market Strategy

### 8.1 Target Customer Segments

**Primary: Tech Startups (50-500 employees)**
- Pain: Rapid hiring, inconsistent equipment
- Budget: Yes, willing to pay for efficiency
- Decision-maker: VP Ops, Head of IT, HR Director
- Sales motion: Product-led, self-serve to sales-assisted

**Secondary: Agencies & Studios (20-200 employees)**
- Pain: Project-based equipment, creative tool stacks
- Budget: Moderate, value design/aesthetics
- Decision-maker: Operations Manager, Creative Director
- Sales motion: Product-led with case studies

**Tertiary: Remote-First Companies (Any size)**
- Pain: Distributed equipment management
- Budget: Variable, clearly see ROI
- Decision-maker: Remote/Distributed Lead, COO
- Sales motion: Content-driven inbound

### 8.2 Sales Motion

**Phase 1: Product-Led Growth (Months 1-6)**

1. **Free Tier Acquisition:**
   - Individual creators discover Teed for personal bags
   - Create bags for their own work setup
   - Share with colleagues naturally

2. **Team Upgrade Prompt:**
   - "Multiple people at [company] are using Teed"
   - "Want to create a shared workspace?"
   - Easy upgrade path with first month free

3. **Self-Serve Team Plan:**
   - Credit card checkout, no sales call required
   - Onboarding wizard for workspace setup
   - Templates library to get started quickly

**Phase 2: Sales-Assisted Growth (Months 6-18)**

1. **Inbound Qualification:**
   - Teams hitting limits request Business features
   - Companies searching for "equipment onboarding solution"
   - Referrals from existing customers

2. **Outbound Targeting:**
   - LinkedIn outreach to VP Ops at growing startups
   - Cold email to recently funded companies (hiring spree)
   - Partner referrals from IT service providers

3. **Enterprise Sales:**
   - Dedicated AE for 500+ seat opportunities
   - Custom pilots and POCs
   - Executive relationship building

### 8.3 Pilot Program

**"Founding Teams" Program:**

- **Offer:** 6 months free Business tier for first 20 companies
- **Requirements:**
  - Active use (create 5+ bags in first month)
  - Participate in 2 feedback calls
  - Provide testimonial if satisfied
- **Goal:** Case studies, product feedback, initial logos

**Ideal Pilot Companies:**
- 50-200 employees
- Growing/hiring actively
- Remote or hybrid
- Already using Teed personally (bonus)

### 8.4 Marketing Channels

**Content Marketing:**
- "The Equipment Onboarding Playbook" (gated PDF)
- "How [Company] Standardized Remote Work Setups" (case studies)
- "Equipment Management for Startups" blog series

**SEO Targets:**
- "employee equipment checklist"
- "new hire laptop setup guide"
- "remote work equipment standard"
- "IT onboarding checklist template"

**Community:**
- Post in Ops/IT communities (r/sysadmin, IT subreddits)
- Sponsor relevant Slack communities
- Speak at ops/IT meetups

**Partnerships:**
- IT service providers (they recommend tooling)
- HR platforms (onboarding integration)
- Equipment vendors (CDW, Dell Business)

---

## 9. Success Metrics

### 9.1 North Star Metric

**Active Team Bags per Organization per Month**

This metric captures:
- Teams are creating bags (adoption)
- Bags are being used actively (engagement)
- Value delivered (ROI for customer)

### 9.2 Acquisition Metrics

| Metric | Target (Month 6) | Target (Month 12) | Target (Month 24) |
|--------|------------------|-------------------|-------------------|
| Total Organizations | 100 | 500 | 2,000 |
| Paid Organizations | 20 | 150 | 600 |
| Total Seats | 500 | 5,000 | 25,000 |
| MRR | $6,000 | $60,000 | $300,000 |

### 9.3 Engagement Metrics

| Metric | Healthy Benchmark |
|--------|-------------------|
| Bags per org | 10+ after 30 days |
| Weekly active users per org | 40%+ of seats |
| Template usage rate | 50%+ of bags from templates |
| Bag views per bag | 5+ per month |
| Clone rate (internal) | 20%+ of bags cloned |

### 9.4 Retention Metrics

| Metric | Target |
|--------|--------|
| 30-day retention (org) | 80% |
| 90-day retention (org) | 70% |
| Net Revenue Retention | 110%+ |
| Gross Churn | <5% monthly |

### 9.5 Efficiency Metrics

| Metric | Target |
|--------|--------|
| CAC (Customer Acquisition Cost) | <$500 for Team, <$2,000 for Business |
| Payback Period | <6 months |
| LTV:CAC Ratio | >3:1 |
| Support tickets per org | <2/month |

---

## 10. Risk Assessment

### 10.1 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Large player enters market** | Medium | High | Move fast, build community moat, focus on specific ICP |
| **ITAM vendors add documentation** | High | Medium | Position as "the simple layer" - we're not competing with Flexera |
| **Economic downturn slows hiring** | Medium | Medium | Equipment standardization becomes MORE important in tight budgets |
| **Remote work reversal** | Low | Medium | Hybrid still needs equipment docs; office equipment also applicable |

### 10.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Feature creep into ITAM territory** | High | High | Strict doctrine: we're reference docs, not asset tracking |
| **Enterprise complexity bloats UX** | Medium | High | Separate admin interface, keep core experience simple |
| **Template maintenance burden** | Medium | Medium | Community templates, AI-assisted updates |
| **Permission complexity confusion** | Medium | Medium | Progressive disclosure, sensible defaults |

### 10.3 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Multi-tenancy security breach** | Low | Critical | RLS by default, regular security audits, SOC 2 |
| **SSO integration complexity** | Medium | Medium | Use battle-tested libraries, start with common IdPs |
| **Scale issues with large orgs** | Low | Medium | Supabase handles scale; partition if needed |
| **Data migration from existing tools** | Medium | Low | Import tools for Notion/Confluence/CSV |

### 10.4 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Cannibalization of creator business** | Low | Medium | Different value prop, different buyer, can coexist |
| **Sales cycle too long for enterprise** | Medium | Medium | Focus on self-serve first, enterprise is gravy |
| **Pricing too low / too high** | Medium | Medium | Start mid-market, adjust based on win/loss |
| **Support burden overwhelms team** | Medium | Medium | Self-serve onboarding, extensive docs, community |

---

## 11. Competitive Analysis

### 11.1 Direct Competitors

**Notion / Confluence (Documentation)**

| Factor | Them | Teed Team Bags |
|--------|------|----------------|
| Core use case | General documentation | Equipment-specific reference |
| Item-level structure | Freeform | Structured (item + links + context) |
| Embeddability | Limited | Full embed system, RSS, oEmbed |
| Link management | Manual, breaks | Canonical, always current |
| Pricing | $15-25/seat | $12-25/seat |
| Complexity | High (flexible = complex) | Low (purpose-built) |

**Positioning:** "Notion is where you document everything. Teed is where your equipment lists live and stay current."

**IT Asset Management (Flexera, ServiceNow, ManageEngine)**

| Factor | ITAM | Teed Team Bags |
|--------|------|----------------|
| Focus | Track what EXISTS | Document what SHOULD exist |
| Complexity | Enterprise-grade | SMB-friendly |
| Pricing | $10K-$100K+/year | $1K-$10K/year |
| Implementation | Months | Minutes |
| Users | IT admins | Everyone (HR, managers, employees) |

**Positioning:** "ITAM tracks inventory. Teed defines standards. They're complementary."

**Remote Equipment Management (Rippling, GroWrk, Firstbase)**

| Factor | Equipment Management | Teed Team Bags |
|--------|----------------------|----------------|
| Focus | Procurement + logistics | Documentation + standards |
| Services | Ship physical equipment | Define what to ship |
| Pricing | Per-device fees | Per-seat SaaS |
| Global coverage | Key differentiator | N/A (we're software) |

**Positioning:** "They ship equipment. We define what to ship. Use both together."

### 11.2 Competitive Advantages

1. **Purpose-Built Simplicity:**
   - Not trying to be everything (Notion)
   - Not enterprise-complex (ITAM)
   - Just equipment documentation, done perfectly

2. **Canonical Reference Model:**
   - Embeds that auto-update
   - Single source of truth architecture
   - Built-in link management (affiliate system)

3. **Creator DNA:**
   - Beautiful, shareable presentations
   - Pride of ownership in equipment lists
   - Designed for humans, not just admins

4. **Price-to-Value:**
   - 10x cheaper than ITAM
   - More focused than general docs tools
   - Clear ROI calculation

### 11.3 Switching Costs

**Switching TO Teed:**
- Low: Import from Notion/Confluence/CSV
- Templates get teams started immediately
- No data migration required (additive tool)

**Switching FROM Teed:**
- Medium: Export to Markdown/CSV
- Templates and permissions are Teed-specific
- Institutional knowledge accumulates in bags

---

## 12. Advisory Board Evaluation

### Daniel Priestley Evaluation: 9/10

**24/7 Asset Creation:**
> "Each Team Bag is a digital asset that works while the company sleeps. When a new hire joins at 2 AM, the equipment documentation is there, accurate, and actionable. This is exactly what the 24 Assets framework calls for."

**Demand/Supply Tension:**
> "The pilot program creates natural scarcity—'20 founding teams'—generating signal before sale. Companies signal interest by applying, we select those with best fit."

**7/11/4 Amplification:**
> "A single Team Bag can be embedded in the onboarding doc (location 1), linked in the offer letter (location 2), shared in Slack (location 3), and presented in orientation (location 4). One bag becomes multiple touchpoints."

**Verdict: APPROVED**
> "This transforms equipment documentation from a one-time task into a compounding asset. The more templates created, the more value accumulated, the stickier the platform."

### Julie Zhuo Evaluation: 8/10

**Simplicity:**
> "The mental model is clean: Organizations have Workspaces, Workspaces have Bags, Bags have Items. Progressive disclosure means admins see complexity, members see simplicity."

**Native Feel:**
> "Equipment lists SHOULD feel like curated collections, not spreadsheets. Teed's existing visual language—cards, clean typography, intentional whitespace—translates perfectly to this context."

**Controversial Principle:**
> "The decision to NOT build asset tracking is genuinely controversial. Every enterprise software vendor would tell you to add it. But keeping Teed as 'the reference layer' rather than 'the system of record' is a defensible, distinctive choice."

**Concern:**
> "Permission complexity could overwhelm. Recommend defaulting to simplest permissions and letting admins opt into complexity."

**Verdict: APPROVED with recommendation**
> "Ship with simple defaults. The 'org admin can see everything, everyone else sees their workspace' model handles 90% of cases."

### Li Jin Evaluation: 7/10

**Creator Leverage (Adapted for B2B):**
> "The 'template author' becomes a valued contributor. A senior engineer who creates the definitive Dev Setup template gains recognition, influence. This is passion economy thinking applied to internal creators."

**Platform Independence:**
> "Team Bags can be exported, embedded, shared externally. Companies own their equipment documentation. If they leave Teed, they can take the Markdown. This builds trust."

**Concern:**
> "B2B is inherently about institutional buyers, not individual creators. The creator economy lens applies less directly here."

**Verdict: APPROVED**
> "The template system does create internal 'creators' whose expertise is amplified. Li's frameworks apply, even if the 'creator' is an IT admin."

### Emily Heyward Evaluation: 8/10

**Premium Feel:**
> "Equipment documentation is typically ugly—spreadsheets, bullet lists, outdated wikis. Teed's visual language makes equipment lists feel designed, intentional, premium. Companies will be PROUD to share their setup standards."

**Language Authority:**
> "'Your canonical equipment reference' is confident. 'The place your equipment lists live' is grounded. Avoid: 'Never have outdated equipment docs again!' (desperate)."

**Brand Tension:**
> "There's a beautiful tension here: 'Serious enterprise infrastructure, beautiful consumer experience.' That's distinctive. Lean into it."

**Verdict: APPROVED**
> "The brand opportunity is to make equipment documentation feel like something companies show off, not something they apologize for."

### Codie Sanchez Evaluation: 10/10

**Boring Business:**
> "This is exactly the 'boring business' opportunity. Equipment documentation isn't sexy. It's not going to go viral. But every company needs it, it's underserved, and it generates steady recurring revenue. This is the laundromat of SaaS."

**Cash Flow Mindset:**
> "Per-seat pricing with annual contracts creates predictable, reliable revenue. Unlike creator monetization (variable), B2B subscriptions are consistent cash flow."

**Infrastructure Play:**
> "This is picks-and-shovels. We're not competing with the equipment. We're not trying to be the ITAM. We're the documentation layer that EVERY approach needs. Whether you use Rippling for shipping or CDW for procurement, you still need Teed for 'what should we ship.'"

**Verdict: STRONG APPROVAL**
> "This is exactly what I'd fund. Boring, reliable, cash-flowing B2B play that every growing company needs. Nobody else is building 'the simple layer for equipment standards.' That's the contrarian edge."

### Board Summary: 5/5 APPROVAL

| Advisor | Score | Verdict |
|---------|-------|---------|
| Daniel Priestley | 9/10 | Approved |
| Julie Zhuo | 8/10 | Approved (with defaults recommendation) |
| Li Jin | 7/10 | Approved |
| Emily Heyward | 8/10 | Approved |
| Codie Sanchez | 10/10 | Strong Approval |

**Board Decision: SHIP IT**

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Month 1: Database & Auth**
- [ ] Organizations table and RLS
- [ ] Organization membership
- [ ] Basic workspace structure
- [ ] Invite flow (email-based)

**Month 2: Team Bags**
- [ ] Bags with organization_id
- [ ] Workspace scoping
- [ ] Basic permissions (org-level)
- [ ] Shared bag viewing

**Month 3: Billing Integration**
- [ ] Stripe integration for Team tier
- [ ] Seat counting and limits
- [ ] Upgrade/downgrade flows
- [ ] Basic admin dashboard

**Deliverable:** MVP Team tier that small teams can use

### Phase 2: Templates & Permissions (Months 4-6)

**Month 4: Template System**
- [ ] Template creation from bags
- [ ] Clone from template
- [ ] Template library (per workspace)
- [ ] Template analytics

**Month 5: Granular Permissions**
- [ ] Workspace-level roles
- [ ] Bag-level permission overrides
- [ ] External sharing with permission
- [ ] View-only guest access

**Month 6: Approval Workflows**
- [ ] Basic approval flow
- [ ] Manager assignment
- [ ] Approval notifications
- [ ] Audit trail

**Deliverable:** Full Team tier feature set

### Phase 3: Enterprise (Months 7-12)

**Month 7-8: SSO**
- [ ] SAML 2.0 integration
- [ ] Google/Microsoft OAuth
- [ ] JIT provisioning
- [ ] Domain claiming

**Month 9-10: Advanced Admin**
- [ ] Organization settings
- [ ] Custom roles
- [ ] Advanced audit logs
- [ ] Usage analytics

**Month 11-12: Enterprise Features**
- [ ] SCIM provisioning
- [ ] API access
- [ ] Custom domains
- [ ] Data export/compliance

**Deliverable:** Enterprise tier ready for large organizations

### Phase 4: Scale (Months 13-18)

- [ ] Community template marketplace
- [ ] Procurement integrations (API)
- [ ] AI-assisted template suggestions
- [ ] White-label options
- [ ] Partner program

---

## 14. Financial Projections

### 14.1 Revenue Model

**Assumptions:**
- Average Team seat price: $12/month
- Average Business seat price: $25/month
- Average seats per Team org: 15
- Average seats per Business org: 75
- Monthly seat growth per org: 5%
- Annual churn: 10%

### 14.2 24-Month Projection

| Month | Team Orgs | Business Orgs | Total Seats | MRR | ARR |
|-------|-----------|---------------|-------------|-----|-----|
| 6 | 15 | 5 | 600 | $9,450 | $113K |
| 12 | 80 | 30 | 3,750 | $61,500 | $738K |
| 18 | 200 | 80 | 10,500 | $172,500 | $2.07M |
| 24 | 400 | 150 | 22,500 | $382,500 | $4.59M |

### 14.3 Cost Structure

**Fixed Costs (Monthly at Scale):**
- Infrastructure (Supabase, Vercel): $2,000
- Support tooling: $500
- Security/compliance: $1,000
- Total fixed: ~$3,500/month

**Variable Costs:**
- Support (1 per 500 orgs): $6,000/month per hire
- Sales (1 per $50K MRR): $8,000/month per hire

**Margin Projection:**
- Month 12: ~75% gross margin
- Month 24: ~85% gross margin

### 14.4 Investment Requirements

**Phase 1-2 (Months 1-6):**
- Engineering: 1 FTE (existing team)
- Design: 0.5 FTE (existing team)
- Total investment: ~$0 incremental (existing capacity)

**Phase 3-4 (Months 7-18):**
- Additional engineering: 1 FTE
- Sales/Marketing: 1 FTE
- Support: 0.5 FTE
- Total incremental: ~$250K

**Break-even:** Month 10-12 (depending on hiring pace)

---

## Appendix A: Sample Template Library

### A.1 Starter Templates

1. **Engineering Standard Setup**
   - Laptop, monitor, peripherals, dev tools

2. **Designer Creative Kit**
   - MacBook, display, tablet, creative software

3. **Remote Work Essentials**
   - Home office basics, ergonomics

4. **Sales Rep Kit**
   - Laptop, webcam, headset, CRM access

5. **Conference Kit**
   - Travel equipment, presentation gear

### A.2 Industry Templates

1. **Startup Tech Stack**
2. **Agency Creative Suite**
3. **Healthcare Compliant Setup**
4. **Finance Secure Workstation**
5. **Education Remote Learning**

---

## Appendix B: Integration Specifications

### B.1 Procurement Portal Integrations (Future)

**CDW:**
- API for product search
- Deep linking to corporate portal
- Price fetching

**Amazon Business:**
- Affiliate links to business accounts
- Approval workflow integration

**Dell Business:**
- Corporate configurator links
- Bundle pricing

### B.2 HR/IT Integrations (Future)

**Rippling:**
- Trigger bag clone on employee creation
- Sync department/role

**BambooHR:**
- Link bags in onboarding workflow
- Sync employee data

**Okta/Azure AD:**
- SSO provider
- SCIM sync

---

## Appendix C: Security & Compliance

### C.1 Security Measures

- Row Level Security on all data
- Encryption at rest and in transit
- SOC 2 Type II (target: Month 18)
- Regular penetration testing
- Bug bounty program

### C.2 Compliance

- GDPR compliant (EU data handling)
- CCPA compliant (California)
- Data Processing Agreements available
- Right to export/delete

### C.3 Enterprise Security Features

- SSO/SAML enforcement
- Session management
- IP allowlisting
- Audit log retention
- Custom data retention policies

---

## Document Metadata

**Author:** Teed Strategy Team
**Version:** 1.0
**Created:** January 2026
**Last Updated:** January 2026
**Status:** Strategic Proposal - Pending Board Review

**Research Sources:**
- [Enterprise Document Management Systems 2026](https://www.generiscorp.com/resources/leading-enterprise-document-management-systems-2025/)
- [IT Asset Management Market Analysis](https://www.mordorintelligence.com/industry-reports/it-asset-management-market)
- [B2B SaaS Pricing Models](https://www.saastock.com/blog/saas-pricing-models-insights-from-industry-leaders/)
- [Remote Equipment Management Landscape](https://growrk.com/blog/remote-equipment-management-software)
- [Notion vs Confluence Enterprise Features](https://www.capterra.com/compare/136446-186596/Confluence-vs-Notion)
- [IT Onboarding Best Practices](https://growrk.com/blog/it-onboarding-software-tools)

---

*"The best businesses are often the most boring ones. Equipment documentation isn't sexy, but it's essential. That's exactly why it's a great business."*

— Codie Sanchez Framework Applied
