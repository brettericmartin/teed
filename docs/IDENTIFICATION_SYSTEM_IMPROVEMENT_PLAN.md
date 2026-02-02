# Identification & Recommendation System - Improvement Plan

**Date:** February 2026
**Purpose:** Comprehensive evaluation and improvement roadmap for Teed's product identification and recommendation system

---

## Executive Summary

The current identification system is architecturally sound with 7-stage graceful degradation. Key opportunities:

1. **Confidence Calibration** - Hard-coded thresholds need tuning based on real usage
2. **Feedback Loop** - User corrections don't flow back to improve confidence
3. **Variant Selection** - System identifies products but not specific variants (size/color)
4. **Cross-Category Parity** - Golf is well-supported; other categories lag
5. **Performance Visibility** - No metrics to measure actual identification quality

---

## Doctrine Alignment Audit

### Current System vs Doctrine

| Doctrine Test | Link ID | Text Parsing | AI Enrichment |
|---------------|---------|--------------|---------------|
| Reduces explanation friction? | ✅ Auto-identifies products | ✅ Smart parsing | ✅ Suggestions save typing |
| Increases trust? | ⚠️ Confidence badges help but can confuse | ✅ Shows what was understood | ⚠️ "AI identified" feels uncertain |
| Preserves hierarchy? | ✅ Creates items in bags | ✅ | ✅ |
| Avoids obligation? | ✅ No pressure | ✅ | ⚠️ Clarification can feel like work |
| Constructive dopamine? | ✅ Satisfaction when it "just works" | ✅ | ⚠️ Friction when wrong |
| Passes stale test? | ✅ Works on any URL | ✅ | ✅ |

**Key Doctrine Risks:**
- Clarification questions can feel like obligation ("you must answer this")
- Wrong identifications hurt trust more than manual entry would
- Multiple "AI identified" failures train users to distrust the system

---

## Advisory Board Evaluation

### Daniel Priestley (Growth & Demand)
> "Does this create visible demand/supply tension?"

**Current:** No. The system is invisible - it just works or doesn't.
**Opportunity:** Show users what the system learned from them. "Thanks to you, we now recognize 500+ golf products instantly."

### Julie Zhuo (Design)
> "Does this feel discovered, not disrupted?"

**Current:** ⚠️ Mixed. Good identifications feel magical. Bad ones feel jarring.
**Opportunity:** Graceful degradation in UI - show partial understanding rather than binary success/failure.

### Li Jin (Ownership)
> "Does this increase creator control and leverage?"

**Current:** ✅ Yes. Bulk operations and smart parsing save creator time.
**Opportunity:** Let creators contribute to the library and see their impact.

### Emily Heyward (Brand)
> "Would creators proudly show this branding?"

**Current:** ✅ The experience is clean when it works.
**Opportunity:** Error states need more polish - "We're not sure about this" vs technical error messages.

### Codie Sanchez (Infrastructure)
> "Is this picks-and-shovels that enables everyone?"

**Current:** ✅ Yes. The identification system is core infrastructure.
**Opportunity:** MCP Server exposes this to AI agents - multiplicative value.

**Board Score: 3.5/5 approval** - Improvements needed before major features.

---

## Current System Analysis

### Link Identification Pipeline (7 Stages)

```
Stage 0: Product Library Cache     → 0.70 threshold → Early exit
Stage 1: URL Intelligence          → 0.85 threshold → Early exit if brand + name
Stage 2: Lightweight Fetch         → 0.95 for JSON-LD
Stage 2.5: Amazon ASIN Lookup      → 0.90 on success
Stage 2.6: Firecrawl/Jina          → 0.90 on success
Stage 2.7: Google Images Fallback  → 0.75
Stage 3: AI Semantic Analysis      → Variable (0.6-0.9)
```

**Strengths:**
- Multi-stage graceful degradation ensures always returning something
- Smart early exits avoid expensive operations when URL/library sufficient
- Fire-and-forget learning adds successful identifications to library

**Weaknesses:**
- Hard-coded confidence thresholds (0.85, 0.75, 0.70) are not empirically validated
- No telemetry to measure actual success rates per stage
- Amazon blocking remains a significant gap
- No feedback mechanism when users correct wrong identifications

### Text Parsing Pipeline (4 Stages)

```
Stage 1: Normalize    → Quantity, price constraints
Stage 2: Pattern      → Golf specs (10.5°, stiff), colors, sizes
Stage 3: Dictionary   → 500+ brands, category inference
Stage 4: Inference    → Product name from remaining text
```

**Strengths:**
- Comprehensive brand dictionary (500+ brands across 50+ categories)
- Category-specific spec extraction (golf, tennis, cycling, audio, photography, watches, fitness)
- Confidence scoring enables smart clarification triggering

**Weaknesses:**
- Golf heavily favored in spec patterns; fashion/beauty minimal
- No learning - dictionary is static
- Clarification questions feel like work, not help

### AI Enrichment (3 Tiers)

```
Tier 1: Library Search  → Exact match (>92% confidence + 75% word relevance)
Tier 2: AI + Web       → GPT-4o with context, auto-learning at 0.75+
Tier 3: Fallback       → Basic suggestion from detected brand/category
```

**Strengths:**
- Word relevance verification prevents false positives
- Auto-learning creates feedback loop
- AI prompt includes parsed context (brand, specs, color, size)

**Weaknesses:**
- No variant selection (returns "Nike Air Max 90" but not size/color)
- Learning is file-based (JSON) - could race condition at scale
- High-confidence thresholds (0.92 for exact, 0.75 for learning) may be too strict

---

## Improvement Recommendations

### Priority 1: Confidence Calibration & Telemetry

**Problem:** Confidence thresholds are guesses. We have no data on actual success rates.

**Solution:**
1. Add telemetry events for identification outcomes
2. Track: stage reached, confidence returned, user acceptance, user correction
3. After 1000+ identifications, recalibrate thresholds based on acceptance rates

**Implementation:**
```typescript
// lib/analytics/identificationTelemetry.ts
interface IdentificationEvent {
  sessionId: string;
  inputType: 'url' | 'text';
  stageReached: string;
  confidenceReturned: number;
  userAction: 'accepted' | 'corrected' | 'manual_entry' | 'abandoned';
  correctedFields?: string[]; // ['brand', 'name', 'color']
  timeToDecisionMs: number;
}
```

**Effort:** 1-2 days
**Impact:** Data-driven threshold optimization

---

### Priority 2: User Correction Feedback Loop

**Problem:** When users correct an identification, the system doesn't learn.

**Solution:**
1. Track corrections with original identification
2. If same URL/text is identified again, factor in previous correction
3. Periodic review: patterns in corrections inform dictionary updates

**Implementation:**
- Add `corrections` table: URL hash + original + corrected + timestamp
- On new identification, check corrections table first
- Dashboard for reviewing common corrections

**Effort:** 2-3 days
**Impact:** System improves from every user interaction

---

### Priority 3: Graceful Partial Understanding

**Problem:** Binary success/failure feels jarring. Either it "gets it" or shows technical error.

**Solution:**
1. Always show what WAS understood, even in failure cases
2. Replace "AI identified" with confidence-appropriate messaging:
   - 0.90+: "Identified" (confident)
   - 0.75-0.89: "Best match" (uncertain but viable)
   - 0.50-0.74: "Possible match - verify details" (low confidence)
   - <0.50: "Manual entry recommended" (graceful decline)

**Implementation:**
- Update `AISuggestions.tsx` confidence badge logic
- Add partial result display: "We found: Brand + product type. What's the exact model?"
- Progressive disclosure rather than clarification questions

**Effort:** 1-2 days
**Impact:** Better UX, reduced user frustration

---

### Priority 4: Variant Selection Flow

**Problem:** System identifies "Nike Air Max 90" but user still needs to specify size 10.5, Black/White colorway.

**Solution:**
1. After product identification, offer variant selection step
2. Use identified product to fetch available variants from retailer
3. Pre-fill from URL if available (e.g., "/nike-air-max-90-black-white-10.5")

**Implementation:**
```
Identification → Product Match → Variant Selection (optional) → Add to Bag
                                 ↓
                    [Size: 10] [Color: Black/White]
                    [Skip - just add the product]
```

**Effort:** 3-4 days
**Impact:** More complete item data, better for comparison

---

### Priority 5: Cross-Category Spec Parity

**Problem:** Golf has 15+ spec patterns; fashion has 2-3.

**Current Coverage:**
- Golf: Loft, flex, shaft, hand, length, weight ✅
- Tennis: Grip size, string tension, head size ✅
- Cycling: Frame size, wheel size, groupset, speed ✅
- Audio: Impedance, driver size, frequency, wattage ✅
- Photography: Megapixels, focal length, aperture ✅
- Watches: Case size, water resistance, movement ✅
- Fitness: Weight, resistance level ✅
- **Fashion: Size only** ⚠️
- **Beauty: None** ⚠️

**Solution:**
1. Add fashion patterns: fit (slim, regular, relaxed), material, season
2. Add beauty patterns: shade, finish (matte, satin, glossy), size (full, mini, travel)
3. Add home patterns: dimensions, material, finish

**Effort:** 2-3 days
**Impact:** Better identification across all categories

---

### Priority 6: Library Learning Architecture

**Problem:** Current file-based learning can race condition and doesn't scale.

**Solution:**
1. Move product library to Supabase (already have `product_library` table for URL cache)
2. Add `learned_products` table for AI-learned items
3. Merge learned products with static library at query time

**Implementation:**
```sql
CREATE TABLE learned_products (
  id UUID PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  source TEXT, -- 'ai_enrichment', 'user_correction'
  confidence NUMERIC,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  occurrence_count INT DEFAULT 1,
  metadata JSONB
);
```

**Effort:** 3-4 days
**Impact:** Scalable learning, no race conditions, queryable analytics

---

### Priority 7: Clarification UX Redesign

**Problem:** Clarification questions feel like obligation.

**Current:**
```
🎯 Quick question to find better matches
Any brand preference?
[Nike] [Lululemon] [Travis Mathew] [Any]
                               [Skip]
```

**Doctrine Issue:** "Skip" implies you should answer. Obligation.

**Redesign:**
```
We found general results for "polo shirt"

💡 Want to narrow down?
   Brand: [Nike] [Lululemon] [Travis Mathew] [Show all brands...]

[See all results] ← Primary action
```

**Key Changes:**
- Primary action is "See all results" (no obligation)
- Narrowing is optional enhancement, not required step
- No "Skip" language - just proceed without narrowing

**Effort:** 1-2 days
**Impact:** Doctrine-aligned, reduced friction

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2) - COMPLETE
- [x] Add identification telemetry (`lib/analytics/identificationTelemetry.ts`, `/api/analytics/identification`)
- [x] Implement graceful partial understanding (confidence-based UI messaging in AISuggestions)
- [x] Redesign clarification UX (collapsible, "Want to narrow down?" vs obligation)

### Phase 2: Learning Loop (Week 3-4) - COMPLETE
- [x] User correction tracking (`lib/analytics/correctionTracking.ts`, `/api/analytics/corrections`)
- [x] Move learning to Supabase (`lib/productLibrary/learner.ts` → `learned_products` table)
- [x] Correction-aware re-identification (in `enrich-item/route.ts`)

### Phase 3: Completeness (Week 5-6) - PARTIAL
- [x] Variant selection flow (`ItemPreviewModal.tsx` - size/color selection)
- [x] Cross-category spec parity (added Fashion, Beauty, Home patterns)
- [ ] Threshold recalibration (based on telemetry - waiting for data)

### Phase 4: Analytics (Week 7+)
- [ ] Identification quality dashboard
- [ ] Common correction patterns report
- [ ] Category coverage gaps report

---

## Success Metrics

After 30 days:
- **Acceptance rate**: >80% of identifications accepted without correction
- **Correction rate**: <10% of identifications corrected
- **Abandonment rate**: <5% of identifications abandoned for manual entry
- **Stage distribution**: >50% resolved at Stage 0-1 (library/URL)

---

## Doctrine Compliance Checklist

Every improvement must pass:

- [ ] Does it reduce explanation friction?
- [ ] Does it increase trust?
- [ ] Does it preserve the sacred hierarchy? (Bags > Items > Links > Profile)
- [ ] Does it avoid obligation?
- [ ] Is it constructive dopamine only?
- [ ] Does it pass the "stale" test?

---

## Relationship to Pending Work

This plan connects to existing Tier 2 items in `PENDING_WORK.md`:

| This Plan | Pending Work Item |
|-----------|-------------------|
| Telemetry & Analytics | Prerequisite for 2.4 Intelligent Bag Organization |
| Variant Selection | Enables 2.1 Visual Similarity Search |
| Learning Architecture | Foundation for 2.2 Style Profile & Recommendations |
| Confidence Calibration | Improves all AI features |

---

## Not Doing / Out of Scope

To avoid scope creep, these are explicitly NOT part of this plan:

- Price tracking / price intelligence (Tier 2.3 - separate initiative)
- Visual similarity search (Tier 2.1 - requires vector DB)
- Trending / popular (Forbidden by doctrine)
- Activity dashboards (Forbidden by doctrine)
- Real-time notifications (Forbidden by doctrine)

---

*This plan prioritizes doctrine compliance and measurable improvements over feature expansion.*
