# Action Routing Reference & Test Checklist

Every user-facing action entry point, what it triggers, and where it lands.

Use this as the single source of truth when verifying navigation flows.

---

## Quick Legend

| Symbol | Meaning |
|--------|---------|
| `->` | Navigates to route |
| `=>` | Opens modal/flow (no navigation) |
| `~>` | API call (stays on page) |

---

## 1. Profile Page (`/u/{handle}`)

The profile page is the primary hub. Owners see editing controls.

### ProfileActionBar (top bar, owner-only)

Collapsible pill that expands into `[Customize] [+ Add] [Stats]`.

| Menu | Option | Action | Chain |
|------|--------|--------|-------|
| **Add** | New Bag | `handleAddBag()` | `-> /bags/new` -> create form -> `-> /u/{handle}/{code}/edit` |
| **Add** | Add Block | `onAddBlock()` | `=> BlockPicker modal` |
| **Add** | Add Link | `onAddLink()` | `=> UniversalLinkAdder modal` |
| **Add** | Social Links | `onAddSocial()` | `=> AddSocialFlow modal` |
| **Customize** | Theme & Colors | `onCustomizeTheme()` | `=> ThemeEditor modal` |
| **Customize** | Profile Info | `onCustomizeProfile()` | `=> BlockSettingsPanel (header block)` |
| **Customize** | Panel Settings | `onEditBlocks()` | `=> enters edit mode` |
| **Stats** | (direct) | `onViewStats()` | `-> /u/{handle}/stats` |

**Source:** `components/ProfileActionBar.tsx`, wired in `app/u/[handle]/UnifiedProfileView.tsx:569`

### FloatingActionHub (bottom-left FAB, edit mode)

| Option | Action | Chain |
|--------|--------|-------|
| Add Link | `onOpenLinkAdder()` | `=> UniversalLinkAdder modal` |
| Add Photo | `router.push('/bags/new')` | `-> /bags/new` |
| New Bag | `router.push('/bags/new')` | `-> /bags/new` |
| Add Panel | `onOpenBlockPicker()` | `=> BlockPicker modal` |

**Source:** `components/FloatingActionHub.tsx`

### CommandPalette (Cmd+K / Ctrl+K, owner-only)

| Context | Option | Chain |
|---------|--------|-------|
| No URL typed | Create New Bag | `-> /bags/new` |
| No URL typed | Add Panel | `=> BlockPicker modal` |
| No URL typed | Customize Theme | `=> ThemeEditor modal` |
| No URL typed | View Profile | `-> /u/{handle}` |
| No URL typed | Settings | `-> /settings` |
| No URL typed | Go Home | `-> /` |
| URL typed (product) | Add to Bag | `-> /bags/new?url={url}` |
| URL typed (product) | Create New Bag | `-> /bags/new?url={url}` |
| URL typed (embed) | Add as Embed | `~> POST /api/profile/blocks` then refresh |
| URL typed (embed) | Create New Bag | `-> /bags/new?url={url}` |
| URL typed (social) | Add to Social Links | `-> /settings?add-social={url}` |

**Source:** `components/CommandPalette/index.tsx`

### GlobalPasteHandler (paste URL anywhere, owner-only)

| Paste Type | Action | Chain |
|------------|--------|-------|
| Product URL | Add to existing bag | `=> LinkProcessorModal -> bag selector ~> POST /api/universal-links/save` |
| Product URL | Create New Bag | `-> /bags/new?url={url}` |
| Embed URL | Add to Profile | `=> LinkProcessorModal ~> POST /api/profile/blocks` |
| Social URL | Add to Social Links | `=> LinkProcessorModal ~> PATCH /api/profile` |

**Source:** `components/GlobalPasteHandler.tsx` -> `components/LinkProcessorModal.tsx`

### URL Param Actions (deep-link into profile)

| Param | Effect |
|-------|--------|
| `?edit=true` | Enters edit mode on load |
| `?action=block` | Opens BlockPicker |
| `?action=link` | Opens UniversalLinkAdder |
| `?action=social` | Opens AddSocialFlow |
| `?welcome=true` | Shows CelebrationModal |

**Source:** `app/u/[handle]/UnifiedProfileView.tsx:490-510`

---

## 2. Dashboard (`/dashboard`)

**IMPORTANT:** `/dashboard` is a **server-side redirect**. It always redirects to `/u/{handle}`. Only the `?welcome=true` param is preserved. All other query params are dropped.

**Source:** `app/dashboard/page.tsx`

### Incoming Routes That Hit `/dashboard`

| Source | Route | Status |
|--------|-------|--------|
| Invite redemption | `/dashboard?welcome=true` | OK - `welcome` preserved |
| Settings "Back" | `/dashboard` | OK - no params needed |
| Bag editor "Back" | `/dashboard` | OK - no params needed |
| Signup completion | `/dashboard` | OK - no params needed |

---

## 3. Bag Creation (`/bags/new`)

Standalone page. This is the canonical bag creation route.

| Param | Effect |
|-------|--------|
| `?url={url}` | Pre-fills Quick Start URL, shows classification |
| (none) | Clean creation form |

**Flow:** Auth check -> form -> `POST /api/bags` -> (optional URL save) -> confetti -> `-> /u/{handle}/{code}/edit`

**Source:** `app/bags/new/page.tsx`

---

## 4. Bag Editor (`/u/{handle}/{code}/edit`)

| Param | Effect |
|-------|--------|
| `?action=photo` | Opens photo upload flow |
| (none) | Standard editor |

**Source:** `app/u/[handle]/[code]/edit/BagEditorClient.tsx`

---

## 5. Public Bag View (`/u/{handle}/{code}`)

### Visitor Actions

| Action | Chain |
|--------|-------|
| Add to My Bag (item) | `=> AddToBagModal -> select/create bag ~> POST /api/items/copy-to-bag` |
| Follow owner | `~> POST /api/follows` (or `-> /login` if unauthed) |

**Source:** `app/u/[handle]/[code]/components/AddToBagModal.tsx`

---

## 6. Onboarding Flows

### GettingStartedChecklist

| Step | Action | Chain |
|------|--------|-------|
| Create your first bag | `onCreateBag()` | Depends on parent wiring (typically `=> NewBagModal` or `-> /bags/new`) |
| Add 3 items | `onAddItems()` | Depends on parent wiring |
| Set profile photo | `onSetPhoto()` | Depends on parent wiring |
| Share your bag | `onShare()` | Depends on parent wiring |

**Source:** `components/onboarding/GettingStartedChecklist.tsx`

### IdeasPanel (AI bag suggestions)

| Action | Chain |
|--------|-------|
| Create This Bag | `onCreateBag(idea)` | Passes `BagIdea` to parent callback |

**Source:** `components/ideas/IdeasPanel.tsx`

---

## Test Checklist

Run through each row. Mark pass/fail. Every action should produce visible feedback (modal, navigation, or toast).

### Profile Page - Owner View

```
[ ] ProfileActionBar > Add > New Bag
    Expected: navigates to /bags/new, form loads, create bag -> lands on bag editor
[ ] ProfileActionBar > Add > Add Block
    Expected: BlockPicker modal opens
[ ] ProfileActionBar > Add > Add Link
    Expected: UniversalLinkAdder modal opens
[ ] ProfileActionBar > Add > Social Links
    Expected: AddSocialFlow modal opens
[ ] ProfileActionBar > Customize > Theme & Colors
    Expected: ThemeEditor modal opens
[ ] ProfileActionBar > Customize > Profile Info
    Expected: header block selected, settings panel opens
[ ] ProfileActionBar > Stats
    Expected: navigates to /u/{handle}/stats
[ ] FloatingActionHub > New Bag
    Expected: navigates to /bags/new
[ ] FloatingActionHub > Add Link
    Expected: UniversalLinkAdder modal opens
[ ] FloatingActionHub > Add Panel
    Expected: BlockPicker modal opens
[ ] Cmd+K > "Create New Bag"
    Expected: navigates to /bags/new
[ ] Cmd+K > paste product URL > "Add to Bag"
    Expected: navigates to /bags/new?url=...
[ ] Paste product URL on page
    Expected: LinkProcessorModal opens with classification
[ ] Deep link: /u/{handle}?action=block
    Expected: profile loads, BlockPicker auto-opens
[ ] Deep link: /u/{handle}?action=link
    Expected: profile loads, UniversalLinkAdder auto-opens
```

### Bag Creation Flow

```
[ ] /bags/new (no params)
    Expected: form loads, title autofocused, create -> confetti -> bag editor
[ ] /bags/new?url=https://amazon.com/dp/B0TEST
    Expected: URL pre-filled, classification shown, create -> item added -> bag editor
[ ] /bags/new > close (X button)
    Expected: goes back (history) or to profile
[ ] /bags/new > unauthenticated
    Expected: redirects to /login
```

### Bag Editor

```
[ ] /u/{handle}/{code}/edit
    Expected: editor loads with items
[ ] /u/{handle}/{code}/edit?action=photo
    Expected: photo upload flow opens
[ ] Back to dashboard
    Expected: navigates to /dashboard -> redirects to /u/{handle}
```

### Public Bag View - Visitor

```
[ ] Click item "Add to My Bag"
    Expected: AddToBagModal opens, can select/create bag
[ ] AddToBagModal > Create new bag > add
    Expected: bag created, item copied, modal closes
[ ] Follow button (logged in)
    Expected: follow state toggles
[ ] Follow button (logged out)
    Expected: redirects to /login
```

### Cross-Cutting

```
[ ] Paste handler skips inputs/textareas
    Expected: pasting in search box does NOT trigger LinkProcessorModal
[ ] Paste handler respects data-no-paste-handler attribute
    Expected: inputs with this attr skip paste handling
[ ] First bag creation triggers celebrateFirstBag() confetti
[ ] Subsequent bag creation triggers celebrateBagCreated() confetti
[ ] All modals close on backdrop click
[ ] All modals close on Escape key
[ ] AddItemFlow swipe-to-dismiss works on mobile
```

---

## Architecture Notes

### Why `/dashboard` is a Redirect

The dashboard server component (`app/dashboard/page.tsx`) authenticates the user, looks up their handle, and redirects to `/u/{handle}`. This means:

- **DO NOT** route to `/dashboard?action=xyz` — params get dropped (except `welcome`)
- **DO** route directly to `/bags/new`, `/u/{handle}?action=xyz`, or open modals in-place
- All "back to dashboard" links (`-> /dashboard`) are fine since they need no params

### Canonical Routes for Actions

| Intent | Correct Route |
|--------|---------------|
| Create new bag | `-> /bags/new` or `-> /bags/new?url={url}` |
| Open block picker on profile | `-> /u/{handle}?action=block` or `=> modal` |
| Open link adder on profile | `-> /u/{handle}?action=link` or `=> modal` |
| Add social links | `-> /u/{handle}?action=social` or `=> modal` |
| Edit a bag | `-> /u/{handle}/{code}/edit` |
| View stats | `-> /u/{handle}/stats` |

### Duplicate Entry Points (by design)

Some actions are intentionally reachable from multiple places:

| Action | Entry Points |
|--------|-------------|
| Create bag | ProfileActionBar, FloatingActionHub, CommandPalette, dashboard header, welcome card, onboarding checklist, AddItemFlow "Create New Bag" |
| Add link | ProfileActionBar, FloatingActionHub, Cmd+K, GlobalPasteHandler |
| Add block | ProfileActionBar, FloatingActionHub, Cmd+K |

All should converge on the same behavior regardless of entry point.
