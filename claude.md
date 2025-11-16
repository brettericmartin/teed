# Teed – Project Guide for Claude

You are the primary AI pair programmer for the **Teed** project.

Teed is an AI-first web app for organizing "containers" of items plus links and codes, optimized for use inside ChatGPT/Claude as much as the browser.

The old project **tee-club-grid** is *not* part of this repo. Ignore any past context about social feeds, posts, likes, forums, etc. This project is a fresh, minimal MVP.

---

## High-level Product Vision

Teed lets users:

- Create **containers** (bags, kits, loadouts).
- Add **items** inside each container.
- Attach **links** (retail, affiliate, review, etc.) to items or the container.
- Generate **codes/slugs** to easily share containers with people or AI agents.

Primary usage:

- The browser UI is intentionally simple, visually clean, and low-friction.
- The real power is from AI agents (ChatGPT, Claude) that can:
  - Fetch containers by code or slug.
  - Read and reason over items + links.
  - Help users compare gear, plan purchases, and share loadouts.

Design principles:

- **LLM-first data model** – endpoints and schemas must be easy for a model to understand.
- **Minimal but polished UI** – think 1–3 primary screens, card-based, Tailwind + sensible defaults.
- **Clarity over cleverness** – prefer explicit, readable code and types.

---

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript).
- **Styling**: Tailwind CSS.
- **Backend & DB**: Supabase (PostgreSQL, Auth, Row Level Security).
- **Hosting**: Vercel.
- **AI integration**:
  - Website exposes a small set of JSON APIs that are straightforward to call from a custom GPT via Actions/OpenAPI.
  - Later, an MCP server may be added to wrap Supabase for ChatGPT/Claude.

Assume we are on a recent Next.js version (13+ with app router).

---

## Current Database Schema vs. MVP Spec

**Last Updated:** 2025-11-15

### Current State

The Supabase database contains **12 tables** with a more complex design than the original MVP spec. It includes:

**Core Tables (with differences from MVP):**
- `profiles` (users) ✓
- `bags` (containers) ⚠️ Missing `code` field, missing `updated_at`
- `bag_items` (items) ⚠️ Catalog-based design vs free-form
- `share_links` (invite codes) ⚠️ Missing `max_uses`, `uses`, `expires_at`
- `links` ❌ **COMPLETELY MISSING** (general-purpose links table)

**Extended Tables (beyond MVP):**
- `catalog_items` - Product catalog with verified items
- `categories` - Product categories
- `affiliate_links` - Affiliate tracking (NOT the general links table)
- `media_assets` - Centralized media storage
- `analytics_events` - Event tracking
- `follows` - Social following system
- `price_cache` - Merchant pricing cache
- `bag_tags` - Tagging system

### Critical Gaps

1. **MISSING: General-purpose links table** ❌
   - Core MVP feature missing
   - Users cannot attach retail, review, or video links to bags/items
   - Only affiliate links tied to catalog items exist

2. **MISSING: `code` field on bags** ⚠️
   - Cannot create simple shareable URLs like `/c/camping-kit`
   - `share_links.slug` exists but is a separate entity

3. **MISSING: Usage tracking on share_links** ⚠️
   - No `max_uses`, `uses`, or `expires_at` fields
   - Cannot create limited-use or expiring share links

4. **Different: Items are catalog-first** ⚠️
   - Items reference `catalog_items` with override fields
   - Not the free-form model in MVP spec
   - May be intentional design choice

See `schema_analysis.md` for full details.

---

## MVP Data Model Specification

This is the target MVP schema. Compare with current state above.

- **users** (implemented as `profiles`)
  - Sourced from Supabase Auth (`auth.users`).
  - We'll mirror minimal profile data in `public.profiles`.

- **containers** (implemented as `bags`)
  - `id` (uuid, PK)
  - `owner_id` (uuid → users.id)
  - `name` (text) [currently `title`]
  - `description` (text, nullable)
  - `code` (text, unique, short human/LLM-friendly identifier) ⚠️ **MISSING**
  - `is_public` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz) ⚠️ **MISSING**

- **items** (implemented as `bag_items`)
  - `id` (uuid, PK)
  - `container_id` (uuid → containers.id)
  - `name` (text) ⚠️ Currently uses `catalog_item_id` + `custom_name`
  - `brand` (text, nullable) ⚠️ Currently in catalog
  - `category` (text, nullable) ⚠️ Currently in catalog
  - `notes` (text, nullable) ✓
  - `image_url` (text, nullable) ⚠️ Currently `custom_photo_id`
  - `sort_order` (integer, default 0) ✓ Currently `sort_index`
  - `created_at` (timestamptz) ✓

- **links** ❌ **COMPLETELY MISSING - CRITICAL**
  - `id` (uuid, PK)
  - `container_id` (uuid, nullable) – link tied to a container
  - `item_id` (uuid, nullable) – or to a specific item
  - `kind` (text) – e.g. 'retail', 'affiliate', 'review', 'video'
  - `url` (text)
  - `label` (text, nullable) – short human label like "Amazon", "Official site"
  - `metadata` (jsonb, nullable) – optional scraped title, price, favicon, etc.
  - `created_at` (timestamptz)

- **invite_codes** (implemented as `share_links`)
  - `id` (uuid, PK)
  - `code` (text, unique) ✓ Currently `slug`
  - `container_id` (uuid → containers.id) ✓ Currently `bag_id`
  - `max_uses` (integer, nullable) ⚠️ **MISSING**
  - `uses` (integer, default 0) ⚠️ **MISSING**
  - `expires_at` (timestamptz, nullable) ⚠️ **MISSING**
  - `created_at` (timestamptz) ✓

### Schema Guidelines

- Keep constraints simple and robust (foreign keys, `ON DELETE CASCADE` where appropriate).
- Use Supabase Row Level Security so users only see/edit their own containers/items.
- **Priority fixes needed:**
  1. Create the general-purpose `links` table
  2. Add `code` field to `bags` table
  3. Add usage tracking to `share_links`

---

## UI Scope (MVP)

Focus on 3 main flows:

1. **Dashboard / Containers list**
   - Shows user's containers in a simple grid/list.
   - Each card: name, short description, code, "Edit", "View", "Copy link/code".

2. **Container editor**
   - Edit container name/description/visibility.
   - Manage items:
     - Add/remove items.
     - Drag-and-drop or up/down buttons to adjust `sort_order`.
   - For each item, manage its links in a simple nested list.

3. **Public container view**
   - Read-only view accessible by URL like `/c/[code]`.
   - Show container, items, and links clearly.
   - This is what AI agents and shared users will often hit.

Visual style:

- Clean layout, centered content, max-width container.
- Use Tailwind, no heavy design systems.
- Favor card components with clear hierarchy and spacing.

---

## API Design for AI / GPT Integration

We will expose a small set of REST JSON endpoints under `/api/teed/*` designed for AI agents:

Examples (subject to refinement):

- `GET /api/teed/containers/[code]`
  - Returns one container with its items and links given a `code`.
  - Anonymous access allowed for public containers.

- `POST /api/teed/containers`
  - Create a container for the logged-in user.

- `POST /api/teed/items`
  - Add an item to a container.

- `POST /api/teed/links`
  - Add a link to an item or container.

Design priorities:

- Always return structured JSON with predictable shapes.
- Include enough context for an LLM to understand relationships:
  - e.g., container metadata + `items: [...]` each with `links: [...]`.
- Use clear error messages in JSON (e.g. `{ "error": "Container not found" }`).

Later we will define an OpenAPI spec to wrap these endpoints for a custom GPT.

---

## Coding Conventions

- Use **TypeScript** everywhere (components, API routes, helper functions).
- Prefer **server components** where possible, and **client components** for interactive bits only.
- Use the Next.js App Router (`app/` directory).
- Encapsulate Supabase logic in a dedicated module (`lib/supabaseClient.ts` and small helper functions).
- Avoid unnecessary abstractions or micro-optimizations; this is an MVP.
- Use async/await, not .then chains.
- Follow a consistent file organization, e.g.:

  - `app/(dashboard)/containers/page.tsx` – list view
  - `app/(dashboard)/containers/[id]/page.tsx` – editor
  - `app/c/[code]/page.tsx` – public container view
  - `app/api/teed/*` – API routes

- Handle errors gracefully, especially in API routes and data fetching hooks.

---

## How to Work with the Human

- The human is technical but often overwhelmed by setup details.
- They want **minimal terminal commands** and prefer Cursor/Claude to handle project wiring.
- When suggesting changes:
  - Group related edits in a single patch when reasonable.
  - Explain briefly what you're doing and why.
  - Favor step-by-step sequences they can follow.

If any ambiguity arises, prefer simple, explicit implementations that can be iterated on later.
