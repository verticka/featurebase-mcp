// src/tools/companies.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const COMPANIES_TOOLS: Tool[] = [
  {
    name: 'list_companies',
    description: 'List all companies with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'create_or_update_company',
    description: 'Create or update a company (upsert by companyId)',
    inputSchema: {
      type: 'object', required: ['companyId', 'name'],
      properties: {
        companyId: { type: 'string', description: 'External company ID from your system' },
        name: { type: 'string' },
        monthlySpend: { type: 'number' },
        industry: { type: 'string' },
        website: { type: 'string' },
        plan: { type: 'string' },
        companySize: { type: 'number' },
        createdAt: { type: 'string', description: 'ISO 8601' },
        customFields: { type: 'object' },
      },
    },
  },
  {
    name: 'get_company',
    description: 'Get a company by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_company',
    description: 'Delete a company by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'delete_company_by_company_id',
    description: 'Delete a company by external company ID',
    inputSchema: {
      type: 'object', required: ['companyId'],
      properties: { companyId: { type: 'string', description: 'External company ID' } },
    },
  },
  {
    name: 'list_company_contacts',
    description: 'List all contacts attached to a company',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'attach_contact_to_company',
    description: 'Attach a contact to a company',
    inputSchema: {
      type: 'object', required: ['id', 'contactId'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        contactId: { type: 'string', description: 'Contact ID to attach' },
      },
    },
  },
  {
    name: 'remove_contact_from_company',
    description: 'Remove a contact from a company',
    inputSchema: {
      type: 'object', required: ['id', 'contactId'],
      properties: {
        id: { type: 'string', description: 'Company ID' },
        contactId: { type: 'string', description: 'Contact ID to remove' },
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

export async function handleCompanies(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_companies':
        return responseOk(await client.get('/v2/companies', buildParams(args, ['limit', 'cursor'])));
      case 'create_or_update_company': {
        const { ...body } = args;
        return responseOk(await client.post('/v2/companies', body));
      }
      case 'get_company':
        return responseOk(await client.get(`/v2/companies/${args.id}`, {}));
      case 'delete_company':
        return responseOk(await client.delete(`/v2/companies/${args.id}`));
      case 'delete_company_by_company_id':
        return responseOk(await client.delete(`/v2/companies/by-company-id/${args.companyId}`));
      case 'list_company_contacts':
        return responseOk(await client.get(`/v2/companies/${args.id}/contacts`, buildParams(args, ['limit', 'cursor'])));
      case 'attach_contact_to_company': {
        const { id, ...body } = args;
        return responseOk(await client.post(`/v2/companies/${id}/contacts`, body));
      }
      case 'remove_contact_from_company':
        return responseOk(await client.delete(`/v2/companies/${args.id}/contacts/${args.contactId}`));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
