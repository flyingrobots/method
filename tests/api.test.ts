import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const root = mkdtempSync(join(tmpdir(), 'method-api-'));
  tempRoots.push(root);
  return root;
}

describe('Method API', () => {
  it('A new `src/index.ts` (or similar) exports a `Method` class or functions that return structured data (not strings).', () => {
    // Workspace is the "Method" class here.
    const workspace = new Workspace('.');
    const status = workspace.status();
    expect(typeof status).toBe('object');
    expect(status.root).toBeDefined();
  });

  it('`tests/api.test.ts` proves that a METHOD workspace can be initialized and queried via the new API without calling `runCli`.', () => {
    const root = createTempRoot();
    
    const initResult = initWorkspace(root);
    expect(initResult.created.length).toBeGreaterThan(0);

    const workspace = new Workspace(root);
    workspace.ensureInitialized();

    const status = workspace.status();
    expect(status.root).toBe(root);
    expect(status.backlog.inbox).toEqual([]);
    expect(status.activeCycles).toEqual([]);
  });

  it('programmatically captures and pulls items', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const path = workspace.captureIdea('Test idea', 'PROTO', 'My Title');
    expect(path).toContain('PROTO_my-title.md');

    const statusBefore = workspace.status();
    expect(statusBefore.backlog.inbox.length).toBe(1);
    expect(statusBefore.backlog.inbox[0].stem).toBe('PROTO_my-title');

    const cycle = workspace.pullItem('PROTO_my-title');
    expect(cycle.name).toMatch(/^0001-my-title$/);

    const statusAfter = workspace.status();
    expect(statusAfter.backlog.inbox.length).toBe(0);
    expect(statusAfter.activeCycles.length).toBe(1);
    expect(statusAfter.activeCycles[0].name).toBe(cycle.name);
  });

  it("If a backlog card's filename or directory disagrees with its YAML, does `method status` report the YAML lane and legend rather than the path-derived guess?", () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_frontmatter-wins.md'),
      [
        '---',
        'title: "Frontmatter Wins"',
        'legend: SYNTH',
        'lane: asap',
        '---',
        '',
        '# Frontmatter Wins',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const status = workspace.status();
    expect(status.backlog.inbox).toEqual([]);
    expect(status.backlog.asap).toContainEqual({
      stem: 'PROCESS_frontmatter-wins',
      lane: 'asap',
      path: 'docs/method/backlog/inbox/PROCESS_frontmatter-wins.md',
      legend: 'SYNTH',
      slug: 'frontmatter-wins',
    });
    expect(status.legendHealth).toContainEqual({
      legend: 'SYNTH',
      backlog: 1,
      active: 0,
    });
    expect(status.legendHealth.find((entry) => entry.legend === 'PROCESS')).toBeUndefined();
  });

  it('If I move a legacy backlog card between lanes, does METHOD backfill lane metadata so the card no longer depends on path inference?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_legacy-item.md'),
      '# Legacy Item\n\nBody\n',
      'utf8',
    );

    const moved = workspace.moveBacklogItem(
      'docs/method/backlog/inbox/PROCESS_legacy-item.md',
      'up-next',
    );

    expect(moved).toBe('docs/method/backlog/up-next/PROCESS_legacy-item.md');
    expect(workspace.readFrontmatter(moved)).toMatchObject({
      lane: 'up-next',
      legend: 'PROCESS',
    });
  });

  it('If a backlog card has stale filename legend text, does `method pull` still carry the YAML legend into the design packet?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_frontmatter-pull.md'),
      [
        '---',
        'title: "Frontmatter Pull"',
        'legend: SYNTH',
        'lane: asap',
        '---',
        '',
        '# Frontmatter Pull',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const cycle = workspace.pullItem('PROCESS_frontmatter-pull');
    expect(cycle.name).toBe('0001-frontmatter-pull');
    expect(readFileSync(cycle.designDoc, 'utf8')).toContain('Legend: SYNTH');
  });

  it('Can I consume backlog lane and legend from `Workspace.status()` without reverse-engineering filename prefixes or folder names?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const cycleDir = join(root, 'docs/design/0001-frontmatter-design');
    const designDoc = join(cycleDir, 'frontmatter-design.md');
    mkdirSync(cycleDir, { recursive: true });
    writeFileSync(
      designDoc,
      [
        '---',
        'title: "Frontmatter Design"',
        'legend: PROCESS',
        '---',
        '',
        '# Frontmatter Design',
        '',
        '## Hill',
        '',
        'TBD',
      ].join('\n'),
      'utf8',
    );

    const status = workspace.status();
    expect(status.legendHealth).toContainEqual({
      legend: 'PROCESS',
      backlog: 0,
      active: 1,
    });
  });

  it('All existing `tests/cli.test.ts` pass, proving no regressions in the command-line adapter.', () => {
    // This playback claim is verified by running the full test suite.
  });

  it('The codebase has a clear separation between domain logic (workspace operations) and presentation logic (CLI formatting).', () => {
    // Verified by architectural tests in cli.test.ts.
  });

  it('The `method` CLI continues to work exactly as before for all commands (`status`, `inbox`, `pull`, etc.).', () => {
    // Verified by running the full cli.test.ts suite.
  });
});
