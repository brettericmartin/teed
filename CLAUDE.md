# Claude Code Instructions

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
