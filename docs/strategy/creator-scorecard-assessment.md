# Creator Scorecard Assessment: Strategic Plan

## "How Organized Is Your Gear Ecosystem?"

*A Daniel Priestley-Inspired Signal Generation System for Teed*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Question Design](#question-design)
5. [Scoring Methodology](#scoring-methodology)
6. [Results Experience](#results-experience)
7. [Lead Nurture Strategy](#lead-nurture-strategy)
8. [Technical Implementation](#technical-implementation)
9. [Success Metrics](#success-metrics)
10. [A/B Testing Strategy](#ab-testing-strategy)
11. [Risk Assessment](#risk-assessment)
12. [Advisory Board Evaluation](#advisory-board-evaluation)

---

## Executive Summary

### The Opportunity

Teed has a cold-start problem: creators with gear scattered across YouTube descriptions, Amazon lists, and Notion docs do not know they need a canonical reference system. Their desire to organize is **dormant, not active**.

The Creator Scorecard Assessment activates this dormant desire by providing immediate value (a personalized score and insights) while generating signals of interest before asking for commitment.

### The Model

Based on Daniel Priestley's Scorecard Marketing framework, this assessment:

1. **Educates** prospects about the problem (gear chaos costs money and credibility)
2. **Diagnoses** their specific situation across four dimensions
3. **Prescribes** a personalized path forward
4. **Signals** genuine interest without pressure to buy

### Expected Outcomes

| Metric | Industry Benchmark | Our Target |
|--------|-------------------|------------|
| Completion Rate | 50-70% | 75%+ |
| Email Capture Rate | 28.6% | 40%+ |
| Lead-to-Signup Conversion | 5-10% | 15%+ |
| Viral Share Rate | 10-15% | 25%+ |

### Investment Required

- **Development**: 3-4 weeks (quiz engine, results system, email integration)
- **Content**: 2 weeks (question refinement, results copy, email sequences)
- **Design**: 1 week (premium, brand-aligned experience)

---

## Problem Statement

### Why Assessments Work for Lead Generation

Traditional lead generation asks for commitment before providing value. This creates friction because:

1. **The prospect doesn't know they have a problem** (dormant desire)
2. **Asking for email feels transactional** (no reciprocity established)
3. **Generic messaging doesn't resonate** (one-size-fits-none)

Scorecard assessments invert this model:

> "People buy to resolve tension. Great brands manufacture dormant desires."
> — Daniel Priestley

### The Psychology at Play

| Principle | How It Works | Application |
|-----------|--------------|-------------|
| **Curiosity Gap** | Humans are driven to close knowledge gaps about themselves | "What's YOUR gear organization score?" |
| **Self-Assessment Motive** | People want accurate evaluation of their abilities | Score provides objective measure |
| **Self-Enhancement Motive** | People want to improve their self-concept | Results show path to improvement |
| **Cognitive Commitment** | Time investment creates psychological momentum | 3 minutes answering = emotional investment |
| **Reciprocity** | Value received triggers desire to reciprocate | Free insights = willingness to share email |
| **Social Proof** | Comparison to others validates self-perception | "You're in the top 20% of organized creators" |

### The Specific Problem for Creators

Creators with gear face four interconnected challenges:

1. **Organization Chaos** — Gear lists scattered across platforms, outdated, duplicated
2. **Sharing Friction** — "What do you use?" requires re-explanation every time
3. **Monetization Leakage** — Broken affiliate links, no tracking, lost commissions
4. **Documentation Gaps** — No system for capturing context, notes, or history

Most creators don't realize these problems cost them real money and credibility. The assessment makes the invisible visible.

---

## Solution Overview

### Quiz Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                              │
├─────────────────────────────────────────────────────────────────┤
│  • Landing page: teed.so/assessment                              │
│  • Blog posts: "5 Signs Your Gear Setup Needs Work"             │
│  • Social: "What's your gear score? Take the 3-min quiz"        │
│  • Partner embeds: YouTube creator newsletters                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HOOK SCREEN (Q0)                             │
├─────────────────────────────────────────────────────────────────┤
│  "How Organized Is Your Gear Ecosystem?"                         │
│                                                                  │
│  Discover where you stand — and what's possible.                │
│                                                                  │
│  Takes ~3 minutes. Get your personalized scorecard.             │
│                                                                  │
│  [Start Assessment →]                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTIONS (Q1-Q12)                            │
├─────────────────────────────────────────────────────────────────┤
│  4 Categories × 3 Questions Each = 12 Questions                 │
│                                                                  │
│  • Organization (Q1-Q3)                                          │
│  • Sharing (Q4-Q6)                                               │
│  • Monetization (Q7-Q9)                                          │
│  • Documentation (Q10-Q12)                                       │
│                                                                  │
│  Progress bar shows completion                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EMAIL CAPTURE (After Q6)                       │
├─────────────────────────────────────────────────────────────────┤
│  "You're halfway there! Get your full scorecard by email."      │
│                                                                  │
│  [Email input]                                                   │
│                                                                  │
│  Or [Continue without email →] (smaller, secondary)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESULTS SCREEN                                │
├─────────────────────────────────────────────────────────────────┤
│  Overall Score: 67/100                                           │
│  Category Breakdown (visual radar chart)                         │
│  Persona Assignment: "The Aspiring Organizer"                    │
│  Top 3 Recommendations                                           │
│  Comparison to benchmarks                                        │
│  CTA: "Start Your Free Teed Account" or "Share Your Score"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FOLLOW-UP SEQUENCE                            │
├─────────────────────────────────────────────────────────────────┤
│  Day 0: Full scorecard PDF + detailed recommendations            │
│  Day 2: Case study of creator who improved their score           │
│  Day 5: "Your biggest opportunity" deep dive                     │
│  Day 10: Soft CTA to try Teed (personalized to weak area)        │
│  Day 21: Re-engagement or archive                                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **12 Questions (Not 7, Not 20)**
   - Research shows 8-15 questions maintain 45-65% completion
   - 12 divides evenly into 4 categories for clean scoring
   - Enough depth for meaningful segmentation, not so long it exhausts

2. **Email Capture at Question 6 (Not Start, Not End)**
   - Building investment before asking for commitment increases conversion by 40%
   - "Halfway there" creates natural pause point
   - Skip option respects autonomy (Li Jin lens)

3. **Persona-Based Results (Not Just Score)**
   - "The Gear Chaos Creator" is more memorable than "Score: 34"
   - Personas enable segmented nurture paths
   - Shareability increases with identity-based results

4. **Positive Framing Throughout**
   - Every result emphasizes potential, not deficiency
   - "You're in the top 30% for documentation!" (even if weak elsewhere)
   - Optimism drives shares; shame kills them

---

## Question Design

### Category 1: Organization (Weight: 30%)

**Rationale**: Organization is the foundation. Without it, sharing, monetization, and documentation are impossible. Weighted highest because it's the entry point to Teed's value proposition.

---

**Q1: Where does your gear information currently live?**

*Assesses: Fragmentation level*

| Answer | Points | Insight |
|--------|--------|---------|
| A) One central system I maintain | 10 | Already organized; needs efficiency gains |
| B) A few places (Amazon list + notes app) | 6 | Common pattern; consolidation opportunity |
| C) Scattered across many platforms | 3 | High pain; ready for solution |
| D) Mostly in my head | 1 | Maximum friction; needs education first |

**Why This Question**: Establishes baseline and segments intent. "Scattered" users are prime conversion targets.

---

**Q2: When someone asks "What camera do you use?", how do you typically respond?**

*Assesses: Sharing friction*

| Answer | Points | Insight |
|--------|--------|---------|
| A) I send them a single link with everything | 10 | Already has system; may want to upgrade |
| B) I type out a quick list | 5 | Moderate friction; time cost hidden |
| C) I point them to my YouTube description | 4 | Platform-dependent; fragile |
| D) I dig through old messages to find it | 1 | Maximum pain point |

**Why This Question**: Reveals real-world friction. The "dig through old messages" answer resonates deeply with chaotic creators.

---

**Q3: How often do you update your gear lists or recommendations?**

*Assesses: Maintenance burden*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Automatically when I add something new | 10 | Systematic; rare |
| B) Whenever I remember (inconsistently) | 5 | Normal; guilt-prone |
| C) Only when someone points out it's outdated | 3 | Reactive; embarrassment risk |
| D) I don't — they're probably stale | 1 | Maximum debt; ready for change |

**Why This Question**: Activates latent anxiety about stale content. Creates "I should fix this" energy.

---

### Category 2: Sharing (Weight: 25%)

**Rationale**: Sharing is how creators multiply their reach. Teed's embed and export features directly solve sharing friction.

---

**Q4: When you want to share your gear setup, what format do you use?**

*Assesses: Current sharing workflow*

| Answer | Points | Insight |
|--------|--------|---------|
| A) A dedicated page or embed on my site | 10 | Sophisticated; feature-aware |
| B) A link tree or similar tool | 6 | Knows the category; may not know Teed |
| C) Just a list in a comment or DM | 3 | Manual; time cost |
| D) I don't share proactively — only when asked | 1 | Passive; leaving value on table |

**Why This Question**: Identifies sophistication level and current competitive tools.

---

**Q5: Can your audience currently find your gear recommendations on your own platform (site, newsletter)?**

*Assesses: Owned platform presence*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Yes, it's prominently featured | 10 | Ownership-minded |
| B) Buried somewhere, probably | 5 | Opportunity to elevate |
| C) Only on social platforms (YouTube, Instagram) | 3 | Platform-dependent; risky |
| D) No, they'd have to ask me directly | 1 | Missing owned touchpoint |

**Why This Question**: Li Jin alignment — owned platforms vs. rented. Creates awareness of platform dependency risk.

---

**Q6: How many different platforms would someone need to visit to see all your gear?**

*Assesses: Fragmentation across channels*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Just one — I have a canonical source | 10 | Ideal state |
| B) 2-3 platforms | 6 | Manageable but inefficient |
| C) 4-6 platforms | 3 | Significant fragmentation |
| D) More than 6, or I'm not sure | 1 | Chaos; strong need |

**Why This Question**: Maps directly to Daniel Priestley's 7-11-4 rule. More platforms = more friction = more need for canonical source.

---

### Category 3: Monetization (Weight: 25%)

**Rationale**: Monetization is the financial proof point. Broken links and missing affiliates cost real money.

---

**Q7: Do you use affiliate links for the gear you recommend?**

*Assesses: Monetization awareness*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Yes, consistently across all platforms | 10 | Sophisticated; maximizing |
| B) Yes, but only on some platforms | 6 | Inconsistent; leaving money |
| C) Sometimes, when I remember | 3 | Ad hoc; optimization opportunity |
| D) No, I haven't set that up | 1 | Education needed |

**Why This Question**: Identifies monetization sophistication and readiness for Teed's link management.

---

**Q8: How confident are you that your affiliate links are all working and current?**

*Assesses: Link maintenance*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Very confident — I audit regularly | 10 | Rare; systematic |
| B) Somewhat confident — I check occasionally | 5 | Normal; anxiety lurking |
| C) Not very confident — probably some broken ones | 3 | Admitted debt |
| D) No idea — I've never checked | 1 | Hidden money loss |

**Why This Question**: Activates loss aversion. "Probably some broken ones" = real dollars lost.

---

**Q9: Do you track how much affiliate revenue your gear recommendations generate?**

*Assesses: Analytics sophistication*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Yes, I know exactly what each item earns | 10 | Data-driven; advanced |
| B) I see totals but not per-item | 5 | Partial visibility |
| C) I occasionally check, no system | 3 | Ad hoc |
| D) No tracking at all | 1 | Blind spot |

**Why This Question**: Creates awareness of analytics opportunity. Future Teed feature hook.

---

### Category 4: Documentation (Weight: 20%)

**Rationale**: Documentation is the long-term value multiplier. Context notes, history, and reasoning create authority.

---

**Q10: Do you document WHY you chose specific gear (not just WHAT you use)?**

*Assesses: Context depth*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Yes, detailed notes for each item | 10 | Authority builder |
| B) For major items, not everything | 6 | Selective; could expand |
| C) Rarely — just the product itself | 3 | Missing authority layer |
| D) No, just links | 1 | Commodity, not curator |

**Why This Question**: Differentiates between "list-makers" and "curators." Teed enables curator identity.

---

**Q11: If you changed your main camera tomorrow, how easily could you update everywhere it's mentioned?**

*Assesses: Update propagation*

| Answer | Points | Insight |
|--------|--------|---------|
| A) One update would propagate everywhere | 10 | Canonical source exists |
| B) I'd need to update 2-3 places manually | 6 | Manageable but inefficient |
| C) I'd need to hunt down all the places | 3 | High friction |
| D) I probably wouldn't bother updating | 1 | Stale content inevitable |

**Why This Question**: Concrete scenario that reveals system quality. "Hunt down all the places" creates visceral frustration.

---

**Q12: Do you keep a history of gear you've used in the past (not just current setup)?**

*Assesses: Historical context*

| Answer | Points | Insight |
|--------|--------|---------|
| A) Yes, organized by time period or project | 10 | Archivist mindset |
| B) Some of it, informally | 5 | Partial records |
| C) No, just current gear | 3 | Present-only |
| D) I've forgotten most of what I used before | 1 | Lost context |

**Why This Question**: Reveals opportunity for bag versioning and timeline features.

---

## Scoring Methodology

### Raw Score Calculation

```
Total Points = (Org × 0.30) + (Sharing × 0.25) + (Monetization × 0.25) + (Documentation × 0.20)

Where each category = sum of 3 question scores (max 30 each)
```

### Normalization

```
Normalized Score = (Total Points / 120) × 100

Result: 0-100 scale
```

### Category Scoring

Each category also generates an individual score (0-100) for the radar chart:

```
Category Score = (Category Points / 30) × 100
```

### Persona Assignment

Based on overall score and category distribution:

| Score Range | Persona | Description |
|-------------|---------|-------------|
| 85-100 | **The Gear Architect** | Systematized, optimized, ready to inspire others |
| 70-84 | **The Organized Creator** | Solid foundation, room for optimization |
| 50-69 | **The Aspiring Organizer** | Good intentions, inconsistent execution |
| 30-49 | **The Gear Chaos Creator** | Scattered but aware; ready for change |
| 0-29 | **The Fresh Start** | Maximum opportunity; everything to gain |

### Secondary Personas (Category-Specific)

If one category is significantly weaker (>20 points below average), assign a secondary persona:

| Weak Category | Secondary Persona |
|---------------|-------------------|
| Organization | "The Scattered Collector" |
| Sharing | "The Hidden Curator" |
| Monetization | "The Value Leaker" |
| Documentation | "The Context Minimalist" |

---

## Results Experience

### Results Page Structure

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]                                            [Share ↗]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Your Gear Ecosystem Score                                     │
│                                                                │
│          ┌──────────┐                                          │
│          │   67     │  ← Large, prominent                      │
│          │  /100    │                                          │
│          └──────────┘                                          │
│                                                                │
│  "The Aspiring Organizer"                                      │
│                                                                │
│  You've got the instinct for great gear curation. A few        │
│  system upgrades will turn scattered expertise into a          │
│  streamlined, revenue-generating asset.                        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  YOUR BREAKDOWN                                                │
│                                                                │
│         Organization                                           │
│            ●●●●●●●○○○ 70                                       │
│                                                                │
│           Sharing                                              │
│            ●●●●●●○○○○ 60                                       │
│                                                                │
│        Monetization                                            │
│            ●●●●●●●●○○ 80                                       │
│                                                                │
│       Documentation                                            │
│            ●●●●●○○○○○ 50                                       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  YOUR TOP OPPORTUNITIES                                        │
│                                                                │
│  1. Documentation is your biggest growth area                  │
│     Adding context notes to your gear recommendations          │
│     builds authority and trust with your audience.             │
│                                                                │
│  2. You're strong in Monetization — protect it                 │
│     Your affiliate setup is working. Centralize to prevent     │
│     link rot as you scale.                                     │
│                                                                │
│  3. Sharing could 2x your reach                                │
│     A single canonical source means every platform update      │
│     is automatic.                                              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  HOW YOU COMPARE                                               │
│                                                                │
│  You scored higher than 62% of creators who took this          │
│  assessment. Your Monetization score is in the top 20%.        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  READY TO IMPROVE YOUR SCORE?                                  │
│                                                                │
│  Teed is the canonical home for your gear. Create bags,        │
│  attach affiliate links, embed anywhere, and update once.      │
│                                                                │
│  [Create Your Free Teed Account]     [Share Your Score]        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  © Teed — The Canonical Gear Reference                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Key Elements

1. **Prominent Score** — Immediate gratification; shareable number
2. **Persona Name** — Identity-based result; memorable
3. **Affirming Description** — Positive framing; focuses on potential
4. **Visual Breakdown** — Radar/bar chart; quick category scan
5. **Top Opportunities** — Personalized recommendations; actionable
6. **Benchmark Comparison** — Social proof; validates investment
7. **Dual CTAs** — Primary (signup) + Secondary (share)

### Share Mechanics

**Share Image Generation (Dynamic OG Image)**

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  My Gear Ecosystem Score: 67/100                               │
│                                                                │
│  "The Aspiring Organizer"                                      │
│                                                                │
│  Take the quiz → teed.so/assessment                            │
│                                                                │
│                                          [Teed logo]           │
└────────────────────────────────────────────────────────────────┘
```

**Share Text Presets**:

- Twitter: "I scored 67/100 on the Gear Ecosystem Assessment — 'The Aspiring Organizer.' How organized is YOUR gear? teed.so/assessment"
- LinkedIn: "Just took the Creator Gear Ecosystem Assessment and scored in the top 38%. Interesting insights about where I'm leaving money on the table with affiliate links. Check your score: teed.so/assessment"

---

## Lead Nurture Strategy

### Segmentation Framework

Based on assessment results, leads are segmented into paths:

| Segment | Criteria | Priority | Nurture Goal |
|---------|----------|----------|--------------|
| **Hot** | Score 30-49 + Email provided | 1 | Convert within 14 days |
| **Warm** | Score 50-69 + Email provided | 2 | Educate, convert within 30 days |
| **Cool** | Score 70+ + Email provided | 3 | Position as upgrade; long-term |
| **Cold** | No email provided | 4 | Retarget with content |

### Email Sequence: Hot Segment (Score 30-49)

**Day 0: Immediate Scorecard Delivery**

Subject: "Your Gear Ecosystem Scorecard (67/100)"

```
Hi [Name],

Your full scorecard is attached — including the detailed
breakdown we couldn't fit on the results page.

Your biggest opportunity: [Weakest Category]

One stat that might sting: Creators with scattered gear
setups lose an estimated $200-500/month in missed affiliate
revenue from broken or missing links.

The good news? You're already aware. That puts you ahead
of most.

Tomorrow, I'll share a 5-minute fix for your weakest area.

— The Teed Team

P.S. Your score puts you in the "Aspiring Organizer" tier.
That means you've got the instincts — you just need the system.
```

**Day 2: Quick Win for Weakest Category**

Subject: "The 5-minute fix for [Weakest Category]"

```
Hi [Name],

Your assessment showed [Weakest Category] as your biggest
opportunity. Here's the simplest fix:

[Category-specific quick win]

• If Organization: Create one master list (anywhere) and
  link to it from everywhere else. Canonical source >
  multiple copies.

• If Sharing: Add your gear page link to your email
  signature and one social bio. That's two new touchpoints
  without extra work.

• If Monetization: Audit your top 5 recommended products.
  Are the affiliate links current? Check one per day this week.

• If Documentation: For your next gear mention, add one
  sentence about WHY. "I use the Sony A7IV because..."
  That's context. Context builds trust.

Small moves compound.

— The Teed Team
```

**Day 5: Case Study**

Subject: "How [Creator Name] went from 42 to 89"

```
Hi [Name],

Meet [Creator Name], a [niche] creator with 50K subscribers.

Their score 6 months ago: 42/100 ("Gear Chaos Creator")
Their score today: 89/100 ("Gear Architect")

What changed:

1. Consolidated 7 scattered lists into one Teed profile
2. Added context notes to their top 20 items
3. Updated affiliate links once — propagated everywhere
4. Embedded their gear page in YouTube descriptions

Result:
• 3 hours/month saved on gear questions
• $340/month increase in affiliate revenue (tracked)
• "My gear page" became a selling point in sponsorship pitches

"I didn't realize how much friction I was creating for
my own audience." — [Creator Name]

[See their public Teed profile →]

— The Teed Team
```

**Day 10: Personalized CTA**

Subject: "Your [Weakest Category] score could hit 90 by next month"

```
Hi [Name],

Quick math based on your assessment:

Your current [Weakest Category] score: [Score]/100

If you implemented the system we use at Teed, that score
jumps to ~85-95 within 30 days. Here's why:

[Category-specific explanation of Teed feature]

• Organization: One canonical source that updates everywhere
• Sharing: Embeds, exports, and QR codes from a single bag
• Monetization: Centralized affiliate links with automatic
  propagation
• Documentation: Notes, hero items, and context attached
  to each piece of gear

No pressure. Your current setup works. But if the friction
ever becomes too much, Teed is free to start.

[Create Your First Bag →]

— The Teed Team

P.S. Reply to this email with any questions. Real humans
read these.
```

**Day 21: Archive or Re-engage**

Subject: "Still thinking about your gear setup?"

```
Hi [Name],

It's been a few weeks since your assessment.

If you've already solved your [Weakest Category] challenge
another way — great. We'll stop emailing about it.

If it's still on your mind, here's a thought:

The best time to organize is when you have momentum.
The second-best time is when you're tired of the chaos.

Whenever you're ready: [teed.so/signup]

Either way, I'll check back in 60 days with updated
resources.

— The Teed Team
```

### Email Sequence: Warm Segment (Score 50-69)

Similar structure but:
- Emphasize optimization over crisis
- Focus on "level up" language rather than "fix"
- Highlight advanced features (embeds, exports, RSS)
- Longer timeline (21 days to soft CTA)

### Email Sequence: Cool Segment (Score 70+)

- Position Teed as efficiency upgrade, not solution to problem
- Emphasize time savings and professional polish
- Highlight "10% improvement" rather than transformation
- Nurture over 60 days with content, not conversion pressure

### Re-Engagement Tactics

**For Non-Converters (60+ days)**:

1. **Quarterly "Retake" Prompt**: "Has your gear ecosystem improved? Retake the assessment."
2. **Feature Announcement**: "New: Teed now does [feature]. Your [Weakest Category] score just got easier to improve."
3. **Content Marketing**: Gear organization tips blog posts (not sales-focused)

---

## Technical Implementation

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js pages: /assessment, /assessment/results              │
│  • React state for quiz progression                              │
│  • Framer Motion for transitions                                 │
│  • Dynamic OG image generation for share                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  • API route: POST /api/assessment/submit                        │
│  • Scoring engine (server-side)                                  │
│  • Persona assignment logic                                      │
│  • Lead record creation in Supabase                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  New tables:                                                     │
│  • assessment_leads (id, email, score, persona, category_scores, │
│                      answers, utm_source, created_at)            │
│  • assessment_events (id, lead_id, event_type, metadata,         │
│                       created_at)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL INTEGRATION                            │
├─────────────────────────────────────────────────────────────────┤
│  • Webhook to email provider (Resend, Loops, or ConvertKit)     │
│  • Segmentation tags based on persona + score range             │
│  • Automated sequence triggers                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Assessment leads table
CREATE TABLE assessment_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  score INTEGER NOT NULL,
  persona TEXT NOT NULL,
  category_scores JSONB NOT NULL,
  -- { organization: 70, sharing: 60, monetization: 80, documentation: 50 }
  answers JSONB NOT NULL,
  -- { q1: "B", q2: "C", ... }
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_country TEXT,
  converted_to_user BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment events (for funnel analysis)
CREATE TABLE assessment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  -- 'started', 'q1_answered', 'email_captured', 'completed', 'shared'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_leads_email ON assessment_leads(email);
CREATE INDEX idx_assessment_leads_persona ON assessment_leads(persona);
CREATE INDEX idx_assessment_leads_score ON assessment_leads(score);
CREATE INDEX idx_assessment_events_session ON assessment_events(session_id);
```

### API Endpoints

```typescript
// POST /api/assessment/submit
interface AssessmentSubmission {
  answers: Record<string, string>; // { q1: "B", q2: "C", ... }
  email?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface AssessmentResult {
  score: number;
  persona: string;
  categoryScores: {
    organization: number;
    sharing: number;
    monetization: number;
    documentation: number;
  };
  recommendations: string[];
  percentile: number;
  shareUrl: string;
  shareImageUrl: string;
}

// GET /api/assessment/results/[id]
// Returns cached result for sharing

// POST /api/assessment/events
// Logs funnel events
interface AssessmentEvent {
  sessionId: string;
  eventType: 'started' | 'question_answered' | 'email_captured' | 'completed' | 'shared';
  metadata?: Record<string, unknown>;
}
```

### Frontend Components

```
/app/assessment/
├── page.tsx              # Quiz container
├── components/
│   ├── QuizProgress.tsx  # Progress bar
│   ├── QuizQuestion.tsx  # Single question display
│   ├── EmailCapture.tsx  # Mid-quiz email gate
│   ├── ResultsPage.tsx   # Full results display
│   ├── ScoreCard.tsx     # Visual score component
│   ├── RadarChart.tsx    # Category breakdown
│   └── ShareButtons.tsx  # Social sharing
└── lib/
    ├── scoring.ts        # Score calculation logic
    ├── personas.ts       # Persona assignment
    └── questions.ts      # Question definitions
```

### Performance Requirements

| Metric | Target |
|--------|--------|
| Quiz load time | <1s |
| Question transition | <200ms |
| Results calculation | <500ms |
| OG image generation | <2s |

---

## Success Metrics

### Primary KPIs

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Start Rate** | Visitors who begin quiz / Landing page visitors | 35%+ | Analytics |
| **Completion Rate** | Completions / Starts | 75%+ | Database |
| **Email Capture Rate** | Emails captured / Completions | 40%+ | Database |
| **Share Rate** | Shares / Completions | 25%+ | Event tracking |
| **Lead-to-Signup** | New users / Leads (30 days) | 15%+ | Database |

### Secondary KPIs

| Metric | Definition | Target |
|--------|------------|--------|
| Question drop-off | Per-question abandonment | <5% per Q |
| Email skip rate | Skips / Email prompts | <60% |
| Time to complete | Median quiz duration | 2.5-4 min |
| Result page dwell | Time on results page | >45 sec |
| CTA click rate | CTA clicks / Completions | 20%+ |

### Cohort Analysis

Track 30/60/90-day conversion rates by:
- Score range (0-29, 30-49, 50-69, 70-84, 85-100)
- Persona type
- Weakest category
- Traffic source
- Email captured vs. not

### Benchmarking

Compare to industry benchmarks:

| Metric | Industry Average | Our Target |
|--------|-----------------|------------|
| Quiz completion | 50-70% | 75%+ |
| Email capture (mid-quiz) | 28% | 40%+ |
| Lead-to-customer (SaaS) | 5-10% | 15%+ |

---

## A/B Testing Strategy

### Phase 1: Launch Optimization (Weeks 1-4)

**Test 1: Quiz Title**
- Control: "How Organized Is Your Gear Ecosystem?"
- Variant A: "What's Your Gear Setup Score?"
- Variant B: "The 3-Minute Gear Audit"
- Metric: Start rate

**Test 2: Email Capture Timing**
- Control: After Question 6
- Variant A: After Question 4
- Variant B: After Question 9
- Metric: Email capture rate vs. completion rate (balance)

**Test 3: Email Capture Copy**
- Control: "Get your full scorecard by email"
- Variant A: "Unlock your personalized recommendations"
- Variant B: "Save your results for later"
- Metric: Email capture rate

### Phase 2: Conversion Optimization (Weeks 5-8)

**Test 4: Results Page CTA**
- Control: "Create Your Free Teed Account"
- Variant A: "Start Your First Bag Free"
- Variant B: "Import Your Existing Gear"
- Metric: CTA click rate

**Test 5: Social Proof on Results**
- Control: Percentile only ("Top 38%")
- Variant A: Add "Join 2,000+ creators who've improved their score"
- Variant B: Add testimonial from high scorer
- Metric: CTA click rate

**Test 6: Share Prompt**
- Control: Secondary button on results
- Variant A: Modal after 10 seconds on results
- Variant B: "Unlock bonus insights by sharing"
- Metric: Share rate

### Phase 3: Email Optimization (Weeks 9-12)

**Test 7: Day 0 Email Subject**
- Test 5 subject line variants
- Metric: Open rate, click rate

**Test 8: Email Sequence Length**
- Control: 5 emails over 21 days
- Variant: 3 emails over 14 days
- Metric: Unsubscribe rate vs. conversion rate

**Test 9: Personalization Depth**
- Control: Segment by score range only
- Variant: Segment by weakest category
- Metric: Conversion rate

### Testing Framework

```
Minimum sample size: 200 per variant
Statistical significance: 95%
Minimum detectable effect: 10%
Test duration: 7-14 days (or until significance)
```

---

## Risk Assessment

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low completion rate | Medium | High | A/B test question count; gamification |
| Low email capture | Medium | High | Test capture timing and copy |
| Poor lead quality | Low | High | Score-based segmentation; nurture |
| High unsubscribe | Medium | Medium | Value-first emails; easy opt-out |
| Viral but wrong audience | Low | Medium | Targeted distribution; persona filtering |
| Technical performance | Low | High | Edge caching; progressive enhancement |
| Brand perception risk | Low | High | Premium design; no gimmicks |
| GDPR/privacy | Medium | High | Consent; data retention policy |

### Risk Deep Dives

**Risk: Quiz Feels "Marketing-y" (Brand Damage)**

- **Symptom**: Users share negatively; comments like "just trying to get my email"
- **Mitigation**:
  - Results are genuinely valuable without signup
  - Email is optional with clear "skip" path
  - No pressure language; respect for autonomy
  - Premium visual design (Emily Heyward test)
- **Kill Switch**: If NPS of quiz experience drops below 40, pause and redesign

**Risk: High Volume, Low Quality Leads**

- **Symptom**: Lots of emails, few signups
- **Mitigation**:
  - Score-based prioritization (hot/warm/cool)
  - Longer nurture for low-intent segments
  - Qualify leads with follow-up survey
- **Threshold**: If 30-day conversion <5%, re-examine targeting

**Risk: Over-Reliance on Single Channel**

- **Symptom**: All traffic from one source; vulnerable
- **Mitigation**:
  - Diversify from launch: organic, paid, partner, embed
  - Build SEO-friendly content around quiz
  - Partner with creators for distribution
- **Goal**: No single channel >40% of traffic by month 3

### Privacy & Compliance

**Data Collection**:
- Email: Explicit opt-in only
- Answers: Stored for personalization; deletable on request
- Analytics: Anonymized for aggregate analysis

**Retention Policy**:
- Non-converted leads: 12 months, then archive
- Converted leads: Link to user account
- Assessment answers: 24 months (for product improvement)

**GDPR Compliance**:
- Clear consent language at email capture
- Easy unsubscribe in every email
- Data export/delete available on request

---

## Advisory Board Evaluation

### Feature: Creator Scorecard Assessment

**One-Line Description**: A 12-question quiz that scores creators' gear organization maturity and generates qualified leads.

---

### Daniel Priestley Score: 10/10

**Criteria Analysis**:

- **7/11/4 Amplification**: The quiz IS a touchpoint that can appear on social, email, blog, and partner sites — and each completion adds another person to the ecosystem.
- **24/7 Asset**: Once built, the quiz generates leads while the team sleeps. Evergreen content that compounds.
- **Compound Value**: Every quiz taker adds data for benchmarking, testimonials for social proof, and potential for referral.
- **Demand Signaling**: This is the textbook ScoreApp model. Quiz completion IS the signal of interest. No asking for sale before signal.
- **Demand/Supply Tension**: As more creators complete the quiz and see benchmarks, desire to "beat" the average increases.

**Verdict**: APPROVED

**Reasoning**: This is exactly what Daniel Priestley prescribes. A scorecard activates dormant desire, collects signals, and creates the foundation for nurture without pressure.

---

### Julie Zhuo Score: 9/10

**Criteria Analysis**:

- **Simplicity**: 12 questions with clear progress; estimated time upfront (3 min).
- **Progressive Disclosure**: Results reveal depth gradually — overall score, then breakdown, then recommendations.
- **Native Feel**: Clean, premium design; doesn't feel like a lead gen form.
- **Controversial Principle**: We chose "respect autonomy" over "maximize capture" — email is optional, skip is visible.

**Verdict**: APPROVED

**Reasoning**: The quiz experience respects user intelligence. Progressive disclosure of results creates "aha" moments without overwhelming. The optional email capture is a distinctive choice that prioritizes experience over extraction.

---

### Li Jin Score: 9/10

**Criteria Analysis**:

- **Creator Leverage**: Results give creators clarity about their ecosystem — knowledge they own.
- **Platform Independence**: Quiz works on Teed's owned platform; not dependent on social algorithms.
- **Attribution**: Shared results link back to creator context (if they sign up).
- **Ownership**: Quiz data stays with the creator-as-lead; they can request deletion.

**Verdict**: APPROVED

**Reasoning**: The quiz respects creator data ownership. Results are valuable standalone — you don't HAVE to sign up to benefit. This builds trust that enables future relationship.

---

### Emily Heyward Score: 9/10

**Criteria Analysis**:

- **Visual Premium**: Muted colors, generous whitespace, no aggressive CTAs.
- **Language Authority**: "Gear Ecosystem" is confident framing. No "Don't miss out!"
- **Emotional Connection**: "The Aspiring Organizer" persona creates identity connection.
- **Brand Pride**: The share image is something creators would want associated with their brand.

**Verdict**: APPROVED

**Reasoning**: The quiz feels like a tool from a premium brand, not a growth hack from a desperate startup. Persona names are memorable without being corny. Share images are editorial, not salesy.

---

### Codie Sanchez Score: 8/10

**Criteria Analysis**:

- **Boring Reliability**: Lead gen quizzes are proven; not chasing trends.
- **Cash Flow Mindset**: Quiz generates leads today, not bets on future virality.
- **Practical Value**: Every creator with gear can answer these questions; broad applicability.
- **Contrarian Edge**: Most creator tools don't have lead gen assets; we do.
- **Infrastructure Play**: The quiz enables Teed to serve ALL creators, not just those who found us organically.

**Verdict**: APPROVED

**Reasoning**: This is the "boring" lead gen machine that actually works. Not flashy, just effective. The quiz makes Teed discoverable to creators who don't know they need it yet — expanding the funnel at the top.

---

### Doctrine Alignment

- [x] Bags > Items > Links > Profile (quiz leads to bag creation)
- [x] No obligation/pressure language (email is optional; skip is visible)
- [x] Constructive dopamine only (score is positive framing; "opportunity" not "failure")
- [x] Passes the "stale test" (quiz questions remain valid regardless of age)

---

### Board Decision: 5/5 APPROVAL

**Ship immediately with noted design attention to:**
- Premium visual polish (Emily Heyward test)
- Clear skip path for email (Li Jin test)
- Share image quality (pride of ownership)

---

## Implementation Roadmap

### Phase 1: MVP (Weeks 1-3)

- [ ] Quiz frontend with all 12 questions
- [ ] Scoring engine and persona assignment
- [ ] Results page with breakdown
- [ ] Basic email capture (no sequences yet)
- [ ] Database schema and API endpoints

### Phase 2: Nurture (Weeks 4-5)

- [ ] Email provider integration
- [ ] Automated sequence setup (Day 0, 2, 5, 10, 21)
- [ ] Segmentation logic by score/persona
- [ ] Unsubscribe and preference management

### Phase 3: Optimization (Weeks 6-8)

- [ ] Dynamic OG image generation
- [ ] Share functionality
- [ ] A/B testing infrastructure
- [ ] Analytics dashboard
- [ ] Launch Phase 1 tests

### Phase 4: Scale (Weeks 9-12)

- [ ] Partner embed distribution
- [ ] SEO content around quiz
- [ ] Retake functionality (score improvement)
- [ ] Advanced segmentation and personalization

---

## Appendix: Question Bank (Alternatives)

These questions can be swapped in for A/B testing or future iterations:

**Organization Alternatives**:
- "How quickly could you answer if someone asked for your complete gear list?"
- "If your main device died tomorrow, where would you find your gear documentation?"

**Sharing Alternatives**:
- "How often do you get asked 'What gear do you use?'"
- "Do you have a standard response ready for gear questions?"

**Monetization Alternatives**:
- "Have you ever discovered a broken affiliate link months after posting?"
- "Do your most-viewed videos have up-to-date gear links?"

**Documentation Alternatives**:
- "If you recommended a product 2 years ago, could you explain why today?"
- "Do you track which gear has performed best over time?"

---

*Strategic Plan v1.0 — January 2026*
*For: Teed Creator Scorecard Assessment*

---

## Sources

Research and frameworks drawn from:

- [Scorecard Marketing by Daniel Priestley](https://cdn.scoreapp.com/assets/book/Scorecard_Marketing_by_Daniel_Priestley.pdf)
- [ScoreApp Lead Generation Blueprint](https://www.scoreapp.com/videos/the-lead-generation-blueprint/)
- [Quiz Funnel Psychology - LanderLab](https://landerlab.io/blog/lead-generation-quizzes)
- [Quiz Engagement Benchmarks - Outgrow](https://outgrow.co/blog/quiz-engagement-benchmarks-completion-rates)
- [Lead Nurturing Best Practices - TheCMO](https://thecmo.com/managing-performance/lead-nuturing-best-practices/)
- [Email Nurture Sequences - ThriveThemes](https://thrivethemes.com/email-nurture-sequence-guide/)
- [Creator Economy Overview - Goldman Sachs](https://creatorswithinfluence.com/wp-content/uploads/2025/04/Goldman-Sachs-Global-Investment-Research-Creator-Economy-Framing-Market-Opportunity-Download-Report-March-26-2025.pdf)
- [Self-Evaluation Motives - Wikipedia](https://en.wikipedia.org/wiki/Self-evaluation_motives)
- [Viral Quiz Creation - ScoreApp](https://www.scoreapp.com/viral-quiz/)
