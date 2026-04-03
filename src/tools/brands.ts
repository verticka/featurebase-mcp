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
