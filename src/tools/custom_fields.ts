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
