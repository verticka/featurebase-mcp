// src/tools/teams.ts
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { FeaturebaseClient } from '../client.js';
import { responseOk, responseError, type ToolResult } from '../types.js';

export const TEAMS_TOOLS: Tool[] = [
  {
    name: 'list_teams',
    description: 'List all teams in the organization',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_team',
    description: 'Get a team by ID',
    inputSchema: {
      type: 'object', required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

export async function handleTeams(
  name: string,
  args: Record<string, unknown>,
  client: FeaturebaseClient
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'list_teams':
        return responseOk(await client.get('/v2/teams', {}));
      case 'get_team':
        return responseOk(await client.get(`/v2/teams/${args.id}`, {}));
      default:
        return responseError(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return responseError(err instanceof Error ? err.message : String(err));
  }
}
