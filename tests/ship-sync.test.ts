import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';
import { renderBearing } from '../src/renderers.js';

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
    const itemPath = workspace.captureIdea('Feature X', 'PROCESS', 'New Feature');
    const cycle = workspace.pullItem('PROCESS_new-feature');
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
    workspace.captureIdea('Next priority', 'PROCESS', 'Up Next');
    workspace.moveBacklogItem('docs/method/backlog/inbox/PROCESS_up-next.md', 'up-next');

    const itemPath = workspace.captureIdea('Feature Z', 'PROCESS', 'Just Shipped');
    const cycle = workspace.pullItem('PROCESS_just-shipped');
    await workspace.closeCycle(cycle.name, true, 'hill-met');

    // Run ship sync
    await workspace.shipSync();

    // Verify BEARING
    const bearing = readFileSync(join(root, 'docs/BEARING.md'), 'utf8');
    expect(bearing).toContain(`- \`${cycle.name}\`: Just Shipped`);
    expect(bearing).toContain('PROCESS_up-next');
  });

  it('`src/index.ts` provides a `shipSync()` method that performs the orchestration.', () => {
    const workspace = new Workspace('.');
    expect(workspace.shipSync).toBeDefined();
  });

  it('Does `shipSync()` stay idempotent when the closed-cycle fixtures use live repo legends instead of stale feature labels?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create and close a cycle
    workspace.captureIdea('Feature Y', 'PROCESS', 'Another Feature');
    const cycle = workspace.pullItem('PROCESS_another-feature');
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

  it('treats cycle ranges and numeric references in release sections as already shipped.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Feature A', 'PROCESS', 'Feature A');
    const cycleOne = workspace.pullItem('PROCESS_feature-a');
    await workspace.closeCycle(cycleOne.name, true, 'hill-met');

    workspace.captureIdea('Feature B', 'PROCESS', 'Feature B');
    const cycleTwo = workspace.pullItem('PROCESS_feature-b');
    await workspace.closeCycle(cycleTwo.name, true, 'hill-met');

    writeFileSync(
      join(root, 'CHANGELOG.md'),
      [
        '# Changelog',
        '',
        '## Unreleased',
        '',
        '- No externally meaningful changes recorded yet.',
        '',
        '## v0.1.0',
        '',
        'Released cycle work: 0001–0002.',
      ].join('\n'),
      'utf8',
    );

    const result = await workspace.shipSync();
    expect(result.newShips).toEqual([]);
    expect(result.updated).not.toContain('CHANGELOG.md');
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

  it('Does generated `BEARING.md` stop claiming witness generation is not automated?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    await workspace.shipSync();

    const bearing = readFileSync(join(root, 'docs/BEARING.md'), 'utf8');
    expect(bearing).not.toContain('Witness generation is not yet automated.');
  });

  it('When backlog pressure changes, does `BEARING.md` describe concrete live repo state instead of hardcoded stale complaints?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Inbox pressure', 'PROCESS', 'Inbox Pressure');
    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_asap-pressure.md'),
      [
        '---',
        'title: "ASAP Pressure"',
        'legend: PROCESS',
        'lane: asap',
        '---',
        '',
        '# ASAP Pressure',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/bad-code/PROCESS_bad-code-pressure.md'),
      [
        '---',
        'title: "Bad Code Pressure"',
        'legend: PROCESS',
        'lane: bad-code',
        '---',
        '',
        '# Bad Code Pressure',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    await workspace.shipSync();

    const bearing = readFileSync(join(root, 'docs/BEARING.md'), 'utf8');
    expect(bearing).toContain('Inbox still holds 1 untriaged item(s).');
    expect(bearing).toContain('1 ASAP backlog item(s) are still unresolved.');
    expect(bearing).toContain('1 bad-code item(s) remain tracked.');
    expect(bearing).not.toContain('Backlog maintenance is still largely manual.');
  });

  it('Can I point to the exact backlog counts that caused each `What feels wrong?` line?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Inbox pressure', 'PROCESS', 'Inbox Pressure');
    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_asap-pressure.md'),
      [
        '---',
        'title: "ASAP Pressure"',
        'legend: PROCESS',
        'lane: asap',
        '---',
        '',
        '# ASAP Pressure',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const bearing = renderBearing(workspace.status(), [], 'test-sha');
    expect(bearing).toContain('Inbox still holds 1 untriaged item(s).');
    expect(bearing).toContain('1 ASAP backlog item(s) are still unresolved.');
    expect(bearing).not.toContain('2 ASAP backlog item(s) are still unresolved.');
  });

  it('Does `renderBearing` only emit derived or tightly bounded statements instead of unaudited repo assertions?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const bearing = renderBearing(workspace.status(), [], 'test-sha');
    expect(bearing).toContain('Current priority: no explicit `asap` or `up-next` item is currently recorded.');
    expect(bearing).toContain('No acute coordination pain is currently recorded.');
    expect(bearing).not.toContain('Current priority: pull TBD');
    expect(bearing).not.toContain('Backlog maintenance is still largely manual.');
    expect(bearing).not.toContain('Witness generation is not yet automated.');
  });
});
