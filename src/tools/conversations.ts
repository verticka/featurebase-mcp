// src/tools/conversations.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const CONVERSATIONS_TOOLS: Tool[] = [
  {
    name: 'list_conversations',
    description: 'List conversations (inbox/messenger)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_conversation',
    description: 'Create a new conversation',
    inputSchema: {
      type: 'object', required: ['from', 'bodyMarkdown'],
      properties: {
        from: { type: 'object', description: 'Author: { type: "contact", userId: "..." } or { type: "admin", adminId: "..." }' },
        bodyMarkdown: { type: 'string', description: 'Initial message content in Markdown' },
        channel: { type: 'string', description: 'Channel: "desktop" (default), "email"' },
        subject: { type: 'string', description: 'Email subject (required when channel is "email")' },
        recipients: { type: 'object', description: 'Recipients for admin-initiated outreach' },
        createdAt: { type: 'string', description: 'ISO 8601 timestamp' },
      },
    },
  },
  {
    name: 'get_conversation',
    description: 'Get a conversation by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'update_conversation',
    description: 'Update a conversation (e.g. mark as resolved)',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string' },
        state: { type: 'string', description: 'Conversation state (e.g. open, resolved)' },
        assigneeId: { type: 'string', description: 'Admin ID to assign the conversation to' },
      },
    },
  },
  {
    name: 'delete_conversation',
    description: 'Delete a conversation by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'reply_to_conversation',
    description: 'Send a reply to a conversation',
    inputSchema: {
      type: 'object', required: ['id', 'bodyMarkdown'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        bodyMarkdown: { type: 'string', description: 'Reply content in Markdown' },
        from: { type: 'object', description: 'Reply author' },
      },
    },
  },
  {
    name: 'add_conversation_participant',
    description: 'Add a contact as a participant in a conversation',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        contactId: { type: 'string' },
        userId: { type: 'string', description: 'External user ID' },
      },
    },
  },
  {
    name: 'remove_conversation_participant',
    description: 'Remove a contact from a conversation',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Conversation ID' },
        contactId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  },
  {
    name: 'redact_conversation_part',
    description: 'Redact (hide) a specific part/message in a conversation',
    inputSchema: {
      type: 'object', required: ['conversationId', 'partId'],
      properties: {
        conversationId: { type: 'string' },
        partId: { type: 'string', description: 'Message part ID to redact' },
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

export async function handleConversations(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_conversations':
        return responseOk(await client.get('/v2/conversations', buildParams(args, ['limit', 'cursor'])));
      case 'create_conversation': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/conversations', body));
      }
      case 'get_conversation':
        return responseOk(await client.get(`/v2/conversations/${args.id}`, {}));
      case 'update_conversation': {
        const { id, ...body } = args;
        return responseOk(await client.patch(`/v2/conversations/${id}`, body));
      }
      case 'delete_conversation':
        return responseOk(await client.delete(`/v2/conversations/${args.id}`));
      case 'reply_to_conversation': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/conversations/${id}/reply`, body));
      }
      case 'add_conversation_participant': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/conversations/${id}/participants`, body));
      }
      case 'remove_conversation_participant': {
        const { id, ...body } = args;
        return responseOk(await client.delete(`/v2/conversations/${id}/participants`, Object.keys(body).length ? body : undefined));
      }
      case 'redact_conversation_part': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/conversations/redact', body));
      }
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
