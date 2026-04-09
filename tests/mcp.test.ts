import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GitHubAdapter } from '../src/adapters/github.js';
import { createMcpServer } from '../src/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initWorkspace, Workspace } from '../src/index.js';

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

function createCallToolHarness() {
  let callToolHandler: any;
  const mockServer = {
    setRequestHandler: vi.fn((schema, handler) => {
      if (schema === CallToolRequestSchema) {
        callToolHandler = handler;
      }
    }),
  };

  vi.spyOn(Server.prototype, 'setRequestHandler').mockImplementation(mockServer.setRequestHandler);
  createMcpServer();
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
    vi.restoreAllMocks();
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
});
