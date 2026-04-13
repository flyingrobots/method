import type { Outcome } from './domain.js';
import { MethodError } from './errors.js';

export type ParsedCommand =
  | { command: 'help'; topic?: string }
  | { command: 'init'; path: string }
  | { command: 'doctor'; json?: boolean }
  | { command: 'migrate'; json?: boolean }
  | {
      command: 'inbox';
      idea: string;
      legend?: string;
      title?: string;
      bodyFile?: string;
      source?: string;
      capturedAt?: string;
      json?: boolean;
    }
  | { command: 'backlog-add'; lane: string; title: string; legend?: string; bodyFile?: string; json?: boolean }
  | { command: 'backlog-move'; item: string; to: string; json?: boolean }
  | {
      command: 'backlog-edit';
      item: string;
      owner?: string;
      clearOwner?: boolean;
      priority?: string;
      clearPriority?: boolean;
      keywords?: string[];
      clearKeywords?: boolean;
      blockedBy?: string[];
      clearBlockedBy?: boolean;
      blocks?: string[];
      clearBlocks?: boolean;
      json?: boolean;
    }
  | {
      command: 'backlog-list';
      lane?: string;
      legend?: string;
      priority?: string;
      keyword?: string;
      owner?: string;
      ready?: boolean;
      hasAcceptanceCriteria?: boolean;
      blockedBy?: string;
      blocks?: string;
      sort?: string;
      limit: number;
      json?: boolean;
    }
  | { command: 'backlog-deps'; item?: string; readyOnly?: boolean; criticalPath?: boolean; json?: boolean }
  | { command: 'retire'; item: string; reason: string; replacement?: string; dryRun?: boolean; yes?: boolean; json?: boolean }
  | { command: 'signpost-status'; json?: boolean }
  | { command: 'signpost-init'; name: string; json?: boolean }
  | { command: 'repair'; mode: 'plan' | 'apply'; json?: boolean }
  | {
      command: 'next';
      lane?: string;
      legend?: string;
      priority?: string;
      keyword?: string;
      owner?: string;
      includeBlocked?: boolean;
      limit: number;
      json?: boolean;
    }
  | { command: 'pull'; item: string }
  | { command: 'close'; cycle?: string; driftCheck?: 'yes' | 'no'; outcome: Outcome }
  | { command: 'drift'; cycle?: string }
  | { command: 'review-state'; pr?: number; currentBranch?: boolean; json?: boolean }
  | { command: 'status' }
  | { command: 'mcp' }
  | { command: 'sync'; adapter: 'github'; push?: boolean; pull?: boolean }
  | { command: 'sync'; adapter: 'ship' }
  | { command: 'sync'; adapter: 'refs' }
  | { command: 'spike'; goal: string; title?: string; constraints?: string; json?: boolean };

export function parseCliArgs(argv: readonly string[]): ParsedCommand {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h') {
    return { command: 'help' };
  }

  if (command === 'help') {
    if (rest.length > 1) {
      throw new MethodError('Usage: method help [command]');
    }
    return { command: 'help', topic: rest[0] };
  }

  if (rest.includes('--help') || rest.includes('-h')) {
    return { command: 'help', topic: command };
  }

  switch (command) {
    case 'init':
      return parseInitArgs(rest);
    case 'doctor':
      return parseDoctorArgs(rest);
    case 'migrate':
      return parseMigrateArgs(rest);
    case 'inbox':
      return parseInboxArgs(rest);
    case 'backlog':
      return parseBacklogArgs(rest);
    case 'retire':
      return parseRetireArgs(rest);
    case 'signpost':
      return parseSignpostArgs(rest);
    case 'spike':
      return parseSpikeArgs(rest);
    case 'feedback':
      throw new MethodError(
        '`feedback` was removed. Capture outside-in critique in `method inbox` with `--source`, `--captured-at`, and optional `--body-file`.',
      );
    case 'repair':
      return parseRepairArgs(rest);
    case 'next':
      return parseNextArgs(rest);
    case 'pull':
      return parsePullArgs(rest);
    case 'close':
      return parseCloseArgs(rest);
    case 'drift':
      return parseDriftArgs(rest);
    case 'review-state':
      return parseReviewStateArgs(rest);
    case 'status':
      if (rest.length > 0) {
        throw new MethodError('`status` does not take any arguments.');
      }
      return { command: 'status' };
    case 'mcp':
      if (rest.length > 0) {
        throw new MethodError('`mcp` does not take any arguments.');
      }
      return { command: 'mcp' };
    case 'sync':
      if (rest[0] === 'github') {
        const flags = rest.slice(1);
        const allowedFlags = ['--push', '--pull'];
        for (const flag of flags) {
          if (!allowedFlags.includes(flag)) {
            throw new MethodError(`Unknown sync github option: ${flag}\n\n${usage('sync')}`);
          }
        }
        const push = flags.includes('--push');
        const pull = flags.includes('--pull');
        const finalPush = push || (!push && !pull);
        return { command: 'sync', adapter: 'github', push: finalPush, pull };
      }
      if (rest[0] === 'ship') {
        if (rest.length > 1) {
          throw new MethodError(`\`sync ship\` does not take any arguments.\n\n${usage('sync')}`);
        }
        return { command: 'sync', adapter: 'ship' };
      }
      if (rest[0] === 'refs') {
        if (rest.length > 1) {
          throw new MethodError(`\`sync refs\` does not take any arguments.\n\n${usage('sync')}`);
        }
        return { command: 'sync', adapter: 'refs' };
      }
      throw new MethodError(`Usage: method sync github|ship|refs\n\n${usage('sync')}`);
    default:
      throw new MethodError(`Unknown command: ${command}`);
  }
}

export const CLI_TOPICS = [
  'init',
  'doctor',
  'migrate',
  'inbox',
  'backlog-add',
  'backlog-move',
  'backlog-edit',
  'backlog-list',
  'backlog-deps',
  'retire',
  'signpost-status',
  'signpost-init',
  'repair',
  'next',
  'pull',
  'close',
  'status',
  'drift',
  'review-state',
  'mcp',
  'sync',
] as const;

export function usage(topic?: string): string {
  if (topic === 'init') {
    return 'Usage: method init [path]\n\nScaffold a METHOD workspace in the given directory.';
  }
  if (topic === 'doctor') {
    return ['Usage: method doctor [--json]', '', 'Inspect METHOD workspace health without mutating it.'].join('\n');
  }
  if (topic === 'migrate') {
    return ['Usage: method migrate [--json]', '', 'Run doctor, apply the bounded repair set, then re-check the workspace.'].join('\n');
  }
  if (topic === 'inbox') {
    return 'Usage: method inbox <idea> [--legend CODE] [--title TITLE] [--body-file PATH] [--source TEXT] [--captured-at YYYY-MM-DD] [--json]\n\nCapture raw input in docs/method/backlog/inbox/.';
  }
  if (topic === 'backlog') {
    return [
      'Usage:',
      '  method backlog add --lane LANE --title TITLE [--legend CODE] [--body-file PATH] [--json]',
      '  method backlog move <item> --to LANE [--json]',
      '  method backlog edit <item> [--owner TEXT|--clear-owner] [--priority VALUE|--clear-priority] [--keyword VALUE ...|--clear-keywords] [--blocked-by REF ...|--clear-blocked-by] [--blocks REF ...|--clear-blocks] [--json]',
      '  method backlog list [--lane LANE] [--legend CODE] [--priority VALUE] [--keyword VALUE] [--owner VALUE] [--ready|--blocked] [--has-acceptance-criteria|--missing-acceptance-criteria] [--blocked-by REF] [--blocks REF] [--sort lane|priority|path] [--limit N] [--json]',
      '  method backlog deps [item] [--ready] [--critical-path] [--json]',
      '',
      'Create, move, or inspect backlog notes without manual filesystem edits.',
    ].join('\n');
  }
  if (topic === 'backlog-add') {
    return [
      'Usage: method backlog add --lane LANE --title TITLE [--legend CODE] [--body-file PATH] [--json]',
      '',
      'Create a shaped backlog note directly in the requested backlog lane.',
    ].join('\n');
  }
  if (topic === 'backlog-move') {
    return ['Usage: method backlog move <item> --to LANE [--json]', '', 'Move a live backlog note into another backlog lane.'].join('\n');
  }
  if (topic === 'backlog-edit') {
    return [
      'Usage: method backlog edit <item> [--owner TEXT|--clear-owner] [--priority VALUE|--clear-priority] [--keyword VALUE ...|--clear-keywords] [--blocked-by REF ...|--clear-blocked-by] [--blocks REF ...|--clear-blocks] [--json]',
      '',
      'Update explicit schema-backed backlog metadata on a live backlog note. Repeat `--keyword`, `--blocked-by`, or `--blocks` to replace list fields.',
    ].join('\n');
  }
  if (topic === 'backlog-list') {
    return [
      'Usage: method backlog list [--lane LANE] [--legend CODE] [--priority VALUE] [--keyword VALUE] [--owner VALUE] [--ready|--blocked] [--has-acceptance-criteria|--missing-acceptance-criteria] [--blocked-by REF] [--blocks REF] [--sort lane|priority|path] [--limit N] [--json]',
      '',
      'Return structured backlog items and explicit frontmatter metadata such as owner, priority, keywords, blocks, blocked_by, readiness, and acceptance criteria presence.',
    ].join('\n');
  }
  if (topic === 'backlog-deps') {
    return [
      'Usage: method backlog deps [item] [--ready] [--critical-path] [--json]',
      '',
      'Inspect live backlog dependencies from `blocked_by` / `blocks` frontmatter.',
      'Use `--ready` to show unblocked work, or pass `<item> --critical-path` to show the longest blocker chain to one item.',
    ].join('\n');
  }
  if (topic === 'retire') {
    return [
      'Usage: method retire <item> --reason TEXT [--replacement PATH] [--dry-run] [--yes] [--json]',
      '',
      'Retire a live backlog note into the graveyard with an explicit disposition record.',
    ].join('\n');
  }
  if (topic === 'signpost') {
    return [
      'Usage:',
      '  method signpost status [--json]',
      '  method signpost init <name> [--json]',
      '',
      'Inspect expected repo signposts or initialize a narrowly supported missing signpost.',
    ].join('\n');
  }
  if (topic === 'signpost-status') {
    return [
      'Usage: method signpost status [--json]',
      '',
      'Report which expected repo signposts exist, which are missing, and which can be initialized by helper commands.',
    ].join('\n');
  }
  if (topic === 'signpost-init') {
    return [
      'Usage: method signpost init <name> [--json]',
      '',
      'Initialize a narrowly supported missing canonical signpost such as BEARING or MCP.',
    ].join('\n');
  }
  if (topic === 'repair') {
    return [
      'Usage: method repair (--plan | --apply) [--json]',
      '',
      'Plan or apply bounded doctor-guided repairs for missing directories, scaffold files, and frontmatter stubs.',
    ].join('\n');
  }
  if (topic === 'next') {
    return [
      'Usage: method next [--lane LANE] [--legend CODE] [--priority VALUE] [--keyword VALUE] [--owner VALUE] [--include-blocked] [--limit N] [--json]',
      '',
      'Return a bounded advisory menu of sensible next backlog items using lane order, declared frontmatter, dependency readiness, and literal BEARING mentions.',
    ].join('\n');
  }
  if (topic === 'spike') {
    return 'Usage: method spike <goal> [--title <title>] [--constraints <text>] [--json]\n\nCapture a behavior spike into the inbox with SPIKE legend and structured scaffolding.';
  }
  if (topic === 'pull') {
    return 'Usage: method pull <item>\n\nPromote a backlog item into a new cycle packet. Release-tagged work scaffolds under docs/releases/<version>/.';
  }
  if (topic === 'close') {
    return 'Usage: method close [cycle] [--drift-check yes|no] --outcome hill-met|partial|not-met\n\nClose an active cycle into its retro packet. `--outcome` is required.';
  }
  if (topic === 'status') {
    return 'Usage: method status\n\nShow backlog lanes, active cycles, and legend health.';
  }
  if (topic === 'drift') {
    return [
      'Usage: method drift [cycle]',
      '',
      'Check active cycle playback questions against test descriptions in tests/.',
      'First cut scans tests/**/*.test.* and tests/**/*.spec.* only.',
    ].join('\n');
  }

  if (topic === 'review-state') {
    return [
      'Usage: method review-state [--pr NUMBER | --current-branch] [--json]',
      '',
      'Query PR review / merge-readiness state for the current branch or an explicit PR.',
      'Defaults to --current-branch when no selector flag is provided.',
    ].join('\n');
  }

  if (topic === 'mcp') {
    return 'Usage: method mcp\n\nStart an MCP (Model Context Protocol) server on stdio.';
  }

  if (topic === 'sync') {
    return [
      'Usage: method sync github|ship|refs [options]',
      '',
      'GitHub Options:',
      '  --push                      Update GitHub issues with local changes (default).',
      '  --pull                      Update local backlog with GitHub changes (labels, comments, status).',
      '',
      'Perform Ship Sync, refresh generated reference docs, or synchronize the backlog with GitHub Issues.',
    ].join('\n');
  }

  return [
    'Usage: method <command> [options]',
    '',
    'Commands:',
    '  init [path]                 Scaffold a METHOD workspace.',
    '  doctor [--json]             Inspect workspace health and suggest fixes.',
    '  migrate [--json]            Doctor, apply bounded repairs, then re-check.',
    '  inbox <idea>                Capture raw input in inbox/.',
    '  backlog add                 Create a shaped backlog note in a chosen lane.',
    '  backlog move                Move a backlog note into another lane.',
    '  backlog edit                Update schema-backed backlog metadata.',
    '  backlog list                Query backlog items by lane or frontmatter metadata.',
    '  backlog deps                Inspect backlog dependency edges and ready work.',
    '  retire <item>               Retire a live backlog note into graveyard/.',
    '  signpost status             Report expected signposts and gaps.',
    '  signpost init <name>        Initialize a supported missing signpost.',
    '  repair (--plan|--apply)     Plan or apply safe doctor-guided repairs.',
    '  next [--limit N]            Recommend a bounded next-work menu.',
    '  pull <item>                 Promote a backlog item into a cycle.',
    '  close [cycle]               Write a retro for an active cycle.',
    '  drift [cycle]               Check active cycle playback questions against tests.',
    '  review-state                Query PR review / merge-readiness state.',
    '  status                      Show backlog, active cycles, and legend health.',
    '  mcp                         Start the MCP server over stdio.',
    '  sync github [--push|--pull] Sync backlog with GitHub Issues.',
    '  sync ship                   Perform Ship Sync.',
    '  sync refs                   Refresh generated reference docs.',
    '',
    'Run `method help <command>` for command-specific usage.',
  ].join('\n');
}

function parseInitArgs(args: readonly string[]): ParsedCommand {
  if (args.length > 1) {
    throw new MethodError('Usage: method init [path]');
  }
  return { command: 'init', path: args[0] ?? '.' };
}

function parseDoctorArgs(args: readonly string[]): ParsedCommand {
  let json = false;

  for (const value of args) {
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('doctor')}`);
  }

  return { command: 'doctor', json };
}

function parseMigrateArgs(args: readonly string[]): ParsedCommand {
  let json = false;

  for (const value of args) {
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('migrate')}`);
  }

  return { command: 'migrate', json };
}

function parseInboxArgs(args: readonly string[]): ParsedCommand {
  let legend: string | undefined;
  let title: string | undefined;
  let bodyFile: string | undefined;
  let source: string | undefined;
  let capturedAt: string | undefined;
  let json = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--title') {
      title = requireOptionValue(args, index, '--title');
      index += 1;
      continue;
    }
    if (value.startsWith('--title=')) {
      title = value.slice('--title='.length);
      continue;
    }
    if (value === '--body-file') {
      bodyFile = requireOptionValue(args, index, '--body-file');
      index += 1;
      continue;
    }
    if (value.startsWith('--body-file=')) {
      bodyFile = value.slice('--body-file='.length);
      continue;
    }
    if (value === '--source') {
      source = requireOptionValue(args, index, '--source');
      index += 1;
      continue;
    }
    if (value.startsWith('--source=')) {
      source = value.slice('--source='.length);
      continue;
    }
    if (value === '--captured-at') {
      capturedAt = requireOptionValue(args, index, '--captured-at');
      index += 1;
      continue;
    }
    if (value.startsWith('--captured-at=')) {
      capturedAt = value.slice('--captured-at='.length);
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1) {
    throw new MethodError(usage('inbox'));
  }

  return { command: 'inbox', idea: positionals[0], legend, title, bodyFile, source, capturedAt, json };
}

function parseBacklogArgs(args: readonly string[]): ParsedCommand {
  if (args[0] === 'move') {
    return parseBacklogMoveArgs(args.slice(1));
  }
  if (args[0] === 'edit') {
    return parseBacklogEditArgs(args.slice(1));
  }
  if (args[0] === 'list') {
    return parseBacklogListArgs(args.slice(1));
  }
  if (args[0] === 'deps') {
    return parseBacklogDepsArgs(args.slice(1));
  }
  if (args[0] !== 'add') {
    throw new MethodError(usage('backlog'));
  }

  let lane: string | undefined;
  let title: string | undefined;
  let legend: string | undefined;
  let bodyFile: string | undefined;
  let json = false;

  for (let index = 1; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--lane') {
      lane = requireOptionValue(args, index, '--lane');
      index += 1;
      continue;
    }
    if (value.startsWith('--lane=')) {
      lane = value.slice('--lane='.length);
      continue;
    }
    if (value === '--title') {
      title = requireOptionValue(args, index, '--title');
      index += 1;
      continue;
    }
    if (value.startsWith('--title=')) {
      title = value.slice('--title='.length);
      continue;
    }
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--body-file') {
      bodyFile = requireOptionValue(args, index, '--body-file');
      index += 1;
      continue;
    }
    if (value.startsWith('--body-file=')) {
      bodyFile = value.slice('--body-file='.length);
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('backlog')}`);
  }

  if (lane === undefined || title === undefined) {
    throw new MethodError(usage('backlog'));
  }

  return { command: 'backlog-add', lane, title, legend, bodyFile, json };
}

function parseBacklogMoveArgs(args: readonly string[]): ParsedCommand {
  let to: string | undefined;
  let json = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--to') {
      to = requireOptionValue(args, index, '--to');
      index += 1;
      continue;
    }
    if (value.startsWith('--to=')) {
      to = value.slice('--to='.length);
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}\n\n${usage('backlog-move')}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1 || to === undefined) {
    throw new MethodError(usage('backlog-move'));
  }

  return { command: 'backlog-move', item: positionals[0], to, json };
}

function parseBacklogEditArgs(args: readonly string[]): ParsedCommand {
  let owner: string | undefined;
  let clearOwner = false;
  let priority: string | undefined;
  let clearPriority = false;
  const keywords: string[] = [];
  let clearKeywords = false;
  const blockedBy: string[] = [];
  let clearBlockedBy = false;
  const blocks: string[] = [];
  let clearBlocks = false;
  let json = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--owner') {
      owner = requireOptionValue(args, index, '--owner');
      index += 1;
      continue;
    }
    if (value.startsWith('--owner=')) {
      owner = value.slice('--owner='.length);
      continue;
    }
    if (value === '--clear-owner') {
      clearOwner = true;
      continue;
    }
    if (value === '--priority') {
      priority = requireOptionValue(args, index, '--priority');
      index += 1;
      continue;
    }
    if (value.startsWith('--priority=')) {
      priority = value.slice('--priority='.length);
      continue;
    }
    if (value === '--clear-priority') {
      clearPriority = true;
      continue;
    }
    if (value === '--keyword') {
      keywords.push(requireOptionValue(args, index, '--keyword'));
      index += 1;
      continue;
    }
    if (value.startsWith('--keyword=')) {
      keywords.push(value.slice('--keyword='.length));
      continue;
    }
    if (value === '--clear-keywords') {
      clearKeywords = true;
      continue;
    }
    if (value === '--blocked-by') {
      blockedBy.push(requireOptionValue(args, index, '--blocked-by'));
      index += 1;
      continue;
    }
    if (value.startsWith('--blocked-by=')) {
      blockedBy.push(value.slice('--blocked-by='.length));
      continue;
    }
    if (value === '--clear-blocked-by') {
      clearBlockedBy = true;
      continue;
    }
    if (value === '--blocks') {
      blocks.push(requireOptionValue(args, index, '--blocks'));
      index += 1;
      continue;
    }
    if (value.startsWith('--blocks=')) {
      blocks.push(value.slice('--blocks='.length));
      continue;
    }
    if (value === '--clear-blocks') {
      clearBlocks = true;
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}\n\n${usage('backlog-edit')}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1) {
    throw new MethodError(usage('backlog-edit'));
  }

  return {
    command: 'backlog-edit',
    item: positionals[0],
    owner,
    clearOwner,
    priority,
    clearPriority,
    keywords: keywords.length === 0 ? undefined : keywords,
    clearKeywords,
    blockedBy: blockedBy.length === 0 ? undefined : blockedBy,
    clearBlockedBy,
    blocks: blocks.length === 0 ? undefined : blocks,
    clearBlocks,
    json,
  };
}

function parseBacklogListArgs(args: readonly string[]): ParsedCommand {
  let lane: string | undefined;
  let legend: string | undefined;
  let priority: string | undefined;
  let keyword: string | undefined;
  let owner: string | undefined;
  let ready: boolean | undefined;
  let hasAcceptanceCriteria: boolean | undefined;
  let blockedBy: string | undefined;
  let blocks: string | undefined;
  let sort: string | undefined;
  let limit = 50;
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--lane') {
      lane = requireOptionValue(args, index, '--lane');
      index += 1;
      continue;
    }
    if (value.startsWith('--lane=')) {
      lane = value.slice('--lane='.length);
      continue;
    }
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--priority') {
      priority = requireOptionValue(args, index, '--priority');
      index += 1;
      continue;
    }
    if (value.startsWith('--priority=')) {
      priority = value.slice('--priority='.length);
      continue;
    }
    if (value === '--keyword') {
      keyword = requireOptionValue(args, index, '--keyword');
      index += 1;
      continue;
    }
    if (value.startsWith('--keyword=')) {
      keyword = value.slice('--keyword='.length);
      continue;
    }
    if (value === '--owner') {
      owner = requireOptionValue(args, index, '--owner');
      index += 1;
      continue;
    }
    if (value.startsWith('--owner=')) {
      owner = value.slice('--owner='.length);
      continue;
    }
    if (value === '--ready') {
      if (ready === false) {
        throw new MethodError(`Cannot combine \`--ready\` with \`--blocked\`.\n\n${usage('backlog-list')}`);
      }
      ready = true;
      continue;
    }
    if (value === '--blocked') {
      if (ready === true) {
        throw new MethodError(`Cannot combine \`--ready\` with \`--blocked\`.\n\n${usage('backlog-list')}`);
      }
      ready = false;
      continue;
    }
    if (value === '--has-acceptance-criteria') {
      if (hasAcceptanceCriteria === false) {
        throw new MethodError(
          `Cannot combine \`--has-acceptance-criteria\` with \`--missing-acceptance-criteria\`.\n\n${usage('backlog-list')}`,
        );
      }
      hasAcceptanceCriteria = true;
      continue;
    }
    if (value === '--missing-acceptance-criteria') {
      if (hasAcceptanceCriteria === true) {
        throw new MethodError(
          `Cannot combine \`--has-acceptance-criteria\` with \`--missing-acceptance-criteria\`.\n\n${usage('backlog-list')}`,
        );
      }
      hasAcceptanceCriteria = false;
      continue;
    }
    if (value === '--blocked-by') {
      blockedBy = requireOptionValue(args, index, '--blocked-by');
      index += 1;
      continue;
    }
    if (value.startsWith('--blocked-by=')) {
      blockedBy = value.slice('--blocked-by='.length);
      continue;
    }
    if (value === '--blocks') {
      blocks = requireOptionValue(args, index, '--blocks');
      index += 1;
      continue;
    }
    if (value.startsWith('--blocks=')) {
      blocks = value.slice('--blocks='.length);
      continue;
    }
    if (value === '--sort') {
      sort = requireOptionValue(args, index, '--sort');
      index += 1;
      continue;
    }
    if (value.startsWith('--sort=')) {
      sort = value.slice('--sort='.length);
      continue;
    }
    if (value === '--limit') {
      limit = parseBacklogQueryLimit(requireOptionValue(args, index, '--limit'));
      index += 1;
      continue;
    }
    if (value.startsWith('--limit=')) {
      limit = parseBacklogQueryLimit(value.slice('--limit='.length));
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('backlog-list')}`);
  }

  return {
    command: 'backlog-list',
    lane,
    legend,
    priority,
    keyword,
    owner,
    ready,
    hasAcceptanceCriteria,
    blockedBy,
    blocks,
    sort,
    limit,
    json,
  };
}

function parseBacklogDepsArgs(args: readonly string[]): ParsedCommand {
  let readyOnly = false;
  let criticalPath = false;
  let json = false;
  const positionals: string[] = [];

  for (const value of args) {
    if (value === '--ready') {
      readyOnly = true;
      continue;
    }
    if (value === '--critical-path') {
      criticalPath = true;
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}\n\n${usage('backlog-deps')}`);
    }
    positionals.push(value);
  }

  if (positionals.length > 1) {
    throw new MethodError(usage('backlog-deps'));
  }
  if (readyOnly && (criticalPath || positionals.length > 0)) {
    throw new MethodError(`\`method backlog deps --ready\` does not accept an item or \`--critical-path\`.\n\n${usage('backlog-deps')}`);
  }
  if (criticalPath && positionals.length !== 1) {
    throw new MethodError(`\`--critical-path\` requires exactly one backlog item.\n\n${usage('backlog-deps')}`);
  }

  return {
    command: 'backlog-deps',
    item: positionals[0],
    readyOnly,
    criticalPath,
    json,
  };
}

function parseRetireArgs(args: readonly string[]): ParsedCommand {
  let reason: string | undefined;
  let replacement: string | undefined;
  let dryRun = false;
  let yes = false;
  let json = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--reason') {
      reason = requireOptionValue(args, index, '--reason');
      index += 1;
      continue;
    }
    if (value.startsWith('--reason=')) {
      reason = value.slice('--reason='.length);
      continue;
    }
    if (value === '--replacement') {
      replacement = requireOptionValue(args, index, '--replacement');
      index += 1;
      continue;
    }
    if (value.startsWith('--replacement=')) {
      replacement = value.slice('--replacement='.length);
      continue;
    }
    if (value === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (value === '--yes') {
      yes = true;
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}\n\n${usage('retire')}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1 || reason === undefined) {
    throw new MethodError(usage('retire'));
  }

  return { command: 'retire', item: positionals[0], reason, replacement, dryRun, yes, json };
}

function parseSignpostArgs(args: readonly string[]): ParsedCommand {
  if (args[0] === 'status') {
    let json = false;
    for (const value of args.slice(1)) {
      if (value === '--json') {
        json = true;
        continue;
      }
      throw new MethodError(`Unknown option: ${value}\n\n${usage('signpost-status')}`);
    }
    return { command: 'signpost-status', json };
  }

  if (args[0] === 'init') {
    let json = false;
    const positionals: string[] = [];
    for (const value of args.slice(1)) {
      if (value === '--json') {
        json = true;
        continue;
      }
      if (value.startsWith('-')) {
        throw new MethodError(`Unknown option: ${value}\n\n${usage('signpost-init')}`);
      }
      positionals.push(value);
    }
    if (positionals.length !== 1) {
      throw new MethodError(usage('signpost-init'));
    }
    return { command: 'signpost-init', name: positionals[0], json };
  }

  throw new MethodError(usage('signpost'));
}

function parseRepairArgs(args: readonly string[]): ParsedCommand {
  let mode: 'plan' | 'apply' | undefined;
  let json = false;

  for (const value of args) {
    if (value === '--plan') {
      if (mode !== undefined) {
        throw new MethodError(usage('repair'));
      }
      mode = 'plan';
      continue;
    }
    if (value === '--apply') {
      if (mode !== undefined) {
        throw new MethodError(usage('repair'));
      }
      mode = 'apply';
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('repair')}`);
  }

  if (mode === undefined) {
    throw new MethodError(usage('repair'));
  }

  return { command: 'repair', mode, json };
}

function parseNextArgs(args: readonly string[]): ParsedCommand {
  let lane: string | undefined;
  let legend: string | undefined;
  let priority: string | undefined;
  let keyword: string | undefined;
  let owner: string | undefined;
  let includeBlocked = false;
  let limit = 3;
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--lane') {
      lane = requireOptionValue(args, index, '--lane');
      index += 1;
      continue;
    }
    if (value.startsWith('--lane=')) {
      lane = value.slice('--lane='.length);
      continue;
    }
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--priority') {
      priority = requireOptionValue(args, index, '--priority');
      index += 1;
      continue;
    }
    if (value.startsWith('--priority=')) {
      priority = value.slice('--priority='.length);
      continue;
    }
    if (value === '--keyword') {
      keyword = requireOptionValue(args, index, '--keyword');
      index += 1;
      continue;
    }
    if (value.startsWith('--keyword=')) {
      keyword = value.slice('--keyword='.length);
      continue;
    }
    if (value === '--owner') {
      owner = requireOptionValue(args, index, '--owner');
      index += 1;
      continue;
    }
    if (value.startsWith('--owner=')) {
      owner = value.slice('--owner='.length);
      continue;
    }
    if (value === '--include-blocked') {
      includeBlocked = true;
      continue;
    }
    if (value === '--limit') {
      limit = parseNextLimit(requireOptionValue(args, index, '--limit'));
      index += 1;
      continue;
    }
    if (value.startsWith('--limit=')) {
      limit = parseNextLimit(value.slice('--limit='.length));
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    throw new MethodError(`Unknown option: ${value}\n\n${usage('next')}`);
  }

  return { command: 'next', lane, legend, priority, keyword, owner, includeBlocked, limit, json };
}

function parsePullArgs(args: readonly string[]): ParsedCommand {
  if (args.length !== 1) {
    throw new MethodError('Usage: method pull <item>');
  }
  return { command: 'pull', item: args[0] };
}

function parseCloseArgs(args: readonly string[]): ParsedCommand {
  let cycle: string | undefined;
  let driftCheck: 'yes' | 'no' | undefined;
  let outcome: Outcome | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--drift-check') {
      driftCheck = parseDriftCheckValue(requireOptionValue(args, index, '--drift-check'));
      index += 1;
      continue;
    }
    if (value.startsWith('--drift-check=')) {
      driftCheck = parseDriftCheckValue(value.slice('--drift-check='.length));
      continue;
    }
    if (value === '--outcome') {
      outcome = parseOutcomeValue(requireOptionValue(args, index, '--outcome'));
      index += 1;
      continue;
    }
    if (value.startsWith('--outcome=')) {
      outcome = parseOutcomeValue(value.slice('--outcome='.length));
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    if (cycle !== undefined) {
      throw new MethodError(usage('close'));
    }
    cycle = value;
  }

  if (outcome === undefined) {
    throw new MethodError(usage('close'));
  }

  return { command: 'close', cycle, driftCheck, outcome };
}

function parseDriftArgs(args: readonly string[]): ParsedCommand {
  if (args.length > 1) {
    throw new MethodError('Usage: method drift [cycle]');
  }
  return { command: 'drift', cycle: args[0] };
}

function parseReviewStateArgs(args: readonly string[]): ParsedCommand {
  let pr: number | undefined;
  let currentBranch: boolean | undefined;
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value === '--current-branch') {
      currentBranch = true;
      continue;
    }
    if (value === '--pr') {
      const rawValue = requireOptionValue(args, index, '--pr');
      pr = parsePositiveInteger(rawValue, '--pr');
      index += 1;
      continue;
    }
    if (value.startsWith('--pr=')) {
      pr = parsePositiveInteger(value.slice('--pr='.length), '--pr');
      continue;
    }
    throw new MethodError(`Unknown option: ${value}`);
  }

  if (pr !== undefined && currentBranch) {
    throw new MethodError('`review-state` accepts either `--pr` or `--current-branch`, not both.');
  }

  return { command: 'review-state', pr, currentBranch, json };
}

function requireOptionValue(args: readonly string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new MethodError(`${optionName} requires a value.`);
  }
  return value;
}

function parseDriftCheckValue(value: string): 'yes' | 'no' {
  if (value === 'yes' || value === 'no') {
    return value;
  }
  throw new MethodError('`--drift-check` must be `yes` or `no`.');
}

function parseOutcomeValue(value: string): Outcome {
  if (value === 'hill-met' || value === 'partial' || value === 'not-met') {
    return value;
  }
  throw new MethodError('`--outcome` must be `hill-met`, `partial`, or `not-met`.');
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new MethodError(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

function parseBacklogQueryLimit(value: string): number {
  const parsed = parsePositiveInteger(value, '--limit');
  if (parsed > 100) {
    throw new MethodError('`--limit` must be between 1 and 100.');
  }
  return parsed;
}

function parseNextLimit(value: string): number {
  const parsed = parsePositiveInteger(value, '--limit');
  if (parsed > 10) {
    throw new MethodError('`--limit` must be between 1 and 10.');
  }
  return parsed;
}

function parseSpikeArgs(args: readonly string[]): ParsedCommand {
  let title: string | undefined;
  let constraints: string | undefined;
  let json = false;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--title') {
      title = requireOptionValue(args, index, '--title');
      index += 1;
      continue;
    }
    if (value?.startsWith('--title=')) {
      title = value.slice('--title='.length);
      continue;
    }
    if (value === '--constraints') {
      constraints = requireOptionValue(args, index, '--constraints');
      index += 1;
      continue;
    }
    if (value?.startsWith('--constraints=')) {
      constraints = value.slice('--constraints='.length);
      continue;
    }
    if (value === '--json') {
      json = true;
      continue;
    }
    if (value !== undefined) {
      positionals.push(value);
    }
  }

  const goal = positionals.join(' ').trim();
  if (goal.length === 0) {
    throw new MethodError('Usage: method spike <goal> [--title <title>] [--constraints <text>] [--json]');
  }

  return { command: 'spike', goal, title, constraints, json };
}
