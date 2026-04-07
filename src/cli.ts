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
      const cycle = await workspace.closeCycle(parsed.cycle, completedDriftCheck, parsed.outcome);
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
        const token = workspace.config.github_token;
        const repoFull = workspace.config.github_repo;

        if (!token) {
          throw new Error('GitHub token is required for sync. Provide it via GITHUB_TOKEN or .method.json.');
        }
        if (!repoFull || !repoFull.includes('/')) {
          throw new Error('GitHub repo (owner/repo) is required for sync. Provide it via GITHUB_REPO or .method.json.');
        }

        const [owner, repo] = repoFull.split('/');
        const adapter = new GitHubAdapter({
          workspace,
          token,
          owner: owner!,
          repo: repo!,
        });

        if (!parsed.push && !parsed.pull) {
          stderr.write(`${alert('No sync direction specified. Use --push and/or --pull.', { variant: 'error', ctx })}\n`);
          return 1;
        }

        if (parsed.push) {
          const results = await adapter.pushBacklog();
          for (const result of results) {
            if (result.skipped) continue;
            if (result.error) {
              stderr.write(`${alert(`Error pushing ${result.path}: ${result.error}`, { variant: 'error', ctx })}\n`);
            } else if (result.action === 'create' || result.action === 'push') {
              const issueLabel = result.issue?.number ?? '<unknown>';
              const verb = result.action === 'create' ? 'Created' : 'Updated';
              stdout.write(`${alert(`${verb} GitHub Issue #${issueLabel} for ${result.path}`, { variant: 'success', ctx })}\n`);
            }
          }
        }

        if (parsed.pull) {
          const results = await adapter.pullBacklog();
          for (const result of results) {
            if (result.skipped) continue;
            if (result.error) {
              stderr.write(`${alert(`Error pulling ${result.path}: ${result.error}`, { variant: 'error', ctx })}\n`);
            } else if (result.action === 'pull') {
              const issueLabel = result.issue?.number ?? '<unknown>';
              stdout.write(`${alert(`Pulled remote changes from GitHub Issue #${issueLabel} into ${result.path}`, { variant: 'success', ctx })}\n`);
            }
          }
        }
        return 0;
      }

      if (parsed.adapter === 'ship') {
        const result = workspace.shipSync();
        for (const path of result.updated) {
          stdout.write(`${alert(`Updated ${path}`, { variant: 'success', ctx })}\n`);
        }
        for (const cycle of result.newShips) {
          stdout.write(`- Shipped ${cycle.name}\n`);
        }
        if (result.newShips.length === 0) {
          stdout.write('No new ships found.\n');
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
