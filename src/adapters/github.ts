import { resolve } from 'node:path';
import { readBody, readHeading, type Workspace } from '../index.js';

export interface GitHubIssue {
  id: number;
  number: number;
  url: string;
}

export interface GitHubSyncResult {
  path: string;
  issue?: GitHubIssue;
  skipped: boolean;
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

  async syncBacklog(): Promise<GitHubSyncResult[]> {
    const status = this.workspace.status();
    const results: GitHubSyncResult[] = [];

    const allItems = [
      ...status.backlog.inbox,
      ...status.backlog.asap,
      ...status.backlog['up-next'],
      ...status.backlog['cool-ideas'],
      ...status.backlog['bad-code'],
      ...status.backlog.root,
    ];

    for (const item of allItems) {
      results.push(await this.syncItem(item.path));
    }

    return results;
  }

  async syncItem(relativePath: string): Promise<GitHubSyncResult> {
    try {
      const frontmatter = this.workspace.readFrontmatter(relativePath);
      if (frontmatter.github_issue_id !== undefined) {
        return { path: relativePath, skipped: true };
      }

      const fullPath = resolve(this.workspace.root, relativePath);
      const title = readHeading(fullPath);
      const body = readBody(fullPath);

      const issue = await this.createIssue(title, body);
      
      this.workspace.updateFrontmatter(relativePath, {
        github_issue_id: String(issue.number),
        github_issue_url: issue.url,
      });

      return { path: relativePath, issue, skipped: false };
    } catch (error: unknown) {
      return {
        path: relativePath,
        skipped: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async createIssue(title: string, body: string): Promise<GitHubIssue> {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'METHOD-CLI',
        },
        body: JSON.stringify({ title, body }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    const data = (await response.json()) as any;
    return {
      id: data.id,
      number: data.number,
      url: data.html_url,
    };
  }
}
