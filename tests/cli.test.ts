import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initWorkspace } from '../src/index.js';
import { runCli } from '../src/cli.js';

class MemoryWriter {
  output = '';

  write(chunk: string): boolean {
    this.output += chunk;
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
  const root = mkdtempSync(join(tmpdir(), 'method-'));
  tempRoots.push(root);
  return root;
}

function ensureBacklogLane(root: string, lane: string): void {
  mkdirSync(join(root, 'docs/method/backlog', lane), { recursive: true });
}

describe('method CLI', () => {
  it('scaffolds a workspace with init', async () => {
    const root = createTempRoot();
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['init'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Initialized METHOD workspace');
    expectFile(root, 'docs/method/backlog/inbox');
    expectFile(root, 'docs/design');
    expectFile(root, 'docs/method/process.md');
    expectFile(root, 'docs/method/release.md');
    expectFile(root, 'docs/method/release-runbook.md');
    expectFile(root, 'docs/method/releases/README.md');
    expectFile(root, 'docs/releases/README.md');
    expectFile(root, 'CHANGELOG.md');
  });

  it('shows command-specific help for help <command>', async () => {
    const root = createTempRoot();
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['help', 'close'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Usage: method close');
    expect(stdout.output).toContain('Close an active cycle into its retro packet.');
    expect(stdout.output).toContain('--outcome hill-met|partial|not-met');
  });

  it('Does `method doctor --json` return a bounded workspace health report without throwing on malformed `.method.json`?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(join(root, '.method.json'), '{ broken json }\n', 'utf8');
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['doctor', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const report = JSON.parse(stdout.output);
    expect(exitCode).toBe(1);
    expect(report.status).toBe('error');
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'config-parse-failed',
      check: 'config',
    }));
  });

  it('Does `method doctor` surface missing required paths and malformed frontmatter with fix suggestions?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'),
      '# Missing Frontmatter\n\nBody\n',
      'utf8',
    );
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['doctor'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(1);
    expect(stdout.output).toContain('missing-directory');
    expect(stdout.output).toContain('missing-frontmatter');
    expect(stdout.output).toContain('Fix:');
  });

  it('includes doctor usage guidance when an unknown doctor flag is provided.', async () => {
    const root = createTempRoot();
    const stderr = new MemoryWriter();

    const exitCode = await runCli(['doctor', '--bogus'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Unknown option: --bogus');
    expect(stderr.output).toContain('Usage: method doctor [--json]');
  });

  it('starts `method mcp` from a non-METHOD cwd because MCP callers pass explicit workspace arguments per tool.', async () => {
    const root = createTempRoot();
    const client = new Client({ name: 'cli-test-probe', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: join(process.cwd(), 'node_modules/.bin/tsx'),
      args: [join(process.cwd(), 'src/cli.ts'), 'mcp'],
      cwd: root,
    });

    try {
      await client.connect(transport);
      const result = await client.listTools();

      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools.map((tool) => tool.name)).toContain('method_status');
    } finally {
      await client.close();
    }
  });

  it('plans and applies bounded doctor-guided repairs through the CLI JSON surface.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/release-runbook.md'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'),
      '# Missing Frontmatter\n\nBody\n',
      'utf8',
    );

    const planStdout = new MemoryWriter();
    const planExitCode = await runCli(['repair', '--plan', '--json'], {
      cwd: root,
      stdout: planStdout,
      stderr: new MemoryWriter(),
    });

    const plan = JSON.parse(planStdout.output);
    expect(planExitCode).toBe(0);
    expect(plan.mode).toBe('plan');
    expect(plan.repairs.map((repair: { status: string }) => repair.status)).toEqual(['planned', 'planned', 'planned']);

    const applyStdout = new MemoryWriter();
    const applyExitCode = await runCli(['repair', '--apply', '--json'], {
      cwd: root,
      stdout: applyStdout,
      stderr: new MemoryWriter(),
    });

    const applied = JSON.parse(applyStdout.output);
    expect(applyExitCode).toBe(0);
    expect(applied.mode).toBe('apply');
    expect(applied.repairs.map((repair: { status: string }) => repair.status)).toEqual(['applied', 'applied', 'applied']);
    expect(readFile(root, 'docs/method/release-runbook.md')).toContain('# Release Runbook');
    expect(readFile(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md')).toMatch(/^---\ntitle: "Missing Frontmatter"\n---\n\n# Missing Frontmatter/mu);
  });

  it('runs doctor, applies the bounded repair set, and re-checks through `method migrate --json`.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/release-runbook.md'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'),
      '# Missing Frontmatter\n\nBody\n',
      'utf8',
    );
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['migrate', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.changed).toBe(true);
    expect(result.initialReport.status).toBe('error');
    expect(result.repair.mode).toBe('apply');
    expect(result.repair.repairs.map((repair: { status: string }) => repair.status)).toEqual(['applied', 'applied', 'applied']);
    expect(readFile(root, 'docs/method/release-runbook.md')).toContain('# Release Runbook');
    expect(readFile(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md')).toMatch(/^---\ntitle: "Missing Frontmatter"\n---\n\n# Missing Frontmatter/mu);
  });

  it('Does `method sync refs` print only generated reference targets and leave ship-only artifacts untouched?', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const stdout = new MemoryWriter();
    const changelogBefore = readFile(root, 'CHANGELOG.md');
    const bearingPath = join(root, 'docs/BEARING.md');
    expect(existsSync(bearingPath)).toBe(false);

    const exitCode = await runCli(['sync', 'refs'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Refreshed ARCHITECTURE.md');
    expect(stdout.output).toContain('Refreshed docs/CLI.md');
    expect(stdout.output).toContain('Refreshed docs/MCP.md');
    expect(stdout.output).toContain('Refreshed docs/GUIDE.md');
    expect(stdout.output).not.toContain('CHANGELOG.md');
    expect(stdout.output).not.toContain('docs/BEARING.md');
    expect(readFile(root, 'CHANGELOG.md')).toBe(changelogBefore);
    expect(existsSync(bearingPath)).toBe(false);
  });

  it('captures backlog ideas in inbox', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(
      ['inbox', 'What if Method had a CLI?', '--legend', 'PROCESS'],
      { cwd: root, stdout, stderr: new MemoryWriter() },
    );

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Captured');
    expect(readFile(root, 'docs/method/backlog/inbox/PROCESS_what-if-method-had-a-cli.md'))
      .toContain('# What if Method had a CLI?');
  });

  it('creates shaped backlog notes directly in a requested custom lane and returns JSON when asked.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'backlog-body.md'), 'Line one.\n\nLine two.\n', 'utf8');
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'backlog',
      'add',
      '--lane',
      'v1.1.0',
      '--title',
      'Backlog Add',
      '--legend',
      'PROCESS',
      '--body-file',
      'backlog-body.md',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.path).toBe('docs/method/backlog/v1.1.0/PROCESS_backlog-add.md');
    expect(result.lane).toBe('v1.1.0');
    expect(result.legend).toBe('PROCESS');
    expect(result.title).toBe('Backlog Add');
    expect(result.stem).toBe('PROCESS_backlog-add');
    expect(result.slug).toBe('backlog-add');
    expect(readFile(root, 'docs/method/backlog/v1.1.0/PROCESS_backlog-add.md')).toContain('Line two.');
  });

  it('rejects malformed backlog lanes before creating any file.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stderr = new MemoryWriter();

    const exitCode = await runCli([
      'backlog',
      'add',
      '--lane',
      '../oops',
      '--title',
      'Backlog Add',
    ], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Backlog lane must be a live lane');
    expect(existsSync(join(root, 'docs/method/backlog/oops'))).toBe(false);
  });

  it('moves backlog notes between lanes using path, stem, or slug resolution and returns JSON when asked.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_move-me.md'),
      [
        '---',
        'title: "Move Me"',
        'legend: PROCESS',
        'lane: inbox',
        '---',
        '',
        '# Move Me',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'backlog',
      'move',
      'move-me',
      '--to',
      'v1.1.0',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.sourcePath).toBe('docs/method/backlog/inbox/PROCESS_move-me.md');
    expect(result.path).toBe('docs/method/backlog/v1.1.0/PROCESS_move-me.md');
    expect(result.lane).toBe('v1.1.0');
    expect(result.legend).toBe('PROCESS');
    expect(existsSync(join(root, 'docs/method/backlog/inbox/PROCESS_move-me.md'))).toBe(false);
    expect(readFile(root, 'docs/method/backlog/v1.1.0/PROCESS_move-me.md')).toContain('lane: v1.1.0');
  });

  it('queries backlog items by explicit frontmatter metadata, readiness, dependency filters, and sort mode and returns bounded JSON results.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
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
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'backlog',
      'list',
      '--lane',
      'up-next',
      '--keyword',
      'agent',
      '--owner',
      'METHOD maintainers',
      '--blocked',
      '--has-acceptance-criteria',
      '--blocked-by',
      'setup',
      '--sort',
      'priority',
      '--limit',
      '1',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.totalCount).toBe(1);
    expect(result.returnedCount).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.items[0].stem).toBe('PROCESS_query-foundation');
    expect(result.filters.owner).toBe('method maintainers');
    expect(result.filters.ready).toBe(false);
    expect(result.filters.hasAcceptanceCriteria).toBe(true);
    expect(result.filters.blockedBy).toBe('setup');
    expect(result.filters.sort).toBe('priority');
    expect(result.items[0].keywords).toEqual(['agent', 'query']);
    expect(result.items[0].blockedBy).toEqual(['setup']);
    expect(result.items[0].hasAcceptanceCriteria).toBe(true);
  });

  it('rejects conflicting backlog list readiness flags.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stderr = new MemoryWriter();

    const exitCode = await runCli(['backlog', 'list', '--ready', '--blocked'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Cannot combine `--ready` with `--blocked`.');
  });

  it('edits schema-backed backlog metadata through the CLI JSON surface.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_metadata-edit.md'),
      [
        '---',
        'title: "Metadata Edit"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Metadata Edit',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'backlog',
      'edit',
      'metadata-edit',
      '--owner',
      'Core Team',
      '--priority',
      'HIGH',
      '--keyword',
      'roadmap',
      '--keyword',
      'query',
      '--blocked-by',
      'setup',
      '--blocks',
      'finish',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.updatedFields).toEqual(['owner', 'priority', 'keywords', 'blocked_by', 'blocks']);
    expect(result.owner).toBe('Core Team');
    expect(result.priority).toBe('high');
    expect(result.keywords).toEqual(['roadmap', 'query']);
    expect(result.blockedBy).toEqual(['setup']);
    expect(result.blocks).toEqual(['finish']);
  });

  it('returns a bounded next-work menu and reports BEARING-driven elevation through the CLI JSON surface.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
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
      [
        '---',
        'title: "Bad Fix"',
        'legend: PROCESS',
        'lane: bad-code',
        'priority: medium',
        '---',
        '',
        '# Bad Fix',
        '',
        'Body',
      ].join('\n'),
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
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['next', '--limit', '3', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.recommendations.map((item: { path: string }) => item.path)).toEqual([
      'docs/method/backlog/up-next/PROCESS_up-next-foundation.md',
      'docs/method/backlog/cool-ideas/PROCESS_bearing-star.md',
      'docs/method/backlog/bad-code/PROCESS_bad-fix.md',
    ]);
    expect(result.selection_notes).toContainEqual(expect.stringContaining('BEARING elevated `PROCESS_bearing-star`'));
  });

  it('filters next-work recommendations by explicit metadata and can keep blocked items when requested.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
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
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'next',
      '--keyword',
      'roadmap',
      '--owner',
      'Core Team',
      '--include-blocked',
      '--limit',
      '5',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.recommendations.map((item: { path: string }) => item.path)).toEqual([
      'docs/method/backlog/up-next/PROCESS_blocked-owner-match.md',
      'docs/method/backlog/cool-ideas/PROCESS_ready-owner-match.md',
    ]);
    expect(result.selection_notes).toContain('Blocked items were included because `include-blocked` was requested.');
    expect(result.selection_notes).toContain('Applied filters: keyword=roadmap, owner=core team.');
  });

  it('reports ready work and critical paths through the backlog dependency JSON surface.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_foundation.md'),
      [
        '---',
        'title: "Foundation"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Foundation',
        '',
        'Body',
      ].join('\n'),
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
      [
        '---',
        'title: "Finish"',
        'legend: PROCESS',
        'lane: up-next',
        'blocked_by:',
        '  - build',
        '---',
        '',
        '# Finish',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const readyStdout = new MemoryWriter();
    const readyExitCode = await runCli(['backlog', 'deps', '--ready', '--json'], {
      cwd: root,
      stdout: readyStdout,
      stderr: new MemoryWriter(),
    });

    const ready = JSON.parse(readyStdout.output);
    expect(readyExitCode).toBe(0);
    expect(ready.query.readyOnly).toBe(true);
    expect(ready.ready.map((item: { stem: string }) => item.stem)).toEqual(['PROCESS_foundation']);

    const focusStdout = new MemoryWriter();
    const focusExitCode = await runCli(['backlog', 'deps', 'finish', '--critical-path', '--json'], {
      cwd: root,
      stdout: focusStdout,
      stderr: new MemoryWriter(),
    });

    const focus = JSON.parse(focusStdout.output);
    expect(focusExitCode).toBe(0);
    expect(focus.focus.item.stem).toBe('PROCESS_finish');
    expect(focus.focus.blockers.map((item: { stem: string }) => item.stem)).toEqual(['PROCESS_build']);
    expect(focus.focus.criticalPath.map((item: { stem: string }) => item.stem)).toEqual([
      'PROCESS_foundation',
      'PROCESS_build',
      'PROCESS_finish',
    ]);
  });

  it('requires explicit --yes before mutating backlog retirement from the CLI.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'),
      [
        '---',
        'title: "Retire Me"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Retire Me',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );
    const stderr = new MemoryWriter();

    const exitCode = await runCli([
      'retire',
      'retire-me',
      '--reason',
      'Superseded by another cycle.',
    ], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('requires `--yes` unless `--dry-run` is set');
    expect(existsSync(join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'))).toBe(true);
  });

  it('can preview and apply backlog retirement through the CLI JSON surface.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'up-next');
    writeFileSync(
      join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'),
      [
        '---',
        'title: "Retire Me"',
        'legend: PROCESS',
        'lane: up-next',
        '---',
        '',
        '# Retire Me',
        '',
        'Body',
      ].join('\n'),
      'utf8',
    );

    const previewStdout = new MemoryWriter();
    const previewExitCode = await runCli([
      'retire',
      'retire-me',
      '--reason',
      'Superseded by another cycle.',
      '--replacement',
      'docs/design/0040-release-scope/release-scope.md',
      '--dry-run',
      '--json',
    ], {
      cwd: root,
      stdout: previewStdout,
      stderr: new MemoryWriter(),
    });

    const preview = JSON.parse(previewStdout.output);
    expect(previewExitCode).toBe(0);
    expect(preview.dryRun).toBe(true);
    expect(preview.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(preview.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(existsSync(join(root, 'docs/method/backlog/up-next/PROCESS_retire-me.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/method/graveyard/PROCESS_retire-me.md'))).toBe(false);

    const applyStdout = new MemoryWriter();
    const applyExitCode = await runCli([
      'retire',
      'retire-me',
      '--reason',
      'Superseded by another cycle.',
      '--replacement',
      'docs/design/0040-release-scope/release-scope.md',
      '--yes',
      '--json',
    ], {
      cwd: root,
      stdout: applyStdout,
      stderr: new MemoryWriter(),
    });

    const applied = JSON.parse(applyStdout.output);
    expect(applyExitCode).toBe(0);
    expect(applied.dryRun).toBe(false);
    expect(applied.sourcePath).toBe('docs/method/backlog/up-next/PROCESS_retire-me.md');
    expect(applied.graveyardPath).toBe('docs/method/graveyard/PROCESS_retire-me.md');
    expect(existsSync(join(root, applied.sourcePath))).toBe(false);
    expect(readFile(root, applied.graveyardPath)).toContain('## Disposition');
    expect(readFile(root, applied.graveyardPath)).toContain('Superseded by another cycle.');
    expect(readFile(root, applied.graveyardPath)).toContain('## Original Proposal');
  });

  it('reports expected signposts and initializes supported missing signposts through the CLI JSON surface.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });

    const statusStdout = new MemoryWriter();
    const statusExitCode = await runCli(['signpost', 'status', '--json'], {
      cwd: root,
      stdout: statusStdout,
      stderr: new MemoryWriter(),
    });

    const status = JSON.parse(statusStdout.output);
    expect(statusExitCode).toBe(0);
    expect(status.missing).toContain('README.md');
    expect(status.missing).toContain('docs/BEARING.md');
    expect(status.signposts).toContainEqual(expect.objectContaining({
      name: 'BEARING',
      path: 'docs/BEARING.md',
      exists: false,
      initable: true,
    }));

    const initStdout = new MemoryWriter();
    const initExitCode = await runCli(['signpost', 'init', 'BEARING', '--json'], {
      cwd: root,
      stdout: initStdout,
      stderr: new MemoryWriter(),
    });

    const initialized = JSON.parse(initStdout.output);
    expect(initExitCode).toBe(0);
    expect(initialized.requested).toBe('BEARING');
    expect(initialized.initializedTargets).toEqual(['docs/BEARING.md']);
    expect(readFile(root, 'docs/BEARING.md')).toContain('# BEARING');
  });

  it('captures inbox items with explicit source metadata and returns JSON when asked.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'inbox-body.md'), 'Observed while operating METHOD elsewhere.\n', 'utf8');
    const stdout = new MemoryWriter();

    const exitCode = await runCli([
      'inbox',
      'Feedback note worth triaging',
      '--legend',
      'PROCESS',
      '--title',
      'Missing API Surfaces',
      '--source',
      'cross-repo usage',
      '--body-file',
      'inbox-body.md',
      '--captured-at',
      '2026-04-11',
      '--json',
    ], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    const result = JSON.parse(stdout.output);
    expect(exitCode).toBe(0);
    expect(result.path).toBe('docs/method/backlog/inbox/PROCESS_missing-api-surfaces.md');
    expect(result.lane).toBe('inbox');
    expect(result.legend).toBe('PROCESS');
    expect(result.title).toBe('Missing API Surfaces');
    expect(result.source).toBe('cross-repo usage');
    expect(result.captured_at).toBe('2026-04-11');
    expect(readFile(root, 'docs/method/backlog/inbox/PROCESS_missing-api-surfaces.md')).toContain('Observed while operating METHOD elsewhere.');
  });

  it('rejects the removed feedback command and points operators at inbox metadata capture.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stdout = new MemoryWriter();
    const stderr = new MemoryWriter();

    const exitCode = await runCli([
      'feedback',
      'add',
      '--title',
      'Missing API Surfaces',
    ], {
      cwd: root,
      stdout,
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stdout.output).toBe('');
    expect(stderr.output).toContain('`feedback` was removed');
    expect(stderr.output).toContain('method inbox');
  });

  it('pulls release-lane backlog into release-scoped cycle packets from the CLI.', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    ensureBacklogLane(root, 'v2.4.5');
    writeFileSync(
      join(root, 'docs/method/backlog/v2.4.5/PROCESS_release-scope.md'),
      [
        '---',
        'title: "Release Scope"',
        'legend: PROCESS',
        'lane: v2.4.5',
        'release: "v2.4.5"',
        '---',
        '',
        '# Release Scope',
        '',
        'Release-scoped packet.',
        '',
      ].join('\n'),
      'utf8',
    );
    const pullStdout = new MemoryWriter();

    const pullExitCode = await runCli(['pull', 'PROCESS_release-scope'], {
      cwd: root,
      stdout: pullStdout,
      stderr: new MemoryWriter(),
    });

    expect(pullExitCode).toBe(0);
    expect(pullStdout.output).toContain('Pulled into PROCESS_release-scope');
    expectFile(root, 'docs/releases/v2.4.5/design/PROCESS_release-scope.md');
    expect(readFile(root, 'docs/releases/v2.4.5/design/PROCESS_release-scope.md')).toContain('release: "v2.4.5"');

    const closeExitCode = await runCli(['close', 'PROCESS_release-scope', '--drift-check', 'yes', '--outcome', 'hill-met'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr: new MemoryWriter(),
    });

    expect(closeExitCode).toBe(0);
    expectFile(root, 'docs/releases/v2.4.5/retros/PROCESS_release-scope/PROCESS_release-scope.md');
    expect(readFile(root, 'docs/releases/v2.4.5/retros/PROCESS_release-scope/PROCESS_release-scope.md')).toContain('release: "v2.4.5"');
  });

  it('captures backlog ideas even when the inbox lane directory is absent', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    rmSync(join(root, 'docs/method/backlog/inbox'), { recursive: true, force: true });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['inbox', 'Backfill the missing inbox lane'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Captured');
    expectFile(root, 'docs/method/backlog/inbox/backfill-the-missing-inbox-lane.md');
  });

  it('Does `method pull` preserve live legends in scaffolded design docs instead of carrying obsolete fixture taxonomy?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_strand-lifecycle.md'),
      '# Strand Lifecycle\n\nMechanical state transitions for strands.\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['pull', 'PROCESS_strand-lifecycle'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Pulled into PROCESS_strand-lifecycle');
    expectFile(root, 'docs/design/PROCESS_strand-lifecycle.md');
    const designDoc = readFile(root, 'docs/design/PROCESS_strand-lifecycle.md');
    expect(designDoc).toMatch(/^---\n[\s\S]+?\n---\n/u);
    expect(designDoc).toMatch(/^title:\s+"Strand Lifecycle"$/mu);
    expect(designDoc).toMatch(/^legend:\s+"PROCESS"$/mu);
    expect(designDoc).toMatch(/^cycle:\s+"PROCESS_strand-lifecycle"$/mu);
    expect(designDoc).toMatch(/^source_backlog:\s+"docs\/method\/backlog\/asap\/PROCESS_strand-lifecycle\.md"$/mu);
    expect(designDoc).toContain('Legend: PROCESS');
    expect(designDoc).toContain('- Human: Backlog operator');
    expect(designDoc).toContain('- Agent: Implementation agent');
    expect(designDoc).toContain('These labels are abstract roles.');
    expect(designDoc).toContain('like in a user story');
    expect(designDoc).toContain('Mechanical state transitions for strands.');
    expect(designDoc).toContain('## Accessibility and Assistive Reading');
    expect(designDoc).toContain('## Localization and Directionality');
    expect(designDoc).toContain('## Agent Inspectability and Explainability');
  });

  it('Does `method close` create a retro doc that already includes required frontmatter fields like `title`, `outcome`, `drift_check`, and `design_doc`?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/design/method-cli.md'),
      '# Method CLI\n\nLegend: none\n\n## Playback Questions\n\n- [ ] TBD\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['close', '--drift-check', 'yes', '--outcome', 'partial'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Closed method-cli');
    expectFile(root, 'docs/method/retro/method-cli/method-cli.md');
    expectFile(root, 'docs/method/retro/method-cli/witness');
    const retroDoc = readFile(root, 'docs/method/retro/method-cli/method-cli.md');
    expect(retroDoc).toMatch(/^---\n[\s\S]+?\n---\n/u);
    expect(retroDoc).toMatch(/^title:\s+"Method CLI"$/mu);
    expect(retroDoc).toMatch(/^outcome:\s+partial$/mu);
    expect(retroDoc).toMatch(/^drift_check:\s+yes$/mu);
    expect(retroDoc).toMatch(/^design_doc:\s+"docs\/design\/method-cli\.md"$/mu);
    expect(retroDoc).not.toContain('Design: `docs/design/method-cli.md`');
    expect(retroDoc).not.toContain('Outcome: partial');
    expect(retroDoc).not.toContain('Drift check: yes');
  });

  it('Can I rely on scaffolded design docs to satisfy the repo docs contract without manual patching?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROCESS_scaffold-contract.md'),
      [
        '---',
        'title: "Scaffold Contract"',
        'legend: PROCESS',
        'lane: asap',
        '---',
        '',
        '# Scaffold Contract',
        '',
        'Backlog body.',
      ].join('\n'),
      'utf8',
    );

    const exitCode = await runCli(['pull', 'PROCESS_scaffold-contract'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    const designDoc = readFile(root, 'docs/design/PROCESS_scaffold-contract.md');
    expect(designDoc).toMatch(/^legend:\s+"PROCESS"$/mu);
    expect(designDoc).toMatch(/^cycle:\s+"PROCESS_scaffold-contract"$/mu);
    expect(designDoc).not.toContain('- Human: TBD');
    expect(designDoc).not.toContain('- Agent: TBD');
  });

  it('Can I rely on scaffolded retro docs to satisfy the repo docs contract without post-close repairs?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/design/PROCESS_scaffold-retro.md'),
      [
        '---',
        'title: "Scaffold Retro"',
        'legend: PROCESS',
        'cycle: "PROCESS_scaffold-retro"',
        'source_backlog: "docs/method/backlog/asap/PROCESS_scaffold-retro.md"',
        '---',
        '',
        '# Scaffold Retro',
        '',
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '- [ ] TBD',
      ].join('\n'),
      'utf8',
    );

    const exitCode = await runCli(['close', 'PROCESS_scaffold-retro', '--drift-check', 'yes', '--outcome', 'hill-met'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    const retroDoc = readFile(root, 'docs/method/retro/PROCESS_scaffold-retro/PROCESS_scaffold-retro.md');
    expect(retroDoc).toMatch(/^outcome:\s+hill-met$/mu);
    expect(retroDoc).toMatch(/^drift_check:\s+yes$/mu);
    expect(retroDoc).toMatch(/^design_doc:\s+"docs\/design\/PROCESS_scaffold-retro\.md"$/mu);
    expect(retroDoc).not.toContain('Outcome: TBD');
  });

  it('Does `method status` report legend health using the live repo legends rather than stale historical codes?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/SYNTH_braille.md'),
      '# Braille\n\nIdea\n',
      'utf8',
    );
    writeFileSync(
      join(root, 'docs/design/PROCESS_method-cli.md'),
      '# Method CLI\n\nLegend: PROCESS\n\n## Hill\n\nTBD\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['status'], { cwd: root, stdout, stderr: new MemoryWriter() });
    const legendSection = stdout.output.split('--- Legend Health ---').at(1) ?? '';

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Backlog');
    expect(stdout.output).toContain('PROCESS_method-cli');
    expect(legendSection).toContain('SYNTH');
    expect(legendSection).toContain('PROCESS');
    expect(legendSection).not.toContain('PROTO');
    expect(legendSection).not.toContain('FEAT');
    expect(legendSection).not.toContain('VIZ');
    expect(legendSection).not.toContain('TUI');
  });

  it('shows status for a clone-like workspace even when empty lane directories are absent', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    rmSync(join(root, 'docs/method/backlog/inbox'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/backlog/bad-code'), { recursive: true, force: true });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['status'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('inbox       0  -');
    expect(stdout.output).toContain('bad-code    0  -');
  });

  it('Can I run `method review-state` on the current branch or an explicit PR and get a bounded summary of blockers and merge-readiness?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const currentBranchStdout = new MemoryWriter();
    const explicitPrStdout = new MemoryWriter();
    const reviewStateQuery = vi.fn().mockImplementation(async ({ pr }: { pr?: number }) => {
      if (pr === 18) {
        return {
          status: 'ready',
          pr_number: 18,
          pr_url: 'https://example.test/pr/18',
          review_decision: 'APPROVED',
          unresolved_thread_count: 0,
          checks: { passing: [], pending: [], failing: [] },
          bot_review_state: 'approved',
          approval_count: 1,
          changes_requested_count: 0,
          merge_ready: true,
          blockers: [],
        };
      }

      return {
        status: 'blocked',
        pr_number: 18,
        pr_url: 'https://example.test/pr/18',
        review_decision: 'CHANGES_REQUESTED',
        unresolved_thread_count: 2,
        checks: { passing: [], pending: [], failing: [] },
        bot_review_state: 'commented',
        approval_count: 0,
        changes_requested_count: 1,
        merge_ready: false,
        blockers: [
          { type: 'unresolved_threads', message: '2 unresolved review threads.', source: 'github' },
        ],
      };
    });

    const currentBranchExitCode = await runCli(['review-state'], {
      cwd: root,
      stdout: currentBranchStdout,
      stderr: new MemoryWriter(),
      reviewStateQuery,
    });
    const explicitPrExitCode = await runCli(['review-state', '--pr', '18'], {
      cwd: root,
      stdout: explicitPrStdout,
      stderr: new MemoryWriter(),
      reviewStateQuery,
    });

    expect(currentBranchExitCode).toBe(0);
    expect(explicitPrExitCode).toBe(0);
    expect(reviewStateQuery).toHaveBeenNthCalledWith(1, { cwd: root, pr: undefined, currentBranch: undefined });
    expect(reviewStateQuery).toHaveBeenNthCalledWith(2, { cwd: root, pr: 18, currentBranch: undefined });
    expect(currentBranchStdout.output).toContain('Review state: blocked');
    expect(currentBranchStdout.output).toContain('PR: #18 https://example.test/pr/18');
    expect(currentBranchStdout.output).toContain('Blockers:');
    expect(explicitPrStdout.output).toContain('Review state: ready');
    expect(explicitPrStdout.output).toContain('Merge ready: yes');
  });

  it('emits review-state JSON when requested', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['review-state', '--pr', '18', '--json'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
      reviewStateQuery: vi.fn().mockResolvedValue({
        status: 'ready',
        pr_number: 18,
        pr_url: 'https://example.test/pr/18',
        review_decision: 'APPROVED',
        unresolved_thread_count: 0,
        checks: { passing: [], pending: [], failing: [] },
        bot_review_state: 'approved',
        approval_count: 1,
        changes_requested_count: 0,
        merge_ready: true,
        blockers: [],
      }),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('"status": "ready"');
    expect(stdout.output).toContain('"pr_number": 18');
  });

  it('rejects mutually exclusive review-state selectors before running GitHub queries', async () => {
    const stderr = new MemoryWriter();

    const exitCode = await runCli(['review-state', '--pr', '18', '--current-branch'], {
      cwd: createTempRoot(),
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('either `--pr` or `--current-branch`');
  });

  it('refuses close when the drift check is not complete', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'docs/design/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

    const stderr = new MemoryWriter();
    const exitCode = await runCli(['close', '--drift-check', 'no', '--outcome', 'partial'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output.toLowerCase()).toContain('drift check');
  });

  it('refuses close when outcome is omitted', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'docs/design/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

    const stderr = new MemoryWriter();
    const exitCode = await runCli(['close', '--drift-check', 'yes'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Usage: method close');
    expect(stderr.output).toContain('--outcome hill-met|partial|not-met');
  });

  it('Can I run the detector and get a concise list of playback questions that have no matching test evidence, with the design file and question text called out directly?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: 'PROCESS_drift-detector',
      title: 'Drift Detector',
      body: [
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '### Human',
        '',
        '- [ ] Can I see the missing evidence?',
        '',
        '### Agent',
        '',
        '- [ ] Does the detector report exact files?',
      ].join('\n'),
    });
    writeWorkspaceTest(
      root,
      'tests/drift-clean.test.ts',
      [
        "it('Can I see the missing evidence?', () => {});",
        "it('Does the detector report exact files?', () => {});",
      ].join('\n'),
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['drift'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('No playback-question drift found.');
    expect(stdout.output).toContain('Scanned 1 active cycle');
    expect(stdout.output).toContain('2 playback questions');
  });

  it('When the detector cannot prove a match, does it fail honestly instead of pretending semantic certainty?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: 'PROCESS_drift-detector',
      title: 'Drift Detector',
      body: [
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '### Human',
        '',
        '- [ ] Can I see a concise drift report?',
        '',
        '### Agent',
        '',
        '- [ ] Does a near miss still count as unmatched?',
      ].join('\n'),
    });
    writeWorkspaceTest(
      root,
      'tests/drift-near-miss.test.ts',
      [
        "it('Can I see a concise status report?', () => {});",
        "it('Does a near miss still count as unmatched eventually?', () => {});",
      ].join('\n'),
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['drift'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(2);
    expect(stdout.output).toContain('Playback-question drift found.');
    expect(stdout.output).toContain('docs/design/PROCESS_drift-detector.md');
    expect(stdout.output).toContain('Human: Can I see a concise drift report?');
    // "Does a near miss still count as unmatched?" now semantically matches
    // "Does a near miss still count as unmatched eventually?" (0.875 similarity)
    expect(stdout.output).not.toContain('Agent: Does a near miss still count as unmatched?');
    // Near-miss hints are shown when test descriptions are close but not exact
    expect(stdout.output).toContain('Near miss');
  });

  it('Are the extraction and matching rules explicit enough that I can reproduce the detector\'s findings from committed markdown and test files alone?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: 'PROCESS_drift-detector',
      title: 'Drift Detector',
      body: [
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '### Human',
        '',
        '- [ ] Can I parse wrapped playback',
        '      questions from markdown?',
        '',
        '### Agent',
        '',
        '- [ ] Do exact normalized test descriptions satisfy the detector?',
      ].join('\n'),
    });
    writeWorkspaceTest(
      root,
      'tests/drift-matching.test.ts',
      [
        "it('Can I parse wrapped playback questions from markdown?', () => {});",
        "it('Do exact normalized test descriptions satisfy the detector?', () => {});",
      ].join('\n'),
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['drift'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('No playback-question drift found.');
    expect(stdout.output).toContain('2 playback questions');
  });

  it('ignores commented-out test calls when matching playback questions', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: 'PROCESS_drift-detector',
      title: 'Drift Detector',
      body: [
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '### Human',
        '',
        '- [ ] Can I see only runnable tests count as evidence?',
      ].join('\n'),
    });
    writeWorkspaceTest(
      root,
      'tests/drift-commented.test.ts',
      [
        "// it('Can I see only runnable tests count as evidence?', () => {});",
        "/* test('Can I see only runnable tests count as evidence?', () => {}); */",
      ].join('\n'),
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['drift'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(2);
    expect(stdout.output).toContain('Playback-question drift found.');
    expect(stdout.output).toContain('Human: Can I see only runnable tests count as evidence?');
    expect(stdout.output).toContain('0 test descriptions');
  });

  it('decodes escaped playback descriptions across quote delimiters', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: 'PROCESS_drift-detector',
      title: 'Drift Detector',
      body: [
        'Legend: PROCESS',
        '',
        '## Playback Questions',
        '',
        '### Human',
        '',
        '- [ ] Can I match "double-quoted" evidence?',
        '- [ ] Can I match \'single-quoted\' evidence?',
        '- [ ] Can I match `template-quoted` evidence?',
      ].join('\n'),
    });
    writeWorkspaceTest(
      root,
      'tests/drift-quoted.test.ts',
      [
        'it("Can I match \\"double-quoted\\" evidence?", () => {});',
        'it(\'Can I match \\\'single-quoted\\\' evidence?\', () => {});',
        'it(`Can I match \\`template-quoted\\` evidence?`, () => {});',
      ].join('\n'),
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['drift'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('No playback-question drift found.');
    expect(stdout.output).toContain('3 playback questions');
    expect(stdout.output).toContain('3 test descriptions');
  });

  it('Does the detector return stable output and exit semantics that can be consumed in automation without a model in the loop?', async () => {
    const help = await runDriftHelpScenario();
    const clean = await runDriftCleanScenario();
    const drift = await runDriftFoundScenario();
    const error = await runDriftMissingCycleScenario();

    expect(help.exitCode).toBe(0);
    expect(clean.exitCode).toBe(0);
    expect(drift.exitCode).toBe(2);
    expect(error.exitCode).toBe(1);
  });

  it('A project with custom paths in .method.json has method init scaffold to those paths and all commands operate against them.', async () => {
    const root = createTempRoot();

    // Write custom paths config before init
    writeFileSync(join(root, '.method.json'), JSON.stringify({
      paths: {
        backlog: '.method/backlog',
        design: '.method/design',
        retro: '.method/retro',
        graveyard: '.method/graveyard',
        method_dir: '.method',
        tests: 'spec',
      },
    }), 'utf8');

    // Init should scaffold to custom paths
    const stdout = new MemoryWriter();
    await runCli(['init'], { cwd: root, stdout, stderr: new MemoryWriter() });
    expect(existsSync(join(root, '.method/backlog/inbox'))).toBe(true);
    expect(existsSync(join(root, '.method/design'))).toBe(true);
    expect(existsSync(join(root, '.method/retro'))).toBe(true);
    expect(existsSync(join(root, '.method/graveyard'))).toBe(true);
    expect(existsSync(join(root, '.method/process.md'))).toBe(true);

    // Inbox should work against custom paths
    const inboxOut = new MemoryWriter();
    await runCli(['inbox', 'custom path test', '--legend', 'PROC'], { cwd: root, stdout: inboxOut, stderr: new MemoryWriter() });
    expect(existsSync(join(root, '.method/backlog/inbox/PROC_custom-path-test.md'))).toBe(true);

    // Pull should work against custom paths
    const pullOut = new MemoryWriter();
    await runCli(['pull', 'PROC_custom-path-test'], { cwd: root, stdout: pullOut, stderr: new MemoryWriter() });
    expect(existsSync(join(root, '.method/design/PROC_custom-path-test.md'))).toBe(true);

    // Status should reflect it
    const statusOut = new MemoryWriter();
    await runCli(['status'], { cwd: root, stdout: statusOut, stderr: new MemoryWriter() });
    expect(statusOut.output).toContain('PROC_custom-path-test');
  });

  it('shows help for the drift command', async () => {
    const { root, exitCode, stdout } = await runDriftHelpScenario();

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Usage: method drift [cycle]');
    expect(stdout.output).toContain('Check active cycle playback questions against test descriptions in tests/.');
    expect(stdout.output).toContain('First cut scans tests/**/*.test.* and tests/**/*.spec.* only.');
    expect(existsSync(join(root, 'docs/method'))).toBe(false);
  });

  it('returns exit code 0 when no drift is found', async () => {
    const { exitCode, stdout } = await runDriftCleanScenario();

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('No playback-question drift found.');
    expect(stdout.output).toContain('2 playback questions');
    expect(stdout.output).toContain('2 test descriptions');
  });

  it('returns exit code 2 when drift is found', async () => {
    const { exitCode, stdout } = await runDriftFoundScenario();

    expect(exitCode).toBe(2);
    expect(stdout.output).toContain('Playback-question drift found.');
    expect(stdout.output).toContain('Human: Does drift return a distinct exit code?');
    expect(stdout.output).toContain('No matching test description found.');
  });

  it('returns exit code 1 for operator errors', async () => {
    const { exitCode, stderr } = await runDriftMissingCycleScenario();

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Could not find active cycle');
  });

  it('keeps behavior-owned modules for arg parsing, workspace behavior, and drift logic', () => {
    expect(existsSync(new URL('../src/cli-args.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/index.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/drift.ts', import.meta.url))).toBe(true);
  });

  it('Does `method spike` create a SPIKE-prefixed backlog item with structured scaffolding?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(['spike', 'Prove that X works under Y'], {
      cwd: root, stdout, stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('SPIKE_prove-that-x-works-under-y');
    const content = readFile(root, 'docs/method/backlog/inbox/SPIKE_prove-that-x-works-under-y.md');
    expect(content).toContain('legend: SPIKE');
    expect(content).toContain('## Stack Constraints');
    expect(content).toContain('## Expected Outcome');
  });

  it('keeps cli.ts as a thin entry point instead of a behavior monolith', () => {
    const cliSource = readFileSync(new URL('../src/cli.ts', import.meta.url), 'utf8');

    expect(cliSource).not.toContain('class Workspace');
    expect(cliSource).not.toContain('function collectTestFiles');
    expect(cliSource).not.toContain('function extractPlaybackQuestions');
    expect(cliSource).not.toContain('function normalizeForMatch');
    expect(cliSource.split(/\r?\n/u).length).toBeLessThan(220);
  });

  it('keeps index.ts focused on workspace behavior instead of reabsorbing drift helpers', () => {
    const indexSource = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');

    expect(indexSource).not.toContain('function extractPlaybackQuestions');
    expect(indexSource).not.toContain('function collectTestFiles');
    expect(indexSource).not.toContain('function normalizeForMatch');
  });
});

function expectFile(root: string, relativePath: string): void {
  expect(existsSync(join(root, relativePath))).toBe(true);
}

function readFile(root: string, relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

function writeDesignDoc(
  root: string,
  options: { cycleName: string; title: string; body: string },
): void {
  writeFileSync(
    join(root, 'docs/design', `${options.cycleName}.md`),
    `# ${options.title}\n\n${options.body}\n`,
    'utf8',
  );
}

function writeWorkspaceTest(root: string, relativePath: string, body: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${body}\n`, 'utf8');
}

async function runDriftHelpScenario(): Promise<{ root: string; exitCode: number; stdout: MemoryWriter }> {
  const root = createTempRoot();
  const stdout = new MemoryWriter();
  const exitCode = await runCli(['help', 'drift'], {
    cwd: root,
    stdout,
    stderr: new MemoryWriter(),
  });

  return { root, exitCode, stdout };
}

async function runDriftCleanScenario(): Promise<{ exitCode: number; stdout: MemoryWriter }> {
  const root = createTempRoot();
  await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
  writeDesignDoc(root, {
    cycleName: 'PROCESS_drift-detector',
    title: 'Drift Detector',
    body: [
      'Legend: PROCESS',
      '',
      '## Playback Questions',
      '',
      '### Human',
      '',
      '- [ ] Does the detector return stable output?',
      '',
      '### Agent',
      '',
      '- [ ] Does the detector return stable exit semantics?',
    ].join('\n'),
  });
  writeWorkspaceTest(
    root,
    'tests/drift-exit-codes.test.ts',
    [
      "it('Does the detector return stable output?', () => {});",
      "it('Does the detector return stable exit semantics?', () => {});",
    ].join('\n'),
  );

  const stdout = new MemoryWriter();
  const exitCode = await runCli(['drift'], {
    cwd: root,
    stdout,
    stderr: new MemoryWriter(),
  });

  return { exitCode, stdout };
}

async function runDriftFoundScenario(): Promise<{ exitCode: number; stdout: MemoryWriter }> {
  const root = createTempRoot();
  await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
  writeDesignDoc(root, {
    cycleName: 'PROCESS_drift-detector',
    title: 'Drift Detector',
    body: [
      'Legend: PROCESS',
      '',
      '## Playback Questions',
      '',
      '### Human',
      '',
      '- [ ] Does drift return a distinct exit code?',
    ].join('\n'),
  });

  const stdout = new MemoryWriter();
  const exitCode = await runCli(['drift'], {
    cwd: root,
    stdout,
    stderr: new MemoryWriter(),
  });

  return { exitCode, stdout };
}

async function runDriftMissingCycleScenario(): Promise<{ exitCode: number; stderr: MemoryWriter }> {
  const root = createTempRoot();
  await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
  writeDesignDoc(root, {
    cycleName: 'PROCESS_drift-detector',
    title: 'Drift Detector',
    body: [
      'Legend: PROCESS',
      '',
      '## Playback Questions',
      '',
      '### Human',
      '',
      '- [ ] Does drift target an explicit active cycle?',
    ].join('\n'),
  });
  const stderr = new MemoryWriter();
  const exitCode = await runCli(['drift', 'missing-cycle'], {
    cwd: root,
    stdout: new MemoryWriter(),
    stderr,
  });

  return { exitCode, stderr };
}
