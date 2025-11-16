# Phase 6: AI Smart Enrichment Strategy

**Date**: 2025-11-15
**Status**: Planning
**Objective**: Use AI to intelligently enrich product details across all major verticals without schema complexity

---

## Core Philosophy

**Don't add columns for every vertical** - Instead, use AI to extract domain-specific details and populate existing free-text fields (description, notes) with rich, formatted metadata.

**Current Schema (Keep Simple)**:
```typescript
{
  custom_name: string           // "MAC Ruby Woo Lipstick"
  custom_description: string    // AI-enriched details go here
  notes: string                 // User notes + AI suggestions
  quantity: number              // Count
  promo_codes: string           // Discount codes
}
```

---

## Top 5 Supported Verticals

Based on research of popular "haul", "what's in my bag", and "tutorial" content:

### 1. **Beauty/Makeup** (59% of haul videos - Most Popular)

**What viewers care about:**
- Brand name (MAC, Maybelline, Charlotte Tilbury)
- Product type (lipstick, foundation, eyeshadow palette)
- Shade/color name ("Ruby Woo", "Velvet Teddy")
- Finish (matte, satin, glossy)
- Price point
- Why they bought it

**AI Enrichment Example:**
```
Input: "MAC lipstick"
AI enriches to:
  Name: "MAC Ruby Woo Lipstick"
  Description: "Retro matte finish | Classic blue-red shade | $19"
  Notes: "Perfect for bold, long-lasting color. Cult favorite for red lips."
```

---

### 2. **Golf Equipment** (WITB - What's In The Bag)

**What viewers care about:**
- Brand & model (Titleist TSR3, Callaway Rogue ST)
- Loft degrees (10.5°, 56° wedge)
- Shaft specs (Fujikura Ventus Black 6X, Project X)
- Flex (Stiff, X-Stiff, Regular)
- Ball selection (Pro V1, TP5)
- Grip type

**AI Enrichment Example:**
```
Input: "Titleist driver"
AI enriches to:
  Name: "Titleist TSR3 Driver"
  Description: "10.5° loft | Fujikura Ventus Black 6X shaft | Adjustable CG"
  Notes: "Tour-proven distance. Low spin for players seeking workability."
```

---

### 3. **Fashion/Clothing** (Second Most Popular)

**What viewers care about:**
- Brand name (Zara, Lululemon, Nike)
- Item type (crop top, midi skirt, sneakers)
- Size
- Color/pattern
- Price (especially if on sale)
- Where purchased

**AI Enrichment Example:**
```
Input: "Lululemon leggings"
AI enriches to:
  Name: "Lululemon Align High-Rise Leggings"
  Description: "Size 6 | Black | 25\" inseam | Nulu fabric"
  Notes: "Buttery soft, no pockets. Perfect for yoga and everyday wear. $98"
```

---

### 4. **Tech/EDC** (Everyday Carry)

**What viewers care about:**
- Brand & model (Apple AirPods Pro, Anker PowerCore)
- Storage/capacity (256GB, 20,000mAh)
- Key specs (battery life, connectivity)
- Use case (travel, work, daily carry)
- Price

**AI Enrichment Example:**
```
Input: "iPhone"
AI enriches to:
  Name: "iPhone 15 Pro Max"
  Description: "256GB | Natural Titanium | A17 Pro chip | USB-C"
  Notes: "All-day battery. Best camera system. Ideal for content creators."
```

---

### 5. **Outdoor/Camping Gear**

**What viewers care about:**
- Brand & model (Patagonia Nano Puff, Osprey Atmos)
- Weight (for backpacking)
- Temperature rating (sleeping bags)
- Capacity/size (pack volume, tent size)
- Material/tech (Gore-Tex, down fill)
- Season rating (3-season, winter)

**AI Enrichment Example:**
```
Input: "Patagonia jacket"
AI enriched to:
  Name: "Patagonia Nano Puff Jacket"
  Description: "60g PrimaLoft Gold insulation | Water-resistant | 12.6 oz"
  Notes: "Packable midlayer. Ideal for cold-weather hiking and everyday use."
```

---

## AI Enrichment Flow

### When User Adds Item:

**Option 1: Manual Entry (Suggestions First, Questions as Fallback)**
```
User types: "driver"
↓
AI generates 3-5 smart suggestions based on:
  - Input text
  - Bag context (if it's a golf bag, prioritize golf items)
  - Common items in that category
↓
Show suggestions:
  ✓ Titleist TSR3 Driver (Golf Equipment)
  ✓ Callaway Paradym Driver (Golf Equipment)
  ✓ Phillips Screwdriver Set (Tools)
  ✓ Generic Flash Drive (Tech)

  [None of these? Tell us more ↓]
↓
**Happy Path**: User clicks suggestion → Item added with enriched details ✅

**Fallback Path**: User clicks "None of these"
↓
Clarification UI expands below:
  Q1: "What type of driver?"
      [Golf club] [Screwdriver] [Computer hardware] [Other]

  User selects: "Golf club"
↓
  Q2: "Which brand?"
      [Titleist] [Callaway] [TaylorMade] [Ping] [Other]

  User selects: "Titleist"
↓
AI generates refined suggestions:
  ✓ Titleist TSR3 10.5° Driver
  ✓ Titleist TSR2 9° Driver
  ✓ Titleist TSi3 Driver
↓
User selects one → Item added ✅
```

**Option 2: Photo Upload**
```
User uploads photo of makeup haul
↓
AI identifies: "MAC Ruby Woo Lipstick"
↓
AI auto-enriches:
  Name: "MAC Ruby Woo Lipstick"
  Description: "Matte finish | Classic blue-red | $19"
  Notes: "Iconic shade, worn by celebrities worldwide"
```

**Option 3: Product URL Paste**
```
User pastes: "https://www.sephora.com/product/..."
↓
AI scrapes page
↓
AI enriches:
  Name: [From og:title]
  Description: [Key specs from product page]
  Notes: [Top review highlights]
```

---

## Implementation Strategy

### API Endpoint: `/api/ai/enrich-item`

**Input (Initial Request):**
```json
{
  "userInput": "driver",
  "bagContext": "golf",  // Optional: from bag title/existing items
  "existingAnswers": {}  // Empty on first call
}
```

**Output (Suggestions First):**
```json
{
  "suggestions": [
    {
      "custom_name": "Titleist TSR3 Driver",
      "custom_description": "10.5° loft | Fujikura Ventus Black 6X shaft | Adjustable CG",
      "notes": "Tour-proven distance with low spin for workability",
      "category": "Golf Equipment",
      "confidence": 0.85
    },
    {
      "custom_name": "Callaway Paradym Driver",
      "custom_description": "9° loft | Project X HZRDUS shaft | Carbon chassis",
      "notes": "Maximized ball speed and forgiveness",
      "category": "Golf Equipment",
      "confidence": 0.80
    },
    {
      "custom_name": "Phillips Screwdriver Set",
      "custom_description": "6-piece set | Cushion grip | Chrome-vanadium steel",
      "notes": "Essential tool kit for home repairs",
      "category": "Tools",
      "confidence": 0.40
    }
  ],
  "clarificationNeeded": true,  // If confidence < 0.9 on top suggestion
  "questions": [
    {
      "id": "type",
      "question": "What type of driver?",
      "options": ["Golf club", "Screwdriver", "Computer hardware", "Other"]
    }
  ]
}
```

**Input (After User Answers):**
```json
{
  "userInput": "driver",
  "bagContext": "golf",
  "existingAnswers": {
    "type": "Golf club",
    "brand": "Titleist"
  }
}
```

**Output (Refined Suggestions):**
```json
{
  "suggestions": [
    {
      "custom_name": "Titleist TSR3 Driver",
      "custom_description": "10.5° loft | Fujikura Ventus Black 6X shaft",
      "notes": "Tour-proven distance with low spin",
      "category": "Golf Equipment",
      "confidence": 0.95
    },
    {
      "custom_name": "Titleist TSR2 Driver",
      "custom_description": "9° loft | Mid-launch, mid-spin profile",
      "notes": "High MOI for maximum forgiveness",
      "category": "Golf Equipment",
      "confidence": 0.92
    }
  ],
  "clarificationNeeded": false,  // High confidence now
  "questions": []
}
```

---

## GPT Prompt Strategy

### System Prompt:
```
You are a product detail enrichment assistant for Teed, an app that helps users catalog their belongings.

Your job is to:
1. Detect the product vertical (makeup, golf, fashion, tech, outdoor)
2. Extract or infer domain-specific details
3. Format details into structured fields WITHOUT creating new database columns
4. Populate: custom_name, custom_description, and notes

Guidelines:
- custom_name: Brand + Product Name (concise, 2-6 words)
- custom_description: Key specs formatted as "Spec 1 | Spec 2 | Spec 3"
- notes: Why this matters, use case, or helpful context

Be specific but concise. Use vertical-specific terminology.

Examples:
- Makeup: "Shade | Finish | Price"
- Golf: "Loft | Shaft | Specs"
- Fashion: "Size | Color | Material"
- Tech: "Storage | Key Feature | Connectivity"
- Outdoor: "Weight | Rating | Material"
```

### User Prompt Template:
```
Product input: "{userInput}"
Vertical: "{detectedVertical}"
Additional context: "{userAnswers}"

Generate enriched product details.
```

---

## Clarification Question Logic

### When to Ask Questions:
1. **Ambiguous input** - "driver" could be golf club or screwdriver
2. **Generic brand** - "Nike" could be shoes, clothing, bags
3. **Low confidence** - AI isn't sure what the product is

### Max Questions: 2
- Question 1: Clarify category/type
- Question 2: Clarify brand or key spec

### Progressive Disclosure:
- If input is clear ("Titleist TSR3 driver"), skip questions
- If input is vague ("lip stuff"), ask 1-2 questions
- Never ask more than 2 questions

---

## Category Detection

Use bag context + item patterns to detect vertical:

**Golf Bag Keywords:**
- driver, putter, irons, wedge, hybrid, ball, tee, glove

**Makeup Bag Keywords:**
- lipstick, foundation, mascara, eyeshadow, blush, palette

**Fashion Keywords:**
- shirt, pants, dress, shoes, sneakers, jacket, hoodie

**Tech/EDC Keywords:**
- phone, laptop, charger, AirPods, power bank, mouse

**Outdoor Keywords:**
- tent, sleeping bag, backpack, jacket, boots, stove

---

## User Experience

### Flow 1: Clear Input (Instant Match)
```
User: Types 'Ruby Woo' in makeup bag
→ AI: Shows top suggestion - "MAC Ruby Woo Lipstick"
→ User: Clicks suggestion
→ Item added with enriched details ✅
```

### Flow 2: Ambiguous Input (Suggestions + Fallback)
```
User: Types 'driver' in golf bag
→ AI: Shows 4 suggestions (3 golf drivers, 1 tool)
→ User: Sees their club isn't listed
→ User: Clicks "None of these? Tell us more ↓"
→ Clarification UI expands:
   Q: "Which brand?"
   Options: [Titleist] [Callaway] [TaylorMade] [Ping]
→ User: Selects "Titleist"
→ AI: Shows refined Titleist driver suggestions
→ User: Clicks "Titleist TSR3 Driver"
→ Item added ✅
```

### Flow 3: Quick Override
```
User: Sees AI suggestion
→ Clicks suggestion to add item
→ Later: Clicks "Edit" on item card
→ Modifies description or notes
→ Saves custom version
```

### Flow 4: Skip AI Entirely
```
User: Types item name
→ Ignores AI suggestions
→ Clicks "Add Manually" button
→ Fills in all fields themselves
→ Saves
```

---

## Benefits of This Approach

1. **No Schema Bloat** - Existing fields handle all verticals
2. **Flexible** - Works for any niche (makeup, golf, travel, etc.)
3. **User-Friendly** - AI does the work, users just review
4. **Future-Proof** - New verticals (photography, gaming) work automatically
5. **Search-Friendly** - Rich descriptions improve discoverability

---

## Testing Plan

### Test Each Vertical:

**Makeup:**
- "MAC lipstick" → Enriches with shade, finish
- "foundation" → Asks for brand, then enriches with coverage type

**Golf:**
- "driver" → Asks for brand, then enriches with loft, shaft
- "Titleist putter" → Auto-enriches with model, length

**Fashion:**
- "Lululemon leggings" → Auto-enriches with size, color, inseam
- "sneakers" → Asks for brand, then enriches with model

**Tech:**
- "iPhone" → Auto-enriches with model, storage, color
- "power bank" → Asks for brand, then enriches with capacity

**Outdoor:**
- "Patagonia jacket" → Auto-enriches with insulation, weight
- "tent" → Asks for brand, then enriches with capacity, season rating

---

## Success Metrics

- **Clarity**: 90%+ of items have meaningful descriptions
- **Speed**: Enrichment happens in <2 seconds
- **Accuracy**: 85%+ of AI suggestions are accepted without edits
- **Versatility**: Works across all 5 major verticals

---

## Next Steps

1. Build `/api/ai/enrich-item` endpoint
2. Create conversational UI for clarification questions
3. Test with real products from each vertical
4. Integrate into existing "Add Item" flow
5. Add "Enrich with AI" button for existing items
