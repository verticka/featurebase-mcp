# featurebase-mcp

MCP (Model Context Protocol) server for the [Featurebase](https://featurebase.app) API. Expose all Featurebase resources as tools usable by Claude and other LLMs.

## Features

- **Posts** — create, read, update, delete, manage voters
- **Boards** — list and read boards
- **Post Statuses** — list and read statuses
- **Comments** — full CRUD on post and changelog comments
- **Changelogs** — create, publish, manage subscribers and audiences
- **Contacts** — upsert, read, delete, block/unblock
- **Companies** — upsert, read, delete, manage attached contacts
- **Help Center** — collections, articles (auto-generate docs!), redirect rules
- **Custom Fields** — read custom field definitions
- **Surveys** — read surveys and responses
- **Admins & Teams** — read organization members
- **Conversations** — full inbox management
- **Webhooks** — full CRUD + secret refresh

## Setup

### 1. Get your API key

In Featurebase, go to **Settings → Integrations → API** and copy your API key.

### 2. Configure Claude Desktop

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "npx",
      "args": ["tsx", "/path/to/featurebase-mcp/src/index.ts"],
      "env": {
        "FEATUREBASE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or after building:

```json
{
  "mcpServers": {
    "featurebase": {
      "command": "node",
      "args": ["/path/to/featurebase-mcp/dist/index.js"],
      "env": {
        "FEATUREBASE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run dev      # watch mode, no build needed
npm run build    # compile to dist/
npm test         # run tests
```
