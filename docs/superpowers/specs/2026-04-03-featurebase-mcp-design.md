# Design: featurebase-mcp

**Date**: 2026-04-03  
**Status**: Approved

---

## Objective

Create an MCP (Model Context Protocol) server in TypeScript/Node.js that exposes the Featurebase REST API as tools usable by a LLM (Claude). The server follows the same architecture pattern as vosfactures-mcp. Primary use cases: automatic documentation generation (Help Center articles) and changelog management with audience targeting.

---

## Configuration

One environment variable required at startup:

| Variable | Description | Example |
|---|---|---|
| `FEATUREBASE_API_KEY` | Bearer API key from Featurebase integration settings | `fb_live_xxxxxxxxxxxx` |

The server exits cleanly at startup if the variable is missing, with an explicit error message.

---

## Authentication

Every request sends two headers:

```
Authorization: Bearer <api-key>
Featurebase-Version: 2026-01-01.nova
```

Base URL: `https://do.featurebase.app`

---

## Project Structure

```
featurebase-mcp/
├── src/
│   ├── index.ts              # Entry point: MCP server init, tool registration
│   ├── client.ts             # Centralized HTTP client (fetch + Bearer auth + version header)
│   ├── types.ts              # Shared TypeScript types
│   └── tools/
│       ├── boards.ts         # Boards (read-only)
│       ├── posts.ts          # Posts + voters
│       ├── post_statuses.ts  # Post statuses (read-only)
│       ├── comments.ts       # Comments
│       ├── changelogs.ts     # Changelogs + publish/unpublish + subscribers
│       ├── contacts.ts       # Contacts + block/unblock
│       ├── companies.ts      # Companies + attached contacts
│       ├── help_center.ts    # Help centers, collections, articles, redirect rules
│       ├── custom_fields.ts  # Custom fields (read-only)
│       ├── surveys.ts        # Surveys + responses (read-only)
│       ├── admins.ts         # Admins + roles (read-only)
│       ├── teams.ts          # Teams (read-only)
│       ├── brands.ts         # Brands (read-only)
│       ├── conversations.ts  # Conversations + reply + participants
│       └── webhooks.ts       # Webhooks (full CRUD, lower priority)
├── docs/
│   └── superpowers/specs/
│       └── 2026-04-03-featurebase-mcp-design.md
├── API_README.json           # Official Featurebase API reference (OpenAPI spec)
├── package.json
├── tsconfig.json
└── README.md
```

---

## HTTP Client (`client.ts`)

Class `FeaturebaseClient` that:
- Injects `Authorization: Bearer <api-key>` and `Featurebase-Version: 2026-01-01.nova` on every request
- Uses fixed base URL `https://do.featurebase.app`
- Exposes typed `get`, `post`, `patch`, `delete` methods
- Returns structured errors with HTTP status code

---

## MCP Tools

All tool names, descriptions, and error messages are in **English**.

### Boards (read-only)
- `list_boards` — list all boards
- `get_board` — get a board by ID

### Posts
- `list_posts` — list with filters (board, status, search, cursor pagination)
- `create_post` — create a new post
- `get_post` — get a post by ID
- `update_post` — partial update
- `delete_post` — delete by ID
- `list_post_voters` — list voters on a post
- `add_post_voter` — add a voter to a post
- `remove_post_voter` — remove a voter from a post

### Post Statuses (read-only)
- `list_post_statuses` — list all statuses
- `get_post_status` — get a status by ID

### Comments
- `list_comments` — list comments
- `create_comment` — create a comment
- `get_comment` — get a comment by ID
- `update_comment` — partial update
- `delete_comment` — delete by ID

### Changelogs
- `list_changelogs` — list all changelogs
- `create_changelog` — create a new changelog
- `get_changelog` — get by ID
- `update_changelog` — partial update
- `delete_changelog` — delete by ID
- `publish_changelog` — publish (with optional email notification)
- `unpublish_changelog` — revert to draft
- `add_changelog_subscribers` — add contacts as subscribers
- `remove_changelog_subscribers` — remove subscribers

### Contacts
- `list_contacts` — list with pagination
- `create_or_update_contact` — upsert by external user ID
- `get_contact` — get by ID
- `delete_contact` — delete by ID
- `get_contact_by_user_id` — get by external user ID
- `delete_contact_by_user_id` — delete by external user ID
- `block_contact` — block a contact
- `unblock_contact` — unblock a contact

### Companies
- `list_companies` — list all companies
- `create_or_update_company` — upsert by external company ID
- `get_company` — get by ID
- `delete_company` — delete by ID
- `delete_company_by_company_id` — delete by external company ID
- `list_company_contacts` — list contacts attached to a company
- `attach_contact_to_company` — attach a contact
- `remove_contact_from_company` — detach a contact

### Help Center
- `list_help_centers` — list help centers (read-only)
- `get_help_center` — get by ID (read-only)
- `list_collections` — list collections
- `create_collection` — create a collection
- `get_collection` — get by ID
- `update_collection` — partial update
- `delete_collection` — delete by ID
- `list_articles` — list articles
- `create_article` — create an article
- `get_article` — get by ID
- `update_article` — partial update
- `delete_article` — delete by ID
- `list_redirect_rules` — list redirect rules
- `create_redirect_rule` — create a redirect rule
- `get_redirect_rule` — get by ID
- `get_redirect_rule_by_url` — get by URL
- `update_redirect_rule` — partial update
- `delete_redirect_rule` — delete by ID

### Custom Fields (read-only)
- `list_custom_fields` — list custom fields
- `get_custom_field` — get by ID

### Surveys (read-only)
- `list_surveys` — list surveys
- `get_survey` — get by ID
- `get_survey_responses` — get responses for a survey

### Admins (read-only)
- `list_admins` — list admins
- `get_admin` — get by ID
- `list_admin_roles` — list admin roles

### Teams (read-only)
- `list_teams` — list all teams
- `get_team` — get by ID

### Brands (read-only)
- `list_brands` — list all brands
- `get_brand` — get by ID

### Conversations
- `list_conversations` — list conversations
- `create_conversation` — create a new conversation
- `get_conversation` — get by ID
- `update_conversation` — partial update
- `delete_conversation` — delete by ID
- `reply_to_conversation` — send a reply
- `add_conversation_participant` — add a contact
- `remove_conversation_participant` — remove a contact
- `redact_conversation_part` — redact a message

### Webhooks (lower priority)
- `list_webhooks` — list webhooks
- `create_webhook` — create a webhook
- `get_webhook` — get by ID
- `update_webhook` — partial update
- `delete_webhook` — delete by ID
- `refresh_webhook_secret` — regenerate signing secret

---

## Error Handling

- English error messages with HTTP status
- Examples: `"Post not found (404)"`, `"Invalid API key (401)"`, `"Validation error (422): field 'title' is required"`
- API errors are propagated when they contain a useful message
- Missing env variable triggers explicit error at startup

---

## npm Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Watch mode with `tsx watch` |
| `npm start` | Run `dist/index.js` |
| `npm test` | Run tests with vitest |

---

## Claude Desktop Configuration

### Production (after build)

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

### Development (with tsx, no build)

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

---

## GitHub Publication

- Public repository with detailed README listing all supported resources
- `package.json` with `bin` pointing to `dist/index.js` for `npx` support
- `API_README.json` included as official Featurebase API reference
