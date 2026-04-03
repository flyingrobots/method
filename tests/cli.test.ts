import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

  it('Can I run the detector and get a concise list of playback questions that have no matching test evidence, with the design file and question text called out directly?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: '0001-drift-detector',
      slug: 'drift-detector',
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
      cycleName: '0001-drift-detector',
      slug: 'drift-detector',
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
    expect(stdout.output).toContain('docs/design/0001-drift-detector/drift-detector.md');
    expect(stdout.output).toContain('Human: Can I see a concise drift report?');
    expect(stdout.output).toContain('Agent: Does a near miss still count as unmatched?');
    expect(stdout.output).toContain('No exact normalized test description match found');
  });

  it('Are the extraction and matching rules explicit enough that I can reproduce the detector\'s findings from committed markdown and test files alone?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    writeDesignDoc(root, {
      cycleName: '0001-drift-detector',
      slug: 'drift-detector',
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
      cycleName: '0001-drift-detector',
      slug: 'drift-detector',
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
      cycleName: '0001-drift-detector',
      slug: 'drift-detector',
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
    expect(stdout.output).toContain('No exact normalized test description match found.');
  });

  it('returns exit code 1 for operator errors', async () => {
    const { exitCode, stderr } = await runDriftMissingCycleScenario();

    expect(exitCode).toBe(1);
    expect(stderr.output).toContain('Could not find active cycle');
  });

  it('keeps behavior-owned modules for arg parsing, workspace behavior, and drift logic', () => {
    expect(existsSync(new URL('../src/cli-args.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/workspace.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/drift.ts', import.meta.url))).toBe(true);
  });

  it('keeps cli.ts as a thin entry point instead of a behavior monolith', () => {
    const cliSource = readFileSync(new URL('../src/cli.ts', import.meta.url), 'utf8');

    expect(cliSource).not.toContain('class Workspace');
    expect(cliSource).not.toContain('function collectTestFiles');
    expect(cliSource).not.toContain('function extractPlaybackQuestions');
    expect(cliSource).not.toContain('function normalizeForMatch');
    expect(cliSource.split(/\r?\n/u).length).toBeLessThan(260);
  });

  it('keeps workspace.ts focused on workspace behavior instead of reabsorbing drift helpers', () => {
    const workspaceSource = readFileSync(new URL('../src/workspace.ts', import.meta.url), 'utf8');

    expect(workspaceSource).not.toContain('function extractPlaybackQuestions');
    expect(workspaceSource).not.toContain('function collectTestFiles');
    expect(workspaceSource).not.toContain('function normalizeForMatch');
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
  options: { cycleName: string; slug: string; title: string; body: string },
): void {
  const designDir = join(root, 'docs/design', options.cycleName);
  mkdirSync(designDir, { recursive: true });
  writeFileSync(
    join(designDir, `${options.slug}.md`),
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
    cycleName: '0001-drift-detector',
    slug: 'drift-detector',
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
    cycleName: '0001-drift-detector',
    slug: 'drift-detector',
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
    cycleName: '0001-drift-detector',
    slug: 'drift-detector',
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
