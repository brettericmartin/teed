# Teed – Internal Constitution for Claude

You are the primary AI pair programmer for **Teed**.

This document is a binding constitution. Every feature, design decision, and line of code must align with these principles. Drift is not tolerated.

---

## What Teed Is

Teed is a **canonical reference + springboard utility**.

Users land, understand, and go.

A profile or bag should answer: *What is this? What does it contain? Where can I learn more or buy?*

Teed is not a social network. Teed is not an engagement platform. Teed is not a feed.

---

## Sacred Hierarchy

All features, designs, and decisions must respect this hierarchy:

```
1. Bags (primary containers of meaning)
   └── 2. Items (product + context)
       └── 3. Links (utility: where to buy, learn more)
           └── 4. Profile (the map to bags)
```

**Any implementation that inverts this hierarchy is invalid.**

- Bags come first. They are the atomic unit of value.
- Items exist within bags. They carry product metadata and personal context.
- Links are utilities attached to items or bags. They route users to destinations.
- Profiles are maps to bags, not feeds or engagement surfaces.

---

## Bags Doctrine (Critical)

Bags must feel:
- **Safe** — no penalty for inactivity
- **Non-obligatory** — no posting cadence, no freshness pressure
- **Permanent** — continuity is optional, preservation is mandatory

A bag may be:
- A **snapshot** — frozen in time
- A **living setup** — with optional change log
- A **versioned chapter** — forked, not overwritten

There is **no concept of "stale."**
Language, UX, and copy must never imply obligation.

---

## Dopamine Policy (Strict)

Teed supports **constructive dopamine**, not extractive dopamine.

### Allowed:
- Visual craft and beauty
- Completion satisfaction
- Pride of ownership
- Quiet affirmation (e.g., "saved", "copied")

### Forbidden:
- Feeds or infinite scroll
- Posting cadence pressure
- Urgency or freshness incentives
- Rankings, leaderboards, trending
- Metrics that encourage checking behavior
- Notifications designed to pull users back
- Streak counters or activity gamification

Dopamine must reward *having built something*, not *returning to check something*.

---

## Profiles Doctrine

Profiles are **maps**, not feeds.

A profile must answer in under ~10 seconds:
1. Who is this?
2. What have they curated or built? (bags)
3. Where should I go next — and why?

Profiles frame bags first, then provide **explained exits** (links to external platforms with context).

---

## Links & Integrations Doctrine

Links are utilities, never the point.

Every outbound destination must be:
- Clearly named
- Briefly explained (1–2 lines)
- Intentionally routed

Teed centralizes **understanding**, not infrastructure.
Teed does not replace other platforms — it explains and routes to them.

---

## What Teed Will Never Build

This list is binding. These features contradict Teed's identity:

- **Feeds** — chronological or algorithmic content streams
- **Trending / Popular** — ranking systems that create FOMO
- **Notifications for engagement** — "Someone viewed your bag" or similar
- **Freshness indicators** — "Updated 3 days ago" as pressure
- **Streak counters** — any gamification of posting cadence
- **Follower counts as primary metric** — followers exist but are not emphasized
- **Infinite scroll** — paginated or intentional navigation only
- **Auto-playing content** — user initiates all media
- **Urgency language** — "Don't miss out", "Trending now", "Hot"
- **Activity dashboards** — engagement metrics for creators
- **Forced recency** — sorting that penalizes older content
- **Real-time activity feeds** — "X just cloned this bag"

---

## What Teed Should Build

These features align with doctrine:

- **Bags** — the core container of meaning
- **Items with context** — product metadata + personal notes
- **Hero items** — featured item per bag
- **Optional change logs** — auto-generated, user-editable history
- **Versioning via fork** — preserve originals, create new chapters
- **Reference blocks** — link to TikTok, YouTube, newsletters, podcasts, shops
- **Destinations** — explained outbound links on profiles
- **Email capture via redirect** — simple subscription without infrastructure
- **Completion satisfaction** — visual feedback when bags are "complete"
- **Quiet social proof** — saved/copied counts, not rankings

---

## PR Acceptance Checklist

Before merging any feature, verify:

1. **Does it reduce explanation friction?**
   - Users should understand faster, not slower

2. **Does it increase trust?**
   - The feature should make Teed feel more reliable, not more demanding

3. **Does it preserve the sacred hierarchy?**
   - Bags > Items > Links > Profile

4. **Does it avoid obligation?**
   - No pressure, no guilt, no "you should update this"

5. **Is it constructive dopamine only?**
   - Pride of creation, not anxiety of engagement

6. **Does it pass the "stale" test?**
   - Would a bag from 2 years ago still feel valid and respected?

If any answer is "no", the feature needs redesign.

---

## High-Level Product Vision

Teed lets users:

- Create **bags** (containers: kits, loadouts, collections)
- Add **items** inside each bag (products with context)
- Attach **links** (retail, affiliate, review, video) to items or bags
- Generate **codes/slugs** to share bags with people or AI agents

Primary usage:

- The browser UI is intentionally simple, visually clean, and low-friction
- AI agents (ChatGPT, Claude) can fetch bags by code, read items + links, help users compare gear

Design principles:

- **LLM-first data model** — endpoints and schemas are easy for models to understand
- **Minimal but polished UI** — 1–3 primary screens, card-based, restrained
- **Clarity over cleverness** — explicit, readable code and types

---

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Backend & DB**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Hosting**: Vercel
- **AI integration**: JSON APIs callable from custom GPTs

---

## Database Schema

### Core Tables

- **profiles** (users) — id, handle, display_name, avatar_url, bio, created_at
- **bags** (containers) — id, owner_id, title, description, code, is_public, created_at
- **bag_items** (items) — id, bag_id, catalog_item_id, custom_name, notes, custom_photo_id, sort_index
- **links** — id, container_id, item_id, kind, url, label, metadata

### Guidelines

- Keep constraints simple and robust
- Use Row Level Security so users only see/edit their own data
- Avoid over-engineering the schema

---

## UI Scope

### Core Routes

1. **Dashboard** (`/dashboard`) — user's bags in a grid
2. **Bag Editor** (`/u/[handle]/[code]/edit`) — edit bag, items, links
3. **Public Bag View** (`/u/[handle]/[code]`) — read-only shareable view
4. **User Profile** (`/u/[handle]`) — map of user's public bags
5. **Manifesto** (`/manifesto`) — explains Teed philosophy

### Visual Style

- Clean layout, centered content, max-width container
- Tailwind CSS with design tokens
- Card components with clear hierarchy
- Lucide React icons
- Soft shadows, smooth transitions
- Mobile-first responsive design

---

## Teed Brand Design System

**Design System Showcase:** `/design-system`

### Brand Colors

- **Teed Green** (Primary): `#8BAA7E` — AI/smart actions
- **Deep Evergreen** (Text): `#1F3A2E` — primary text, create buttons
- **Warm Sand** (Accent): `#D9B47C`
- **Stone Grey** (Secondary): `#868996`
- **Copper** (Destructive): `#C2784A` — delete/remove actions
- **Background**: `#F9F5EE` (soft off-white)
- **Surface**: `#FFFFFF` (cards, panels)

### Button Variants

- `variant="ai"` — AI-powered features (Teed Green)
- `variant="create"` — creating new items (Deep Evergreen)
- `variant="destructive"` — delete/remove (Copper)
- `variant="secondary"` — less prominent actions
- `variant="ghost"` — tertiary actions

### Design Principles

1. **Minimal & Premium** — intentional elements, white space
2. **Earthy & Natural** — nature-inspired, avoid harsh contrasts
3. **Rounded & Soft** — generous radii, soft shadows
4. **Accessible by Default** — WCAG AA, visible focus states

---

## API Design

REST JSON endpoints for AI agents:

- `GET /api/bags/[code]` — bag with items and links
- `POST /api/bags` — create bag
- `PATCH /api/bags/[code]` — update bag
- `GET /api/users/[handle]/bags` — profile and public bags

Design priorities:
- Structured JSON with predictable shapes
- Clear error messages
- Enough context for LLMs to understand relationships

---

## Coding Conventions

- TypeScript everywhere
- Server components where possible, client components for interactivity
- Next.js App Router (`app/` directory)
- Encapsulate Supabase logic in `lib/` modules
- async/await, not .then chains
- Handle errors gracefully
- Avoid unnecessary abstractions — this is an MVP

---

## How to Work with the Human

- They are technical but prefer minimal terminal commands
- Group related edits in a single patch
- Explain briefly what you're doing and why
- Favor step-by-step sequences
- When in doubt, choose simple explicit implementations

---

## Testing Strategy

### E2E Tests (Playwright)

1. `01-auth.spec.ts` — authentication flows
2. `02-bag-management.spec.ts` — bag and item CRUD
3. `03-link-management.spec.ts` — link operations
4. `04-public-sharing.spec.ts` — sharing and QR codes
5. `05-user-profile.spec.ts` — profiles and attribution

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/e2e/05-user-profile.spec.ts
```

---

## Anti-Drift Reminder

Every commit should ask:

> Does this make Teed feel more like a calm, permanent reference utility — or more like a social engagement platform?

If the answer is the latter, do not ship it.

Teed is where things are understood and preserved.
Not where things are consumed and forgotten.

---

## Advisory Board Evaluation

For significant features, evaluate through the lens of Teed's advisory panel defined in `ADVISORS.md`:

| Advisor | Focus | Key Question |
|---------|-------|--------------|
| **Daniel Priestley** | Growth | "Does this multiply touchpoints across 4 locations?" |
| **Julie Zhuo** | Design | "Does this feel discovered, not disrupted?" |
| **Li Jin** | Ownership | "Does this increase creator control and leverage?" |
| **Emily Heyward** | Brand | "Would creators proudly show this branding?" |
| **Codie Sanchez** | Value | "Is this the boring, reliable approach that works?" |

Use the full evaluation template in `ADVISORS.md` for major features. A feature needs 4/5 board approval to ship.
