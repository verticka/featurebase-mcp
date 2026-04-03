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
