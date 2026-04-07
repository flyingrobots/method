import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { relative } from 'node:path';
import { Workspace } from './index.js';
import { GitHubAdapter } from './adapters/github.js';
import type { Outcome } from './domain.js';

const workspaceProperty = { workspace: { type: 'string' as const, description: 'Absolute path to the METHOD workspace root directory' } };

export function createMcpServer() {
  const server = new Server(
    { name: 'method', version: '0.3.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'method_status',
          description: 'Get the current status of the METHOD workspace (backlog lanes, active cycles, legend health)',
          inputSchema: {
            type: 'object',
            properties: { ...workspaceProperty },
            required: ['workspace'],
          },
        },
        {
          name: 'method_inbox',
          description: 'Capture a new raw idea into the inbox',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              idea: { type: 'string' },
              legend: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['workspace', 'idea'],
          },
        },
        {
          name: 'method_pull',
          description: 'Promote a backlog item into the next numbered cycle',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              item: { type: 'string' },
            },
            required: ['workspace', 'item'],
          },
        },
        {
          name: 'method_drift',
          description: 'Check active cycle playback questions against tests',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              cycle: { type: 'string' },
            },
            required: ['workspace'],
          },
        },
        {
          name: 'method_close',
          description: 'Close an active cycle into a retro',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              cycle: { type: 'string' },
              driftCheck: { type: 'boolean' },
              outcome: { type: 'string', enum: ['hill-met', 'partial', 'not-met'] },
            },
            required: ['workspace', 'driftCheck', 'outcome'],
          },
        },
        {
          name: 'method_sync_ship',
          description: 'Perform the Ship Sync maneuver (update CHANGELOG.md and BEARING.md)',
          inputSchema: {
            type: 'object',
            properties: { ...workspaceProperty },
            required: ['workspace'],
          },
        },
        {
          name: 'method_sync_github',
          description: 'Synchronize backlog with GitHub Issues',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              push: { type: 'boolean', description: 'Update GitHub issues with local changes (default: true)' },
              pull: { type: 'boolean', description: 'Update local backlog with GitHub changes' },
            },
            required: ['workspace'],
          },
        },
        {
          name: 'method_capture_witness',
          description: 'Automate terminal evidence capture for a cycle',
          inputSchema: {
            type: 'object',
            properties: {
              ...workspaceProperty,
              cycle: { type: 'string' },
            },
            required: ['workspace'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = (request.params.arguments ?? {}) as Record<string, unknown>;
      const workspacePath = args.workspace as string | undefined;
      if (!workspacePath) {
        throw new Error('workspace is required. Pass the absolute path to the METHOD workspace root directory.');
      }

      const workspace = new Workspace(workspacePath);
      workspace.ensureInitialized();

      if (request.params.name === 'method_status') {
        const status = workspace.status();
        return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
      }

      if (request.params.name === 'method_inbox') {
        const path = workspace.captureIdea(
          args.idea as string,
          args.legend as string | undefined,
          args.title as string | undefined,
        );
        return { content: [{ type: 'text', text: `Captured to ${relative(workspace.root, path)}` }] };
      }

      if (request.params.name === 'method_pull') {
        const cycle = workspace.pullItem(args.item as string);
        return { content: [{ type: 'text', text: `Pulled into ${cycle.name}\nDesign: ${relative(workspace.root, cycle.designDoc)}` }] };
      }

      if (request.params.name === 'method_drift') {
        const report = workspace.detectDrift(args.cycle as string | undefined);
        return {
          content: [{ type: 'text', text: report.output }],
          isError: report.exitCode !== 0,
        };
      }

      if (request.params.name === 'method_close') {
        const cycle = await workspace.closeCycle(
          args.cycle as string | undefined,
          args.driftCheck as boolean,
          args.outcome as Outcome,
        );
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
        const push = (args.push as boolean | undefined) || (!args.push && !args.pull);
        const pull = (args.pull as boolean | undefined) || false;

        const token = workspace.config.github_token;
        const repoFull = workspace.config.github_repo;

        if (!token) {
          throw new Error('GitHub token missing in .method.json or environment.');
        }
        if (!repoFull || !repoFull.includes('/')) {
          throw new Error('GitHub repo invalid; must be owner/repo in .method.json or environment.');
        }

        const [owner, repo] = repoFull.split('/');
        const adapter = new GitHubAdapter({
          workspace,
          token,
          owner: owner!,
          repo: repo!,
        });

        const log: string[] = [];
        let hasError = false;

        if (push) {
          const results = await adapter.pushBacklog();
          for (const r of results) {
            if (r.skipped) continue;
            if (r.error) {
              log.push(`Error pushing ${r.path}: ${r.error}`);
              hasError = true;
            } else {
              const issueLabel = r.issue?.number ?? '<unknown>';
              const verb = r.action === 'create' ? 'Created' : 'Updated';
              log.push(`${verb} GitHub Issue #${issueLabel} for ${r.path}`);
            }
          }
        }

        if (pull) {
          const results = await adapter.pullBacklog();
          for (const r of results) {
            if (r.skipped) continue;
            if (r.error) {
              log.push(`Error pulling ${r.path}: ${r.error}`);
              hasError = true;
            } else {
              const issueLabel = r.issue?.number ?? '<unknown>';
              log.push(`Pulled remote changes from GitHub Issue #${issueLabel} into ${r.path}`);
            }
          }
        }

        return {
          content: [{ type: 'text', text: log.join('\n') || 'No changes.' }],
          isError: hasError,
        };
      }

      if (request.params.name === 'method_capture_witness') {
        const path = await workspace.captureWitness(args.cycle as string | undefined);
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
