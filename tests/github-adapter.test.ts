import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initWorkspace, Workspace, readBody } from '../src/index.js';
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
  const root = mkdtempSync(join(tmpdir(), 'method-github-two-way-'));
  tempRoots.push(root);
  return root;
}

describe('GitHub Adapter Two-way Sync', () => {
  it('`method sync github --push` (or default) updates the title and description of an existing GitHub issue if the local file changes.', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create item with existing ID
    workspace.captureIdea('Local Title', 'PROCESS', 'My Item');
    const itemPath = 'docs/method/backlog/inbox/PROCESS_my-item.md';
    workspace.updateFrontmatter(itemPath, { github_issue_id: '42' });

    // Mock GitHub PATCH
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: 12345,
        number: 42,
        html_url: 'https://github.com/owner/repo/issues/42',
        state: 'open',
        labels: [],
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

    const results = await adapter.pushBacklog();
    
    expect(results.length).toBe(1);
    expect(results[0].action).toBe('push');
    expect(fetchSpy).toHaveBeenCalled();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/issues/42');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({
      title: 'My Item',
      body: 'Local Title',
    });
  });

  it('`method sync github --pull` updates local backlog files with data from GitHub (labels, status, comments).', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create item with existing ID
    workspace.captureIdea('Local Title', 'PROCESS', 'My Item');
    const itemPath = 'docs/method/backlog/inbox/PROCESS_my-item.md';
    workspace.updateFrontmatter(itemPath, { github_issue_id: '42' });

    // Mock GitHub GETs (Issue and Comments)
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/issues/42')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 12345,
            number: 42,
            html_url: 'https://github.com/owner/repo/issues/42',
            state: 'open',
            labels: [{ name: 'bug' }, { name: 'priority' }],
          }),
        });
      }
      if (url.endsWith('/comments')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { user: { login: 'user1' }, body: 'First comment' },
          ],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = new GitHubAdapter({
      workspace,
      token: 'fake-token',
      owner: 'owner',
      repo: 'repo',
    });

    const results = await adapter.pullBacklog();
    
    expect(results.length).toBe(1);
    expect(results[0].action).toBe('pull');

    // Verify local updates
    const frontmatter = workspace.readFrontmatter(itemPath);
    expect(frontmatter.github_labels).toBe('bug,priority');

    const body = readBody(join(root, itemPath));
    expect(body).toContain('## GitHub Comments');
    expect(body).toContain('**@user1**: First comment');
  });

  it('Local files reflect GitHub status (e.g., if an issue is closed on GitHub, the local file is updated or moved).', async () => {
    const root = createTempRoot();
    initWorkspace(root);
    const workspace = new Workspace(root);

    // Create item with existing ID
    workspace.captureIdea('Closed Item', 'PROCESS', 'Closed');
    const itemPath = 'docs/method/backlog/inbox/PROCESS_closed.md';
    workspace.updateFrontmatter(itemPath, { github_issue_id: '99' });

    // Mock GitHub GETs (Closed state)
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/issues/99')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 99999,
            number: 99,
            html_url: 'https://github.com/owner/repo/issues/99',
            state: 'closed',
            labels: [],
          }),
        });
      }
      if (url.endsWith('/comments')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = new GitHubAdapter({
      workspace,
      token: 'fake-token',
      owner: 'owner',
      repo: 'repo',
    });

    await adapter.pullBacklog();

    // Verify file was moved to graveyard
    const graveyardPath = join(root, 'docs/method/graveyard/PROCESS_closed.md');
    const inboxPath = join(root, 'docs/method/backlog/inbox/PROCESS_closed.md');
    
    expect(existsSync(graveyardPath), 'file should exist in graveyard').toBe(true);
    expect(existsSync(inboxPath), 'file should no longer exist in inbox').toBe(false);
    expect(readFileSync(graveyardPath, 'utf8')).toContain('Closed Item');
    expect(workspace.readFrontmatter('docs/method/graveyard/PROCESS_closed.md').lane).toBe('graveyard');
  });
});
