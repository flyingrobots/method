import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubAdapter } from '../src/adapters/github.js';
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
    expect(toolNames).toContain('method_status');
    expect(toolNames).toContain('method_review_state');
    expect(toolNames).toContain('method_inbox');
    expect(toolNames).toContain('method_pull');
    expect(toolNames).toContain('method_close');
    expect(toolNames).toContain('method_drift');
    expect(toolNames).toContain('method_sync_ship');
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
      expect(pullResult.structuredContent.result.cycle.name).toBe('0001-test-idea-from-mcp');
      expect(pullResult.structuredContent.result.cycle.designDoc).toBe(
        'docs/design/0001-test-idea-from-mcp/test-idea-from-mcp.md',
      );

      const captureResult = await callToolHandler({
        params: { name: 'method_capture_witness', arguments: { workspace: root, cycle: '0001-test-idea-from-mcp' } },
      });
      expect(captureResult.isError).toBeFalsy();
      expect(captureResult.structuredContent.tool).toBe('method_capture_witness');
      expect(captureResult.structuredContent.result.path).toBe(
        'docs/method/retro/0001-test-idea-from-mcp/witness/verification.md',
      );

      const closeResult = await callToolHandler({
        params: {
          name: 'method_close',
          arguments: {
            workspace: root,
            cycle: '0001-test-idea-from-mcp',
            driftCheck: true,
            outcome: 'hill-met',
          },
        },
      });
      expect(closeResult.isError).toBeFalsy();
      expect(closeResult.structuredContent.tool).toBe('method_close');
      expect(closeResult.structuredContent.result.cycle.name).toBe('0001-test-idea-from-mcp');
      expect(closeResult.structuredContent.result.cycle.retroDoc).toBe(
        'docs/method/retro/0001-test-idea-from-mcp/test-idea-from-mcp.md',
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

    const captureIdea = vi.spyOn(Workspace.prototype, 'captureIdea').mockReturnValue(persistedPath);
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
          cycle: '0001-close-validation',
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
          cycle: '0001-close-validation',
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
