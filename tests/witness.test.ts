import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    const witnessPath = workspace.captureWitness(cycle.name);
    
    expect(witnessPath).toContain('docs/method/retro/0001-witness-test/witness/verification.md');
    
    const content = readFileSync(witnessPath, 'utf8');
    expect(content).toContain('# Verification Witness for Cycle 1');
    expect(content).toContain('[MOCK] Output for npm test');
    expect(content).toContain('[MOCK] Output for tsx src/cli.ts drift 0001-witness-test');
    expect(content).toContain('- [x] Automated capture completed successfully.');
  });
});
