// src/tools/contacts.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CONTACTS_TOOLS: Tool[] = [
  {
    name: 'list_contacts',
    description: 'List all contacts with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
        contactType: { type: 'string', description: 'Filter by contact type' },
      },
    },
  },
  {
    name: 'create_or_update_contact',
    description: 'Create or update a contact (upsert by userId or email)',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        userId: { type: 'string', description: 'External user ID (takes precedence over email for identification)' },
        userHash: { type: 'string', description: 'HMAC-SHA256 hash for identity verification' },
        profilePicture: { type: 'string' },
        phone: { type: 'string' },
        locale: { type: 'string' },
        subscribedToChangelog: { type: 'boolean' },
        customFields: { type: 'object' },
        companies: { type: 'array', items: { type: 'object' } },
        createdAt: { type: 'string', description: 'ISO 8601' },
      },
    },
  },
  {
    name: 'get_contact',
    description: 'Get a contact by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_contact',
    description: 'Delete a contact by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_contact_by_user_id',
    description: 'Get a contact by external user ID',
    inputSchema: {
      type: 'object', required: ['userId'],
      properties: { userId: { type: 'string', description: 'External user ID from your system' } },
    },
  },
  {
    name: 'delete_contact_by_user_id',
    description: 'Delete a contact by external user ID',
    inputSchema: {
      type: 'object', required: ['userId'],
      properties: { userId: { type: 'string' } },
    },
  },
  {
    name: 'block_contact',
    description: 'Block a contact (prevent them from submitting feedback)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'unblock_contact',
    description: 'Unblock a previously blocked contact',
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

export async function handleContacts(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_contacts':
        return responseOk(await client.get('/v2/contacts', buildParams(args, ['limit', 'cursor', 'contactType'])));
      case 'create_or_update_contact': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/contacts', body));
      }
      case 'get_contact':
        return responseOk(await client.get(`/v2/contacts/${args.id}`, {}));
      case 'delete_contact':
        return responseOk(await client.delete(`/v2/contacts/${args.id}`));
      case 'get_contact_by_user_id':
        return responseOk(await client.get(`/v2/contacts/by-user-id/${args.userId}`, {}));
      case 'delete_contact_by_user_id':
        return responseOk(await client.delete(`/v2/contacts/by-user-id/${args.userId}`));
      case 'block_contact':
        return responseOk(await client.post(`/v2/contacts/${args.id}/block`, {}));
      case 'unblock_contact':
        return responseOk(await client.post(`/v2/contacts/${args.id}/unblock`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
