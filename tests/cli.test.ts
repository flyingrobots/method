import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(stdout.output).toContain('Close an active cycle into docs/method/retro/.');
    expect(stdout.output).toContain('--outcome hill-met|partial|not-met');
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
    expect(stdout.output).toContain('Pulled into 0001-strand-lifecycle');
    expectFile(root, 'docs/design/0001-strand-lifecycle/strand-lifecycle.md');
    const designDoc = readFile(root, 'docs/design/0001-strand-lifecycle/strand-lifecycle.md');
    expect(designDoc).toMatch(/^---\n[\s\S]+?\n---\n/u);
    expect(designDoc).toMatch(/^title:\s+"Strand Lifecycle"$/mu);
    expect(designDoc).toMatch(/^legend:\s+"PROCESS"$/mu);
    expect(designDoc).toMatch(/^cycle:\s+"0001-strand-lifecycle"$/mu);
    expect(designDoc).toMatch(/^source_backlog:\s+"docs\/method\/backlog\/asap\/PROCESS_strand-lifecycle\.md"$/mu);
    expect(designDoc).toContain('Legend: PROCESS');
    expect(designDoc).toContain('- Human: Backlog operator');
    expect(designDoc).toContain('- Agent: Implementation agent');
    expect(designDoc).toContain('Mechanical state transitions for strands.');
    expect(designDoc).toContain('## Accessibility and Assistive Reading');
    expect(designDoc).toContain('## Localization and Directionality');
    expect(designDoc).toContain('## Agent Inspectability and Explainability');
  });

  it('Does `method close` create a retro doc that already includes required frontmatter fields like `title`, `outcome`, `drift_check`, and `design_doc`?', async () => {
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
    const retroDoc = readFile(root, 'docs/method/retro/0001-method-cli/method-cli.md');
    expect(retroDoc).toMatch(/^---\n[\s\S]+?\n---\n/u);
    expect(retroDoc).toMatch(/^title:\s+"Method CLI"$/mu);
    expect(retroDoc).toMatch(/^outcome:\s+partial$/mu);
    expect(retroDoc).toMatch(/^drift_check:\s+yes$/mu);
    expect(retroDoc).toMatch(/^design_doc:\s+"docs\/design\/0001-method-cli\/method-cli\.md"$/mu);
    expect(retroDoc).not.toContain('Design: `docs/design/0001-method-cli/method-cli.md`');
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
    const designDoc = readFile(root, 'docs/design/0001-scaffold-contract/scaffold-contract.md');
    expect(designDoc).toMatch(/^legend:\s+"PROCESS"$/mu);
    expect(designDoc).toMatch(/^cycle:\s+"0001-scaffold-contract"$/mu);
    expect(designDoc).not.toContain('- Human: TBD');
    expect(designDoc).not.toContain('- Agent: TBD');
  });

  it('Can I rely on scaffolded retro docs to satisfy the repo docs contract without post-close repairs?', async () => {
    const root = createTempRoot();
    await runCli(['init'], { cwd: root, stdout: new MemoryWriter(), stderr: new MemoryWriter() });
    mkdirSync(join(root, 'docs/design/0001-scaffold-retro'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-scaffold-retro/scaffold-retro.md'),
      [
        '---',
        'title: "Scaffold Retro"',
        'legend: PROCESS',
        'cycle: "0001-scaffold-retro"',
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

    const exitCode = await runCli(['close', '0001-scaffold-retro', '--drift-check', 'yes', '--outcome', 'hill-met'], {
      cwd: root,
      stdout: new MemoryWriter(),
      stderr: new MemoryWriter(),
    });

    expect(exitCode).toBe(0);
    const retroDoc = readFile(root, 'docs/method/retro/0001-scaffold-retro/scaffold-retro.md');
    expect(retroDoc).toMatch(/^outcome:\s+hill-met$/mu);
    expect(retroDoc).toMatch(/^drift_check:\s+yes$/mu);
    expect(retroDoc).toMatch(/^design_doc:\s+"docs\/design\/0001-scaffold-retro\/scaffold-retro\.md"$/mu);
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
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-method-cli/method-cli.md'),
      '# Method CLI\n\nLegend: PROCESS\n\n## Hill\n\nTBD\n',
      'utf8',
    );

    const stdout = new MemoryWriter();
    const exitCode = await runCli(['status'], { cwd: root, stdout, stderr: new MemoryWriter() });

    expect(exitCode).toBe(0);
    expect(stdout.output).toContain('Backlog');
    expect(stdout.output).toContain('0001-method-cli');
    expect(stdout.output).toContain('SYNTH');
    expect(stdout.output).toContain('PROCESS');
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
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(join(root, 'docs/design/0001-method-cli/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

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
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(join(root, 'docs/design/0001-method-cli/method-cli.md'), '# Method CLI\n\nLegend: none\n', 'utf8');

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
    // Near-miss hints are shown when test descriptions are close but not exact
    expect(stdout.output).toContain('Near miss');
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
    expect(existsSync(join(root, '.method/design/0001-custom-path-test/custom-path-test.md'))).toBe(true);

    // Status should reflect it
    const statusOut = new MemoryWriter();
    await runCli(['status'], { cwd: root, stdout: statusOut, stderr: new MemoryWriter() });
    expect(statusOut.output).toContain('0001-custom-path-test');
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
    expect(existsSync(new URL('../src/index.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/drift.ts', import.meta.url))).toBe(true);
  });

  it('keeps cli.ts as a thin entry point instead of a behavior monolith', () => {
    const cliSource = readFileSync(new URL('../src/cli.ts', import.meta.url), 'utf8');

    expect(cliSource).not.toContain('class Workspace');
    expect(cliSource).not.toContain('function collectTestFiles');
    expect(cliSource).not.toContain('function extractPlaybackQuestions');
    expect(cliSource).not.toContain('function normalizeForMatch');
    expect(cliSource.split(/\r?\n/u).length).toBeLessThan(200);
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
