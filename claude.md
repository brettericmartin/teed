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

## Core Data Model (MVP)

Design the schema around these tables (names can be adjusted if needed, but keep semantics):

- **users**
  - Sourced from Supabase Auth (`auth.users`).
  - We'll mirror minimal profile data in `public.users` linked by `auth_user_id`.

- **containers**
  - `id` (uuid, PK)
  - `owner_id` (uuid → users.id)
  - `name` (text)
  - `description` (text, nullable)
  - `code` (text, unique, short human/LLM-friendly identifier)
  - `is_public` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- **items**
  - `id` (uuid, PK)
  - `container_id` (uuid → containers.id)
  - `name` (text)
  - `brand` (text, nullable)
  - `category` (text, nullable)
  - `notes` (text, nullable)
  - `image_url` (text, nullable)
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz)

- **links**
  - `id` (uuid, PK)
  - `container_id` (uuid, nullable) – link tied to a container
  - `item_id` (uuid, nullable) – or to a specific item
  - `kind` (text) – e.g. 'retail', 'affiliate', 'review', 'video'
  - `url` (text)
  - `label` (text, nullable) – short human label like "Amazon", "Official site"
  - `metadata` (jsonb, nullable) – optional scraped title, price, favicon, etc.
  - `created_at` (timestamptz)

- **invite_codes** (or `share_codes`)
  - `id` (uuid, PK)
  - `code` (text, unique)
  - `container_id` (uuid → containers.id)
  - `max_uses` (integer, nullable)
  - `uses` (integer, default 0)
  - `expires_at` (timestamptz, nullable)
  - `created_at` (timestamptz)

Guidelines:

- Keep constraints simple and robust (foreign keys, `ON DELETE CASCADE` where appropriate).
- Use Supabase Row Level Security so users only see/edit their own containers/items.

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
