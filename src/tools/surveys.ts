// src/tools/surveys.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const SURVEYS_TOOLS: Tool[] = [
  {
    name: 'list_surveys',
    description: 'List all surveys in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_survey',
    description: 'Get a survey by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_survey_responses',
    description: 'Get all responses for a survey',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: {
        id: { type: 'string', description: 'Survey ID' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
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

export async function handleSurveys(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_surveys':
        return responseOk(await client.get('/v2/surveys', {}));
      case 'get_survey':
        return responseOk(await client.get(`/v2/surveys/${args.id}`, {}));
      case 'get_survey_responses':
        return responseOk(await client.get(`/v2/surveys/${args.id}/responses`, buildParams(args, ['limit', 'cursor'])));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
