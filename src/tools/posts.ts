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
