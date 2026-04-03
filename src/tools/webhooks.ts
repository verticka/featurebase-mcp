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
