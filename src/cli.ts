#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alert, confirm, input } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GitHubAdapter } from './adapters/github.js';
import { parseCliArgs, usage } from './cli-args.js';
import {
  renderBacklogDependencies,
  renderBacklogQuery,
  renderNextWork,
  renderSignpostInit,
  renderSignpostStatus,
  renderStatus,
} from './cli-renderer.js';
import { loadConfig } from './config.js';
import {
  renderDoctorMigrateText,
  renderDoctorRepairText,
  renderDoctorText,
  runDoctor,
  runDoctorMigrate,
  runDoctorRepair,
} from './doctor.js';
import {
  createBacklogFromCli,
  createInboxFromCli,
  describeBacklogDependenciesFromCli,
  editBacklogMetadataFromCli,
  moveBacklogFromCli,
  queryBacklogFromCli,
  retireBacklogFromCli,
} from './feedback-surface.js';
import { initWorkspace, Workspace } from './index.js';
import { createMcpServer } from './mcp.js';
import { queryReviewState, type ReviewStateQueryOptions, type ReviewStateResult, renderReviewStateText } from './review-state.js';

type Writer = Pick<NodeJS.WritableStream, 'write'>;
type ConfirmPrompt = (options: { title: string; defaultValue: boolean }) => Promise<boolean>;
type TextPrompt = (options: { title: string; defaultValue?: string }) => Promise<string>;
export interface RunCliOptions {
  cwd?: string;
  stdout?: Writer;
  stderr?: Writer;
  confirmPrompt?: ConfirmPrompt;
  textPrompt?: TextPrompt;
  reviewStateQuery?: (options: ReviewStateQueryOptions) => Promise<ReviewStateResult>;
}
export async function runCli(argv: readonly string[], options: RunCliOptions = {}): Promise<number> {
  const root = resolve(options.cwd ?? process.cwd());
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const ctx = createNodeContext();
  const promptConfirm =
    options.confirmPrompt ?? ((promptOptions) => confirm({ title: promptOptions.title, defaultValue: promptOptions.defaultValue, ctx }));
  const promptText =
    options.textPrompt ?? ((promptOptions) => input({ title: promptOptions.title, defaultValue: promptOptions.defaultValue ?? '', ctx }));
  try {
    const parsed = parseCliArgs(argv);
    if (parsed.command === 'help') {
      stdout.write(`${usage(parsed.topic)}\n`);
      return 0;
    }
    if (parsed.command === 'init') {
      const target = resolve(root, parsed.path);
      const config = loadConfig(target);
      const result = initWorkspace(target, config.paths);
      stdout.write(`${alert(`Initialized METHOD workspace at ${target}`, { variant: 'success', ctx })}\n`);
      if (result.created.length > 0) {
        stdout.write(`${result.created.map((entry) => `- ${entry}`).join('\n')}\n`);
      }
      return 0;
    }
    if (parsed.command === 'doctor') {
      const report = runDoctor(root);
      stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderDoctorText(report));
      return report.status === 'error' ? 1 : 0;
    }
    if (parsed.command === 'migrate') {
      const result = runDoctorMigrate(root);
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderDoctorMigrateText(result));
      return result.ok ? 0 : 1;
    }
    if (parsed.command === 'repair') {
      const result = runDoctorRepair(root, parsed.mode);
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderDoctorRepairText(result));
      return result.ok ? 0 : 1;
    }
    if (parsed.command === 'mcp') {
      const server = createMcpServer({ reviewStateQuery: options.reviewStateQuery ?? queryReviewState });
      const transport = new StdioServerTransport();
      await server.connect(transport);
      // Let it run indefinitely
      return new Promise<number>(() => {});
    }
    const workspace = new Workspace(root);
    workspace.ensureInitialized();
    if (parsed.command === 'inbox') {
      const created = createInboxFromCli(root, workspace, parsed);
      stdout.write(
        parsed.json ? `${JSON.stringify(created, null, 2)}\n` : `${alert(`Captured ${created.path}`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'backlog-add') {
      const result = createBacklogFromCli(root, workspace, parsed);
      stdout.write(
        parsed.json ? `${JSON.stringify(result, null, 2)}\n` : `${alert(`Created ${result.path}`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'backlog-move') {
      const result = moveBacklogFromCli(workspace, parsed);
      stdout.write(
        parsed.json
          ? `${JSON.stringify(result, null, 2)}\n`
          : `${alert(`Moved ${result.sourcePath} to ${result.path}`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'backlog-edit') {
      const result = editBacklogMetadataFromCli(workspace, parsed);
      stdout.write(
        parsed.json
          ? `${JSON.stringify(result, null, 2)}\n`
          : `${alert(`Updated metadata on ${result.path} (${result.updatedFields.join(', ')})`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'backlog-list') {
      const result = queryBacklogFromCli(workspace, parsed);
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderBacklogQuery(result));
      return 0;
    }
    if (parsed.command === 'backlog-deps') {
      const result = describeBacklogDependenciesFromCli(workspace, parsed);
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderBacklogDependencies(result));
      return 0;
    }
    if (parsed.command === 'retire') {
      const result = retireBacklogFromCli(workspace, parsed);
      stdout.write(
        parsed.json
          ? `${JSON.stringify(result, null, 2)}\n`
          : `${alert(result.dryRun ? `Planned retirement of ${result.sourcePath} to ${result.graveyardPath}` : `Retired ${result.sourcePath} to ${result.graveyardPath}`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'signpost-status') {
      const result = workspace.signpostStatus();
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderSignpostStatus(result));
      return 0;
    }
    if (parsed.command === 'signpost-init') {
      const result = await workspace.initSignpost(parsed.name);
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderSignpostInit(result));
      return 0;
    }
    if (parsed.command === 'next') {
      const result = workspace.nextWork({
        lane: parsed.lane,
        legend: parsed.legend,
        priority: parsed.priority,
        keyword: parsed.keyword,
        owner: parsed.owner,
        includeBlocked: parsed.includeBlocked,
        limit: parsed.limit,
      });
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : renderNextWork(result));
      return 0;
    }
    if (parsed.command === 'spike') {
      const path = workspace.captureSpike(parsed.goal, parsed.title, parsed.constraints);
      const described = workspace.describeBacklogPath(workspace.resolveRepoPath(path));
      stdout.write(
        parsed.json
          ? `${JSON.stringify(described, null, 2)}\n`
          : `${alert(`Captured spike ${described.path}`, { variant: 'success', ctx })}\n`,
      );
      return 0;
    }
    if (parsed.command === 'pull') {
      const cycle = workspace.pullItem(parsed.item);
      for (const warning of cycle.warnings) {
        stderr.write(`${alert(warning, { variant: 'warning', ctx })}\n`);
      }
      stdout.write(`${alert(`Pulled into ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.designDoc)}\n`);
      return 0;
    }
    if (parsed.command === 'close') {
      const completedDriftCheck =
        parsed.driftCheck === undefined
          ? await promptConfirm({ title: 'Drift check complete?', defaultValue: false })
          : parsed.driftCheck === 'yes';
      if (!completedDriftCheck) {
        throw new Error('Cannot close a cycle without completing the drift check.');
      }

      // Human-in-the-loop: verify the witness before close
      const witnessVerified =
        parsed.witnessVerified === true ||
        (await promptConfirm({
          title: 'Have you verified the witness and confirmed that all human playback questions hold true?',
          defaultValue: false,
        }));
      if (!witnessVerified) {
        throw new Error('Cannot close a cycle without human witness verification. Review the witness and human playback questions first.');
      }

      // Conversational retro prompts (skip if --summary provided)
      let retroSummary = parsed.summary ?? '';
      let surprised = '';
      let differently = '';
      let followUp = '';
      if (parsed.summary === undefined) {
        retroSummary = await promptText({ title: 'What happened? (summary):', defaultValue: '' });
        surprised = await promptText({ title: 'What surprised you?', defaultValue: '' });
        differently = await promptText({ title: 'What would you do differently?', defaultValue: '' });
        followUp = await promptText({ title: 'Follow-up items (new debt, cool ideas, backlog notes):', defaultValue: '' });
      }

      const cycle = await workspace.closeCycle(parsed.cycle, completedDriftCheck, parsed.outcome, {
        summary: retroSummary.length > 0 ? retroSummary : undefined,
        surprised: surprised.length > 0 ? surprised : undefined,
        differently: differently.length > 0 ? differently : undefined,
        followUp: followUp.length > 0 ? followUp : undefined,
      });
      stdout.write(`${alert(`Closed ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.retroDoc)}\n`);
      return 0;
    }
    if (parsed.command === 'drift') {
      const report = workspace.detectDrift(parsed.cycle);
      stdout.write(report.output);
      return report.exitCode;
    }
    if (parsed.command === 'review-state') {
      const reviewStateQuery = options.reviewStateQuery ?? queryReviewState;
      const result = await reviewStateQuery({ cwd: root, pr: parsed.pr, currentBranch: parsed.currentBranch });
      stdout.write(parsed.json ? `${JSON.stringify(result, null, 2)}\n` : `${renderReviewStateText(result)}\n`);
      return 0;
    }
    if (parsed.command === 'sync') {
      if (parsed.adapter === 'github') {
        const token = workspace.config.github_token;
        const repoFull = workspace.config.github_repo;
        if (!token) {
          throw new Error('GitHub token is required for sync. Provide it via GITHUB_TOKEN or .method.json.');
        }
        if (!repoFull?.includes('/')) {
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
              stdout.write(
                `${alert(`Pulled remote changes from GitHub Issue #${issueLabel} into ${result.path}`, { variant: 'success', ctx })}\n`,
              );
            }
          }
        }
        return 0;
      }
      if (parsed.adapter === 'ship') {
        const result = await workspace.shipSync();
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
      if (parsed.adapter === 'refs') {
        const result = workspace.syncRefs();
        for (const path of result.targets) {
          stdout.write(`${alert(`Refreshed ${path}`, { variant: 'success', ctx })}\n`);
        }
        if (result.targets.length === 0) {
          stdout.write('No generated reference targets found.\n');
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
if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === realpathSync(resolve(process.argv[1]))) {
  main().then((code) => {
    process.exitCode = code;
  });
}
