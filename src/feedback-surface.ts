import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ParsedCommand } from './cli-args.js';
import type { Workspace } from './index.js';

type BacklogAddCommand = Extract<ParsedCommand, { command: 'backlog-add' }>;
type BacklogMoveCommand = Extract<ParsedCommand, { command: 'backlog-move' }>;
type BacklogEditCommand = Extract<ParsedCommand, { command: 'backlog-edit' }>;
type BacklogListCommand = Extract<ParsedCommand, { command: 'backlog-list' }>;
type BacklogDepsCommand = Extract<ParsedCommand, { command: 'backlog-deps' }>;
type RetireCommand = Extract<ParsedCommand, { command: 'retire' }>;
type InboxCommand = Extract<ParsedCommand, { command: 'inbox' }>;

export function createInboxFromCli(root: string, workspace: Workspace, parsed: InboxCommand) {
  const body = parsed.bodyFile === undefined ? parsed.idea : readFileSync(resolve(root, parsed.bodyFile), 'utf8');
  const created = workspace.captureIdeaWithMetadata(parsed.idea, parsed.legend, parsed.title, {
    body,
    source: parsed.source,
    capturedAt: parsed.capturedAt,
  });
  return workspace.describeBacklogPath(workspace.resolveRepoPath(created));
}

export function createBacklogFromCli(root: string, workspace: Workspace, parsed: BacklogAddCommand) {
  const body = parsed.bodyFile === undefined ? undefined : readFileSync(resolve(root, parsed.bodyFile), 'utf8');
  const created = workspace.createBacklogItem({
    lane: parsed.lane,
    title: parsed.title,
    legend: parsed.legend,
    body,
  });
  return workspace.describeBacklogPath(workspace.resolveRepoPath(created));
}

export function moveBacklogFromCli(workspace: Workspace, parsed: BacklogMoveCommand) {
  const sourcePath = workspace.resolveBacklogPath(parsed.item);
  const path = workspace.moveBacklogItem(sourcePath, parsed.to);
  return { sourcePath, ...workspace.describeBacklogPath(path) };
}

export function editBacklogMetadataFromCli(workspace: Workspace, parsed: BacklogEditCommand) {
  return workspace.editBacklogMetadata(parsed.item, {
    owner: parsed.owner,
    clearOwner: parsed.clearOwner,
    priority: parsed.priority,
    clearPriority: parsed.clearPriority,
    keywords: parsed.keywords,
    clearKeywords: parsed.clearKeywords,
    blockedBy: parsed.blockedBy,
    clearBlockedBy: parsed.clearBlockedBy,
    blocks: parsed.blocks,
    clearBlocks: parsed.clearBlocks,
  });
}

export function queryBacklogFromCli(workspace: Workspace, parsed: BacklogListCommand) {
  return workspace.backlogQuery({
    lane: parsed.lane,
    legend: parsed.legend,
    priority: parsed.priority,
    keyword: parsed.keyword,
    owner: parsed.owner,
    ready: parsed.ready,
    hasAcceptanceCriteria: parsed.hasAcceptanceCriteria,
    blockedBy: parsed.blockedBy,
    blocks: parsed.blocks,
    sort: parsed.sort,
    limit: parsed.limit,
  });
}

export function describeBacklogDependenciesFromCli(workspace: Workspace, parsed: BacklogDepsCommand) {
  return workspace.backlogDependencies({
    item: parsed.item,
    readyOnly: parsed.readyOnly,
    criticalPath: parsed.criticalPath,
  });
}

export function retireBacklogFromCli(workspace: Workspace, parsed: RetireCommand) {
  if (!parsed.dryRun && !parsed.yes) {
    throw new Error('`method retire` requires `--yes` unless `--dry-run` is set.');
  }
  return workspace.retireBacklogItem(parsed.item, parsed.reason, parsed.replacement, { dryRun: parsed.dryRun });
}
