import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
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
    expect(stdout.output).toContain('Close an active cycle into docs/method/retro/.');
  });

  it('captures backlog ideas in inbox', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    const stdout = new MemoryWriter();

    const exitCode = await runCli(
      ['inbox', 'What if Method had a CLI?', '--legend', 'PROTO'],
      { cwd: root, stdout, stderr: new MemoryWriter() },
    );

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Captured');
    expect(readFile(root, 'docs/method/backlog/inbox/PROTO_what-if-method-had-a-cli.md'))
      .toContain('# What if Method had a CLI?');
  });

  it('promotes backlog items into numbered cycles', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(
      join(root, 'docs/method/backlog/asap/PROTO_strand-lifecycle.md'),
      '# Strand Lifecycle\n\nMechanical state transitions for strands.\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['pull', 'PROTO_strand-lifecycle'], {
      cwd: root,
      stdout,
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Pulled into 0001-strand-lifecycle');
    expectFile(root, 'docs/design/0001-strand-lifecycle/strand-lifecycle.md');
    const designDoc = readFile(root, 'docs/design/0001-strand-lifecycle/strand-lifecycle.md');
    expect(designDoc).toContain('Legend: PROTO');
    expect(designDoc).toContain('Mechanical state transitions for strands.');
    expect(designDoc).toContain('## Accessibility and Assistive Reading');
    expect(designDoc).toContain('## Localization and Directionality');
    expect(designDoc).toContain('## Agent Inspectability and Explainability');
  });

  it('writes retros and witness directories on close', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-method-cli/method-cli.md'),
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
    expect(stdout.output).toContain('Closed 0001-method-cli');
    expectFile(root, 'docs/method/retro/0001-method-cli/method-cli.md');
    expectFile(root, 'docs/method/retro/0001-method-cli/witness');
    expect(readFile(root, 'docs/method/retro/0001-method-cli/method-cli.md')).toContain('Outcome: partial');
  });

  it('shows backlog, active cycles, and legend health in status', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeFileSync(join(root, 'docs/method/backlog/inbox/VIZ_braille.md'), '# Braille\n\nIdea\n', 'utf8');
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-method-cli/method-cli.md'),
      '# Method CLI\n\nLegend: TUI\n\n## Hill\n\nTBD\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['status'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Backlog');
    expect(stdout.output).toContain('0001-method-cli');
    expect(stdout.output).toContain('VIZ');
    expect(stdout.output).toContain('TUI');
  });

  it('refuses close when the drift check is not complete', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(join(root, 'docs/design/0001-method-cli/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

    const stderr = new MemoryWriter();
    const exitCode = await runCli(['close', '--drift-check', 'no'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr,
    });

    expect(exitCode).toBe(1);
    expect(stderr.output.toLowerCase()).toContain('drift check');
  });
});

function expectFile(root: string, relativePath: string): void {
  expect(existsSync(join(root, relativePath))).toBe(true);
}

function readFile(root: string, relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}
