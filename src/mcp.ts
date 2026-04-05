import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { relative } from 'node:path';
import { Workspace } from './index.js';
import type { Outcome } from './domain.js';

export function createMcpServer(cwd: string = process.cwd()) {
  const server = new Server(
    { name: 'method', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  const workspace = new Workspace(cwd);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'method_status',
          description: 'Get the current status of the METHOD workspace (backlog lanes, active cycles, legend health)',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'method_inbox',
          description: 'Capture a new raw idea into the inbox',
          inputSchema: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              legend: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['idea'],
          },
        },
        {
          name: 'method_pull',
          description: 'Promote a backlog item into the next numbered cycle',
          inputSchema: {
            type: 'object',
            properties: {
              item: { type: 'string' },
            },
            required: ['item'],
          },
        },
        {
          name: 'method_drift',
          description: 'Check active cycle playback questions against tests',
          inputSchema: {
            type: 'object',
            properties: {
              cycle: { type: 'string' },
            },
          },
        },
        {
          name: 'method_close',
          description: 'Close an active cycle into a retro',
          inputSchema: {
            type: 'object',
            properties: {
              cycle: { type: 'string' },
              driftCheck: { type: 'boolean' },
              outcome: { type: 'string', enum: ['hill-met', 'partial', 'not-met'] },
            },
            required: ['driftCheck', 'outcome'],
          },
        },
        {
          name: 'method_sync_ship',
          description: 'Perform the Ship Sync maneuver (update CHANGELOG.md and BEARING.md)',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'method_sync_github',
          description: 'Synchronize backlog with GitHub Issues',
          inputSchema: {
            type: 'object',
            properties: {
              push: { type: 'boolean', description: 'Update GitHub issues with local changes (default: true)' },
              pull: { type: 'boolean', description: 'Update local backlog with GitHub changes' },
            },
          },
        },
        {
          name: 'method_capture_witness',
          description: 'Automate terminal evidence capture for a cycle',
          inputSchema: {
            type: 'object',
            properties: {
              cycle: { type: 'string' },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    workspace.ensureInitialized();

    try {
      if (request.params.name === 'method_status') {
        const status = workspace.status();
        return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
      }

      if (request.params.name === 'method_inbox') {
        const args = request.params.arguments as { idea: string; legend?: string; title?: string };
        const path = workspace.captureIdea(args.idea, args.legend, args.title);
        return { content: [{ type: 'text', text: `Captured to ${relative(workspace.root, path)}` }] };
      }

      if (request.params.name === 'method_pull') {
        const args = request.params.arguments as { item: string };
        const cycle = workspace.pullItem(args.item);
        return { content: [{ type: 'text', text: `Pulled into ${cycle.name}\nDesign: ${relative(workspace.root, cycle.designDoc)}` }] };
      }

      if (request.params.name === 'method_drift') {
        const args = request.params.arguments as { cycle?: string } | undefined;
        const report = workspace.detectDrift(args?.cycle);
        return {
          content: [{ type: 'text', text: report.output }],
          isError: report.exitCode !== 0,
        };
      }

      if (request.params.name === 'method_close') {
        const args = request.params.arguments as { cycle?: string; driftCheck: boolean; outcome: Outcome };
        const cycle = workspace.closeCycle(args.cycle, args.driftCheck, args.outcome);
        return { content: [{ type: 'text', text: `Closed ${cycle.name}\nRetro: ${relative(workspace.root, cycle.retroDoc)}` }] };
      }

      if (request.params.name === 'method_sync_ship') {
        const result = workspace.shipSync();
        const text = [
          `Updated: ${result.updated.join(', ')}`,
          ...result.newShips.map((c) => `- Shipped ${c.name}`),
          result.newShips.length === 0 ? 'No new ships.' : '',
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      }

      if (request.params.name === 'method_sync_github') {
        const args = request.params.arguments as { push?: boolean; pull?: boolean } | undefined;
        const push = args?.push || (!args?.push && !args?.pull);
        const pull = args?.pull || false;

        const token = workspace.config.github_token;
        const repoFull = workspace.config.github_repo;

        if (!token || !repoFull || !repoFull.includes('/')) {
          throw new Error('GitHub configuration missing in .method.json or environment.');
        }

        const [owner, repo] = repoFull.split('/');
        const adapter = new GitHubAdapter({
          workspace,
          token,
          owner: owner!,
          repo: repo!,
        });

        const log: string[] = [];
        if (push) {
          const results = await adapter.pushBacklog();
          log.push(...results.filter(r => !r.skipped).map(r => `${r.action === 'create' ? 'Created' : 'Updated'} GitHub Issue #${r.issue?.number} from ${r.path}`));
        }
        if (pull) {
          const results = await adapter.pullBacklog();
          log.push(...results.filter(r => !r.skipped).map(r => `Pulled remote changes from GitHub Issue #${r.issue?.number} into ${r.path}`));
        }

        return { content: [{ type: 'text', text: log.join('\n') || 'No changes.' }] };
      }

      if (request.params.name === 'method_capture_witness') {
        const args = request.params.arguments as { cycle?: string } | undefined;
        const path = workspace.captureWitness(args?.cycle);
        return { content: [{ type: 'text', text: `Captured witness to ${relative(workspace.root, path)}` }] };
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text', text: message }], isError: true };
    }
  });

  return server;
}
