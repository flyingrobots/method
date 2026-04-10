import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initWorkspace } from '../src/index.js';
import { runDoctor } from '../src/doctor.js';

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
      [
        '---',
        'title: "Orphan"',
        'legend: PROCESS',
        'lane: inbox',
        '---',
        '',
        '# Orphan',
        '',
        'Body',
      ].join('\n'),
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

  it('skips path-based checks when malformed JSON makes the configured workspace paths unknowable.', () => {
    const root = createTempRoot();
    writeFileSync(join(root, '.method.json'), '{ broken json }\n', 'utf8');

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'config-parse-failed',
      check: 'config',
    }));
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

    expect(report.issues).not.toContainEqual(expect.objectContaining({
      code: 'missing-frontmatter',
      path: 'docs/method/backlog/inbox/PROCESS_windows-frontmatter.md',
    }));
    expect(report.issues).not.toContainEqual(expect.objectContaining({
      code: 'unterminated-frontmatter',
      path: 'docs/method/backlog/inbox/PROCESS_windows-frontmatter.md',
    }));
  });

  it('reports required path type mismatches instead of accepting any existing path as healthy.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    rmSync(join(root, 'docs/design'), { recursive: true, force: true });
    writeFileSync(join(root, 'docs/design'), 'not a directory\n', 'utf8');
    rmSync(join(root, 'CHANGELOG.md'), { recursive: true, force: true });
    mkdirSync(join(root, 'CHANGELOG.md'), { recursive: true });

    const report = runDoctor(root);

    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'path-not-directory',
      path: 'docs/design',
    }));
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'path-not-file',
      path: 'CHANGELOG.md',
    }));
  });

  it('treats absent empty backlog lane directories as acceptable and falls back to default git hook inspection.', () => {
    const root = createTempRoot();
    initWorkspace(root);
    execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
    rmSync(join(root, 'docs/method/backlog/asap'), { recursive: true, force: true });
    rmSync(join(root, 'docs/method/backlog/up-next'), { recursive: true, force: true });

    const report = runDoctor(root);

    expect(report.status).toBe('warn');
    expect(report.issues).not.toContainEqual(expect.objectContaining({
      code: 'missing-directory',
      path: 'docs/method/backlog/asap',
    }));
    expect(report.issues).not.toContainEqual(expect.objectContaining({
      code: 'missing-directory',
      path: 'docs/method/backlog/up-next',
    }));
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'git-hooks-not-configured',
      check: 'git-hooks',
    }));
    expect(report.issues).not.toContainEqual(expect.objectContaining({
      code: 'git-hooks-unavailable',
    }));
  });
});
