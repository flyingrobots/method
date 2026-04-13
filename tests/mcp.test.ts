import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubAdapter } from '../src/adapters/github.js';
import { runCli } from '../src/cli.js';
import { createMcpServer } from '../src/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initWorkspace, Workspace } from '../src/index.js';
import type { ReviewStateResult } from '../src/review-state.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
  vi.restoreAllMocks();
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-mcp-'));
  tempRoots.push(root);
  return root;
}

function ensureBacklogLane(root: string, lane: string): void {
  mkdirSync(join(root, 'docs/method/backlog', lane), { recursive: true });
}

class MemoryWriter {
  output = '';

  write(chunk: string): boolean {
    this.output += chunk;
    return true;
  }
}

function createCallToolHarness(
  options: {
    reviewStateQuery?: (options: { cwd: string; pr?: number; currentBranch?: boolean }) => Promise<ReviewStateResult>;
  } = {},
) {
  let callToolHandler: any;
  const mockServer = {
    setRequestHandler: vi.fn((schema, handler) => {
      if (schema === CallToolRequestSchema) {
        callToolHandler = handler;
      }
    }),
  };

  vi.spyOn(Server.prototype, 'setRequestHandler').mockImplementation(mockServer.setRequestHandler);
  createMcpServer({ reviewStateQuery: options.reviewStateQuery });
  expect(callToolHandler).toBeDefined();
  return callToolHandler;
}

describe('MCP Server', () => {
  it('Does `src/mcp.ts` export a functional MCP server using `@modelcontextprotocol/sdk`?', () => {
    const server = createMcpServer();
    expect(server).toBeInstanceOf(Server);
  });

  it('Are tools provided for querying the backlog, pulling items, and closing cycles?', async () => {
    let listToolsHandler: any;
    const mockServer = {
      setRequestHandler: vi.fn((schema, handler) => {
        if (schema === ListToolsRequestSchema) {
          listToolsHandler = handler;
        }
      }),
    };

    vi.spyOn(Server.prototype, 'setRequestHandler').mockImplementation(mockServer.setRequestHandler);

    createMcpServer();

    expect(listToolsHandler).toBeDefined();
    const result = await listToolsHandler();
    expect(result.tools.length).toBeGreaterThan(0);

    const toolNames = result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('method_doctor');
    expect(toolNames).toContain('method_repair');
    expect(toolNames).toContain('method_migrate');
    expect(toolNames).toContain('method_status');
    expect(toolNames).toContain('method_review_state');
    expect(toolNames).toContain('method_inbox');
    expect(toolNames).toContain('method_backlog_add');
    expect(toolNames).toContain('method_backlog_move');
    expect(toolNames).toContain('method_backlog_edit');
    expect(toolNames).toContain('method_backlog_query');
    expect(toolNames).toContain('method_backlog_dependencies');
    expect(toolNames).toContain('method_next_work');
    expect(toolNames).toContain('method_signpost_status');
    expect(toolNames).toContain('method_signpost_init');
    expect(toolNames).toContain('method_retire');
    expect(toolNames).toContain('method_pull');
    expect(toolNames).toContain('method_close');
    expect(toolNames).toContain('method_drift');
    expect(toolNames).toContain('method_sync_ship');
    expect(toolNames).toContain('method_sync_refs');
    expect(toolNames).toContain('method_capture_witness');

    // Every tool must require cwd
    for (const tool of result.tools) {
      expect(tool.inputSchema.required, `${tool.name} must require workspace`).toContain('workspace');
      expect(tool.inputSchema.properties.workspace, `${tool.name} must have workspace property`).toBeDefined();
    }
    const statusTool = result.tools.find((tool: any) => tool.name === 'method_status');
    expect(statusTool.inputSchema.properties.summary).toBeDefined();
    const reviewStateTool = result.tools.find((tool: any) => tool.name === 'method_review_state');
    expect(reviewStateTool.inputSchema.properties.pr).toBeDefined();
    expect(reviewStateTool.inputSchema.properties.currentBranch).toBeDefined();

    vi.restoreAllMocks();
  });

  it('Does `method_review_state` return the shared review-state result under structuredContent.result?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const reviewStateQuery = vi.fn().mockResolvedValue({
      status: 'ready',
      pr_number: 18,
      pr_url: 'https://example.test/pr/18',
      review_decision: 'APPROVED',
      unresolved_thread_count: 0,
      checks: { passing: [], pending: [], failing: [] },
      bot_review_state: 'approved',
      approval_count: 2,
      changes_requested_count: 0,
      merge_ready: true,
      blockers: [],
    });
    const callToolHandler = createCallToolHarness({
      reviewStateQuery,
    });

    const result = await callToolHandler({
      params: {
        name: 'method_review_state',
        arguments: {
          workspace: root,
          pr: 18,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_review_state');
    expect(result.structuredContent.result.pr_number).toBe(18);
    expect(result.structuredContent.result.merge_ready).toBe(true);
    expect(reviewStateQuery).toHaveBeenCalledWith({
      cwd: root,
      pr: 18,
      currentBranch: undefined,
    });
    expect(result.content[0].text).toContain('Review state: ready');
    vi.restoreAllMocks();
  });

  it('Does `method_doctor` return the same doctor report contract under `structuredContent.result`?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(join(root, '.method.json'), '{ broken json }\n', 'utf8');
    const callToolHandler = createCallToolHarness();
    const stdout = new MemoryWriter();

    const cliExitCode = await runCli(['doctor', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });
    const mcpResult = await callToolHandler({
      params: {
        name: 'method_doctor',
        arguments: {
          workspace: root,
        },
      },
    });

    expect(cliExitCode).toBe(1);
    expect(mcpResult.isError).toBe(false);
    expect(mcpResult.structuredContent.tool).toBe('method_doctor');
    expect(mcpResult.structuredContent.result).toEqual(JSON.parse(stdout.output));
    expect(mcpResult.content[0].text).toContain('Status: error');
  });

  it('Does `method_backlog_dependencies` match the CLI JSON contract for ready work and critical paths?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_foundation.md'),
      [
        '---',
        'title: "Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Foundation',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_build.md'),
      [
        '---',
        'title: "Build"',
        'legend: PROCESS',
        'lane: up-next',
        'blocked_by:',
        '  - foundation',
        'blocks:',
        '  - finish',
        '---',
        '',
        '# Build',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_finish.md'),
      [
        '---',
        'title: "Finish"',
        'legend: PROCESS',
        'lane: up-next',
        'blocked_by:',
        '  - build',
        '---',
        '',
        '# Finish',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const callToolHandler = createCallToolHarness();
    const stdout = new MemoryWriter();

    const cliExitCode = await runCli(['backlog', 'deps', 'finish', '--critical-path', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });
    const mcpResult = await callToolHandler({
      params: {
        name: 'method_backlog_dependencies',
        arguments: {
          workspace: root,
          item: 'finish',
          criticalPath: true,
        },
      },
    });

    expect(cliExitCode).toBe(0);
    expect(mcpResult.isError).toBe(false);
    expect(mcpResult.structuredContent.tool).toBe('method_backlog_dependencies');
    expect(mcpResult.structuredContent.result).toEqual(JSON.parse(stdout.output));
    expect(mcpResult.structuredContent.result.focus.item.stem).toBe('PROCESS_finish');
    expect(mcpResult.content[0].text).toContain('Critical path to PROCESS_finish');
  });

  it('Does `method_backlog_query` match the CLI JSON contract for explicit keywords, owners, readiness, sort mode, and bounded filtering?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-foundation.md'),
      [
        '---',
        'title: "Query Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        'owner: "METHOD maintainers"',
        'priority: medium',
        'keywords:',
        '  - agent',
        '  - query',
        'blocked_by:',
        '  - setup',
        'acceptance_criteria:',
        '  - "Has a query API"',
        '---',
        '',
        '# Query Foundation',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-polish.md'),
      [
        '---',
        'title: "Query Polish"',
        'legend: PROCESS',
        'lane: up-next',
        'priority: medium',
        'keywords:',
        '  - agent',
        '  - polish',
        '---',
        '',
        '# Query Polish',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const callToolHandler = createCallToolHarness();
    const stdout = new MemoryWriter();

    const cliExitCode = await runCli([
      'backlog',
      'list',
      '--lane',
      'up-next',
      '--keyword',
      'agent',
      '--owner',
      'METHOD maintainers',
      '--blocked',
      '--has-acceptance-criteria',
      '--blocked-by',
      'setup',
      '--sort',
      'priority',
      '--limit',
      '1',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });
    const mcpResult = await callToolHandler({
      params: {
        name: 'method_backlog_query',
        arguments: {
          workspace: root,
          lane: 'up-next',
          keyword: 'agent',
          owner: 'METHOD maintainers',
          ready: false,
          hasAcceptanceCriteria: true,
          blockedBy: 'setup',
          sort: 'priority',
          limit: 1,
        },
      },
    });

    expect(cliExitCode).toBe(0);
    expect(mcpResult.isError).toBe(false);
    expect(mcpResult.structuredContent.tool).toBe('method_backlog_query');
    expect(mcpResult.structuredContent.result).toEqual(JSON.parse(stdout.output));
    expect(mcpResult.structuredContent.result.items[0].keywords).toEqual(['agent', 'query']);
    expect(mcpResult.content[0].text).toContain('Backlog query');
  });

  it('Does `method_backlog_edit` match the CLI JSON contract for schema-backed metadata updates?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_metadata-edit.md'),
      [
        '---',
        'title: "Metadata Edit"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Metadata Edit',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const callToolHandler = createCallToolHarness();
    const stdout = new MemoryWriter();

    const cliExitCode = await runCli([
      'backlog',
      'edit',
      'metadata-edit',
      '--owner',
      'Core Team',
      '--priority',
      'HIGH',
      '--keyword',
      'roadmap',
      '--keyword',
      'query',
      '--blocked-by',
      'setup',
      '--blocks',
      'finish',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });
    const mcpResult = await callToolHandler({
      params: {
        name: 'method_backlog_edit',
        arguments: {
          workspace: root,
          item: 'metadata-edit',
          owner: 'Core Team',
          priority: 'HIGH',
          keywords: ['roadmap', 'query'],
          blockedBy: ['setup'],
          blocks: ['finish'],
        },
      },
    });

    expect(cliExitCode).toBe(0);
    expect(mcpResult.isError).toBe(false);
    expect(mcpResult.structuredContent.tool).toBe('method_backlog_edit');
    expect(mcpResult.structuredContent.result).toEqual(JSON.parse(stdout.output));
    expect(mcpResult.content[0].text).toContain('Updated backlog metadata');
  });

  it('Does `method_next_work` match the CLI JSON contract for filtered recommendations and optional blocked inclusion?', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T12:48:24.000Z'));
    try {
      const root = createTempRoot();
      initWorkspace(root);
      ensureBacklogLane(root, 'up-next');
      writeFileSync(
        join(root, 'docs/method/backlog/up-next/PROCESS_blocked-owner-match.md'),
        [
          '---',
          'title: "Blocked Owner Match"',
          'legend: PROCESS',
          'lane: up-next',
          'owner: "Core Team"',
          'priority: medium',
          'keywords:',
          '  - roadmap',
          'blocked_by:',
          '  - setup',
          '---',
          '',
          '# Blocked Owner Match',
          '',
          'Body',
        ].join('\n'),
        'utf8',
      );
      writeFileSync(
        join(root, 'docs/method/backlog/cool-ideas/PROCESS_ready-owner-match.md'),
        [
          '---',
          'title: "Ready Owner Match"',
          'legend: PROCESS',
          'lane: cool-ideas',
          'owner: "Core Team"',
          'priority: medium',
          'keywords:',
          '  - roadmap',
          '---',
          '',
          '# Ready Owner Match',
          '',
          'Body',
        ].join('\n'),
        'utf8',
      );

      const callToolHandler = createCallToolHarness();
      const stdout = new MemoryWriter();

      const cliExitCode = await runCli(['next', '--keyword', 'roadmap', '--owner', 'Core Team', '--include-blocked', '--limit', '3', '--json'], {
        cwd: root,
        stdout,
        stderr: new MemoryWriter(),
      });
      const mcpResult = await callToolHandler({
        params: {
          name: 'method_next_work',
          arguments: {
            workspace: root,
            keyword: 'roadmap',
            owner: 'Core Team',
            includeBlocked: true,
            limit: 3,
          },
        },
      });

      expect(cliExitCode).toBe(0);
      expect(mcpResult.isError).toBe(false);
      expect(mcpResult.structuredContent.tool).toBe('method_next_work');
      expect(mcpResult.structuredContent.result).toEqual(JSON.parse(stdout.output));
      expect(mcpResult.content[0].text).toContain('Next-work menu');
      expect(mcpResult.structuredContent.result.selection_notes).toContain('Applied filters: keyword=roadmap, owner=core team.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('Does `method_repair` plan and apply the same bounded repair set through MCP structured results?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/release-runbook.md'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'),
      '# Missing Frontmatter\n\nBody\n',
      'utf8',
    );
    const callToolHandler = createCallToolHarness();

    const plan = await callToolHandler({
      params: {
        name: 'method_repair',
        arguments: {
          workspace: root,
          mode: 'plan',
        },
      },
    });

    expect(plan.isError).toBe(false);
    expect(plan.structuredContent.tool).toBe('method_repair');
    expect(plan.structuredContent.result.mode).toBe('plan');
    expect(plan.structuredContent.result.repairs.map((repair: { status: string }) => repair.status)).toEqual(['planned', 'planned', 'planned']);

    const applied = await callToolHandler({
      params: {
        name: 'method_repair',
        arguments: {
          workspace: root,
          mode: 'apply',
        },
      },
    });

    expect(applied.isError).toBe(false);
    expect(applied.structuredContent.tool).toBe('method_repair');
    expect(applied.structuredContent.result.mode).toBe('apply');
    expect(applied.structuredContent.result.repairs.map((repair: { status: string }) => repair.status)).toEqual(['applied', 'applied', 'applied']);
    expect(readFileSync(join(root, 'docs/method/release-runbook.md'), 'utf8')).toContain('# Release Runbook');
    expect(readFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'), 'utf8')).toMatch(/^---\ntitle: "Missing Frontmatter"\n---\n\n# Missing Frontmatter/mu);
  });

  it('Does `method_migrate` apply the bounded repair set and return both before/after doctor reports?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/release-runbook.md'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'),
      '# Missing Frontmatter\n\nBody\n',
      'utf8',
    );
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_migrate',
        arguments: {
          workspace: root,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_migrate');
    expect(result.structuredContent.result.changed).toBe(true);
    expect(result.structuredContent.result.initialReport.status).toBe('error');
    expect(result.structuredContent.result.repair.mode).toBe('apply');
    expect(result.structuredContent.result.repair.repairs.map((repair: { status: string }) => repair.status)).toEqual(['applied', 'applied', 'applied']);
    expect(readFileSync(join(root, 'docs/method/release-runbook.md'), 'utf8')).toContain('# Release Runbook');
  });

  it('Does `method_sync_refs` return structured content with the refreshed targets?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();
    const changelogBefore = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    const bearingPath = join(root, 'docs/BEARING.md');
    expect(existsSync(bearingPath)).toBe(false);

    const result = await callToolHandler({
      params: {
        name: 'method_sync_refs',
        arguments: {
          workspace: root,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_sync_refs');
    expect(result.structuredContent.result.targets).toEqual([
      'ARCHITECTURE.md',
      'docs/CLI.md',
      'docs/MCP.md',
      'docs/GUIDE.md',
    ]);
    expect(result.content[0].text).toContain('Refreshed ARCHITECTURE.md, docs/CLI.md, docs/MCP.md, docs/GUIDE.md');
    expect(readFileSync(join(root, 'CHANGELOG.md'), 'utf8')).toBe(changelogBefore);
    expect(existsSync(bearingPath)).toBe(false);
  });

  it('Does the CLI `--json` output exactly match the MCP `structuredContent.result` contract?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const sharedResult = {
      status: 'ready',
      pr_number: 18,
      pr_url: 'https://example.test/pr/18',
      review_decision: 'APPROVED',
      unresolved_thread_count: 0,
      checks: { passing: [], pending: [], failing: [] },
      bot_review_state: 'approved',
      approval_count: 2,
      changes_requested_count: 0,
      merge_ready: true,
      blockers: [],
    } satisfies ReviewStateResult;
    const reviewStateQuery = vi.fn().mockResolvedValue(sharedResult);
    const callToolHandler = createCallToolHarness({ reviewStateQuery });
    const stdout = new MemoryWriter();

    const cliExitCode = await runCli(['review-state', '--pr', '18', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
      reviewStateQuery,
    });
    const mcpResult = await callToolHandler({
      params: {
        name: 'method_review_state',
        arguments: {
          workspace: root,
          pr: 18,
        },
      },
    });

    expect(cliExitCode).toBe(0);
    expect(JSON.parse(stdout.output)).toEqual(sharedResult);
    expect(mcpResult.isError).toBe(false);
    expect(mcpResult.structuredContent.result).toEqual(sharedResult);
  });

  it('Does `method_review_state` reject invalid selector types before querying GitHub?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const reviewStateQuery = vi.fn();
    const callToolHandler = createCallToolHarness({ reviewStateQuery });

    const badPr = await callToolHandler({
      params: {
        name: 'method_review_state',
        arguments: {
          workspace: root,
          pr: '18',
        },
      },
    });

    expect(badPr.isError).toBe(true);
    expect(badPr.structuredContent.error.message).toContain('pr must be a positive integer');
    expect(reviewStateQuery).not.toHaveBeenCalled();

    const badSelector = await callToolHandler({
      params: {
        name: 'method_review_state',
        arguments: {
          workspace: root,
          pr: 18,
          currentBranch: true,
        },
      },
    });

    expect(badSelector.isError).toBe(true);
    expect(badSelector.structuredContent.error.message).toContain('either pr or currentBranch');
    expect(reviewStateQuery).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('Does `method_review_state` normalize currentBranch:false to the default current-branch query path?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const reviewStateQuery = vi.fn().mockResolvedValue({
      status: 'no-pr',
      pr_number: null,
      pr_url: null,
      review_decision: 'NONE',
      unresolved_thread_count: 0,
      checks: { passing: [], pending: [], failing: [] },
      bot_review_state: 'none',
      approval_count: 0,
      changes_requested_count: 0,
      merge_ready: false,
      blockers: [{ type: 'selection', message: 'No PR found for current branch.', source: 'github' }],
    });
    const callToolHandler = createCallToolHarness({ reviewStateQuery });

    const result = await callToolHandler({
      params: {
        name: 'method_review_state',
        arguments: {
          workspace: root,
          currentBranch: false,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(reviewStateQuery).toHaveBeenCalledWith({
      cwd: root,
      pr: undefined,
      currentBranch: undefined,
    });
    expect(result.structuredContent.result.status).toBe('no-pr');
    vi.restoreAllMocks();
  });

  it('Does `method_status` preserve the legacy full-status default when the caller omits the new summary flag?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.captureIdea('test idea from mcp', 'PROCESS', 'Test Idea From MCP');
    const callToolHandler = createCallToolHarness();

    const statusResult = await callToolHandler({ params: { name: 'method_status', arguments: { workspace: root } } });
    expect(statusResult.isError).toBeFalsy();
    expect(statusResult.structuredContent.tool).toBe('method_status');
    expect(statusResult.structuredContent.ok).toBe(true);
    expect(statusResult.structuredContent.result.mode).toBe('full');
    expect(statusResult.structuredContent.result.status.backlog.inbox).toContainEqual({
      stem: 'PROCESS_test-idea-from-mcp',
      lane: 'inbox',
      path: 'docs/method/backlog/inbox/PROCESS_test-idea-from-mcp.md',
      legend: 'PROCESS',
      slug: 'test-idea-from-mcp',
    });
    expect(statusResult.structuredContent.result.status.legendHealth).toContainEqual({
      legend: 'PROCESS',
      backlog: 1,
      active: 0,
    });
    expect(statusResult.content[0].text).toContain('Returned full workspace status');
    vi.restoreAllMocks();
  });

  it('Can I request `method_status` summary mode explicitly and get compact lane counts without the full backlog payload?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.captureIdea('test idea from mcp', undefined, 'Test Idea From MCP');
    const callToolHandler = createCallToolHarness();

    const statusResult = await callToolHandler({
      params: { name: 'method_status', arguments: { workspace: root, summary: true } },
    });

    expect(statusResult.isError).toBeFalsy();
    expect(statusResult.structuredContent.tool).toBe('method_status');
    expect(statusResult.structuredContent.ok).toBe(true);
    expect(statusResult.structuredContent.result.mode).toBe('summary');
    expect(statusResult.structuredContent.result.summary.laneCounts.inbox).toBe(1);
    expect(statusResult.structuredContent.result.summary.retroCount).toBe(0);
    expect(statusResult.structuredContent.result.summary.activeCycles).toEqual([]);
    expect(statusResult.structuredContent.result.summary.legendHealth).toContainEqual({
      legend: 'untagged',
      backlog: 1,
      active: 0,
    });
    expect(statusResult.structuredContent.result.summary.backlog).toBeUndefined();
    expect(statusResult.content[0].text).toContain('Lane counts:');
    expect(statusResult.content[0].text).toContain('Legend health:');
    vi.restoreAllMocks();
  });

  it('Does `method_status` reject non-boolean summary flags instead of silently expanding to full mode?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_status',
        arguments: {
          workspace: root,
          summary: 'true',
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent.tool).toBe('method_status');
    expect(result.structuredContent.error.message).toContain('summary must be a boolean');
  });

  it('Do mutation tools (`method_inbox`, `method_pull`, `method_close`, `method_capture_witness`) return stable field-level structured content for persisted paths and cycles?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();
    const originalMethodTest = process.env.METHOD_TEST;
    process.env.METHOD_TEST = 'true';
    try {
      const inboxResult = await callToolHandler({
        params: {
          name: 'method_inbox',
          arguments: { workspace: root, idea: 'Test idea from mcp', legend: 'process' },
        },
      });
      expect(inboxResult.isError).toBeFalsy();
      expect(inboxResult.structuredContent.tool).toBe('method_inbox');
      expect(inboxResult.structuredContent.result.path).toBe('docs/method/backlog/inbox/PROCESS_test-idea-from-mcp.md');
      expect(inboxResult.structuredContent.result.lane).toBe('inbox');
      expect(inboxResult.structuredContent.result.legend).toBe('PROCESS');
      expect(inboxResult.structuredContent.result.title).toBe('Test idea from mcp');
      expect(inboxResult.structuredContent.result.stem).toBe('PROCESS_test-idea-from-mcp');
      expect(inboxResult.structuredContent.result.slug).toBe('test-idea-from-mcp');

      const pullResult = await callToolHandler({
        params: { name: 'method_pull', arguments: { workspace: root, item: 'PROCESS_test-idea-from-mcp' } },
      });
      expect(pullResult.isError).toBeFalsy();
      expect(pullResult.structuredContent.tool).toBe('method_pull');
      expect(pullResult.structuredContent.result.cycle.name).toBe('PROCESS_test-idea-from-mcp');
      expect(pullResult.structuredContent.result.cycle.designDoc).toBe(
        'docs/design/PROCESS_test-idea-from-mcp.md',
      );

      const captureResult = await callToolHandler({
        params: { name: 'method_capture_witness', arguments: { workspace: root, cycle: 'PROCESS_test-idea-from-mcp' } },
      });
      expect(captureResult.isError).toBeFalsy();
      expect(captureResult.structuredContent.tool).toBe('method_capture_witness');
      expect(captureResult.structuredContent.result.path).toBe(
        'docs/method/retro/PROCESS_test-idea-from-mcp/witness/verification.md',
      );

      const closeResult = await callToolHandler({
        params: {
          name: 'method_close',
          arguments: {
            workspace: root,
            cycle: 'PROCESS_test-idea-from-mcp',
            driftCheck: true,
            outcome: 'hill-met',
          },
        },
      });
      expect(closeResult.isError).toBeFalsy();
      expect(closeResult.structuredContent.tool).toBe('method_close');
      expect(closeResult.structuredContent.result.cycle.name).toBe('PROCESS_test-idea-from-mcp');
      expect(closeResult.structuredContent.result.cycle.retroDoc).toBe(
        'docs/method/retro/PROCESS_test-idea-from-mcp/PROCESS_test-idea-from-mcp.md',
      );
    } finally {
      if (originalMethodTest === undefined) {
        delete process.env.METHOD_TEST;
      } else {
        process.env.METHOD_TEST = originalMethodTest;
      }
      vi.restoreAllMocks();
    }
  });

  it('Does `method_backlog_add` create a shaped backlog note in a requested custom lane and return stable structured content?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_backlog_add',
        arguments: {
          workspace: root,
          lane: 'v1.1.0',
          title: 'Backlog Add',
          legend: 'process',
          body: 'Body from mcp.\n',
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_backlog_add');
    expect(result.structuredContent.result.path).toBe('docs/method/backlog/v1.1.0/PROCESS_backlog-add.md');
    expect(result.structuredContent.result.lane).toBe('v1.1.0');
    expect(result.structuredContent.result.legend).toBe('PROCESS');
    expect(result.structuredContent.result.title).toBe('Backlog Add');
    expect(result.structuredContent.result.stem).toBe('PROCESS_backlog-add');
    expect(result.structuredContent.result.slug).toBe('backlog-add');
    expect(readFileSync(join(root, 'docs/method/backlog/v1.1.0/PROCESS_backlog-add.md'), 'utf8')).toContain('Body from mcp.');
  });

  it('Does `method_backlog_add` reject malformed lane names instead of writing outside the backlog tree?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_backlog_add',
        arguments: {
          workspace: root,
          lane: '../oops',
          title: 'Backlog Add',
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent.tool).toBe('method_backlog_add');
    expect(result.structuredContent.error.message).toContain('Backlog lane must be a live lane');
  });

  it('Does `method_backlog_move` move a live backlog note and return both source and destination identity?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_move-me.md'),
      [
        '---',
        'title: "Move Me"',
        'legend: PROCESS',
        'lane: inbox',
        '---',
        '',
        '# Move Me',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_backlog_move',
        arguments: {
          workspace: root,
          item: 'move-me',
          to: 'v1.1.0',
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_backlog_move');
    expect(result.structuredContent.result.sourcePath).toBe('docs/method/backlog/inbox/PROCESS_move-me.md');
    expect(result.structuredContent.result.path).toBe('docs/method/backlog/v1.1.0/PROCESS_move-me.md');
    expect(result.structuredContent.result.lane).toBe('v1.1.0');
    expect(result.structuredContent.result.legend).toBe('PROCESS');
    expect(readFileSync(join(root, 'docs/method/backlog/v1.1.0/PROCESS_move-me.md'), 'utf8')).toContain('lane: v1.1.0');
  });

  it('Does `method_backlog_move` reject unresolved item selectors before mutating the repo?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_backlog_move',
        arguments: {
          workspace: root,
          item: 'missing-item',
          to: 'v1.1.0',
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent.tool).toBe('method_backlog_move');
    expect(result.structuredContent.error.message).toContain('Could not find backlog item');
  });

  it('Does `method_retire` preview and retire a live backlog note with the same structured result contract?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'),
      [
        '---',
        'title: "Retire Me"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Retire Me',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    const callToolHandler = createCallToolHarness();

    const preview = await callToolHandler({
      params: {
        name: 'method_retire',
        arguments: {
          workspace: root,
          item: 'retire-me',
          reason: 'Superseded by another cycle.',
          replacement: 'docs/design/0040-release-scope/release-scope.md',
          dryRun: true,
        },
      },
    });

    expect(preview.isError).toBe(false);
    expect(preview.structuredContent.tool).toBe('method_retire');
    expect(preview.structuredContent.result.dryRun).toBe(true);
    expect(preview.structuredContent.result.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(preview.structuredContent.result.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(existsSync(join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'))).toBe(true);

    const applied = await callToolHandler({
      params: {
        name: 'method_retire',
        arguments: {
          workspace: root,
          item: 'retire-me',
          reason: 'Superseded by another cycle.',
          replacement: 'docs/design/0040-release-scope/release-scope.md',
        },
      },
    });

    expect(applied.isError).toBe(false);
    expect(applied.structuredContent.tool).toBe('method_retire');
    expect(applied.structuredContent.result.dryRun).toBe(false);
    expect(applied.structuredContent.result.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(applied.structuredContent.result.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(readFileSync(join(root, 'docs/method/graveyard/PROCESS_retire-me.md'), 'utf8')).toContain('## Disposition');
    expect(readFileSync(join(root, 'docs/method/graveyard/PROCESS_retire-me.md'), 'utf8')).toContain('Replacement: `docs/design/0040-release-scope/release-scope.md`');
  });

  it('Do signpost MCP tools report expected signposts and initialize supported missing signposts?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const status = await callToolHandler({
      params: {
        name: 'method_signpost_status',
        arguments: {
          workspace: root,
        },
      },
    });

    expect(status.isError).toBe(false);
    expect(status.structuredContent.tool).toBe('method_signpost_status');
    expect(status.structuredContent.result.missing).toContain('docs/BEARING.md');
    expect(status.structuredContent.result.signposts).toContainEqual(expect.objectContaining({
      name: 'BEARING',
      path: 'docs/BEARING.md',
      exists: false,
      initable: true,
    }));

    const initialized = await callToolHandler({
      params: {
        name: 'method_signpost_init',
        arguments: {
          workspace: root,
          name: 'BEARING',
        },
      },
    });

    expect(initialized.isError).toBe(false);
    expect(initialized.structuredContent.tool).toBe('method_signpost_init');
    expect(initialized.structuredContent.result.initializedTargets).toEqual(['docs/BEARING.md']);
    expect(readFileSync(join(root, 'docs/BEARING.md'), 'utf8')).toContain('# BEARING');
  });

  it('Does `method_inbox` capture explicit source metadata and return stable structured content?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_inbox',
        arguments: {
          workspace: root,
          idea: 'Feedback note worth triaging',
          legend: 'PROCESS',
          title: 'Missing API Surfaces',
          source: 'cross-repo usage',
          body: 'Observed while operating METHOD elsewhere.\n',
          capturedAt: '2026-04-11',
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_inbox');
    expect(result.structuredContent.result.path).toBe('docs/method/backlog/inbox/PROCESS_missing-api-surfaces.md');
    expect(result.structuredContent.result.lane).toBe('inbox');
    expect(result.structuredContent.result.legend).toBe('PROCESS');
    expect(result.structuredContent.result.title).toBe('Missing API Surfaces');
    expect(result.structuredContent.result.source).toBe('cross-repo usage');
    expect(result.structuredContent.result.captured_at).toBe('2026-04-11');
    expect(readFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-api-surfaces.md'), 'utf8')).toContain('Observed while operating METHOD elsewhere.');
  });

  it('Does `method_pull` use release-scoped cycle packet paths when the backlog item carries release metadata?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.createBacklogItem({
      lane: 'v2.4.5',
      title: 'Release Scope',
      legend: 'PROCESS',
      body: 'Release-scoped packet.\n',
    });
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_pull',
        arguments: {
          workspace: root,
          item: 'PROCESS_release-scope',
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_pull');
    expect(result.structuredContent.result.cycle.designDoc).toBe(
      'docs/releases/v2.4.5/design/PROCESS_release-scope.md',
    );
    expect(readFileSync(join(root, 'docs/releases/v2.4.5/design/PROCESS_release-scope.md'), 'utf8')).toContain('release: "v2.4.5"');
  });

  it('Does `method_inbox` normalize persisted legends before returning structured content?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const persistedPath = join(root, 'docs/method/backlog/inbox/PROCESS_tampered-legend.md');
    writeFileSync(
      persistedPath,
      [
        '---',
        'title: Tampered Legend',
        'lane: inbox',
        'legend: foo-bar',
        '---',
        '',
        'Body',
        '',
      ].join('\n'),
      'utf8',
    );

    const captureIdea = vi.spyOn(Workspace.prototype, 'captureIdeaWithMetadata').mockReturnValue(persistedPath);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_inbox',
        arguments: {
          workspace: root,
          idea: 'ignored by mock',
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_inbox');
    expect(result.structuredContent.result.path).toBe('docs/method/backlog/inbox/PROCESS_tampered-legend.md');
    expect(result.structuredContent.result.legend).toBe('PROCESS');
    expect(captureIdea).toHaveBeenCalled();
  });

  it('On MCP errors, can I inspect a structured error object instead of only a prose message?', async () => {
    const callToolHandler = createCallToolHarness();

    const noWorkspaceResult = await callToolHandler({ params: { name: 'method_status', arguments: {} } });
    expect(noWorkspaceResult.isError).toBe(true);
    expect(noWorkspaceResult.structuredContent.tool).toBe('method_status');
    expect(noWorkspaceResult.structuredContent.ok).toBe(false);
    expect(noWorkspaceResult.structuredContent.error.message).toContain('workspace is required');
    expect(noWorkspaceResult.content[0].text).toContain('workspace is required');

    vi.restoreAllMocks();
  });

  it('Does `method_close` reject invalid runtime argument types instead of trusting MCP schema declarations?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.captureIdea('close validation', 'PROCESS', 'Close Validation');
    workspace.pullItem('PROCESS_close-validation');
    const callToolHandler = createCallToolHarness();

    const badDriftCheck = await callToolHandler({
      params: {
        name: 'method_close',
        arguments: {
          workspace: root,
          cycle: 'PROCESS_close-validation',
          driftCheck: 'false',
          outcome: 'hill-met',
        },
      },
    });
    expect(badDriftCheck.isError).toBe(true);
    expect(badDriftCheck.structuredContent.error.message).toContain('driftCheck must be a boolean');

    const badOutcome = await callToolHandler({
      params: {
        name: 'method_close',
        arguments: {
          workspace: root,
          cycle: 'PROCESS_close-validation',
          driftCheck: true,
          outcome: 'done',
        },
      },
    });
    expect(badOutcome.isError).toBe(true);
    expect(badOutcome.structuredContent.error.message).toContain('outcome must be one of');

    const badCycle = await callToolHandler({
      params: {
        name: 'method_close',
        arguments: {
          workspace: root,
          cycle: 42,
          driftCheck: true,
          outcome: 'hill-met',
        },
      },
    });
    expect(badCycle.isError).toBe(true);
    expect(badCycle.structuredContent.error.message).toContain('cycle must be a string');

    const blankCycle = await callToolHandler({
      params: {
        name: 'method_close',
        arguments: {
          workspace: root,
          cycle: '   ',
          driftCheck: true,
          outcome: 'hill-met',
        },
      },
    });
    expect(blankCycle.isError).toBe(true);
    expect(blankCycle.structuredContent.error.message).toContain('cycle must not be empty');

    vi.restoreAllMocks();
  });

  it('Does `method_sync_github` respect explicit false flags instead of treating them as omitted defaults?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(
      join(root, '.method.json'),
      JSON.stringify({ github_token: 'test-token', github_repo: 'owner/repo' }),
      'utf8',
    );

    const pushBacklog = vi.spyOn(GitHubAdapter.prototype, 'pushBacklog').mockResolvedValue([]);
    const pullBacklog = vi.spyOn(GitHubAdapter.prototype, 'pullBacklog').mockResolvedValue([]);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_sync_github',
        arguments: {
          workspace: root,
          push: false,
          pull: false,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_sync_github');
    expect(result.structuredContent.result.pushRequested).toBe(false);
    expect(result.structuredContent.result.pullRequested).toBe(false);
    expect(pushBacklog).not.toHaveBeenCalled();
    expect(pullBacklog).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('No changes.');
  });

  it('Does `method_sync_github` allow an explicit no-op sync without GitHub credentials?', async () => {
    const root = createTempRoot();
    initWorkspace(root);

    const pushBacklog = vi.spyOn(GitHubAdapter.prototype, 'pushBacklog').mockResolvedValue([]);
    const pullBacklog = vi.spyOn(GitHubAdapter.prototype, 'pullBacklog').mockResolvedValue([]);
    const callToolHandler = createCallToolHarness();

    const result = await callToolHandler({
      params: {
        name: 'method_sync_github',
        arguments: {
          workspace: root,
          push: false,
          pull: false,
        },
      },
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent.tool).toBe('method_sync_github');
    expect(result.structuredContent.result.pushRequested).toBe(false);
    expect(result.structuredContent.result.pullRequested).toBe(false);
    expect(pushBacklog).not.toHaveBeenCalled();
    expect(pullBacklog).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('No changes.');
  });

  it('Does `method_sync_github` reject non-boolean push and pull flags before touching GitHub?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(
      join(root, '.method.json'),
      JSON.stringify({ github_token: 'test-token', github_repo: 'owner/repo' }),
      'utf8',
    );

    const pushBacklog = vi.spyOn(GitHubAdapter.prototype, 'pushBacklog').mockResolvedValue([]);
    const pullBacklog = vi.spyOn(GitHubAdapter.prototype, 'pullBacklog').mockResolvedValue([]);
    const callToolHandler = createCallToolHarness();

    const badPush = await callToolHandler({
      params: {
        name: 'method_sync_github',
        arguments: {
          workspace: root,
          push: 'false',
        },
      },
    });

    expect(badPush.isError).toBe(true);
    expect(badPush.structuredContent.error.message).toContain('push must be a boolean');
    expect(pushBacklog).not.toHaveBeenCalled();
    expect(pullBacklog).not.toHaveBeenCalled();

    const badPull = await callToolHandler({
      params: {
        name: 'method_sync_github',
        arguments: {
          workspace: root,
          pull: 'false',
        },
      },
    });

    expect(badPull.isError).toBe(true);
    expect(badPull.structuredContent.error.message).toContain('pull must be a boolean');
    expect(pushBacklog).not.toHaveBeenCalled();
    expect(pullBacklog).not.toHaveBeenCalled();
  });
});
