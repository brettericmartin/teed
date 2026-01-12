# Teed MCP Server: Strategic Plan

**Version**: 1.0
**Date**: January 2026
**Status**: Strategic Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Technical Architecture](#technical-architecture)
5. [User Stories](#user-stories)
6. [Feature Breakdown](#feature-breakdown)
7. [Success Metrics](#success-metrics)
8. [Risk Assessment](#risk-assessment)
9. [Resource Requirements](#resource-requirements)
10. [Timeline Estimate](#timeline-estimate)
11. [Advisory Board Evaluation](#advisory-board-evaluation)

---

## Executive Summary

The Model Context Protocol (MCP) has emerged as the universal standard for AI tool integration, adopted by Anthropic, OpenAI, Google, and Microsoft. With over 97 million monthly SDK downloads and nearly 2,000 registered servers in the MCP Registry, this protocol represents the infrastructure layer for how AI assistants will interact with external services for the foreseeable future.

A Teed MCP Server would transform Teed from a web-based gear curation platform into essential AI infrastructure. Instead of users manually visiting teed.club to manage their bags, any MCP-compatible AI assistant (Claude, ChatGPT, Cursor, VS Code Copilot, Windows Copilot) could directly query, create, and manage gear collections through natural conversation. This positions Teed as "picks and shovels" infrastructure for the AI-powered creator economy, enabling seamless integration without requiring users to context-switch away from their AI workflows.

The strategic opportunity is significant: as AI assistants become the primary interface for many users, platforms without MCP integration risk becoming invisible. Teed's existing GPT API infrastructure provides a strong foundation, but MCP offers broader reach (not just ChatGPT) and standardized tooling. This initiative aligns with Teed's doctrine of being a canonical reference utility that works 24/7 while reducing friction and explanation overhead.

---

## Problem Statement

### The Current State

Users who want AI assistance with their gear curation face significant friction:

1. **Context Switching**: Users must leave their AI conversation, open a browser, navigate to Teed, perform actions, then return to describe what they did to the AI.

2. **Explanation Overhead**: Every time a user mentions Teed to an AI, they must re-explain what it is, what bags they have, and what they want to accomplish.

3. **Manual Data Entry**: Even with AI assistance in identifying gear, users must manually copy product information into Teed's interface.

4. **Fragmented Recommendations**: When an AI recommends gear, there's no seamless path to add those recommendations to a user's existing Teed collection.

5. **Platform Lock-in**: Teed's existing GPT integration only works within ChatGPT's ecosystem, missing Claude (growing rapidly), Cursor, and other MCP-enabled applications.

### The Pain Points

**For Creators/Power Users:**
- "I asked Claude to help me build a photography gear bag, but then I had to manually add every item to Teed"
- "My AI knows I have a golf bag, but I have to keep re-explaining what's in it every conversation"
- "I use Claude Code for work and ChatGPT occasionally, but my Teed bags only work with one"

**For Casual Users:**
- "I don't want to learn another interface, I just want to tell my AI what gear I bought"
- "Switching between apps breaks my flow when I'm researching gear"

**For Teed as a Platform:**
- Reduced engagement as users spend more time in AI interfaces
- Missing the opportunity to be embedded in AI-native workflows
- Competitive risk from AI-native gear management solutions

---

## Solution Overview

### What We're Building

A Model Context Protocol (MCP) server that exposes Teed's core functionality as AI-callable tools, resources, and prompts. This server will enable any MCP-compatible AI assistant to:

1. **Read** user bags, items, and profile information
2. **Create** new bags and add items to existing bags
3. **Search** across public bags and discover curated content
4. **Update** item details, bag metadata, and organization
5. **Share** formatted exports for different platforms

### Core Capabilities

| Capability | Description | MCP Primitive |
|------------|-------------|---------------|
| Bag Management | Create, read, update, delete bags | Tools |
| Item Operations | Add, modify, remove items from bags | Tools |
| Search & Discovery | Find bags/items across platform | Tools |
| Profile Access | Read user context and preferences | Resources |
| Bag Contents | Stream bag data to AI context | Resources |
| Quick Add Templates | Pre-built prompts for common actions | Prompts |

### What This Enables

**Conversational Gear Management:**
```
User: "Add that Titleist TSR3 driver we were discussing to my golf bag"
Claude: [Calls add_item_to_bag tool]
       "Done! I've added the Titleist TSR3 Driver to your 'Tournament Ready' bag.
        Would you like me to add the shaft and grip specifications we discussed?"
```

**Contextual Recommendations:**
```
User: "What camera gear should I get for street photography?"
Claude: [Calls search_bags tool with category='photography']
       "Based on popular bags in the Teed community, here are common setups...
        I can add any of these to a new 'Street Photography' bag for you."
```

**Cross-Platform Portability:**
```
User in Cursor: "Help me document the tech setup from my bag"
Claude: [Calls get_bag_items resource]
       "Here's your current 'Home Office' setup from Teed...
        I'll generate documentation for each item."
```

---

## Technical Architecture

### MCP Server Structure

```
teed-mcp-server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # MCP server configuration
│   ├── auth/
│   │   ├── oauth.ts          # OAuth 2.1 resource server
│   │   └── session.ts        # Session management
│   ├── tools/
│   │   ├── bags.ts           # Bag CRUD operations
│   │   ├── items.ts          # Item operations
│   │   ├── search.ts         # Discovery and search
│   │   └── export.ts         # Format exports
│   ├── resources/
│   │   ├── profile.ts        # User profile resource
│   │   ├── bags.ts           # Bag listing resource
│   │   └── items.ts          # Item details resource
│   ├── prompts/
│   │   ├── quick-add.ts      # Quick item addition
│   │   ├── bag-review.ts     # Bag review template
│   │   └── gear-compare.ts   # Comparison template
│   └── utils/
│       ├── supabase.ts       # Database client
│       └── validation.ts     # Input validation
├── package.json
├── tsconfig.json
└── README.md
```

### Tools to Expose

#### Bag Management Tools

```typescript
// Tool: create_bag
{
  name: "create_bag",
  description: "Create a new gear bag for the authenticated user",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Name of the bag (e.g., 'Tournament Golf Bag', 'Travel Tech Kit')"
      },
      description: {
        type: "string",
        description: "Optional description explaining the bag's purpose"
      },
      category: {
        type: "string",
        enum: ["golf", "travel", "tech", "camping", "photography", "fitness", "cooking", "music", "art", "gaming", "other"],
        description: "Category for organization and discovery"
      },
      is_public: {
        type: "boolean",
        default: true,
        description: "Whether the bag is visible to others"
      }
    },
    required: ["title"]
  },
  annotations: {
    readOnlyHint: false,
    openWorldHint: false
  }
}

// Tool: list_my_bags
{
  name: "list_my_bags",
  description: "Get all bags owned by the authenticated user with item counts",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter by category (optional)"
      },
      include_private: {
        type: "boolean",
        default: true,
        description: "Include private bags in results"
      }
    }
  },
  annotations: {
    readOnlyHint: true
  }
}

// Tool: get_bag
{
  name: "get_bag",
  description: "Get detailed information about a specific bag including all items",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: {
        type: "string",
        description: "The bag's URL code (e.g., 'tournament-ready')"
      }
    },
    required: ["bag_code"]
  },
  annotations: {
    readOnlyHint: true
  }
}

// Tool: update_bag
{
  name: "update_bag",
  description: "Update a bag's title, description, or visibility",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      is_public: { type: "boolean" }
    },
    required: ["bag_code"]
  }
}

// Tool: delete_bag
{
  name: "delete_bag",
  description: "Permanently delete a bag and all its items. Use with caution.",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: { type: "string" },
      confirm: {
        type: "boolean",
        description: "Must be true to confirm deletion"
      }
    },
    required: ["bag_code", "confirm"]
  },
  annotations: {
    destructiveHint: true
  }
}
```

#### Item Management Tools

```typescript
// Tool: add_item_to_bag
{
  name: "add_item_to_bag",
  description: "Add a new item to a bag. Can include product details and purchase links.",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: {
        type: "string",
        description: "The bag to add the item to"
      },
      name: {
        type: "string",
        description: "Product name (e.g., 'Titleist TSR3 Driver')"
      },
      brand: {
        type: "string",
        description: "Brand name (e.g., 'Titleist', 'Apple', 'Sony')"
      },
      description: {
        type: "string",
        description: "Personal notes about this item"
      },
      purchase_url: {
        type: "string",
        description: "URL where this item can be purchased"
      },
      image_url: {
        type: "string",
        description: "URL to product image"
      },
      quantity: {
        type: "integer",
        default: 1
      }
    },
    required: ["bag_code", "name"]
  }
}

// Tool: update_item
{
  name: "update_item",
  description: "Update an existing item's details",
  inputSchema: {
    type: "object",
    properties: {
      item_id: { type: "string", format: "uuid" },
      name: { type: "string" },
      brand: { type: "string" },
      description: { type: "string" },
      quantity: { type: "integer" }
    },
    required: ["item_id"]
  }
}

// Tool: remove_item_from_bag
{
  name: "remove_item_from_bag",
  description: "Remove an item from a bag",
  inputSchema: {
    type: "object",
    properties: {
      item_id: { type: "string", format: "uuid" }
    },
    required: ["item_id"]
  }
}

// Tool: move_item_to_bag
{
  name: "move_item_to_bag",
  description: "Move an item from one bag to another",
  inputSchema: {
    type: "object",
    properties: {
      item_id: { type: "string", format: "uuid" },
      target_bag_code: { type: "string" }
    },
    required: ["item_id", "target_bag_code"]
  }
}

// Tool: copy_item_to_bag
{
  name: "copy_item_to_bag",
  description: "Copy an item (including from public bags) to one of your bags",
  inputSchema: {
    type: "object",
    properties: {
      item_id: { type: "string", format: "uuid" },
      target_bag_code: { type: "string" }
    },
    required: ["item_id", "target_bag_code"]
  }
}
```

#### Search & Discovery Tools

```typescript
// Tool: search_bags
{
  name: "search_bags",
  description: "Search public bags across the Teed community",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (searches titles, descriptions, tags)"
      },
      category: {
        type: "string",
        description: "Filter by category"
      },
      limit: {
        type: "integer",
        default: 10,
        maximum: 50
      }
    }
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  }
}

// Tool: search_items
{
  name: "search_items",
  description: "Search for specific items across public bags",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (product names, brands)"
      },
      brand: {
        type: "string",
        description: "Filter by brand"
      },
      category: {
        type: "string",
        description: "Filter by bag category"
      },
      limit: {
        type: "integer",
        default: 20
      }
    },
    required: ["query"]
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  }
}

// Tool: get_featured_bags
{
  name: "get_featured_bags",
  description: "Get editorially curated featured bags",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string" },
      limit: { type: "integer", default: 10 }
    }
  },
  annotations: {
    readOnlyHint: true
  }
}

// Tool: get_user_public_bags
{
  name: "get_user_public_bags",
  description: "Get public bags from a specific user by their handle",
  inputSchema: {
    type: "object",
    properties: {
      handle: {
        type: "string",
        description: "User's handle (without @)"
      }
    },
    required: ["handle"]
  },
  annotations: {
    readOnlyHint: true
  }
}
```

#### Export Tools

```typescript
// Tool: export_bag_for_youtube
{
  name: "export_bag_for_youtube",
  description: "Generate a formatted list suitable for YouTube video descriptions",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: { type: "string" },
      include_links: { type: "boolean", default: true },
      include_prices: { type: "boolean", default: false }
    },
    required: ["bag_code"]
  },
  annotations: {
    readOnlyHint: true
  }
}

// Tool: export_bag_for_newsletter
{
  name: "export_bag_for_newsletter",
  description: "Generate HTML-formatted content for newsletters",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: { type: "string" },
      style: {
        type: "string",
        enum: ["minimal", "detailed", "visual"],
        default: "detailed"
      }
    },
    required: ["bag_code"]
  }
}

// Tool: get_bag_embed_code
{
  name: "get_bag_embed_code",
  description: "Generate iframe embed code for websites and blogs",
  inputSchema: {
    type: "object",
    properties: {
      bag_code: { type: "string" },
      style: {
        type: "string",
        enum: ["compact", "grid", "minimal"],
        default: "grid"
      }
    },
    required: ["bag_code"]
  }
}
```

### Resources to Expose

```typescript
// Resource: User Profile
{
  uri: "teed://profile",
  name: "My Teed Profile",
  description: "The authenticated user's profile information",
  mimeType: "application/json"
}

// Resource: Bag Index
{
  uri: "teed://bags",
  name: "My Bags",
  description: "List of all bags owned by the user",
  mimeType: "application/json"
}

// Resource: Specific Bag (template)
{
  uriTemplate: "teed://bags/{code}",
  name: "Bag Contents",
  description: "Full contents of a specific bag",
  mimeType: "application/json"
}

// Resource: Recent Activity
{
  uri: "teed://activity",
  name: "Recent Changes",
  description: "Recently modified bags and items",
  mimeType: "application/json"
}
```

### Prompts to Expose

```typescript
// Prompt: Quick Add from Conversation
{
  name: "quick_add_gear",
  description: "Add gear items mentioned in conversation to a bag",
  arguments: [
    {
      name: "bag_code",
      description: "Target bag (or 'new' to create one)",
      required: true
    },
    {
      name: "items",
      description: "Comma-separated list of items to add",
      required: true
    }
  ]
}

// Prompt: Bag Review
{
  name: "review_bag",
  description: "Get a structured review of bag contents with suggestions",
  arguments: [
    {
      name: "bag_code",
      required: true
    },
    {
      name: "focus",
      description: "What to focus on: completeness, organization, or duplicates"
    }
  ]
}

// Prompt: Gear Comparison
{
  name: "compare_bags",
  description: "Compare two bags side-by-side",
  arguments: [
    { name: "bag_code_1", required: true },
    { name: "bag_code_2", required: true }
  ]
}
```

### Authentication & Authorization

Following the MCP specification (June 2025), the Teed MCP server will act as an **OAuth 2.1 Resource Server**:

```typescript
// Server metadata endpoint
GET /.well-known/oauth-protected-resource
{
  "resource": "https://mcp.teed.club",
  "authorization_servers": ["https://auth.teed.club"],
  "scopes_supported": [
    "bags:read",
    "bags:write",
    "items:read",
    "items:write",
    "profile:read",
    "search:public"
  ]
}
```

**Authorization Flow:**

1. MCP Client discovers authorization server via Protected Resource Metadata
2. User authorizes via Teed's existing OAuth flow (leveraging existing infrastructure)
3. Client receives scoped access token
4. MCP Server validates tokens per-request
5. Tokens are never passed through to other services (per spec security requirements)

**Scope Definitions:**

| Scope | Allows |
|-------|--------|
| `bags:read` | Read user's bags and items |
| `bags:write` | Create, update, delete bags |
| `items:read` | Read item details |
| `items:write` | Add, update, remove items |
| `profile:read` | Read profile information |
| `search:public` | Search public content |

**Token Security:**
- Short-lived access tokens (1 hour)
- Refresh token rotation
- Per-client revocation
- Request origin validation for remote connections

### Data Access Patterns

```typescript
// Read pattern: Fetch user's bags with items
async function getUserBags(userId: string, scope: string[]) {
  if (!scope.includes('bags:read')) {
    throw new UnauthorizedError('Missing bags:read scope');
  }

  const { data, error } = await supabase
    .from('bags')
    .select(`
      id, code, title, description, category, is_public,
      bag_items (
        id, custom_name, brand, custom_description, quantity
      )
    `)
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  return data;
}

// Write pattern: Add item with validation
async function addItem(userId: string, bagCode: string, item: ItemInput) {
  // Verify ownership
  const bag = await verifyBagOwnership(userId, bagCode);
  if (!bag) throw new NotFoundError('Bag not found or access denied');

  // Validate and sanitize input
  const validated = validateItemInput(item);

  // Insert with RLS
  const { data, error } = await supabase
    .from('bag_items')
    .insert({
      bag_id: bag.id,
      custom_name: validated.name,
      brand: validated.brand,
      custom_description: validated.description,
      // ... other fields
    })
    .select()
    .single();

  return data;
}
```

### Transport Configuration

The MCP server will support multiple transports for different use cases:

```typescript
// Streamable HTTP (primary, for remote connections)
const httpTransport = new StreamableHttpTransport({
  endpoint: '/mcp',
  cors: {
    allowedOrigins: ['https://claude.ai', 'https://chat.openai.com'],
    credentials: true
  }
});

// Stdio (for local installations like Claude Desktop)
const stdioTransport = new StdioTransport();

// Server configuration
const server = new McpServer({
  name: 'teed',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  }
});
```

---

## User Stories

### Story 1: The Content Creator Building a Gear Video

**User**: Sarah, a YouTube tech reviewer with 50K subscribers

**Scenario**: Sarah is planning a video about her home office setup. She's chatting with Claude to outline the video.

**Before MCP**:
1. Sarah asks Claude for help structuring the video
2. Claude suggests organizing by category (desk, lighting, audio, camera)
3. Sarah opens Teed in a new tab
4. Sarah manually creates a new bag "Home Office 2026"
5. Sarah switches between Claude and Teed, manually entering each item
6. Sarah copies the embed code, returns to Claude for help with description
7. 15+ context switches, 30 minutes of friction

**After MCP**:
```
Sarah: "I'm making a video about my home office setup. Here's what I have:
       - LG 27GP950-B monitor
       - Fully Jarvis standing desk
       - Herman Miller Aeron chair
       - Elgato Key Light Air x2
       - Sony A7IV with 24-70mm f/2.8
       - Rode VideoMic NTG
       Let me save this to Teed."

Claude: [Calls create_bag then add_item_to_bag x6]
        "I've created your 'Home Office 2026' bag with all 6 items.
         Here's a summary:

         Desk Setup: LG 27GP950-B, Fully Jarvis, Herman Miller Aeron
         Lighting: 2x Elgato Key Light Air
         Camera: Sony A7IV with Sony 24-70mm f/2.8
         Audio: Rode VideoMic NTG

         View it at: teed.club/u/sarahtech/home-office-2026

         Would you like me to generate a YouTube description
         with affiliate links?"

Sarah: "Yes, and include a brief note about each item."

Claude: [Calls export_bag_for_youtube]
        [Returns formatted description ready to paste]
```

**Time saved**: 25 minutes
**Context switches eliminated**: 15+

---

### Story 2: The Golfer Optimizing Their Bag

**User**: Mike, amateur golfer preparing for club championship

**Scenario**: Mike wants to review his golf bag and consider upgrades based on what successful players use.

**Conversation**:
```
Mike: "Can you look at my Tournament Ready bag on Teed and see
       what other golfers are using for their wedge setup?"

Claude: [Calls get_bag with code='tournament-ready']
        [Calls search_items with query='wedge' category='golf']

        "Your 'Tournament Ready' bag has:
         - Titleist Vokey SM9 54° (10° bounce)
         - Titleist Vokey SM9 58° (8° bounce)

         Looking at 47 public golf bags on Teed, the most popular
         wedge setups include:

         1. Titleist Vokey SM9/10 (38% of bags) - what you have
         2. Cleveland RTX 6 ZipCore (24%)
         3. Callaway Jaws Raw (18%)
         4. TaylorMade Hi-Toe 3 (12%)

         Your gap wedge (54°) has 10° bounce which is on the higher
         side. For firmer conditions at your club championship,
         some players prefer 8° bounce. Want me to note that as a
         consideration on your item?"

Mike: "Yes, add a note that I might want to test lower bounce for
       the championship."

Claude: [Calls update_item]
        "Done. I've added the note to your 54° wedge."
```

---

### Story 3: The Travel Blogger Maintaining Packing Lists

**User**: Alex, travel content creator with bags for different trip types

**Scenario**: Alex is packing for a 2-week Japan trip and wants to adapt their existing "Asia Travel" bag.

**Conversation**:
```
Alex: "I'm going to Japan for 2 weeks in spring. Can you look at my
       'Asia Travel' bag and help me adapt it? I'll also need to add
       some tech I've bought since then."

Claude: [Calls get_bag with code='asia-travel']

        "Your 'Asia Travel' bag has 23 items from your last trip.
         Key categories:
         - Clothing: 8 items
         - Tech: 6 items
         - Toiletries: 5 items
         - Documents/Misc: 4 items

         For spring Japan, I'd suggest:
         - Add a light rain jacket (spring showers)
         - Your current 'universal adapter' covers Japan
         - Consider adding a Suica/ICOCA card to your list

         What new tech did you want to add?"

Alex: "I got a new DJI Mini 4 Pro drone and an Insta360 X4. Also let's
       create a new bag specifically for this trip called 'Japan Spring 2026'"

Claude: [Calls create_bag with title='Japan Spring 2026']
        [Calls copy_item_to_bag for relevant items from asia-travel]
        [Calls add_item_to_bag for DJI Mini 4 Pro]
        [Calls add_item_to_bag for Insta360 X4]

        "Done! I've created 'Japan Spring 2026' with:
         - 18 items copied from your Asia Travel bag (I left out the
           heavy winter layers since it's spring)
         - Added your new DJI Mini 4 Pro and Insta360 X4
         - Added 'Suica Card' as a reminder item

         Your original Asia Travel bag is unchanged.
         View the new bag: teed.club/u/alexwanders/japan-spring-2026"
```

---

### Story 4: The Gear Researcher Comparing Options

**User**: Jordan, photographer researching mirrorless camera systems

**Scenario**: Jordan is deciding between Sony and Canon systems and wants to see real-world kit examples.

**Conversation**:
```
Jordan: "I'm trying to decide between Sony A7 series and Canon R
         series for wildlife photography. Can you find bags on Teed
         from photographers using each system?"

Claude: [Calls search_bags with query='wildlife photography Sony']
        [Calls search_bags with query='wildlife photography Canon R']

        "I found 12 wildlife photography bags on Teed:

         Sony A7 Series (7 bags):
         - Most common body: Sony A7RV (5 bags)
         - Common lens: Sony 200-600mm (6 bags)
         - Popular with: bird photographers
         - Example: @wildlifepro's 'Bird Photography Kit'

         Canon R Series (5 bags):
         - Most common body: Canon R5 (4 bags)
         - Common lens: Canon RF 100-500mm (4 bags)
         - Popular with: safari photographers
         - Example: @safarishots's 'African Wildlife Rig'

         Would you like me to show the full contents of either
         example bag?"

Jordan: "Show me both, and let me save items I'm interested in to
         a new 'Wishlist' bag."

Claude: [Calls get_bag for both bags]
        [Creates comparison view]

Jordan: "Add the Sony A7RV and the 200-600mm to a new wishlist."

Claude: [Calls create_bag with title='Wildlife Camera Wishlist']
        [Calls copy_item_to_bag for Sony A7RV]
        [Calls copy_item_to_bag for Sony 200-600mm]

        "Created! Your 'Wildlife Camera Wishlist' now has 2 items.
         Based on @wildlifepro's setup, you might also want to consider:
         - Sony 1.4x teleconverter (they use it for extra reach)
         - Really Right Stuff gimbal head (in 4 of the 7 bags)

         Want me to add these as 'considering' items?"
```

---

### Story 5: The Everyday User Quickly Logging Purchases

**User**: Pat, casual Teed user who tracks gadgets

**Scenario**: Pat just bought a new espresso machine and wants to add it without opening Teed.

**Conversation**:
```
Pat: "I just bought a Breville Barista Express Impress. Add it to
      my kitchen bag."

Claude: [Calls add_item_to_bag with bag_code='kitchen-essentials']

        "Added the Breville Barista Express Impress to your 'Kitchen
         Essentials' bag!

         This is your 12th item in that bag. Would you like me to
         add any notes about why you chose it or link to where
         you bought it?"

Pat: "It's from Williams Sonoma, and I chose it because it has
      built-in dosing."

Claude: [Calls update_item with description and purchase_url]

        "Updated! I've added your notes and the Williams Sonoma link.
         Your bag now shows the Breville with your personal context."
```

---

## Feature Breakdown

### Phase 1: Core Foundation (MVP)

**Goal**: Enable basic bag and item management through MCP

**Tools**:
- `list_my_bags` - Read user's bags
- `get_bag` - Get bag with items
- `create_bag` - Create new bag
- `add_item_to_bag` - Add item to bag
- `update_item` - Update item details
- `remove_item_from_bag` - Remove item

**Resources**:
- `teed://profile` - User profile
- `teed://bags` - Bag index
- `teed://bags/{code}` - Specific bag contents

**Authentication**:
- OAuth 2.1 resource server implementation
- Integration with existing Teed OAuth infrastructure
- Scope-based authorization

**Transport**:
- Streamable HTTP for web clients
- stdio for local (Claude Desktop, etc.)

**Deliverables**:
- [ ] MCP server package (`@teed/mcp-server`)
- [ ] OAuth protected resource metadata endpoint
- [ ] Basic tool implementations
- [ ] Resource handlers
- [ ] Documentation for developers
- [ ] Claude Desktop configuration guide

---

### Phase 2: Enhanced Discovery

**Goal**: Enable search, discovery, and cross-bag operations

**New Tools**:
- `search_bags` - Search public bags
- `search_items` - Search items
- `get_featured_bags` - Featured content
- `get_user_public_bags` - Browse by user
- `copy_item_to_bag` - Copy from public bags
- `move_item_to_bag` - Move between own bags
- `update_bag` - Update bag metadata
- `delete_bag` - Delete bag (with confirmation)

**New Resources**:
- `teed://featured` - Featured bags
- `teed://discover/{category}` - Category browsing

**New Prompts**:
- `quick_add_gear` - Batch add items
- `review_bag` - Bag review template

**Deliverables**:
- [ ] Search functionality
- [ ] Public bag access
- [ ] Cross-bag operations
- [ ] Prompt templates
- [ ] Rate limiting per scope

---

### Phase 3: Creator Tools & Exports

**Goal**: Enable creators to leverage bags in their content workflow

**New Tools**:
- `export_bag_for_youtube` - YouTube description format
- `export_bag_for_newsletter` - Newsletter HTML
- `get_bag_embed_code` - Embed code generation
- `export_bag_markdown` - Markdown export
- `get_bag_analytics` - Basic view counts (if user opts in)

**New Prompts**:
- `compare_bags` - Side-by-side comparison
- `gear_recommendations` - AI-assisted recommendations
- `content_planning` - Content calendar with gear

**New Resources**:
- `teed://exports/{code}` - Pre-formatted exports

**Enhanced Features**:
- Webhook notifications for bag changes
- Batch operations for multiple items
- Advanced filtering and sorting

**Deliverables**:
- [ ] Export formatters
- [ ] Embed code generation
- [ ] Comparison tools
- [ ] Creator-focused prompts
- [ ] Webhook infrastructure

---

### Phase 4: AI-Native Features

**Goal**: Deep AI integration and intelligent features

**New Capabilities**:
- Smart categorization suggestions
- Duplicate detection across bags
- Price tracking integration (passive, on-demand)
- Related item suggestions
- Bag completion recommendations

**Advanced Tools**:
- `suggest_items` - AI-powered suggestions
- `detect_duplicates` - Find duplicates
- `analyze_bag` - Comprehensive bag analysis
- `find_alternatives` - Alternative product finder

**Integration Features**:
- MCP Sampling for in-context suggestions
- Elicitation for user preferences
- Server-initiated notifications

**Deliverables**:
- [ ] Suggestion engine
- [ ] Duplicate detection
- [ ] Advanced analysis tools
- [ ] Sampling integration
- [ ] Enterprise SSO support

---

## Success Metrics

### Primary Metrics

| Metric | Target (6 months) | Measurement |
|--------|-------------------|-------------|
| MCP Connections | 1,000+ unique users | OAuth token issuance |
| Daily Active Tools | 500+ tool calls/day | Server telemetry |
| Bags Created via MCP | 20% of new bags | Source attribution |
| Items Added via MCP | 30% of new items | Source attribution |
| Cross-Platform Usage | 3+ distinct clients | Client identification |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool Success Rate | >95% | Error tracking |
| Average Response Time | <500ms | Latency monitoring |
| Authentication Success | >99% | OAuth metrics |
| User Retention (MCP users) | +15% vs web-only | Cohort analysis |
| Creator Export Usage | 100+ exports/week | Tool analytics |

### Qualitative Indicators

- User feedback in AI conversations mentions Teed positively
- Creators publicly share AI-assisted bag curation
- Developer community builds on MCP integration
- Featured in MCP registries and directories

### Anti-Metrics (What We Won't Optimize For)

- **Not**: Raw API call volume (avoid encouraging wasteful polling)
- **Not**: Time spent in AI vs Teed web (both are valid)
- **Not**: Engagement metrics visible to users (per doctrine)

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MCP spec changes | Medium | High | Follow spec closely, engage with community, maintain compatibility layer |
| OAuth complexity | Medium | Medium | Leverage existing OAuth infrastructure, comprehensive testing |
| Rate limiting abuse | Medium | Medium | Implement tiered rate limits, monitoring |
| Data synchronization issues | Low | High | Eventual consistency model, conflict resolution |
| Performance under load | Low | Medium | Caching layer, connection pooling |

### Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | Medium | High | Focus on Claude/ChatGPT integration first, clear documentation |
| Feature creep | Medium | Medium | Strict phase boundaries, doctrine alignment checks |
| Cannibalization of web usage | Low | Low | MCP and web serve different contexts |
| Privacy concerns | Low | High | Clear scope permissions, user consent flows |
| Dependency on AI platforms | Medium | Medium | Standard protocol = multiple implementations |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Competitor MCP servers | Medium | Medium | First-mover advantage, deep integration |
| AI platform policy changes | Low | High | Multi-platform support from start |
| Resource constraints | Medium | Medium | Phased approach, focus on core value |
| User confusion about permissions | Medium | Low | Clear OAuth consent UI |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Token leakage | Low | High | Short-lived tokens, rotation, monitoring |
| Unauthorized data access | Low | Critical | RLS, scope enforcement, audit logging |
| Prompt injection via tool responses | Medium | Medium | Output sanitization, response structure |
| Cross-user data access | Very Low | Critical | Strict authorization checks, testing |

---

## Resource Requirements

### Development Team

| Role | Allocation | Phase |
|------|------------|-------|
| Backend Engineer | 1.0 FTE | All phases |
| Security/Auth Engineer | 0.5 FTE | Phase 1-2 |
| DevOps/Infrastructure | 0.25 FTE | All phases |
| Product Manager | 0.25 FTE | All phases |
| Technical Writer | 0.25 FTE | Phase 1-2 |

### Infrastructure

| Resource | Phase 1 | Phase 2-3 | Phase 4 |
|----------|---------|-----------|---------|
| Compute | Small (existing) | Medium | Medium-Large |
| Database | Existing Supabase | +Read replica | +Analytics |
| Monitoring | Basic | Enhanced | Full APM |
| CDN/Edge | Existing | +MCP endpoints | Global |

### Dependencies

**External**:
- MCP TypeScript SDK (`@modelcontextprotocol/sdk`)
- Zod for schema validation
- Existing Supabase infrastructure
- OAuth libraries (existing)

**Internal**:
- Existing GPT API handlers (reference implementation)
- Auth infrastructure (gptAuth.ts patterns)
- Database schema (bags, items, profiles)
- Link Intelligence library

### Budget Estimate

| Category | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| Engineering | $30K | $25K | $30K | $40K |
| Infrastructure | $1K/mo | $2K/mo | $3K/mo | $5K/mo |
| Third-party | $0 | $0 | $1K | $2K |
| **Total** | **$33K** | **$31K** | **$40K** | **$54K** |

*Note: Estimates assume existing team capacity. External hiring would increase costs.*

---

## Timeline Estimate

### Phase 1: Core Foundation
**Duration**: 6-8 weeks

| Week | Focus |
|------|-------|
| 1-2 | MCP server scaffolding, OAuth resource server setup |
| 3-4 | Core tools (bags, items), authentication integration |
| 5-6 | Resources implementation, basic testing |
| 7-8 | Documentation, Claude Desktop testing, beta deployment |

**Exit Criteria**:
- [ ] Users can authenticate from Claude Desktop
- [ ] Basic bag/item CRUD works
- [ ] Documentation published
- [ ] 10+ beta users tested

### Phase 2: Enhanced Discovery
**Duration**: 4-6 weeks

| Week | Focus |
|------|-------|
| 1-2 | Search tools, public bag access |
| 3-4 | Cross-bag operations, prompts |
| 5-6 | Rate limiting, polish, extended testing |

**Exit Criteria**:
- [ ] Search works across public bags
- [ ] Copy/move operations functional
- [ ] Prompt templates available
- [ ] 100+ active MCP users

### Phase 3: Creator Tools
**Duration**: 4-6 weeks

| Week | Focus |
|------|-------|
| 1-2 | Export formatters (YouTube, newsletter) |
| 3-4 | Embed generation, markdown export |
| 5-6 | Comparison tools, creator prompts |

**Exit Criteria**:
- [ ] All export formats working
- [ ] Creators using for content workflow
- [ ] 500+ active MCP users

### Phase 4: AI-Native Features
**Duration**: 6-8 weeks

| Week | Focus |
|------|-------|
| 1-2 | Suggestion engine foundation |
| 3-4 | Duplicate detection, analysis |
| 5-6 | Sampling/elicitation integration |
| 7-8 | Enterprise features, polish |

**Exit Criteria**:
- [ ] AI-powered suggestions functional
- [ ] Enterprise SSO available
- [ ] 1000+ active MCP users
- [ ] Listed in MCP registries

### Total Timeline: 20-28 weeks (5-7 months)

```
Month 1-2:   [====== Phase 1: Core Foundation ======]
Month 3:     [==== Phase 2: Discovery ====]
Month 4:     [==== Phase 3: Creator Tools ====]
Month 5-6:   [======== Phase 4: AI-Native ========]
Month 7:     [Polish, Documentation, Marketing]
```

---

## Advisory Board Evaluation

### Daniel Priestley Evaluation: 9/10

**7/11/4 Amplification**: Exceptional. MCP integration transforms every AI conversation into a potential Teed touchpoint. Users mention their bags in AI chats across Claude, ChatGPT, VS Code, and future platforms. One bag becomes 10+ touchpoints.

**24/7 Asset**: Strong. The MCP server works while creators sleep, responding to AI queries and enabling bag management at any hour.

**Compound Value**: Excellent. Each integration point compounds. Users who connect once remain connected across all AI interactions.

**Demand Signaling**: Good. MCP connections signal high-intent users who want deep integration.

**Questions Daniel Would Ask**:
- "How does this help creators get found across more touchpoints?" *Answer: Every AI that knows about Teed bags becomes a discovery mechanism*
- "Does this asset work when the creator isn't actively promoting?" *Answer: Yes, bags are always query-able via MCP*
- "Will this compound over time?" *Answer: Yes, more AI platforms adopting MCP = more touchpoints*

**Verdict**: APPROVED - This is a 24/7 asset that multiplies touchpoints exponentially.

---

### Julie Zhuo Evaluation: 8/10

**Simplicity**: Good. For users, it's natural language - just talk about your bags. No new UI to learn.

**Progressive Disclosure**: Excellent. Basic tool calls are simple; advanced features (exports, comparisons) available when needed.

**Native Feel**: Outstanding. MCP integration means Teed feels native to every AI conversation - discovered, not disrupted.

**Controversial Principle**: We chose "invisible infrastructure" over "visible features" - controversial but correct for AI-native UX.

**Questions Julie Would Ask**:
- "What's the simplest version that delivers value?" *Answer: Phase 1 - just bag/item CRUD*
- "Does this feel native?" *Answer: Yes, conversational commands feel natural*
- "Are we getting enough debate?" *Answer: Yes, tool design requires careful scope decisions*

**Needs Work**: User consent UI for OAuth should be exceptionally clear. Avoid dark patterns.

**Verdict**: APPROVED - Progressive disclosure done right. Native to context.

---

### Li Jin Evaluation: 10/10

**Creator Leverage**: Maximum. Creators can manage their canonical gear reference from any AI platform. One source of truth, many interaction points.

**Platform Independence**: Outstanding. MCP is an open standard adopted by Anthropic, OpenAI, Google, Microsoft. If any single platform dies, others remain.

**Attribution**: Strong. Bag URLs always point back to creator's Teed profile.

**Ownership**: Excellent. Creators own their data. MCP integration doesn't create lock-in to any AI platform. Export tools ensure portability.

**Questions Li Would Ask**:
- "If TikTok/YouTube/Instagram changes tomorrow, does this still work?" *Answer: 100% yes - MCP is platform-agnostic*
- "Who gets credit?" *Answer: Creator's handle, bag name, Teed profile URL*
- "Does this consolidate or fragment creator power?" *Answer: Consolidates - one canonical source accessible everywhere*

**Verdict**: APPROVED - This is creator ownership infrastructure. Perfect alignment.

---

### Emily Heyward Evaluation: 7/10

**Visual Premium**: N/A for protocol layer, but tool responses should use premium, restrained language.

**Language Authority**: Needs attention. Tool descriptions and responses should be confident, not desperate. No "Don't miss out!" in system prompts.

**Emotional Connection**: Moderate. The emotional win is the "magic moment" of seeing AI interact with your bags. That's powerful but invisible.

**Brand Pride**: Indirect. Creators won't see Teed branding in conversations, but they will proudly share that their AI can manage their Teed bags.

**Questions Emily Would Ask**:
- "What do we want people to feel?" *Answer: Empowered, organized, seamlessly connected*
- "Is the language confident or needy?" *Answer: Tool descriptions must be assertive and clear*
- "Are we being focused?" *Answer: Yes - gear curation only, not trying to be everything*

**Needs Work**: Tool response language should be reviewed by brand. Avoid apologetic or desperate patterns.

**Verdict**: NEEDS WORK - Protocol is sound, but response language needs brand review.

---

### Codie Sanchez Evaluation: 10/10

**Boring Reliability**: This is infrastructure. It's the picks-and-shovels play for AI-powered gear curation.

**Cash Flow Mindset**: MCP integration generates ongoing value without constant input. Once connected, users remain connected.

**Practical Value**: High. Real problem (friction in AI-assisted gear management) with boring, reliable solution.

**Contrarian Edge**: While others build AI features, we build AI infrastructure. Nobody else is making gear curation MCP-ready.

**Infrastructure Play**: Perfect. We're not competing with AI assistants - we're enabling them all. Shopify/Stripe model applied to gear curation.

**Questions Codie Would Ask**:
- "Is this picks-and-shovels?" *Answer: 100% yes - we enable every AI assistant, not compete with them*
- "Would this still be valuable if one platform disappeared?" *Answer: Yes, open standard with multiple adopters*
- "Are we the essential plumbing?" *Answer: Yes - the canonical gear reference that AI talks to*

**Verdict**: APPROVED - This is infrastructure thinking at its best. Enables everyone, depends on no one.

---

### Board Summary

| Advisor | Score | Verdict |
|---------|-------|---------|
| Daniel Priestley | 9/10 | APPROVED |
| Julie Zhuo | 8/10 | APPROVED |
| Li Jin | 10/10 | APPROVED |
| Emily Heyward | 7/10 | NEEDS WORK (language) |
| Codie Sanchez | 10/10 | APPROVED |

**Board Decision**: 4/5 APPROVED - Ship with attention to brand language in tool responses.

**Key Recommendations**:
1. Prioritize Phase 1 for rapid deployment
2. Review tool response language with brand guidelines
3. Document OAuth consent flow for user trust
4. Announce alongside Claude Desktop configuration guide
5. Register with MCP Registry immediately upon launch

---

## Appendix A: MCP Resources

### Official Documentation
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Registry](https://mcp.so/)

### Security References
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- [OAuth 2.1 for MCP](https://www.scalekit.com/blog/implement-oauth-for-mcp-servers)
- [MCP Authorization Guide](https://stytch.com/blog/MCP-authentication-and-authorization-guide/)

### Comparable Servers
- [Knowledge Base MCP Server](https://github.com/jeanibarz/knowledge-base-mcp-server)
- [Notion MCP Server](https://github.com/modelcontextprotocol/servers)
- [Readwise Reader MCP](https://mcp.so/server/knowledge-base-mcp-server)

### Teed Internal References
- `/app/api/gpt/` - Existing GPT API implementation
- `/lib/gptAuth.ts` - OAuth session handling
- `/docs/DOCTRINE_DEVELOPMENT_PLAN.md` - Product principles

---

## Appendix B: Sample Tool Response Formats

### Successful Bag Creation
```json
{
  "success": true,
  "bag": {
    "code": "tournament-ready",
    "title": "Tournament Ready",
    "url": "https://teed.club/u/golfpro/tournament-ready",
    "item_count": 0
  },
  "message": "Created 'Tournament Ready' bag. Ready to add items."
}
```

### Item Added
```json
{
  "success": true,
  "item": {
    "id": "uuid-here",
    "name": "Titleist TSR3 Driver",
    "brand": "Titleist",
    "bag_code": "tournament-ready"
  },
  "bag_item_count": 1,
  "message": "Added Titleist TSR3 Driver to your bag."
}
```

### Search Results
```json
{
  "query": "wildlife photography Sony",
  "results": [
    {
      "type": "bag",
      "code": "bird-photography-kit",
      "title": "Bird Photography Kit",
      "owner": "@wildlifepro",
      "item_count": 8,
      "url": "https://teed.club/u/wildlifepro/bird-photography-kit"
    }
  ],
  "total_count": 7,
  "message": "Found 7 bags matching 'wildlife photography Sony'"
}
```

---

*Strategic Plan v1.0 - January 2026*
*For internal planning and advisory review*
