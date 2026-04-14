import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor, runDoctorMigrate, runDoctorRepair } from '../src/doctor.js';
import { initWorkspace } from '../src/index.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-doctor-'));
  tempRoots.push(root);
  return root;
}

describe('doctor engine', () => {
  it('Does `runDoctor()` report orphaned backlog items and git-hook diagnostics without requiring a healthy `Workspace` instance?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(join(root, '.method.json'), JSON.stringify({ forge: 'invalid' }), 'utf8');
    writeFileSync(
      join(root, 'docs/method/backlog/PROCESS_orphan.md'),
      ['---', 'title: "Orphan"', 'legend: PROCESS', 'lane: inbox', '---', '', '# Orphan', '', 'Body'].join('\n'),
      'utf8',
    );

    const report = runDoctor(root);
    const issueCodes = report.issues.map((issue) => issue.code);

    expect(report.status).toBe('error');
    expect(issueCodes).toContain('config-invalid');
    expect(issueCodes).toContain('orphaned-backlog-item');
    expect(issueCodes.some((code) => code.startsWith('git-hooks-'))).toBe(true);
  });

  it('reports missing required paths and malformed packet frontmatter with concrete fix suggestions.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_bad-frontmatter.md'),
      '---\ntitle: [broken\n---\n\n# Bad Frontmatter\n',
      'utf8',
    );

    const report = runDoctor(root);
    const missingDirectory = report.issues.find((issue) => issue.code === 'missing-directory');
    const badFrontmatter = report.issues.find((issue) => issue.code === 'frontmatter-parse-failed');

    expect(report.status).toBe('error');
    expect(missingDirectory?.path).toBe('docs/design');
    expect(missingDirectory?.fix).toContain('method init');
    expect(badFrontmatter?.path).toBe('docs/method/backlog/inbox/PROCESS_bad-frontmatter.md');
    expect(badFrontmatter?.fix).toContain('Fix the YAML syntax');
  });

  it('attaches structured repair hints to safe deterministic issues such as missing directories, scaffold files, and frontmatter stubs.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/RELEASE.md'), { recursive: true, force: true });
    writeFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'), '# Missing Frontmatter\n\nBody\n', 'utf8');

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'missing-directory',
        path: 'docs/design',
        repair: { kind: 'create-directory', targetPath: 'docs/design' },
      }),
    );
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'missing-file',
        path: 'docs/RELEASE.md',
        repair: { kind: 'restore-file', targetPath: 'docs/RELEASE.md' },
      }),
    );
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'missing-frontmatter',
        path: 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md',
        repair: { kind: 'frontmatter-stub', targetPath: 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md' },
      }),
    );
  });

  it('skips path-based checks when malformed JSON makes the configured workspace paths unknowable.', () => {
    const root = createTempRoot();
    writeFileSync(join(root, '.method.json'), '{ broken json }\n', 'utf8');

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'config-parse-failed',
        check: 'config',
      }),
    );
    expect(report.issues.some((issue) => issue.check === 'structure')).toBe(false);
    expect(report.issues.some((issue) => issue.check === 'frontmatter')).toBe(false);
    expect(report.issues.some((issue) => issue.check === 'backlog')).toBe(false);
  });

  it('accepts CRLF frontmatter blocks whose closing delimiter sits at EOF.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    writeFileSync(
      join(root, 'docs/method/backlog/inbox/PROCESS_windows-frontmatter.md'),
      '---\r\ntitle: "Windows Frontmatter"\r\nlegend: PROCESS\r\nlane: inbox\r\n---',
      'utf8',
    );

    const report = runDoctor(root);

    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'missing-frontmatter',
        path: 'docs/method/backlog/inbox/PROCESS_windows-frontmatter.md',
      }),
    );
    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'unterminated-frontmatter',
        path: 'docs/method/backlog/inbox/PROCESS_windows-frontmatter.md',
      }),
    );
  });

  it('reports required path type mismatches instead of accepting any existing path as healthy.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    writeFileSync(join(root, 'docs/design'), 'not a directory\n', 'utf8');
    rmSync(join(root, 'CHANGELOG.md'), { recursive: true, force: true });
    mkdirSync(join(root, 'CHANGELOG.md'), { recursive: true });

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'path-not-directory',
        path: 'docs/design',
      }),
    );
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'path-not-file',
        path: 'CHANGELOG.md',
      }),
    );
  });

  it('treats absent empty backlog lane directories as acceptable and falls back to default git hook inspection.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
    rmSync(join(root, 'docs/method/backlog/asap'), { recursive: true, force: true });

    const report = runDoctor(root);

    expect(report.status).toBe('warn');
    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'missing-directory',
        path: 'docs/method/backlog/asap',
      }),
    );
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'git-hooks-not-configured',
        check: 'git-hooks',
      }),
    );
    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'git-hooks-unavailable',
      }),
    );
  });

  it('treats repo-defined backlog lanes such as `v1.1.0` as recognized lane directories.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    mkdirSync(join(root, 'docs/method/backlog/v1.1.0'), { recursive: true });
    writeFileSync(
      join(root, 'docs/method/backlog/v1.1.0/PROCESS_release-scope.md'),
      ['---', 'title: "Release Scope"', 'legend: PROCESS', 'lane: v1.1.0', '---', '', '# Release Scope', '', 'Body'].join('\n'),
      'utf8',
    );

    const report = runDoctor(root);

    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'orphaned-backlog-item',
        path: 'docs/method/backlog/v1.1.0/PROCESS_release-scope.md',
      }),
    );
  });

  it('reports a configured hooks path that exists as a file without collapsing to git-hooks-unavailable.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
    writeFileSync(join(root, 'hooks-file'), 'not a directory\n', 'utf8');
    execFileSync('git', ['config', 'core.hooksPath', 'hooks-file'], { cwd: root, stdio: 'ignore' });

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'git-hooks-not-directory',
        path: 'hooks-file',
      }),
    );
    expect(report.issues).not.toContainEqual(
      expect.objectContaining({
        code: 'git-hooks-unavailable',
      }),
    );
  });

  it('plans and applies the bounded doctor repair set without inventing new mutations outside the repair hints.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/RELEASE.md'), { recursive: true, force: true });
    writeFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'), '# Missing Frontmatter\n\nBody\n', 'utf8');

    const plan = runDoctorRepair(root, 'plan');
    expect(plan.ok).toBe(true);
    const planCodes = plan.selectedIssues.map((issue) => issue.code);
    expect(planCodes).toContain('missing-directory');
    expect(planCodes).toContain('missing-file');
    expect(planCodes).toContain('missing-frontmatter');
    expect(plan.repairs.every((repair) => repair.status === 'planned')).toBe(true);

    const applied = runDoctorRepair(root, 'apply');
    expect(applied.ok).toBe(true);
    expect(applied.repairs.every((repair) => repair.status === 'applied')).toBe(true);
    expect(applied.touchedPaths).toContain('docs/design');
    expect(applied.touchedPaths).toContain('docs/method/backlog/inbox/PROCESS_missing-frontmatter.md');
    expect(applied.touchedPaths).toContain('docs/RELEASE.md');
    expect(readFileSync(join(root, 'docs/RELEASE.md'), 'utf8')).toContain('# Release');
    expect(readFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'), 'utf8')).toMatch(
      /^---\ntitle: "Missing Frontmatter"\n---\n\n# Missing Frontmatter/mu,
    );
    expect(applied.unresolvedIssues).not.toContainEqual(expect.objectContaining({ code: 'missing-directory', path: 'docs/design' }));
    expect(applied.unresolvedIssues).not.toContainEqual(expect.objectContaining({ code: 'missing-file', path: 'docs/RELEASE.md' }));
    expect(applied.unresolvedIssues).not.toContainEqual(
      expect.objectContaining({ code: 'missing-frontmatter', path: 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md' }),
    );
  });

  it('Does `method doctor` detect legacy nested design doc directories and offer to flatten them?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    mkdirSync(join(root, 'docs/design/0001-legacy-test'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-legacy-test/legacy-test.md'),
      '---\ntitle: "Legacy Test"\nlegend: "PROCESS"\ncycle: "0001-legacy-test"\n---\n\n# Legacy Test\n',
      'utf8',
    );

    const report = runDoctor(root);
    const legacyIssue = report.issues.find((issue) => issue.code === 'legacy-design-layout');

    expect(legacyIssue).toBeDefined();
    expect(legacyIssue?.severity).toBe('warning');
    expect(legacyIssue?.fix).toContain('method doctor --repair');
    expect(legacyIssue?.repair?.kind).toBe('flatten-design-doc');
  });

  it('Does `method_doctor` report `legacy-design-layout` warnings with `flatten-design-doc` repair hints?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    mkdirSync(join(root, 'docs/design/0002-another-legacy'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0002-another-legacy/another-legacy.md'),
      '---\ntitle: "Another Legacy"\nlegend: "PROCESS"\ncycle: "0002-another-legacy"\n---\n\n# Another Legacy\n',
      'utf8',
    );

    const report = runDoctor(root);
    const legacyIssues = report.issues.filter((issue) => issue.code === 'legacy-design-layout');

    expect(legacyIssues.length).toBe(1);
    expect(legacyIssues[0].repair).toEqual({
      kind: 'flatten-design-doc',
      targetPath: 'docs/design/0002-another-legacy',
    });
  });

  it('detects legacy nested design doc directories and offers flatten-design-doc repair.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-method-cli/method-cli.md'),
      ['---', 'title: "Method CLI"', 'legend: "PROCESS"', 'cycle: "0001-method-cli"', '---', '', '# Method CLI'].join('\n'),
      'utf8',
    );

    const report = runDoctor(root);
    const legacyIssue = report.issues.find((issue) => issue.code === 'legacy-design-layout');

    expect(legacyIssue).toBeDefined();
    expect(legacyIssue?.path).toBe('docs/design/0001-method-cli');
    expect(legacyIssue?.repair?.kind).toBe('flatten-design-doc');
  });

  it('flatten-design-doc repair moves nested design doc to flat file and updates cycle frontmatter.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    mkdirSync(join(root, 'docs/design/0001-method-cli'), { recursive: true });
    writeFileSync(
      join(root, 'docs/design/0001-method-cli/method-cli.md'),
      ['---', 'title: "Method CLI"', 'legend: "PROCESS"', 'cycle: "0001-method-cli"', '---', '', '# Method CLI'].join('\n'),
      'utf8',
    );

    const result = runDoctorRepair(root, 'apply');
    const flattenRepair = result.repairs.find((repair) => repair.kind === 'flatten-design-doc');

    expect(flattenRepair?.status).toBe('applied');
    expect(existsSync(join(root, 'docs/design/PROCESS_method-cli.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/design/0001-method-cli'))).toBe(false);

    const content = readFileSync(join(root, 'docs/design/PROCESS_method-cli.md'), 'utf8');
    expect(content).toContain('cycle: "PROCESS_method-cli"');
  });

  it('runs doctor, applies the bounded repair set, and re-checks the workspace through one migrate result.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    rmSync(join(root, 'docs/RELEASE.md'), { recursive: true, force: true });
    writeFileSync(join(root, 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md'), '# Missing Frontmatter\n\nBody\n', 'utf8');

    const result = runDoctorMigrate(root);

    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.initialReport.status).toBe('error');
    expect(result.repair.mode).toBe('apply');
    expect(result.repair.repairs.every((repair) => repair.status === 'applied')).toBe(true);
    expect(result.finalReport.issues).not.toContainEqual(expect.objectContaining({ code: 'missing-directory', path: 'docs/design' }));
    expect(result.finalReport.issues).not.toContainEqual(expect.objectContaining({ code: 'missing-file', path: 'docs/RELEASE.md' }));
    expect(result.finalReport.issues).not.toContainEqual(
      expect.objectContaining({ code: 'missing-frontmatter', path: 'docs/method/backlog/inbox/PROCESS_missing-frontmatter.md' }),
    );
  });
});
