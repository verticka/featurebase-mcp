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
        return responseOk(await client.delete('/v2/changelogs/subscribers', Object.keys(body).length ? body : undefined));
      }
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
