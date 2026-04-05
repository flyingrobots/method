import { resolve } from 'node:path';
import { readBody, readHeading, type Workspace } from '../index.js';
import { type WorkspaceStatus } from '../domain.js';

export interface GitHubIssue {
  id: number;
  number: number;
  url: string;
  state: 'open' | 'closed';
  labels: string[];
}

export interface GitHubSyncResult {
  path: string;
  issue?: GitHubIssue;
  skipped: boolean;
  action: 'create' | 'push' | 'pull' | 'skip';
  error?: string;
}

export class GitHubAdapter {
  private readonly workspace: Workspace;
  private readonly token: string;
  private readonly owner: string;
  private readonly repo: string;

  constructor(options: {
    workspace: Workspace;
    token: string;
    owner: string;
    repo: string;
  }) {
    this.workspace = options.workspace;
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
  }

  async pushBacklog(): Promise<GitHubSyncResult[]> {
    const status = this.workspace.status();
    const results: GitHubSyncResult[] = [];

    const allItems = this.getAllBacklogItems(status);

    for (const item of allItems) {
      results.push(await this.pushItem(item.path));
    }

    return results;
  }

  async pullBacklog(): Promise<GitHubSyncResult[]> {
    const status = this.workspace.status();
    const results: GitHubSyncResult[] = [];

    const allItems = this.getAllBacklogItems(status);

    for (const item of allItems) {
      results.push(await this.pullItem(item.path));
    }

    return results;
  }

  private getAllBacklogItems(status: WorkspaceStatus) {
    return [
      ...status.backlog.inbox,
      ...status.backlog.asap,
      ...status.backlog['up-next'],
      ...status.backlog['cool-ideas'],
      ...status.backlog['bad-code'],
      ...status.backlog.root,
    ];
  }

  async pushItem(relativePath: string): Promise<GitHubSyncResult> {
    try {
      const frontmatter = this.workspace.readFrontmatter(relativePath);
      const fullPath = resolve(this.workspace.root, relativePath);
      const title = readHeading(fullPath);
      let body = readBody(fullPath);

      // Strip local GitHub Comments block if present to avoid mirroring them back
      const commentHeader = '## GitHub Comments';
      if (body.includes(commentHeader)) {
        body = body.split(commentHeader)[0]?.trim() ?? body;
      }

      if (frontmatter.github_issue_id === undefined || !/^\d+$/u.test(frontmatter.github_issue_id)) {
        // Fallback to creation if ID is missing or invalid
        const issue = await this.createIssue(title, body);
        this.workspace.updateFrontmatter(relativePath, {
          github_issue_id: String(issue.number),
          github_issue_url: issue.url,
        });
        return { path: relativePath, issue, skipped: false, action: 'create' };
      }

      // Update existing issue
      const issueNumber = Number.parseInt(frontmatter.github_issue_id, 10);
      const issue = await this.updateIssue(issueNumber, title, body);
      return { path: relativePath, issue, skipped: false, action: 'push' };
    } catch (error: unknown) {
      return {
        path: relativePath,
        skipped: false,
        action: 'push',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async pullItem(relativePath: string): Promise<GitHubSyncResult> {
    try {
      const frontmatter = this.workspace.readFrontmatter(relativePath);
      if (frontmatter.github_issue_id === undefined || !/^\d+$/u.test(frontmatter.github_issue_id)) {
        return { path: relativePath, skipped: true, action: 'skip' };
      }

      const issueNumber = Number.parseInt(frontmatter.github_issue_id, 10);
      const remoteIssue = await this.fetchIssue(issueNumber);
      const remoteComments = await this.fetchComments(issueNumber);

      // Update local frontmatter
      this.workspace.updateFrontmatter(relativePath, {
        github_issue_url: remoteIssue.url,
        github_labels: remoteIssue.labels.join(','),
      });

      // Update local body with comments if any
      if (remoteComments.length > 0) {
        const fullPath = resolve(this.workspace.root, relativePath);
        const localBody = readBody(fullPath);
        const commentSection = '\n\n## GitHub Comments\n\n' + remoteComments.map(c => `**@${c.user}**: ${c.body}`).join('\n\n---\n\n');
        
        // Simple avoid-duplication check
        if (!localBody.includes('## GitHub Comments')) {
          this.workspace.updateBody(relativePath, localBody + commentSection);
        }
      }

      // Handle closed status
      if (remoteIssue.state === 'closed') {
        const currentLane = relativePath.split('/')[3] || 'root';
        if (currentLane !== 'graveyard') {
          this.workspace.moveBacklogItem(relativePath, 'graveyard');
        }
      }

      return { path: relativePath, issue: remoteIssue, skipped: false, action: 'pull' };
    } catch (error: unknown) {
      return {
        path: relativePath,
        skipped: false,
        action: 'pull',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async createIssue(title: string, body: string): Promise<GitHubIssue> {
    const data = await this.ghFetch(`/repos/${this.owner}/${this.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
    return this.mapIssue(data);
  }

  private async updateIssue(number: number, title: string, body: string): Promise<GitHubIssue> {
    const data = await this.ghFetch(`/repos/${this.owner}/${this.repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, body }),
    });
    return this.mapIssue(data);
  }

  private async fetchIssue(number: number): Promise<GitHubIssue> {
    const data = await this.ghFetch(`/repos/${this.owner}/${this.repo}/issues/${number}`);
    return this.mapIssue(data);
  }

  private async fetchComments(number: number): Promise<{ user: string; body: string }[]> {
    const data = (await this.ghFetch(`/repos/${this.owner}/${this.repo}/issues/${number}/comments`)) as any[];
    return data.map((c: any) => ({
      user: c.user.login,
      body: c.body,
    }));
  }

  private async ghFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'METHOD-CLI',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    return response.json();
  }

  private mapIssue(data: any): GitHubIssue {
    return {
      id: data.id,
      number: data.number,
      url: data.html_url,
      state: data.state,
      labels: data.labels.map((l: any) => l.name),
    };
  }
}
