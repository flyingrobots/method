import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { basename, relative } from 'node:path';
import { Workspace } from './index.js';
import { GitHubAdapter, type GitHubSyncResult } from './adapters/github.js';
import type { Outcome, WorkspaceStatus } from './domain.js';

const workspaceProperty = { workspace: { type: 'string' as const, description: 'Absolute path to the METHOD workspace root directory' } };

interface McpStatusSummary {
  root: string;
  laneCounts: Record<string, number>;
  activeCycles: Array<{ name: string; slug: string }>;
  retroCount: number;
  legendHealth: WorkspaceStatus['legendHealth'];
}

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required: string[];
  };
}

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: 'method_status',
    description: 'Get the current status of the METHOD workspace (backlog lanes, active cycles, legend health)',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        summary: { type: 'boolean', description: 'Return a compact structured summary instead of the fully expanded workspace status (default: false)' },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'method_inbox',
    description: 'Capture a new raw idea into the inbox',
    inputSchema: {
      type: 'object',
      properties: { ...workspaceProperty, idea: { type: 'string' }, legend: { type: 'string' }, title: { type: 'string' } },
      required: ['workspace', 'idea'],
    },
  },
  {
    name: 'method_pull',
    description: 'Promote a backlog item into the next numbered cycle',
    inputSchema: { type: 'object', properties: { ...workspaceProperty, item: { type: 'string' } }, required: ['workspace', 'item'] },
  },
  {
    name: 'method_drift',
    description: 'Check active cycle playback questions against tests',
    inputSchema: { type: 'object', properties: { ...workspaceProperty, cycle: { type: 'string' } }, required: ['workspace'] },
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
    inputSchema: { type: 'object', properties: { ...workspaceProperty }, required: ['workspace'] },
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
    inputSchema: { type: 'object', properties: { ...workspaceProperty, cycle: { type: 'string' } }, required: ['workspace'] },
  },
];

export function createMcpServer() {
  const server = new Server(
    { name: 'method', version: '0.3.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: MCP_TOOLS };
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
        const summary = args.summary === true;
        if (summary) {
          const summaryResult = summarizeStatus(workspace, status);
          return successResult(
            'method_status',
            renderStatusSummaryText(summaryResult),
            { mode: 'summary', summary: summaryResult },
          );
        }
        return successResult(
          'method_status',
          `Returned full workspace status for ${workspace.root}.`,
          { mode: 'full', status },
        );
      }

      if (request.params.name === 'method_inbox') {
        const path = workspace.captureIdea(
          args.idea as string,
          args.legend as string | undefined,
          args.title as string | undefined,
        );
        const relativePath = relative(workspace.root, path);
        const persistedItem = readPersistedInboxResult(workspace, relativePath);
        return successResult(
          'method_inbox',
          `Captured to ${relativePath}`,
          persistedItem,
        );
      }

      if (request.params.name === 'method_pull') {
        const cycle = workspace.pullItem(args.item as string);
        return successResult(
          'method_pull',
          `Pulled into ${cycle.name}`,
          {
            cycle: relativizeCycle(workspace, cycle),
          },
        );
      }

      if (request.params.name === 'method_drift') {
        const report = workspace.detectDrift(args.cycle as string | undefined);
        return toolResult(
          'method_drift',
          report.output,
          {
            exitCode: report.exitCode,
            output: report.output,
            clean: report.exitCode === 0,
          },
          report.exitCode !== 0,
        );
      }

      if (request.params.name === 'method_close') {
        const cycle = await workspace.closeCycle(
          args.cycle as string | undefined,
          args.driftCheck as boolean,
          args.outcome as Outcome,
        );
        return successResult(
          'method_close',
          `Closed ${cycle.name}`,
          {
            cycle: relativizeCycle(workspace, cycle),
          },
        );
      }

      if (request.params.name === 'method_sync_ship') {
        const result = await workspace.shipSync();
        const newShips = result.newShips.map((cycle) => relativizeCycle(workspace, cycle));
        const text = result.newShips.length === 0
          ? 'No new ships.'
          : `Shipped ${result.newShips.map((cycle) => cycle.name).join(', ')}`;
        return successResult(
          'method_sync_ship',
          text,
          {
            updated: result.updated,
            newShips,
          },
        );
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

        let hasError = false;
        let pushResults: GitHubSyncResult[] = [];
        let pullResults: GitHubSyncResult[] = [];

        if (push) {
          pushResults = await adapter.pushBacklog();
          hasError = hasError || pushResults.some((result) => result.error !== undefined);
        }

        if (pull) {
          pullResults = await adapter.pullBacklog();
          hasError = hasError || pullResults.some((result) => result.error !== undefined);
        }

        return toolResult(
          'method_sync_github',
          summarizeGitHubSync(pushResults, pullResults),
          {
            pushRequested: push,
            pullRequested: pull,
            pushResults,
            pullResults,
          },
          hasError,
        );
      }

      if (request.params.name === 'method_capture_witness') {
        const path = await workspace.captureWitness(args.cycle as string | undefined);
        const relativePath = relative(workspace.root, path);
        return successResult(
          'method_capture_witness',
          `Captured witness to ${relativePath}`,
          { path: relativePath },
        );
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(request.params.name, message);
    }
  });

  return server;
}

function summarizeStatus(workspace: Workspace, status: WorkspaceStatus): McpStatusSummary {
  const laneCounts = Object.fromEntries(
    Object.entries(status.backlog).map(([lane, items]) => [lane, items.length]),
  );

  return {
    root: status.root,
    laneCounts,
    activeCycles: status.activeCycles.map((cycle) => ({ name: cycle.name, slug: cycle.slug })),
    retroCount: workspace.closedCycles().length,
    legendHealth: status.legendHealth,
  };
}

function renderStatusSummaryText(summary: McpStatusSummary): string {
  const laneCounts = Object.entries(summary.laneCounts)
    .map(([lane, count]) => `${lane}=${count}`)
    .join(', ');
  const activeCycles = summary.activeCycles.length === 0
    ? '-'
    : summary.activeCycles.map((cycle) => cycle.name).join(', ');
  return [
    `Status summary for ${summary.root}.`,
    `Lane counts: ${laneCounts}`,
    `Active cycles: ${activeCycles}`,
    `Retros: ${summary.retroCount}`,
  ].join('\n');
}

function readPersistedInboxResult(workspace: Workspace, relativePath: string) {
  const frontmatter = workspace.readFrontmatter(relativePath);
  const stem = fileStem(relativePath);
  const { legend, slug } = splitBacklogStem(stem);

  return {
    path: relativePath,
    lane: frontmatter.lane ?? 'inbox',
    legend: frontmatter.legend ?? legend,
    title: frontmatter.title,
    stem,
    slug,
  };
}

function relativizeCycle(workspace: Workspace, cycle: { name: string; number: number; slug: string; designDoc: string; retroDoc: string }) {
  return {
    ...cycle,
    designDoc: relative(workspace.root, cycle.designDoc),
    retroDoc: relative(workspace.root, cycle.retroDoc),
  };
}

function summarizeGitHubSync(pushResults: GitHubSyncResult[], pullResults: GitHubSyncResult[]): string {
  const changed = [...pushResults, ...pullResults].filter((result) => !result.skipped);
  if (changed.length === 0) {
    return 'No changes.';
  }
  const failures = changed.filter((result) => result.error !== undefined).length;
  return `GitHub sync processed ${changed.length} item(s) with ${failures} error(s).`;
}

function successResult(tool: string, text: string, result: Record<string, unknown>) {
  return toolResult(tool, text, result, false);
}

function errorResult(tool: string, message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    structuredContent: {
      tool,
      ok: false,
      error: { message },
    },
    isError: true,
  };
}

function toolResult(tool: string, text: string, result: Record<string, unknown>, isError: boolean) {
  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      tool,
      ok: !isError,
      result,
    },
    isError,
  };
}

function fileStem(path: string): string {
  const name = basename(path);
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}

function splitBacklogStem(stem: string): { legend?: string; slug: string } {
  const match = /^(?<legend>[A-Z][A-Z0-9]*)_(?<slug>.+)$/u.exec(stem);
  if (match?.groups === undefined) {
    return { slug: stem };
  }
  return { legend: match.groups.legend, slug: match.groups.slug };
}
