# Mobile UI Architecture Refactor

**Status:** Implemented
**Last Updated:** 2026-01-27
**Issue:** Overlapping UI elements at bottom of mobile screen during dashboard/profile editing

---

## Problem Statement

When editing a profile on mobile, multiple fixed UI elements were competing for space at the bottom of the screen:
1. Mobile navigation bar (Dashboard, Discover, Updates, Profile)
2. ProfileActionBar (Add/Customize/Stats buttons)
3. "Done" button (FloatingEditButton)
4. Feedback widget button
5. Edit mode hints tooltip

The original approach of shifting elements around with CSS variables didn't solve the fundamental problem: too many things at the bottom.

---

## Solution: Architectural Refactor

Instead of stacking elements, we reorganized the UI:

### Before (Cluttered Bottom)
```
                    CONTENT AREA

BOTTOM CHAOS (all competing for space)
┌─────────────────────────────────────────────┐
│           EditModeHints                     │
├─────────────────────────────────────────────┤
│                        [Done E] [Feedback]  │
├─────────────────────────────────────────────┤
│  [Customize]  [+ Add +]  [Stats]            │
├─────────────────────────────────────────────┤
│ Dashboard | Discover | Updates | Profile    │
└─────────────────────────────────────────────┘
```

### After (Clean Separation)
```
TOP NAV (unchanged)
┌─────────────────────────────────────────────┐
│ [Logo]                     [Profile Avatar] │
└─────────────────────────────────────────────┘

CONTEXTUAL EDIT TOOLBAR (owner-only on profile)
┌─────────────────────────────────────────────┐
│    [Customize]  [+ ADD +]  [Stats]          │
└─────────────────────────────────────────────┘

                    CONTENT AREA

CLEAN BOTTOM NAV
┌─────────────────────────────────────────────┐
│ Discover | Dashboard | Updates | Feedback   │
└─────────────────────────────────────────────┘
```

---

## Changes Made

### 1. ProfileActionBar - Moved to Top
**File:** `components/ProfileActionBar.tsx`

- Changed from `fixed bottom-*` to `fixed top-*` positioning
- Now positioned below the main nav: `top-[calc(64px+env(safe-area-inset-top,0px)+8px)]`
- Dropdown menus now open downward instead of upward
- Animation direction reversed (slides down from top)
- Changed ChevronUp to ChevronDown icon

### 2. FloatingEditButton - Removed
**File:** `app/u/[handle]/UnifiedProfileView.tsx`

- Removed import and usage of FloatingEditButton
- Edit mode is now accessed via Customize > Panel Settings in ProfileActionBar
- Component file kept for reference but no longer rendered

### 3. Mobile Bottom Nav - Simplified
**File:** `components/Navigation.tsx`

- Removed Profile button (redundant - already in top nav dropdown)
- Added Feedback button in its place
- Reordered: Discover | Dashboard | Updates | Feedback
- Feedback dispatches `openFeedback` custom event

### 4. FeedbackWidget - Integrated with Nav
**File:** `components/FeedbackWidget.tsx`

- Floating button now hidden on mobile (`hidden md:block`)
- Listens for `openFeedback` custom event to open panel
- Desktop still has the floating button at bottom-right

---

## Testing Checklist

### Mobile Testing (< 768px viewport)

- [ ] Top nav shows Logo + Profile avatar
- [ ] ProfileActionBar appears below top nav on profile pages (owner only)
- [ ] "Add" menu opens downward without overlap
- [ ] "Customize" menu opens downward without overlap
- [ ] Bottom nav shows: Discover | Dashboard | Updates | Feedback
- [ ] Tapping Feedback in nav opens feedback panel
- [ ] No floating buttons at bottom-right on mobile
- [ ] Edit mode accessible via Customize > Panel Settings

### Desktop Testing (>= 768px viewport)

- [ ] ProfileActionBar positioned at top on profile pages
- [ ] Floating feedback button visible at bottom-right
- [ ] All functionality unchanged

### Notched Device Testing

- [ ] ProfileActionBar respects safe-area-inset-top
- [ ] Dropdown menus position correctly below the bar

---

## Files Modified

| File | Change |
|------|--------|
| `components/ProfileActionBar.tsx` | Moved to top, menus open downward |
| `components/Navigation.tsx` | Replaced Profile with Feedback in mobile nav |
| `components/FeedbackWidget.tsx` | Hidden button on mobile, listens for event |
| `app/u/[handle]/UnifiedProfileView.tsx` | Removed FloatingEditButton |

---

## Related Cleanup (Optional)

- `components/FloatingEditButton.tsx` - Can be deleted (no longer used)
- `tests/e2e/12-mobile-desktop-editing.spec.ts` - May need updates for new edit mode access
- CSS variables in `globals.css` for mobile stacking - Can be simplified/removed

---

## Rollback Instructions

If issues arise, revert these commits and the original architecture will be restored:
1. ProfileActionBar back to bottom positioning
2. FloatingEditButton re-added to UnifiedProfileView
3. Profile button restored to mobile nav
4. Feedback widget floating button shown on all screens
