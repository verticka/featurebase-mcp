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
      case 'create_comment':
        return responseOk(await client.post('/v2/comments', args));
      case 'get_comment':
        return responseOk(await client.get(`/v2/comments/${args.id}`));
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
