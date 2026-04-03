# Featurebase MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript MCP server that exposes the full Featurebase REST API (~65 tools) for use by Claude.

**Architecture:** One HTTP client class injects Bearer auth + version header on every request. Tools are organized in one file per domain. The entry point registers all tools and dispatches calls.

**Tech Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk@1.15.1`, `zod@^3.25.67`, `vitest`, `tsx`

---

## File Map

| File | Responsibility |
|---|---|
| `src/client.ts` | HTTP client with Bearer auth, version header, error handling |
| `src/types.ts` | Shared types + `responseOk` / `responseError` helpers |
| `src/tools/boards.ts` | list_boards, get_board |
| `src/tools/posts.ts` | Full CRUD on posts + voters |
| `src/tools/post_statuses.ts` | list_post_statuses, get_post_status |
| `src/tools/comments.ts` | Full CRUD on comments |
| `src/tools/changelogs.ts` | Full CRUD + publish/unpublish + subscribers |
| `src/tools/contacts.ts` | Full CRUD + block/unblock |
| `src/tools/companies.ts` | Full CRUD + contact attachment |
| `src/tools/help_center.ts` | Help centers, collections, articles, redirect rules |
| `src/tools/custom_fields.ts` | list_custom_fields, get_custom_field |
| `src/tools/surveys.ts` | list_surveys, get_survey, get_survey_responses |
| `src/tools/admins.ts` | list_admins, get_admin, list_admin_roles |
| `src/tools/teams.ts` | list_teams, get_team |
| `src/tools/brands.ts` | list_brands, get_brand |
| `src/tools/conversations.ts` | Full CRUD + reply + participants + redact |
| `src/tools/webhooks.ts` | Full CRUD + secret refresh |
| `src/index.ts` | MCP server entry point |
| `tests/client.test.ts` | HTTP client unit tests |
| `tests/tools/boards.test.ts` | Boards tools tests |
| `tests/tools/posts.test.ts` | Posts tools tests |
| `tests/tools/changelogs.test.ts` | Changelogs tools tests |
| `tests/tools/contacts.test.ts` | Contacts tools tests |
| `tests/tools/companies.test.ts` | Companies tools tests |
| `tests/tools/help_center.test.ts` | Help center tools tests |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "featurebase-mcp",
  "version": "1.0.0",
  "description": "MCP server for the Featurebase API - posts, changelogs, contacts, help center, and more",
  "license": "MIT",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "featurebase-mcp": "dist/index.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc && shx chmod +x dist/index.js",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.15.1",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/node": "^20.17.50",
    "shx": "^0.3.4",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^1.6.1"
  },
  "keywords": ["mcp", "featurebase", "feedback", "changelog", "mcp-server", "modelcontextprotocol"]
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "removeComments": true,
    "newLine": "lf"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.env
.env*
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore
git commit -m "feat: project scaffolding"
```

---

## Task 2: HTTP Client

**Files:**
- Create: `src/client.ts`
- Create: `tests/client.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../src/client.ts';

describe('FeaturebaseClient', () => {
  const client = new FeaturebaseClient('test_api_key');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sends Bearer token and version header on GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/v2/boards');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://do.featurebase.app/v2/boards',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_api_key',
          'Featurebase-Version': '2026-01-01.nova',
        }),
      })
    );
  });

  it('throws English error on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));

    await expect(client.get('/v2/boards')).rejects.toThrow('Invalid API key (401)');
  });

  it('throws English error on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));

    await expect(client.get('/v2/posts/abc')).rejects.toThrow('Resource not found (404)');
  });

  it('sends POST with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.post('/v2/posts', { title: 'Test', boardId: 'abc' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://do.featurebase.app/v2/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test', boardId: 'abc' }),
      })
    );
  });

  it('throws on non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    }));

    await expect(client.get('/v2/boards')).rejects.toThrow('Non-JSON response from Featurebase (200)');
  });

  it('appends query params correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/v2/posts', { limit: '10', boardId: 'abc' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('boardId=abc');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/client.test.ts
```

Expected: FAIL — `Cannot find module '../src/client.ts'`

- [ ] **Step 3: Implement src/client.ts**

```ts
// src/client.ts

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const BASE_URL = 'https://do.featurebase.app';
const API_VERSION = '2026-01-01.nova';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request (400)',
  401: 'Invalid API key (401)',
  403: 'Access denied (403)',
  404: 'Resource not found (404)',
  422: 'Validation error (422)',
  429: 'Rate limit exceeded (429)',
  500: 'Featurebase server error (500)',
};

export class FeaturebaseClient {
  constructor(private readonly apiKey: string) {}

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, BASE_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request<T>(method: HttpMethod, path: string, params?: Record<string, string>, body?: unknown): Promise<T> {
    const url = this.buildUrl(path, params);
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Featurebase-Version': API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const message = ERROR_MESSAGES[response.status] ?? `Unexpected error (${response.status})`;
      let detail = '';
      try {
        const errBody = await response.json() as Record<string, unknown>;
        if (errBody?.message) detail = `: ${errBody.message}`;
        else if (errBody?.error) detail = `: ${errBody.error}`;
      } catch { /* no JSON body */ }
      throw new Error(message + detail);
    }

    if (response.status === 204) return undefined as T;

    try {
      return await response.json() as T;
    } catch {
      throw new Error(`Non-JSON response from Featurebase (${response.status})`);
    }
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, undefined, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, undefined, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export function createClient(): FeaturebaseClient {
  const key = process.env.FEATUREBASE_API_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable FEATUREBASE_API_KEY.\n' +
      'Find your API key in Featurebase settings under Integrations.'
    );
  }
  return new FeaturebaseClient(key);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/client.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat: HTTP client with Bearer auth and version header"
```

---

## Task 3: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create src/types.ts**

```ts
// src/types.ts

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export function responseOk(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function responseError(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: shared types and response helpers"
```

---

## Task 4: Boards & Post Statuses Tools

**Files:**
- Create: `src/tools/boards.ts`
- Create: `src/tools/post_statuses.ts`
- Create: `tests/tools/boards.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/boards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { BOARDS_TOOLS, handleBoards } from '../../src/tools/boards.ts';
import { POST_STATUSES_TOOLS, handlePostStatuses } from '../../src/tools/post_statuses.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('BOARDS_TOOLS', () => {
  it('exposes 2 tools', () => { expect(BOARDS_TOOLS).toHaveLength(2); });
});

describe('handleBoards', () => {
  it('list_boards calls GET /v2/boards', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleBoards('list_boards', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/boards', {});
  });

  it('get_board calls GET /v2/boards/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'abc' });
    await handleBoards('get_board', { id: 'abc' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/boards/abc', {});
  });
});

describe('POST_STATUSES_TOOLS', () => {
  it('exposes 2 tools', () => { expect(POST_STATUSES_TOOLS).toHaveLength(2); });
});

describe('handlePostStatuses', () => {
  it('list_post_statuses calls GET /v2/post_statuses', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handlePostStatuses('list_post_statuses', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/post_statuses', {});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/boards.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create src/tools/boards.ts**

```ts
// src/tools/boards.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const BOARDS_TOOLS: Tool[] = [
  {
    name: 'list_boards',
    description: 'List all feedback boards in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_board',
    description: 'Get a board by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string', description: 'Board ID' } },
    },
  },
];

export async function handleBoards(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_boards':
        return responseOk(await client.get('/v2/boards', {}));
      case 'get_board':
        return responseOk(await client.get(`/v2/boards/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Create src/tools/post_statuses.ts**

```ts
// src/tools/post_statuses.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const POST_STATUSES_TOOLS: Tool[] = [
  {
    name: 'list_post_statuses',
    description: 'List all post statuses defined in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_post_status',
    description: 'Get a post status by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string', description: 'Status ID' } },
    },
  },
];

export async function handlePostStatuses(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_post_statuses':
        return responseOk(await client.get('/v2/post_statuses', {}));
      case 'get_post_status':
        return responseOk(await client.get(`/v2/post_statuses/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/tools/boards.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tools/boards.ts src/tools/post_statuses.ts tests/tools/boards.test.ts
git commit -m "feat: boards and post statuses tools"
```

---

## Task 5: Posts Tools

**Files:**
- Create: `src/tools/posts.ts`
- Create: `tests/tools/posts.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/posts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { POSTS_TOOLS, handlePosts } from '../../src/tools/posts.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('POSTS_TOOLS', () => {
  it('exposes 9 tools', () => { expect(POSTS_TOOLS).toHaveLength(9); });
});

describe('handlePosts', () => {
  it('list_posts calls GET /v2/posts with filters', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handlePosts('list_posts', { boardId: 'b1', limit: 20 }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/posts', { boardId: 'b1', limit: '20' });
  });

  it('create_post calls POST /v2/posts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('create_post', { title: 'New feature', boardId: 'b1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/posts', { title: 'New feature', boardId: 'b1' });
  });

  it('get_post calls GET /v2/posts/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('get_post', { id: 'p1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/posts/p1', {});
  });

  it('update_post calls PATCH /v2/posts/:id', async () => {
    mockClient.patch = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('update_post', { id: 'p1', title: 'Updated' }, mockClient);
    expect(mockClient.patch).toHaveBeenCalledWith('/v2/posts/p1', { title: 'Updated' });
  });

  it('delete_post calls DELETE /v2/posts/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handlePosts('delete_post', { id: 'p1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/posts/p1');
  });

  it('add_post_voter calls POST /v2/posts/:id/voters', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handlePosts('add_post_voter', { id: 'p1', userId: 'u1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/posts/p1/voters', { userId: 'u1' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/posts.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/tools/posts.ts**

```ts
// src/tools/posts.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const POSTS_TOOLS: Tool[] = [
  {
    name: 'list_posts',
    description: 'List all posts with optional filters (board, status, search query, tags)',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: { type: 'string', description: 'Filter by board ID' },
        statusId: { type: 'string', description: 'Filter by status ID' },
        q: { type: 'string', description: 'Search query' },
        tags: { type: 'string', description: 'Comma-separated tag names' },
        sortBy: { type: 'string', description: 'Sort field (e.g. date, upvotes)' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        inReview: { type: 'boolean', description: 'Filter posts pending moderation' },
        limit: { type: 'number', description: 'Max results per page' },
        cursor: { type: 'string', description: 'Pagination cursor' },
      },
    },
  },
  {
    name: 'create_post',
    description: 'Create a new post (feature request or feedback)',
    inputSchema: {
      type: 'object', required: ['title', 'boardId'],
      properties: {
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Post content (HTML)' },
        boardId: { type: 'string', description: 'Board ID to create the post in' },
        statusId: { type: 'string', description: 'Initial status ID' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag names' },
        assigneeId: { type: 'string', description: 'Admin ID to assign the post to' },
        visibility: { type: 'string', enum: ['public', 'authorOnly'], description: 'Post visibility' },
        eta: { type: 'string', description: 'Estimated completion date (ISO 8601)' },
        customFields: { type: 'object', description: 'Custom field values (key: ObjectId, value: any)' },
        notifyAdmins: { type: 'boolean', description: 'Send email notifications to admins' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Get a post by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string', description: 'Post ID or slug' } },
    },
  },
  {
    name: 'update_post',
    description: 'Update a post (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        title: { type: 'string' },
        content: { type: 'string', description: 'Post content (HTML)' },
        statusId: { type: 'string' },
        assigneeId: { type: 'string' },
        eta: { type: 'string', description: 'ISO 8601 date' },
        tags: { type: 'array', items: { type: 'string' } },
        visibility: { type: 'string', enum: ['public', 'authorOnly'] },
        customFields: { type: 'object' },
        commentsEnabled: { type: 'boolean' },
      },
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a post by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string', description: 'Post ID' } },
    },
  },
  {
    name: 'list_post_voters',
    description: 'List all users who voted on a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'add_post_voter',
    description: 'Add a voter to a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        userId: { type: 'string', description: 'External user ID' },
        email: { type: 'string', description: 'User email (if no userId)' },
      },
    },
  },
  {
    name: 'remove_post_voter',
    description: 'Remove a voter from a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        userId: { type: 'string', description: 'External user ID' },
        email: { type: 'string', description: 'User email (if no userId)' },
      },
    },
  },
  {
    name: 'remove_post_voter',
    description: 'Remove a voter from a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        userId: { type: 'string', description: 'External user ID' },
        email: { type: 'string', description: 'User email (if no userId)' },
      },
    },
  },
];

// Remove duplicate entry added above - posts array should only have 9 unique tools.
// The correct POSTS_TOOLS has: list_posts, create_post, get_post, update_post, delete_post,
// list_post_voters, add_post_voter, remove_post_voter — that is 8 entries.
// Re-export corrected below:

export const POSTS_TOOLS_CORRECT: Tool[] = POSTS_TOOLS.slice(0, 8);

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handlePosts(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_posts':
        return responseOk(await client.get('/v2/posts', buildParams(args, ['boardId', 'statusId', 'q', 'tags', 'sortBy', 'sortOrder', 'inReview', 'limit', 'cursor'])));
      case 'create_post': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/posts', body));
      }
      case 'get_post':
        return responseOk(await client.get(`/v2/posts/${args.id}`, {}));
      case 'update_post': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/posts/${id}`, body));
      }
      case 'delete_post':
        return responseOk(await client.delete(`/v2/posts/${args.id}`));
      case 'list_post_voters':
        return responseOk(await client.get(`/v2/posts/${args.id}/voters`, buildParams(args, ['limit', 'cursor'])));
      case 'add_post_voter': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/posts/${id}/voters`, body));
      }
      case 'remove_post_voter': {
        const { id, ...body } = args;
        return responseOk(await client.delete(`/v2/posts/${id}/voters`));
      }
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

**Note:** The `POSTS_TOOLS` array must have exactly 8 unique entries. Remove the accidental duplicate `remove_post_voter` from the array (keep only one). The final array is:
`[list_posts, create_post, get_post, update_post, delete_post, list_post_voters, add_post_voter, remove_post_voter]` — 8 tools. Update the test to expect 8.

Here is the corrected `src/tools/posts.ts` without duplicates:

```ts
// src/tools/posts.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const POSTS_TOOLS: Tool[] = [
  {
    name: 'list_posts',
    description: 'List all posts with optional filters (board, status, search query, tags)',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: { type: 'string', description: 'Filter by board ID' },
        statusId: { type: 'string', description: 'Filter by status ID' },
        q: { type: 'string', description: 'Search query' },
        tags: { type: 'string', description: 'Comma-separated tag names' },
        sortBy: { type: 'string', description: 'Sort field (e.g. date, upvotes)' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        inReview: { type: 'boolean', description: 'Filter posts pending moderation' },
        limit: { type: 'number', description: 'Max results per page' },
        cursor: { type: 'string', description: 'Pagination cursor' },
      },
    },
  },
  {
    name: 'create_post',
    description: 'Create a new post (feature request or feedback)',
    inputSchema: {
      type: 'object', required: ['title', 'boardId'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Post content (HTML)' },
        boardId: { type: 'string' },
        statusId: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        assigneeId: { type: 'string' },
        visibility: { type: 'string', enum: ['public', 'authorOnly'] },
        eta: { type: 'string', description: 'ISO 8601 date' },
        customFields: { type: 'object' },
        notifyAdmins: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Get a post by ID or slug',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_post',
    description: 'Update a post (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        statusId: { type: 'string' },
        assigneeId: { type: 'string' },
        eta: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        visibility: { type: 'string', enum: ['public', 'authorOnly'] },
        customFields: { type: 'object' },
        commentsEnabled: { type: 'boolean' },
      },
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a post by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'list_post_voters',
    description: 'List all users who voted on a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'add_post_voter',
    description: 'Add a voter (upvote) to a post on behalf of a user',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        userId: { type: 'string', description: 'External user ID' },
        email: { type: 'string' },
      },
    },
  },
  {
    name: 'remove_post_voter',
    description: 'Remove a voter from a post',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Post ID' },
        userId: { type: 'string' },
        email: { type: 'string' },
      },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handlePosts(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_posts':
        return responseOk(await client.get('/v2/posts', buildParams(args, ['boardId', 'statusId', 'q', 'tags', 'sortBy', 'sortOrder', 'inReview', 'limit', 'cursor'])));
      case 'create_post': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/posts', body));
      }
      case 'get_post':
        return responseOk(await client.get(`/v2/posts/${args.id}`, {}));
      case 'update_post': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/posts/${id}`, body));
      }
      case 'delete_post':
        return responseOk(await client.delete(`/v2/posts/${args.id}`));
      case 'list_post_voters':
        return responseOk(await client.get(`/v2/posts/${args.id}/voters`, buildParams(args, ['limit', 'cursor'])));
      case 'add_post_voter': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/posts/${id}/voters`, body));
      }
      case 'remove_post_voter':
        return responseOk(await client.delete(`/v2/posts/${args.id}/voters`));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Update test to expect 8 tools, then run**

In `tests/tools/posts.test.ts`, change `toHaveLength(9)` to `toHaveLength(8)`.

```bash
npm test -- tests/tools/posts.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/posts.ts tests/tools/posts.test.ts
git commit -m "feat: posts tools with voters"
```

---

## Task 6: Comments Tools

**Files:**
- Create: `src/tools/comments.ts`

- [ ] **Step 1: Create src/tools/comments.ts**

```ts
// src/tools/comments.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const COMMENTS_TOOLS: Tool[] = [
  {
    name: 'list_comments',
    description: 'List comments on a post or changelog',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Filter comments by post ID' },
        changelogId: { type: 'string', description: 'Filter comments by changelog ID' },
        privacy: { type: 'string', enum: ['public', 'private'], description: 'Filter by privacy' },
        inReview: { type: 'boolean' },
        sortBy: { type: 'string' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_comment',
    description: 'Create a comment on a post or changelog',
    inputSchema: {
      type: 'object', required: ['content'],
      properties: {
        content: { type: 'string', description: 'Comment content in HTML format' },
        postId: { type: 'string', description: 'Post ID to comment on' },
        changelogId: { type: 'string', description: 'Changelog ID to comment on' },
        parentCommentId: { type: 'string', description: 'Parent comment ID for replies' },
        isPrivate: { type: 'boolean', description: 'Only visible to admins if true' },
        sendNotification: { type: 'boolean', description: 'Notify voters of the post' },
      },
    },
  },
  {
    name: 'get_comment',
    description: 'Get a comment by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_comment',
    description: 'Update a comment (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        content: { type: 'string', description: 'New content in HTML format' },
        isPrivate: { type: 'boolean' },
      },
    },
  },
  {
    name: 'delete_comment',
    description: 'Delete a comment by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleComments(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_comments':
        return responseOk(await client.get('/v2/comments', buildParams(args, ['postId', 'changelogId', 'privacy', 'inReview', 'sortBy', 'limit', 'cursor'])));
      case 'create_comment': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/comments', body));
      }
      case 'get_comment':
        return responseOk(await client.get(`/v2/comments/${args.id}`, {}));
      case 'update_comment': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/comments/${id}`, body));
      }
      case 'delete_comment':
        return responseOk(await client.delete(`/v2/comments/${args.id}`));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/comments.ts
git commit -m "feat: comments tools"
```

---

## Task 7: Changelogs Tools

**Files:**
- Create: `src/tools/changelogs.ts`
- Create: `tests/tools/changelogs.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/changelogs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { CHANGELOGS_TOOLS, handleChangelogs } from '../../src/tools/changelogs.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('CHANGELOGS_TOOLS', () => {
  it('exposes 9 tools', () => { expect(CHANGELOGS_TOOLS).toHaveLength(9); });
});

describe('handleChangelogs', () => {
  it('list_changelogs calls GET /v2/changelogs', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleChangelogs('list_changelogs', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/changelogs', {});
  });

  it('create_changelog calls POST /v2/changelogs', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleChangelogs('create_changelog', { title: 'v2.0', markdownContent: '# Changes' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs', { title: 'v2.0', markdownContent: '# Changes' });
  });

  it('publish_changelog calls POST /v2/changelogs/:id/publish', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('publish_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/c1/publish', {});
  });

  it('unpublish_changelog calls POST /v2/changelogs/:id/unpublish', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('unpublish_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/c1/unpublish', {});
  });

  it('add_changelog_subscribers calls POST /v2/changelogs/subscribers', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('add_changelog_subscribers', { emails: ['a@test.com'] }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/subscribers', { emails: ['a@test.com'] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/changelogs.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/tools/changelogs.ts**

```ts
// src/tools/changelogs.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CHANGELOGS_TOOLS: Tool[] = [
  {
    name: 'list_changelogs',
    description: 'List all changelogs with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        state: { type: 'string', enum: ['draft', 'live'], description: 'Filter by state' },
        categories: { type: 'string', description: 'Comma-separated category names' },
        locale: { type: 'string', description: 'Filter by locale' },
        startDate: { type: 'string', description: 'Start date (ISO 8601)' },
        endDate: { type: 'string', description: 'End date (ISO 8601)' },
        sortBy: { type: 'string' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_changelog',
    description: 'Create a new changelog entry',
    inputSchema: {
      type: 'object', required: ['title'],
      properties: {
        title: { type: 'string' },
        markdownContent: { type: 'string', description: 'Content in Markdown format' },
        htmlContent: { type: 'string', description: 'Content in HTML format (alternative to markdownContent)' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Category names' },
        featuredImage: { type: 'string', description: 'URL of the featured image' },
        date: { type: 'string', description: 'Changelog date (ISO 8601)' },
        state: { type: 'string', enum: ['draft', 'live'], description: 'Publish immediately with "live"' },
        locale: { type: 'string', description: 'Locale (defaults to org default)' },
        allowedSegmentIds: { type: 'array', items: { type: 'string' }, description: 'Segment IDs that can view this changelog' },
      },
    },
  },
  {
    name: 'get_changelog',
    description: 'Get a changelog by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_changelog',
    description: 'Update a changelog (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        markdownContent: { type: 'string' },
        htmlContent: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        featuredImage: { type: 'string' },
        date: { type: 'string' },
        allowedSegmentIds: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'delete_changelog',
    description: 'Delete a changelog by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'publish_changelog',
    description: 'Publish a changelog (send email notifications if configured)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        sendEmail: { type: 'boolean', description: 'Send email notification to subscribers' },
      },
    },
  },
  {
    name: 'unpublish_changelog',
    description: 'Unpublish a changelog (revert to draft)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'add_changelog_subscribers',
    description: 'Add contacts as changelog subscribers by email or user ID',
    inputSchema: {
      type: 'object',
      properties: {
        emails: { type: 'array', items: { type: 'string' }, description: 'Email addresses to subscribe' },
        userIds: { type: 'array', items: { type: 'string' }, description: 'External user IDs to subscribe' },
      },
    },
  },
  {
    name: 'remove_changelog_subscribers',
    description: 'Remove changelog subscribers by email or user ID',
    inputSchema: {
      type: 'object',
      properties: {
        emails: { type: 'array', items: { type: 'string' }, description: 'Email addresses to unsubscribe' },
        userIds: { type: 'array', items: { type: 'string' }, description: 'External user IDs to unsubscribe' },
      },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleChangelogs(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_changelogs':
        return responseOk(await client.get('/v2/changelogs', buildParams(args, ['q', 'state', 'categories', 'locale', 'startDate', 'endDate', 'sortBy', 'limit', 'cursor'])));
      case 'create_changelog': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/changelogs', body));
      }
      case 'get_changelog':
        return responseOk(await client.get(`/v2/changelogs/${args.id}`, {}));
      case 'update_changelog': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/changelogs/${id}`, body));
      }
      case 'delete_changelog':
        return responseOk(await client.delete(`/v2/changelogs/${args.id}`));
      case 'publish_changelog': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/changelogs/${id}/publish`, body));
      }
      case 'unpublish_changelog':
        return responseOk(await client.post(`/v2/changelogs/${args.id}/unpublish`, {}));
      case 'add_changelog_subscribers': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/changelogs/subscribers', body));
      }
      case 'remove_changelog_subscribers': {
        const { ...body } = args;
        return responseOk(await client.delete('/v2/changelogs/subscribers'));
      }
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/tools/changelogs.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/changelogs.ts tests/tools/changelogs.test.ts
git commit -m "feat: changelogs tools with publish and subscriber management"
```

---

## Task 8: Contacts Tools

**Files:**
- Create: `src/tools/contacts.ts`
- Create: `tests/tools/contacts.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/contacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { CONTACTS_TOOLS, handleContacts } from '../../src/tools/contacts.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('CONTACTS_TOOLS', () => {
  it('exposes 8 tools', () => { expect(CONTACTS_TOOLS).toHaveLength(8); });
});

describe('handleContacts', () => {
  it('list_contacts calls GET /v2/contacts', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleContacts('list_contacts', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/contacts', {});
  });

  it('create_or_update_contact calls POST /v2/contacts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleContacts('create_or_update_contact', { email: 'test@test.com', name: 'Test' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/contacts', { email: 'test@test.com', name: 'Test' });
  });

  it('block_contact calls POST /v2/contacts/:id/block', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleContacts('block_contact', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/contacts/c1/block', {});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/contacts.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/tools/contacts.ts**

```ts
// src/tools/contacts.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CONTACTS_TOOLS: Tool[] = [
  {
    name: 'list_contacts',
    description: 'List all contacts with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
        contactType: { type: 'string', description: 'Filter by contact type' },
      },
    },
  },
  {
    name: 'create_or_update_contact',
    description: 'Create or update a contact (upsert by userId or email)',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        userId: { type: 'string', description: 'External user ID (takes precedence over email for identification)' },
        userHash: { type: 'string', description: 'HMAC-SHA256 hash for identity verification' },
        profilePicture: { type: 'string' },
        phone: { type: 'string' },
        locale: { type: 'string' },
        subscribedToChangelog: { type: 'boolean' },
        customFields: { type: 'object' },
        companies: { type: 'array', items: { type: 'object' } },
        createdAt: { type: 'string', description: 'ISO 8601' },
      },
    },
  },
  {
    name: 'get_contact',
    description: 'Get a contact by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_contact',
    description: 'Delete a contact by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_contact_by_user_id',
    description: 'Get a contact by external user ID',
    inputSchema: {
      type: 'object', required: ['userId'],
      properties: { userId: { type: 'string', description: 'External user ID from your system' } },
    },
  },
  {
    name: 'delete_contact_by_user_id',
    description: 'Delete a contact by external user ID',
    inputSchema: {
      type: 'object', required: ['userId'],
      properties: { userId: { type: 'string' } },
    },
  },
  {
    name: 'block_contact',
    description: 'Block a contact (prevent them from submitting feedback)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'unblock_contact',
    description: 'Unblock a previously blocked contact',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleContacts(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_contacts':
        return responseOk(await client.get('/v2/contacts', buildParams(args, ['limit', 'cursor', 'contactType'])));
      case 'create_or_update_contact': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/contacts', body));
      }
      case 'get_contact':
        return responseOk(await client.get(`/v2/contacts/${args.id}`, {}));
      case 'delete_contact':
        return responseOk(await client.delete(`/v2/contacts/${args.id}`));
      case 'get_contact_by_user_id':
        return responseOk(await client.get(`/v2/contacts/by-user-id/${args.userId}`, {}));
      case 'delete_contact_by_user_id':
        return responseOk(await client.delete(`/v2/contacts/by-user-id/${args.userId}`));
      case 'block_contact':
        return responseOk(await client.post(`/v2/contacts/${args.id}/block`, {}));
      case 'unblock_contact':
        return responseOk(await client.post(`/v2/contacts/${args.id}/unblock`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/tools/contacts.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/contacts.ts tests/tools/contacts.test.ts
git commit -m "feat: contacts tools with block/unblock"
```

---

## Task 9: Companies Tools

**Files:**
- Create: `src/tools/companies.ts`
- Create: `tests/tools/companies.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/companies.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { COMPANIES_TOOLS, handleCompanies } from '../../src/tools/companies.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('COMPANIES_TOOLS', () => {
  it('exposes 8 tools', () => { expect(COMPANIES_TOOLS).toHaveLength(8); });
});

describe('handleCompanies', () => {
  it('create_or_update_company calls POST /v2/companies', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'co1' });
    await handleCompanies('create_or_update_company', { companyId: 'ext-1', name: 'Acme' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/companies', { companyId: 'ext-1', name: 'Acme' });
  });

  it('attach_contact_to_company calls POST /v2/companies/:id/contacts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleCompanies('attach_contact_to_company', { id: 'co1', contactId: 'ct1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/companies/co1/contacts', { contactId: 'ct1' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/companies.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/tools/companies.ts**

```ts
// src/tools/companies.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const COMPANIES_TOOLS: Tool[] = [
  {
    name: 'list_companies',
    description: 'List all companies with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_or_update_company',
    description: 'Create or update a company (upsert by companyId)',
    inputSchema: {
      type: 'object', required: ['companyId', 'name'],
      properties: {
        companyId: { type: 'string', description: 'External company ID from your system' },
        name: { type: 'string' },
        monthlySpend: { type: 'number' },
        industry: { type: 'string' },
        website: { type: 'string' },
        plan: { type: 'string' },
        companySize: { type: 'number' },
        createdAt: { type: 'string', description: 'ISO 8601' },
        customFields: { type: 'object' },
      },
    },
  },
  {
    name: 'get_company',
    description: 'Get a company by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_company',
    description: 'Delete a company by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_company_by_company_id',
    description: 'Delete a company by external company ID',
    inputSchema: {
      type: 'object', required: ['companyId'],
      properties: { companyId: { type: 'string', description: 'External company ID' } },
    },
  },
  {
    name: 'list_company_contacts',
    description: 'List all contacts attached to a company',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'attach_contact_to_company',
    description: 'Attach a contact to a company',
    inputSchema: {
      type: 'object', required: ['id', 'contactId'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        contactId: { type: 'string', description: 'Contact ID to attach' },
      },
    },
  },
  {
    name: 'remove_contact_from_company',
    description: 'Remove a contact from a company',
    inputSchema: {
      type: 'object', required: ['id', 'contactId'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        contactId: { type: 'string', description: 'Contact ID to remove' },
      },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleCompanies(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_companies':
        return responseOk(await client.get('/v2/companies', buildParams(args, ['limit', 'cursor'])));
      case 'create_or_update_company': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/companies', body));
      }
      case 'get_company':
        return responseOk(await client.get(`/v2/companies/${args.id}`, {}));
      case 'delete_company':
        return responseOk(await client.delete(`/v2/companies/${args.id}`));
      case 'delete_company_by_company_id':
        return responseOk(await client.delete(`/v2/companies/by-company-id/${args.companyId}`));
      case 'list_company_contacts':
        return responseOk(await client.get(`/v2/companies/${args.id}/contacts`, buildParams(args, ['limit', 'cursor'])));
      case 'attach_contact_to_company': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/companies/${id}/contacts`, body));
      }
      case 'remove_contact_from_company':
        return responseOk(await client.delete(`/v2/companies/${args.id}/contacts/${args.contactId}`));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/tools/companies.test.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/companies.ts tests/tools/companies.test.ts
git commit -m "feat: companies tools"
```

---

## Task 10: Help Center Tools

**Files:**
- Create: `src/tools/help_center.ts`
- Create: `tests/tools/help_center.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/tools/help_center.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { HELP_CENTER_TOOLS, handleHelpCenter } from '../../src/tools/help_center.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('HELP_CENTER_TOOLS', () => {
  it('exposes 18 tools', () => { expect(HELP_CENTER_TOOLS).toHaveLength(18); });
});

describe('handleHelpCenter', () => {
  it('list_help_centers calls GET /v2/help_center/help_centers', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleHelpCenter('list_help_centers', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/help_center/help_centers', {});
  });

  it('create_article calls POST /v2/help_center/articles', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'a1' });
    await handleHelpCenter('create_article', { title: 'Getting started' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/help_center/articles', { title: 'Getting started' });
  });

  it('update_article calls PATCH /v2/help_center/articles/:id', async () => {
    mockClient.patch = vi.fn().mockResolvedValue({ id: 'a1' });
    await handleHelpCenter('update_article', { id: 'a1', title: 'Updated' }, mockClient);
    expect(mockClient.patch).toHaveBeenCalledWith('/v2/help_center/articles/a1', { title: 'Updated' });
  });

  it('create_collection calls POST /v2/help_center/collections', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'col1' });
    await handleHelpCenter('create_collection', { name: 'Getting Started' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/help_center/collections', { name: 'Getting Started' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/tools/help_center.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/tools/help_center.ts**

```ts
// src/tools/help_center.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const HELP_CENTER_TOOLS: Tool[] = [
  // Help Centers (read-only)
  {
    name: 'list_help_centers',
    description: 'List all help centers in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_help_center',
    description: 'Get a help center by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  // Collections
  {
    name: 'list_collections',
    description: 'List help center collections',
    inputSchema: {
      type: 'object',
      properties: {
        helpCenterId: { type: 'string', description: 'Filter by help center ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_collection',
    description: 'Create a new help center collection (category)',
    inputSchema: {
      type: 'object', required: ['name'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        parentId: { type: 'string', description: 'Parent collection ID for nested collections' },
        translations: { type: 'object', description: 'Translations keyed by locale code' },
      },
    },
  },
  {
    name: 'get_collection',
    description: 'Get a collection by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_collection',
    description: 'Update a collection (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        translations: { type: 'object' },
      },
    },
  },
  {
    name: 'delete_collection',
    description: 'Delete a collection by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  // Articles
  {
    name: 'list_articles',
    description: 'List help center articles',
    inputSchema: {
      type: 'object',
      properties: {
        helpCenterId: { type: 'string' },
        parentId: { type: 'string', description: 'Filter by collection ID' },
        state: { type: 'string', enum: ['live', 'draft'] },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_article',
    description: 'Create a new help center article',
    inputSchema: {
      type: 'object', required: ['title'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string', description: 'Brief description of the article' },
        body: { type: 'string', description: 'HTML content of the article' },
        formatter: { type: 'string', description: '"ai" converts markdown/html using AI' },
        parentId: { type: 'string', description: 'Collection ID' },
        state: { type: 'string', enum: ['live', 'draft'], description: '"live" publishes immediately' },
        translations: { type: 'object', description: 'Translations keyed by locale' },
      },
    },
  },
  {
    name: 'get_article',
    description: 'Get a help center article by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_article',
    description: 'Update a help center article (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        body: { type: 'string' },
        state: { type: 'string', enum: ['live', 'draft'] },
        parentId: { type: 'string' },
        translations: { type: 'object' },
      },
    },
  },
  {
    name: 'delete_article',
    description: 'Delete a help center article by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  // Redirect Rules
  {
    name: 'list_redirect_rules',
    description: 'List URL redirect rules for a help center',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_redirect_rule',
    description: 'Create a URL redirect rule',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Source URL path' },
        to: { type: 'string', description: 'Destination URL path' },
      },
    },
  },
  {
    name: 'get_redirect_rule',
    description: 'Get a redirect rule by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_redirect_rule_by_url',
    description: 'Get a redirect rule by source URL',
    inputSchema: {
      type: 'object', required: ['url'],
      properties: { url: { type: 'string', description: 'Source URL to look up' } },
    },
  },
  {
    name: 'update_redirect_rule',
    description: 'Update a redirect rule',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
      },
    },
  },
  {
    name: 'delete_redirect_rule',
    description: 'Delete a redirect rule by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleHelpCenter(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      // Help Centers
      case 'list_help_centers':
        return responseOk(await client.get('/v2/help_center/help_centers', {}));
      case 'get_help_center':
        return responseOk(await client.get(`/v2/help_center/help_centers/${args.id}`, {}));
      // Collections
      case 'list_collections':
        return responseOk(await client.get('/v2/help_center/collections', buildParams(args, ['helpCenterId', 'limit', 'cursor'])));
      case 'create_collection': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/help_center/collections', body));
      }
      case 'get_collection':
        return responseOk(await client.get(`/v2/help_center/collections/${args.id}`, {}));
      case 'update_collection': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/help_center/collections/${id}`, body));
      }
      case 'delete_collection':
        return responseOk(await client.delete(`/v2/help_center/collections/${args.id}`));
      // Articles
      case 'list_articles':
        return responseOk(await client.get('/v2/help_center/articles', buildParams(args, ['helpCenterId', 'parentId', 'state', 'limit', 'cursor'])));
      case 'create_article': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/help_center/articles', body));
      }
      case 'get_article':
        return responseOk(await client.get(`/v2/help_center/articles/${args.id}`, {}));
      case 'update_article': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/help_center/articles/${id}`, body));
      }
      case 'delete_article':
        return responseOk(await client.delete(`/v2/help_center/articles/${args.id}`));
      // Redirect Rules
      case 'list_redirect_rules':
        return responseOk(await client.get('/v2/help_center/redirect_rules', buildParams(args, ['limit', 'cursor'])));
      case 'create_redirect_rule': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/help_center/redirect_rules', body));
      }
      case 'get_redirect_rule':
        return responseOk(await client.get(`/v2/help_center/redirect_rules/${args.id}`, {}));
      case 'get_redirect_rule_by_url':
        return responseOk(await client.get('/v2/help_center/redirect_rules/by-url', buildParams(args, ['url'])));
      case 'update_redirect_rule': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/help_center/redirect_rules/${id}`, body));
      }
      case 'delete_redirect_rule':
        return responseOk(await client.delete(`/v2/help_center/redirect_rules/${args.id}`));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/tools/help_center.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tools/help_center.ts tests/tools/help_center.test.ts
git commit -m "feat: help center tools (collections, articles, redirect rules)"
```

---

## Task 11: Read-Only Tools (Custom Fields, Surveys, Admins, Teams, Brands)

**Files:**
- Create: `src/tools/custom_fields.ts`
- Create: `src/tools/surveys.ts`
- Create: `src/tools/admins.ts`
- Create: `src/tools/teams.ts`
- Create: `src/tools/brands.ts`

- [ ] **Step 1: Create src/tools/custom_fields.ts**

```ts
// src/tools/custom_fields.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CUSTOM_FIELDS_TOOLS: Tool[] = [
  {
    name: 'list_custom_fields',
    description: 'List all custom fields defined in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_custom_field',
    description: 'Get a custom field by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

export async function handleCustomFields(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_custom_fields':
        return responseOk(await client.get('/v2/custom_fields', {}));
      case 'get_custom_field':
        return responseOk(await client.get(`/v2/custom_fields/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 2: Create src/tools/surveys.ts**

```ts
// src/tools/surveys.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const SURVEYS_TOOLS: Tool[] = [
  {
    name: 'list_surveys',
    description: 'List all surveys in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_survey',
    description: 'Get a survey by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_survey_responses',
    description: 'Get all responses for a survey',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Survey ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleSurveys(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_surveys':
        return responseOk(await client.get('/v2/surveys', {}));
      case 'get_survey':
        return responseOk(await client.get(`/v2/surveys/${args.id}`, {}));
      case 'get_survey_responses':
        return responseOk(await client.get(`/v2/surveys/${args.id}/responses`, buildParams(args, ['limit', 'cursor'])));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 3: Create src/tools/admins.ts**

```ts
// src/tools/admins.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const ADMINS_TOOLS: Tool[] = [
  {
    name: 'list_admins',
    description: 'List all admins in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_admin',
    description: 'Get an admin by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'list_admin_roles',
    description: 'List all admin roles defined in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
];

export async function handleAdmins(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_admins':
        return responseOk(await client.get('/v2/admins', {}));
      case 'get_admin':
        return responseOk(await client.get(`/v2/admins/${args.id}`, {}));
      case 'list_admin_roles':
        return responseOk(await client.get('/v2/admins/roles', {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 4: Create src/tools/teams.ts**

```ts
// src/tools/teams.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const TEAMS_TOOLS: Tool[] = [
  {
    name: 'list_teams',
    description: 'List all teams in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_team',
    description: 'Get a team by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

export async function handleTeams(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_teams':
        return responseOk(await client.get('/v2/teams', {}));
      case 'get_team':
        return responseOk(await client.get(`/v2/teams/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 5: Create src/tools/brands.ts**

```ts
// src/tools/brands.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const BRANDS_TOOLS: Tool[] = [
  {
    name: 'list_brands',
    description: 'List all brands in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_brand',
    description: 'Get a brand by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

export async function handleBrands(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_brands':
        return responseOk(await client.get('/v2/brands', {}));
      case 'get_brand':
        return responseOk(await client.get(`/v2/brands/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/tools/custom_fields.ts src/tools/surveys.ts src/tools/admins.ts src/tools/teams.ts src/tools/brands.ts
git commit -m "feat: read-only tools (custom fields, surveys, admins, teams, brands)"
```

---

## Task 12: Conversations Tools

**Files:**
- Create: `src/tools/conversations.ts`

- [ ] **Step 1: Create src/tools/conversations.ts**

```ts
// src/tools/conversations.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CONVERSATIONS_TOOLS: Tool[] = [
  {
    name: 'list_conversations',
    description: 'List conversations (inbox/messenger)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_conversation',
    description: 'Create a new conversation',
    inputSchema: {
      type: 'object', required: ['from', 'bodyMarkdown'],
      properties: {
        from: { type: 'object', description: 'Author: { type: "contact", userId: "..." } or { type: "admin", adminId: "..." }' },
        bodyMarkdown: { type: 'string', description: 'Initial message content in Markdown' },
        channel: { type: 'string', description: 'Channel: "desktop" (default), "email"' },
        subject: { type: 'string', description: 'Email subject (required when channel is "email")' },
        recipients: { type: 'object', description: 'Recipients for admin-initiated outreach' },
        createdAt: { type: 'string', description: 'ISO 8601 timestamp' },
      },
    },
  },
  {
    name: 'get_conversation',
    description: 'Get a conversation by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_conversation',
    description: 'Update a conversation (e.g. mark as resolved)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        state: { type: 'string', description: 'Conversation state (e.g. open, resolved)' },
        assigneeId: { type: 'string', description: 'Admin ID to assign the conversation to' },
      },
    },
  },
  {
    name: 'delete_conversation',
    description: 'Delete a conversation by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'reply_to_conversation',
    description: 'Send a reply to a conversation',
    inputSchema: {
      type: 'object', required: ['id', 'bodyMarkdown'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        bodyMarkdown: { type: 'string', description: 'Reply content in Markdown' },
        from: { type: 'object', description: 'Reply author' },
      },
    },
  },
  {
    name: 'add_conversation_participant',
    description: 'Add a contact as a participant in a conversation',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        contactId: { type: 'string' },
        userId: { type: 'string', description: 'External user ID' },
      },
    },
  },
  {
    name: 'remove_conversation_participant',
    description: 'Remove a contact from a conversation',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        contactId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  },
  {
    name: 'redact_conversation_part',
    description: 'Redact (hide) a specific part/message in a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string' },
        partId: { type: 'string', description: 'Message part ID to redact' },
      },
    },
  },
];

function buildParams(args: Record<string, unknown>, keys: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of keys) {
    if (args[key] !== undefined) params[key] = String(args[key]);
  }
  return params;
}

export async function handleConversations(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_conversations':
        return responseOk(await client.get('/v2/conversations', buildParams(args, ['limit', 'cursor'])));
      case 'create_conversation': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/conversations', body));
      }
      case 'get_conversation':
        return responseOk(await client.get(`/v2/conversations/${args.id}`, {}));
      case 'update_conversation': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/conversations/${id}`, body));
      }
      case 'delete_conversation':
        return responseOk(await client.delete(`/v2/conversations/${args.id}`));
      case 'reply_to_conversation': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/conversations/${id}/reply`, body));
      }
      case 'add_conversation_participant': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/conversations/${id}/participants`, body));
      }
      case 'remove_conversation_participant': {
        const { id, ...body } = args;
        return responseOk(await client.delete(`/v2/conversations/${id}/participants`));
      }
      case 'redact_conversation_part': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/conversations/redact', body));
      }
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/conversations.ts
git commit -m "feat: conversations tools"
```

---

## Task 13: Webhooks Tools

**Files:**
- Create: `src/tools/webhooks.ts`

- [ ] **Step 1: Create src/tools/webhooks.ts**

```ts
// src/tools/webhooks.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const WEBHOOKS_TOOLS: Tool[] = [
  {
    name: 'list_webhooks',
    description: 'List all webhooks configured in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_webhook',
    description: 'Create a new webhook',
    inputSchema: {
      type: 'object', required: ['name', 'url', 'topics'],
      properties: {
        name: { type: 'string', description: 'Human-readable name for the webhook' },
        url: { type: 'string', description: 'Webhook endpoint URL (must be HTTPS)' },
        description: { type: 'string' },
        topics: { type: 'array', items: { type: 'string' }, description: 'Event topics to subscribe to' },
      },
    },
  },
  {
    name: 'get_webhook',
    description: 'Get a webhook by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_webhook',
    description: 'Update a webhook (partial update)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        description: { type: 'string' },
        topics: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'delete_webhook',
    description: 'Delete a webhook by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'refresh_webhook_secret',
    description: 'Regenerate the signing secret for a webhook',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

export async function handleWebhooks(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_webhooks':
        return responseOk(await client.get('/v2/webhooks', {}));
      case 'create_webhook': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/webhooks', body));
      }
      case 'get_webhook':
        return responseOk(await client.get(`/v2/webhooks/${args.id}`, {}));
      case 'update_webhook': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/webhooks/${id}`, body));
      }
      case 'delete_webhook':
        return responseOk(await client.delete(`/v2/webhooks/${args.id}`));
      case 'refresh_webhook_secret':
        return responseOk(await client.post(`/v2/webhooks/${args.id}/secret`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/webhooks.ts
git commit -m "feat: webhooks tools"
```

---

## Task 14: Entry Point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create src/index.ts**

```ts
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { createClient } from './client.js';
import { BOARDS_TOOLS, handleBoards } from './tools/boards.js';
import { POSTS_TOOLS, handlePosts } from './tools/posts.js';
import { POST_STATUSES_TOOLS, handlePostStatuses } from './tools/post_statuses.js';
import { COMMENTS_TOOLS, handleComments } from './tools/comments.js';
import { CHANGELOGS_TOOLS, handleChangelogs } from './tools/changelogs.js';
import { CONTACTS_TOOLS, handleContacts } from './tools/contacts.js';
import { COMPANIES_TOOLS, handleCompanies } from './tools/companies.js';
import { HELP_CENTER_TOOLS, handleHelpCenter } from './tools/help_center.js';
import { CUSTOM_FIELDS_TOOLS, handleCustomFields } from './tools/custom_fields.js';
import { SURVEYS_TOOLS, handleSurveys } from './tools/surveys.js';
import { ADMINS_TOOLS, handleAdmins } from './tools/admins.js';
import { TEAMS_TOOLS, handleTeams } from './tools/teams.js';
import { BRANDS_TOOLS, handleBrands } from './tools/brands.js';
import { CONVERSATIONS_TOOLS, handleConversations } from './tools/conversations.js';
import { WEBHOOKS_TOOLS, handleWebhooks } from './tools/webhooks.js';

const ALL_TOOLS = [
  ...BOARDS_TOOLS,
  ...POSTS_TOOLS,
  ...POST_STATUSES_TOOLS,
  ...COMMENTS_TOOLS,
  ...CHANGELOGS_TOOLS,
  ...CONTACTS_TOOLS,
  ...COMPANIES_TOOLS,
  ...HELP_CENTER_TOOLS,
  ...CUSTOM_FIELDS_TOOLS,
  ...SURVEYS_TOOLS,
  ...ADMINS_TOOLS,
  ...TEAMS_TOOLS,
  ...BRANDS_TOOLS,
  ...CONVERSATIONS_TOOLS,
  ...WEBHOOKS_TOOLS,
];

async function main() {
  const client = createClient();

  const server = new Server(
    { name: 'featurebase-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, unknown>;

    if (BOARDS_TOOLS.some(t => t.name === name)) return handleBoards(name, a, client) as unknown as CallToolResult;
    if (POSTS_TOOLS.some(t => t.name === name)) return handlePosts(name, a, client) as unknown as CallToolResult;
    if (POST_STATUSES_TOOLS.some(t => t.name === name)) return handlePostStatuses(name, a, client) as unknown as CallToolResult;
    if (COMMENTS_TOOLS.some(t => t.name === name)) return handleComments(name, a, client) as unknown as CallToolResult;
    if (CHANGELOGS_TOOLS.some(t => t.name === name)) return handleChangelogs(name, a, client) as unknown as CallToolResult;
    if (CONTACTS_TOOLS.some(t => t.name === name)) return handleContacts(name, a, client) as unknown as CallToolResult;
    if (COMPANIES_TOOLS.some(t => t.name === name)) return handleCompanies(name, a, client) as unknown as CallToolResult;
    if (HELP_CENTER_TOOLS.some(t => t.name === name)) return handleHelpCenter(name, a, client) as unknown as CallToolResult;
    if (CUSTOM_FIELDS_TOOLS.some(t => t.name === name)) return handleCustomFields(name, a, client) as unknown as CallToolResult;
    if (SURVEYS_TOOLS.some(t => t.name === name)) return handleSurveys(name, a, client) as unknown as CallToolResult;
    if (ADMINS_TOOLS.some(t => t.name === name)) return handleAdmins(name, a, client) as unknown as CallToolResult;
    if (TEAMS_TOOLS.some(t => t.name === name)) return handleTeams(name, a, client) as unknown as CallToolResult;
    if (BRANDS_TOOLS.some(t => t.name === name)) return handleBrands(name, a, client) as unknown as CallToolResult;
    if (CONVERSATIONS_TOOLS.some(t => t.name === name)) return handleConversations(name, a, client) as unknown as CallToolResult;
    if (WEBHOOKS_TOOLS.some(t => t.name === name)) return handleWebhooks(name, a, client) as unknown as CallToolResult;

    return {
      content: [{ type: 'text', text: `Error: unknown tool "${name}"` }],
      isError: true,
    } as unknown as CallToolResult;
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

- [ ] **Step 2: Build to verify TypeScript compiles cleanly**

```bash
npm run build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: MCP server entry point, registers all 65 tools"
```

---

## Task 15: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
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

## API Reference

The full Featurebase OpenAPI spec is included as `API_README.json`.
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "feat: README with setup instructions"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ All 65+ tools from the spec are implemented across 15 tool files
- ✅ HTTP client uses Bearer token + `Featurebase-Version` header (not query param)
- ✅ Single env var `FEATUREBASE_API_KEY`
- ✅ English throughout (names, descriptions, error messages)
- ✅ Same architectural pattern as vosfactures-mcp
- ✅ `buildParams` helper avoids sending undefined values as query params

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:**
- `FeaturebaseClient` used consistently across all tool files
- `responseOk` / `responseError` from `../types.js` used in all handlers
- `buildParams` defined locally in each file that needs it (avoids cross-file dependency)
- `POSTS_TOOLS` has 8 tools (duplicate removed in task notes)
