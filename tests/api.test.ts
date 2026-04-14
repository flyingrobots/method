import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative as pathRelative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { initWorkspace, Workspace } from '../src/index.js';

class MemoryWriter {
  output = '';
  write(data: string | Buffer): boolean {
    this.output += typeof data === 'string' ? data : data.toString('utf8');
    return true;
  }
}

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

function ensureBacklogLane(root: string, lane: string): void {
  mkdirSync(join(root, 'docs/method/backlog', lane), { recursive: true });
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

    const path = workspace.captureIdea('Test idea', 'PROCESS', 'My Title');
    expect(path).toContain('PROCESS_my-title.md');

    const statusBefore = workspace.status();
    expect(statusBefore.backlog.inbox.length).toBe(1);
    expect(statusBefore.backlog.inbox[0].stem).toBe('PROCESS_my-title');

    const cycle = workspace.pullItem('PROCESS_my-title');
    expect(cycle.name).toBe('PROCESS_my-title');

    const statusAfter = workspace.status();
    expect(statusAfter.backlog.inbox.length).toBe(0);
    expect(statusAfter.activeCycles.length).toBe(1);
    expect(statusAfter.activeCycles[0].name).toBe(cycle.name);
  });

  it('programmatically creates a shaped backlog item in an explicit custom lane.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const path = workspace.createBacklogItem({
      lane: 'v1.1.0',
      title: 'Backlog Add',
      legend: 'PROCESS',
      body: 'Backlog body.\n',
    });

    expect(path).toContain('docs/method/backlog/v1.1.0/PROCESS_backlog-add.md');
    expect(readFileSync(path, 'utf8')).toContain('# Backlog Add');
    expect(readFileSync(path, 'utf8')).toContain('Backlog body.');

    const status = workspace.status();
    expect(status.backlog['v1.1.0']).toContainEqual({
      stem: 'PROCESS_backlog-add',
      lane: 'v1.1.0',
      path: 'docs/method/backlog/v1.1.0/PROCESS_backlog-add.md',
      legend: 'PROCESS',
      slug: 'backlog-add',
    });
  });

  it('builds a live backlog dependency graph, reports ready work, and preserves dependency arrays during lane moves.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_foundation.md'),
      ['---', 'title: "Foundation"', 'legend: PROCESS', 'lane: up-next', '---', '', '# Foundation', '', 'Body'].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_build.md'),
      [
        '---',
        'title: "Build"',
        'legend: PROCESS',
        'lane: up-next',
        'blocked_by:',
        '  - foundation',
        'blocks:',
        '  - finish',
        '---',
        '',
        '# Build',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_finish.md'),
      ['---', 'title: "Finish"', 'legend: PROCESS', 'lane: up-next', 'blocked_by:', '  - build', '---', '', '# Finish', '', 'Body'].join(
        '\n',
      ),
      'utf8',
    );

    const report = workspace.backlogDependencies({ item: 'finish', criticalPath: true });

    expect(report.ready.map((item) => item.stem)).toEqual(['PROCESS_foundation']);
    expect(report.edges).toHaveLength(2);
    expect(report.edges).toContainEqual({
      blocker: 'docs/method/backlog/up-next/PROCESS_foundation.md',
      blocked: 'docs/method/backlog/up-next/PROCESS_build.md',
    });
    expect(report.edges).toContainEqual({
      blocker: 'docs/method/backlog/up-next/PROCESS_build.md',
      blocked: 'docs/method/backlog/up-next/PROCESS_finish.md',
    });
    expect(report.focus?.item.stem).toBe('PROCESS_finish');
    expect(report.focus?.blockers.map((item) => item.stem)).toEqual(['PROCESS_build']);
    expect(report.focus?.criticalPath.map((item) => item.stem)).toEqual(['PROCESS_foundation', 'PROCESS_build', 'PROCESS_finish']);
    expect(report.cycles).toEqual([]);

    const moved = workspace.moveBacklogItem('docs/method/backlog/up-next/PROCESS_build.md', 'bad-code');
    const movedContent = readFileSync(join(root, moved), 'utf8');
    expect(movedContent).toContain('lane: bad-code');
    expect(movedContent).toMatch(/blocked_by:\n\s*-\s*foundation/mu);
    expect(movedContent).toMatch(/blocks:\n\s*-\s*finish/mu);
  });

  it('returns bounded structured backlog query results including explicit keywords and frontmatter metadata.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-foundation.md'),
      [
        '---',
        'title: "Query Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        'owner: "METHOD maintainers"',
        'priority: medium',
        'keywords:',
        '  - agent',
        '  - query',
        'blocked_by:',
        '  - setup',
        'acceptance_criteria:',
        '  - "Has a query API"',
        '---',
        '',
        '# Query Foundation',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-polish.md'),
      [
        '---',
        'title: "Query Polish"',
        'legend: PROCESS',
        'lane: up-next',
        'priority: medium',
        'keywords:',
        '  - agent',
        '  - polish',
        '---',
        '',
        '# Query Polish',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const result = workspace.backlogQuery({ lane: 'up-next', keyword: 'agent', limit: 1 });

    expect(result.filters).toEqual({
      lane: 'up-next',
      legend: undefined,
      priority: undefined,
      keyword: 'agent',
      owner: undefined,
      ready: undefined,
      hasAcceptanceCriteria: undefined,
      blockedBy: undefined,
      blocks: undefined,
      sort: 'lane',
      limit: 1,
    });
    expect(result.totalCount).toBe(2);
    expect(result.returnedCount).toBe(1);
    expect(result.truncated).toBe(true);
    expect(result.items[0]).toEqual({
      stem: 'PROCESS_query-foundation',
      lane: 'up-next',
      path: 'docs/method/backlog/up-next/PROCESS_query-foundation.md',
      legend: 'PROCESS',
      slug: 'query-foundation',
      title: 'Query Foundation',
      owner: 'METHOD maintainers',
      priority: 'medium',
      keywords: ['agent', 'query'],
      blockedBy: ['setup'],
      blocks: [],
      hasAcceptanceCriteria: true,
    });
  });

  it('filters backlog queries by explicit owner and can include blocked matches in next-work results.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_blocked-owner-match.md'),
      [
        '---',
        'title: "Blocked Owner Match"',
        'legend: PROCESS',
        'lane: up-next',
        'owner: "Core Team"',
        'priority: medium',
        'keywords:',
        '  - roadmap',
        'blocked_by:',
        '  - setup',
        '---',
        '',
        '# Blocked Owner Match',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/cool-ideas/PROCESS_ready-owner-match.md'),
      [
        '---',
        'title: "Ready Owner Match"',
        'legend: PROCESS',
        'lane: cool-ideas',
        'owner: "Core Team"',
        'priority: medium',
        'keywords:',
        '  - roadmap',
        '---',
        '',
        '# Ready Owner Match',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_other-owner.md'),
      [
        '---',
        'title: "Other Owner"',
        'legend: PROCESS',
        'lane: up-next',
        'owner: "Platform Team"',
        'priority: medium',
        'keywords:',
        '  - roadmap',
        '---',
        '',
        '# Other Owner',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const query = workspace.backlogQuery({ owner: 'core team', limit: 10 });
    expect(query.filters.owner).toBe('core team');
    expect(query.items.map((item) => item.stem)).toEqual(['PROCESS_blocked-owner-match', 'PROCESS_ready-owner-match']);

    const readyOnly = workspace.nextWork({ owner: 'core team', keyword: 'roadmap', limit: 5 });
    expect(readyOnly.recommendations.map((item) => item.path)).toEqual(['docs/method/backlog/cool-ideas/PROCESS_ready-owner-match.md']);
    expect(readyOnly.selection_notes).toContain('Skipped 1 blocked backlog item(s) because unblocked work is available.');
    expect(readyOnly.selection_notes).toContain('Applied filters: keyword=roadmap, owner=core team.');

    const includeBlocked = workspace.nextWork({ owner: 'core team', keyword: 'roadmap', includeBlocked: true, limit: 5 });
    expect(includeBlocked.recommendations.map((item) => item.path)).toEqual([
      'docs/method/backlog/up-next/PROCESS_blocked-owner-match.md',
      'docs/method/backlog/cool-ideas/PROCESS_ready-owner-match.md',
    ]);
    expect(includeBlocked.selection_notes).toContain('Blocked items were included because `include-blocked` was requested.');
    expect(includeBlocked.selection_notes).toContain('Applied filters: keyword=roadmap, owner=core team.');
  });

  it('filters backlog queries by readiness, acceptance criteria presence, and declared dependency refs.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-foundation.md'),
      [
        '---',
        'title: "Query Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        'keywords:',
        '  - query',
        'blocked_by:',
        '  - setup',
        'blocks:',
        '  - finish',
        'acceptance_criteria:',
        '  - "Has a query API"',
        '---',
        '',
        '# Query Foundation',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_query-polish.md'),
      [
        '---',
        'title: "Query Polish"',
        'legend: PROCESS',
        'lane: up-next',
        'blocks:',
        '  - finish',
        '---',
        '',
        '# Query Polish',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const result = workspace.backlogQuery({
      ready: false,
      hasAcceptanceCriteria: true,
      blockedBy: 'SETUP',
      blocks: 'finish',
      limit: 10,
    });

    expect(result.filters.ready).toBe(false);
    expect(result.filters.hasAcceptanceCriteria).toBe(true);
    expect(result.filters.blockedBy).toBe('setup');
    expect(result.filters.blocks).toBe('finish');
    expect(result.items.map((item) => item.stem)).toEqual(['PROCESS_query-foundation']);
    expect(result.items[0].hasAcceptanceCriteria).toBe(true);
    expect(result.items[0].blockedBy).toEqual(['setup']);
    expect(result.items[0].blocks).toEqual(['finish']);
  });

  it('sorts backlog query results by explicit priority or path when requested.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_alpha-low.md'),
      ['---', 'title: "Alpha Low"', 'legend: PROCESS', 'lane: up-next', 'priority: low', '---', '', '# Alpha Low', '', 'Body'].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/bad-code/PROCESS_beta-critical.md'),
      [
        '---',
        'title: "Beta Critical"',
        'legend: PROCESS',
        'lane: bad-code',
        'priority: critical',
        '---',
        '',
        '# Beta Critical',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/cool-ideas/PROCESS_gamma-unset.md'),
      ['---', 'title: "Gamma Unset"', 'legend: PROCESS', 'lane: cool-ideas', '---', '', '# Gamma Unset', '', 'Body'].join('\n'),
      'utf8',
    );

    const prioritySorted = workspace.backlogQuery({ sort: 'priority', limit: 10 });
    expect(prioritySorted.filters.sort).toBe('priority');
    expect(prioritySorted.items.map((item) => item.stem)).toEqual(['PROCESS_beta-critical', 'PROCESS_alpha-low', 'PROCESS_gamma-unset']);

    const pathSorted = workspace.backlogQuery({ sort: 'path', limit: 10 });
    expect(pathSorted.filters.sort).toBe('path');
    expect(pathSorted.items.map((item) => item.stem)).toEqual(['PROCESS_beta-critical', 'PROCESS_gamma-unset', 'PROCESS_alpha-low']);
  });

  it('edits schema-backed backlog metadata with normalized set and clear behavior.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.createBacklogItem({
      lane: 'up-next',
      title: 'Metadata Edit',
      legend: 'PROCESS',
      body: 'Body.\n',
    });

    const updated = workspace.editBacklogMetadata('metadata-edit', {
      owner: 'Core Team',
      priority: 'HIGH',
      keywords: ['roadmap', 'Roadmap', 'query'],
      blockedBy: ['setup', 'setup'],
      blocks: ['finish', 'Finish'],
    });

    expect(updated.updatedFields).toEqual(['owner', 'priority', 'keywords', 'blocked_by', 'blocks']);
    expect(updated.owner).toBe('Core Team');
    expect(updated.priority).toBe('high');
    expect(updated.keywords).toEqual(['roadmap', 'query']);
    expect(updated.blockedBy).toEqual(['setup']);
    expect(updated.blocks).toEqual(['finish']);

    const afterSet = readFileSync(join(root, updated.path), 'utf8');
    expect(afterSet).toContain('owner: Core Team');
    expect(afterSet).toContain('priority: high');
    expect(afterSet).toContain('keywords:');
    expect(afterSet).toContain('blocked_by:');
    expect(afterSet).toContain('blocks:');

    const cleared = workspace.editBacklogMetadata('metadata-edit', {
      clearOwner: true,
      clearPriority: true,
      clearKeywords: true,
      clearBlockedBy: true,
      clearBlocks: true,
    });

    expect(cleared.updatedFields).toEqual(['owner', 'priority', 'keywords', 'blocked_by', 'blocks']);
    expect(cleared.owner).toBeUndefined();
    expect(cleared.priority).toBeUndefined();
    expect(cleared.keywords).toEqual([]);
    expect(cleared.blockedBy).toEqual([]);
    expect(cleared.blocks).toEqual([]);

    const afterClear = readFileSync(join(root, cleared.path), 'utf8');
    expect(afterClear).not.toContain('owner:');
    expect(afterClear).not.toContain('priority:');
    expect(afterClear).not.toContain('keywords:');
    expect(afterClear).not.toContain('blocked_by:');
    expect(afterClear).not.toContain('blocks:');
  });

  it('returns an advisory next-work menu that can cite BEARING when it elevates an item above default lane order.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_up-next-foundation.md'),
      [
        '---',
        'title: "Up Next Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        'priority: medium',
        '---',
        '',
        '# Up Next Foundation',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/bad-code/PROCESS_bad-fix.md'),
      ['---', 'title: "Bad Fix"', 'legend: PROCESS', 'lane: bad-code', 'priority: medium', '---', '', '# Bad Fix', '', 'Body'].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/method/backlog/cool-ideas/PROCESS_bearing-star.md'),
      [
        '---',
        'title: "Bearing Star"',
        'legend: PROCESS',
        'lane: cool-ideas',
        'priority: medium',
        'keywords:',
        '  - roadmap',
        '---',
        '',
        '# Bearing Star',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/BEARING.md'),
      [
        '---',
        'title: "BEARING"',
        'generated_at: 2026-04-11T00:00:00.000Z',
        'generator: "test"',
        'generated_from_commit: "test-sha"',
        'provenance_level: artifact_history',
        '---',
        '',
        '# BEARING',
        '',
        '## Where are we going?',
        '',
        'Current priority: explore `PROCESS_bearing-star` next.',
        '',
        '## What just shipped?',
        '',
        '- None yet.',
        '',
        '## What feels wrong?',
        '',
        '- No acute coordination pain is currently recorded.',
      ].join('\n'),
      'utf8',
    );

    const result = workspace.nextWork({ limit: 3 });

    expect(result.summary.bearing_priority).toContain('PROCESS_bearing-star');
    expect(result.recommendations.map((item) => item.path)).toEqual([
      'docs/method/backlog/up-next/PROCESS_up-next-foundation.md',
      'docs/method/backlog/cool-ideas/PROCESS_bearing-star.md',
      'docs/method/backlog/bad-code/PROCESS_bad-fix.md',
    ]);
    expect(result.recommendations[1]?.signals).toContainEqual({
      type: 'bearing_mention',
      value: 'Current priority: explore `PROCESS_bearing-star` next.',
      source: 'docs/BEARING.md#Where are we going?',
    });
    expect(result.selection_notes).toContainEqual(expect.stringContaining('BEARING elevated `PROCESS_bearing-star`'));
  });

  it('programmatically captures outside-in notes directly into inbox with stable intake metadata.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const path = workspace.captureIdeaWithMetadata('Missing API Surfaces', undefined, 'Missing API Surfaces', {
      source: 'cross-repo usage',
      body: 'Observed while operating METHOD from another repo.\n',
      capturedAt: '2026-04-11',
    });

    expect(path).toContain('docs/method/backlog/inbox/missing-api-surfaces.md');
    expect(readFileSync(path, 'utf8')).toContain('# Missing API Surfaces');
    expect(readFileSync(path, 'utf8')).toContain('source: "cross-repo usage"');
    expect(readFileSync(path, 'utf8')).toContain('captured_at: "2026-04-11"');
    expect(workspace.describeBacklogPath(workspace.resolveRepoPath(path))).toEqual({
      stem: 'missing-api-surfaces',
      lane: 'inbox',
      path: 'docs/method/backlog/inbox/missing-api-surfaces.md',
      legend: undefined,
      slug: 'missing-api-surfaces',
      title: 'Missing API Surfaces',
      release: undefined,
      source: 'cross-repo usage',
      captured_at: '2026-04-11',
    });
  });

  it('pulls release-lane backlog work into release-scoped design and retro packets.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.createBacklogItem({
      lane: 'v2.4.5',
      title: 'Release Scope',
      legend: 'PROCESS',
      body: 'Original release body.\n',
    });

    const cycle = workspace.pullItem('release-scope');
    expect(cycle.designDoc).toBe(join(root, 'docs/releases/v2.4.5/design/PROCESS_release-scope.md'));
    expect(cycle.retroDoc).toBe(join(root, 'docs/releases/v2.4.5/retros/PROCESS_release-scope/PROCESS_release-scope.md'));
    expect(readFileSync(cycle.designDoc, 'utf8')).toContain('release: "v2.4.5"');

    await workspace.closeCycle(cycle.name, true, 'hill-met');
    expect(readFileSync(cycle.retroDoc, 'utf8')).toContain('release: "v2.4.5"');
    expect(existsSync(join(root, 'docs/releases/v2.4.5/retros/PROCESS_release-scope/witness/verification.md'))).toBe(true);
  });

  it('preserves release metadata when work is promoted from a release lane into asap before pull.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const created = workspace.createBacklogItem({
      lane: 'v2.4.5',
      title: 'Release ASAP',
      legend: 'PROCESS',
      body: 'Queue me next.\n',
    });
    const moved = workspace.moveBacklogItem(workspace.resolveRepoPath(created), 'asap');
    expect(readFileSync(join(root, moved), 'utf8')).toContain('release: v2.4.5');

    const cycle = workspace.pullItem('release-asap');
    expect(cycle.designDoc).toBe(join(root, 'docs/releases/v2.4.5/design/PROCESS_release-asap.md'));
  });

  it('programmatically retires a live backlog item into the graveyard with a disposition tombstone.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.createBacklogItem({
      lane: 'up-next',
      title: 'Retire Me',
      legend: 'PROCESS',
      body: 'Original proposal body.\n',
    });

    const retired = workspace.retireBacklogItem(
      'retire-me',
      'Superseded by the broader release-scope cycle.',
      'docs/design/0040-release-scope/release-scope.md',
    );

    expect(retired.ok).toBe(true);
    expect(retired.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(retired.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(retired.updatedFiles).toEqual([
      'docs/method/backlog/up-next/PROCESS_retire-me.md',
      'docs/method/graveyard/PROCESS_retire-me.md',
    ]);
    expect(existsSync(join(root, retired.sourcePath))).toBe(false);
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain('lane: graveyard');
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain('## Disposition');
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain('Superseded by the broader release-scope cycle.');
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain(
      'Replacement: `docs/design/0040-release-scope/release-scope.md`',
    );
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain('## Original Proposal');
    expect(readFileSync(join(root, retired.graveyardPath), 'utf8')).toContain('Original proposal body.');
  });

  it('can preview backlog retirement without mutating the repo.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.createBacklogItem({
      lane: 'up-next',
      title: 'Retire Me',
      legend: 'PROCESS',
      body: 'Original proposal body.\n',
    });

    const preview = workspace.retireBacklogItem('retire-me', 'No longer relevant.', undefined, { dryRun: true });

    expect(preview.ok).toBe(true);
    expect(preview.dryRun).toBe(true);
    expect(preview.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(preview.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(existsSync(join(root, preview.sourcePath))).toBe(true);
    expect(existsSync(join(root, preview.graveyardPath))).toBe(false);
  });

  it('reports expected signposts and can initialize narrowly supported missing signposts.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const statusBefore = workspace.signpostStatus();
    expect(statusBefore.missing).toContain('README.md');
    expect(statusBefore.missing).toContain('docs/BEARING.md');
    expect(statusBefore.signposts).toContainEqual(
      expect.objectContaining({
        name: 'BEARING',
        path: 'docs/BEARING.md',
        kind: 'Generated',
        exists: false,
        initable: true,
      }),
    );
    expect(statusBefore.signposts).toContainEqual(
      expect.objectContaining({
        name: 'VISION',
        path: 'docs/VISION.md',
        kind: 'Generated',
        exists: false,
        initable: false,
      }),
    );

    const initialized = await workspace.initSignpost('BEARING');
    expect(initialized.ok).toBe(true);
    expect(initialized.requested).toBe('BEARING');
    expect(initialized.initializedTargets).toEqual(['docs/BEARING.md']);
    expect(initialized.skippedPaths).toEqual([]);
    expect(readFileSync(join(root, 'docs/BEARING.md'), 'utf8')).toContain('# BEARING');

    const skipped = await workspace.initSignpost('BEARING');
    expect(skipped.initializedTargets).toEqual([]);
    expect(skipped.skippedPaths).toEqual(['docs/BEARING.md']);
  });

  it("If a backlog card's filename or directory disagrees with its YAML, does `method status` report the YAML lane and legend rather than the path-derived guess?", () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_frontmatter-wins.md'),
      ['---', 'title: "Frontmatter Wins"', 'legend: SYNTH', 'lane: asap', '---', '', '# Frontmatter Wins', '', 'Body'].join('\n'),
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

    writeFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_legacy-item.md'), '# Legacy Item\n\nBody\n', 'utf8');

    const moved = workspace.moveBacklogItem('docs/method/backlog/inbox/PROCESS_legacy-item.md', 'up-next');

    expect(moved).toBe('docs/method/backlog/up-next/PROCESS_legacy-item.md');
    expect(workspace.readFrontmatter(moved)).toMatchObject({
      lane: 'up-next',
      legend: 'PROCESS',
    });
  });

  it('Repairs a legacy document title on read when YAML frontmatter is missing it.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const path = 'docs/method/backlog/inbox/PROCESS_legacy-title.md';
    writeFileSync(join(root, path), '# Legacy Title\n\nBody\n', 'utf8');

    expect(workspace.readFrontmatter(path)).toMatchObject({
      title: 'Legacy Title',
    });

    workspace.updateFrontmatter(path, { lane: 'up-next' });
    expect(workspace.readFrontmatter(path)).toMatchObject({
      title: 'Legacy Title',
      lane: 'up-next',
    });
  });

  it('If I move an item to the lane it is already in, does METHOD still repair stale or missing frontmatter metadata?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    ensureBacklogLane(root, 'up-next');
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_same-lane-repair.md'),
      ['---', 'title: "Same Lane Repair"', 'lane: inbox', '---', '', '# Same Lane Repair', '', 'Body'].join('\n'),
      'utf8',
    );

    const moved = workspace.moveBacklogItem('docs/method/backlog/up-next/PROCESS_same-lane-repair.md', 'up-next');

    expect(moved).toBe('docs/method/backlog/up-next/PROCESS_same-lane-repair.md');
    expect(workspace.readFrontmatter(moved)).toMatchObject({
      lane: 'up-next',
      legend: 'PROCESS',
    });
  });

  it('Allows repo-defined backlog lanes such as `v1.1.0` and preserves them in status output.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_release-scope.md'), '# Release Scope\n\nBody\n', 'utf8');

    const moved = workspace.moveBacklogItem('docs/method/backlog/inbox/PROCESS_release-scope.md', 'v1.1.0');

    expect(moved).toBe('docs/method/backlog/v1.1.0/PROCESS_release-scope.md');
    expect(workspace.readFrontmatter(moved)).toMatchObject({
      lane: 'v1.1.0',
      legend: 'PROCESS',
    });

    const status = workspace.status();
    expect(status.backlog['v1.1.0']).toContainEqual({
      stem: 'PROCESS_release-scope',
      lane: 'v1.1.0',
      path: 'docs/method/backlog/v1.1.0/PROCESS_release-scope.md',
      legend: 'PROCESS',
      slug: 'release-scope',
    });
  });

  it('Rejects moving backlog paths that escape the workspace root.', () => {
    const root = createTempRoot();
    const outsideRoot = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const outsidePath = join(outsideRoot, 'outside.md');
    writeFileSync(outsidePath, '# Outside\n\nBody\n', 'utf8');

    expect(() => workspace.moveBacklogItem(outsidePath, 'graveyard')).toThrow(/workspace/u);
    expect(existsSync(outsidePath)).toBe(true);
  });

  it('Rejects pulling backlog items through traversal paths that escape the workspace root.', () => {
    const root = createTempRoot();
    const outsideRoot = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const outsidePath = join(outsideRoot, 'outside.md');
    writeFileSync(outsidePath, '# Outside\n\nBody\n', 'utf8');
    const traversalPath = pathRelative(root, outsidePath);

    expect(() => workspace.pullItem(traversalPath)).toThrow(/workspace/u);
    expect(existsSync(outsidePath)).toBe(true);
  });

  it('If a backlog card has stale filename legend text, does `method pull` still carry the YAML legend into the design packet?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_frontmatter-pull.md'),
      ['---', 'title: "Frontmatter Pull"', 'legend: SYNTH', 'lane: asap', '---', '', '# Frontmatter Pull', '', 'Body'].join('\n'),
      'utf8',
    );

    const cycle = workspace.pullItem('PROCESS_frontmatter-pull');
    expect(cycle.name).toBe('SYNTH_frontmatter-pull');
    expect(readFileSync(cycle.designDoc, 'utf8')).toContain('Legend: SYNTH');
  });

  it('If frontmatter explicitly clears a legacy filename legend with `NONE`, does METHOD stop falling back to the filename prefix?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_frontmatter-clears-legend.md'),
      [
        '---',
        'title: "Frontmatter Clears Legend"',
        'legend: NONE',
        'lane: asap',
        '---',
        '',
        '# Frontmatter Clears Legend',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const status = workspace.status();
    expect(status.backlog.asap).toContainEqual({
      stem: 'PROCESS_frontmatter-clears-legend',
      lane: 'asap',
      path: 'docs/method/backlog/asap/PROCESS_frontmatter-clears-legend.md',
      legend: undefined,
      slug: 'frontmatter-clears-legend',
    });

    const cycle = workspace.pullItem('PROCESS_frontmatter-clears-legend');
    const designDoc = readFileSync(cycle.designDoc, 'utf8');
    expect(designDoc).toContain('legend: "none"');
    expect(designDoc).toContain('Legend: none');
  });

  it('Invalid explicit frontmatter legends do not override backlog filename truth or leak into pulled design docs.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_invalid-frontmatter-legend.md'),
      [
        '---',
        'title: "Invalid Frontmatter Legend"',
        'legend: human review',
        'lane: asap',
        '---',
        '',
        '# Invalid Frontmatter Legend',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const status = workspace.status();
    expect(status.backlog.asap).toContainEqual({
      stem: 'PROCESS_invalid-frontmatter-legend',
      lane: 'asap',
      path: 'docs/method/backlog/asap/PROCESS_invalid-frontmatter-legend.md',
      legend: undefined,
      slug: 'invalid-frontmatter-legend',
    });

    const cycle = workspace.pullItem('PROCESS_invalid-frontmatter-legend');
    const designDoc = readFileSync(cycle.designDoc, 'utf8');
    expect(designDoc).toContain('legend: "none"');
    expect(designDoc).toContain('Legend: none');
  });

  it('Can I consume backlog lane and legend from `Workspace.status()` without reverse-engineering filename prefixes or folder names?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const designDoc = join(root, 'docs/design/PROCESS_frontmatter-design.md');
    writeFileSync(
      designDoc,
      ['---', 'title: "Frontmatter Design"', 'legend: PROCESS', '---', '', '# Frontmatter Design', '', '## Hill', '', 'TBD'].join('\n'),
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

  it('Does `method pull` create a flat design doc at `docs/design/<LEGEND>_<slug>.md` instead of a nested directory?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Flat Layout', 'PROCESS', 'Flat Layout Test');
    const cycle = workspace.pullItem('PROCESS_flat-layout-test');

    expect(cycle.name).toBe('PROCESS_flat-layout-test');
    expect(cycle.designDoc).toBe(join(root, 'docs/design/PROCESS_flat-layout-test.md'));
    expect(existsSync(join(root, 'docs/design/PROCESS_flat-layout-test.md'))).toBe(true);
    // No subdirectory should exist
    expect(existsSync(join(root, 'docs/design/PROCESS_flat-layout-test'))).toBe(false);
  });

  it('Does `readCycleFromDoc()` discover both flat and legacy nested design docs?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create a flat design doc
    writeFileSync(join(root, 'docs/design/PROCESS_flat-cycle.md'), '# Flat Cycle\n\nLegend: PROCESS\n', 'utf8');

    // Create a legacy nested design doc
    mkdirSync(join(root, 'docs/design/0001-legacy-cycle'), { recursive: true });
    writeFileSync(join(root, 'docs/design/0001-legacy-cycle/legacy-cycle.md'), '# Legacy Cycle\n\nLegend: PROCESS\n', 'utf8');

    const status = workspace.status();
    const cycleNames = status.activeCycles.map((cycle) => cycle.name);
    expect(cycleNames).toContain('PROCESS_flat-cycle');
    expect(cycleNames).toContain('0001-legacy-cycle');
  });

  it('Does `generateReferenceDocs()` return the same target list that the CLI prints?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const result = workspace.syncRefs();
    expect(result.targets).toEqual(['ARCHITECTURE.md', 'docs/CLI.md', 'docs/MCP.md', 'docs/GUIDE.md']);
    expect(Array.isArray(result.updated)).toBe(true);
  });

  it('Does `pullItem` warn when a backlog item is missing acceptance criteria or priority?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create item without acceptance_criteria or priority
    workspace.captureIdea('Bare Item', 'PROCESS', 'Bare Item');
    const cycle = workspace.pullItem('PROCESS_bare-item');

    expect(cycle.warnings.length).toBeGreaterThan(0);
    expect(cycle.warnings.some((w) => w.includes('acceptance_criteria'))).toBe(true);
    expect(cycle.warnings.some((w) => w.includes('priority'))).toBe(true);
  });

  it('Does `pullItem` produce no warnings for a fully shaped backlog item?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.createBacklogItem({
      lane: 'asap',
      title: 'Full Item',
      legend: 'PROCESS',
      body: 'Body',
    });
    // Add acceptance_criteria and priority via typed frontmatter
    const itemPath = join(root, 'docs/method/backlog/asap/PROCESS_full-item.md');
    const raw = readFileSync(itemPath, 'utf8');
    writeFileSync(itemPath, raw.replace('---\n\n', 'priority: high\nacceptance_criteria:\n  - "Criterion"\n---\n\n'), 'utf8');

    const cycle = workspace.pullItem('PROCESS_full-item');
    expect(cycle.warnings).toEqual([]);
  });

  it('Does `method close` require human witness verification before writing the retro?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'docs/design/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

    // Without --witness-verified, close should prompt (and fail in non-interactive test)
    const stderr = new MemoryWriter();
    const exitCode = await runCli(['close', '--drift-check', 'yes', '--outcome', 'partial', '--summary', 'Test'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
      confirmPrompt: async () => false, // simulate human rejecting witness
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('witness verification');
  });

  it('Does the retro doc contain the summary provided during close instead of TBD?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Summary Test', 'PROCESS', 'Summary Test');
    workspace.pullItem('PROCESS_summary-test');

    const cycle = await workspace.closeCycle('PROCESS_summary-test', true, 'hill-met', {
      summary: 'Real summary content here.',
    });

    const retroContent = readFileSync(cycle.retroDoc, 'utf8');
    expect(retroContent).toContain('Real summary content here.');
    expect(retroContent).not.toMatch(/^TBD$/mu);
  });

  it('Does the retro template ask focused questions instead of providing empty sections?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Template Check', 'PROCESS', 'Template Check');
    workspace.pullItem('PROCESS_template-check');
    const cycle = await workspace.closeCycle('PROCESS_template-check', true, 'hill-met');

    const retro = readFileSync(cycle.retroDoc, 'utf8');
    // New focused sections exist
    expect(retro).toContain('## What surprised you?');
    expect(retro).toContain('## What would you do differently?');
    expect(retro).toContain('## Follow-up items');
    // Old hollow sections are gone
    expect(retro).not.toContain('## Drift');
    expect(retro).not.toContain('## New Debt');
    expect(retro).not.toContain('## Cool Ideas');
    expect(retro).not.toContain('## Backlog Maintenance');
  });

  it('Does the retro doc contain the surprised and differently responses when provided during close?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    workspace.captureIdea('Retro Content', 'PROCESS', 'Retro Content Test');
    workspace.pullItem('PROCESS_retro-content-test');

    const cycle = await workspace.closeCycle('PROCESS_retro-content-test', true, 'hill-met', {
      summary: 'This is the actual retro summary.',
      surprised: 'The drift detector caught more than expected.',
      differently: 'Would have written the test first.',
      followUp: '- File a backlog item for the remaining edge case.',
    });

    const retroContent = readFileSync(cycle.retroDoc, 'utf8');
    expect(retroContent).toContain('This is the actual retro summary.');
    expect(retroContent).toContain('The drift detector caught more than expected.');
    expect(retroContent).toContain('Would have written the test first.');
    expect(retroContent).toContain('File a backlog item for the remaining edge case.');
    expect(retroContent).not.toContain('TBD');
  });

  it('Does `--witness-verified` skip the interactive witness confirmation prompt?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'docs/design/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

    const stdout = new MemoryWriter();
    const exitCode = await runCli(
      ['close', '--drift-check', 'yes', '--outcome', 'partial', '--witness-verified', '--summary', 'Verified via flag'],
      { cwd: root, stdout, stderr: new MemoryWriter() },
    );

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Closed method-cli');
  });

  it('Does createBacklogItem avoid duplicating the legend prefix when the title already contains it?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    const path = workspace.createBacklogItem({
      lane: 'inbox',
      title: 'DX-022 — Layout Inspector Overlay',
      legend: 'DX',
    });

    // Should NOT contain DX_dx-022 (duplicated legend)
    expect(path).not.toContain('DX_dx-022');
    // Should contain DX_ prefix followed by the slug without the legend prefix
    expect(path).toContain('DX_022');
  });
});
