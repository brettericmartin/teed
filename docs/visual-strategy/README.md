# teed Visual Strategy

This directory contains the visual design documentation and strategy for teed.

## Quick Links

- [UI Element Directory](./ui-elements.md) - Comprehensive catalog of all UI components
- [Visual Direction Guide](./visual-direction.md) - Color palette, typography, and design principles
- [Animation Strategy](./animation-strategy.md) - Loading animations and micro-interactions

## Brand Identity Summary

**teed** is a "what's in my bag" sharing platform with a **Premium Outdoor Enthusiast** brand personality.

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Teed Green | `#8BAA7E` | Primary brand, CTAs |
| Sky Blue | `#CFE3E8` | AI features, intelligence |
| Deep Evergreen | `#1F3A2E` | Headings, authority |
| Copper | `#C2784A` | Edit/creative actions |
| Warm Sand | `#D9B47C` | Warmth, secondary |

### Signature Animation

The **Rolling Ball** loader is teed's signature loading animation - a playful golf ball that rolls to indicate processing. It comes in three sizes (sm, md, lg) and three variants (ai, primary, neutral).

```tsx
import { LoadingBall } from '@/components/ui/LoadingBall';

// AI Processing
<LoadingBall size="md" variant="ai" label="Identifying..." />

// General Loading
<LoadingBall size="lg" variant="primary" />
```

## Design Principles

1. **Context-Aware Colors**: AI = sky blue, Create = evergreen, Edit = copper
2. **Premium Feel**: Generous whitespace, subtle shadows, smooth animations
3. **Mobile-First**: 44px touch targets, safe area padding
4. **Accessibility**: Reduced motion support, WCAG AA contrast
5. **Playful Professionalism**: The rolling ball adds personality without being juvenile

## Implementation Status

- [x] LoadingBall component created
- [x] Rolling ball CSS animations added
- [x] AIAssistantHub updated (both directories)
- [x] ProductReviewModal updated (both directories)
- [x] DiscoverClient updated
- [x] Settings page loaders
- [x] BatchPhotoSelector loaders (both directories)
- [x] ItemPhotoUpload loaders
- [x] ImageCropModal loaders
- [x] EnrichmentPreview loaders
- [x] QuickAddItem loaders
- [x] TranscriptProcessorModal loaders
- [x] UserProfileClient loader
