# Unified Item Type Foundation - COMPLETED

## Problem
Teed needs to support Creator Tools and Supplement Stacks verticals with a unified foundation for different item types beyond physical products.

## Solution
Hybrid approach: Add `item_type` column for discrimination + use existing `specs` JSONB for type-specific fields.

Benefits:
- Fast database filtering by type
- Clean UI conditional rendering
- Type-safe TypeScript with discriminated unions
- Backward compatibility (existing items default to `physical_product`)

## Status

### Phase 1: Database Migration
- [x] Create `scripts/migrations/088_item_type_extension.sql`
- [x] Apply migration to database

### Phase 2: TypeScript Types
- [x] Create `lib/types/itemTypes.ts`
- [x] Create `lib/types/bagViewTypes.ts` (shared types for views)

### Phase 3: Item Type Registry
- [x] Create `lib/itemTypes/registry.ts`

### Phase 4: Validation
- [x] Create `lib/validation/itemSpecs.ts`

### Phase 5: API Updates
- [x] Update `app/api/items/[id]/route.ts`
- [x] Update `app/api/bags/[code]/items/route.ts`

### Phase 6: UI Components
- [x] Create `components/item/ItemTypeSelector.tsx`
- [x] Create `components/item/DynamicSpecsForm.tsx`
- [x] Create `components/item/SupplementTimingBadges.tsx`
- [x] Create `components/item/PricingBadge.tsx`
- [x] Create `components/item/index.ts`
- [x] Update `app/u/[handle]/[code]/PublicBagView.tsx`
- [x] Update view components (GridView, MasonryView, EditorialView, CarouselView, ListViewItem, AddToBagModal)

### Phase 7: Smart Type Inference
- [x] Create `lib/itemTypes/inference.ts` (inference utility)
- [x] Update `app/api/bags/[code]/items/from-url/route.ts` (auto-infer from URL)
- [x] Update `app/api/bags/[code]/items/route.ts` (infer when type not provided)

## Files Created
| File | Purpose |
|------|---------|
| `scripts/migrations/088_item_type_extension.sql` | Add item_type column |
| `lib/types/itemTypes.ts` | TypeScript type definitions |
| `lib/types/bagViewTypes.ts` | Shared types for bag view components |
| `lib/itemTypes/registry.ts` | Item type configuration registry |
| `lib/itemTypes/inference.ts` | Smart type inference from URL/name/context |
| `lib/validation/itemSpecs.ts` | Zod validation schemas |
| `components/item/ItemTypeSelector.tsx` | Type selector dropdown |
| `components/item/DynamicSpecsForm.tsx` | Dynamic form based on type |
| `components/item/SupplementTimingBadges.tsx` | Timing display badges |
| `components/item/PricingBadge.tsx` | Pricing model badge |
| `components/item/index.ts` | Component exports |

## Files Modified
| File | Changes |
|------|---------|
| `app/api/items/[id]/route.ts` | Accept item_type in updates |
| `app/api/bags/[code]/items/route.ts` | Accept item_type in creation, auto-infer type |
| `app/api/bags/[code]/items/from-url/route.ts` | Auto-infer item_type from URL and context |
| `app/u/[handle]/[code]/PublicBagView.tsx` | Type-specific specs display |
| `app/u/[handle]/[code]/components/GridView.tsx` | Use shared BagViewItem type |
| `app/u/[handle]/[code]/components/MasonryView.tsx` | Use shared BagViewItem type |
| `app/u/[handle]/[code]/components/EditorialView.tsx` | Use shared BagViewItem type |
| `app/u/[handle]/[code]/components/CarouselView.tsx` | Use shared BagViewItem type |
| `app/u/[handle]/[code]/components/ListViewItem.tsx` | Use shared BagViewItem type |
| `app/u/[handle]/[code]/components/AddToBagModal.tsx` | Use shared BagViewItem type |

## Verification
- [x] Migration applied: 372 existing items defaulted to `physical_product`
- [x] Build passes: `npm run build`
- [x] Security check: No new issues (existing RLS covers new column)

## Item Types Supported
1. `physical_product` - Physical gear (default, backward compatible)
2. `software` - Apps, tools (Creator Tools vertical)
3. `service` - Subscriptions (Creator Tools vertical)
4. `supplement` - Vitamins, supplements (Biohacking vertical)
5. `consumable` - Food, drinks (future)

## Next Steps (Future Work)
- Add manual type override in item edit modal (ItemTypeSelector + DynamicSpecsForm)
- Add type-based filtering to bag views
- Create type-specific bag templates
- Add inference to transcript processing for bulk link import

## Inference System

The inference system (`lib/itemTypes/inference.ts`) automatically detects item types based on:

1. **URL domains** (most reliable)
   - Software: figma.com, notion.so, github.com, vercel.com, etc.
   - Supplements: thorne.com, iherb.com, athleticgreens.com, etc.
   - Physical products: amazon.com, rei.com, apple.com, etc.
   - TLD hints: `.app`, `.io`, `.dev`, `.ai` → software

2. **Product names** (keyword matching)
   - Supplements: vitamin, omega-3, ashwagandha, creatine, etc.
   - Software: app, platform, subscription, api, etc.

3. **Brand inference**
   - Known supplement brands: Thorne, Pure Encapsulations, etc.

4. **Bag context**
   - Bag title/category/tags like "supplements", "tech stack", "dev tools"

5. **Default**: Falls back to `physical_product` (backward compatible)
