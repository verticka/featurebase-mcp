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
