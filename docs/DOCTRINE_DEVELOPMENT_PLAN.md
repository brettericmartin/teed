# Teed Development Plan

> **STATUS: V1.0 COMPLETE** (January 2026)
>
> Core epics A, B, and C are complete. The foundation is solid.
>
> | Epic | Status | Notes |
> |------|--------|-------|
> | Epic A: Bags Core | ✅ Complete | Full bag/item CRUD, hero items, public views, sharing |
> | Epic B: Safe Evolution | ✅ Complete | Item history tracking, version history via migrations 082-083 |
> | Epic C: Profiles as Maps | ✅ Complete | Profile blocks, featured bags, panel system |
> | Epic D: Reference Blocks | ✅ Complete | Embed panel, link panels on profiles |
> | Epic E: Email Capture | ⚠️ Deferred | External newsletter integrations work via links |
> | Epic F: Constructive Validation | ✅ Complete | Badge system, bag analyzer, subtle social proof |

---

This roadmap translates Teed doctrine into execution. It bounds features without over-specifying implementation.

---

## Roadmap Rules

1. **Bags are the primary creation surface.** Everything else supports bags.
2. **Progressive disclosure.** Easy to start, deep to grow.
3. **Avoid infrastructure-heavy systems.** Default to manual or link-based integrations.
4. **No live feeds required.** Static or on-demand fetching only.
5. **Preservation over recency.** Old content is equally valid.

---

## Epic A — Bags Core (V1)

### Goal
Make it effortless to create a meaningful bag quickly.

### In Scope
- Bag creation with title, description, and optional cover image
- Items with product metadata (name, brand, category) and personal notes
- Hero product designation per bag
- Visual-first rendering on public view
- Simple drag-and-drop or manual reordering
- Public/private visibility toggle
- Shareable URL with clean slugs (`/u/handle/bag-code`)

### Out of Scope
- Commerce / checkout flows
- Reviews or ratings
- Pricing sync or live price updates
- Social feeds or activity streams
- Comments or discussions

### UX Rules (Anti-Drift)
- No "last updated" pressure indicators
- No "complete your bag" prompts after initial creation
- No notifications about bag performance
- Item addition should take < 30 seconds for a simple product

### Technical Approach
- Server components for public views
- Client components for editing interactions
- Supabase for data persistence with RLS
- Image upload to Supabase Storage
- AI-assisted product identification (optional)

### Acceptance Criteria
- [ ] User can create a bag in < 60 seconds
- [ ] User can add items with name, brand, photo, notes
- [ ] User can designate one item as "hero"
- [ ] Public bags are viewable without authentication
- [ ] Bags render correctly on mobile and desktop
- [ ] No freshness or activity pressure in UI

---

## Epic B — Safe Evolution (V1 / V1.1)

### Goal
Allow evolution without guilt. Users should feel safe updating bags without fear of losing history.

### In Scope
- Optional change logs (auto-generated from edits, user-editable)
- Change log visibility toggle (show/hide on public view)
- Versioning via fork (create new bag based on existing, preserve original)
- Fork attribution ("Based on @user/bag")

### Out of Scope
- Diff comparisons between versions
- Activity reminders or "you haven't updated in X days"
- Freshness indicators that create pressure
- Automatic notifications about changes

### UX Rules (Anti-Drift)
- Change logs are optional, never mandatory
- Forks preserve originals; originals are never overwritten
- No language suggesting bags are "outdated" or "stale"
- Fork creation should feel like a positive action, not an obligation

### Technical Approach
- Change log stored as JSON array in bag record
- Auto-capture significant edits (item add/remove, title change)
- Fork creates new bag with `forked_from_id` reference
- Fork attribution rendered on public view

### Acceptance Criteria
- [ ] Change log auto-captures major edits
- [ ] User can edit or hide change log entries
- [ ] User can fork any of their bags
- [ ] Forked bags show attribution to original
- [ ] Original bags remain unchanged after fork
- [ ] No pressure language in change log UI

---

## Epic C — Profiles as Maps (V1)

### Goal
Provide a canonical home base that answers: who is this, what have they curated, where should I go?

### In Scope
- Identity header (avatar, display name, bio, handle)
- Featured bags section (user-curated highlights)
- All bags index (simple grid of public bags)
- Destinations (explained outbound links to external platforms)
- Minimal styling, map-like navigation

### Out of Scope
- Feeds or activity timelines
- Engagement dashboards or analytics
- Follower counts as prominent metrics
- Creator analytics or performance data
- Real-time activity indicators

### UX Rules (Anti-Drift)
- Profile loads as a static map, not a feed
- Bags are primary; everything else is secondary
- Destinations explain where links go (1-2 lines each)
- No "posts" or "updates" language — only bags

### Technical Approach
- Server component for profile rendering
- Fetch public bags filtered by `is_public`
- Destinations stored as profile metadata (JSON array)
- Featured bags stored as ordered array of bag IDs

### Acceptance Criteria
- [ ] Profile answers "who, what, where" in < 10 seconds
- [ ] Featured bags appear prominently at top
- [ ] All public bags accessible from profile
- [ ] Destinations have titles and descriptions
- [ ] No feed-like scrolling behavior
- [ ] No engagement metrics visible

---

## Epic D — Reference Blocks (V1.1)

### Goal
Reduce explanation friction with context-rich references to external content.

### In Scope
- Manual, link-specific reference blocks:
  - TikTok video (embed or linked preview)
  - YouTube video (embed or linked preview)
  - Newsletter post (title + excerpt + link)
  - Podcast episode (title + show name + link)
  - Shop link (store name + product link)
- Attachable to profile, bag, or specific item
- Simple add flow: paste URL, add optional description

### Out of Scope
- Auto-updating feeds from platforms
- OAuth-based syncing with external accounts
- Live embed rendering (static previews preferred)
- Automatic content scraping beyond basic metadata

### UX Rules (Anti-Drift)
- References are manual additions, not automatic imports
- Each reference has a clear purpose explained by user
- No "sync your TikTok" or similar integrations
- References enhance understanding, not engagement

### Technical Approach
- Reference blocks stored as structured records
- Link to parent (profile, bag, or item) via foreign key
- Basic URL metadata scraping for title/thumbnail
- Static rendering on public view

### Acceptance Criteria
- [ ] User can add reference blocks to bags
- [ ] Each block type renders appropriately
- [ ] Blocks show title, description, and outbound link
- [ ] No automatic syncing or live feeds
- [ ] References load without external API calls at render time

---

## Epic E — Email Capture (V1.1)

### Goal
Enable subscriptions without building email infrastructure.

### In Scope
- Redirect-based signup (link to Mailchimp, ConvertKit, Substack, etc.)
- Optional embed-based signup form (iframe or simple form)
- Call-to-action block on profile or bag
- Clear explanation of what users are subscribing to

### Out of Scope
- Sending emails from Teed
- List management or subscriber data storage
- Deliverability infrastructure
- Email analytics or tracking

### UX Rules (Anti-Drift)
- Email capture is opt-in for profile owner
- Clear explanation of external redirect
- No dark patterns or pre-checked boxes
- Subscription purpose is user-written

### Technical Approach
- Email CTA stored as profile/bag metadata
- Simple redirect link or iframe embed
- No email data stored in Teed database

### Acceptance Criteria
- [ ] User can add email signup CTA to profile
- [ ] CTA clearly explains subscription purpose
- [ ] Redirect or embed functions correctly
- [ ] Teed stores no email subscriber data
- [ ] No engagement pressure around email capture

---

## Epic F — Constructive Validation (V1.2)

### Goal
Provide affirmation without addiction. Users feel good about what they built, not anxious about performance.

### In Scope
- Completion satisfaction (visual feedback when bag feels "complete")
- Quiet social proof (save count, copy count — displayed subtly)
- "Saved to collection" confirmation (for viewers)
- Personal milestone markers (optional: "First bag!", etc.)

### Out of Scope
- Rankings or leaderboards
- Trending lists or popularity indicators
- Performance pressure or comparative metrics
- Notifications about engagement
- Public display of viewer counts

### UX Rules (Anti-Drift)
- Metrics are always optional and subtle
- No language suggesting "you should have more saves"
- Completion is self-defined, not system-defined
- Milestones celebrate creation, not consumption

### Technical Approach
- Save/copy counts stored per bag
- Displayed only when non-zero and above threshold
- Optional completion badge (user-toggled)
- Milestone tracking in user profile metadata

### Acceptance Criteria
- [ ] Save counts display subtly on bags
- [ ] Users can toggle metric visibility
- [ ] Completion satisfaction feels rewarding, not pressuring
- [ ] No comparative language or rankings
- [ ] Milestones celebrate personal progress

---

## What Teed Will Not Build

This section is binding and protects the product long-term.

### Never Build:
- **Feeds** — chronological or algorithmic content streams
- **Trending / Popular sections** — ranking systems that create FOMO
- **Engagement notifications** — "Someone viewed your bag"
- **Freshness pressure** — "Updated 3 days ago" as negative indicator
- **Streak counters** — gamification of posting cadence
- **Follower count emphasis** — followers exist but are not the point
- **Infinite scroll** — paginated or intentional navigation only
- **Auto-playing content** — user initiates all media
- **Urgency language** — "Don't miss out", "Hot", "Trending"
- **Activity dashboards** — engagement metrics for creators
- **Forced recency** — sorting that penalizes older content
- **Real-time activity feeds** — "X just saved this bag"
- **Comparison features** — "Your bag has fewer saves than average"
- **Growth prompts** — "Share to get more followers"

### Why These Constraints Exist:
These features create extractive dopamine loops that contradict Teed's identity as a calm, permanent reference utility. Every feature on this list has been shown to increase anxiety, reduce user autonomy, and prioritize platform engagement over user value.

Teed exists to preserve and explain things, not to consume attention.

---

## Version Milestones

### V1.0 — Foundation
- Epic A: Bags Core
- Epic C: Profiles as Maps
- Manifesto page live

### V1.1 — Depth
- Epic B: Safe Evolution (change logs, versioning)
- Epic D: Reference Blocks
- Epic E: Email Capture

### V1.2 — Polish
- Epic F: Constructive Validation
- Performance optimization
- Mobile experience refinement

---

## Acceptance Checklist (All Epics)

Before any epic is considered complete:

1. **Reduces explanation friction?** Users understand faster.
2. **Increases trust?** Teed feels more reliable, not more demanding.
3. **Preserves sacred hierarchy?** Bags > Items > Links > Profile.
4. **Avoids obligation?** No pressure, no guilt.
5. **Constructive dopamine only?** Pride of creation, not anxiety of engagement.
6. **Passes the stale test?** A bag from 2 years ago still feels valid.

---

*Development Plan v2.0 — December 2025*
*Aligned with Teed Doctrine*
