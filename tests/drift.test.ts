import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Cycle } from '../src/domain.js';
import { detectWorkspaceDrift } from '../src/drift.js';

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
    const cycle = setupCycleWithQuestions(root, ['The drift detector catches renamed test descriptions in the workspace test directory.']);
    setupTestFile(root, ['The drift detector catches renamed test descriptions in the project test folder.']);

    const report = detectWorkspaceDrift(root, [cycle]);

    // High overlap but not identical — near-miss range (0.7-0.85)
    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Near miss');
  });

  it('Near-miss hints never change the pass/fail exit code. Drift with hints still exits 2.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The async executor handles timeouts gracefully.']);
    setupTestFile(root, ['The async executor handles timeouts.']);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Near miss');
    expect(report.output).toContain('Playback-question drift found.');
  });

  it('When no test description is remotely close, no hint is shown.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The authentication module validates JWT tokens.']);
    setupTestFile(root, ['renders a button with correct label', 'fetches data from the API endpoint']);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).not.toContain('Near miss');
    expect(report.output).toContain('No matching test description found.');
  });

  it('detectWorkspaceDrift includes near-miss hints in the output for unmatched questions.', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The backlog query returns items filtered by lane and sorted by priority rank.']);
    setupTestFile(root, ['The backlog query returns items sorted by priority rank.']);

    const report = detectWorkspaceDrift(root, [cycle]);

    expect(report.exitCode).toBe(2);
    expect(report.output).toContain('Near miss');
  });

  it('The similarity function is deterministic, requires no external dependencies, and uses normalized token overlap.', () => {
    const root = createTempRoot();
    // Run twice with same input — must produce identical output
    const cycle = setupCycleWithQuestions(root, ['The drift detector catches renamed tests.']);
    setupTestFile(root, ['The drift detector catches renamed test descriptions.']);

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

  it('Does the drift detector respect configurable thresholds from `.method.json` instead of using hardcoded values?', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The widget renders correctly on mobile.']);
    setupTestFile(root, ['The widget renders correctly on desktop.']);

    // With default thresholds, this is a near-miss (not a match)
    const defaultReport = detectWorkspaceDrift(root, [cycle]);
    expect(defaultReport.exitCode).toBe(2);

    // With a lower semantic match threshold, it becomes a match
    const lenientReport = detectWorkspaceDrift(root, [cycle], undefined, {
      semantic_match: 0.5,
      near_miss: 0.3,
    });
    expect(lenientReport.exitCode).toBe(0);
  });

  it('Does the drift detector show the similarity score alongside near-miss hints?', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['The drift detector catches renamed test descriptions in the workspace test directory.']);
    setupTestFile(root, ['The drift detector catches renamed test descriptions in the project test folder.']);

    const report = detectWorkspaceDrift(root, [cycle]);
    expect(report.exitCode).toBe(2);
    expect(report.output).toMatch(/Near miss \(\d+%\):/u);
  });

  it('Does the drift detector match question-form playback questions against statement-form test descriptions?', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['Does `method pull` create a flat design doc?']);
    setupTestFile(root, ['method pull creates a flat design doc']);

    const report = detectWorkspaceDrift(root, [cycle]);
    expect(report.exitCode).toBe(0);
  });

  it('Does the drift detector match despite backtick differences between questions and test descriptions?', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, ['Does `readCycleFromDoc()` discover both flat and legacy nested design docs?']);
    setupTestFile(root, ['Does readCycleFromDoc() discover both flat and legacy nested design docs?']);

    const report = detectWorkspaceDrift(root, [cycle]);
    expect(report.exitCode).toBe(0);
  });

  it('Does the drift detector treat high-confidence near-misses as semantic matches instead of drift?', () => {
    const root = createTempRoot();
    const cycle = setupCycleWithQuestions(root, [
      'Does `method doctor` detect legacy nested design doc directories and offer to flatten them?',
    ]);
    setupTestFile(root, ['Does method doctor detect legacy nested design doc directories and offer to flatten them']);

    const report = detectWorkspaceDrift(root, [cycle]);
    // Only difference is backticks and trailing punctuation — should match semantically
    expect(report.exitCode).toBe(0);
  });
});
