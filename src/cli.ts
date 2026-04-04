#!/usr/bin/env node

import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { alert, confirm } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import { parseCliArgs, usage } from './cli-args.js';
import { renderStatus } from './cli-renderer.js';
import { initWorkspace, Workspace } from './index.js';
import { createMcpServer } from './mcp.js';
import { GitHubAdapter } from './adapters/github.js';

type Writer = Pick<NodeJS.WritableStream, 'write'>;
type ConfirmPrompt = (options: { title: string; defaultValue: boolean }) => Promise<boolean>;

export interface RunCliOptions {
  cwd?: string;
  stdout?: Writer;
  stderr?: Writer;
  confirmPrompt?: ConfirmPrompt;
}

export async function runCli(
  argv: readonly string[],
  options: RunCliOptions = {},
): Promise<number> {
  const root = resolve(options.cwd ?? process.cwd());
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const ctx = createNodeContext();
  const promptConfirm = options.confirmPrompt
    ?? ((promptOptions) => confirm({ title: promptOptions.title, defaultValue: promptOptions.defaultValue, ctx }));

  try {
    const parsed = parseCliArgs(argv);
    if (parsed.command === 'help') {
      stdout.write(`${usage(parsed.topic)}\n`);
      return 0;
    }

    if (parsed.command === 'init') {
      const target = resolve(root, parsed.path);
      const result = initWorkspace(target);
      stdout.write(`${alert(`Initialized METHOD workspace at ${target}`, { variant: 'success', ctx })}\n`);
      if (result.created.length > 0) {
        stdout.write(`${result.created.map((entry) => `- ${entry}`).join('\n')}\n`);
      }
      return 0;
    }

    const workspace = new Workspace(root);
    workspace.ensureInitialized();

    if (parsed.command === 'inbox') {
      const created = workspace.captureIdea(parsed.idea, parsed.legend, parsed.title);
      stdout.write(`${alert(`Captured ${relative(root, created)}`, { variant: 'success', ctx })}\n`);
      return 0;
    }

    if (parsed.command === 'pull') {
      const cycle = workspace.pullItem(parsed.item);
      stdout.write(`${alert(`Pulled into ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.designDoc)}\n`);
      return 0;
    }

    if (parsed.command === 'close') {
      const completedDriftCheck = parsed.driftCheck === undefined
        ? await promptConfirm({ title: 'Drift check complete?', defaultValue: false })
        : parsed.driftCheck === 'yes';
      const cycle = workspace.closeCycle(parsed.cycle, completedDriftCheck, parsed.outcome);
      stdout.write(`${alert(`Closed ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.retroDoc)}\n`);
      return 0;
    }

    if (parsed.command === 'drift') {
      const report = workspace.detectDrift(parsed.cycle);
      stdout.write(report.output);
      return report.exitCode;
    }

    if (parsed.command === 'mcp') {
      const server = createMcpServer(root);
      const transport = new StdioServerTransport();
      await server.connect(transport);
      // Let it run indefinitely
      return new Promise<number>(() => {});
    }

    if (parsed.command === 'sync') {
      if (parsed.adapter === 'github') {
        const token = process.env.GITHUB_TOKEN;
        const repoFull = process.env.GITHUB_REPO;

        if (!token) {
          throw new Error('GITHUB_TOKEN environment variable is required for GitHub sync.');
        }
        if (!repoFull || !repoFull.includes('/')) {
          throw new Error('GITHUB_REPO environment variable (owner/repo) is required for GitHub sync.');
        }

        const [owner, repo] = repoFull.split('/');
        const adapter = new GitHubAdapter({
          workspace,
          token,
          owner: owner!,
          repo: repo!,
        });

        const results = await adapter.syncBacklog();
        for (const result of results) {
          if (result.skipped) {
            continue;
          }
          if (result.error) {
            stderr.write(`${alert(`Error syncing ${result.path}: ${result.error}`, { variant: 'error', ctx })}\n`);
          } else if (result.issue) {
            stdout.write(`${alert(`Synced ${result.path} to GitHub Issue #${result.issue.number}`, { variant: 'success', ctx })}\n`);
          }
        }
        return 0;
      }
    }

    const status = workspace.status();
    stdout.write(renderStatus(status));
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${alert(message, { variant: 'error', ctx })}\n`);
    return 1;
  }
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  return runCli(argv);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().then((code) => {
    process.exitCode = code;
  });
}
