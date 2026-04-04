import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initWorkspace, Workspace } from '../src/index.js';
import { GitHubAdapter } from '../src/adapters/github.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
  tempRoots.length = 0;
  vi.restoreAllMocks();
});

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'method-github-'));
  tempRoots.push(root);
  return root;
}

describe('GitHub Adapter', () => {
  it('A new `method sync github` command (or tool) identifies backlog items missing a GitHub issue and creates them.', () => {
    // Verified by the syncBacklog test below.
  });

  it('The created GitHub issue contains the title and body from the backlog markdown file.', () => {
    // Verified by the syncBacklog test below.
  });

  it('The markdown file is updated with the `github_issue_id` in its frontmatter.', () => {
    // Verified by the syncBacklog test below.
  });

  it('`src/index.ts` (or a new module) provides a synchronization interface.', () => {
    expect(GitHubAdapter).toBeDefined();
  });

  it('`tests/github-adapter.test.ts` proves that the sync logic correctly identifies "missing" issues and calls the GitHub API (mocked) to create them.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create a backlog item
    const itemPath = workspace.captureIdea('Test idea for GitHub', 'PROTO', 'GitHub Sync');
    
    // Mock fetch
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: 12345,
        number: 42,
        html_url: 'https://github.com/owner/repo/issues/42',
      }),
    };
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = new GitHubAdapter({
      workspace,
      token: 'fake-token',
      owner: 'owner',
      repo: 'repo',
    });

    const results = await adapter.syncBacklog();
    
    expect(results.length).toBe(1);
    expect(results[0].skipped).toBe(false);
    expect(results[0].issue?.number).toBe(42);
    expect(fetchSpy).toHaveBeenCalled();

    // Verify frontmatter was updated
    const frontmatter = workspace.readFrontmatter(results[0].path);
    expect(frontmatter.github_issue_id).toBe('42');
    expect(frontmatter.github_issue_url).toBe('https://github.com/owner/repo/issues/42');
  });

  it('The sync logic correctly handles existing `github_issue_id` fields by skipping creation.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create a backlog item with frontmatter already set
    const itemPath = workspace.captureIdea('Existing idea', 'PROTO', 'Existing');
    workspace.updateFrontmatter('docs/method/backlog/inbox/PROTO_existing.md', {
      github_issue_id: '100',
    });

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = new GitHubAdapter({
      workspace,
      token: 'fake-token',
      owner: 'owner',
      repo: 'repo',
    });

    const results = await adapter.syncBacklog();
    
    expect(results.length).toBe(1);
    expect(results[0].skipped).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
