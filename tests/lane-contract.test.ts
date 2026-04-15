import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LANES, SCAFFOLD_LANES } from '../src/domain.js';
import { initWorkspace, Workspace } from '../src/index.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-lane-'));
  tempRoots.push(root);
  return root;
}

describe('Lane materialization contract', () => {
  it('Does `SCAFFOLD_LANES` define which lane directories `init` creates, and is it the same set as `LANES`?', () => {
    expect(SCAFFOLD_LANES).toEqual([...LANES]);
  });

  it('Does `init` create directories for all scaffold lanes?', () => {
    const root = createTempRoot();
    initWorkspace(root);

    for (const lane of SCAFFOLD_LANES) {
      expect(existsSync(join(root, 'docs/method/backlog', lane))).toBe(true);
    }
  });

  it('Does `status` report empty lanes as empty instead of treating missing lane directories as failures?', () => {
    const root = createTempRoot();
    initWorkspace(root);

    // Remove some lane directories to simulate a clone
    rmSync(join(root, 'docs/method/backlog/inbox'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/backlog/bad-code'), { recursive: true, force: true });

    const workspace = new Workspace(root);
    const status = workspace.status();

    // Status should work without error
    expect(status.root).toBe(root);
    // Missing lanes should appear as empty, not cause failures
    expect(status.backlog.inbox ?? []).toEqual([]);
    expect(status.backlog['bad-code'] ?? []).toEqual([]);
  });
});
