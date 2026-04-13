import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { detectWorkspaceDrift } from '../src/drift.js';
import type { Cycle } from '../src/domain.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-drift-'));
  tempRoots.push(root);
  return root;
}

function setupCycleWithQuestions(root: string, questions: string[]): Cycle {
  const designDir = resolve(root, 'docs/design');
  mkdirSync(designDir, { recursive: true });

  const designDoc = resolve(designDir, 'PROCESS_test-cycle.md');
  const questionLines = questions.map((q) => `- [ ] ${q}`).join('\n');
  writeFileSync(designDoc, `# Test Cycle\n\n## Playback Questions\n\n### Human\n\n${questionLines}\n\n## Non-goals\n`);

  return {
    name: 'PROCESS_test-cycle',
    slug: 'test-cycle',
    designDoc,
    retroDoc: resolve(root, 'docs/method/retro/PROCESS_test-cycle/PROCESS_test-cycle.md'),
  };
}

function setupTestFile(root: string, descriptions: string[]): void {
  const testsDir = resolve(root, 'tests');
  mkdirSync(testsDir, { recursive: true });

  const lines = descriptions.map((d) => `it('${d.replace(/'/gu, "\\'")}', () => {});`).join('\n');
  writeFileSync(resolve(testsDir, 'example.test.ts'), lines);
}

describe('Drift Detection', () => {
  it('returns exit code 0 and clean message when all questions match exactly', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The widget renders correctly.']);
    setupTestFile(root, ['The widget renders correctly.']);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('No playback-question drift found.');
  });

  it('returns exit code 2 when a question has no match', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The widget renders correctly.']);
    setupTestFile(root, ['Something completely different.']);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Playback-question drift found.');
  });

  it('When a playback question has no exact match but a test description is close, the drift output shows the near-miss candidate.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, [
      '`method drift` shows near-miss hints for unmatched questions.',
    ]);
    setupTestFile(root, [
      'method drift shows near-miss hints for unmatched questions',
    ]);

    const report = detectWorkspaceDrift(root, [cycle]);

    // Still drift (not exact match due to backticks)
    expect(report.exitCode).toBe(2);
    // But should show a near-miss hint
    expect(report.output).toContain('Near miss');
    expect(report.output).toContain('method drift shows near-miss hints for unmatched questions');
  });

  it('Near-miss hints never change the pass/fail exit code. Drift with hints still exits 2.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, [
      'The async executor handles timeouts gracefully.',
    ]);
    setupTestFile(root, [
      'The async executor handles timeouts.',
    ]);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Near miss');
    expect(report.output).toContain('Playback-question drift found.');
  });

  it('When no test description is remotely close, no hint is shown.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, [
      'The authentication module validates JWT tokens.',
    ]);
    setupTestFile(root, [
      'renders a button with correct label',
      'fetches data from the API endpoint',
    ]);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).not.toContain('Near miss');
    expect(report.output).toContain('No exact normalized test description match found.');
  });

  it('detectWorkspaceDrift includes near-miss hints in the output for unmatched questions.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, [
      '`tests/docs.test.ts` proves the branch naming rule is consistent between README and process.md.',
    ]);
    setupTestFile(root, [
      'tests/docs.test.ts proves the branch naming rule is consistent between README and process.md',
    ]);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Near miss');
  });

  it('The similarity function is deterministic, requires no external dependencies, and uses normalized token overlap.', () => {
    const root = createTempRoot();
    // Run twice with same input — must produce identical output
    const cycle = setupCycleWithQuestions(root, [
      'The drift detector catches renamed tests.',
    ]);
    setupTestFile(root, [
      'The drift detector catches renamed test descriptions.',
    ]);

    const report1 = detectWorkspaceDrift(root, [cycle]);
    const report2 = detectWorkspaceDrift(root, [cycle]);

    expect(report1.output).toBe(report2.output);
    expect(report1.exitCode).toBe(report2.exitCode);
  });

  it('returns clean output when no active cycles exist', () => {
    const root = createTempRoot();
    const report = detectWorkspaceDrift(root, []);

    expect(report.exitCode).toBe(0);
    expect(report.output).toContain('No active cycles found.');
  });
});
