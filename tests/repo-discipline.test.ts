import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-discipline-'));
  tempRoots.push(root);
  return root;
}

describe('METHOD repo discipline', () => {
  it('Does METHOD repo doctrine now say that `main` should not carry open cycle packets or release-prep exceptions, and that discovering one is stop-and-repair work?', () => {
    const readme = readRepoFile('README.md');
    const process = readRepoFile('docs/method/process.md');

    expect(readme).toContain('If `main` is ever found carrying an open cycle packet or a');
    expect(readme).toContain('release-prep exception, stop and repair that state');
    expect(readme).toContain('`main` is not a parking lot for open cycle packets.');
    expect(process).toContain('If merged `main` is ever found carrying an open cycle packet');
    expect(process).toContain('Release prep and ship sync are never excuses to leave an already-merged');
  });

  it('If I prep a release from this repo, does the release runbook explicitly fail when active cycles are still open on `main`?', () => {
    const runbook = readRepoFile('docs/method/release-runbook.md');

    expect(runbook).toContain('Abort if any cycle packets are still open on merged `main`');
    expect(runbook).toContain('active cycle count on `main`');
    expect(runbook).toContain('Verify zero active cycles are open on `main`.');
  });

  it('Do repo tests lock the self-discipline rule so README/process/release docs and local tool ignore posture cannot silently drift again?', () => {
    const gitignore = readRepoFile('.gitignore');
    const tracked = execFileSync('git', ['ls-files', '.mcp.json', '.claude/settings.local.json', 'backfill_frontmatter.cjs'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();

    expect(gitignore).toContain('.mcp.json');
    expect(gitignore).toContain('.claude/');
    expect(gitignore).toContain('backfill_frontmatter.cjs');
    expect(tracked).toBe('');
  });

  it('When legacy docs are missing `title` frontmatter, can METHOD still read them without needing a tracked ad hoc repair script?', () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);
    const path = 'docs/method/backlog/inbox/PROCESS_legacy-title.md';

    writeFileSync(join(root, path), '# Legacy Title\n\nBody\n', 'utf8');

    expect(workspace.readFrontmatter(path)).toMatchObject({
      title: 'Legacy Title',
    });
    expect(execFileSync('git', ['ls-files', 'backfill_frontmatter.cjs'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim()).toBe('');
  });
});
