import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
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
  const root = mkdtempSync(join(tmpdir(), 'method-ship-sync-'));
  tempRoots.push(root);
  return root;
}

describe('Ship Sync', () => {
  it('A new `method sync ship` command identifies closed cycles that are not yet in the `CHANGELOG.md` and appends them.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create and close a cycle
    const itemPath = workspace.captureIdea('Feature X', 'FEAT', 'New Feature');
    const cycle = workspace.pullItem('FEAT_new-feature');
    await workspace.closeCycle(cycle.name, true, 'hill-met');

    // Run ship sync
    const result = await workspace.shipSync();
    expect(result.newShips.length).toBe(1);
    expect(result.newShips[0].name).toBe(cycle.name);
    expect(result.updated).toContain('CHANGELOG.md');
    expect(result.updated).toContain('docs/BEARING.md');

    // Verify CHANGELOG
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    expect(changelog).toContain(`- New Feature (${cycle.name})`);
  });

  it('`docs/BEARING.md` is automatically refreshed with the latest ships and the next items in the backlog.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create a backlog item and move it to up-next
    workspace.captureIdea('Next priority', 'FEAT', 'Up Next');
    renameSync(
      join(root, 'docs/method/backlog/inbox/FEAT_up-next.md'),
      join(root, 'docs/method/backlog/up-next/FEAT_up-next.md')
    );

    const itemPath = workspace.captureIdea('Feature Z', 'FEAT', 'Just Shipped');
    const cycle = workspace.pullItem('FEAT_just-shipped');
    await workspace.closeCycle(cycle.name, true, 'hill-met');

    // Run ship sync
    await workspace.shipSync();

    // Verify BEARING
    const bearing = readFileSync(join(root, 'docs/BEARING.md'), 'utf8');
    expect(bearing).toContain(`- \`${cycle.name}\`: Just Shipped`);
    expect(bearing).toContain('FEAT_up-next');
  });

  it('`src/index.ts` provides a `shipSync()` method that performs the orchestration.', () => {
    const workspace = new Workspace('.');
    expect(workspace.shipSync).toBeDefined();
  });

  it('`tests/ship-sync.test.ts` proves that the sync is idempotent (running it twice doesn\'t duplicate entries).', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create and close a cycle
    workspace.captureIdea('Feature Y', 'FEAT', 'Another Feature');
    const cycle = workspace.pullItem('FEAT_another-feature');
    await workspace.closeCycle(cycle.name, true, 'hill-met');

    // Run ship sync first time
    await workspace.shipSync();
    const changelogFirst = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    const countFirst = (changelogFirst.match(new RegExp(cycle.name, 'g')) || []).length;
    expect(countFirst).toBe(1);

    // Run ship sync second time
    const result = await workspace.shipSync();
    expect(result.newShips.length).toBe(0);
    expect(result.updated).not.toContain('CHANGELOG.md');

    const changelogSecond = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    const countSecond = (changelogSecond.match(new RegExp(cycle.name, 'g')) || []).length;
    expect(countSecond).toBe(1);
  });

  it('The command correctly handles workspaces with no new ships.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const result = await workspace.shipSync();
    expect(result.newShips.length).toBe(0);
    expect(result.updated).toContain('docs/BEARING.md');
    expect(result.updated).not.toContain('CHANGELOG.md');
  });
});
