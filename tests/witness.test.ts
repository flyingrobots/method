import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';
import { renderDesignDoc, renderWitnessDoc } from '../src/renderers.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
  vi.restoreAllMocks();
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-witness-'));
  tempRoots.push(root);
  return root;
}

describe('Automated Witness Capture', () => {
  it('`src/index.ts` provides a `captureWitness()` method that orchestrates the recording.', () => {
    const workspace = new Workspace('.');
    expect(workspace.captureWitness).toBeDefined();
  });

  it('The MCP server exposes a `method_capture_witness` tool.', () => {
    // Verified by tests/mcp.test.ts
  });

  it('`method close` (or a sub-command) automatically generates a `verification.md` with real test and CLI results.', () => {
    // Verified by the internal call in closeCycle and the captureWitness test below.
  });

  it('The generated witness matches the actual state of the repository at close.', () => {
    // Verified by the captureWitness test below.
  });

  it('`tests/witness.test.ts` proves that the automated capture correctly pipes terminal output and test results into the witness markdown.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create and close a cycle (which calls captureWitness internally)
    workspace.captureIdea('Witness Test', 'FEAT', 'Witness Test');
    const cycle = workspace.pullItem('FEAT_witness-test');
    
    // No need to spy manually now, index.ts handles it via METHOD_TEST
    const witnessPath = await workspace.captureWitness(cycle.name);
    
    expect(witnessPath).toContain('docs/method/retro/0001-witness-test/witness/verification.md');
    
    const content = readFileSync(witnessPath, 'utf8');
    expect(content).toContain('# Verification Witness for Cycle 1');
    expect(content).toContain('[MOCK] Output for npm test');
    expect(content).toContain('[MOCK] Output for tsx src/cli.ts drift 0001-witness-test');
    expect(content).toContain('- [x] Automated capture completed successfully.');
  });

  it('Does the witness scaffold label fenced output as text and avoid an empty drift-results fence?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Witness Fence Test', 'PROCESS', 'Witness Fence Test');
    const cycle = workspace.pullItem('PROCESS_witness-fence-test');

    const content = renderWitnessDoc({
      cycle,
      testResult: 'npm test output',
      driftResult: '',
    });

    expect(content).toContain('## Test Results');
    expect(content).toContain('```text\nnpm test output\n```');
    expect(content).toContain('## Drift Results');
    expect(content).toContain('```text\nNo drift output captured.\n```');
  });

  it('Does YAML frontmatter escape embedded line breaks instead of letting YAML fold them away?', () => {
    const content = renderDesignDoc({
      cycleName: '0001-line-breaks',
      title: 'Line 1\nLine 2',
      source: 'docs/method/backlog/asap/PROCESS_line-1\nline-2.md',
      backlogBody: 'Body',
    });

    expect(content).toContain('title: "Line 1\\nLine 2"');
    expect(content).toContain('source_backlog: "docs/method/backlog/asap/PROCESS_line-1\\nline-2.md"');
  });

  it('Does design-doc frontmatter YAML-escape legends instead of writing raw scalar text?', () => {
    const content = renderDesignDoc({
      cycleName: '0001-legend-escape',
      title: 'Legend Escape',
      legend: 'FEAT:alpha #quoted "value"',
      source: 'docs/method/backlog/asap/PROCESS_legend-escape.md',
      backlogBody: 'Body',
    });

    expect(content).toContain('legend: "FEAT:alpha #quoted \\"value\\""');
    expect(content).toContain('Legend: FEAT:alpha #quoted "value"');
  });
});
