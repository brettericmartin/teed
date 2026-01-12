# Teed MCP Server

Enable AI assistants to manage your gear bags through the Model Context Protocol.

## Features

- **Bag Management**: Create, list, update, and delete gear bags
- **Item Operations**: Add, update, move, copy, and remove items
- **Search & Discovery**: Find public bags and items across the Teed community
- **Resources**: Read your profile and bag contents directly into AI context
- **Prompts**: Pre-built templates for common gear management tasks

## Installation

### For Claude Desktop

Add this to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json` on macOS/Linux):

```json
{
  "mcpServers": {
    "teed": {
      "command": "npx",
      "args": ["-y", "@teed/mcp-server"],
      "env": {
        "TEED_SUPABASE_URL": "https://jvljmfdroozexzodqupg.supabase.co",
        "TEED_SUPABASE_ANON_KEY": "your_anon_key",
        "TEED_USER_ID": "your_user_id",
        "TEED_ACCESS_TOKEN": "your_access_token"
      }
    }
  }
}
```

### From Source

```bash
# Clone the repo
git clone https://github.com/teed-club/teed.git
cd teed/packages/mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## Available Tools

### Bag Management

| Tool | Description |
|------|-------------|
| `list_my_bags` | Get all your bags with item counts |
| `get_bag` | Get detailed bag contents |
| `create_bag` | Create a new gear bag |
| `update_bag` | Update bag title, description, or visibility |
| `delete_bag` | Permanently delete a bag |

### Item Operations

| Tool | Description |
|------|-------------|
| `add_item_to_bag` | Add a new item to a bag |
| `update_item` | Update item details |
| `remove_item_from_bag` | Remove an item |
| `move_item_to_bag` | Move an item between bags |
| `copy_item_to_bag` | Copy an item (even from public bags) |

### Search & Discovery

| Tool | Description |
|------|-------------|
| `discover_featured_bags` | Get featured bags curated by Teed |
| `search_bags` | Search public bags |
| `search_items` | Search items across public bags |
| `get_user_public_bags` | Browse a user's public bags |

### Export & Content

| Tool | Description |
|------|-------------|
| `export_bag_youtube` | Export as YouTube video description with gear links |
| `export_bag_newsletter` | Export as styled HTML for email newsletters |
| `export_bag_markdown` | Export as Markdown for blogs, Notion, docs |
| `export_bag_text` | Export as plain text for quick sharing |

## Resources

| URI | Description |
|-----|-------------|
| `teed://profile` | Your Teed profile |
| `teed://bags` | List of all your bags |
| `teed://bags/{code}` | Contents of a specific bag |

## Prompts

| Prompt | Description |
|--------|-------------|
| `quick_add_gear` | Add multiple items at once |
| `review_bag` | Get suggestions for your bag |
| `compare_bags` | Compare two bags side-by-side |
| `export_for_content` | Format bag for YouTube, newsletter, etc. |

## Example Conversations

### Adding Gear

```
User: "Add a Sony A7IV and Sony 24-70mm f/2.8 to my photography bag"

Claude: [Calls add_item_to_bag twice]
        Added both items to your 'Photography' bag!
        - Sony A7IV
        - Sony 24-70mm f/2.8 GM

        Your bag now has 8 items.
```

### Finding Recommendations

```
User: "What wedges do other golfers use on Teed?"

Claude: [Calls search_items with query='wedge' category='golf']
        Looking at 47 public golf bags, the most popular wedges are:
        1. Titleist Vokey SM9/10 (38%)
        2. Cleveland RTX 6 ZipCore (24%)
        3. Callaway Jaws Raw (18%)

        Would you like me to show bags from specific creators?
```

### Exporting for Content

```
User: "Generate a YouTube description for my home office bag"

Claude: [Calls get_bag, then formats content]
        Here's your YouTube description:

        🖥️ My Home Office Setup 2026

        DESK:
        • LG 27GP950-B 4K Monitor - https://...
        • Fully Jarvis Standing Desk - https://...

        See the full setup: https://teed.club/u/creator/home-office

        #homeoffice #desksetup #wfh
```

## Authentication

The MCP server requires authentication to access your private bags and perform write operations.

### Getting Your MCP Token

1. Sign in to [Teed](https://teed.club)
2. Visit `https://teed.club/api/auth/mcp/token` while logged in
3. Copy the provided configuration to your Claude Desktop config file

The token endpoint returns a complete configuration snippet ready to paste into your Claude Desktop settings.

### Manual Configuration

If you need to configure manually, you'll need:

1. **TEED_USER_ID**: Your Teed user ID
2. **TEED_ACCESS_TOKEN**: Your MCP access token (starts with `teed_mcp_`)

Public bag browsing and search work without authentication.

## HTTP Transport (Web Clients)

For web-based MCP clients, Teed provides an HTTP endpoint:

```
GET  /api/mcp          - List available tools
POST /api/mcp          - Call a tool
```

### Example Request

```bash
curl -X POST https://teed.club/api/mcp \
  -H "Authorization: Bearer teed_mcp_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_bags",
      "arguments": { "query": "golf", "limit": 5 }
    }
  }'
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{ "type": "text", "text": "..." }]
  }
}
```

## Development

```bash
# Watch mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT

## Links

- [Teed](https://teed.club)
- [MCP Specification](https://modelcontextprotocol.io)
- [Report Issues](https://github.com/teed-club/teed/issues)
