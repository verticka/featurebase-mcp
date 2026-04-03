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
