# Teed UI/UX Strategy: The Curated Experience

> Transform Teed from a list app into a dopamine-rich, curation-first platform where users want to clone, share, save, and come back.

---

## Executive Summary

Based on comprehensive research across premium sites (Apple, Linear, Stripe, Figma, Pinterest, Are.na) and analysis of your existing codebase, this document outlines a strategic approach to creating a memorable, engagement-driving experience.

**Core Insight:** The best curation platforms don't just store content—they celebrate it. Every interaction should make users feel like curators, not data entry clerks.

### The Three Pillars

1. **Dopamine Architecture** - Reward every meaningful action with sensory feedback
2. **Editorial Confidence** - Make curated content feel intentional and authored
3. **Remix Culture** - Normalize cloning as the primary user action

---

## The Signature: "The Golf Ball Journey"

Every great product has ONE memorable interaction. For Teed, it's the **Golf Ball Journey**.

### Where It Appears

| Moment | Animation | Duration |
|--------|-----------|----------|
| Page Load | Ball rolls in from left, settles | 1.5s |
| Item Added | Ball drops onto tee, bounces | 1.0s |
| Bag Complete | Ball tees off (celebration) | 1.5s |
| Clone Success | Ball arcs to new position | 2.0s |
| Share Complete | Ball rolls into hole (satisfying finish) | 1.2s |
| Loading States | Ball rolling with dimple rotation | Loop |
| Progress Bars | Ball "rolling" along track | Variable |

### Implementation Priority: HIGH

You already have golf animations in `globals.css`. Expand these to become the signature interaction throughout the entire app.

---

## Strategic Components

### 1. Primary Actions - Clone First

**Current State:** Clone, Share, Save are equal-weight icons.

**Target State:** Clone is THE primary action on public bags.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────┐  ┌──────────┐  ┌──────────┐   │
│  │  🏌️ Clone This Bag      │  │  Share   │  │  Save    │   │
│  │      (PRIMARY)          │  │(secondary)│  │(secondary)│   │
│  └─────────────────────────┘  └──────────┘  └──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Button Hierarchy:**
- **Primary (Clone):** `bg-[var(--teed-green-8)]`, large (px-6 py-3), magnetic effect
- **Secondary (Share/Save):** Outlined, medium size, standard hover
- **Tertiary (Report/Embed):** Icon-only in dropdown menu

**Microcopy:**
- "Clone This Bag" > "Clone" (specific beats vague)
- "Make your own version" (helper text)
- "Most people start by cloning and adjusting" (social proof)

---

### 2. Editorial Scaffolding

Add editorial confidence to curated bags without requiring creators to write more.

#### Curator's Note Component

```
┌─────────────────────────────────────────────────────────────┐
│ ┃                                                           │
│ ┃  "Focused on build quality and timeless design.          │
│ ┃   No hype pieces—just gear that lasts."                  │
│ ┃                                                           │
│ ┃   — @username                                            │
└─────────────────────────────────────────────────────────────┘
```

#### About This Bag (Auto-generated + Editable)

```
┌─────────────────────────────────────────────────────────────┐
│ About this bag                                              │
│                                                             │
│ • 12 items curated for weekend golf                        │
│ • Prioritizes lightweight carry options                     │
│ • Updated 2 days ago                                        │
│                                                             │
│ [Edit About] (creator only)                                 │
└─────────────────────────────────────────────────────────────┘
```

#### List Descriptor (One-liner under title)

```
My Golf Bag Setup
─────────────────
A curated list — clone it, tweak it, send it.
```

---

### 3. Social Proof Without Social Media

Display metrics that build trust without feeling performative.

#### Metric Display Rules

| Metric | Show When | Format |
|--------|-----------|--------|
| Views | > 50 | "1.2K views" |
| Clones | > 0 | "42 clones" |
| Saves | > 10 | "87 saves" |
| Featured | When true | "Featured in Golf" badge |

#### Attribution Chain

```
┌─────────────────────────────────────────────────────────────┐
│ 🏌️ My Golf Bag Setup                                       │
│                                                             │
│ Created by @username • Cloned from @originuser/bag-name    │
│ 127 views • 23 clones • Featured in Golf                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Dopamine Moments

Every significant action gets multi-sensory feedback.

#### Celebration Tiers

**Tier 1 - Micro (Toast + Haptic)**
- Save bag
- Copy link
- Add item

```tsx
// Light haptic + success toast
navigator.vibrate(50);
toast.success("Saved to collection");
```

**Tier 2 - Medium (Modal + Animation + Haptic)**
- Clone bag
- First bag created
- Share complete

```tsx
// Confetti + haptic pattern + success modal
confetti({ particleCount: 100, colors: ['#8BAA7E', '#D9B47C'] });
navigator.vibrate([100, 50, 100]);
showSuccessModal({ title: "Bag cloned!", nextSteps: [...] });
```

**Tier 3 - Major (Full Animation + Sound)**
- Bag complete (all items have photos)
- Featured selection
- Milestone achievements

```tsx
// Full golf ball tee-off animation + celebration sound + confetti
playGolfBallCelebration();
playSound('/sounds/success.mp3');
confetti({ particleCount: 150, spread: 90 });
```

#### First-Time Celebrations

| First Action | Message | Animation |
|--------------|---------|-----------|
| First bag created | "Your first bag is on the tee!" | Ball drop + settle |
| First item identified | "Nice find!" | Sparkle effect |
| First clone | "You've started your collection" | Ball roll |
| First share | "Your bag is out in the world" | Ball tee-off |

---

### 5. Card Design Language

#### Featured Bag Card (Discover Page)

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │              [Hero Image / Item Grid]                   │ │
│ │                                                         │ │
│ │  ┌─────────┐                                           │ │
│ │  │Featured │                           ┌────────────┐  │ │
│ │  └─────────┘                           │ @username  │  │ │
│ │                                        │   [avatar] │  │ │
│ │                                        └────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ My Golf Bag Setup                           🏌️ 12 items    │
│ Premium gear for serious golfers                           │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 127 views • 23 clones • Cloned 42 times              │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Visual Cues:**
- **Featured badge:** Top-left, copper/gold gradient
- **Avatar:** Bottom-right of image with subtle ring
- **Category emoji:** Inline with item count
- **Clone count:** Prominent as social proof

#### Quality Badges

| Badge | Criteria | Color |
|-------|----------|-------|
| Featured | Editor selection | Copper gradient |
| Trending | High clone velocity | Teed Green |
| Complete | All items have photos | Sky Blue |
| Verified | Creator verified | Evergreen check |

---

### 6. Transitions & Motion

#### Page Transitions (Framer Motion)

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};
```

#### Staggered Card Reveals

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};
```

#### Modal Entrance

```tsx
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};
```

#### Timing Guidelines

| Element | Duration | Easing |
|---------|----------|--------|
| Button press | 150ms | spring (400, 25) |
| Toast appear | 250ms | ease-out |
| Modal open | 300ms | spring (300, 30) |
| Page transition | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Card stagger | 100ms | per item |

---

### 7. Mobile Experience

#### Sticky Action Bar

Appears after scrolling 400px on bag detail pages.

```
┌─────────────────────────────────────────────────────────────┐
│ My Golf Bag          │  [Share]  │  [Clone This Bag]       │
│ 12 items • @user     │   icon    │      PRIMARY            │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- `position: fixed; bottom: 0`
- `backdrop-blur-lg bg-white/95`
- Respects iOS safe areas
- Slides up with spring animation

#### Touch Targets

- Minimum 44px × 44px
- 8px spacing between adjacent targets
- Active state: `scale(0.97)` + slight opacity reduction

---

### 8. Visual Polish

#### Grainy Gradients

Add subtle texture to all gradient backgrounds:

```css
.grainy-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("noise.svg");
  opacity: 0.03;
  pointer-events: none;
}
```

#### Magnetic Buttons

Primary CTAs have magnetic pull effect on hover:

```tsx
<MagneticButton className="...">
  Clone This Bag
</MagneticButton>
```

#### Glass Effects

Modals and floating elements use glassmorphism:

```css
.glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Shadow System Enhancement

Add glow variants to existing shadows:

```css
--shadow-glow-teed:
  0 0 0 1px var(--teed-green-6),
  0 4px 12px rgba(139, 170, 126, 0.15);
```

---

### 9. Empty States

Every empty state is an opportunity for delight.

#### New User - No Bags

```
         ┌─────────────────┐
         │   [Golf Ball]   │
         │    animation    │
         └─────────────────┘

         Your first bag awaits

    Start curating your collection.
    Add items you love, organize them
    your way, and share with the world.

        [Create Your First Bag]
```

#### Search - No Results

```
        🔍

    No bags match that search

    Try adjusting your terms or
    browse our featured bags below.

        [Clear Search]
```

---

### 10. Discover Page Curation

#### Featured Row

```
Featured by Teed ────────────────────────────────────────────
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│     │ │     │ │     │ │     │  → Horizontal scroll
│     │ │     │ │     │ │     │
└─────┘ └─────┘ └─────┘ └─────┘
```

#### Category Angles (Not Just Categories)

Instead of:
- Golf
- Travel
- Tech

Use:
- "Starter Kits"
- "Gifts That Don't Suck"
- "Minimal Setups"
- "Pro Picks"

#### Quality Gating

Only show bags on Discover that have:
- ≥ 3 items
- Cover image or ≥ 3 item photos
- Non-placeholder title
- Updated within 90 days

---

## Technical Implementation

### Dependencies to Add

```bash
npm install framer-motion canvas-confetti @radix-ui/react-dialog
```

### New Components Required

| Component | Priority | Complexity |
|-----------|----------|------------|
| MagneticButton | High | Low |
| CelebrationProvider | High | Medium |
| StickyActionBar | High | Low |
| EditorialCard | Medium | Low |
| CuratorNote | Medium | Low |
| EmptyState | Medium | Low |
| GlassCard | Low | Low |
| CloneSuccessModal | High | Medium |
| FeaturedBadge | Medium | Low |
| SocialProofMetrics | Medium | Low |

### File Changes Required

| File | Changes |
|------|---------|
| `components/ui/Button.tsx` | Add magnetic variant |
| `components/ui/Toast.tsx` | Add progress bar, haptics |
| `app/globals.css` | Grainy gradients, glow shadows, glass utils |
| `app/c/[code]/PublicBagView.tsx` | Add action bar, clone CTA hierarchy |
| `app/page.tsx` | Add featured row, editorial scaffolding |
| `components/home/FeaturedBagCard.tsx` | Add badges, metrics, animations |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Install Framer Motion
- [ ] Add grainy gradient utilities to CSS
- [ ] Create MagneticButton component
- [ ] Enhance Toast with haptics + progress
- [ ] Create CelebrationProvider context

### Phase 2: Core Actions (Week 2-3)
- [ ] Redesign Clone CTA as primary
- [ ] Create CloneSuccessModal with next steps
- [ ] Add StickyActionBar for mobile
- [ ] Implement confetti celebrations
- [ ] Add first-time experience celebrations

### Phase 3: Editorial Polish (Week 3-4)
- [ ] Create CuratorNote component
- [ ] Add social proof metrics display
- [ ] Implement FeaturedBadge system
- [ ] Create EditorialCard for Discover
- [ ] Add quality gating to Discover feed

### Phase 4: Signature Moments (Week 4-5)
- [ ] Expand Golf Ball animation suite
- [ ] Add page transitions
- [ ] Implement staggered card reveals
- [ ] Create empty state components
- [ ] Add glassmorphism to modals

### Phase 5: Refinement (Week 5-6)
- [ ] Sound design integration
- [ ] Dark mode polish
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] A/B test framework setup

---

## Success Metrics

### Primary KPIs

| Metric | Current | Target |
|--------|---------|--------|
| Clone Rate (per bag view) | ? | 15%+ |
| Share Rate (per bag view) | ? | 10%+ |
| Save Rate (per bag view) | ? | 20%+ |
| Return Visit Rate (7-day) | ? | 40%+ |
| Bag Completion Rate | ? | 60%+ |

### Engagement Signals

- Time on bag detail page (target: 45s+)
- Scroll depth on Discover (target: 80%+)
- Items added per session (target: 3+)
- Clone-to-edit rate (target: 70%+)

### Quality Signals

- Featured bag clone rate (2x regular)
- Verified creator follow rate
- Bags with 5+ items percentage

---

## Design Principles

1. **Clone is king** - Every design decision should encourage cloning
2. **Show, don't tell** - Social proof over explanations
3. **Celebrate taste** - Make curation feel like an achievement
4. **Friction is intentional** - Easy to clone, thoughtful to create
5. **Golf Ball everywhere** - Signature interaction in every state
6. **Editorial confidence** - Lists should feel authored, not algorithmic
7. **Dopamine breadcrumbs** - Reward micro-actions to drive macro-engagement

---

## Resources

### Design Inspiration
- [Linear](https://linear.app) - Smooth transitions, keyboard-first
- [Are.na](https://are.na) - Collection culture, tasteful curation
- [Uncrate](https://uncrate.com) - Editorial product presentation
- [Figma Community](https://figma.com/community) - Remix/fork culture

### Technical Reference
- [Framer Motion](https://motion.dev) - Animation library
- [Radix UI](https://radix-ui.com) - Accessible primitives
- [Canvas Confetti](https://github.com/catdad/canvas-confetti) - Celebration effects

### Research Sources
- All findings documented in this strategy are sourced from primary research conducted by our agent network, including web searches and codebase analysis.

---

*Last updated: December 2025*
*Version: 1.0*
