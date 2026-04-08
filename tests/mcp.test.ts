import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('Does `method_status` return summary-shaped structured content by default, with lane counts instead of the fully expanded backlog?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.captureIdea('test idea from mcp', undefined, 'Test Idea From MCP');
    const callToolHandler = createCallToolHarness();

    const statusResult = await callToolHandler({ params: { name: 'method_status', arguments: { workspace: root } } });
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

  it('Can I request `method_status` full mode and still receive the expanded structured workspace state without scraping text?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    workspace.captureIdea('test idea from mcp', 'PROCESS', 'Test Idea From MCP');
    const callToolHandler = createCallToolHarness();

    const statusResult = await callToolHandler({
      params: { name: 'method_status', arguments: { workspace: root, summary: false } },
    });

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
    expect(statusResult.content[0].text).toContain('Returned full workspace status');
    vi.restoreAllMocks();
  });

  it('Do mutation tools (`method_inbox`, `method_pull`, `method_close`, `method_capture_witness`) return stable field-level structured content for paths and cycles?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const callToolHandler = createCallToolHarness();
    const originalMethodTest = process.env.METHOD_TEST;
    process.env.METHOD_TEST = 'true';
    try {
      const inboxResult = await callToolHandler({
        params: { name: 'method_inbox', arguments: { workspace: root, idea: 'test idea from mcp' } },
      });
      expect(inboxResult.isError).toBeFalsy();
      expect(inboxResult.structuredContent.tool).toBe('method_inbox');
      expect(inboxResult.structuredContent.result.path).toBe('docs/method/backlog/inbox/test-idea-from-mcp.md');
      expect(inboxResult.structuredContent.result.lane).toBe('inbox');

      const pullResult = await callToolHandler({
        params: { name: 'method_pull', arguments: { workspace: root, item: 'test-idea-from-mcp' } },
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
});
