import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { relative } from 'node:path';
import { Workspace } from './index.js';
import { GitHubAdapter, type GitHubSyncResult } from './adapters/github.js';
import { renderDoctorMigrateText, renderDoctorRepairText, renderDoctorText, runDoctor, runDoctorMigrate, runDoctorRepair } from './doctor.js';
import type { Cycle, Outcome, WorkspaceStatus } from './domain.js';
import { queryReviewState, renderReviewStateText, type ReviewStateQueryOptions } from './review-state.js';

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
    properties: Record<string, { type: string; description?: string; enum?: string[]; minimum?: number; items?: { type: string } }>;
    required: string[];
  };
}

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: 'method_doctor',
    description: 'Inspect METHOD workspace health and report concrete problems with suggested fixes, even when the workspace is partially broken.',
    inputSchema: {
      type: 'object',
      properties: { ...workspaceProperty },
      required: ['workspace'],
    },
  },
  {
    name: 'method_repair',
    description: 'Plan or apply bounded doctor-guided repairs for missing directories, missing scaffold files, and frontmatter stubs.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        mode: { type: 'string', enum: ['plan', 'apply'], description: 'Whether to return a repair plan or apply the same bounded repair set.' },
      },
      required: ['workspace', 'mode'],
    },
  },
  {
    name: 'method_migrate',
    description: 'Run doctor, apply the bounded repair set, then re-check the workspace so callers can normalize a repo in one step.',
    inputSchema: {
      type: 'object',
      properties: { ...workspaceProperty },
      required: ['workspace'],
    },
  },
  {
    name: 'method_review_state',
    description: 'Get PR review / merge-readiness state for the current branch or an explicit PR. `pr` and `currentBranch` are mutually exclusive; when `pr` is omitted, current-branch resolution is the default behavior.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        pr: { type: 'integer', minimum: 1, description: 'Explicit PR number to inspect' },
        currentBranch: { type: 'boolean', description: 'Resolve the PR from the current branch (default when pr is omitted)' },
      },
      required: ['workspace'],
    },
  },
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
      properties: {
        ...workspaceProperty,
        idea: { type: 'string' },
        legend: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string', description: 'Optional markdown body. Defaults to the idea text when omitted.' },
        source: { type: 'string', description: 'Optional source such as a reviewer, channel, or system.' },
        capturedAt: { type: 'string', description: 'Optional capture date in YYYY-MM-DD format.' },
      },
      required: ['workspace', 'idea'],
    },
  },
  {
    name: 'method_backlog_add',
    description: 'Create a shaped backlog note directly in the requested backlog lane.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        lane: { type: 'string', description: 'Destination backlog lane such as `bad-code` or `v1.1.0`.' },
        title: { type: 'string', description: 'Backlog note title used for frontmatter, heading, and slug derivation.' },
        legend: { type: 'string', description: 'Optional legend code prefix such as PROCESS.' },
        body: { type: 'string', description: 'Optional markdown body to place under the heading.' },
      },
      required: ['workspace', 'lane', 'title'],
    },
  },
  {
    name: 'method_backlog_move',
    description: 'Move a live backlog note into another backlog lane.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        item: { type: 'string', description: 'Backlog path, stem, or slug that resolves to exactly one live backlog note.' },
        to: { type: 'string', description: 'Destination backlog lane such as `asap`, `bad-code`, or `v1.1.0`.' },
      },
      required: ['workspace', 'item', 'to'],
    },
  },
  {
    name: 'method_backlog_edit',
    description: 'Update explicit schema-backed metadata on a live backlog note without opening arbitrary frontmatter editing.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        item: { type: 'string', description: 'Backlog path, stem, or slug that resolves to exactly one live backlog note.' },
        owner: { type: 'string', description: 'Optional owner role to set.' },
        clearOwner: { type: 'boolean', description: 'When true, remove the owner field.' },
        priority: { type: 'string', description: 'Optional priority to set, such as `high` or `medium`.' },
        clearPriority: { type: 'boolean', description: 'When true, remove the priority field.' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Optional replacement keyword list.' },
        clearKeywords: { type: 'boolean', description: 'When true, remove the keywords field.' },
        blockedBy: { type: 'array', items: { type: 'string' }, description: 'Optional replacement `blocked_by` reference list.' },
        clearBlockedBy: { type: 'boolean', description: 'When true, remove the `blocked_by` field.' },
        blocks: { type: 'array', items: { type: 'string' }, description: 'Optional replacement `blocks` reference list.' },
        clearBlocks: { type: 'boolean', description: 'When true, remove the `blocks` field.' },
      },
      required: ['workspace', 'item'],
    },
  },
  {
    name: 'method_backlog_query',
    description: 'Enumerate live backlog items as structured data with explicit frontmatter metadata such as owner, priority, keywords, and declared dependency refs.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        lane: { type: 'string', description: 'Optional backlog lane filter such as `bad-code` or `v1.1.0`.' },
        legend: { type: 'string', description: 'Optional legend filter such as PROCESS.' },
        priority: { type: 'string', description: 'Optional priority filter such as `medium`.' },
        keyword: { type: 'string', description: 'Optional explicit frontmatter keyword filter.' },
        owner: { type: 'string', description: 'Optional explicit frontmatter owner filter.' },
        ready: { type: 'boolean', description: 'Optional readiness filter. `true` returns items without declared `blocked_by` refs; `false` returns blocked items.' },
        hasAcceptanceCriteria: { type: 'boolean', description: 'Optional acceptance-criteria presence filter.' },
        blockedBy: { type: 'string', description: 'Optional declared `blocked_by` reference filter.' },
        blocks: { type: 'string', description: 'Optional declared `blocks` reference filter.' },
        sort: { type: 'string', description: 'Optional backlog query sort mode: `lane`, `priority`, or `path`. Defaults to `lane`.' },
        limit: { type: 'integer', minimum: 1, description: 'Maximum number of returned items. Defaults to 50 and may not exceed 100.' },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'method_backlog_dependencies',
    description: 'Return the live backlog dependency graph from `blocked_by` / `blocks` frontmatter, optionally focusing on one item, ready work, or the critical path.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        item: { type: 'string', description: 'Optional backlog path, stem, or slug to focus on.' },
        readyOnly: { type: 'boolean', description: 'When true, request the unblocked layer-0 backlog items.' },
        criticalPath: { type: 'boolean', description: 'When true, include the longest blocker chain to the focused item. Requires `item`.' },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'method_next_work',
    description: 'Return a bounded advisory menu of sensible next backlog items using lane order, declared frontmatter, dependency readiness, current status, and literal BEARING mentions.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        lane: { type: 'string', description: 'Optional backlog lane filter such as `asap` or `v1.1.0`.' },
        legend: { type: 'string', description: 'Optional legend filter such as PROCESS.' },
        priority: { type: 'string', description: 'Optional priority filter such as `high`.' },
        keyword: { type: 'string', description: 'Optional explicit frontmatter keyword filter.' },
        owner: { type: 'string', description: 'Optional explicit frontmatter owner filter.' },
        includeBlocked: { type: 'boolean', description: 'When true, keep blocked items in the candidate set even when ready work exists.' },
        limit: { type: 'integer', minimum: 1, description: 'Maximum number of recommendations. Defaults to 3 and may not exceed 10.' },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'method_signpost_status',
    description: 'Report which expected repo signposts exist, which are missing, and which can be initialized by helper commands.',
    inputSchema: {
      type: 'object',
      properties: { ...workspaceProperty },
      required: ['workspace'],
    },
  },
  {
    name: 'method_signpost_init',
    description: 'Initialize a narrowly supported missing canonical signpost such as BEARING, MCP, CLI, GUIDE, or ARCHITECTURE.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        name: { type: 'string', description: 'Canonical signpost name or path, such as BEARING or docs/MCP.md.' },
      },
      required: ['workspace', 'name'],
    },
  },
  {
    name: 'method_retire',
    description: 'Retire a live backlog note into the graveyard with an explicit disposition note instead of silently deleting it.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        item: { type: 'string', description: 'Live backlog path, stem, or slug that resolves to exactly one backlog note.' },
        reason: { type: 'string', description: 'Required retirement reason recorded under a graveyard Disposition section.' },
        replacement: { type: 'string', description: 'Optional replacement path or successor reference to record in the tombstone.' },
        dryRun: { type: 'boolean', description: 'When true, return the planned graveyard move without mutating the repo.' },
      },
      required: ['workspace', 'item', 'reason'],
    },
  },
  {
    name: 'method_spike',
    description: 'Capture a behavior spike into the inbox with SPIKE legend and structured scaffolding.',
    inputSchema: {
      type: 'object',
      properties: {
        ...workspaceProperty,
        goal: { type: 'string', description: 'What the spike is trying to prove or learn' },
        title: { type: 'string', description: 'Optional override for the item title' },
        constraints: { type: 'string', description: 'Stack constraints or scope notes' },
      },
      required: ['workspace', 'goal'],
    },
  },
  {
    name: 'method_pull',
    description: 'Promote a backlog item into a new cycle packet, using release-scoped paths when the backlog item carries release metadata.',
    inputSchema: { type: 'object', properties: { ...workspaceProperty, item: { type: 'string' } }, required: ['workspace', 'item'] },
  },
  {
    name: 'method_drift',
    description: 'Check active cycle playback questions against tests',
    inputSchema: { type: 'object', properties: { ...workspaceProperty, cycle: { type: 'string' } }, required: ['workspace'] },
  },
  {
    name: 'method_close',
    description: 'Close an active cycle into its retro packet.',
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
    name: 'method_sync_refs',
    description: 'Refresh generated reference docs without mutating ship-only artifacts such as CHANGELOG.md or docs/BEARING.md.',
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

export interface CreateMcpServerOptions {
  reviewStateQuery?: (options: ReviewStateQueryOptions) => Promise<Awaited<ReturnType<typeof queryReviewState>>>;
}

export function createMcpServer(options: CreateMcpServerOptions = {}) {
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

      if (request.params.name === 'method_doctor') {
        const report = runDoctor(workspacePath);
        return successResult(
          'method_doctor',
          renderDoctorText(report),
          report,
        );
      }

      if (request.params.name === 'method_repair') {
        const result = runDoctorRepair(workspacePath, validateRepairMode(args.mode));
        return successResult(
          'method_repair',
          renderDoctorRepairText(result),
          result,
        );
      }

      if (request.params.name === 'method_migrate') {
        const result = runDoctorMigrate(workspacePath);
        return successResult(
          'method_migrate',
          renderDoctorMigrateText(result),
          result,
        );
      }

      const workspace = new Workspace(workspacePath);
      workspace.ensureInitialized();

      if (request.params.name === 'method_signpost_status') {
        const result = workspace.signpostStatus();
        return successResult(
          'method_signpost_status',
          `Found ${result.signposts.length} expected signposts with ${result.missing.length} missing.`,
          result,
        );
      }

      if (request.params.name === 'method_signpost_init') {
        const result = await workspace.initSignpost(validateString(args.name, 'name'));
        return successResult(
          'method_signpost_init',
          result.initializedTargets.length > 0
            ? `Initialized ${result.initializedTargets.join(', ')}`
            : `Skipped ${result.skippedPaths.join(', ')}`,
          result,
        );
      }

      if (request.params.name === 'method_review_state') {
        const pr = validateOptionalInteger(args.pr, 'pr');
        const currentBranchArg = validateOptionalBoolean(args.currentBranch, 'currentBranch');
        const currentBranch = currentBranchArg === true ? true : undefined;
        if (pr !== undefined && currentBranch === true) {
          throw new Error('method_review_state accepts either pr or currentBranch, not both.');
        }
        const reviewStateQuery = options.reviewStateQuery ?? queryReviewState;
        const result = await reviewStateQuery({
          cwd: workspace.root,
          pr,
          currentBranch,
        });
        return successResult(
          'method_review_state',
          renderReviewStateText(result),
          result,
        );
      }

      if (request.params.name === 'method_status') {
        const status = workspace.status();
        const summary = validateOptionalBoolean(args.summary, 'summary') ?? false;
        if (summary) {
          const summaryResult = summarizeStatus(status, workspace.closedCycles());
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
        const path = workspace.captureIdeaWithMetadata(
          validateString(args.idea, 'idea'),
          validateOptionalString(args.legend, 'legend'),
          validateOptionalString(args.title, 'title'),
          {
            body: validateOptionalText(args.body, 'body'),
            source: validateOptionalString(args.source, 'source'),
            capturedAt: validateOptionalString(args.capturedAt, 'capturedAt'),
          },
        );
        const relativePath = relative(workspace.root, path);
        const persistedItem = workspace.describeBacklogPath(relativePath);
        return successResult(
          'method_inbox',
          `Captured to ${relativePath}`,
          persistedItem,
        );
      }

      if (request.params.name === 'method_spike') {
        const goal = validateString(args.goal, 'goal');
        const title = validateOptionalString(args.title, 'title');
        const constraints = validateOptionalString(args.constraints, 'constraints');
        const path = workspace.captureSpike(goal, title, constraints);
        const relativePath = relative(workspace.root, path);
        const persistedItem = workspace.describeBacklogPath(relativePath);
        return successResult(
          'method_spike',
          `Captured spike to ${relativePath}`,
          persistedItem,
        );
      }

      if (request.params.name === 'method_backlog_add') {
        const path = workspace.createBacklogItem({
          lane: validateString(args.lane, 'lane'),
          title: validateString(args.title, 'title'),
          legend: validateOptionalString(args.legend, 'legend'),
          body: validateOptionalText(args.body, 'body'),
        });
        const relativePath = relative(workspace.root, path);
        const persistedItem = workspace.describeBacklogPath(relativePath);
        return successResult(
          'method_backlog_add',
          `Created ${relativePath}`,
          persistedItem,
        );
      }

      if (request.params.name === 'method_backlog_move') {
        const sourcePath = workspace.resolveBacklogPath(validateString(args.item, 'item'));
        const destinationPath = workspace.moveBacklogItem(
          sourcePath,
          validateString(args.to, 'to'),
        );
        const persistedItem = workspace.describeBacklogPath(destinationPath);
        return successResult(
          'method_backlog_move',
          `Moved ${sourcePath} to ${destinationPath}`,
          {
            sourcePath,
            ...persistedItem,
          },
        );
      }

      if (request.params.name === 'method_backlog_edit') {
        const result = workspace.editBacklogMetadata(validateString(args.item, 'item'), {
          owner: validateOptionalString(args.owner, 'owner'),
          clearOwner: validateOptionalBoolean(args.clearOwner, 'clearOwner'),
          priority: validateOptionalString(args.priority, 'priority'),
          clearPriority: validateOptionalBoolean(args.clearPriority, 'clearPriority'),
          keywords: validateOptionalStringArray(args.keywords, 'keywords'),
          clearKeywords: validateOptionalBoolean(args.clearKeywords, 'clearKeywords'),
          blockedBy: validateOptionalStringArray(args.blockedBy, 'blockedBy'),
          clearBlockedBy: validateOptionalBoolean(args.clearBlockedBy, 'clearBlockedBy'),
          blocks: validateOptionalStringArray(args.blocks, 'blocks'),
          clearBlocks: validateOptionalBoolean(args.clearBlocks, 'clearBlocks'),
        });
        return successResult(
          'method_backlog_edit',
          summarizeBacklogEdit(result),
          result,
        );
      }

      if (request.params.name === 'method_backlog_query') {
        const limit = validateOptionalInteger(args.limit, 'limit');
        if (limit !== undefined && limit > 100) {
          throw new Error('limit must be between 1 and 100.');
        }
        const result = workspace.backlogQuery({
          lane: validateOptionalString(args.lane, 'lane'),
          legend: validateOptionalString(args.legend, 'legend'),
          priority: validateOptionalString(args.priority, 'priority'),
          keyword: validateOptionalString(args.keyword, 'keyword'),
          owner: validateOptionalString(args.owner, 'owner'),
          ready: validateOptionalBoolean(args.ready, 'ready'),
          hasAcceptanceCriteria: validateOptionalBoolean(args.hasAcceptanceCriteria, 'hasAcceptanceCriteria'),
          blockedBy: validateOptionalString(args.blockedBy, 'blockedBy'),
          blocks: validateOptionalString(args.blocks, 'blocks'),
          sort: validateOptionalString(args.sort, 'sort'),
          limit,
        });
        return successResult(
          'method_backlog_query',
          summarizeBacklogQuery(result),
          result,
        );
      }

      if (request.params.name === 'method_backlog_dependencies') {
        const item = validateOptionalString(args.item, 'item');
        const readyOnly = validateOptionalBoolean(args.readyOnly, 'readyOnly') ?? false;
        const criticalPath = validateOptionalBoolean(args.criticalPath, 'criticalPath') ?? false;
        if (readyOnly && item !== undefined) {
          throw new Error('method_backlog_dependencies does not accept item when readyOnly is true.');
        }
        if (readyOnly && criticalPath) {
          throw new Error('method_backlog_dependencies does not combine readyOnly with criticalPath.');
        }
        if (criticalPath && item === undefined) {
          throw new Error('method_backlog_dependencies requires item when criticalPath is true.');
        }
        const result = workspace.backlogDependencies({ item, readyOnly, criticalPath });
        return successResult(
          'method_backlog_dependencies',
          summarizeBacklogDependencies(result),
          result,
        );
      }

      if (request.params.name === 'method_next_work') {
        const limit = validateOptionalInteger(args.limit, 'limit');
        if (limit !== undefined && limit > 10) {
          throw new Error('limit must be between 1 and 10.');
        }
        const result = workspace.nextWork({
          lane: validateOptionalString(args.lane, 'lane'),
          legend: validateOptionalString(args.legend, 'legend'),
          priority: validateOptionalString(args.priority, 'priority'),
          keyword: validateOptionalString(args.keyword, 'keyword'),
          owner: validateOptionalString(args.owner, 'owner'),
          includeBlocked: validateOptionalBoolean(args.includeBlocked, 'includeBlocked'),
          limit,
        });
        return successResult(
          'method_next_work',
          summarizeNextWork(result),
          result,
        );
      }

      if (request.params.name === 'method_retire') {
        const result = workspace.retireBacklogItem(
          validateString(args.item, 'item'),
          validateText(args.reason, 'reason'),
          validateOptionalString(args.replacement, 'replacement'),
          { dryRun: validateOptionalBoolean(args.dryRun, 'dryRun') ?? false },
        );
        return successResult(
          'method_retire',
          result.dryRun
            ? `Planned retirement of ${result.sourcePath} to ${result.graveyardPath}`
            : `Retired ${result.sourcePath} to ${result.graveyardPath}`,
          result,
        );
      }

      if (request.params.name === 'method_pull') {
        const item = validateString(args.item, 'item');
        const cycle = workspace.pullItem(item);
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
        const cycleName = validateOptionalString(args.cycle, 'cycle');
        const driftCheck = validateBoolean(args.driftCheck, 'driftCheck');
        const outcome = validateOutcome(args.outcome);
        const cycle = await workspace.closeCycle(
          cycleName,
          driftCheck,
          outcome,
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

      if (request.params.name === 'method_sync_refs') {
        const result = workspace.syncRefs();
        return successResult(
          'method_sync_refs',
          result.targets.length === 0
            ? 'No generated reference targets.'
            : `Refreshed ${result.targets.join(', ')}`,
          result,
        );
      }

      if (request.params.name === 'method_sync_github') {
        const validatedPush = validateOptionalBoolean(args.push, 'push');
        const validatedPull = validateOptionalBoolean(args.pull, 'pull');
        const pull = validatedPull ?? false;
        const push = validatedPush ?? !pull;

        if (!push && !pull) {
          return toolResult(
            'method_sync_github',
            'No changes.',
            {
              pushRequested: false,
              pullRequested: false,
              pushResults: [],
              pullResults: [],
            },
            false,
          );
        }

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
        const witnessTarget = validateOptionalString(args.cycle, 'cycle');
        const path = await workspace.captureWitness(witnessTarget);
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

function summarizeStatus(status: WorkspaceStatus, closedCycles: Cycle[]): McpStatusSummary {
  const laneCounts = Object.fromEntries(
    Object.entries(status.backlog).map(([lane, items]) => [lane, items.length]),
  );

  return {
    root: status.root,
    laneCounts,
    activeCycles: status.activeCycles.map((cycle) => ({ name: cycle.name, slug: cycle.slug })),
    retroCount: closedCycles.length,
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
  const legendHealth = summary.legendHealth.length === 0
    ? '-'
    : summary.legendHealth
      .map(({ legend, backlog, active }) => `${legend} backlog=${backlog} active=${active}`)
      .join('; ');
  return [
    `Status summary for ${summary.root}.`,
    `Lane counts: ${laneCounts}`,
    `Active cycles: ${activeCycles}`,
    `Retros: ${summary.retroCount}`,
    `Legend health: ${legendHealth}`,
  ].join('\n');
}

function relativizeCycle(workspace: Workspace, cycle: { name: string; slug: string; designDoc: string; retroDoc: string }) {
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

function summarizeBacklogQuery(result: {
  returnedCount: number;
  totalCount: number;
  truncated: boolean;
  filters: { lane?: string; legend?: string; priority?: string; keyword?: string; owner?: string; ready?: boolean; hasAcceptanceCriteria?: boolean; blockedBy?: string; blocks?: string; sort: string };
}): string {
  const filters = [
    result.filters.lane === undefined ? undefined : `lane=${result.filters.lane}`,
    result.filters.legend === undefined ? undefined : `legend=${result.filters.legend}`,
    result.filters.priority === undefined ? undefined : `priority=${result.filters.priority}`,
    result.filters.keyword === undefined ? undefined : `keyword=${result.filters.keyword}`,
    result.filters.owner === undefined ? undefined : `owner=${result.filters.owner}`,
    result.filters.ready === undefined ? undefined : `ready=${result.filters.ready}`,
    result.filters.hasAcceptanceCriteria === undefined ? undefined : `hasAcceptanceCriteria=${result.filters.hasAcceptanceCriteria}`,
    result.filters.blockedBy === undefined ? undefined : `blockedBy=${result.filters.blockedBy}`,
    result.filters.blocks === undefined ? undefined : `blocks=${result.filters.blocks}`,
    `sort=${result.filters.sort}`,
  ].filter((value): value is string => value !== undefined);
  const prefix = filters.length === 0 ? 'Backlog query' : `Backlog query (${filters.join(', ')})`;
  return `${prefix}: returned ${result.returnedCount} of ${result.totalCount} item(s)${result.truncated ? ' (truncated)' : ''}.`;
}

function summarizeBacklogEdit(result: {
  stem: string;
  updatedFields: string[];
}): string {
  return `Updated backlog metadata on ${result.stem}: ${result.updatedFields.join(', ')}.`;
}

function summarizeNextWork(result: {
  recommendations: Array<{ title: string; lane: string; scoreBand: string }>;
  selection_notes: string[];
}): string {
  if (result.recommendations.length === 0) {
    return 'No next-work recommendations are currently available.';
  }
  const summary = result.recommendations
    .map((item) => `${item.title} (${item.lane}, ${item.scoreBand})`)
    .join('; ');
  return `Next-work menu: ${summary}${result.selection_notes.length > 0 ? `. Notes: ${result.selection_notes[0]}` : ''}`;
}

function summarizeBacklogDependencies(result: {
  items: Array<{ stem: string }>;
  edges: unknown[];
  ready: Array<{ stem: string }>;
  cycles: string[][];
  focus?: { item: { stem: string }; criticalPath: Array<{ stem: string }>; criticalPathReason?: string };
  query: { readyOnly: boolean; criticalPath: boolean };
}): string {
  if (result.query.readyOnly) {
    return result.ready.length === 0
      ? 'No ready backlog items.'
      : `Ready backlog items: ${result.ready.map((item) => item.stem).join(', ')}`;
  }
  if (result.focus !== undefined) {
    if (result.query.criticalPath) {
      return result.focus.criticalPathReason ?? `Critical path to ${result.focus.item.stem}: ${result.focus.criticalPath.map((item) => item.stem).join(' -> ')}`;
    }
    return `Dependency view for ${result.focus.item.stem}.`;
  }
  return `Dependency graph: ${result.items.length} item(s), ${result.edges.length} edge(s), ${result.ready.length} ready, ${result.cycles.length} cycle(s).`;
}

function successResult(tool: string, text: string, result: unknown) {
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

function toolResult(tool: string, text: string, result: unknown, isError: boolean) {
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

function validateOptionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string when provided.`);
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
  return normalized;
}

function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
  return normalized;
}

function validateOptionalText(value: unknown, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string when provided.`);
  }
  return value;
}

function validateText(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }
  if (value.trim().length === 0) {
    throw new Error(`${name} must not be empty.`);
  }
  return value;
}

function validateOptionalBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`${name} must be a boolean.`);
  }
  return value;
}

function validateBoolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${name} must be a boolean.`);
  }
  return value;
}

function validateOptionalInteger(value: unknown, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function validateOptionalStringArray(value: unknown, name: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`${name} must be an array of strings.`);
  }
  return [...value];
}

function validateOutcome(value: unknown): Outcome {
  if (value === 'hill-met' || value === 'partial' || value === 'not-met') {
    return value;
  }
  throw new Error('outcome must be one of: hill-met, partial, not-met.');
}

function validateRepairMode(value: unknown): 'plan' | 'apply' {
  if (value === 'plan' || value === 'apply') {
    return value;
  }
  throw new Error('mode must be one of: plan, apply.');
}
