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
