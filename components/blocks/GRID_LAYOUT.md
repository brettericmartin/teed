# Profile Grid Layout System

This document explains how the profile grid layout works and the CSS requirements for blocks to render correctly.

## Overview

The profile page uses a 12-column grid system powered by `react-grid-layout`. Blocks are positioned and sized using grid coordinates (x, y, w, h) where:

- **x**: Column position (0-11)
- **y**: Row position (0+)
- **w**: Width in columns (1-12)
- **h**: Height in rows (1+)

## Grid Configuration

```typescript
// Grid settings (ProfileGridLayout.tsx)
cols: 12           // 12-column grid
rowHeight: 80      // Each row is 80px tall
margin: [16, 16]   // 16px gap between blocks (horizontal, vertical)
```

## Pixel Calculations

The grid uses these formulas to calculate positions:

```typescript
// Column width calculation
colWidth = (containerWidth - margin * (cols - 1)) / cols

// Block position (left edge)
blockLeft = x * (colWidth + margin)

// Block width
blockWidth = w * colWidth + (w - 1) * margin

// Block height
blockHeight = h * rowHeight + (h - 1) * margin
```

**Example** (1088px container width):
- colWidth = (1088 - 16 * 11) / 12 = 76px
- A block at x=6 starts at: 6 * (76 + 16) = 552px
- A block with w=6 is: 6 * 76 + 5 * 16 = 536px wide

## Critical CSS Requirements

### 1. Blocks Must Fill Their Grid Cell Height

Every block component MUST have `h-full` on its root element to fill the allocated grid cell:

```tsx
// CORRECT - fills grid cell
return (
  <div className="h-full flex flex-col">
    {/* content */}
  </div>
);

// WRONG - content determines height, leaves empty space
return (
  <div>
    {/* content */}
  </div>
);
```

### 2. Content Should Be Vertically Centered

For blocks where content doesn't fill the full height, use flexbox to center:

```tsx
return (
  <div className="h-full flex flex-col justify-center">
    {/* centered content */}
  </div>
);
```

### 3. Height Chain Must Be Unbroken

The `h-full` must propagate from GridLayout through all wrapper elements:

```
GridLayout (.react-grid-item has explicit height)
  └── <div className="w-full h-full">     // ProfileGridLayout wrapper
        └── BaseBlock (h-full on root)
              └── Block content wrapper (h-full)
                    └── Actual block component (h-full + flex centering)
```

If any element in this chain is missing `h-full`, the height chain breaks.

## File Reference

| File | Purpose | Key Classes |
|------|---------|-------------|
| `ProfileGridLayout.tsx` | Main grid container | `h-full` on item wrapper |
| `BaseBlock.tsx` | Edit mode wrapper | `h-full` on all divs |
| `BlockContainer.tsx` | View mode card wrapper | `h-full flex flex-col` |
| `HeaderBlock.tsx` | Avatar/name block | `h-full flex flex-col`, `flex-1 justify-center` |
| `BioBlock.tsx` | Bio text block | `h-full flex flex-col justify-center` |
| `SocialLinksBlock.tsx` | Social icons block | `h-full flex flex-col justify-center` |
| `FeaturedBagsBlock.tsx` | Collections grid | `h-full flex flex-col`, `flex-1` on grid |
| `CustomTextBlock.tsx` | Custom text block | `h-full flex flex-col justify-center` |
| `EmbedBlock.tsx` | Embed block | `h-full flex flex-col justify-center` |
| `SpacerBlock.tsx` | Spacer (uses fixed height) | No h-full (intentional) |
| `DividerBlock.tsx` | Divider (uses fixed height) | No h-full (intentional) |

## Grid Overlay (Edit Mode)

In edit mode, visual grid lines help users understand snap points:

```typescript
// Grid overlay positioning (ProfileGridLayout.tsx)
// The overlay must start at left: '48px' to align with GridLayout content
// (container has pl-12 = 48px padding for drag handles)

<div style={{ left: '48px', right: 0, top: 0, bottom: 0 }}>
  {/* Column lines at: i * (colWidth + margin) */}
  {/* Row lines at: i * (rowHeight + margin) */}
</div>
```

## Common Mistakes to Avoid

1. **Missing `h-full`**: Block appears at top of cell with empty space below
2. **Wrong overlay offset**: Grid lines don't align with block positions
3. **Breaking flex chain**: Parent has `flex flex-col` but child doesn't have `flex-1`
4. **Hardcoded heights**: Using `h-[200px]` instead of `h-full` prevents proper filling

## Testing Block Alignment

Use browser DevTools to verify:

1. Select a `.react-grid-item` element
2. Check its computed height matches: `h * 80 + (h-1) * 16` pixels
3. Verify child elements have `height: 100%` computed
4. Content should be vertically centered, not top-aligned

## Adding New Block Types

When creating a new block component:

```tsx
export default function NewBlock({ config }: NewBlockProps) {
  return (
    // 1. Root must have h-full
    <div className="h-full flex flex-col">
      // 2. Content wrapper centers vertically
      <div className="flex-1 flex flex-col justify-center px-4 py-4">
        {/* Your block content */}
      </div>
    </div>
  );
}
```

Then in `UnifiedProfileView.tsx`:

```tsx
case 'new_block':
  return (
    // Wrapper ensures height propagation
    <div className="h-full">
      <NewBlock config={config} />
    </div>
  );
```
