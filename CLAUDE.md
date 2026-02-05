# Claude Code Instructions

## Quick Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Build (run before deploy)
npm run lint             # Lint check
npm run test:chromium    # Fastest E2E tests

# AI/Identification testing
npx tsx scripts/test-identification-system.ts

# Debug tools
npx tsx scripts/debug-parse.ts "TaylorMade Stealth Driver"
npx tsx scripts/debug-brand-match.ts "callaway"
```

---

## In-Progress Work Documentation

**ALWAYS** maintain an `IN_PROGRESS.md` file when working on tasks that:
- Require multiple steps or sessions
- Involve planned changes not yet implemented
- Are partially complete
- Need verification or testing after completion

### Required Sections

```markdown
# [Task Name] - In Progress

## Problem
Brief description of what needs to be fixed/built.

## Root Cause / Analysis
What was discovered during investigation.

## Solution
What approach is being taken.

## Status
- [ ] Step 1
- [x] Step 2 (completed)
- [ ] Step 3

## Files Created/Modified
- `path/to/file.ts` - description
- `path/to/migration.sql` - description

## Next Steps
Numbered list of what to do next.

## Verification
How to verify the fix works.
```

### When to Update

- **Start of task**: Create the file with problem and initial analysis
- **During work**: Update status checkboxes and add findings
- **Before ending session**: Ensure all context is captured
- **After completion**: Either delete the file or rename to `COMPLETED_[task].md`

### File Naming

- Single in-progress task: `IN_PROGRESS.md`
- Multiple concurrent tasks: `IN_PROGRESS_[task-name].md`
- Completed reference: `docs/completed/[date]_[task-name].md`

---

## Project Context

### Tech Stack
- Next.js 14+ (App Router)
- Supabase (PostgreSQL, Auth, Storage)
- TypeScript
- Tailwind CSS
- Framer Motion for animations

### Key Directories
- `app/` - Next.js app router pages and API routes
- `components/` - React components
- `lib/` - Utility functions and Supabase client
- `scripts/migrations/` - Supabase SQL migrations
- `packages/mcp-server/` - MCP server for AI assistants

### Database
- Supabase project ref: `jvljmfdroozexzodqupg`
- All tables should have RLS enabled with appropriate policies
- Migrations are numbered: `NNN_description.sql`

### MCP Integration
- Supabase MCP configured in `.mcp.json`
- Use Supabase MCP to verify database state and run migrations
- Teed MCP server in `packages/mcp-server/` for bag management

---

## Architecture Patterns

### Multi-Stage Pipeline (AI Identification)
The product identification system uses a multi-stage pipeline with early exit:
1. **Text parsing** - Extract brand/model from user input
2. **Library lookup** - Check product library cache first (fastest)
3. **AI enrichment** - Use LLM for additional details
4. **Vision AI** - For image-based identification
5. **Graceful fallback** - Never hard fail, always return best guess

Key files:
- `lib/linkIdentification/index.ts` - Link identification pipeline
- `lib/textParsing/index.ts` - Text parsing with smart brand detection
- `lib/productLibrary/` - Product library with brand matching

### State Flow Patterns
- **Browser client**: `lib/supabaseClient.ts` (anon key, RLS-aware)
- **Server/API**: `lib/serverSupabase.ts` (service role, bypasses RLS)
- **Auto-save**: 1.5s debounce pattern for form fields (see `BagEditorClient.tsx`)
- **Optimistic UI**: Items show immediately with `_isPending` state

### Component Patterns
- **Modals**: Use `<AnimatePresence>` + `motion.div` with backdrop
- **Loading states**: Use `GolfLoader` component or staged progress
- **Forms**: Debounced validation, inline error messages

---

## Code Style

### Imports
```typescript
// Framework imports first
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Third-party
import { motion } from 'framer-motion';

// Internal - absolute paths
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Item } from '@/types';
```

### Naming Conventions
- Components: `PascalCase.tsx`
- Props interfaces: `[Component]Props`
- Type-only imports: `import type { X }` (explicit)
- CSS utility helper: `cn()` from `lib/utils.ts`

### Animation Patterns
- Use variants from `lib/animations.ts` for consistency
- Common: `fadeUp`, `scaleIn`, `slideUp`, `staggerContainer`
- Transitions: `springTransition`, `smoothTransition`

---

## Common Gotchas

### Database
- **ALWAYS enable RLS on new tables** - Check with security advisors after DDL
- Brand detection runs BEFORE pattern extraction in text parsing
- Migrations must be numbered: `NNN_description.sql`

### AI Confidence Scoring
- `90%+` = "Identified" (high confidence)
- `75-89%` = "Best match" (medium confidence)
- `<75%` = "Possible match" (low confidence)
- Always show source badge (Library, AI, Vision)

### API Routes
- Use `NextResponse.json()` for responses
- Server components can't use hooks
- API routes are in `app/api/` with `route.ts` files

### Images
- Mobile browsers may send HEIC format - convert to JPEG
- Always compress before upload (see `compressImageForAPI`)
- Proxy external images through `/api/proxy-image`

### Debounce Timing
- Text search: 300ms (fast feedback)
- Handle availability: 300ms
- Auto-save forms: 500ms (bag metadata), 1500ms (items)
