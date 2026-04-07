import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-exec-'));
  tempRoots.push(root);
  return root;
}

describe('Async Exec', () => {
  it('Workspace.execCommand returns a Promise and uses an async API.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // execCommand should return a Promise (thenable)
    const result = workspace.execCommand('echo hello');
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toContain('hello');
  });

  it('captureWitness is async and returns a Promise.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Test Idea', 'FEAT', 'Async Test');
    workspace.pullItem('FEAT_async-test');

    const result = workspace.captureWitness('0001-async-test');
    expect(result).toBeInstanceOf(Promise);
    const path = await result;
    expect(path).toContain('witness/verification.md');
  });

  it('closeCycle is async and returns a Promise.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Test Idea', 'FEAT', 'Close Test');
    workspace.pullItem('FEAT_close-test');

    const result = workspace.closeCycle('0001-close-test', true, 'hill-met');
    expect(result).toBeInstanceOf(Promise);
    const cycle = await result;
    expect(cycle.name).toBe('0001-close-test');
  });

  it('METHOD_TEST mock path still works and returns the same format.', async () => {
    const originalEnv = process.env.METHOD_TEST;
    process.env.METHOD_TEST = 'true';
    try {
      const root = createTempRoot();
      initWorkspace(root);
      const workspace = new Workspace(root);

      const output = await workspace.execCommand('npm test');
      expect(output).toBe('[MOCK] Output for npm test');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.METHOD_TEST;
      } else {
        process.env.METHOD_TEST = originalEnv;
      }
    }
  });

  it('The async exec supports a configurable timeout.', async () => {
    const originalEnv = process.env.METHOD_TEST;
    delete process.env.METHOD_TEST;
    try {
      const root = createTempRoot();
      initWorkspace(root);
      const workspace = new Workspace(root);

      // A command that would hang should be killed by the timeout
      await expect(
        workspace.execCommand('sleep 30', { timeoutMs: 200 }),
      ).rejects.toThrow(/timed out|killed|abort/iu);
    } finally {
      if (originalEnv !== undefined) {
        process.env.METHOD_TEST = originalEnv;
      }
    }
  });
});
