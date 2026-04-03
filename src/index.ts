// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { createClient } from './client.js';
import { BOARDS_TOOLS, handleBoards } from './tools/boards.js';
import { POSTS_TOOLS, handlePosts } from './tools/posts.js';
import { POST_STATUSES_TOOLS, handlePostStatuses } from './tools/post_statuses.js';
import { COMMENTS_TOOLS, handleComments } from './tools/comments.js';
import { CHANGELOGS_TOOLS, handleChangelogs } from './tools/changelogs.js';
import { CONTACTS_TOOLS, handleContacts } from './tools/contacts.js';
import { COMPANIES_TOOLS, handleCompanies } from './tools/companies.js';
import { HELP_CENTER_TOOLS, handleHelpCenter } from './tools/help_center.js';
import { CUSTOM_FIELDS_TOOLS, handleCustomFields } from './tools/custom_fields.js';
import { SURVEYS_TOOLS, handleSurveys } from './tools/surveys.js';
import { ADMINS_TOOLS, handleAdmins } from './tools/admins.js';
import { TEAMS_TOOLS, handleTeams } from './tools/teams.js';
import { BRANDS_TOOLS, handleBrands } from './tools/brands.js';
import { CONVERSATIONS_TOOLS, handleConversations } from './tools/conversations.js';
import { WEBHOOKS_TOOLS, handleWebhooks } from './tools/webhooks.js';

const ALL_TOOLS = [
  ...BOARDS_TOOLS,
  ...POSTS_TOOLS,
  ...POST_STATUSES_TOOLS,
  ...COMMENTS_TOOLS,
  ...CHANGELOGS_TOOLS,
  ...CONTACTS_TOOLS,
  ...COMPANIES_TOOLS,
  ...HELP_CENTER_TOOLS,
  ...CUSTOM_FIELDS_TOOLS,
  ...SURVEYS_TOOLS,
  ...ADMINS_TOOLS,
  ...TEAMS_TOOLS,
  ...BRANDS_TOOLS,
  ...CONVERSATIONS_TOOLS,
  ...WEBHOOKS_TOOLS,
];

async function main() {
  const client = createClient();

  const server = new Server(
    { name: 'featurebase-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, unknown>;

    if (BOARDS_TOOLS.some(t => t.name === name)) return handleBoards(name, a, client) as unknown as CallToolResult;
    if (POSTS_TOOLS.some(t => t.name === name)) return handlePosts(name, a, client) as unknown as CallToolResult;
    if (POST_STATUSES_TOOLS.some(t => t.name === name)) return handlePostStatuses(name, a, client) as unknown as CallToolResult;
    if (COMMENTS_TOOLS.some(t => t.name === name)) return handleComments(name, a, client) as unknown as CallToolResult;
    if (CHANGELOGS_TOOLS.some(t => t.name === name)) return handleChangelogs(name, a, client) as unknown as CallToolResult;
    if (CONTACTS_TOOLS.some(t => t.name === name)) return handleContacts(name, a, client) as unknown as CallToolResult;
    if (COMPANIES_TOOLS.some(t => t.name === name)) return handleCompanies(name, a, client) as unknown as CallToolResult;
    if (HELP_CENTER_TOOLS.some(t => t.name === name)) return handleHelpCenter(name, a, client) as unknown as CallToolResult;
    if (CUSTOM_FIELDS_TOOLS.some(t => t.name === name)) return handleCustomFields(name, a, client) as unknown as CallToolResult;
    if (SURVEYS_TOOLS.some(t => t.name === name)) return handleSurveys(name, a, client) as unknown as CallToolResult;
    if (ADMINS_TOOLS.some(t => t.name === name)) return handleAdmins(name, a, client) as unknown as CallToolResult;
    if (TEAMS_TOOLS.some(t => t.name === name)) return handleTeams(name, a, client) as unknown as CallToolResult;
    if (BRANDS_TOOLS.some(t => t.name === name)) return handleBrands(name, a, client) as unknown as CallToolResult;
    if (CONVERSATIONS_TOOLS.some(t => t.name === name)) return handleConversations(name, a, client) as unknown as CallToolResult;
    if (WEBHOOKS_TOOLS.some(t => t.name === name)) return handleWebhooks(name, a, client) as unknown as CallToolResult;

    return {
      content: [{ type: 'text', text: `Error: unknown tool "${name}"` }],
      isError: true,
    } as unknown as CallToolResult;
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
