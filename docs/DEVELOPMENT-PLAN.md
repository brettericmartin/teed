# Teed UI/UX Revamp - Development Plan

> **STATUS: SUPERSEDED** (January 2026)
>
> This plan was created in December 2025 as a UI/UX wishlist. Many elements have been
> implemented through organic development, but this document is no longer actively tracked.
> See `/docs/IMPLEMENTATION_SUMMARY_2026-01-16.md` for recent completed work.
>
> **Key implementations from this plan:**
> - ✅ Badge system (Phase 4 - implemented in `/lib/badges/`)
> - ✅ Empty states (Phase 2.4 - implemented across dashboard)
> - ✅ Share flow (Phase 3.2 - QR codes, share modals)
> - ✅ Toast system (Phase 2.2 - enhanced with actions)
> - ⚠️ Most animation/celebration items remain future work

---

## Overview

Transform Teed into a dopamine-rich, curation-first platform where users want to clone, share, save, and come back.

---

## Phase 1: Foundation (Priority: CRITICAL)

### 1.1 Install Dependencies
- [ ] `framer-motion` - Animation library
- [ ] `canvas-confetti` - Celebration effects
- [ ] `@radix-ui/react-dialog` - Accessible modal primitives

### 1.2 Core Infrastructure
- [ ] Create `lib/celebrations.tsx` - Celebration context provider
- [ ] Create `lib/animations.ts` - Reusable animation variants
- [ ] Create `lib/hooks/useScrollReveal.ts` - Intersection observer hook
- [ ] Create `lib/hooks/useReducedMotion.ts` - Accessibility hook

### 1.3 CSS Foundation
- [ ] Add grainy gradient utilities to `globals.css`
- [ ] Add glow shadow system to `globals.css`
- [ ] Add glassmorphism utilities to `globals.css`
- [ ] Add safe area utilities for iOS
- [ ] Add horizontal scroll utilities
- [ ] Add scroll reveal animation classes

---

## Phase 2: Core Components (Priority: HIGH)

### 2.1 Button Enhancements
- [ ] Create `components/ui/MagneticButton.tsx`
- [ ] Update `components/ui/Button.tsx` with Framer Motion variants
- [ ] Add press animations (scale 0.98 on tap)
- [ ] Add hover glow effect for primary variant

### 2.2 Toast System Enhancement
- [ ] Update `components/ui/Toast.tsx` with progress bar
- [ ] Add haptic feedback integration
- [ ] Add action button support (undo, view)
- [ ] Add stacked toast management

### 2.3 Modal System
- [ ] Create `components/ui/AnimatedModal.tsx` base component
- [ ] Create `components/modals/CloneSuccessModal.tsx`
- [ ] Create `components/modals/ShareSuccessModal.tsx`
- [ ] Create `components/modals/FirstBagModal.tsx`
- [ ] Add spring animations for enter/exit

### 2.4 Empty States
- [ ] Create `components/ui/EmptyState.tsx` with variants
- [ ] Design empty state for: new-user, no-bags, no-items, no-results, search-empty

---

## Phase 3: Action Components (Priority: HIGH)

### 3.1 Clone Flow
- [ ] Create `components/actions/CloneButton.tsx` - Primary CTA
- [ ] Create clone API integration with optimistic UI
- [ ] Add clone attribution chain display
- [ ] Track first-clone milestone

### 3.2 Share Flow
- [ ] Create `components/actions/ShareButton.tsx`
- [ ] Integrate Web Share API for mobile
- [ ] Create desktop share modal with copy/QR
- [ ] Add share success celebration

### 3.3 Save Flow
- [ ] Create `components/actions/SaveButton.tsx` with toggle state
- [ ] Create inline collection selector dropdown
- [ ] Add save confirmation toast
- [ ] Create "View saved" quick action

### 3.4 Mobile Action Bar
- [ ] Create `components/ui/StickyActionBar.tsx`
- [ ] Add scroll-triggered visibility
- [ ] Implement safe area support
- [ ] Add spring entrance animation

---

## Phase 4: Social Proof (Priority: HIGH)

### 4.1 Metrics Display
- [ ] Create `components/ui/SocialProofMetrics.tsx`
- [ ] Add view count (threshold: 50+)
- [ ] Add clone count display
- [ ] Add save count (threshold: 10+)
- [ ] Format large numbers (1.2K)

### 4.2 Badges System
- [ ] Create `components/ui/Badge.tsx` variants for: Featured, Trending, Complete, Verified
- [ ] Create `components/ui/FeaturedBadge.tsx` with gradient
- [ ] Add badge display to bag cards
- [ ] Add badge display to bag detail pages

### 4.3 Attribution Chain
- [ ] Create `components/ui/ClonedFromBadge.tsx`
- [ ] Display "Cloned from @user/bag" on cloned bags
- [ ] Link to original bag
- [ ] Track clone genealogy

---

## Phase 5: Editorial Components (Priority: MEDIUM)

### 5.1 Curator Elements
- [ ] Create `components/ui/CuratorNote.tsx` (inline + featured variants)
- [ ] Create `components/ui/AboutThisBag.tsx` auto-generated section
- [ ] Create `components/ui/ListDescriptor.tsx` one-liner component
- [ ] Add curator avatar with verification badge

### 5.2 Card Enhancements
- [ ] Update `components/home/FeaturedBagCard.tsx` with:
  - Staggered entrance animations
  - Social proof metrics
  - Featured badge
  - Hover glow effect
  - Clone count display

### 5.3 Author Attribution
- [ ] Create `components/ui/AuthorByline.tsx`
- [ ] Add verified creator checkmark
- [ ] Style for minimal, standard, featured variants

---

## Phase 6: Animation System (Priority: MEDIUM)

### 6.1 Page Transitions
- [ ] Create `components/layout/PageTransition.tsx` wrapper
- [ ] Add fade-up entrance for pages
- [ ] Implement with AnimatePresence

### 6.2 List Animations
- [ ] Create `components/ui/StaggeredGrid.tsx` wrapper
- [ ] Add staggered reveal for bag grids
- [ ] Add staggered reveal for item lists
- [ ] Respect reduced-motion preference

### 6.3 Scroll Animations
- [ ] Implement scroll-triggered reveals
- [ ] Add parallax hero effect (optional)
- [ ] Create sticky header transform on scroll

### 6.4 Golf Ball Signature
- [ ] Expand `@keyframes ball-*` animations
- [ ] Create `components/ui/GolfBallLoader.tsx` enhanced
- [ ] Create `components/ui/GolfBallSuccess.tsx` celebration
- [ ] Create `components/ui/GolfBallProgress.tsx` progress bar

---

## Phase 7: Celebration System (Priority: MEDIUM)

### 7.1 Confetti Integration
- [ ] Configure canvas-confetti with brand colors
- [ ] Create celebration presets: micro, medium, major
- [ ] Add confetti to clone success
- [ ] Add confetti to first-bag creation

### 7.2 Haptic Feedback
- [ ] Create haptic utility functions
- [ ] Add haptic to button presses
- [ ] Add haptic patterns for success/error
- [ ] Respect system haptic preferences

### 7.3 First-Time Experiences
- [ ] Track first-bag milestone in localStorage
- [ ] Track first-clone milestone
- [ ] Track first-share milestone
- [ ] Create celebration for each milestone

### 7.4 Sound Design (Optional)
- [ ] Add success sound effect
- [ ] Add error sound effect
- [ ] Add share sound effect
- [ ] Provide mute toggle

---

## Phase 8: Discover Page (Priority: MEDIUM)

### 8.1 Featured Section
- [ ] Create `components/discover/FeaturedRow.tsx`
- [ ] Implement horizontal scroll with snap
- [ ] Add "Featured by Teed" header
- [ ] Curate initial featured bags

### 8.2 Category Angles
- [ ] Create angle-based sections: "Starter Kits", "Gifts That Don't Suck", etc.
- [ ] Design angle cards with distinct styling
- [ ] Implement category filtering

### 8.3 Quality Gating
- [ ] Add minimum item count filter (3+)
- [ ] Require cover image or 3+ item photos
- [ ] Filter placeholder titles
- [ ] Filter stale bags (90+ days)

---

## Phase 9: Bag Detail Page Revamp (Priority: HIGH)

### 9.1 Hero Section
- [ ] Redesign with editorial layout
- [ ] Add CuratorNote if exists
- [ ] Add AboutThisBag section
- [ ] Add SocialProofMetrics

### 9.2 CTA Hierarchy
- [ ] Make Clone primary (large, magnetic, green)
- [ ] Make Share secondary (outlined)
- [ ] Make Save secondary (outlined, toggle)
- [ ] Add More menu for tertiary actions

### 9.3 Item Grid
- [ ] Add staggered entrance animations
- [ ] Enhance item cards with hover effects
- [ ] Add "Why it's here" field display

### 9.4 Mobile Experience
- [ ] Implement StickyActionBar
- [ ] Optimize touch targets (44px min)
- [ ] Add pull-to-refresh (optional)

---

## Phase 10: Polish & Performance (Priority: LOW)

### 10.1 Visual Polish
- [ ] Add grainy texture to all gradients
- [ ] Implement glassmorphism on modals
- [ ] Add gradient borders to featured cards
- [ ] Polish dark mode colors

### 10.2 Performance
- [ ] Audit animation performance
- [ ] Lazy load confetti library
- [ ] Optimize images with blur placeholders
- [ ] Add skeleton loaders

### 10.3 Accessibility
- [ ] Respect prefers-reduced-motion
- [ ] Ensure focus states are visible
- [ ] Test with screen readers
- [ ] Verify color contrast ratios

### 10.4 Testing
- [ ] Add E2E tests for clone flow
- [ ] Add E2E tests for share flow
- [ ] Add E2E tests for save flow
- [ ] Test on iOS Safari, Android Chrome

---

## Execution Order

### Sprint 1: Foundation + Core Actions
1. Install dependencies
2. CSS foundation (grainy, glow, glass)
3. CelebrationProvider + animations lib
4. MagneticButton component
5. Toast enhancement
6. CloneSuccessModal
7. StickyActionBar

### Sprint 2: Social Proof + Editorial
8. SocialProofMetrics component
9. Badge system (Featured, Verified)
10. ClonedFromBadge
11. CuratorNote component
12. EmptyState component
13. FeaturedBagCard enhancement

### Sprint 3: Page Integration
14. Bag detail page revamp
15. Clone flow integration
16. Share flow integration
17. Save flow integration
18. Discover page featured row

### Sprint 4: Animation + Polish
19. Page transitions
20. Staggered grid animations
21. Golf ball animation suite
22. First-time celebrations
23. Dark mode polish
24. Performance audit

---

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Clone Rate | TBD | 15%+ | Clones / Bag Views |
| Share Rate | TBD | 10%+ | Shares / Bag Views |
| Save Rate | TBD | 20%+ | Saves / Bag Views |
| Return Visits (7d) | TBD | 40%+ | Analytics |
| Bag Completion | TBD | 60%+ | Bags with 5+ items |
| Time on Page | TBD | 45s+ | Analytics |

---

## Files to Create/Modify

### New Files
```
lib/
├── celebrations.tsx
├── animations.ts
└── hooks/
    ├── useScrollReveal.ts
    └── useReducedMotion.ts

components/
├── ui/
│   ├── MagneticButton.tsx
│   ├── AnimatedModal.tsx
│   ├── StickyActionBar.tsx
│   ├── SocialProofMetrics.tsx
│   ├── FeaturedBadge.tsx
│   ├── ClonedFromBadge.tsx
│   ├── CuratorNote.tsx
│   ├── EmptyState.tsx
│   ├── StaggeredGrid.tsx
│   ├── GolfBallProgress.tsx
│   └── AuthorByline.tsx
├── modals/
│   ├── CloneSuccessModal.tsx
│   ├── ShareSuccessModal.tsx
│   └── FirstBagModal.tsx
├── actions/
│   ├── CloneButton.tsx
│   ├── ShareButton.tsx
│   └── SaveButton.tsx
└── discover/
    └── FeaturedRow.tsx
```

### Files to Modify
```
app/globals.css - Add new CSS utilities
components/ui/Button.tsx - Add animations
components/ui/Toast.tsx - Add progress bar
components/home/FeaturedBagCard.tsx - Add animations + badges
app/c/[code]/PublicBagView.tsx - Revamp with new components
app/page.tsx - Add featured row
```

---

*Development Plan v1.0 - December 2025*
